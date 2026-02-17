import { useEffect, useState } from "react";
import { CheckCircle2, Clock, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PendingAction {
  id: string;
  description: string;
  action_type: string;
  due_date: string | null;
  status: string;
  isOverdue: boolean;
}

const typeIcons: Record<string, typeof CheckCircle2> = {
  immediate: AlertCircle,
  corrective: FileText,
  preventive: CheckCircle2,
};

const typeLabels: Record<string, string> = {
  immediate: "Inmediata",
  corrective: "Correctiva",
  preventive: "Preventiva",
};

interface PendingActionsProps {
  onViewAll: () => void;
}

export function PendingActions({ onViewAll }: PendingActionsProps) {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await (supabase as any)
        .from("actions")
        .select("id, description, action_type, due_date, status")
        .in("status", ["open", "in_progress"])
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5);

      const now = new Date();
      setActions(
        ((data as any[]) ?? []).map((a) => ({
          ...a,
          isOverdue: a.due_date ? new Date(a.due_date) < now : false,
        }))
      );
      setIsLoading(false);
    }
    void fetch();
  }, []);

  const overdueCount = actions.filter((a) => a.isOverdue).length;

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Acciones Pendientes</h3>
        {overdueCount > 0 && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-destructive/10 text-destructive">
            {overdueCount} vencidas
          </span>
        )}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-4">Cargando...</div>
        ) : actions.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">No hay acciones pendientes</div>
        ) : (
          actions.map((action) => {
            const Icon = typeIcons[action.action_type] || FileText;
            return (
              <div
                key={action.id}
                className={cn(
                  "p-3 rounded-lg border transition-colors cursor-pointer",
                  action.isOverdue
                    ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                    : "border-border hover:bg-secondary/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn("w-4 h-4 mt-0.5", action.isOverdue ? "text-destructive" : "text-muted-foreground")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{action.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{typeLabels[action.action_type] || action.action_type}</span>
                      {action.due_date && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className={cn("text-xs flex items-center gap-1", action.isOverdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                            <Clock className="w-3 h-3" />
                            {format(new Date(action.due_date), "dd/MM/yyyy")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Button variant="outline" className="w-full mt-4" onClick={onViewAll}>
        Ver todas las acciones
      </Button>
    </div>
  );
}
