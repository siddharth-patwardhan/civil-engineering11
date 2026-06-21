import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";

interface FloatingAssistantProps {
  context?: string;
}

export function FloatingAssistant({ context = "general" }: FloatingAssistantProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: "Hi! I'm your Civil Engineering AI Assistant. Ask me about BOQ items, rates, IS standards, or missing quantities." },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    // In production, this would call the assistant API
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `I'm analyzing "${userMsg}" in ${context} context. (Integration with /api/analyze-structure pending)` },
      ]);
      setLoading(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[70] w-12 h-12 rounded-full bg-accent-primary text-white shadow-lg hover:bg-accent-primary-dim transition-colors flex items-center justify-center"
          title="AI Assistant"
        >
          <span className="material-symbols-outlined fill">smart_toy</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[70] w-[380px] max-h-[600px] bg-bg-surface border border-border-default rounded-xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default bg-bg-elevated">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-primary fill">smart_toy</span>
              <span className="font-h3 text-h3 text-text-primary">AI Assistant</span>
              <span className="font-label text-label text-text-muted capitalize">{context}</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="material-symbols-outlined text-[14px] text-accent-primary">smart_toy</span>
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 font-body text-body",
                    msg.role === "user"
                      ? "bg-accent-primary text-white rounded-br-none"
                      : "bg-bg-elevated text-text-primary rounded-bl-none border border-border-default"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[14px] text-accent-primary animate-spin">refresh</span>
                </div>
                <div className="bg-bg-elevated border border-border-default rounded-lg rounded-bl-none px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce delay-100" />
                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border-default bg-bg-elevated">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about BOQ, rates, IS standards..."
                className="flex-1 bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary font-body text-body placeholder:text-text-muted focus:border-accent-primary focus:ring-0 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-accent-primary text-white hover:bg-accent-primary-dim disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
            <div className="flex gap-2 mt-2 overflow-x-auto hide-scrollbar">
              {["Suggest BOQ items", "Check rates", "Explain formula", "Generate DPR"].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-2 py-1 rounded-full bg-bg-input border border-border-default text-text-muted hover:text-text-primary hover:border-border-focus transition-colors font-mono text-mono text-[10px] whitespace-nowrap"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

