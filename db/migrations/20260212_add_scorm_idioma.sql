-- v1.4.0
-- Añade el idioma del SCORM para construir el nombre mostrado en la UI.
ALTER TABLE public.scorms_master
ADD COLUMN IF NOT EXISTS scorm_idioma text;
