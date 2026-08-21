import { useState } from "react";
import { WorkspaceNav, type WorkspaceSection } from "@/components/workspace-nav";
import { SnippetRunner } from "@/components/snippet-runner";
import { ArtisanRunner } from "@/components/artisan-runner";
import { LogViewer } from "@/components/log-viewer";
import type { Product } from "@/lib/products";

export function ProductWorkspace({
  product,
  onBack,
}: {
  product: Product;
  onBack: () => void;
}) {
  const [section, setSection] = useState<WorkspaceSection>("tinker");

  return (
    <div className="flex h-full w-full">
      <WorkspaceNav active={section} onSelect={setSection} onBack={onBack} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b px-4 py-2">
          <span className="text-sm font-medium">{product.name}</span>
        </div>
        <div className="flex-1 overflow-hidden">
          {section === "tinker" && <SnippetRunner product={product} />}
          {section === "artisan" && <ArtisanRunner product={product} />}
          {section === "logs" && <LogViewer product={product} />}
        </div>
      </div>
    </div>
  );
}
