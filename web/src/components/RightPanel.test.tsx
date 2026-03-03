// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSwitchThread = vi.fn();
const mockStartNewThread = vi.fn();

vi.mock("@tambo-ai/react", () => ({
  TamboProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="tambo-provider">{children}</div>,
  useTambo: () => ({
    messages: [],
    isStreaming: false,
    currentThreadId: "thread-1",
    switchThread: mockSwitchThread,
    startNewThread: mockStartNewThread,
    client: {},
    thread: undefined,
    streamingState: { status: "idle" },
    isWaiting: false,
    isIdle: true,
    registerComponent: vi.fn(),
    registerTool: vi.fn(),
    registerTools: vi.fn(),
    componentList: new Map(),
    toolRegistry: new Map(),
    initThread: vi.fn(),
    dispatch: vi.fn(),
    cancelRun: vi.fn(),
    authState: { status: "identified" },
    isIdentified: true,
    updateThreadName: vi.fn(),
  }),
  useTamboThreadInput: () => ({
    value: "",
    setValue: vi.fn(),
    submit: vi.fn(),
    isPending: false,
  }),
  useTamboThreadList: () => ({
    data: {
      threads: [
        { id: "thread-1", name: "Thread One", runStatus: "idle", createdAt: "2025-01-01", updatedAt: "2025-01-01" },
        { id: "thread-2", name: "Thread Two", runStatus: "idle", createdAt: "2025-01-01", updatedAt: "2025-01-01" },
      ],
      hasMore: false,
    },
    isLoading: false,
    isError: false,
  }),
  ComponentRenderer: () => null,
}));

const workerStub = vi.hoisted(() => {
  return vi.fn().mockImplementation(() => ({
    postMessage: vi.fn(),
    terminate: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onmessage: null,
    onerror: null,
  }));
});

vi.stubGlobal("Worker", workerStub);

vi.mock("../regent/tools/session-tools.js", () => ({
  sessionTools: [],
}));

vi.mock("../regent/components/SessionCard.js", () => ({
  sessionCardTamboComponent: {
    name: "SessionCard",
    description: "test",
    component: () => null,
    propsSchema: { type: "object" as const, properties: {}, required: [] },
  },
  SessionCard: () => null,
}));

vi.mock("../regent/components/TaskOverview.js", () => ({
  taskOverviewTamboComponent: {
    name: "TaskOverview",
    description: "test",
    component: () => null,
    propsSchema: { type: "object" as const, properties: {}, required: [] },
  },
  TaskOverview: () => null,
}));

import { RegentSidebar } from "./RightPanel.js";
import { useStore } from "../store.js";

beforeEach(() => {
  vi.clearAllMocks();
  useStore.setState({
    regentPanelOpen: true,
    rightPanelActiveTab: "",
  });
});

describe("RegentSidebar", () => {
  it("renders Regent thread tabs from Tambo thread list", () => {
    render(<RegentSidebar />);
    expect(screen.getByTitle("Thread One")).toBeInTheDocument();
    expect(screen.getByTitle("Thread Two")).toBeInTheDocument();
  });

  it("shows new thread button", () => {
    render(<RegentSidebar />);
    expect(screen.getByTitle("New Regent thread")).toBeInTheDocument();
  });

  it("renders RegentChat when panel is open", () => {
    render(<RegentSidebar />);
    expect(screen.getByPlaceholderText("Ask the Regent...")).toBeInTheDocument();
  });

  it("switching to a thread tab calls switchThread", () => {
    render(<RegentSidebar />);
    fireEvent.click(screen.getByTitle("Thread Two"));
    expect(mockSwitchThread).toHaveBeenCalledWith("thread-2");
  });

  it("collapses panel when closed", () => {
    useStore.setState({ regentPanelOpen: false });
    const { container } = render(<RegentSidebar />);
    const panelWrapper = container.querySelector(".translate-x-full");
    expect(panelWrapper).toBeInTheDocument();
  });

  it("clicking new thread button calls startNewThread", () => {
    render(<RegentSidebar />);
    fireEvent.click(screen.getByTitle("New Regent thread"));
    expect(mockStartNewThread).toHaveBeenCalled();
  });

  it("shows diamond header icon in vertical tab bar", () => {
    render(<RegentSidebar />);
    const tabBar = screen.getByTitle("New Regent thread").parentElement;
    expect(tabBar).toBeInTheDocument();
  });

  it("shows numbered tabs for each thread", () => {
    render(<RegentSidebar />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
