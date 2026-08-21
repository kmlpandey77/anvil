import { useEffect, useState } from "react";
import { History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { listSnippets, saveSnippet, deleteSnippet, type Snippet } from "@/lib/snippets";
import type { Product } from "@/lib/products";
import { toast } from "sonner";

export function SnippetHistory({
  product,
  code,
  onLoad,
}: {
  product: Product;
  code: string;
  onLoad: (code: string) => void;
}) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  function refresh() {
    listSnippets(product.id)
      .then(setSnippets)
      .catch((e) => toast.error(String(e)));
  }

  useEffect(() => {
    setSnippets([]);
  }, [product.id]);

  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function save() {
    try {
      await saveSnippet(product.id, name, code);
      setName("");
      refresh();
      toast.success(`Saved "${name}"`);
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function remove(id: string) {
    try {
      await deleteSnippet(id);
      refresh();
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-1.5 h-4 w-4" />
          Snippets
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex items-center gap-2 border-b p-3">
          <Input
            placeholder="Save current as…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8"
          />
          <Button size="sm" className="h-8" onClick={save} disabled={!name.trim()}>
            Save
          </Button>
        </div>
        <ScrollArea className="max-h-64">
          <div className="flex flex-col gap-1 p-3">
            {snippets.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No saved snippets yet.
              </p>
            )}
            {snippets.map((s) => (
              <div
                key={s.id}
                className="group flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                <button
                  className="flex-1 truncate text-left"
                  onClick={() => {
                    onLoad(s.code);
                    setOpen(false);
                  }}
                >
                  {s.name}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => remove(s.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
