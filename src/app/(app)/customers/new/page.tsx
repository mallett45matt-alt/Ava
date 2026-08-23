import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { createCustomer } from "@/server/data/customers-actions";

export default function NewCustomerPage() {
  return (
    <div>
      <PageHeader title="Add customer" />
      <Card>
        <CardContent>
          <CustomerForm action={createCustomer} submitLabel="Add customer" />
        </CardContent>
      </Card>
    </div>
  );
}
