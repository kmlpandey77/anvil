import { ArrowLeft, Code2, KeyRound, ScrollText, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/components/settings-dialog";
import { AboutDialog } from "@/components/about-dialog";
import { cn } from "@/lib/utils";

export type WorkspaceSection = "tinker" | "artisan" | "logs" | "env";

const SECTIONS: { id: WorkspaceSection; label: string; icon: typeof Code2 }[] = [
  { id: "tinker", label: "Tinker", icon: Code2 },
  { id: "artisan", label: "Artisan", icon: Terminal },
  { id: "logs", label: "Logs", icon: ScrollText },
  { id: "env", label: ".env", icon: KeyRound },
];

export function WorkspaceNav({
  active,
  onSelect,
  onBack,
}: {
  active: WorkspaceSection;
  onSelect: (section: WorkspaceSection) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full w-14 flex-col items-center border-r py-3">
      <Button variant="ghost" size="icon" className="mb-3 h-9 w-9" title="Back to projects" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex flex-1 flex-col gap-1">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            size="icon"
            title={label}
            className={cn("h-9 w-9", active === id && "bg-accent")}
            onClick={() => onSelect(id)}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
      <AboutDialog />
      <SettingsDialog />
    </div>
  );
}
