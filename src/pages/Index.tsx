import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LandingPage } from "@/components/landing/LandingPage";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { DocumentsView } from "@/components/documents/DocumentsView";
import { IncidentsView } from "@/components/incidents/IncidentsView";
import { ChatbotView } from "@/components/chatbot/ChatbotView";
import { useAuth } from "@/hooks/useAuth";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { FilterModal, type FiltersState } from "@/components/filters/FilterModal";
import { useCompanyFeatures } from "@/hooks/useCompanyFeatures";
import { PendingActionsView } from "@/components/dashboard/PendingActionsView";
import { CompanyView } from "@/components/company/CompanyView";
import { SettingsView } from "@/components/settings/SettingsView";
import { TrainingExamView } from "@/components/training/TrainingExamView";
import { PredictiveAnalyticsView } from "@/components/analytics/PredictiveAnalyticsView";
import { AuditManagementView } from "@/components/audit/AuditManagementView";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ISOComplianceView } from "@/components/compliance/ISOComplianceView";

const moduleConfig: Record<string, { title: string; subtitle?: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Visión general del sistema de gestión" },
  documents: { title: "Documentos", subtitle: "Procedimientos, formatos, políticas y registros" },
  processes: { title: "Procesos", subtitle: "Mapa de procesos y subprocesos" },
  "iso-compliance": { title: "Cumplimiento ISO", subtitle: "Cláusulas, controles y evidencias" },
  incidents: { title: "No Conformidades", subtitle: "Registro, análisis y seguimiento" },
  actions: { title: "Acciones", subtitle: "CAPA, preventivas y mejora" },
  audits: { title: "Auditorías", subtitle: "Planificación, checklist y hallazgos" },
  training: { title: "Formación", subtitle: "Competencias y evidencias de entrenamiento" },
  "predictive-analytics": { title: "Riesgos y Oportunidades", subtitle: "Evaluación y priorización" },
  chatbot: { title: "Asistente IA", subtitle: "Consultas sobre procesos, cláusulas y evidencias" },
  company: { title: "Empresa", subtitle: "Configuración y datos de la organización" },
  settings: { title: "Configuración", subtitle: "Preferencias, ISO y diagnóstico" },
  "pending-actions": { title: "Acciones Pendientes", subtitle: "Seguimiento de tareas y verificaciones" },
};

type IncidentType = "incidencia" | "reclamacion" | "desviacion" | "otra";

const Index = () => {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [moduleSearchQueries, setModuleSearchQueries] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<FiltersState>({ category: "all", documentStatus: "all", signatureStatus: "all", incidentArea: "all", incidentStatus: "all", incidentPriority: "all" });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isNewDocumentOpen, setIsNewDocumentOpen] = useState(false);
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [incidentViewResetSeed, setIncidentViewResetSeed] = useState(0);
  const [incidentTypeSeed, setIncidentTypeSeed] = useState<IncidentType | undefined>(undefined);
  const { user, isLoading } = useAuth();
  const { enabledFeatures } = useCompanyFeatures();
  const navigate = useNavigate();

  useInactivityLogout();

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Cargando...</div></div>;
  if (!user) return <LandingPage onGetStarted={() => navigate("/auth")} />;

  const currentModule = moduleConfig[activeModule] || moduleConfig.dashboard;
  const activeSearchQuery = moduleSearchQueries[activeModule] ?? "";

  const searchPlaceholder = activeModule === "documents" ? "Buscar documentos..."
    : activeModule === "processes" ? "Buscar procesos..."
    : activeModule === "incidents" ? "Buscar no conformidades..."
    : activeModule === "audits" ? "Buscar auditorías..."
    : activeModule === "actions" ? "Buscar acciones..."
    : "Buscar documentos, procesos...";

  const handleQuickAction = (action: string) => {
    if (action === "Nuevo Procedimiento") {
      setActiveModule("documents");
      setIsNewDocumentOpen(true);
    } else if (action === "Registrar Incidencia") {
      setActiveModule("incidents");
      setIncidentTypeSeed("incidencia");
      setIsNewIncidentOpen(true);
    } else if (action === "Crear CAPA") {
      setActiveModule("actions");
    }
  };

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <DashboardView onQuickAction={handleQuickAction} onViewPendingActions={() => setActiveModule("pending-actions")} onViewIncidents={() => setActiveModule("incidents")} onNavigateToDocument={(code) => { setModuleSearchQueries((p) => ({ ...p, documents: code })); setActiveModule("documents"); }} />;
      case "documents":
        return <DocumentsView searchQuery={activeSearchQuery} onSearchChange={(v) => setModuleSearchQueries((p) => ({ ...p, [activeModule]: v }))} filters={filters} onFiltersChange={setFilters} onOpenFilters={() => setIsFilterOpen(true)} isNewDocumentOpen={isNewDocumentOpen} onNewDocumentOpenChange={setIsNewDocumentOpen} />;
      case "processes":
        return <DocumentsView mode="processes" searchQuery={activeSearchQuery} onSearchChange={(v) => setModuleSearchQueries((p) => ({ ...p, [activeModule]: v }))} filters={filters} onFiltersChange={setFilters} onOpenFilters={() => setIsFilterOpen(true)} isNewDocumentOpen={isNewDocumentOpen} onNewDocumentOpenChange={setIsNewDocumentOpen} />;
      case "iso-compliance":
        return <ISOComplianceView searchQuery={activeSearchQuery} />;
      case "incidents":
        return <ErrorBoundary title="Error cargando No Conformidades" description="Se produjo un problema inesperado al abrir el módulo." retryLabel="Reintentar" onRetry={() => setIncidentViewResetSeed((p) => p + 1)} resetKeys={[incidentViewResetSeed, activeModule]}><IncidentsView key={`incidents-${incidentViewResetSeed}`} searchQuery={activeSearchQuery} onSearchChange={(v) => setModuleSearchQueries((p) => ({ ...p, [activeModule]: v }))} filters={filters} onFiltersChange={setFilters} onOpenFilters={() => setIsFilterOpen(true)} isNewIncidentOpen={isNewIncidentOpen} onNewIncidentOpenChange={setIsNewIncidentOpen} initialIncidentType={incidentTypeSeed} reloadToken={incidentViewResetSeed} /></ErrorBoundary>;
      case "audits":
        return <AuditManagementView searchQuery={activeSearchQuery} />;
      case "actions":
      case "pending-actions":
        return <PendingActionsView />;
      case "chatbot": return <ChatbotView />;
      case "training": return <TrainingExamView />;
      case "predictive-analytics": return <PredictiveAnalyticsView />;
      case "company": return <CompanyView />;
      case "settings": return <SettingsView />;
      default: return <div className="flex items-center justify-center h-64 bg-card rounded-lg border border-border"><p className="text-muted-foreground">Módulo en desarrollo</p></div>;
    }
  };

  return (
    <AppLayout
      activeModule={activeModule}
      onModuleChange={setActiveModule}
      title={currentModule.title}
      subtitle={currentModule.subtitle}
      searchQuery={activeSearchQuery}
      onSearchChange={(v) => setModuleSearchQueries((p) => ({ ...p, [activeModule]: v }))}
      onSearchSubmit={() => null}
      onSearchClear={() => setModuleSearchQueries((p) => ({ ...p, [activeModule]: "" }))}
      searchPlaceholder={searchPlaceholder}
      enabledFeatures={enabledFeatures}
    >
      {renderModule()}
      <FilterModal open={isFilterOpen} onOpenChange={setIsFilterOpen} filters={filters} onFiltersChange={setFilters} />
    </AppLayout>
  );
};

export default Index;
