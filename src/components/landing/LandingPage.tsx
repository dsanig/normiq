import {
  Shield, FileText, AlertTriangle, BarChart3, MessageSquare,
  Lock, ArrowRight, Building2, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingPageProps {
  onGetStarted: () => void;
}

const features = [
  { icon: FileText, title: "Gestión Documental ISO", description: "Redacción asistida por IA, control de versiones, flujos de aprobación y trazabilidad completa." },
  { icon: AlertTriangle, title: "No Conformidades & CAPAs", description: "Registro, análisis de causa raíz, acciones correctivas y seguimiento hasta cierre." },
  { icon: Shield, title: "Control de Cambios", description: "Gestión controlada de cambios con impacto automático en documentación relacionada." },
  { icon: BarChart3, title: "Analítica de Cumplimiento", description: "KPIs en tiempo real, tendencias y scoring de preparación para auditorías." },
  { icon: MessageSquare, title: "Asistente IA", description: "Respuestas basadas en su documentación y normativa española/europea aplicable." },
  { icon: Lock, title: "Seguridad & RGPD", description: "Datos encriptados, control de acceso por roles y logs de auditoría completos." },
];

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <img src="/iQ_V1.svg" alt="QualiQ logo" className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">QualiQ</span>
          </div>
          <Button variant="accent" size="sm" onClick={onGetStarted}>
            Acceso al Sistema
          </Button>
        </div>
      </header>

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Ecosistema de Cumplimiento con IA
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 text-balance">
            Business Process & <span className="text-accent">ISO Compliance</span> DMS
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Plataforma multi-sector para manufactura, servicios, logística, consultoría, IT y retail.
            Documentos, procesos, auditorías y mejora continua en una sola plataforma.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button variant="hero" size="xl" onClick={onGetStarted}>
              Acceso al Sistema
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Basado en ISO 9001 y extensible a ISO 14001, ISO 27001 e ISO 45001
          </p>
        </div>
      </section>

      <section className="py-12 border-y border-border bg-secondary/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-6">Diseñado para organizaciones de múltiples sectores</p>
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-50">
            {["Manufactura", "Servicios", "Logística", "Consultoría", "Retail"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Todo lo que necesita para el cumplimiento</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Herramientas configurables para control documental, procesos de negocio y compliance ISO.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              ¿Listo para profesionalizar su sistema ISO?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Implemente un sistema de gestión basado en procesos, auditoría interna y mejora continua.
            </p>
            <Button variant="accent" size="xl" onClick={onGetStarted} className="bg-accent hover:bg-accent/90">
              Acceso al Sistema
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                <img src="/iQ_V1.svg" alt="QualiQ logo" className="w-4 h-4" />
              </div>
              <span className="font-bold text-foreground">QualiQ</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 QualiQ. Todos los derechos reservados. Conforme a RGPD.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
