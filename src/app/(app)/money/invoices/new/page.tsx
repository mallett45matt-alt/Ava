import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { InvoiceForm } from "@/components/money/InvoiceForm";
import { listCustomers } from "@/server/data/customers";
import { getJob } from "@/server/data/jobs";
import { getQuote } from "@/server/data/quotes";
import { createInvoice } from "@/server/data/invoices-actions";
import { formatDate } from "@/lib/format";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string; quoteId?: string; customerId?: string }>;
}) {
  const { jobId, quoteId, customerId } = await searchParams;
  const customers = await listCustomers();

  let defaults: {
    customerId?: string;
    items?: { description: string; quantity: number; unitPriceCents: number }[];
  } = { customerId };
  let linkedContext: string | undefined;

  if (jobId) {
    const job = await getJob(jobId);
    if (!job) notFound();
    defaults = {
      customerId: job.customerId,
      items: [
        {
          description: job.description,
          quantity: 1,
          unitPriceCents: job.priceCents ?? 0,
        },
      ],
    };
    linkedContext = `Invoicing the completed job "${job.description}" from ${formatDate(job.scheduledAt)}. Check the price, then confirm and send.`;
  } else if (quoteId) {
    const quote = await getQuote(quoteId);
    if (!quote) notFound();
    defaults = {
      customerId: quote.customerId,
      items: quote.items,
    };
    linkedContext = `Invoicing the accepted quote "${quote.description}".`;
  }

  return (
    <div>
      <PageHeader title="New invoice" />
      <Card>
        <CardContent>
          <InvoiceForm
            action={createInvoice}
            customers={customers}
            jobId={jobId}
            quoteId={quoteId}
            linkedContext={linkedContext}
            defaults={defaults}
            submitLabel="Create invoice"
          />
        </CardContent>
      </Card>
    </div>
  );
}
