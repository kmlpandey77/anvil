import { cn } from "@/lib/utils";

export type RunStatus = "idle" | "running" | "success" | "error";

const STATUS_CLASS: Record<RunStatus, string> = {
  idle: "bg-muted-foreground/40",
  running: "bg-primary animate-pulse",
  success: "bg-emerald-500",
  error: "bg-destructive",
};

export function StatusDot({ status }: { status: RunStatus }) {
  return (
    <span
      className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_CLASS[status])}
      aria-hidden="true"
    />
  );
}
