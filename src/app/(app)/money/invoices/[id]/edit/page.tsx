import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { InvoiceForm } from "@/components/money/InvoiceForm";
import { getInvoice } from "@/server/data/invoices";
import { listCustomers } from "@/server/data/customers";
import { updateInvoice } from "@/server/data/invoices-actions";

function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, customers] = await Promise.all([getInvoice(id), listCustomers()]);
  if (!invoice) notFound();

  return (
    <div>
      <PageHeader title="Edit invoice" />
      <Card>
        <CardContent>
          <InvoiceForm
            action={updateInvoice.bind(null, invoice.id)}
            customers={customers}
            submitLabel="Save changes"
            defaults={{
              customerId: invoice.customerId,
              dueDate: invoice.dueDate ? toDateInputValue(invoice.dueDate) : undefined,
              notes: invoice.notes ?? "",
              items: invoice.items,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
