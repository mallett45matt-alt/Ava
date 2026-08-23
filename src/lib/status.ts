import type {
  JobStatus,
  QuoteStatus,
  InvoiceStatus,
  TaskStatus,
  TaskPriority,
} from "@prisma/client";
import type { BadgeTone } from "@/components/ui/Badge";

export const jobStatusMeta: Record<JobStatus, { label: string; tone: BadgeTone }> = {
  SCHEDULED: { label: "Scheduled", tone: "info" },
  IN_PROGRESS: { label: "In progress", tone: "warning" },
  COMPLETED: { label: "Completed", tone: "accent" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export const quoteStatusMeta: Record<QuoteStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  SENT: { label: "Sent", tone: "info" },
  ACCEPTED: { label: "Accepted", tone: "accent" },
  DECLINED: { label: "Declined", tone: "danger" },
};

export const invoiceStatusMeta: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  SENT: { label: "Sent", tone: "info" },
  PAID: { label: "Paid", tone: "accent" },
  OVERDUE: { label: "Overdue", tone: "danger" },
};

export const taskStatusMeta: Record<TaskStatus, { label: string; tone: BadgeTone }> = {
  OPEN: { label: "Open", tone: "info" },
  DONE: { label: "Done", tone: "accent" },
};

export const taskPriorityMeta: Record<TaskPriority, { label: string; tone: BadgeTone }> = {
  LOW: { label: "Low", tone: "neutral" },
  MEDIUM: { label: "Medium", tone: "warning" },
  HIGH: { label: "High", tone: "danger" },
};
