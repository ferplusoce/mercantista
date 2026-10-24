// Datos demostrativos de Mercantista (no verificados).
export type Category = "tuberculos" | "cebollas" | "hortalizas" | "hojas" | "frutas" | "citricos" | "abarrotes";

export const CATEGORIES: { id: Category; name: string; desc: string; emoji: string }[] = [
  { id: "tuberculos", name: "Papas, camotes y tubérculos", desc: "Sacos, medios sacos y mallas", emoji: "🥔" },
  { id: "cebollas", name: "Cebollas y ajos", desc: "Sacos, mallas y cuartos", emoji: "🧅" },
  { id: "hortalizas", name: "Tomates y hortalizas", desc: "Cajas, jabas y atados", emoji: "🍅" },
  { id: "hojas", name: "Verduras de hoja verde", desc: "Atados grandes y cajones", emoji: "🥬" },
  { id: "frutas", name: "Frutas de estación", desc: "Cajas, cajones y jabas", emoji: "🍎" },
  { id: "citricos", name: "Cítricos y plátanos", desc: "Cajones, racimos y mallas", emoji: "🍋" },
];

export const FORMATS = ["Saco", "Medio saco", "Jaba", "Caja", "Malla", "Atado", "Ciento"] as const;

export type Vendor = {
  id: string; name: string; stall: string; pavilion: string; contact: string; phone: string;
  specialty: string; schedule: string; verified: boolean; active: boolean; notes: string; rating: number;
};

export const VENDORS: Vendor[] = [
  { id: "don-lucho", name: "Distribuidora Don Lucho", stall: "A-12", pavilion: "A", contact: "Luis Quispe", phone: "987000111", specialty: "Especialistas en papa amarilla, huayro y canchán por saco", schedule: "03:00 am - 11:00 am", verified: true, active: true, notes: "Buen fiado", rating: 4.9 },
  { id: "santa-rosa", name: "Comercial Santa Rosa", stall: "B-05", pavilion: "B", contact: "Rosa Mamani", phone: "987000222", specialty: "Cebollas, ajos y ajíes de Arequipa", schedule: "02:30 am - 10:00 am", verified: true, active: true, notes: "Pide efectivo", rating: 4.8 },
  { id: "el-huerto", name: "Verduras y Hortalizas El Huerto", stall: "C-18", pavilion: "C", contact: "Jorge Huamán", phone: "987000333", specialty: "Tomates, lechugas y hortalizas frescas", schedule: "03:00 am - 10:30 am", verified: true, active: true, notes: "Mejor calidad en jaba cerrada", rating: 4.7 },
  { id: "dona-elena", name: "Frutas Doña Elena", stall: "D-02", pavilion: "D", contact: "Elena Torres", phone: "987000444", specialty: "Cítricos, naranjas y limones de Chanchamayo", schedule: "04:00 am - 12:00 pm", verified: true, active: true, notes: "", rating: 4.8 },
  { id: "san-martin", name: "Plátanos y Frutas Tropicales San Martín", stall: "D-15", pavilion: "D", contact: "Wilmer Ríos", phone: "987000555", specialty: "Plátanos por racimo y frutas de la selva", schedule: "03:30 am - 11:00 am", verified: true, active: true, notes: "", rating: 4.6 },
  { id: "el-mayorista", name: "Abarrotes y Granos El Mayorista", stall: "E-08", pavilion: "E", contact: "Carmen Flores", phone: "987000666", specialty: "Menestras y sacos de azúcar/arroz", schedule: "05:00 am - 02:00 pm", verified: false, active: true, notes: "", rating: 4.5 },
];

export type Availability = "disponible" | "agotado" | "por_confirmar";
export type Product = {
  id: string; name: string; category: Category; vendorId: string; unit: string; format: (typeof FORMATS)[number];
  weightKg: number; price: number; quality: "Primera" | "Segunda" | "Comercial"; availability: Availability; desc: string; emoji: string;
};

const p = (id: string, name: string, category: Category, vendorId: string, format: Product["format"], unit: string, weightKg: number, price: number, emoji: string, quality: Product["quality"] = "Primera", availability: Availability = "disponible"): Product =>
  ({ id, name, category, vendorId, format, unit, weightKg, price, emoji, quality, availability, desc: `${name} seleccionada en Unicachi, calidad ${quality.toLowerCase()}. Ideal para la venta diaria de tu bodega.` });

