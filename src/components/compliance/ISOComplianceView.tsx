import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props { searchQuery: string }

export function ISOComplianceView({ searchQuery }: Props) {
  const [rows, setRows] = useState<Array<{ standard: string; clause_code: string; title: string }>>([]);

  useEffect(() => {
    const load = async () => {
      let query = (supabase as any).from("iso_requirements").select("standard, clause_code, title").limit(50);
      if (searchQuery) query = query.ilike("title", `%${searchQuery}%`);
      const { data } = await query;
      setRows(data ?? []);
    };
    void load();
  }, [searchQuery]);

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold mb-2">Matriz de Cumplimiento ISO</h3>
      <p className="text-sm text-muted-foreground mb-4">Cláusulas, requisitos internos, controles y evidencias vinculadas.</p>
      <div className="space-y-2">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Sin requisitos configurados para este tenant.</p>}
        {rows.map((row) => (
          <div key={`${row.standard}-${row.clause_code}`} className="rounded border border-border p-3">
            <p className="font-medium">{row.standard} · {row.clause_code}</p>
            <p className="text-sm text-muted-foreground">{row.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
