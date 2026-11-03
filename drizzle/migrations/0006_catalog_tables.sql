CREATE TABLE public.categories (id text PRIMARY KEY, name text NOT NULL, description text NOT NULL DEFAULT '', image_url text, sort_order integer NOT NULL DEFAULT 0);
CREATE TABLE public.vendors (id text PRIMARY KEY, name text NOT NULL, stall text NOT NULL DEFAULT '', pavilion text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', specialty text NOT NULL DEFAULT '', schedule text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true, contact text NOT NULL DEFAULT '', verified boolean NOT NULL DEFAULT false, rating numeric NOT NULL DEFAULT 4.5);
CREATE TABLE public.products (id text PRIMARY KEY DEFAULT ('p-' || gen_random_uuid()::text), name text NOT NULL, category_id text REFERENCES public.categories(id) ON DELETE SET NULL, vendor_id text NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE, unit text NOT NULL, format text NOT NULL, weight_kg numeric NOT NULL DEFAULT 0, price numeric NOT NULL DEFAULT 0, quality text NOT NULL DEFAULT 'Primera', availability text NOT NULL DEFAULT 'disponible', description text NOT NULL DEFAULT '', image_url text, active boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.settings (id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), tariffs jsonb NOT NULL, whatsapp text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now());

GRANT SELECT ON public.categories, public.vendors, public.products, public.settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories, public.vendors, public.products, public.settings TO authenticated;
GRANT ALL ON public.categories, public.vendors, public.products, public.settings TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public reads categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public reads active vendors" ON public.vendors FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "public reads active products" ON public.products FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "public reads settings" ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage vendors" ON public.vendors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage settings" ON public.settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER settings_touch BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.top_products(_days integer DEFAULT 30, _limit integer DEFAULT 8)
RETURNS TABLE (product_id text, units numeric) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT it->>'productId', sum(COALESCE((it->>'qty')::numeric, 0))
  FROM public.orders o, jsonb_array_elements(o.items) it
  WHERE o.created_at >= now() - make_interval(days => LEAST(GREATEST(_days, 1), 365)) AND o.status <> 'cancelled' AND it ? 'productId'
  GROUP BY 1 ORDER BY 2 DESC LIMIT LEAST(GREATEST(_limit, 1), 50)
$$;
GRANT EXECUTE ON FUNCTION public.top_products(integer, integer) TO anon, authenticated;

INSERT INTO public.categories (id, name, description, sort_order) VALUES
('tuberculos','Papas, camotes y tubérculos','Sacos, medios sacos y mallas',1),
('cebollas','Cebollas y ajos','Sacos, mallas y cuartos',2),
('hortalizas','Tomates y hortalizas','Cajas, jabas y atados',3),
('hojas','Verduras de hoja verde','Atados grandes y cajones',4),
('frutas','Frutas de estación','Cajas, cajones y jabas',5),
('citricos','Cítricos y plátanos','Cajones, racimos y mallas',6);

INSERT INTO public.vendors (id, name, stall, pavilion, contact, phone, specialty, schedule, verified, active, rating) VALUES
('don-lucho','Distribuidora Don Lucho','A-12','A','Luis Quispe','987000111','Especialistas en papa amarilla, huayro y canchán por saco','03:00 am - 11:00 am',true,true,4.9),
('santa-rosa','Comercial Santa Rosa','B-05','B','Rosa Mamani','987000222','Cebollas, ajos y ajíes de Arequipa','02:30 am - 10:00 am',true,true,4.8),
('el-huerto','Verduras y Hortalizas El Huerto','C-18','C','Jorge Huamán','987000333','Tomates, lechugas y hortalizas frescas','03:00 am - 10:30 am',true,true,4.7),
('dona-elena','Frutas Doña Elena','D-02','D','Elena Torres','987000444','Cítricos, naranjas y limones de Chanchamayo','04:00 am - 12:00 pm',true,true,4.8),
('san-martin','Plátanos y Frutas Tropicales San Martín','D-15','D','Wilmer Ríos','987000555','Plátanos por racimo y frutas de la selva','03:30 am - 11:00 am',true,true,4.6),
('el-mayorista','Abarrotes y Granos El Mayorista','E-08','E','Carmen Flores','987000666','Menestras y sacos de azúcar/arroz','05:00 am - 02:00 pm',false,true,4.5);

INSERT INTO public.products (id, name, category_id, vendor_id, format, unit, weight_kg, price, quality, availability, description) VALUES
('papa-canchan','Papa Canchán seleccionada','tuberculos','don-lucho','Saco','Saco de 50 kg',50,85,'Primera','disponible','Papa Canchán seleccionada en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('papa-amarilla','Papa Amarilla Tumbay','tuberculos','don-lucho','Saco','Saco de 50 kg',50,140,'Primera','disponible','Papa Amarilla Tumbay seleccionada en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('papa-huayro','Papa Huayro','tuberculos','don-lucho','Medio saco','Medio saco de 25 kg',25,62,'Primera','disponible','Papa Huayro seleccionada en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('camote-amarillo','Camote Amarillo','tuberculos','don-lucho','Saco','Saco de 45 kg',45,70,'Comercial','disponible','Camote Amarillo seleccionado en Unicachi, calidad comercial. Ideal para la venta diaria de tu bodega.'),
('cebolla-roja','Cebolla roja de Arequipa','cebollas','santa-rosa','Saco','Saco de 50 kg',50,75,'Primera','disponible','Cebolla roja de Arequipa seleccionada en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('ajo-napuri','Ajo Napurí','cebollas','santa-rosa','Malla','Malla de 10 kg',10,95,'Primera','disponible','Ajo Napurí seleccionado en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('aji-amarillo','Ají Amarillo','cebollas','santa-rosa','Jaba','Jaba de 15 kg',15,68,'Primera','por_confirmar','Ají Amarillo seleccionado en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('cebolla-blanca','Cebolla blanca','cebollas','santa-rosa','Malla','Malla de 20 kg',20,38,'Comercial','disponible','Cebolla blanca seleccionada en Unicachi, calidad comercial. Ideal para la venta diaria de tu bodega.'),
('tomate-katia','Tomate Katia de primera','hortalizas','el-huerto','Jaba','Jaba de 20 kg',20,48,'Primera','disponible','Tomate Katia seleccionado en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('zanahoria','Zanahoria','hortalizas','el-huerto','Saco','Saco de 40 kg',40,45,'Comercial','disponible','Zanahoria seleccionada en Unicachi, calidad comercial. Ideal para la venta diaria de tu bodega.'),
('pimiento','Pimiento rojo','hortalizas','el-huerto','Caja','Caja de 10 kg',10,32,'Primera','disponible','Pimiento rojo seleccionado en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('lechuga','Lechuga americana','hojas','el-huerto','Atado','Cajón de 24 unid. (~12 kg)',12,36,'Primera','disponible','Lechuga americana seleccionada en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('culantro','Culantro','hojas','el-huerto','Atado','Atado mayorista (~5 kg)',5,18,'Primera','disponible','Culantro seleccionado en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('limon-sutil','Limón Sutil','citricos','dona-elena','Jaba','Cajón de 18 kg',18,72,'Primera','por_confirmar','Limón Sutil seleccionado en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('naranja-jugo','Naranja de jugo Chanchamayo','citricos','dona-elena','Ciento','Ciento (~20 kg)',20,40,'Primera','disponible','Naranja de jugo Chanchamayo seleccionada en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('mandarina','Mandarina Murcott','frutas','dona-elena','Jaba','Jaba de 20 kg',20,55,'Primera','disponible','Mandarina Murcott seleccionada en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('platano-seda','Plátano Seda','citricos','san-martin','Atado','Racimo (~25 kg)',25,35,'Primera','disponible','Plátano Seda seleccionado en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('papaya','Papaya de la selva','frutas','san-martin','Jaba','Jaba de 25 kg',25,42,'Primera','disponible','Papaya de la selva seleccionada en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('pina','Piña Golden','frutas','san-martin','Ciento','Docena (~18 kg)',18,48,'Primera','agotado','Piña Golden seleccionada en Unicachi, calidad primera. Ideal para la venta diaria de tu bodega.'),
('arroz','Arroz extra',NULL,'el-mayorista','Saco','Saco de 50 kg',50,175,'Comercial','disponible','Arroz extra seleccionado en Unicachi, calidad comercial. Ideal para la venta diaria de tu bodega.');

INSERT INTO public.settings (id, tariffs, whatsapp) VALUES (1, '{"taxiFlat":50,"tramos":{"1":[100,115,130],"2":[130.5,145,160]},"zoneTramo":{"Lurín Cercado":1,"Lurín - Julio C. Tello":1,"Villa El Salvador (limítrofe)":1,"Lurín - Huertos de Lurín":2,"Lurín - Km 40 / Arica":2,"Pachacámac (zonas bajas)":2}}', '51987654321');

CREATE POLICY "public reads product images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');
CREATE POLICY "admins upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));