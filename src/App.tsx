import { useEffect, useState } from "react";
import { ProjectsHome } from "@/components/projects-home";
import { ProductWorkspace } from "@/components/product-workspace";
import { Toaster } from "@/components/ui/sonner";
import { listProducts, type Product } from "@/lib/products";
import { checkForUpdate } from "@/lib/updater";
import { toast } from "sonner";

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((e) => toast.error(String(e)));
  }, []);

  useEffect(() => {
    checkForUpdate()
      .then((update) => {
        if (!update) return;
        toast(`Anvil ${update.version} is available`, {
          action: {
            label: "Install & restart",
            onClick: () => {
              toast.promise(update.install(), {
                loading: "Installing update…",
                success: "Restarting…",
                error: (e) => String(e),
              });
            },
          },
        });
      })
      .catch((e) => console.error("update check failed", e));
  }, []);

  const selected = products.find((p) => p.id === selectedId) ?? null;

  return (
    <main className="flex h-screen w-screen bg-background text-foreground">
      {selected ? (
        <ProductWorkspace
          key={selected.id}
          product={selected}
          onBack={() => setSelectedId(null)}
        />
      ) : (
        <ProjectsHome
          products={products}
          onSelect={setSelectedId}
          onAdded={(p) => {
            setProducts((prev) => [...prev, p]);
            setSelectedId(p.id);
          }}
          onRemoved={(id) => {
            setProducts((prev) => prev.filter((p) => p.id !== id));
            setSelectedId((cur) => (cur === id ? null : cur));
          }}
        />
      )}
      <Toaster />
    </main>
  );
}

export default App;
