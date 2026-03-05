-- Multi-sector ISO compliance pivot: tenant configuration, generic terminology, and workflow hardening.

-- 1) Tenant-level ISO configuration
CREATE TABLE IF NOT EXISTS public.tenant_iso_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  active_standards text[] NOT NULL DEFAULT ARRAY['ISO 9001'],
  allowed_document_types text[] NOT NULL DEFAULT ARRAY['Procedimiento','Instrucción','Formato','Política','Registro','Plantilla'],
  required_metadata jsonb NOT NULL DEFAULT '{"code": true, "title": true, "type": true, "process_id": false, "clause_refs": false}'::jsonb,
  approval_flow jsonb NOT NULL DEFAULT '{"min_reviewers": 1, "min_approvers": 1, "review_rule": "all"}'::jsonb,
  state_matrix jsonb NOT NULL DEFAULT '["draft","in_review","reviewed","approved","published","obsolete"]'::jsonb,
  departments jsonb NOT NULL DEFAULT '[]'::jsonb,
  process_catalog jsonb NOT NULL DEFAULT '[]'::jsonb,
  audit_checklist_templates jsonb NOT NULL DEFAULT '[]'::jsonb,
  regulated_industries_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_iso_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_iso_settings_read ON public.tenant_iso_settings;
CREATE POLICY tenant_iso_settings_read
ON public.tenant_iso_settings
FOR SELECT TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS tenant_iso_settings_manage ON public.tenant_iso_settings;
CREATE POLICY tenant_iso_settings_manage
ON public.tenant_iso_settings
FOR ALL TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR (
    public.can_manage_company(auth.uid())
    AND company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  public.is_superadmin(auth.uid())
  OR (
    public.can_manage_company(auth.uid())
    AND company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- 2) Process map catalog (multi-sector)
CREATE TABLE IF NOT EXISTS public.business_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  parent_process_id uuid REFERENCES public.business_processes(id) ON DELETE SET NULL,
  process_code text,
  name text NOT NULL,
  description text,
  area text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kpi_name text,
  kpi_target text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_processes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS business_processes_read ON public.business_processes;
CREATE POLICY business_processes_read
ON public.business_processes
FOR SELECT TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS business_processes_manage ON public.business_processes;
CREATE POLICY business_processes_manage
ON public.business_processes
FOR ALL TO authenticated
USING (
  public.can_edit_content(auth.uid())
  AND company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
  public.can_edit_content(auth.uid())
  AND company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- 3) Generic ISO compliance entities
CREATE TABLE IF NOT EXISTS public.iso_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  standard text NOT NULL DEFAULT 'ISO 9001',
  clause_code text NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, standard, clause_code)
);

CREATE TABLE IF NOT EXISTS public.compliance_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES public.iso_requirements(id) ON DELETE CASCADE,
  control_name text NOT NULL,
  control_description text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.control_evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  control_id uuid NOT NULL REFERENCES public.compliance_controls(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  evidence_note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Document workflow extensions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='documents' AND column_name='document_type'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN document_type text NOT NULL DEFAULT 'Procedimiento';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='documents' AND column_name='published_at'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN published_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='documents' AND column_name='change_summary'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN change_summary text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='documents' AND column_name='is_controlled_copy'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN is_controlled_copy boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='documents' AND column_name='process_id'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN process_id uuid REFERENCES public.business_processes(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.document_workflow_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_role text NOT NULL CHECK (assignment_role IN ('author','reviewer','approver','publisher')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, user_id, assignment_role)
);

CREATE TABLE IF NOT EXISTS public.document_workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  from_status text,
  to_status text NOT NULL,
  action text NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_workflow_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_workflow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iso_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_evidences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_workflow_assignments_read ON public.document_workflow_assignments;
CREATE POLICY document_workflow_assignments_read
ON public.document_workflow_assignments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id
      AND (
        public.is_superadmin(auth.uid())
        OR d.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      )
  )
);

DROP POLICY IF EXISTS document_workflow_assignments_manage ON public.document_workflow_assignments;
CREATE POLICY document_workflow_assignments_manage
ON public.document_workflow_assignments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id
      AND public.can_edit_content(auth.uid())
      AND d.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id
      AND public.can_edit_content(auth.uid())
      AND d.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS document_workflow_events_read ON public.document_workflow_events;
CREATE POLICY document_workflow_events_read
ON public.document_workflow_events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id
      AND (
        public.is_superadmin(auth.uid())
        OR d.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      )
  )
);

