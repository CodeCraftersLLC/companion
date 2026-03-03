import { useRef, useEffect, type ReactNode } from "react";
import {
  TamboProvider,
  useTambo,
  useTamboThreadInput,
  ComponentRenderer,
} from "@tambo-ai/react";
import { sessionTools } from "../regent/tools/session-tools.js";
import { sessionCardTamboComponent } from "../regent/components/SessionCard.js";
import { taskOverviewTamboComponent } from "../regent/components/TaskOverview.js";

const TAMBO_API_KEY = (import.meta as unknown as Record<string, Record<string, string>>).env?.VITE_TAMBO_API_KEY;

export function hasTamboApiKey(): boolean {
  return !!TAMBO_API_KEY;
}

export function RegentChat() {
  const { messages, isStreaming, currentThreadId } = useTambo();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isPending) return;
    await submit();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-sm text-cc-muted mb-2">
              Ask your Regent about your agent sessions
            </div>
            <div className="text-[11px] text-cc-muted/60 space-y-1">
              <div>"What are all my sessions doing?"</div>
              <div>"Which sessions need permission approvals?"</div>
              <div>"Summarize the progress across all agents"</div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm ${
              msg.role === "user"
                ? "text-cc-fg bg-cc-hover rounded-lg px-3 py-2 ml-8"
                : "text-cc-fg"
            }`}
          >
            {msg.content.map((content, i) => {
              if (content.type === "text") {
                return (
                  <div
                    key={`${msg.id}-${i}`}
                    className="whitespace-pre-wrap text-[13px] leading-relaxed"
                  >
                    {content.text}
                  </div>
                );
              }
              if (content.type === "component") {
                return (
                  <div key={`${msg.id}-${i}`} className="my-2">
                    <ComponentRenderer
                      content={content}
                      threadId={currentThreadId ?? ""}
                      messageId={msg.id}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}

        {isStreaming && (
          <div className="flex items-center gap-1.5 text-[11px] text-cc-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-cc-accent animate-pulse" />
            Thinking...
          </div>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="shrink-0 border-t border-cc-border p-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask the Regent..."
            className="flex-1 bg-cc-bg border border-cc-border rounded-lg px-3 py-2 text-sm text-cc-fg placeholder:text-cc-muted/50 focus:outline-none focus:border-cc-accent"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending || !value.trim()}
            className="shrink-0 px-3 py-2 rounded-lg bg-cc-accent text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

interface RegentProviderProps {
  children: ReactNode;
}

export function RegentProvider({ children }: RegentProviderProps) {
  if (!TAMBO_API_KEY) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-8 h-8 text-cc-muted mb-3">
          <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.25 5a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.5a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
        <div className="text-sm text-cc-muted mb-1">Regent requires a Tambo API key</div>
        <div className="text-[11px] text-cc-muted/60">
          Set <code className="px-1 py-0.5 rounded bg-cc-hover text-cc-fg">VITE_TAMBO_API_KEY</code> in your environment to enable Regent.
        </div>
      </div>
    );
  }

  return (
    <TamboProvider
      apiKey={TAMBO_API_KEY}
      userKey="companion-user"
      tools={sessionTools}
      components={[sessionCardTamboComponent, taskOverviewTamboComponent]}
    >
      {children}
    </TamboProvider>
  );
}

export function RegentPanel() {
  return (
    <RegentProvider>
      <RegentChat />
    </RegentProvider>
  );
}

export default RegentPanel;
