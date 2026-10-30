DROP POLICY IF EXISTS "anyone submits opinions" ON public.opinions;
CREATE POLICY "anyone submits opinions" ON public.opinions FOR INSERT TO anon, authenticated
WITH CHECK (
  (satisfaccion IS NULL OR satisfaccion BETWEEN 1 AND 5)
  AND (rating IS NULL OR rating BETWEEN 1 AND 5)
  AND (tiempo_segundos IS NULL OR tiempo_segundos BETWEEN 0 AND 86400)
  AND coalesce(length(comentario), 0) <= 1000
  AND coalesce(length(comment), 0) <= 1000
  AND coalesce(length(name), 0) <= 200
  AND coalesce(length(zona), 0) <= 100
  AND coalesce(length(whatsapp), 0) <= 30
  AND coalesce(length(codigo_encuestador), 0) <= 50
  AND coalesce(length(lo_usaria), 0) <= 50
  AND coalesce(length(servicio_preferido), 0) <= 100
  AND coalesce(length(precio_justo), 0) <= 50
);