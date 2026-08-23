import "server-only";

import type Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";
import { listJobsInRange } from "@/server/data/jobs";
import { lineItemsTotalCents } from "@/server/data/line-items";
import { dollarsToCents, formatCents, formatDateTime } from "@/lib/format";
import { startOfLocalDay, endOfLocalDay, addDays } from "@/lib/calendar";
import { ensureRecurringJobsGenerated } from "@/server/data/recurring";
import type { RecurrenceUnit, TaskPriority } from "@prisma/client";

// ---------------------------------------------------------------------------
// Tool schemas — the only surface Ava can act through. Every read tool below
// is scoped to the logged-in business via requireSession(); write tools are
// never executed directly from a tool call — see chat.ts, which pauses for
// user confirmation before calling executeWriteTool().
// ---------------------------------------------------------------------------

const WRITE_TOOL_NAMES = ["createTask", "createJob", "createRecurringJob"] as const;

export type ReadToolName =
  | "getTodaysJobs"
  | "getUpcomingJobs"
  | "getOutstandingInvoices"
  | "getPendingQuotes"
  | "getCustomer"
  | "getLapsedCustomers"
  | "getOpenTasks";
export type WriteToolName = (typeof WRITE_TOOL_NAMES)[number];

export function isWriteTool(name: string): name is WriteToolName {
  return (WRITE_TOOL_NAMES as readonly string[]).includes(name);
}

export const AVA_TOOLS: Anthropic.Tool[] = [
  {
    name: "getTodaysJobs",
    description: "Get every job scheduled for today.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "getUpcomingJobs",
    description: "Get jobs scheduled over the next N days (not including today).",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "integer", description: "How many days ahead to look. Defaults to 7." },
      },
    },
  },
  {
    name: "getOutstandingInvoices",
    description: "Get invoices that have been sent but not yet paid (includes overdue ones).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "getPendingQuotes",
    description: "Get quotes that are still a draft or have been sent but not yet accepted/declined.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "getCustomer",
    description:
      "Look up a customer by name (partial match is fine) and get their contact details, notes, recent jobs, recurring services, and job history summary.",
    input_schema: {
      type: "object",
      properties: { name: { type: "string", description: "The customer's name, or part of it." } },
      required: ["name"],
    },
  },
  {
    name: "getLapsedCustomers",
    description:
      "Get customers who have had a completed job before, but nothing in the last N days and nothing upcoming — useful for 'who haven't I serviced in a while' or filling a quiet week.",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "integer", description: "Consider a customer lapsed after this many days. Defaults to 45." },
      },
    },
  },
  {
    name: "getOpenTasks",
    description: "Get open (not-done) tasks, most urgent first.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "createTask",
    description:
      "Propose creating a task/to-do. This does not create it immediately — the user will be shown a confirmation before it's saved.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short description of the task." },
        dueDate: { type: "string", description: "Due date as YYYY-MM-DD, if any." },
        priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
        customerName: { type: "string", description: "Name of the related customer, if any." },
      },
      required: ["title"],
    },
  },
  {
    name: "createJob",
    description:
      "Propose scheduling a one-off job for a customer on a specific date/time. This does not create it immediately — the user will be shown a confirmation before it's saved.",
    input_schema: {
      type: "object",
      properties: {
        customerName: { type: "string", description: "Name of the customer this job is for." },
        description: { type: "string", description: "What the job is, e.g. 'Lawn mowing & edges'." },
        date: { type: "string", description: "Date as YYYY-MM-DD." },
        time: { type: "string", description: "Start time as HH:MM (24h). Defaults to 09:00." },
        durationMin: { type: "integer", description: "Estimated duration in minutes. Defaults to 60." },
        price: { type: "number", description: "Price in dollars, if known." },
      },
      required: ["customerName", "description", "date"],
    },
  },
  {
    name: "createRecurringJob",
    description:
      "Propose setting up a recurring job for a customer (e.g. 'lawn mowing every 3 weeks'). This does not create it immediately — the user will be shown a confirmation before it's saved. Once confirmed, the app automatically keeps generating future visits.",
    input_schema: {
      type: "object",
      properties: {
        customerName: { type: "string", description: "Name of the customer this recurring job is for." },
        description: { type: "string", description: "What the job is." },
        intervalValue: { type: "integer", description: "How often it repeats, e.g. 3." },
        intervalUnit: { type: "string", enum: ["DAY", "WEEK", "MONTH"] },
        startDate: { type: "string", description: "First occurrence date as YYYY-MM-DD." },
      },
      required: ["customerName", "description", "intervalValue", "intervalUnit", "startDate"],
    },
  },
];

