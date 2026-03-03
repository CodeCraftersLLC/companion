import { navigateToSession } from "../../utils/routing.js";

interface SessionCardProps {
  sessionId: string;
  name: string;
  state: string;
  model: string;
  backendType: string;
  sessionStatus: string;
  isStreaming: boolean;
  pendingPermissionCount: number;
  currentTask: string | null;
  gitBranch: string | null;
}

function statusDot(state: string, isStreaming: boolean): string {
  if (isStreaming) return "bg-blue-400 animate-pulse";
  if (state === "running") return "bg-green-400";
  if (state === "connected") return "bg-green-400";
  if (state === "starting") return "bg-yellow-400 animate-pulse";
  return "bg-cc-muted";
}

function statusLabel(
  state: string,
  isStreaming: boolean,
  sessionStatus: string,
): string {
  if (isStreaming) return "Streaming";
  if (sessionStatus === "compacting") return "Compacting";
  if (state === "running") return "Running";
  if (state === "connected") return "Connected";
  if (state === "starting") return "Starting";
  if (state === "exited") return "Exited";
  return state;
}

export function SessionCard({
  sessionId,
  name,
  state,
  model,
  backendType,
  sessionStatus,
  isStreaming,
  pendingPermissionCount,
  currentTask,
  gitBranch,
}: SessionCardProps) {
  return (
    <button
      type="button"
      onClick={() => navigateToSession(sessionId)}
      className="w-full text-left p-3 rounded-lg border border-cc-border bg-cc-card hover:bg-cc-hover transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${statusDot(state, isStreaming)}`}
        />
        <span className="text-sm font-medium text-cc-fg truncate">{name}</span>
        <span className="ml-auto text-[10px] text-cc-muted uppercase tracking-wider">
          {backendType}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-cc-muted">
        <span>{model}</span>
        {gitBranch && (
          <>
            <span className="text-cc-border">|</span>
            <span className="truncate max-w-[120px]">{gitBranch}</span>
          </>
        )}
        <span className="ml-auto">
          {statusLabel(state, isStreaming, sessionStatus)}
        </span>
      </div>

      {currentTask && (
        <div className="mt-1.5 text-[11px] text-cc-muted truncate">
          {currentTask}
        </div>
      )}

      {pendingPermissionCount > 0 && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-cc-warning font-medium">
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.25 5a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.5a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
          {pendingPermissionCount} pending permission
          {pendingPermissionCount > 1 ? "s" : ""}
        </div>
      )}
    </button>
  );
}

export const sessionCardTamboComponent = {
  name: "SessionCard",
  description:
    "Displays a summary card for an agent session showing its status, model, current task, and pending permissions. Clickable to navigate to the session.",
  component: SessionCard,
  propsSchema: {
    type: "object" as const,
    properties: {
      sessionId: { type: "string" as const, description: "Session ID" },
      name: { type: "string" as const, description: "Session display name" },
      state: {
        type: "string" as const,
        description: "Session state (starting, connected, running, exited)",
      },
      model: { type: "string" as const, description: "AI model being used" },
      backendType: {
        type: "string" as const,
        description: "Backend type (claude or codex)",
      },
      sessionStatus: {
        type: "string" as const,
        description: "Session status (idle, running, compacting, etc.)",
      },
      isStreaming: {
        type: "boolean" as const,
        description: "Whether the session is currently streaming",
      },
      pendingPermissionCount: {
        type: "number" as const,
        description: "Number of pending permission requests",
      },
      currentTask: {
        type: "string" as const,
        description: "Currently active task description, or null",
      },
      gitBranch: {
        type: "string" as const,
        description: "Git branch name, or null",
      },
    },
    required: [
      "sessionId",
      "name",
      "state",
      "model",
      "backendType",
      "sessionStatus",
      "isStreaming",
      "pendingPermissionCount",
    ],
  },
};
