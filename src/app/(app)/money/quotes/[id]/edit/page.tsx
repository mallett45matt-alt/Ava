import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { QuoteForm } from "@/components/money/QuoteForm";
import { getQuote } from "@/server/data/quotes";
import { listCustomers } from "@/server/data/customers";
import { updateQuote } from "@/server/data/quotes-actions";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quote, customers] = await Promise.all([getQuote(id), listCustomers()]);
  if (!quote) notFound();

  return (
    <div>
      <PageHeader title="Edit quote" />
      <Card>
        <CardContent>
          <QuoteForm
            action={updateQuote.bind(null, quote.id)}
            customers={customers}
            submitLabel="Save changes"
            defaults={{
              customerId: quote.customerId,
              description: quote.description,
              notes: quote.notes ?? "",
              items: quote.items,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
