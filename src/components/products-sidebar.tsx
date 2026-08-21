import { Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ProductsSidebar({
  products,
  selectedId,
  onSelect,
  onAdded,
  onRemoved,
}: {
  products: Product[];
  selectedId: string | null;
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
    <div className="flex h-full w-64 flex-col border-r">
      <div className="flex items-center gap-2 p-3">
        <div className="flex-1">
          <AddProductDialog onAdded={onAdded} />
        </div>
        <SettingsDialog />
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 px-3 pb-3">
          {products.length === 0 && (
            <p className="text-sm text-muted-foreground px-1">
              No products yet.
            </p>
          )}
          {products.map((p) => (
            <div
              key={p.id}
              className={cn(
                "group flex items-center justify-between rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
                selectedId === p.id && "bg-accent",
              )}
              onClick={() => onSelect(p.id)}
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{p.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {p.path}
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove "{p.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This only removes the saved connection — nothing on
                      disk is touched.
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
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
