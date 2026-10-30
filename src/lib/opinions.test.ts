import { describe, expect, it } from "vitest";
import { computeStats, type Opinion } from "./opinions";

const op = (p: Partial<Opinion>): Opinion => ({ id: "x", created_at: "", zona: "Lurín", armo_sin_ayuda: true, tiempo_segundos: 200, satisfaccion: 4, lo_usaria: "si", servicio_preferido: "taxi", precio_justo: null, comentario: null, whatsapp: null, codigo_encuestador: null, order_code: null, ...p });

describe("Experimento 2", () => {
  it("cuenta menos de 5 minutos como < 300 s", () => {
    expect(computeStats([op({ tiempo_segundos: 299 }), op({ tiempo_segundos: 300 })]).menos5).toBe(50);
  });
  it("'lo usaría' solo cuenta si dijo sí y dejó WhatsApp", () => {
    expect(computeStats([op({ whatsapp: "987654321" }), op({ lo_usaria: "tal_vez", whatsapp: "987654321" }), op({})]).usariaWa).toBe(33);
  });
  it("satisfacción promedio", () => {
    expect(computeStats([op({ satisfaccion: 5 }), op({ satisfaccion: 4 })]).satisfaccion).toBe(4.5);
  });
});
