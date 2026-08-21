import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { runQuery, type QueryResult } from "@/lib/database";
import type { Product } from "@/lib/products";

const DEFAULT_SQL = "select * from users limit 50";

export function DatabaseBrowser({ product }: { product: Product }) {
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      setResult(await runQuery(product.id, sql));
    } catch (e) {
      setResult(null);
      setError(String(e));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div
      className="flex h-full flex-col"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          run();
        }
      }}
    >
      <div className="flex items-start gap-2 border-b p-3">
        <Textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          rows={3}
          className="flex-1 font-mono text-sm"
          placeholder="select * from users"
        />
        <Button size="sm" onClick={run} disabled={running}>
          {running ? "Running…" : "Run (⌘⏎)"}
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        {error && <p className="p-4 text-sm text-destructive">{error}</p>}
        {!error && result && result.rows.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No rows.</p>
        )}
        {!error && result && result.rows.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                {result.columns.map((c) => (
                  <TableHead key={c} className="font-mono">
                    {c}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j} className="font-mono text-xs">
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
