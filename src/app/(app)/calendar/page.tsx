import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CalendarPage() {
  return (
    <div>
      <PageHeader title="Calendar" description="Your jobs, day by day." />
      <EmptyState title="Calendar coming soon" description="Jobs and recurring jobs land here next." />
    </div>
  );
}
