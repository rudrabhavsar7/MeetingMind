"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

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
    <Button
      onClick={handleExportMarkdown}
      disabled={isExporting}
      variant="outline"
      size="sm"
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileText className="mr-2 h-4 w-4" />
      )}
      Export Markdown
    </Button>
  );
}
