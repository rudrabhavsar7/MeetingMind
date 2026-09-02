"use client";

import { useState, useCallback } from "react";
import { Search, X, FileText } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface TranscriptSearchResult {
  segment: {
    id: string;
    speaker_label: string;
    speaker_name: string | null;
    start_time: number;
    end_time: number;
    text: string;
    is_final: boolean;
  };
  meeting_id: string;
  rank: number;
}

interface TranscriptSearchProps {
  workspaceId: string;
  meetingId: string;
}

export function TranscriptSearch({ workspaceId, meetingId }: TranscriptSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TranscriptSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [total, setTotal] = useState(0);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiClient.get(
        `/workspaces/${workspaceId}/meetings/${meetingId}/transcript/search`,
        { params: { q: query, limit: 20 } }
      );
      setResults(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  }, [workspaceId, meetingId, query]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search transcript..."
            className="pl-9 pr-9"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); setTotal(0); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
        >
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </div>

      {total > 0 && (
        <p className="text-sm text-muted-foreground">{total} result{total !== 1 ? "s" : ""} found</p>
      )}

      <div className="space-y-3">
        {results.map((result) => (
          <Card key={result.segment.id}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">
                  {result.segment.speaker_name || result.segment.speaker_label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(result.segment.start_time)} - {formatTime(result.segment.end_time)}
                </span>
              </div>
              <p className="text-sm text-foreground">
                {result.segment.text}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {query && !isSearching && results.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">No results found</p>
      )}
    </div>
  );
}
