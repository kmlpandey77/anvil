import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <main className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Laravel Toolkit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Scaffold ready — Tauri + React + shadcn/ui.
          </p>
          <Button>It works</Button>
        </CardContent>
      </Card>
      <Toaster />
    </main>
  );
}

export default App;
