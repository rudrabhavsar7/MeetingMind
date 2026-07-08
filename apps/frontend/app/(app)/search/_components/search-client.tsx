"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, User, Bot, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ChatMessage, Citation } from "@/types/api.types";

// ─── Mock data ──────────────────────────────────────────────────────────────

const suggestedQueries = [
  "What were the action items from the Q3 planning meeting?",
  "What did we decide about the database architecture?",
  "Summarize the debate about WebSocket vs polling.",
  "Which meetings mentioned the AI pipeline timeline?",
];

const mockResponse: ChatMessage = {
  id: "r1",
  role: "assistant",
  content: `Based on your recent meetings, here's what I found regarding the Q3 planning discussions:

The team decided to use **WebSocket** for the extension-to-backend audio streaming [1], rejecting HTTP polling due to real-time transcription latency requirements.

For the AI pipeline, **faster-whisper** was selected as the default local STT provider, with an abstraction layer planned to allow operator-level provider swaps [2].

The key blocker identified was GPU routing for the Ollama container in Docker Compose, owned by Arnish [3].

**Action items logged:**
- Jenil: Document the WebSocket event specification by Thursday
- Arnish: Resolve GPU routing for Ollama
- Rudra: Define the STT provider abstraction interface`,
  citations: [
    {
      index: 1,
      meeting_id: "m1",
      meeting_title: "Q3 Product Planning — All Hands",
      meeting_date: new Date(Date.now() - 86400000).toISOString(),
      segment_text: "I've been thinking about this. We should definitely go with WebSocket for the extension-to-backend stream.",
      start_time: 19,
    },
    {
      index: 2,
      meeting_id: "m2",
      meeting_title: "Backend Architecture Review",
      meeting_date: new Date(Date.now() - 172800000).toISOString(),
      segment_text: "The plan is to use faster-whisper locally as the default. The abstraction layer is important.",
      start_time: 57,
    },
    {
      index: 3,
      meeting_id: "m2",
      meeting_title: "Backend Architecture Review",
      meeting_date: new Date(Date.now() - 172800000).toISOString(),
      segment_text: "The only thing missing is the Ollama service — I need to figure out GPU routing for the GPU worker container.",
      start_time: 139,
    },
  ],
  created_at: new Date().toISOString(),
};

// ─── Citation Modal ──────────────────────────────────────────────────────────

function CitationCard({ citation }: { citation: Citation }) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-primary">[{citation.index}] {citation.meeting_title}</p>
            <p className="text-[11px] text-muted-foreground">
              {new Date(citation.meeting_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {" · "}{Math.floor(citation.start_time / 60)}:{String(citation.start_time % 60).padStart(2, "0")}
            </p>
          </div>
          <a
            href={`/meetings/${citation.meeting_id}`}
            aria-label="Open source meeting"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed italic border-l-2 border-primary/30 pl-2">
          &ldquo;{citation.segment_text}&rdquo;
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted border border-border"
      )}>
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5 text-primary" />}
      </div>

      {/* Content */}
      <div className={cn("flex flex-col gap-2 max-w-[80%]", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm"
        )}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="space-y-2 w-full">
            <p className="text-[11px] text-muted-foreground font-medium">Sources:</p>
            {message.citations.map((c) => (
              <CitationCard key={c.index} citation={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSubmit(q: string = query) {
    if (!q.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${crypto.randomUUID()}`,
      role: "user",
      content: q.trim(),
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsLoading(true);

    // Simulate streaming delay
    await new Promise((r) => setTimeout(r, 1400));
    setMessages((prev) => [...prev, { ...mockResponse, id: `r-${crypto.randomUUID()}` }]);
    setIsLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Ask MeetingMind</h1>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-6">
          {!hasMessages ? (
            /* Empty state with suggested queries */
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-8">
              <div className="space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Ask anything about your meetings</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Ask questions about decisions, action items, discussions, or anything captured in your meetings.
                </p>
              </div>

              {/* Suggested queries */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {suggestedQueries.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSubmit(q)}
                    className="text-left rounded-xl border border-border bg-card p-3 text-sm text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground">Searching your meetings…</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input area — sticky bottom */}
      <div className="border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-end gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 focus-within:border-primary/50 transition-colors">
            <textarea
              ref={textareaRef}
              id="chat-input"
              rows={1}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your meetings… (Enter to send)"
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[24px] max-h-32"
              style={{ height: "auto" }}
              aria-label="Chat input"
              disabled={isLoading}
            />
            <Button
              id="chat-submit"
              size="icon"
              className="flex-shrink-0 h-8 w-8"
              onClick={() => handleSubmit()}
              disabled={!query.trim() || isLoading}
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            AI answers are grounded in your meeting transcripts. Always verify with source citations.
          </p>
        </div>
      </div>
    </div>
  );
}
