import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addProduct, type Product } from "@/lib/products";
import { toast } from "sonner";

export function AddProductDialog({
  onAdded,
}: {
  onAdded: (product: Product) => void;
}) {
  const [open_, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [phpBinary, setPhpBinary] = useState("php");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setName("");
    setPath("");
    setPhpBinary("php");
    setError(null);
  }

  async function pickFolder() {
    const dir = await open({ directory: true, multiple: false });
    if (typeof dir === "string") {
      setPath(dir);
      if (!name) {
        setName(dir.split("/").filter(Boolean).pop() ?? "");
      }
    }
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const product = await addProduct({ name, path, phpBinary });
      onAdded(product);
      toast.success(`Added "${product.name}"`);
      reset();
      setOpen(false);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open_}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          + Add product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="path">Project path</Label>
            <div className="flex gap-2">
              <Input
                id="path"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/path/to/laravel-app"
              />
              <Button type="button" variant="secondary" onClick={pickFolder}>
                Browse
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My App"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="php">PHP binary</Label>
            <Input
              id="php"
              value={phpBinary}
              onChange={(e) => setPhpBinary(e.target.value)}
              placeholder="php"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving || !path || !name}>
            {saving ? "Adding…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
