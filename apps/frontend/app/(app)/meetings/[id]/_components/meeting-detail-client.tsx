"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Users,
  CheckCircle2,
  Circle,
  ChevronRight,
  Lightbulb,
  ListChecks,
  Gavel,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TranscriptSegment, ActionItem, Decision } from "@/types/api.types";

// ─── Mock data ──────────────────────────────────────────────────────────────

const mockSegments: TranscriptSegment[] = [
  { id: "s1", meeting_id: "m1", speaker_label: "Speaker 1", speaker_name: "Rudra", text: "Alright, let's kick off the Q3 planning session. I want to start with the AI pipeline — we need to finalize the streaming architecture before we can commit to a timeline.", start_time: 0, end_time: 18, created_at: "" },
  { id: "s2", meeting_id: "m1", speaker_label: "Speaker 2", speaker_name: "Prashant", text: "I've been thinking about this. We should definitely go with WebSocket for the extension-to-backend stream. The latency requirements for live transcription make polling completely infeasible.", start_time: 19, end_time: 38, created_at: "" },
  { id: "s3", meeting_id: "m1", speaker_label: "Speaker 3", speaker_name: "Jenil", text: "Agreed on WebSocket. What about the STT provider? Are we locked into Whisper or should we keep the interface abstract enough to swap providers later?", start_time: 39, end_time: 56, created_at: "" },
  { id: "s4", meeting_id: "m1", speaker_label: "Speaker 1", speaker_name: "Rudra", text: "The plan is to use faster-whisper locally as the default. The abstraction layer is important — we should define a clean interface so operators can swap in their own STT if needed.", start_time: 57, end_time: 78, created_at: "" },
  { id: "s5", meeting_id: "m1", speaker_label: "Speaker 2", speaker_name: "Prashant", text: "On the frontend side, I'll need the WebSocket events spec finalized before I can build the live transcript UI in the extension side panel. Can we document that this week?", start_time: 79, end_time: 97, created_at: "" },
  { id: "s6", meeting_id: "m1", speaker_label: "Speaker 3", speaker_name: "Jenil", text: "I'll own that. I'll write up the event spec — transcript_interim, transcript_final, action_item_detected, summary_updated, meeting_completed — and share it in Notion by Thursday.", start_time: 98, end_time: 118, created_at: "" },
  { id: "s7", meeting_id: "m1", speaker_label: "Speaker 1", speaker_name: "Rudra", text: "Perfect. Let's also talk about the RAG pipeline. We need pgvector indexes set up before we can run any embedding queries. Arnish, is the Docker Compose ready?", start_time: 119, end_time: 138, created_at: "" },
  { id: "s8", meeting_id: "m1", speaker_label: "Speaker 4", speaker_name: "Arnish", text: "The Docker Compose is up. PostgreSQL with pgvector extension is running, Redis is up. The only thing missing is the Ollama service — I need to figure out GPU routing for the GPU worker container.", start_time: 139, end_time: 161, created_at: "" },
];

const mockActionItems: ActionItem[] = [
  { id: "a1", meeting_id: "m1", text: "Jenil to document WebSocket event spec by Thursday", assignee: "Jenil", due_date: null, status: "open", source_segment_id: "s6", created_at: "" },
  { id: "a2", meeting_id: "m1", text: "Arnish to figure out GPU routing for Ollama container", assignee: "Arnish", due_date: null, status: "open", source_segment_id: "s8", created_at: "" },
  { id: "a3", meeting_id: "m1", text: "Rudra to define STT provider abstraction interface", assignee: "Rudra", due_date: null, status: "completed", source_segment_id: "s4", created_at: "" },
];

const mockDecisions: Decision[] = [
  { id: "d1", meeting_id: "m1", text: "Use WebSocket for extension-to-backend audio streaming (rejected HTTP polling due to latency)", source_segment_id: "s2", created_at: "" },
  { id: "d2", meeting_id: "m1", text: "faster-whisper is the default STT provider; abstraction layer required for operator swap-out", source_segment_id: "s4", created_at: "" },
];

