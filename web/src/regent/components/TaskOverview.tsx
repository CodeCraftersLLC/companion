interface TaskEntry {
  sessionName: string;
  subject: string;
  status: "pending" | "in_progress" | "completed";
  activeForm?: string;
}

interface TaskOverviewProps {
  tasks: TaskEntry[];
  title?: string;
}

const STATUS_STYLES: Record<string, { dot: string; text: string }> = {
  in_progress: { dot: "bg-blue-400 animate-pulse", text: "text-blue-400" },
  pending: { dot: "bg-yellow-400", text: "text-yellow-400" },
  completed: { dot: "bg-green-400", text: "text-green-400" },
};

export function TaskOverview({ tasks, title }: TaskOverviewProps) {
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const pending = tasks.filter((t) => t.status === "pending");
  const completed = tasks.filter((t) => t.status === "completed");

  return (
    <div className="p-3 rounded-lg border border-cc-border bg-cc-card">
      {title && (
        <div className="text-xs font-medium text-cc-fg mb-2">{title}</div>
      )}

      <div className="flex gap-3 text-[11px] text-cc-muted mb-3">
        <span>{tasks.length} total</span>
        <span className="text-blue-400">{inProgress.length} active</span>
        <span className="text-yellow-400">{pending.length} pending</span>
        <span className="text-green-400">{completed.length} done</span>
      </div>

      {inProgress.length > 0 && (
        <div className="space-y-1.5">
          {inProgress.map((t, i) => (
            <TaskRow key={`ip-${i}`} task={t} />
          ))}
        </div>
      )}

      {pending.length > 0 && inProgress.length > 0 && (
        <div className="border-t border-cc-border my-2" />
      )}

      {pending.length > 0 && (
        <div className="space-y-1.5">
          {pending.slice(0, 5).map((t, i) => (
            <TaskRow key={`p-${i}`} task={t} />
          ))}
          {pending.length > 5 && (
            <div className="text-[10px] text-cc-muted">
              +{pending.length - 5} more pending
            </div>
          )}
        </div>
      )}

      {completed.length > 0 && (inProgress.length > 0 || pending.length > 0) && (
        <div className="border-t border-cc-border my-2" />
      )}

      {completed.length > 0 && (
        <div className="space-y-1.5 opacity-60">
          {completed.slice(0, 3).map((t, i) => (
            <TaskRow key={`c-${i}`} task={t} />
          ))}
          {completed.length > 3 && (
            <div className="text-[10px] text-cc-muted">
              +{completed.length - 3} more completed
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: TaskEntry }) {
  const style = STATUS_STYLES[task.status] ?? STATUS_STYLES.pending;
  return (
    <div className="flex items-start gap-2 text-[11px]">
      <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${style.dot}`} />
      <div className="min-w-0">
        <span className="text-cc-fg">
          {task.activeForm ?? task.subject}
        </span>
        <span className="text-cc-muted ml-1">({task.sessionName})</span>
      </div>
    </div>
  );
}

export const taskOverviewTamboComponent = {
  name: "TaskOverview",
  description:
    "Displays an aggregated view of tasks across multiple sessions with color-coded status indicators. Groups by in-progress, pending, and completed.",
  component: TaskOverview,
  propsSchema: {
    type: "object" as const,
    properties: {
      tasks: {
        type: "array" as const,
        description: "Array of task entries from across sessions",
        items: {
          type: "object" as const,
          properties: {
            sessionName: { type: "string" as const },
            subject: { type: "string" as const },
            status: { type: "string" as const },
            activeForm: { type: "string" as const },
          },
        },
      },
      title: {
        type: "string" as const,
        description: "Optional title for the overview",
      },
    },
    required: ["tasks"],
  },
};
