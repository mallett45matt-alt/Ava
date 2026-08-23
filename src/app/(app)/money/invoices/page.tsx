import Link from "next/link";
import { Receipt } from "lucide-react";
import { listInvoices } from "@/server/data/invoices";
import { lineItemsTotalCents } from "@/server/data/line-items";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { MoneyTabs } from "@/components/money/MoneyTabs";
import { formatCents, formatDate } from "@/lib/format";
import { invoiceStatusMeta } from "@/lib/status";

export default async function InvoicesPage() {
  const invoices = await listInvoices();

  return (
    <div>
      <PageHeader
        title="Money"
        action={<ButtonLink href="/money/invoices/new">New invoice</ButtonLink>}
      />
      <MoneyTabs active="invoices" />

      {invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt size={28} />}
          title="No invoices yet"
          description="Invoices you create, or generate from a completed job, will show up here."
          action={<ButtonLink href="/money/invoices/new">New invoice</ButtonLink>}
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {invoices.map((invoice) => {
            const meta = invoiceStatusMeta[invoice.status];
            return (
              <li key={invoice.id}>
                <Link
                  href={`/money/invoices/${invoice.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{invoice.customer.name}</p>
                    <p className="truncate text-sm text-muted">
                      Issued {formatDate(invoice.issueDate)}
                      {invoice.dueDate ? ` · Due ${formatDate(invoice.dueDate)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-medium">
                      {formatCents(lineItemsTotalCents(invoice.items))}
                    </span>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
