import { useEffect, useMemo } from "react";
import { useTambo, useTamboThreadList } from "@tambo-ai/react";
import { useStore } from "../store.js";
import { RegentProvider, RegentChat, hasTamboApiKey } from "./RegentPanel.js";

function VerticalTabBar() {
  const activeTab = useStore((s) => s.rightPanelActiveTab);
  const setActiveTab = useStore((s) => s.setRightPanelActiveTab);
  const regentPanelOpen = useStore((s) => s.regentPanelOpen);
  const { startNewThread, switchThread, currentThreadId } = useTambo();
  const { data: threads } = useTamboThreadList();

  const threadList = useMemo(
    () => (threads?.threads ?? []).slice(0, 20),
    [threads],
  );

  const handleTabClick = (tabId: string) => {
    if (!regentPanelOpen) {
      useStore.getState().setRegentPanelOpen(true);
    }
    setActiveTab(tabId);
    switchThread(tabId);
  };

  const handleNewThread = async () => {
    if (!regentPanelOpen) {
      useStore.getState().setRegentPanelOpen(true);
    }
    await startNewThread();
  };

  useEffect(() => {
    if (currentThreadId && currentThreadId !== activeTab) {
      setActiveTab(currentThreadId);
    }
  }, [currentThreadId]);

  return (
    <div className="flex flex-col h-full w-9 shrink-0 border-l border-cc-border bg-cc-sidebar">
      {/* Header icon */}
      <div className="flex items-center justify-center w-full h-10 border-b border-cc-border">
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-cc-accent">
          <path d="M8 1l2.5 2.5L8 6 5.5 3.5 8 1zM1 8l2.5-2.5L6 8 3.5 10.5 1 8zm14 0l-2.5-2.5L10 8l2.5 2.5L15 8zM8 10l2.5 2.5L8 15l-2.5-2.5L8 10z" />
        </svg>
      </div>

      {/* Regent thread tabs */}
      <div className="flex-1 overflow-y-auto">
        {threadList.map((thread, i) => {
          const isActive = activeTab === thread.id;
          return (
            <button
              key={thread.id}
              type="button"
              onClick={() => handleTabClick(thread.id)}
              title={thread.name || `Regent thread ${i + 1}`}
              className={`flex items-center justify-center w-full h-10 transition-colors cursor-pointer ${
                isActive
                  ? "bg-cc-active text-cc-fg border-l-2 border-cc-accent"
                  : "text-cc-muted hover:text-cc-fg hover:bg-cc-hover"
              }`}
            >
              <span className="text-[10px] font-medium">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* New thread button */}
      <button
        type="button"
        onClick={handleNewThread}
        title="New Regent thread"
        className="flex items-center justify-center w-full h-10 text-cc-muted hover:text-cc-fg hover:bg-cc-hover transition-colors cursor-pointer border-t border-cc-border"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
          <path d="M8 3v10M3 8h10" />
        </svg>
      </button>
    </div>
  );
}

export function RegentSidebar() {
  const regentPanelOpen = useStore((s) => s.regentPanelOpen);
  const hasApiKey = hasTamboApiKey();

  if (!hasApiKey) return null;

  return (
    <RegentProvider>
      {/* Mobile overlay backdrop */}
      {regentPanelOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => useStore.getState().setRegentPanelOpen(false)}
        />
      )}

      <div
        className={`
          fixed inset-y-0 right-0 lg:relative lg:inset-auto z-40 lg:z-auto
          h-full shrink-0 transition-all duration-200 pt-safe lg:pt-0
          ${regentPanelOpen ? "w-full lg:w-[340px] translate-x-0" : "w-0 translate-x-full lg:w-0 lg:translate-x-full"}
          overflow-hidden
        `}
      >
        <div className="flex h-full w-full">
          {/* Chat content area */}
          <div className="flex-1 min-w-0 overflow-hidden border-l border-cc-border">
            <RegentChat />
          </div>

          {/* Vertical tab bar */}
          <VerticalTabBar />
        </div>
      </div>
    </RegentProvider>
  );
}