// ---------------------------------------------------------------------------
// Customer name resolution — shared by every tool that takes a customerName.
// ---------------------------------------------------------------------------

type ResolvedCustomer = { ok: true; id: string; name: string; address: string | null };
type ResolveFailure = { ok: false; message: string };

async function resolveCustomerByName(businessId: string, name: string): Promise<ResolvedCustomer | ResolveFailure> {
  const matches = await prisma.customer.findMany({
    where: { businessId, name: { contains: name, mode: "insensitive" } },
    select: { id: true, name: true, address: true },
    take: 6,
  });
  if (matches.length === 0) {
    return { ok: false, message: `No customer found matching "${name}".` };
  }
  if (matches.length > 1) {
    return {
      ok: false,
      message: `More than one customer matches "${name}": ${matches.map((m) => m.name).join(", ")}. Ask which one.`,
    };
  }
  return { ok: true, id: matches[0].id, name: matches[0].name, address: matches[0].address };
}

// ---------------------------------------------------------------------------
// Read tools
// ---------------------------------------------------------------------------

function summarizeJob(job: {
  description: string;
  scheduledAt: Date;
  estimatedDurationMin: number;
  status: string;
  customer: { name: string };
  assignedStaff: { name: string } | null;
}) {
  return {
    customer: job.customer.name,
    description: job.description,
    when: formatDateTime(job.scheduledAt),
    durationMin: job.estimatedDurationMin,
    status: job.status,
    assignedTo: job.assignedStaff?.name ?? null,
  };
}

