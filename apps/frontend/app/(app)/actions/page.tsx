import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import ActionsClient from "./_components/actions-client";

export const metadata: Metadata = { title: "Action Items" };

export default function ActionsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center gap-3">
            <ListChecks className="h-5 w-5 text-muted-foreground" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Action Items</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                All action items across your workspace
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl w-full px-6 py-6">
        <ActionsClient />
      </div>
    </div>
  );
}
