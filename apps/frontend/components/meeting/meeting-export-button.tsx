"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";

interface MeetingExportButtonProps {
  workspaceId: string;
  meetingId: string;
  meetingTitle?: string;
}

export function MeetingExportButton({
  workspaceId,
  meetingId,
  meetingTitle = "meeting",
}: MeetingExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportMarkdown = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get(
        `/workspaces/${workspaceId}/meetings/${meetingId}/exports/markdown`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meetingTitle.replace(/[^a-zA-Z0-9\s-]/g, "").trim().replace(/\s+/g, "-")}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExportMarkdown}
      disabled={isExporting}
      className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600 dark:hover:bg-gray-700"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      Export Markdown
    </button>
  );
}
