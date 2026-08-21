import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SnippetRunner } from "@/components/snippet-runner";
import { ArtisanRunner } from "@/components/artisan-runner";
import type { Product } from "@/lib/products";

export function ProductWorkspace({ product }: { product: Product }) {
  return (
    <Tabs defaultValue="tinker" className="flex h-full flex-col gap-0">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">{product.name}</span>
        <TabsList>
          <TabsTrigger value="tinker">Tinker</TabsTrigger>
          <TabsTrigger value="artisan">Artisan</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="tinker" className="flex-1 overflow-hidden">
        <SnippetRunner product={product} />
      </TabsContent>
      <TabsContent value="artisan" className="flex-1 overflow-hidden">
        <ArtisanRunner product={product} />
      </TabsContent>
    </Tabs>
  );
}
