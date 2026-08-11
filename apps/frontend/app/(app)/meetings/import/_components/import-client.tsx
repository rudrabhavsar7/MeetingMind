"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, AlertCircle } from "lucide-react";

export default function ImportClient() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const workspaceId = user?.workspaces?.[0]?.id;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
      setError("");
    }
  };

  const handleUpload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!file || !title || !workspaceId) {
      setError("Please select a file and provide a title.");
      return;
    }

    if (file.size > 2 * 1024 * 1024 * 1024) { 
      setError("File exceeds maximum allowed size of 2GB.");
      return;
    }
    
    if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
      setError("Invalid file type. Please upload an audio or video file.");
      return;
    }

    setIsUploading(true);
    setError("");
    setProgress(0);

    abortControllerRef.current = new AbortController();

    try {
      setProgress(5);
      const { data: presignedData } = await apiClient.post(
        `/workspaces/${workspaceId}/meetings/import/presigned-url`,
        {
          filename: file.name,
          mime_type: file.type || "application/octet-stream",
          file_size_bytes: file.size,
          title: title,
        },
        { signal: abortControllerRef.current.signal }
      );

      const { meeting_id, upload_url, object_key, required_headers } = presignedData.data;

      await axios.put(upload_url, file, {
        headers: required_headers,
        signal: abortControllerRef.current.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 90) / progressEvent.total);
            setProgress(5 + percentCompleted);
          }
        },
      });

      setProgress(98);
      await apiClient.post(
        `/workspaces/${workspaceId}/meetings/import-complete`,
        {
          meeting_id,
          object_key,
        },
        { signal: abortControllerRef.current.signal }
      );

      setProgress(100);
      router.push(`/meetings/${meeting_id}`);
    } catch (error) {
      if (axios.isCancel(error)) {
        setError("Upload canceled.");
      } else {
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
      }
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-medium">Import Recording</h1>
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
            
            {isUploading && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert" aria-live="assertive">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2 justify-end">
            {error && (
              <Button type="button" variant="outline" onClick={() => handleUpload()} disabled={isUploading || !file || !title}>
                Retry
              </Button>
            )}
            <Button type="submit" disabled={isUploading || !file || !title}>
              {isUploading ? (
                <>
                  <UploadCloud className="mr-2 h-4 w-4 animate-pulse" />
                  Uploading...
                </>
              ) : "Upload Recording"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
