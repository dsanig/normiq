
-- Add deadline and resolution_notes columns to incidencias
ALTER TABLE public.incidencias 
  ADD COLUMN IF NOT EXISTS deadline date,
  ADD COLUMN IF NOT EXISTS resolution_notes text;

-- Create incidencia_attachments table
CREATE TABLE public.incidencia_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incidencia_id uuid NOT NULL REFERENCES public.incidencias(id) ON DELETE CASCADE,
  bucket_id text NOT NULL DEFAULT 'documents',
  object_path text NOT NULL,
  file_name text,
  file_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

-- Enable RLS
ALTER TABLE public.incidencia_attachments ENABLE ROW LEVEL SECURITY;

-- View policy: same company
CREATE POLICY "View incidencia attachments"
  ON public.incidencia_attachments
  FOR SELECT
  USING (
    incidencia_id IN (
      SELECT id FROM public.incidencias
      WHERE company_id = get_user_company_id(auth.uid())
    )
  );

-- Insert policy: same company + can edit
CREATE POLICY "Insert incidencia attachments"
  ON public.incidencia_attachments
  FOR INSERT
  WITH CHECK (
    incidencia_id IN (
      SELECT id FROM public.incidencias
      WHERE company_id = get_user_company_id(auth.uid())
    )
    AND can_edit_content(auth.uid())
  );

-- Delete policy: same company + can edit
CREATE POLICY "Delete incidencia attachments"
  ON public.incidencia_attachments
  FOR DELETE
  USING (
    incidencia_id IN (
      SELECT id FROM public.incidencias
      WHERE company_id = get_user_company_id(auth.uid())
    )
    AND can_edit_content(auth.uid())
  );
