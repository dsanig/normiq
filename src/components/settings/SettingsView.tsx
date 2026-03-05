import { Globe, UserCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { ISOConfigurationPanel } from "./ISOConfigurationPanel";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function SettingsView() {
  const { user } = useAuth();
  const { isSuperadmin, isAdministrador, isEditor } = usePermissions();
  const [companyId, setCompanyId] = useState<string>("");
  const [diag, setDiag] = useState<{ tenant_roles: string; company_id: string | null } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      const [{ data: profile }, { data: diagData }] = await Promise.all([
        (supabase as any).from("profiles").select("company_id").eq("id", user.id).maybeSingle(),
        (supabase as any).from("auth_diagnostic_view").select("tenant_roles, company_id").eq("user_id", user.id).maybeSingle(),
      ]);

      setCompanyId(profile?.company_id ?? "");
      setDiag(diagData ?? null);
    };

    void load();
  }, [user?.id]);

  const roleName = isSuperadmin ? "Superadmin" : isAdministrador ? "Admin" : isEditor ? "Editor" : "Lector";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card rounded-lg border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-accent" />
          <div>
            <h3 className="font-semibold text-foreground">Idioma de la interfaz</h3>
            <p className="text-sm text-muted-foreground">QualiQ está configurado en español para todos los usuarios.</p>
          </div>
        </div>
        <div className="max-w-xs rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground">Idioma activo: Español</div>
      </div>

      <ISOConfigurationPanel companyId={companyId} canEdit={isSuperadmin || isAdministrador} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <UserCircle className="w-5 h-5 text-accent" />
            <div>
              <h3 className="font-semibold text-foreground">Perfil del usuario</h3>
              <p className="text-sm text-muted-foreground">Datos de cuenta y acceso.</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Usuario:</span> {user?.email ?? "—"}</p>
            <p><span className="font-medium text-foreground">Rol:</span> {roleName}</p>
            <p><span className="font-medium text-foreground">Tenant:</span> {diag?.company_id ?? "—"}</p>
          </div>
          <Button variant="outline">Actualizar perfil</Button>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <div>
              <h3 className="font-semibold text-foreground">Diagnóstico de autorización</h3>
              <p className="text-sm text-muted-foreground">Visible en detalle para superadmin.</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Usuario autenticado:</span> {user?.id ?? "—"}</p>
            <p><span className="font-medium text-foreground">Roles tenant:</span> {diag?.tenant_roles ?? "Lector"}</p>
            <p><span className="font-medium text-foreground">Modo:</span> {isSuperadmin ? "Diagnóstico completo" : "Básico"}</p>
            {isSuperadmin && <p><span className="font-medium text-foreground">Última denegación:</span> No registrada</p>}
          </div>
          <Button variant="outline">Revisar seguridad</Button>
        </div>
      </div>
    </div>
  );
}
