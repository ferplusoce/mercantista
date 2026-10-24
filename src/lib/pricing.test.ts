import { describe, it, expect } from "vitest";
import { taxiFee, minivanFee } from "./pricing";

describe("tarifas", () => {
  it("taxi: S/25 hasta 4 bultos", () => expect(taxiFee(4)).toBe(25));
  it("taxi: +S/2 por bulto desde el quinto", () => expect(taxiFee(7)).toBe(31));
  it("miniván: Lurín Cercado 300kg, 2 puestos, mañana", () => {
    expect(minivanFee({ zone: "Lurín Cercado", kg: 300, vendors: 2, early: false })).toEqual({ ok: true, service: 20, shipping: 50 });
  });
  it("miniván: adicional por 3+ puestos", () => {
    expect(minivanFee({ zone: "Lurín Cercado", kg: 100, vendors: 3, early: false }).service).toBe(30);
  });
  it("miniván: más de 750 kg no cabe", () => {
    expect(minivanFee({ zone: "Lurín Cercado", kg: 800, vendors: 1, early: false }).ok).toBe(false);
  });
});