export async function runReadTool(name: ReadToolName, input: Record<string, unknown>): Promise<string> {
  const session = await requireSession();
  const businessId = session.businessId;

  switch (name) {
    case "getTodaysJobs": {
      const now = new Date();
      const jobs = await listJobsInRange(startOfLocalDay(now), endOfLocalDay(now));
      return JSON.stringify(jobs.map(summarizeJob));
    }

    case "getUpcomingJobs": {
      const days = typeof input.days === "number" && input.days > 0 ? Math.min(input.days, 60) : 7;
      const now = new Date();
      const jobs = await listJobsInRange(addDays(now, 1), endOfLocalDay(addDays(now, days)));
      return JSON.stringify(jobs.map(summarizeJob));
    }

    case "getOutstandingInvoices": {
      const invoices = await prisma.invoice.findMany({
        where: { businessId, status: { in: ["SENT", "OVERDUE"] } },
        orderBy: { dueDate: { sort: "asc", nulls: "last" } },
        include: { customer: true, items: true },
      });
      return JSON.stringify(
        invoices.map((inv) => ({
          customer: inv.customer.name,
          total: formatCents(lineItemsTotalCents(inv.items)),
          status: inv.status,
          dueDate: inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : null,
        })),
      );
    }

    case "getPendingQuotes": {
      const quotes = await prisma.quote.findMany({
        where: { businessId, status: { in: ["DRAFT", "SENT"] } },
        orderBy: { createdAt: "asc" },
        include: { customer: true, items: true },
      });
      return JSON.stringify(
        quotes.map((q) => ({
          customer: q.customer.name,
          description: q.description,
          total: formatCents(lineItemsTotalCents(q.items)),
          status: q.status,
          sentOrCreated: q.createdAt.toISOString().slice(0, 10),
        })),
      );
    }

    case "getCustomer": {
      const name = String(input.name ?? "");
      const resolved = await resolveCustomerByName(businessId, name);
      if (!resolved.ok) return JSON.stringify({ error: resolved.message });

      const customer = await prisma.customer.findUnique({
        where: { id: resolved.id },
        include: {
          jobs: { orderBy: { scheduledAt: "desc" }, take: 5 },
          recurringJobs: { where: { active: true } },
          quotes: { orderBy: { createdAt: "desc" }, take: 3, include: { items: true } },
          invoices: { orderBy: { createdAt: "desc" }, take: 3, include: { items: true } },
        },
      });
      if (!customer) return JSON.stringify({ error: "Customer not found." });

      return JSON.stringify({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        notes: customer.notes,
        recentJobs: customer.jobs.map((j) => ({
          description: j.description,
          when: formatDateTime(j.scheduledAt),
          status: j.status,
        })),
        recurringServices: customer.recurringJobs.map((r) => ({
          description: r.description,
          every: `${r.intervalValue} ${r.intervalUnit.toLowerCase()}(s)`,
        })),
        recentQuotes: customer.quotes.map((q) => ({
          description: q.description,
          total: formatCents(lineItemsTotalCents(q.items)),
          status: q.status,
        })),
        recentInvoices: customer.invoices.map((inv) => ({
          total: formatCents(lineItemsTotalCents(inv.items)),
          status: inv.status,
        })),
      });
    }

    case "getLapsedCustomers": {
      const days = typeof input.days === "number" && input.days > 0 ? input.days : 45;
      const cutoff = addDays(new Date(), -days);
      const customers = await prisma.customer.findMany({
        where: {
          businessId,
          jobs: { some: { scheduledAt: { lt: cutoff }, status: "COMPLETED" } },
          AND: [{ jobs: { none: { scheduledAt: { gte: cutoff } } } }],
        },
        orderBy: { name: "asc" },
        take: 10,
        include: { jobs: { orderBy: { scheduledAt: "desc" }, take: 1 } },
      });
      return JSON.stringify(
        customers.map((c) => ({
          name: c.name,
          lastJob: c.jobs[0] ? formatDateTime(c.jobs[0].scheduledAt) : null,
        })),
      );
    }

    case "getOpenTasks": {
      const tasks = await prisma.task.findMany({
        where: { businessId, status: "OPEN" },
        orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "desc" }],
        take: 20,
        include: { customer: true },
      });
      return JSON.stringify(
        tasks.map((t) => ({
          title: t.title,
          dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
          priority: t.priority,
          customer: t.customer?.name ?? null,
        })),
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Write tools — two-phase. prepareWriteTool() validates and produces a
// human-readable summary WITHOUT touching the database; executeWriteTool()
// performs the actual write, and is only ever called after the user
// confirms (see chat.ts).
// ---------------------------------------------------------------------------

export type PrepareResult = { ok: true; summary: string } | { ok: false; error: string };

export async function prepareWriteTool(name: WriteToolName, input: Record<string, unknown>): Promise<PrepareResult> {
  const session = await requireSession();
  const businessId = session.businessId;

  switch (name) {
    case "createTask": {
      const title = String(input.title ?? "").trim();
      if (!title) return { ok: false, error: "A task needs a title." };
      let customerPart = "";
      if (input.customerName) {
        const resolved = await resolveCustomerByName(businessId, String(input.customerName));
        if (!resolved.ok) return { ok: false, error: resolved.message };
        customerPart = ` for ${resolved.name}`;
      }
      const duePart = input.dueDate ? ` due ${String(input.dueDate)}` : "";
      return { ok: true, summary: `Create task "${title}"${customerPart}${duePart}.` };
    }

    case "createJob": {
      const description = String(input.description ?? "").trim();
      const date = String(input.date ?? "");
      if (!description || !date) return { ok: false, error: "A job needs a description and a date." };
      const resolved = await resolveCustomerByName(businessId, String(input.customerName ?? ""));
      if (!resolved.ok) return { ok: false, error: resolved.message };
      const time = typeof input.time === "string" && input.time ? input.time : "09:00";
      return {
        ok: true,
        summary: `Schedule "${description}" for ${resolved.name} on ${date} at ${time}.`,
      };
    }

    case "createRecurringJob": {
      const description = String(input.description ?? "").trim();
      const intervalValue = Number(input.intervalValue);
      const intervalUnit = String(input.intervalUnit ?? "");
      const startDate = String(input.startDate ?? "");
      if (!description || !intervalValue || !intervalUnit || !startDate) {
        return { ok: false, error: "A recurring job needs a description, interval, and start date." };
      }
      const resolved = await resolveCustomerByName(businessId, String(input.customerName ?? ""));
      if (!resolved.ok) return { ok: false, error: resolved.message };
      return {
        ok: true,
        summary: `Set up "${description}" for ${resolved.name}, every ${intervalValue} ${intervalUnit.toLowerCase()}(s), starting ${startDate}.`,
      };
    }
  }
}

export async function executeWriteTool(name: WriteToolName, input: Record<string, unknown>): Promise<string> {
  const session = await requireSession();
  const businessId = session.businessId;

  switch (name) {
    case "createTask": {
      const title = String(input.title ?? "").trim();
      let customerId: string | null = null;
      if (input.customerName) {
        const resolved = await resolveCustomerByName(businessId, String(input.customerName));
        if (resolved.ok) customerId = resolved.id;
      }
      const priority = ["LOW", "MEDIUM", "HIGH"].includes(String(input.priority))
        ? (input.priority as TaskPriority)
        : "MEDIUM";
      await prisma.task.create({
        data: {
          businessId,
          title,
          priority,
          dueDate: input.dueDate ? new Date(`${String(input.dueDate)}T00:00:00`) : null,
          customerId,
          createdByAva: true,
        },
      });
      return `Created task "${title}".`;
    }

    case "createJob": {
      const resolved = await resolveCustomerByName(businessId, String(input.customerName ?? ""));
      if (!resolved.ok) return `Could not create the job: ${resolved.message}`;
      const description = String(input.description ?? "").trim();
      const date = String(input.date ?? "");
      const time = typeof input.time === "string" && input.time ? input.time : "09:00";
      const durationMin =
        typeof input.durationMin === "number" && input.durationMin > 0 ? input.durationMin : 60;
      const priceCents = typeof input.price === "number" ? dollarsToCents(input.price) : null;

      const job = await prisma.job.create({
        data: {
          businessId,
          customerId: resolved.id,
          description,
          address: resolved.address,
          scheduledAt: new Date(`${date}T${time}:00`),
          estimatedDurationMin: durationMin,
          priceCents,
        },
      });
      return `Scheduled "${description}" for ${resolved.name} on ${formatDateTime(job.scheduledAt)}.`;
    }

    case "createRecurringJob": {
      const resolved = await resolveCustomerByName(businessId, String(input.customerName ?? ""));
      if (!resolved.ok) return `Could not set up the recurring job: ${resolved.message}`;
      const description = String(input.description ?? "").trim();
      const intervalValue = Number(input.intervalValue);
      const intervalUnit = String(input.intervalUnit ?? "WEEK") as RecurrenceUnit;
      const startDate = String(input.startDate ?? "");

      await prisma.recurringJob.create({
        data: {
          businessId,
          customerId: resolved.id,
          description,
          address: resolved.address,
          intervalValue,
          intervalUnit,
          startDate: new Date(`${startDate}T09:00:00`),
        },
      });
      await ensureRecurringJobsGenerated();
      return `Set up "${description}" for ${resolved.name}, every ${intervalValue} ${intervalUnit.toLowerCase()}(s) starting ${startDate}. Future visits will keep being added to the calendar automatically.`;
    }
  }
}
