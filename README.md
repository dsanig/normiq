# QualiQ — Business Process & ISO Compliance DMS

QualiQ es una aplicación Lovable + Supabase para **gestión documental multi-sector** y **cumplimiento ISO**.

## Enfoque del producto

La plataforma está orientada a:
- Control documental (versionado, estados, trazabilidad)
- Gestión por procesos (mapa de procesos, owner, KPI opcional)
- Cumplimiento ISO (matriz de cláusulas, controles y evidencias)
- Auditorías internas, no conformidades y acciones (CAPA / mejora)
- Configuración por tenant (empresa)

El foco principal es **ISO 9001**, con soporte configurable para **ISO 14001 / 27001 / 45001**.

## Roles (RBAC)

- **Superadmin** (plataforma)
- **Admin** (tenant)
- **Gestor de Calidad**
- **Editor**
- **Revisor**
- **Aprobador**
- **Lector**

> La autorización se valida server-side (RPC / políticas SQL + RLS). La UI no decide permisos.

## Flujo documental estándar ISO

1. Borrador
2. En revisión
3. Revisado
4. Aprobado
5. Publicado
6. Obsoleto

Al publicar una nueva versión, la versión anterior queda obsoleta (solo lectura) y se mantiene el historial.

## Configuración ISO por empresa

En `Configuración > Configuración ISO`:
- Normas activas (toggles)
- Tipos documentales permitidos
- Flujo de aprobación (mínimos de revisores/aprobadores)
- Catálogo de procesos/departamentos y plantillas de checklist (estructura JSON)

## Desarrollo local

```sh
npm i
npm run dev
```

## Migraciones y despliegue

Aplicar migraciones de Supabase, incluyendo:
- `20260305123000_iso9001_multisector_reposition.sql`

## Guía de implantación ISO 9001

Consulta `docs/iso-9001-quickstart.md`.