DROP POLICY IF EXISTS document_workflow_events_insert ON public.document_workflow_events;
CREATE POLICY document_workflow_events_insert
ON public.document_workflow_events
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id
      AND d.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- generic RLS helpers for compliance entities
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['iso_requirements','compliance_controls','control_evidences'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_read ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_read ON public.%I FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()) OR company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))',
      t, t
    );

    EXECUTE format('DROP POLICY IF EXISTS %I_manage ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_manage ON public.%I FOR ALL TO authenticated USING (public.can_edit_content(auth.uid()) AND company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())) WITH CHECK (public.can_edit_content(auth.uid()) AND company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))',
      t, t
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.can_document_action(_document_id uuid, _actor uuid, _target_status text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_superadmin(_actor) THEN true
    WHEN _target_status = 'in_review' THEN EXISTS (
      SELECT 1 FROM public.document_workflow_assignments a
      WHERE a.document_id = _document_id AND a.user_id = _actor AND a.assignment_role = 'author'
    )
    WHEN _target_status = 'reviewed' THEN EXISTS (
      SELECT 1 FROM public.document_workflow_assignments a
      WHERE a.document_id = _document_id AND a.user_id = _actor AND a.assignment_role = 'reviewer'
    )
    WHEN _target_status = 'approved' THEN EXISTS (
      SELECT 1 FROM public.document_workflow_assignments a
      WHERE a.document_id = _document_id AND a.user_id = _actor AND a.assignment_role = 'approver'
    )
    WHEN _target_status = 'published' THEN EXISTS (
      SELECT 1 FROM public.document_workflow_assignments a
      WHERE a.document_id = _document_id AND a.user_id = _actor AND a.assignment_role = 'publisher'
    )
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.transition_document_status(
  _document_id uuid,
  _target_status text,
  _comment text DEFAULT NULL
)
RETURNS public.documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc public.documents%ROWTYPE;
  v_previous_status text;
  v_allowed boolean;
BEGIN
  SELECT * INTO v_doc FROM public.documents WHERE id = _document_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  v_previous_status := v_doc.status::text;

  v_allowed := public.can_document_action(_document_id, auth.uid(), _target_status);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Permission denied for status transition to %', _target_status;
  END IF;

  UPDATE public.documents
  SET status = _target_status::public.document_status,
      published_at = CASE WHEN _target_status = 'published' THEN now() ELSE published_at END,
      updated_at = now()
  WHERE id = _document_id
  RETURNING * INTO v_doc;

  INSERT INTO public.document_workflow_events (document_id, actor_id, from_status, to_status, action, comment)
  VALUES (_document_id, auth.uid(), v_previous_status, _target_status, _target_status, _comment);

  IF _target_status = 'published' THEN
    UPDATE public.documents
    SET status = 'obsolete'
    WHERE company_id = v_doc.company_id
      AND code = v_doc.code
      AND id <> v_doc.id
      AND version < v_doc.version
      AND status = 'approved';
  END IF;

  RETURN v_doc;
END;
$$;

REVOKE ALL ON FUNCTION public.can_document_action(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_document_action(uuid, uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.transition_document_status(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_document_status(uuid, text, text) TO authenticated;

-- 5) diagnostic mode dataset for superadmin
CREATE OR REPLACE VIEW public.auth_diagnostic_view AS
SELECT
  p.id AS user_id,
  p.email,
  p.company_id,
  p.is_superadmin,
  COALESCE(string_agg(ur.role, ', ' ORDER BY ur.role), 'Lector') AS tenant_roles,
  now() AS snapshot_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
GROUP BY p.id, p.email, p.company_id, p.is_superadmin;

GRANT SELECT ON public.auth_diagnostic_view TO authenticated;

-- 6) RBAC role update for multi-sector compliance
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('Admin', 'Gestor de Calidad', 'Editor', 'Revisor', 'Aprobador', 'Lector'));

UPDATE public.user_roles
SET role = CASE
  WHEN role IN ('Administrador', 'admin') THEN 'Admin'
  WHEN role IN ('Espectador', 'viewer') THEN 'Lector'
  WHEN role = 'quality_manager' THEN 'Gestor de Calidad'
  ELSE role
END;

CREATE OR REPLACE FUNCTION public.can_manage_company(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_superadmin(uid)
     OR public.has_role(uid, 'Admin')
     OR public.has_role(uid, 'Gestor de Calidad');
$$;

CREATE OR REPLACE FUNCTION public.can_edit_content(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_superadmin(uid)
     OR public.has_role(uid, 'Admin')
     OR public.has_role(uid, 'Gestor de Calidad')
     OR public.has_role(uid, 'Editor');
$$;

-- 7) Backward-compatible terminology migration
UPDATE public.documents
SET document_type = 'Procedimiento'
WHERE COALESCE(document_type, '') = ''
   OR lower(document_type) IN ('sop', 'pnt', 'procedimiento normalizado');

UPDATE public.documents
SET category = replace(replace(category, 'SOP', 'Procedimiento'), 'PNT', 'Procedimiento')
WHERE category ILIKE '%SOP%' OR category ILIKE '%PNT%';

-- 8) Ensure new feature keys are available per tenant when company_features exists
DO $$
BEGIN
  IF to_regclass('public.company_features') IS NOT NULL THEN
    INSERT INTO public.company_features (company_id, feature_key, enabled)
    SELECT c.id, f.feature_key, true
    FROM public.companies c
    CROSS JOIN (VALUES
      ('iso-compliance'::text),
      ('actions'::text)
    ) AS f(feature_key)
    ON CONFLICT (company_id, feature_key) DO NOTHING;
  END IF;
END $$;
