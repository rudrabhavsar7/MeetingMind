"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function ImportRecordingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  // Select the default workspace
  const workspaceId = user?.workspaces?.[0]?.id;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      // Set default title to filename if title is empty
      if (!title) {
        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !workspaceId) {
      setError("Please select a file and provide a title.");
      return;
    }

    if (file.size > 2 * 1024 * 1024 * 1024) { // 2 GB
      setError("File exceeds maximum allowed size of 2GB.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      // 1. Get presigned URL
      const { data: presignedData } = await apiClient.post(
        `/workspaces/${workspaceId}/meetings/import/presigned-url`,
        {
          filename: file.name,
          mime_type: file.type || "application/octet-stream",
          file_size_bytes: file.size,
          title: title,
        }
      );

      const { meeting_id, upload_url, object_key, required_headers } = presignedData.data;

      // 2. Upload to S3
      await axios.put(upload_url, file, {
        headers: required_headers,
      });

      // 3. Confirm completion
      await apiClient.post(
        `/workspaces/${workspaceId}/meetings/import-complete`,
        {
          meeting_id,
          object_key,
        }
      );

      router.push(`/meetings/${meeting_id}`);
    } catch (error) {
      const err = error as Error | { response?: { data?: { detail?: string } } };
      let message = "An error occurred during upload.";
      if (err && typeof err === 'object') {
        if ('response' in err && err.response?.data?.detail) {
          message = err.response.data.detail;
        } else if (error instanceof Error) {
          message = error.message;
        }
      }
      setError(message);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-medium">Import Recording</h3>
        <p className="text-sm text-muted-foreground">
          Upload a meeting recording (MP4, MP3, WAV) to process its transcript and summary.
        </p>
      </div>

      <Card>
        <form onSubmit={handleUpload}>
          <CardHeader>
            <CardTitle>Select File</CardTitle>
            <CardDescription>
              Maximum file size is 2GB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-medium">Recording File</label>
              <Input
                id="file"
                type="file"
                accept="audio/*,video/mp4,video/webm"
                onChange={handleFileChange}
                disabled={isUploading}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Meeting Title</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Planning"
                disabled={isUploading}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUploading || !file || !title}>
              {isUploading ? "Uploading..." : "Upload Recording"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
