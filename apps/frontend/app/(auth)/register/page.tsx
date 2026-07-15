"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
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
import type { BootstrapStatus } from "@/types/api.types";

export default function RegisterPage() {
  const router = useRouter();
  const { register, getBootstrapStatus, isLoading, error, clearError } = useAuthStore();
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus | null>(null);
  const [statusError, setStatusError] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    workspaceName?: string;
    workspaceSlug?: string;
  }>({});

  useEffect(() => {
    void getBootstrapStatus()
      .then(setBootstrapStatus)
      .catch(() => setStatusError(true));
  }, [getBootstrapStatus]);

  function validate() {
    const errors: typeof fieldErrors = {};
    if (!fullName.trim()) errors.fullName = "Full name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    else if (!/\d/.test(password)) errors.password = "Password must include a number.";
    if (!workspaceName.trim()) errors.workspaceName = "Workspace name is required.";
    if (!workspaceSlug.trim()) errors.workspaceSlug = "Workspace slug is required.";
    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearError();

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await register({
        email,
        password,
        full_name: fullName,
        workspace_name: workspaceName,
        workspace_slug: workspaceSlug,
      });
      router.push("/dashboard");
    } catch {
      // Error already set in the store
    }
  }

  if (statusError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registration unavailable</CardTitle>
          <CardDescription>The backend could not be reached. Try again after it is running.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!bootstrapStatus) {
    return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" aria-label="Checking registration mode" />;
  }

  if (!bootstrapStatus.setup_required) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitation required</CardTitle>
          <CardDescription>
            Initial setup is complete. Ask your workspace owner for an invitation, or sign in if you already have an account.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            Go to sign in
          </Link>
        </CardFooter>
      </Card>
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
            Create your account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Start capturing and understanding your meetings
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            id="register-form"
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate
          >
            {/* API error banner */}
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Full name */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-name"
                className="text-sm font-medium text-foreground"
              >
                Full name
              </label>
              <Input
                id="register-name"
                type="text"
                autoComplete="name"
                placeholder="Prashant Bhavsar"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: undefined }));
                }}
                required
                disabled={isLoading}
                aria-describedby={fieldErrors.fullName ? "register-name-error" : undefined}
                className={fieldErrors.fullName ? "border-destructive" : ""}
              />
              {fieldErrors.fullName && (
                <p id="register-name-error" className="text-xs text-destructive">
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-email"
                className="text-sm font-medium text-foreground"
              >
                Work email
              </label>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                }}
                required
                disabled={isLoading}
                aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
                className={fieldErrors.email ? "border-destructive" : ""}
              />
              {fieldErrors.email && (
                <p id="register-email-error" className="text-xs text-destructive">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="register-workspace" className="text-sm font-medium text-foreground">
                  Workspace name
                </label>
                <Input
                  id="register-workspace"
                  value={workspaceName}
                  onChange={(event) => {
                    const name = event.target.value;
                    setWorkspaceName(name);
                    setWorkspaceSlug(
                      name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                    );
                  }}
                  placeholder="Engineering"
                  disabled={isLoading}
                  required
                />
                {fieldErrors.workspaceName && (
                  <p className="text-xs text-destructive">{fieldErrors.workspaceName}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="register-workspace-slug" className="text-sm font-medium text-foreground">
                  Workspace slug
                </label>
                <Input
                  id="register-workspace-slug"
                  value={workspaceSlug}
                  onChange={(event) => setWorkspaceSlug(event.target.value.toLowerCase())}
                  placeholder="engineering"
                  disabled={isLoading}
                  required
                />
                {fieldErrors.workspaceSlug && (
                  <p className="text-xs text-destructive">{fieldErrors.workspaceSlug}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  required
                  disabled={isLoading}
                  aria-describedby={fieldErrors.password ? "register-password-error" : "register-password-hint"}
                  className={`pr-10 ${fieldErrors.password ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password ? (
                <p id="register-password-error" className="text-xs text-destructive">
                  {fieldErrors.password}
                </p>
              ) : (
                <p id="register-password-hint" className="text-xs text-muted-foreground">
                  Must be at least 8 characters.
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              id="register-submit"
              type="submit"
              form="register-form"
              className="w-full h-10 font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
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
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Sign in
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
