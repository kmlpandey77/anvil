import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AddProductDialog } from "@/components/add-product-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { removeProduct, type Product } from "@/lib/products";
import { toast } from "sonner";

export function ProjectsHome({
  products,
  onSelect,
  onAdded,
  onRemoved,
}: {
  products: Product[];
  onSelect: (id: string) => void;
  onAdded: (product: Product) => void;
  onRemoved: (id: string) => void;
}) {
  async function handleRemove(id: string) {
    try {
      await removeProduct(id);
      onRemoved(id);
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col p-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Anvil</h1>
        <SettingsDialog />
      </div>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
        {products.map((p) => (
          <Card
            key={p.id}
            className="group relative cursor-pointer transition-colors hover:border-primary"
            onClick={() => onSelect(p.id)}
          >
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove "{p.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This only removes the saved connection — nothing on disk is
                    touched.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleRemove(p.id)}>
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <CardHeader>
              <CardTitle className="truncate">{p.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="truncate text-xs text-muted-foreground">{p.path}</p>
            </CardContent>
          </Card>
        ))}
        <AddProductDialog
          onAdded={onAdded}
          trigger={
            <Card className="flex cursor-pointer items-center justify-center border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
              <CardContent className="flex flex-col items-center gap-2 py-10">
                <Plus className="h-5 w-5" />
                <span className="text-sm">Add new project</span>
              </CardContent>
            </Card>
          }
        />
      </div>
    </div>
  );
}
