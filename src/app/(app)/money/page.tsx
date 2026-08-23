import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default function MoneyPage() {
  return (
    <div>
      <PageHeader title="Money" description="Quotes and invoices." />
      <EmptyState title="Quotes & invoices coming soon" />
    </div>
  );
}
