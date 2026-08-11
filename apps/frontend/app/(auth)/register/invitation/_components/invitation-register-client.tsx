"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import type { InvitationValidation } from "@/types/api.types";

interface FieldErrors {
  fullName?: string;
  password?: string;
}

const EXPIRED_TOKEN_MESSAGE =
  "This invitation link is invalid, expired, or has already been used.";

export default function InvitationRegisterClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { acceptInvitation, validateInvitation, isLoading: storeLoading, error: storeError, clearError } = useAuthStore();

  const [invitation, setInvitation] = useState<InvitationValidation | null>(null);
  const [validating, setValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkInvitation() {
      if (!token) {
        if (!cancelled) {
          setValidationError(EXPIRED_TOKEN_MESSAGE);
          setValidating(false);
        }
        return;
      }

      try {
        const data = await validateInvitation(token);
        if (!cancelled) {
          setInvitation(data);
        }
      } catch {
        if (!cancelled) {
          setValidationError(EXPIRED_TOKEN_MESSAGE);
        }
      } finally {
        if (!cancelled) {
          setValidating(false);
        }
      }
    }

    void checkInvitation();

    return () => {
      cancelled = true;
    };
  }, [token, validateInvitation]);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!fullName.trim()) {
      errors.fullName = "Full name is required.";
    }
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    } else if (!/\d/.test(password)) {
      errors.password = "Password must include a number.";
    }
    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearError();
    setSubmitError("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!token) {
      setSubmitError(EXPIRED_TOKEN_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    try {
      await acceptInvitation({
        token,
        password,
        full_name: fullName,
      });
      setIsAccepted(true);
      setFullName("");
      setPassword("");
    } catch {
      setSubmitError(storeError || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Validating invitation…</span>
      </div>
    );
  }

  if (validationError || !invitation?.valid) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
          <span className="font-semibold text-foreground">MeetingMind</span>
        </div>

        <Card className="border-border/60 shadow-xl shadow-black/5">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight">Invalid invitation</CardTitle>
            <CardDescription className="text-muted-foreground">
              {validationError || EXPIRED_TOKEN_MESSAGE}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link
              href="/login"
              className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isAccepted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">MeetingMind</span>
        </div>

        <Card className="border-border/60 shadow-xl shadow-black/5">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight">Account created</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your account has been created. You can now sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div role="status" aria-live="polite" className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p>Welcome to {invitation.workspace_name}! Your account is ready.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Link
              href="/login"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>Continue to sign in</span>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
          <UserPlus className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground">MeetingMind</span>
      </div>

      <Card className="border-border/60 shadow-xl shadow-black/5">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Join {invitation.workspace_name}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            You&apos;ve been invited to join as {invitation.email}. Set your password to complete registration.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            id="invitation-register-form"
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate
          >
            {/* API error banner */}
            {storeError && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <span className="mt-0.5">⚠</span>
                <span>{storeError}</span>
              </div>
            )}

            {/* Submit error */}
            {submitError && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <span className="mt-0.5">⚠</span>
                <span>{submitError}</span>
              </div>
            )}

            {/* Full name */}
            <div className="space-y-1.5">
              <label
                htmlFor="invite-name"
                className="text-sm font-medium text-foreground"
              >
                Full name
              </label>
              <Input
                id="invite-name"
                type="text"
                autoComplete="name"
                placeholder="Prashant Bhavsar"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: undefined }));
                }}
                required
                disabled={isSubmitting || storeLoading}
                aria-describedby={fieldErrors.fullName ? "invite-name-error" : undefined}
                className={fieldErrors.fullName ? "border-destructive" : ""}
              />
              {fieldErrors.fullName && (
                <p id="invite-name-error" className="text-xs text-destructive">
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="invite-password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="invite-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters with a number"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  required
                  disabled={isSubmitting || storeLoading}
                  aria-describedby={fieldErrors.password ? "invite-password-error" : "invite-password-hint"}
                  className={`pr-10 ${fieldErrors.password ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  disabled={isSubmitting || storeLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password ? (
                <p id="invite-password-error" className="text-xs text-destructive">
                  {fieldErrors.password}
                </p>
              ) : (
                <p id="invite-password-hint" className="text-xs text-muted-foreground">
                  Must be at least 8 characters and include a number.
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              id="invite-register-submit"
              type="submit"
              form="invitation-register-form"
              className="w-full h-10 font-medium"
              disabled={isSubmitting || storeLoading}
            >
              {isSubmitting || storeLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="pt-0">
          <p className="text-center w-full text-sm text-muted-foreground">
            <Link
              href="/login"
              className="text-primary font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Already have an account? Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground px-4">
        Your data stays on your organization&apos;s infrastructure.{" "}
        <Link
          href="/privacy"
          className="underline hover:text-foreground transition-colors"
        >
          Learn about privacy
        </Link>
        .
      </p>
    </div>
  );
}