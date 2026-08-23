import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { getCustomer } from "@/server/data/customers";
import { updateCustomer } from "@/server/data/customers-actions";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${customer.name}`} />
      <Card>
        <CardContent>
          <CustomerForm
            action={updateCustomer.bind(null, customer.id)}
            submitLabel="Save changes"
            defaults={{
              name: customer.name,
              phone: customer.phone ?? "",
              email: customer.email ?? "",
              address: customer.address ?? "",
              notes: customer.notes ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
