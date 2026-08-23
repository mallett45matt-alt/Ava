import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { QuoteForm } from "@/components/money/QuoteForm";
import { listCustomers } from "@/server/data/customers";
import { createQuote } from "@/server/data/quotes-actions";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const customers = await listCustomers();

  return (
    <div>
      <PageHeader title="New quote" />
      <Card>
        <CardContent>
          <QuoteForm action={createQuote} customers={customers} submitLabel="Create quote" defaults={{ customerId }} />
        </CardContent>
      </Card>
    </div>
  );
}
