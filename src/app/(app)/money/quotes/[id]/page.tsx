import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { getQuote } from "@/server/data/quotes";
import { setQuoteStatus } from "@/server/data/quotes-actions";
import { lineItemsTotalCents } from "@/server/data/line-items";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCents } from "@/lib/format";
import { quoteStatusMeta } from "@/lib/status";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  const meta = quoteStatusMeta[quote.status];
  const total = lineItemsTotalCents(quote.items);

  return (
    <div className="space-y-6">
      <PageHeader
        title={quote.description}
        description={quote.customer.name}
        action={
          <ButtonLink href={`/money/quotes/${quote.id}/edit`} variant="secondary" size="sm">
            <Pencil size={16} /> Edit
          </ButtonLink>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <Badge tone={meta.tone}>{meta.label}</Badge>

          <ul className="divide-y divide-border">
            {quote.items.map((item) => (
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

          {quote.notes && (
            <p className="whitespace-pre-wrap rounded-xl bg-background px-3.5 py-2.5 text-sm text-muted">
              {quote.notes}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {quote.status === "DRAFT" && (
          <form action={setQuoteStatus.bind(null, quote.id, "SENT")}>
            <Button type="submit">Mark as sent</Button>
          </form>
        )}
        {quote.status === "SENT" && (
          <>
            <form action={setQuoteStatus.bind(null, quote.id, "ACCEPTED")}>
              <Button type="submit">Mark accepted</Button>
            </form>
            <form action={setQuoteStatus.bind(null, quote.id, "DECLINED")}>
              <Button type="submit" variant="ghost">
                Mark declined
              </Button>
            </form>
          </>
        )}
        {quote.status === "ACCEPTED" && (
          <ButtonLink href={`/money/invoices/new?quoteId=${quote.id}`}>
            Create invoice from this quote
          </ButtonLink>
        )}
      </div>

      <p className="text-center text-sm text-muted">
        <Link href="/money/quotes" className="hover:text-accent">
          ← Back to quotes
        </Link>
      </p>
    </div>
  );
}
