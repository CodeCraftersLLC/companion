// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import { TaskOverview } from "./TaskOverview.js";

const mixedTasks = [
  { sessionName: "Session A", subject: "Build API", status: "in_progress" as const, activeForm: "Building API" },
  { sessionName: "Session A", subject: "Write tests", status: "pending" as const },
  { sessionName: "Session B", subject: "Fix bug", status: "completed" as const },
  { sessionName: "Session B", subject: "Deploy", status: "pending" as const },
];

describe("TaskOverview", () => {
  it("renders summary counts", () => {
    render(<TaskOverview tasks={mixedTasks} />);
    expect(screen.getByText("4 total")).toBeInTheDocument();
    expect(screen.getByText("1 active")).toBeInTheDocument();
    expect(screen.getByText("2 pending")).toBeInTheDocument();
    expect(screen.getByText("1 done")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(<TaskOverview tasks={mixedTasks} title="Task Dashboard" />);
    expect(screen.getByText("Task Dashboard")).toBeInTheDocument();
  });

  it("does not render title when not provided", () => {
    render(<TaskOverview tasks={mixedTasks} />);
    expect(screen.queryByText("Task Dashboard")).not.toBeInTheDocument();
  });

  it("shows activeForm when available, subject otherwise", () => {
    render(<TaskOverview tasks={mixedTasks} />);
    expect(screen.getByText("Building API")).toBeInTheDocument();
    expect(screen.getByText("Write tests")).toBeInTheDocument();
  });

  it("shows session name next to each displayed task", () => {
    render(<TaskOverview tasks={mixedTasks} />);
    const sessionALabels = screen.getAllByText("(Session A)");
    expect(sessionALabels.length).toBe(2);
    const sessionBLabels = screen.getAllByText("(Session B)");
    expect(sessionBLabels.length).toBe(2);
  });

  it("renders empty state with zero counts", () => {
    render(<TaskOverview tasks={[]} />);
    expect(screen.getByText("0 total")).toBeInTheDocument();
    expect(screen.getByText("0 active")).toBeInTheDocument();
    expect(screen.getByText("0 pending")).toBeInTheDocument();
    expect(screen.getByText("0 done")).toBeInTheDocument();
  });

  it("truncates pending tasks beyond 5 and shows overflow message", () => {
    const manyPending = Array.from({ length: 8 }, (_, i) => ({
      sessionName: `S${i}`,
      subject: `Task ${i}`,
      status: "pending" as const,
    }));
    render(<TaskOverview tasks={manyPending} />);
    expect(screen.getByText("+3 more pending")).toBeInTheDocument();
  });

  it("renders completed tasks", () => {
    render(<TaskOverview tasks={mixedTasks} />);
    expect(screen.getByText("Fix bug")).toBeInTheDocument();
  });

  it("truncates completed tasks beyond 3 and shows overflow message", () => {
    const manyCompleted = Array.from({ length: 5 }, (_, i) => ({
      sessionName: `S${i}`,
      subject: `Done ${i}`,
      status: "completed" as const,
    }));
    render(<TaskOverview tasks={manyCompleted} />);
    expect(screen.getByText("+2 more completed")).toBeInTheDocument();
  });

  it("does not show overflow message when pending count is 5 or fewer", () => {
    const fewPending = Array.from({ length: 5 }, (_, i) => ({
      sessionName: `S${i}`,
      subject: `Task ${i}`,
      status: "pending" as const,
    }));
    render(<TaskOverview tasks={fewPending} />);
    expect(screen.queryByText(/more pending/)).not.toBeInTheDocument();
  });
});
