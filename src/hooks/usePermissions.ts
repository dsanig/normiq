import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type RpcClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};

const rpcClient = supabase as unknown as RpcClient;

interface PermissionsState {
  isLoading: boolean;
  isSuperadmin: boolean;
  isAdministrador: boolean;
  isEditor: boolean;
  canManageCompany: boolean;
  canEditContent: boolean;
  isViewer: boolean;
  canManagePasswords: boolean;
  refreshPermissions: () => Promise<void>;
}

export function usePermissions(): PermissionsState {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isAdministrador, setIsAdministrador] = useState(false);
  const [isEditor, setIsEditor] = useState(false);

  const hasTenantRole = async (userId: string, role: string) => {
    const calls = [
      rpcClient.rpc("has_role", { uid: userId, r: role }),
      rpcClient.rpc("has_role", { _user_id: userId, _role: role }),
    ];
    for (const call of calls) {
      const res = await call;
      if (!res.error) return Boolean(res.data);
    }
    return false;
  };

  const refreshPermissions = useCallback(async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      setIsSuperadmin(false);
      setIsAdministrador(false);
      setIsEditor(false);
      setIsLoading(false);
      return;
    }

    const userId = session.user.id;
    const [superRes, adminRole, editorRole] = await Promise.all([
      rpcClient.rpc("is_superadmin", { uid: userId }),
      hasTenantRole(userId, "Admin"),
      hasTenantRole(userId, "Editor"),
    ]);

    setIsSuperadmin(!superRes.error && Boolean(superRes.data));
    setIsAdministrador(adminRole);
    setIsEditor(editorRole);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refreshPermissions();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void refreshPermissions();
    });
    return () => subscription.unsubscribe();
  }, [refreshPermissions]);

  const canManageCompany = isSuperadmin || isAdministrador;
  const canEditContent = canManageCompany || isEditor;

  return {
    isLoading,
    isSuperadmin,
    isAdministrador,
    isEditor,
    canManageCompany,
    canEditContent,
    isViewer: !canEditContent,
    canManagePasswords: isSuperadmin,
    refreshPermissions,
  };
}
