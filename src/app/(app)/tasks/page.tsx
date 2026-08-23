import { ListChecks } from "lucide-react";
import { listOpenTasks, listRecentlyDoneTasks } from "@/server/data/tasks";
import { listCustomers } from "@/server/data/customers";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { TaskRow } from "@/components/tasks/TaskRow";

export default async function TasksPage() {
  const [openTasks, doneTasks, customers] = await Promise.all([
    listOpenTasks(),
    listRecentlyDoneTasks(),
    listCustomers(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description="Things to follow up on." />

      <Card>
        <div className="p-4">
          <QuickAddTask customers={customers} />
        </div>
      </Card>

      {openTasks.length === 0 ? (
        <EmptyState icon={<ListChecks size={28} />} title="Nothing on your list" description="You're all caught up." />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {openTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </Card>
      )}

      {doneTasks.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-sm font-medium text-muted">Recently completed</p>
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              {doneTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