export const PRODUCTS: Product[] = [
  p("papa-canchan", "Papa Canchán seleccionada", "tuberculos", "don-lucho", "Saco", "Saco de 50 kg", 50, 85, "🥔"),
  p("papa-amarilla", "Papa Amarilla Tumbay", "tuberculos", "don-lucho", "Saco", "Saco de 50 kg", 50, 140, "🥔"),
  p("papa-huayro", "Papa Huayro", "tuberculos", "don-lucho", "Medio saco", "Medio saco de 25 kg", 25, 62, "🥔"),
  p("camote-amarillo", "Camote Amarillo", "tuberculos", "don-lucho", "Saco", "Saco de 45 kg", 45, 70, "🍠", "Comercial"),
  p("cebolla-roja", "Cebolla roja de Arequipa", "cebollas", "santa-rosa", "Saco", "Saco de 50 kg", 50, 75, "🧅"),
  p("ajo-napuri", "Ajo Napurí", "cebollas", "santa-rosa", "Malla", "Malla de 10 kg", 10, 95, "🧄"),
  p("aji-amarillo", "Ají Amarillo", "cebollas", "santa-rosa", "Jaba", "Jaba de 15 kg", 15, 68, "🌶️", "Primera", "por_confirmar"),
  p("cebolla-blanca", "Cebolla blanca", "cebollas", "santa-rosa", "Malla", "Malla de 20 kg", 20, 38, "🧅", "Comercial"),
  p("tomate-katia", "Tomate Katia de primera", "hortalizas", "el-huerto", "Jaba", "Jaba de 20 kg", 20, 48, "🍅"),
  p("zanahoria", "Zanahoria", "hortalizas", "el-huerto", "Saco", "Saco de 40 kg", 40, 45, "🥕", "Comercial"),
  p("pimiento", "Pimiento rojo", "hortalizas", "el-huerto", "Caja", "Caja de 10 kg", 10, 32, "🫑"),
  p("lechuga", "Lechuga americana", "hojas", "el-huerto", "Atado", "Cajón de 24 unid. (~12 kg)", 12, 36, "🥬"),
  p("culantro", "Culantro", "hojas", "el-huerto", "Atado", "Atado mayorista (~5 kg)", 5, 18, "🌿"),
  p("limon-sutil", "Limón Sutil", "citricos", "dona-elena", "Jaba", "Cajón de 18 kg", 18, 72, "🍋", "Primera", "por_confirmar"),
  p("naranja-jugo", "Naranja de jugo Chanchamayo", "citricos", "dona-elena", "Ciento", "Ciento (~20 kg)", 20, 40, "🍊"),
  p("mandarina", "Mandarina Murcott", "frutas", "dona-elena", "Jaba", "Jaba de 20 kg", 20, 55, "🍊"),
  p("platano-seda", "Plátano Seda", "citricos", "san-martin", "Atado", "Racimo (~25 kg)", 25, 35, "🍌"),
  p("papaya", "Papaya de la selva", "frutas", "san-martin", "Jaba", "Jaba de 25 kg", 25, 42, "🥭"),
  p("pina", "Piña Golden", "frutas", "san-martin", "Ciento", "Docena (~18 kg)", 18, 48, "🍍", "Primera", "agotado"),
  p("arroz", "Arroz extra", "abarrotes", "el-mayorista", "Saco", "Saco de 50 kg", 50, 175, "🌾", "Comercial"),
];

export const ZONES = ["Lurín Cercado", "Lurín - Julio C. Tello", "Lurín - Huertos de Lurín", "Lurín - Km 40 / Arica", "Villa El Salvador (limítrofe)", "Pachacámac (zonas bajas)"] as const;
export const SLOTS = ["Madrugada (05:30 - 07:30 am)", "Mañana (08:00 - 10:30 am)"] as const;

export const WHATSAPP = "51987654321";
export const waLink = (msg: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
export const soles = (n: number) => `S/ ${n.toFixed(2)}`;
