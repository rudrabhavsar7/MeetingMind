import Link from "next/link";
import { Calendar, Clock, Users, Mic, CheckCircle2, Loader2, AlertCircle, Video } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Meeting, MeetingStatus } from "@/types/api.types";

interface MeetingCardProps {
  meeting: Meeting;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusConfig: Record<
  MeetingStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  recording: {
    label: "Recording",
    icon: Mic,
    className: "text-red-500 bg-red-500/10",
  },
  transcribing: {
    label: "Transcribing",
    icon: Loader2,
    className: "text-amber-500 bg-amber-500/10",
  },
  analyzing: {
    label: "Analyzing",
    icon: Loader2,
    className: "text-blue-500 bg-blue-500/10",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "text-primary bg-primary/10",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    className: "text-destructive bg-destructive/10",
  },
};

export function MeetingCard({ meeting }: MeetingCardProps) {
  const status = statusConfig[meeting.status];
  const StatusIcon = status.icon;
  const isProcessing = meeting.status === "transcribing" || meeting.status === "analyzing";

  return (
    <Link href={`/meetings/${meeting.id}`} className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
      <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/30 group-focus-visible:border-ring">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {meeting.title || "Untitled Meeting"}
            </h3>
            {/* Status badge */}
            <span
              className={cn(
                "inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                status.className
              )}
              aria-label={`Status: ${status.label}`}
            >
              <StatusIcon className={cn("h-3 w-3", isProcessing && "animate-spin")} />
              {status.label}
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {/* Preview */}
          {meeting.summary_preview && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {meeting.summary_preview}
            </p>
          )}
          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(meeting.started_at)}
            </span>
            {meeting.duration_seconds !== null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(meeting.duration_seconds)}
              </span>
            )}
            {meeting.participant_count !== null && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {meeting.participant_count} participants
              </span>
            )}
            {meeting.source_app && (
              <span className="flex items-center gap-1">
                <Video className="h-3 w-3" />
                {meeting.source_app}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/** Skeleton loader for MeetingCard while data is fetching */
export function MeetingCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-5 w-20 rounded-full bg-muted flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-4/5 rounded bg-muted" />
        <div className="flex gap-3 pt-1">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-3 w-12 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