const mockSummary = `The team finalized the real-time streaming architecture for the MeetingMind AI pipeline. **WebSocket** was chosen over HTTP polling for extension-to-backend audio streaming due to live transcription latency requirements [1][2].

**faster-whisper** was selected as the default local STT provider, with a clean abstraction layer to allow operators to swap providers [2].

The infrastructure is largely ready — PostgreSQL with pgvector and Redis are running in Docker Compose. GPU routing for the Ollama container remains the only outstanding infrastructure blocker [3].

The WebSocket event specification (transcript_interim, transcript_final, action_item_detected, summary_updated, meeting_completed) will be documented by Jenil by Thursday, unblocking the extension side panel UI [4].`;

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Speaker color palette (emerald variants + slates)
const speakerColors: Record<string, string> = {
  "Speaker 1": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "Speaker 2": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  "Speaker 3": "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  "Speaker 4": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

type InsightsTab = "summary" | "decisions" | "actions";

// ─── Component ──────────────────────────────────────────────────────────────

export default function MeetingDetailClient() {
  const [activeTab, setActiveTab] = useState<InsightsTab>("summary");
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<Set<string>>(
    new Set(mockActionItems.filter((a) => a.status === "completed").map((a) => a.id))
  );

  function toggleActionItem(id: string) {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const tabs: { key: InsightsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "summary", label: "Summary", icon: Lightbulb },
    { key: "decisions", label: "Decisions", icon: Gavel },
    { key: "actions", label: "Actions", icon: ListChecks },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-3 flex items-center gap-4">
          <Link href="/meetings">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Meetings
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">
              Q3 Product Planning — All Hands
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
            <Clock className="h-3.5 w-3.5" />
            <span>1h 30m</span>
            <Users className="h-3.5 w-3.5 ml-1" />
            <span>12 participants</span>
          </div>
        </div>
      </header>

      {/* Body: split-pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane — Transcript (60%) */}
        <div className="flex-1 overflow-y-auto border-r border-border">
          <div className="px-6 py-4 max-w-[80ch]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Transcript
            </h2>
            <div className="space-y-4" role="log" aria-label="Meeting transcript">
              {mockSegments.map((seg) => {
                const colorClass = speakerColors[seg.speaker_label] ?? "bg-muted text-muted-foreground";
                const isActive = seg.id === activeSegmentId;
                return (
                  <article
                    key={seg.id}
                    className={cn(
                      "group rounded-lg p-3 transition-colors",
                      isActive ? "bg-primary/10" : "hover:bg-muted/50"
                    )}
                    aria-label={`${seg.speaker_name ?? seg.speaker_label} at ${formatTime(seg.start_time)}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {/* Speaker chip */}
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", colorClass)}>
                        {seg.speaker_name ?? seg.speaker_label}
                      </span>
                      {/* Timestamp — clickable to seek */}
                      <button
                        onClick={() => setActiveSegmentId(seg.id)}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                        aria-label={`Seek to ${formatTime(seg.start_time)}`}
                      >
                        <Play className="h-2.5 w-2.5" />
                        {formatTime(seg.start_time)}
                      </button>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{seg.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right pane — Insights (40%) */}
        <aside className="w-[380px] flex-shrink-0 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border bg-background" role="tablist" aria-label="Meeting insights">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeTab === key}
                aria-controls={`panel-${key}`}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Summary */}
            {activeTab === "summary" && (
              <div
                id="panel-summary"
                role="tabpanel"
                aria-label="AI Summary"
                className="prose prose-sm dark:prose-invert max-w-none text-foreground"
              >
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3 text-primary" />
                  AI-generated · <span className="text-primary">verify with transcript</span>
                </p>
                {mockSummary.split("\n\n").map((para, i) => (
                  <p key={i} className="text-sm text-foreground leading-relaxed mb-3 whitespace-pre-wrap">
                    {para}
                  </p>
                ))}
              </div>
            )}

            {/* Decisions */}
            {activeTab === "decisions" && (
              <div id="panel-decisions" role="tabpanel" aria-label="Decisions" className="space-y-3">
                {mockDecisions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No decisions logged.</p>
                ) : (
                  mockDecisions.map((d, i) => (
                    <Card key={d.id}>
                      <CardContent className="p-3">
                        <div className="flex gap-2.5">
                          <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                            {i + 1}
                          </span>
                          <p className="text-sm text-foreground leading-snug">{d.text}</p>
                        </div>
                        {d.source_segment_id && (
                          <button
                            onClick={() => setActiveSegmentId(d.source_segment_id!)}
                            className="mt-2 ml-7 text-[11px] text-primary hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                          >
                            View in transcript <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Action Items */}
            {activeTab === "actions" && (
              <div id="panel-actions" role="tabpanel" aria-label="Action Items" className="space-y-2">
                {mockActionItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No action items logged.</p>
                ) : (
                  mockActionItems.map((item) => {
                    const done = completedItems.has(item.id);
                    return (
                      <Card key={item.id}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2.5">
                            <button
                              onClick={() => toggleActionItem(item.id)}
                              aria-label={done ? `Mark incomplete: ${item.text}` : `Mark complete: ${item.text}`}
                              className="flex-shrink-0 mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                            >
                              {done ? (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                              )}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className={cn("text-sm leading-snug", done && "line-through text-muted-foreground")}>
                                {item.text}
                              </p>
                              {item.assignee && (
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  → {item.assignee}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
