import { useEffect, useState } from "react";
import { Shield, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function ComplianceScore() {
  const [docsPct, setDocsPct] = useState(0);
  const [incPct, setIncPct] = useState(0);
  const [actionsPct, setActionsPct] = useState(0);

  useEffect(() => {
    async function fetch() {
      const [totalDocsRes, approvedDocsRes, totalIncRes, closedIncRes, totalActRes, closedActRes] = await Promise.all([
        (supabase as any).from("documents").select("id", { count: "exact", head: true }),
        (supabase as any).from("documents").select("id", { count: "exact", head: true }).eq("status", "approved"),
        (supabase as any).from("incidencias").select("id", { count: "exact", head: true }),
        (supabase as any).from("incidencias").select("id", { count: "exact", head: true }).eq("status", "closed"),
        (supabase as any).from("actions").select("id", { count: "exact", head: true }),
        (supabase as any).from("actions").select("id", { count: "exact", head: true }).eq("status", "closed"),
      ]);

      const totalDocs = totalDocsRes.count ?? 0;
      const approved = approvedDocsRes.count ?? 0;
      const totalInc = totalIncRes.count ?? 0;
      const closedInc = closedIncRes.count ?? 0;
      const totalAct = totalActRes.count ?? 0;
      const closedAct = closedActRes.count ?? 0;

      setDocsPct(totalDocs > 0 ? Math.round((approved / totalDocs) * 100) : 0);
      setIncPct(totalInc > 0 ? Math.round((closedInc / totalInc) * 100) : 0);
      setActionsPct(totalAct > 0 ? Math.round((closedAct / totalAct) * 100) : 0);
    }
    void fetch();
  }, []);

  const score = Math.round((docsPct + incPct + actionsPct) / 3);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Índice de Cumplimiento</h3>
      </div>

      <div className="flex items-center justify-center py-4">
        <div className="relative">
          <svg className="w-32 h-32 -rotate-90">
            <circle cx="64" cy="64" r="45" stroke="currentColor" strokeWidth="10" fill="none" className="text-secondary" />
            <circle cx="64" cy="64" r="45" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"
              className="text-accent transition-all duration-1000"
              style={{ strokeDasharray: circumference, strokeDashoffset }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{score}%</span>
            <span className="text-xs text-muted-foreground">Puntuación</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {[
          { label: "Documentación", pct: docsPct, color: "bg-success" },
          { label: "Incidencias resueltas", pct: incPct, color: "bg-accent" },
          { label: "Acciones cerradas", pct: actionsPct, color: "bg-warning" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
              </div>
              <span className="text-foreground font-medium">{item.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
