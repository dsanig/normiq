import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const STANDARDS = ["ISO 9001", "ISO 14001", "ISO 27001", "ISO 45001"] as const;

interface Props {
  companyId: string;
  canEdit: boolean;
}

export function ISOConfigurationPanel({ companyId, canEdit }: Props) {
  const { toast } = useToast();
  const [activeStandards, setActiveStandards] = useState<string[]>(["ISO 9001"]);
  const [documentTypes, setDocumentTypes] = useState("Procedimiento,Instrucción,Formato,Política,Registro,Plantilla");
  const [minReviewers, setMinReviewers] = useState("1");
  const [minApprovers, setMinApprovers] = useState("1");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("tenant_iso_settings")
        .select("active_standards, allowed_document_types, approval_flow")
        .eq("company_id", companyId)
        .maybeSingle();

      if (data) {
        setActiveStandards(data.active_standards ?? ["ISO 9001"]);
        setDocumentTypes((data.allowed_document_types ?? []).join(","));
        setMinReviewers(String(data.approval_flow?.min_reviewers ?? 1));
        setMinApprovers(String(data.approval_flow?.min_approvers ?? 1));
      }
    };

    if (companyId) void load();
  }, [companyId]);

  const toggleStandard = (standard: string, enabled: boolean) => {
    setActiveStandards((prev) =>
      enabled ? [...new Set([...prev, standard])] : prev.filter((s) => s !== standard),
    );
  };

  const save = async () => {
    setLoading(true);
    const payload = {
      company_id: companyId,
      active_standards: activeStandards.length ? activeStandards : ["ISO 9001"],
      allowed_document_types: documentTypes
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      approval_flow: {
        min_reviewers: Math.max(1, Number(minReviewers) || 1),
        min_approvers: Math.max(1, Number(minApprovers) || 1),
        review_rule: "all",
      },
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase as any)
      .from("tenant_iso_settings")
      .upsert(payload, { onConflict: "company_id" });

    setLoading(false);

    if (error) {
      toast({ title: "Error al guardar configuración ISO", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Configuración ISO actualizada" });
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4">
      <h3 className="font-semibold text-foreground">Configuración ISO</h3>
      <p className="text-sm text-muted-foreground">Configura normas activas, tipos documentales y flujo de aprobación por empresa.</p>

      <div className="space-y-2">
        <Label>Normas activas</Label>
        <div className="grid grid-cols-2 gap-3">
          {STANDARDS.map((standard) => (
            <div key={standard} className="flex items-center justify-between rounded border border-border p-2">
              <span className="text-sm">{standard}</span>
              <Switch
                checked={activeStandards.includes(standard)}
                onCheckedChange={(checked) => toggleStandard(standard, checked)}
                disabled={!canEdit}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tipos de documento permitidos (separados por coma)</Label>
        <Input value={documentTypes} onChange={(e) => setDocumentTypes(e.target.value)} disabled={!canEdit} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Mínimo revisores</Label>
          <Input type="number" min={1} value={minReviewers} onChange={(e) => setMinReviewers(e.target.value)} disabled={!canEdit} />
        </div>
        <div className="space-y-2">
          <Label>Mínimo aprobadores</Label>
          <Input type="number" min={1} value={minApprovers} onChange={(e) => setMinApprovers(e.target.value)} disabled={!canEdit} />
        </div>
      </div>

      <Button onClick={save} disabled={!canEdit || loading}>
        <Save className="w-4 h-4 mr-2" />
        Guardar configuración ISO
      </Button>
    </div>
  );
}
