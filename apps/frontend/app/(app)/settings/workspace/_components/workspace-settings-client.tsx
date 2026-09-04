"use client";

import { useState } from "react";
import {
  Users,
  Mail,
  Shield,
  Trash2,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  useWorkspaceDetail,
  useWorkspaceMembers,
  useWorkspaceInvitations,
  useSendInvitation,
  useRevokeInvitation,
} from "@/lib/queries/workspace";
import type { WorkspaceRole } from "@/types/api.types";

const ROLE_BADGES: Record<WorkspaceRole, string> = {
  owner: "bg-primary/15 text-primary",
  admin: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  member: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  viewer: "bg-muted text-muted-foreground",
};

const ROLE_OPTIONS: WorkspaceRole[] = ["admin", "member", "viewer"];

export default function WorkspaceSettingsClient() {
  const { user } = useAuthStore();
  const workspaceId = user?.workspaces?.[0]?.id;

  const { data: workspace, isLoading: wsLoading } =
    useWorkspaceDetail(workspaceId);
  const { data: members, isLoading: membersLoading } =
    useWorkspaceMembers(workspaceId);
  const { data: invitations, isLoading: invitationsLoading } =
    useWorkspaceInvitations(workspaceId);

  const { mutateAsync: sendInvitation, isPending: isSending } =
    useSendInvitation();
  const { mutateAsync: revokeInvitation, isPending: isRevoking } =
    useRevokeInvitation();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("member");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [slugCopied, setSlugCopied] = useState(false);

  const userRole = user?.workspaces?.[0]?.role;
  const canManage = userRole === "owner" || userRole === "admin";

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess(false);
    if (!inviteEmail.trim() || !workspaceId) return;

    try {
      await sendInvitation({
        workspaceId,
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteEmail("");
      setInviteRole("member");
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err !== null && "response" in err
          ? (
              err as { response?: { data?: { detail?: string } } }
            ).response?.data?.detail || "Failed to send invitation."
          : "Failed to send invitation.";
      setInviteError(msg);
    }
  }

  async function handleRevoke(invitationId: string) {
    if (!workspaceId) return;
    try {
      await revokeInvitation({ workspaceId, invitationId });
      setRevokeTarget(null);
    } catch {
      // Silently fail — the query will refetch
    }
  }

  function copySlug() {
    if (workspace?.slug) {
      navigator.clipboard.writeText(workspace.slug);
      setSlugCopied(true);
      setTimeout(() => setSlugCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium">Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Manage your workspace settings and team members.
        </p>
      </div>

      {/* Workspace Info */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Details</CardTitle>
          <CardDescription>
            Basic information about your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {wsLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
          ) : workspace ? (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium">Name</label>
                <p className="text-sm text-foreground">{workspace.name}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Slug</label>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 text-sm text-foreground font-mono">
                    {workspace.slug}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={copySlug}
                    aria-label="Copy slug"
                  >
                    {slugCopied ? (
                      <Check className="h-3 w-3 text-primary" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Read-only in v1.
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No workspace found.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </CardTitle>
          <CardDescription>
            People who have access to this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-32 rounded bg-muted" />
                    <div className="h-2 w-20 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : members && members.length > 0 ? (
            <div className="space-y-3">
              {members.map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                    {m.full_name?.[0]?.toUpperCase() ?? m.email[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {m.full_name || "Unnamed"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {m.email}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                      ROLE_BADGES[m.role]
                    )}
                  >
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No members found.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Invite Form */}
      {canManage && (
        <Card>
          <form onSubmit={handleInvite}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Invite Member
              </CardTitle>
              <CardDescription>
                Send an invitation to join this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label htmlFor="invite-email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    required
                    disabled={isSending}
                  />
                </div>
                <div className="w-36 space-y-1">
                  <label htmlFor="invite-role" className="text-sm font-medium">
                    Role
                  </label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as WorkspaceRole)
                    }
                    disabled={isSending}
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {inviteError && (
                <p
                  className="text-sm text-destructive"
                  role="status"
                  aria-live="polite"
                >
                  {inviteError}
                </p>
              )}
              {inviteSuccess && (
                <p
                  className="text-sm text-primary"
                  role="status"
                  aria-live="polite"
                >
                  Invitation sent successfully.
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={isSending || !inviteEmail.trim()}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Invitation"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Pending Invitations
          </CardTitle>
          <CardDescription>
            Invitations that have not yet been accepted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitationsLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded bg-muted" />
                  <div className="h-3 w-32 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : invitations && invitations.filter((inv) => inv.status === "pending").length > 0 ? (
            <div className="space-y-2">
              {invitations
                .filter((inv) => inv.status === "pending")
                .map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">
                        {inv.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sent{" "}
                        {new Date(inv.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {" · Expires "}
                        {new Date(inv.expires_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                        ROLE_BADGES[inv.role]
                      )}
                    >
                      {inv.role}
                    </span>
                    {canManage && (
                      <Dialog
                        open={revokeTarget === inv.id}
                        onOpenChange={(open) =>
                          setRevokeTarget(open ? inv.id : null)
                        }
                      >
                        <DialogTrigger
                          render={
                            <Button
                              variant="destructive"
                              size="icon-xs"
                              disabled={isRevoking}
                              aria-label={`Revoke invitation for ${inv.email}`}
                            />
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Revoke Invitation</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to revoke the invitation for{" "}
                              <strong>{inv.email}</strong>? They will no longer
                              be able to use this invitation link.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setRevokeTarget(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleRevoke(inv.id)}
                              disabled={isRevoking}
                            >
                              {isRevoking ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                  Revoking...
                                </>
                              ) : (
                                "Revoke"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No pending invitations.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
