import { useEffect, useState } from "react";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Incident {
  id: string;
  title: string;
  incidencia_type: string;
  status: string;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  open: "Abierto",
  in_progress: "En Progreso",
  closed: "Cerrado",
};

const typeLabels: Record<string, string> = {
  incidencia: "Incidencia",
  desviacion: "Desviación",
  reclamacion: "Reclamación",
  otra: "Otra",
};

interface RecentIncidentsProps {
  onViewAll: () => void;
  onSelectIncident: (incidentId: string) => void;
}

export function RecentIncidents({ onViewAll, onSelectIncident }: RecentIncidentsProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await (supabase as any)
        .from("incidencias")
        .select("id, title, incidencia_type, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      setIncidents((data as Incident[]) ?? []);
      setIsLoading(false);
    }
    void fetch();
  }, []);

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Incidencias Recientes</h3>
        </div>
        <Button variant="ghost" size="sm" className="text-accent" onClick={onViewAll}>
          Ver todas
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Cargando...</div>
        ) : incidents.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No hay incidencias registradas</div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc.id}
              className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => onSelectIncident(inc.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("badge-status", {
                      "badge-open": inc.status === "open",
                      "badge-progress": inc.status === "in_progress",
                      "badge-closed": inc.status === "closed",
                    })}>
                      {statusLabels[inc.status] || inc.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{inc.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {typeLabels[inc.incidencia_type] || inc.incidencia_type}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(inc.created_at), "dd/MM/yyyy")}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
