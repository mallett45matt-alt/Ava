import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default function TasksPage() {
  return (
    <div>
      <PageHeader title="Tasks" description="Things to follow up on." />
      <EmptyState title="Tasks coming soon" />
    </div>
  );
}
