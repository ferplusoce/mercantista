ALTER TABLE public.opinions
  ADD COLUMN IF NOT EXISTS zona text,
  ADD COLUMN IF NOT EXISTS armo_sin_ayuda boolean,
  ADD COLUMN IF NOT EXISTS tiempo_segundos integer,
  ADD COLUMN IF NOT EXISTS satisfaccion integer,
  ADD COLUMN IF NOT EXISTS lo_usaria text,
  ADD COLUMN IF NOT EXISTS servicio_preferido text,
  ADD COLUMN IF NOT EXISTS precio_justo text,
  ADD COLUMN IF NOT EXISTS comentario text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS codigo_encuestador text;

CREATE OR REPLACE FUNCTION public.validate_opinion() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.satisfaccion IS NULL OR NEW.satisfaccion < 1 OR NEW.satisfaccion > 5 THEN RAISE EXCEPTION 'satisfaccion invalida'; END IF;
  IF NEW.lo_usaria NOT IN ('si','tal_vez','no') THEN RAISE EXCEPTION 'lo_usaria invalido'; END IF;
  IF NEW.servicio_preferido NOT IN ('taxi','tramo1','tramo2') THEN RAISE EXCEPTION 'servicio invalido'; END IF;
  IF NEW.codigo_encuestador IS NOT NULL AND NEW.codigo_encuestador NOT IN ('fernando','moises') THEN NEW.codigo_encuestador := NULL; END IF;
  IF length(coalesce(NEW.zona,'')) > 80 OR length(coalesce(NEW.precio_justo,'')) > 120 OR length(coalesce(NEW.comentario,'')) > 600 OR length(coalesce(NEW.whatsapp,'')) > 20 THEN RAISE EXCEPTION 'texto muy largo'; END IF;
  IF NEW.tiempo_segundos IS NOT NULL AND (NEW.tiempo_segundos < 0 OR NEW.tiempo_segundos > 86400) THEN NEW.tiempo_segundos := NULL; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS validate_opinion_trg ON public.opinions;
CREATE TRIGGER validate_opinion_trg BEFORE INSERT ON public.opinions FOR EACH ROW EXECUTE FUNCTION public.validate_opinion();

GRANT INSERT ON public.opinions TO anon, authenticated;
CREATE POLICY "anyone submits opinions" ON public.opinions FOR INSERT TO anon, authenticated WITH CHECK (true);