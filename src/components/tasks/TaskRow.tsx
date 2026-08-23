import Link from "next/link";
import { Check } from "lucide-react";
import { setTaskStatus } from "@/server/data/tasks-actions";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { taskPriorityMeta } from "@/lib/status";
import type { Task, Customer, Job } from "@prisma/client";

export type TaskWithRelations = Task & { customer: Customer | null; job: Job | null };

function isPastDue(dueDate: Date | null) {
  return dueDate != null && dueDate.getTime() < Date.now();
}

export function TaskRow({ task }: { task: TaskWithRelations }) {
  const isDone = task.status === "DONE";
  const isOverdue = !isDone && isPastDue(task.dueDate);

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <form action={setTaskStatus.bind(null, task.id, isDone ? "OPEN" : "DONE")}>
        <button
          type="submit"
          aria-label={isDone ? "Reopen task" : "Mark task done"}
          className={cn(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            isDone ? "border-accent bg-accent text-accent-foreground" : "border-border text-transparent hover:border-accent",
          )}
        >
          <Check size={14} strokeWidth={3} />
        </button>
      </form>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", isDone && "text-muted line-through")}>{task.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          {task.dueDate && (
            <span className={isOverdue ? "font-medium text-danger" : ""}>{formatDate(task.dueDate)}</span>
          )}
          {task.customer && (
            <Link href={`/customers/${task.customer.id}`} className="hover:text-accent">
              {task.customer.name}
            </Link>
          )}
          {task.notes && <span className="truncate">{task.notes}</span>}
        </div>
      </div>

      {!isDone && task.priority !== "MEDIUM" && (
        <Badge tone={taskPriorityMeta[task.priority].tone} className="shrink-0">
          {taskPriorityMeta[task.priority].label}
        </Badge>
      )}
    </div>
  );
}
