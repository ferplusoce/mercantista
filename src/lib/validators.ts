import { z } from "zod";
import { ZONES } from "./data";

/** Reglas de validación compartidas por todos los formularios (mensajes en español). */

export const onlyDigits = (s: string, max = 9) => s.replace(/\D/g, "").slice(0, max);

export const phoneSchema = z.string().regex(/^9\d{8}$/, "Celular de 9 dígitos que empieza con 9");
export const passwordSchema = z.string().min(6, "La contraseña debe tener mínimo 6 caracteres");

const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
export const personNameSchema = z.string().trim()
  .min(3, "Escribe al menos 3 letras").max(60, "Máximo 60 letras")
  .regex(NAME_RE, "Solo letras y espacios");

export const businessSchema = z.string().trim()
  .min(3, "Escribe al menos 3 caracteres").max(60, "Máximo 60 caracteres");

/** Placa peruana: 3 letras/números + guion + 3 dígitos (ABC-123 o A1B-234). */
export const PLATE_RE = /^[A-Z0-9]{3}-[0-9]{3}$/;
export const plateSchema = z.string().regex(PLATE_RE, "Placa con formato ABC-123");
/** Mayúsculas y guion automático mientras se escribe. */
export const formatPlate = (s: string) => {
  const c = s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return c.length > 3 ? `${c.slice(0, 3)}-${c.slice(3)}` : c;
};

export const addressSchema = z.string().trim()
  .min(8, "Escribe la dirección completa (mínimo 8 caracteres)").max(120, "Máximo 120 caracteres")
  .refine((v) => /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(v) && /\d/.test(v), "Incluye calle y número (ej. Av. Los Álamos 123)");

export const refSchema = z.string().trim()
  .min(5, "Agrega una referencia (mínimo 5 caracteres)").max(120, "Máximo 120 caracteres");

export const zoneSchema = z.enum(ZONES, { message: "Elige una zona de la lista" });

export const qtySchema = z.number().int("Solo números enteros").min(1, "Mínimo 1").max(50, "Máximo 50 por producto");
export const MAX_QTY = 50;

export const priceSchema = z.number({ message: "Escribe un precio" })
  .gt(0, "El precio debe ser mayor que 0").lt(1000, "El precio debe ser menor que S/ 1000");

/** DNI: 8 dígitos. RUC: 11 dígitos que empiezan con 10 o 20. */
export const docSchema = (type: string) =>
  type === "RUC"
    ? z.string().regex(/^(10|20)\d{9}$/, "RUC de 11 dígitos que empieza con 10 o 20")
    : z.string().regex(/^\d{8}$/, "DNI de 8 dígitos");

/** Fecha de entrega: desde mañana hasta 14 días, nunca domingo. Recibe "YYYY-MM-DD". */
export function deliveryDateError(v: string): string | null {
  if (!v) return "Elige la fecha de entrega";
  const d = new Date(`${v}T12:00:00`);
  if (Number.isNaN(+d)) return "Fecha inválida";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const min = new Date(today); min.setDate(min.getDate() + 1);
  const max = new Date(today); max.setDate(max.getDate() + 14);
  if (d < min) return "La entrega es desde mañana";
  if (d > max) return "Máximo 14 días adelante";
  if (d.getDay() === 0) return "No entregamos los domingos";
  return null;
}

export const MAX_PHOTO_MB = 5;
/** Fotos subidas: solo JPG, PNG o WEBP de máximo 5 MB. */
export function photoFileError(f: File): string | null {
  const ok = ["image/jpeg", "image/png", "image/webp"].includes(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name);
  if (!ok) return "Solo fotos JPG, PNG o WEBP";
  if (f.size > MAX_PHOTO_MB * 1024 * 1024) return `La foto debe pesar máximo ${MAX_PHOTO_MB} MB`;
  return null;
}

/** Convierte un ZodError en un mapa campo → primer mensaje, para mostrarlo debajo de cada campo. */
export function zodFieldErrors(e: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of e.issues) {
    const k = String(i.path[0] ?? "form");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
