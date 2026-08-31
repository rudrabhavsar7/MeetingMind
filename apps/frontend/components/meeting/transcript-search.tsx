"use client";

import { useState, useCallback } from "react";
import { Search, X, FileText } from "lucide-react";
import { apiClient } from "@/lib/api";

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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search transcript..."
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); setTotal(0); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>

      {total > 0 && (
        <p className="text-sm text-gray-500">{total} result{total !== 1 ? "s" : ""} found</p>
      )}

      <div className="space-y-3">
        {results.map((result) => (
          <div
            key={result.segment.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {result.segment.speaker_name || result.segment.speaker_label}
              </span>
              <span className="text-xs text-gray-500">
                {formatTime(result.segment.start_time)} - {formatTime(result.segment.end_time)}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {result.segment.text}
            </p>
          </div>
        ))}
      </div>

      {query && !isSearching && results.length === 0 && (
        <p className="text-center text-sm text-gray-500">No results found</p>
      )}
    </div>
  );
}
