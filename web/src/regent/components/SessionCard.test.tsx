// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { SessionCard } from "./SessionCard.js";

vi.mock("../../utils/routing.js", () => ({
  navigateToSession: vi.fn(),
  parseHash: () => ({ page: "home" }),
  navigateHome: vi.fn(),
  sessionHash: (id: string) => `#/session/${id}`,
}));

const defaultProps = {
  sessionId: "test-session",
  name: "Feature Work",
  state: "running",
  model: "claude-sonnet-4-20250514",
  backendType: "claude",
  sessionStatus: "idle",
  isStreaming: false,
  pendingPermissionCount: 0,
  currentTask: null,
  gitBranch: "main",
};

describe("SessionCard", () => {
  it("renders session name and model", () => {
    render(<SessionCard {...defaultProps} />);
    expect(screen.getByText("Feature Work")).toBeInTheDocument();
    expect(screen.getByText("claude-sonnet-4-20250514")).toBeInTheDocument();
  });

  it("displays backend type", () => {
    render(<SessionCard {...defaultProps} />);
    expect(screen.getByText("claude")).toBeInTheDocument();
  });

  it("shows git branch when provided", () => {
    render(<SessionCard {...defaultProps} gitBranch="feat/new-stuff" />);
    expect(screen.getByText("feat/new-stuff")).toBeInTheDocument();
  });

  it("shows current task when provided", () => {
    render(<SessionCard {...defaultProps} currentTask="Adding unit tests" />);
    expect(screen.getByText("Adding unit tests")).toBeInTheDocument();
  });

  it("shows pending permissions warning", () => {
    render(<SessionCard {...defaultProps} pendingPermissionCount={3} />);
    expect(screen.getByText("3 pending permissions")).toBeInTheDocument();
  });

  it("shows singular permission text for count of 1", () => {
    render(<SessionCard {...defaultProps} pendingPermissionCount={1} />);
    expect(screen.getByText("1 pending permission")).toBeInTheDocument();
  });

  it("does not show permissions section when count is 0", () => {
    render(<SessionCard {...defaultProps} pendingPermissionCount={0} />);
    expect(screen.queryByText(/pending permission/)).not.toBeInTheDocument();
  });

  it("navigates to session on click", async () => {
    const { navigateToSession } = await import("../../utils/routing.js");
    render(<SessionCard {...defaultProps} />);
    fireEvent.click(screen.getByRole("button"));
    expect(navigateToSession).toHaveBeenCalledWith("test-session");
  });

  it("shows streaming status indicator", () => {
    render(<SessionCard {...defaultProps} isStreaming state="running" />);
    expect(screen.getByText("Streaming")).toBeInTheDocument();
  });

  it("shows compacting status when sessionStatus is compacting", () => {
    render(<SessionCard {...defaultProps} sessionStatus="compacting" />);
    expect(screen.getByText("Compacting")).toBeInTheDocument();
  });
});
