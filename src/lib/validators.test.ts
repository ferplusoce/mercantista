import { describe, expect, it } from "vitest";
import { addressSchema, businessSchema, deliveryDateError, docSchema, formatPlate, personNameSchema, phoneSchema, plateSchema, priceSchema, qtySchema, refSchema, zoneSchema } from "./validators";
import { ZONES } from "./data";

const ok = (s: { safeParse: (v: unknown) => { success: boolean } }, v: unknown) => s.safeParse(v).success;

describe("validators", () => {
  it("celular: 9 dígitos que empiezan con 9", () => {
    expect(ok(phoneSchema, "987654321")).toBe(true);
    expect(ok(phoneSchema, "187654321")).toBe(false);
    expect(ok(phoneSchema, "98765432")).toBe(false);
    expect(ok(phoneSchema, "9876543210")).toBe(false);
  });
  it("DNI 8 dígitos y RUC 11 dígitos con 10 o 20", () => {
    expect(ok(docSchema("DNI"), "12345678")).toBe(true);
    expect(ok(docSchema("DNI"), "123456789")).toBe(false);
    expect(ok(docSchema("RUC"), "20123456789")).toBe(true);
    expect(ok(docSchema("RUC"), "10123456789")).toBe(true);
    expect(ok(docSchema("RUC"), "30123456789")).toBe(false);
  });
  it("nombres: solo letras y espacios, 3 a 60", () => {
    expect(ok(personNameSchema, "María Quispe")).toBe(true);
    expect(ok(personNameSchema, "José Ñahuin")).toBe(true);
    expect(ok(personNameSchema, "Ab")).toBe(false);
    expect(ok(personNameSchema, "Juan123")).toBe(false);
  });
  it("bodega: 3 a 60 caracteres", () => {
    expect(ok(businessSchema, "Bodega Lucy")).toBe(true);
    expect(ok(businessSchema, "AB")).toBe(false);
  });
  it("placa: ABC-123 o A1B-234, con formato automático", () => {
    expect(ok(plateSchema, "ABC-123")).toBe(true);
    expect(ok(plateSchema, "A1B-234")).toBe(true);
    expect(ok(plateSchema, "ABC123")).toBe(false);
    expect(formatPlate("abc123")).toBe("ABC-123");
    expect(formatPlate("a1b234")).toBe("A1B-234");
  });
  it("dirección: 8 a 120, con letra y número", () => {
    expect(ok(addressSchema, "Av. Los Álamos 123")).toBe(true);
    expect(ok(addressSchema, "12345678")).toBe(false);
    expect(ok(addressSchema, "Solo letras largas")).toBe(false);
    expect(ok(addressSchema, "Calle 1")).toBe(false);
  });
  it("referencia obligatoria de 5 a 120", () => {
    expect(ok(refSchema, "Portón verde")).toBe(true);
    expect(ok(refSchema, "abc")).toBe(false);
  });
  it("zona solo de la lista atendida", () => {
    expect(ok(zoneSchema, ZONES[0])).toBe(true);
    expect(ok(zoneSchema, "Miraflores")).toBe(false);
  });
  it("cantidades enteras de 1 a 50", () => {
    expect(ok(qtySchema, 1)).toBe(true);
    expect(ok(qtySchema, 50)).toBe(true);
    expect(ok(qtySchema, 51)).toBe(false);
    expect(ok(qtySchema, 0)).toBe(false);
    expect(ok(qtySchema, 2.5)).toBe(false);
  });
  it("precio mayor que 0 y menor que 1000", () => {
    expect(ok(priceSchema, 0.5)).toBe(true);
    expect(ok(priceSchema, 0)).toBe(false);
    expect(ok(priceSchema, 1000)).toBe(false);
  });
  it("fecha de entrega: desde mañana, máximo 14 días, nunca domingo", () => {
    const mk = (plus: number) => { const d = new Date(); d.setDate(d.getDate() + plus); return d.toISOString().slice(0, 10); };
    expect(deliveryDateError(mk(0))).toBe("La entrega es desde mañana");
    expect(deliveryDateError(mk(15))).toBe("Máximo 14 días adelante");
    const sunday = new Date(); sunday.setDate(sunday.getDate() + ((7 - sunday.getDay()) % 7 || 7));
    expect(deliveryDateError(sunday.toISOString().slice(0, 10))).toBe("No entregamos los domingos");
    const okDay = new Date(); okDay.setDate(okDay.getDate() + 1);
    if (okDay.getDay() === 0) okDay.setDate(okDay.getDate() + 1);
    expect(deliveryDateError(okDay.toISOString().slice(0, 10))).toBeNull();
  });
});
