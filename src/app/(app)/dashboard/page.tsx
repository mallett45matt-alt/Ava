import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Home" description="What needs doing today." />
      <EmptyState title="Dashboard coming soon" description="Built once jobs, quotes and invoices are in place." />
    </div>
  );
}
