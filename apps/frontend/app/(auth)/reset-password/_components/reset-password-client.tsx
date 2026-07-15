"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
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

interface FieldErrors {
  password?: string;
  confirmation?: string;
}

const INVALID_TOKEN_MESSAGE =
  "This password reset link is invalid, expired, or has already been used.";

export default function ResetPasswordClient() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const resetToken = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    window.history.replaceState(window.history.state, "", "/reset-password");
    // The fragment is browser-only, so it can be captured only after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(resetToken);
  }, []);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    } else if (!/\d/.test(password)) {
      errors.password = "Password must include a number.";
    }
    if (!confirmation) {
      errors.confirmation = "Confirm your new password.";
    } else if (confirmation !== password) {
      errors.confirmation = "Passwords do not match.";
    }
    return errors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);
    try {
      await apiClient.post<ApiResponse<StatusResponse>>("/auth/password/reset", {
        token,
        new_password: password,
      });
      setIsComplete(true);
      setPassword("");
      setConfirmation("");
    } catch {
      setRequestError(INVALID_TOKEN_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }

  const hasToken = Boolean(token);

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
            Choose a new password
          </CardTitle>
          <CardDescription>
            Use at least 8 characters and include a number.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isComplete ? (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/10 p-4 text-sm text-foreground"
            >
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p>Your password has been reset. You can now sign in with the new password.</p>
            </div>
          ) : token === null ? (
            <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking password reset link...
            </div>
          ) : !hasToken ? (
            <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {INVALID_TOKEN_MESSAGE}
            </div>
          ) : (
            <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
              {requestError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {requestError}
                </div>
              )}

              <PasswordField
                id="reset-password"
                label="New password"
                value={password}
                show={showPassword}
                error={fieldErrors.password}
                onToggle={() => setShowPassword((current) => !current)}
                onChange={(value) => {
                  setPassword(value);
                  setFieldErrors((current) => ({ ...current, password: undefined }));
                }}
                disabled={isLoading}
              />

              <PasswordField
                id="reset-password-confirmation"
                label="Confirm new password"
                value={confirmation}
                show={showConfirmation}
                error={fieldErrors.confirmation}
                onToggle={() => setShowConfirmation((current) => !current)}
                onChange={(value) => {
                  setConfirmation(value);
                  setFieldErrors((current) => ({ ...current, confirmation: undefined }));
                }}
                disabled={isLoading}
              />

              <Button className="h-10 w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  "Reset password"
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter>
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isComplete ? "Continue to sign in" : "Back to sign in"}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  show: boolean;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}

function PasswordField({
  id,
  label,
  value,
  show,
  error,
  disabled,
  onChange,
  onToggle,
}: PasswordFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={error ? "border-destructive pr-10" : "pr-10"}
          disabled={disabled}
          required
        />
        <button
          type="button"
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={onToggle}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
