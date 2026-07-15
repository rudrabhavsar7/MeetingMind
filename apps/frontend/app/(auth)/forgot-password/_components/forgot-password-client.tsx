"use client";

import { useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import type { ApiResponse, StatusResponse } from "@/types/api.types";

const ACCEPTED_MESSAGE =
  "If an account exists for that email, a password reset link has been sent.";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post<ApiResponse<StatusResponse>>("/auth/password/forgot", {
        email: email.trim(),
      });
      setIsAccepted(true);
    } catch (requestError) {
      if (requestError instanceof AxiosError && !requestError.response) {
        setError("MeetingMind could not be reached. Please try again.");
      } else {
        setError("The request could not be completed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <KeyRound className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground">MeetingMind</span>
      </div>

      <Card className="border-border/60 shadow-xl shadow-black/5">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Reset your password
          </CardTitle>
          <CardDescription>
            Enter your account email to receive a single-use reset link.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isAccepted ? (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/10 p-4 text-sm text-foreground"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p>{ACCEPTED_MESSAGE}</p>
            </div>
          ) : (
            <form id="forgot-password-form" onSubmit={handleSubmit} noValidate>
              <div className="space-y-1.5">
                <label htmlFor="forgot-email" className="text-sm font-medium text-foreground">
                  Email address
                </label>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError("");
                  }}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "forgot-email-error" : undefined}
                  disabled={isLoading}
                  required
                />
                {error && (
                  <p id="forgot-email-error" role="alert" className="text-xs text-destructive">
                    {error}
                  </p>
                )}
              </div>

              <Button className="mt-4 h-10 w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter>
          <Link
            href="/login"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
