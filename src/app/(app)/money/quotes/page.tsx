import Link from "next/link";
import { FileText } from "lucide-react";
import { listQuotes } from "@/server/data/quotes";
import { lineItemsTotalCents } from "@/server/data/line-items";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { MoneyTabs } from "@/components/money/MoneyTabs";
import { formatCents, formatDate } from "@/lib/format";
import { quoteStatusMeta } from "@/lib/status";

export default async function QuotesPage() {
  const quotes = await listQuotes();

  return (
    <div>
      <PageHeader
        title="Money"
        action={<ButtonLink href="/money/quotes/new">New quote</ButtonLink>}
      />
      <MoneyTabs active="quotes" />

      {quotes.length === 0 ? (
        <EmptyState
          icon={<FileText size={28} />}
          title="No quotes yet"
          action={<ButtonLink href="/money/quotes/new">New quote</ButtonLink>}
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {quotes.map((quote) => {
            const meta = quoteStatusMeta[quote.status];
            return (
              <li key={quote.id}>
                <Link
                  href={`/money/quotes/${quote.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{quote.customer.name}</p>
                    <p className="truncate text-sm text-muted">
                      {quote.description} · {formatDate(quote.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-medium">
                      {formatCents(lineItemsTotalCents(quote.items))}
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
