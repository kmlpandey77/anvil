import { useEffect, useState } from "react";
import { ProductsSidebar } from "@/components/products-sidebar";
import { ProductWorkspace } from "@/components/product-workspace";
import { Toaster } from "@/components/ui/sonner";
import { listProducts, type Product } from "@/lib/products";
import { toast } from "sonner";

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((e) => toast.error(String(e)));
  }, []);

  const selected = products.find((p) => p.id === selectedId) ?? null;

  return (
    <main className="flex h-screen w-screen bg-background text-foreground">
      <ProductsSidebar
        products={products}
        selectedId={selectedId}
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
      <div className="flex flex-1 flex-col">
        {selected ? (
          <ProductWorkspace key={selected.id} product={selected} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <p>Select or add a product to get started.</p>
          </div>
        )}
      </div>
      <Toaster />
    </main>
  );
}

export default App;
