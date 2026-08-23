import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { getInvoice } from "@/server/data/invoices";
import { setInvoiceStatus } from "@/server/data/invoices-actions";
import { lineItemsTotalCents } from "@/server/data/line-items";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCents, formatDate } from "@/lib/format";
import { invoiceStatusMeta } from "@/lib/status";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const meta = invoiceStatusMeta[invoice.status];
  const total = lineItemsTotalCents(invoice.items);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice — ${invoice.customer.name}`}
        description={`Issued ${formatDate(invoice.issueDate)}${invoice.dueDate ? ` · Due ${formatDate(invoice.dueDate)}` : ""}`}
        action={
          <ButtonLink href={`/money/invoices/${invoice.id}/edit`} variant="secondary" size="sm">
            <Pencil size={16} /> Edit
          </ButtonLink>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <Badge tone={meta.tone}>{meta.label}</Badge>

          {(invoice.job || invoice.quote) && (
            <p className="text-sm text-muted">
              {invoice.job && (
                <>
                  From job:{" "}
                  <Link href={`/calendar/jobs/${invoice.job.id}`} className="text-accent">
                    {invoice.job.description}
                  </Link>
                </>
              )}
              {invoice.quote && (
                <>
                  From quote:{" "}
                  <Link href={`/money/quotes/${invoice.quote.id}`} className="text-accent">
                    {invoice.quote.description}
                  </Link>
                </>
              )}
            </p>
          )}

          <ul className="divide-y divide-border">
            {invoice.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  {item.description}
                  {item.quantity !== 1 && <span className="text-muted"> × {item.quantity}</span>}
                </span>
                <span className="shrink-0 font-medium">
                  {formatCents(Math.round(item.quantity * item.unitPriceCents))}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="font-medium">Total</span>
            <span className="text-lg font-semibold">{formatCents(total)}</span>
          </div>

          {invoice.notes && (
            <p className="whitespace-pre-wrap rounded-xl bg-background px-3.5 py-2.5 text-sm text-muted">
              {invoice.notes}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {invoice.status === "DRAFT" && (
          <form action={setInvoiceStatus.bind(null, invoice.id, "SENT")}>
            <Button type="submit">Confirm & send</Button>
          </form>
        )}
        {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
          <form action={setInvoiceStatus.bind(null, invoice.id, "PAID")}>
            <Button type="submit">Mark paid</Button>
          </form>
        )}
        {invoice.status === "SENT" && (
          <form action={setInvoiceStatus.bind(null, invoice.id, "OVERDUE")}>
            <Button type="submit" variant="ghost">
              Mark overdue
            </Button>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-muted">
        <Link href="/money/invoices" className="hover:text-accent">
          ← Back to invoices
        </Link>
      </p>
    </div>
  );
}
