// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.hoisted(() => {
  if (typeof globalThis.Worker === "undefined") {
    globalThis.Worker = class Worker {
      constructor() {}
      postMessage() {}
      terminate() {}
      addEventListener() {}
      removeEventListener() {}
      onmessage = null;
      onerror = null;
    } as unknown as typeof globalThis.Worker;
  }
});

vi.mock("../../api.js", () => ({
  api: {
    getChangedFiles: vi.fn().mockResolvedValue({
      files: [
        { path: "/project/src/index.ts", status: "modified" },
        { path: "/project/src/utils.ts", status: "added" },
      ],
    }),
  },
}));

const mockStoreState = {
  sdkSessions: [
    {
      sessionId: "s1",
      name: "Feature Work",
      state: "running" as const,
      model: "claude-sonnet-4-20250514",
      cwd: "/project",
      backendType: "claude" as const,
      gitBranch: "feat/new-feature",
      createdAt: 1700000000000,
      archived: false,
    },
    {
      sessionId: "s2",
      name: "Bug Fix",
      state: "connected" as const,
      model: "gpt-4",
      cwd: "/other-project",
      backendType: "codex" as const,
      gitBranch: "fix/bug-123",
      createdAt: 1700001000000,
      archived: false,
    },
    {
      sessionId: "s3",
      name: "Archived Session",
      state: "exited" as const,
      model: "claude-sonnet-4-20250514",
      cwd: "/old",
      backendType: "claude" as const,
      createdAt: 1699000000000,
      archived: true,
    },
  ],
  messages: new Map([
    [
      "s1",
      [
        { id: "m1", role: "user", content: "Hello, build a feature", timestamp: 1700000001000 },
        { id: "m2", role: "assistant", content: "Working on it now...", timestamp: 1700000002000 },
        { id: "m3", role: "user", content: "Add tests too", timestamp: 1700000003000 },
      ],
    ],
  ]),
  sessionTasks: new Map([
    [
      "s1",
      [
        { id: "1", subject: "Implement feature", status: "completed", activeForm: "Implementing feature" },
        { id: "2", subject: "Add unit tests", status: "in_progress", activeForm: "Adding unit tests" },
        { id: "3", subject: "Run CI", status: "pending", activeForm: "Running CI" },
      ],
    ],
  ]),
  connectionStatus: new Map([
    ["s1", "connected"],
    ["s2", "connected"],
  ]),
  cliConnected: new Map([
    ["s1", true],
    ["s2", true],
  ]),
  streaming: new Map([["s1", "partial text"]]),
  sessionStatus: new Map([["s1", "running"]]),
  pendingPermissions: new Map([
    [
      "s1",
      new Map([
        ["perm1", { request_id: "perm1", tool_name: "Bash", description: "Run build" }],
      ]),
    ],
  ]),
  sessions: new Map([
    ["s1", { model: "claude-sonnet-4-20250514", permissionMode: "auto" }],
  ]),
};

vi.mock("../../store.js", () => ({
  useStore: Object.assign(() => mockStoreState, {
    getState: () => mockStoreState,
    subscribe: () => () => {},
    setState: () => {},
    destroy: () => {},
  }),
}));

import { sessionTools } from "./session-tools.js";

function findTool(name: string) {
  const tool = sessionTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool;
}

