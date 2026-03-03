import { defineTool } from "@tambo-ai/react";
import { useStore } from "../../store.js";
import { api } from "../../api.js";
import type { TamboTool } from "@tambo-ai/react";

function getStore() {
  return useStore.getState();
}

const listSessionsTool = defineTool({
  name: "listSessions",
  description:
    "List all active agent sessions with their name, status, model, working directory, and backend type. Use this to get an overview of what agents are currently running.",
  tool: async () => {
    const store = getStore();
    const sessions = store.sdkSessions.filter((s) => !s.archived);
    return JSON.stringify(
      sessions.map((s) => ({
        sessionId: s.sessionId,
        name: s.name ?? s.sessionId,
        state: s.state,
        model: s.model ?? "unknown",
        cwd: s.cwd,
        backendType: s.backendType ?? "claude",
        gitBranch: s.gitBranch,
        createdAt: new Date(s.createdAt).toISOString(),
      })),
    );
  },
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [] as string[],
  },
  outputSchema: {
    type: "object" as const,
    properties: {},
  },
});

const getSessionMessagesTool = defineTool({
  name: "getSessionMessages",
  description:
    "Get recent messages from a specific agent session. Returns the conversation history including user messages and assistant responses.",
  tool: async (args: { sessionId: string; limit?: number }) => {
    const store = getStore();
    const messages = store.messages.get(args.sessionId) ?? [];
    const limit = Math.max(1, Math.min(args.limit ?? 20, 50));
    const recent = messages.slice(-limit);
    return JSON.stringify(
      recent.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content.slice(0, 500),
        timestamp: new Date(m.timestamp).toISOString(),
      })),
    );
  },
  inputSchema: {
    type: "object" as const,
    properties: {
      sessionId: {
        type: "string" as const,
        description: "The session ID to get messages from",
      },
      limit: {
        type: "number" as const,
        description: "Maximum number of recent messages to return (default: 20)",
      },
    },
    required: ["sessionId"],
  },
  outputSchema: {
    type: "object" as const,
    properties: {},
  },
});

const getSessionTasksTool = defineTool({
  name: "getSessionTasks",
  description:
    "Get the current task list (todo items) for a specific agent session. Shows what the agent is working on and its progress.",
  tool: async (args: { sessionId: string }) => {
    const store = getStore();
    const tasks = store.sessionTasks.get(args.sessionId) ?? [];
    return JSON.stringify(
      tasks.map((t) => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        activeForm: t.activeForm,
      })),
    );
  },
  inputSchema: {
    type: "object" as const,
    properties: {
      sessionId: {
        type: "string" as const,
        description: "The session ID to get tasks from",
      },
    },
    required: ["sessionId"],
  },
  outputSchema: {
    type: "object" as const,
    properties: {},
  },
});

const getSessionStatusTool = defineTool({
  name: "getSessionStatus",
  description:
    "Get detailed status of a specific agent session including connection state, streaming status, and pending permission requests.",
  tool: async (args: { sessionId: string }) => {
    const store = getStore();
    const connectionStatus =
      store.connectionStatus.get(args.sessionId) ?? "disconnected";
    const cliConnected = store.cliConnected.get(args.sessionId) ?? false;
    const isStreaming = store.streaming.has(args.sessionId);
    const sessionStatus = store.sessionStatus.get(args.sessionId) ?? "idle";
    const pendingPerms = store.pendingPermissions.get(args.sessionId);
    const pendingCount = pendingPerms ? pendingPerms.size : 0;
    const session = store.sessions.get(args.sessionId);

    return JSON.stringify({
      sessionId: args.sessionId,
      connectionStatus,
      cliConnected,
      isStreaming,
      sessionStatus,
      pendingPermissionCount: pendingCount,
      model: session?.model,
      permissionMode: session?.permissionMode,
    });
  },
  inputSchema: {
    type: "object" as const,
    properties: {
      sessionId: {
        type: "string" as const,
        description: "The session ID to get status for",
      },
    },
    required: ["sessionId"],
  },
  outputSchema: {
    type: "object" as const,
    properties: {},
  },
});

const getSessionDiffTool = defineTool({
  name: "getSessionDiff",
  description:
    "Get a summary of git changes (diff) for the working directory of a specific session. Shows files added, modified, and deleted.",
  tool: async (args: { sessionId: string }) => {
    const store = getStore();
    const sdkSession = store.sdkSessions.find(
      (s) => s.sessionId === args.sessionId,
    );
    if (!sdkSession) {
      return JSON.stringify({ error: "Session not found" });
    }
    try {
      const { files } = await api.getChangedFiles(sdkSession.cwd, "last-commit");
      return JSON.stringify({
        sessionId: args.sessionId,
        cwd: sdkSession.cwd,
        changedFileCount: files.length,
        files: files.slice(0, 30).map((f) => ({
          path: f.path,
          status: f.status,
        })),
      });
    } catch {
      return JSON.stringify({
        sessionId: args.sessionId,
        error: "Could not fetch diff",
      });
    }
  },
  inputSchema: {
    type: "object" as const,
    properties: {
      sessionId: {
        type: "string" as const,
        description: "The session ID to get git diff for",
      },
    },
    required: ["sessionId"],
  },
  outputSchema: {
    type: "object" as const,
    properties: {},
  },
});

const getAllSessionsSummaryTool = defineTool({
  name: "getAllSessionsSummary",
  description:
    "Get an aggregated overview of all active sessions. Shows which sessions are active, idle, streaming, or waiting for permissions. Use this for a quick status check across all agents.",
  tool: async () => {
    const store = getStore();
    const sessions = store.sdkSessions.filter((s) => !s.archived);

    const summary = sessions.map((s) => {
      const connStatus =
        store.connectionStatus.get(s.sessionId) ?? "disconnected";
      const isStreaming = store.streaming.has(s.sessionId);
      const pendingPerms = store.pendingPermissions.get(s.sessionId);
      const pendingCount = pendingPerms ? pendingPerms.size : 0;
      const tasks = store.sessionTasks.get(s.sessionId) ?? [];
      const inProgress = tasks.filter((t) => t.status === "in_progress");
      const completed = tasks.filter((t) => t.status === "completed");
      const sessionStatus = store.sessionStatus.get(s.sessionId) ?? "idle";

      return {
        sessionId: s.sessionId,
        name: s.name ?? s.sessionId,
        state: s.state,
        model: s.model ?? "unknown",
        backendType: s.backendType ?? "claude",
        connectionStatus: connStatus,
        isStreaming,
        sessionStatus,
        pendingPermissionCount: pendingCount,
        taskSummary: {
          total: tasks.length,
          inProgress: inProgress.length,
          completed: completed.length,
          currentTask: inProgress[0]?.activeForm ?? null,
        },
        gitBranch: s.gitBranch,
      };
    });

    return JSON.stringify({
      totalSessions: sessions.length,
      sessions: summary,
    });
  },
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [] as string[],
  },
  outputSchema: {
    type: "object" as const,
    properties: {},
  },
});

export const sessionTools: TamboTool[] = [
  listSessionsTool,
  getSessionMessagesTool,
  getSessionTasksTool,
  getSessionStatusTool,
  getSessionDiffTool,
  getAllSessionsSummaryTool,
];