describe("session-tools", () => {
  describe("listSessions", () => {
    it("returns only non-archived sessions", async () => {
      const tool = findTool("listSessions");
      const result = JSON.parse(await tool.tool({} as never));
      expect(result).toHaveLength(2);
      expect(result[0].sessionId).toBe("s1");
      expect(result[1].sessionId).toBe("s2");
    });

    it("includes session metadata", async () => {
      const tool = findTool("listSessions");
      const result = JSON.parse(await tool.tool({} as never));
      expect(result[0].name).toBe("Feature Work");
      expect(result[0].model).toBe("claude-sonnet-4-20250514");
      expect(result[0].backendType).toBe("claude");
      expect(result[0].gitBranch).toBe("feat/new-feature");
    });
  });

  describe("getSessionMessages", () => {
    it("returns messages for a valid session", async () => {
      const tool = findTool("getSessionMessages");
      const result = JSON.parse(await tool.tool({ sessionId: "s1" }));
      expect(result).toHaveLength(3);
      expect(result[0].role).toBe("user");
      expect(result[0].content).toContain("Hello");
    });

    it("returns empty array for session with no messages", async () => {
      const tool = findTool("getSessionMessages");
      const result = JSON.parse(await tool.tool({ sessionId: "s2" }));
      expect(result).toHaveLength(0);
    });

    it("respects the limit parameter", async () => {
      const tool = findTool("getSessionMessages");
      const result = JSON.parse(await tool.tool({ sessionId: "s1", limit: 1 }));
      expect(result).toHaveLength(1);
      expect(result[0].content).toContain("Add tests");
    });

    it("clamps limit to maximum of 50", async () => {
      const tool = findTool("getSessionMessages");
      const result = JSON.parse(await tool.tool({ sessionId: "s1", limit: 999 }));
      expect(result).toHaveLength(3);
    });

    it("clamps limit to minimum of 1", async () => {
      const tool = findTool("getSessionMessages");
      const result = JSON.parse(await tool.tool({ sessionId: "s1", limit: 0 }));
      expect(result).toHaveLength(1);
    });
  });

  describe("getSessionTasks", () => {
    it("returns tasks for a valid session", async () => {
      const tool = findTool("getSessionTasks");
      const result = JSON.parse(await tool.tool({ sessionId: "s1" }));
      expect(result).toHaveLength(3);
      expect(result[0].status).toBe("completed");
      expect(result[1].status).toBe("in_progress");
      expect(result[2].status).toBe("pending");
    });

    it("returns empty array for session with no tasks", async () => {
      const tool = findTool("getSessionTasks");
      const result = JSON.parse(await tool.tool({ sessionId: "s2" }));
      expect(result).toHaveLength(0);
    });
  });

  describe("getSessionStatus", () => {
    it("returns status details for a session", async () => {
      const tool = findTool("getSessionStatus");
      const result = JSON.parse(await tool.tool({ sessionId: "s1" }));
      expect(result.connectionStatus).toBe("connected");
      expect(result.cliConnected).toBe(true);
      expect(result.isStreaming).toBe(true);
      expect(result.sessionStatus).toBe("running");
      expect(result.pendingPermissionCount).toBe(1);
    });

    it("returns defaults for unknown session", async () => {
      const tool = findTool("getSessionStatus");
      const result = JSON.parse(await tool.tool({ sessionId: "unknown" }));
      expect(result.connectionStatus).toBe("disconnected");
      expect(result.cliConnected).toBe(false);
      expect(result.isStreaming).toBe(false);
      expect(result.pendingPermissionCount).toBe(0);
    });
  });

  describe("getSessionDiff", () => {
    it("returns diff info for a valid session", async () => {
      const tool = findTool("getSessionDiff");
      const result = JSON.parse(await tool.tool({ sessionId: "s1" }));
      expect(result.changedFileCount).toBe(2);
      expect(result.files).toHaveLength(2);
      expect(result.files[0].status).toBe("modified");
    });

    it("returns error for nonexistent session", async () => {
      const tool = findTool("getSessionDiff");
      const result = JSON.parse(await tool.tool({ sessionId: "nonexistent" }));
      expect(result.error).toBe("Session not found");
    });
  });

  describe("getAllSessionsSummary", () => {
    it("returns aggregated summary", async () => {
      const tool = findTool("getAllSessionsSummary");
      const result = JSON.parse(await tool.tool({} as never));
      expect(result.totalSessions).toBe(2);
      expect(result.sessions).toHaveLength(2);
    });

    it("includes task summary per session", async () => {
      const tool = findTool("getAllSessionsSummary");
      const result = JSON.parse(await tool.tool({} as never));
      const s1 = result.sessions.find((s: { sessionId: string }) => s.sessionId === "s1");
      expect(s1.taskSummary.total).toBe(3);
      expect(s1.taskSummary.inProgress).toBe(1);
      expect(s1.taskSummary.completed).toBe(1);
      expect(s1.taskSummary.currentTask).toBe("Adding unit tests");
    });

    it("includes streaming and permission status", async () => {
      const tool = findTool("getAllSessionsSummary");
      const result = JSON.parse(await tool.tool({} as never));
      const s1 = result.sessions.find((s: { sessionId: string }) => s.sessionId === "s1");
      expect(s1.isStreaming).toBe(true);
      expect(s1.pendingPermissionCount).toBe(1);
    });
  });
});
