export type Tariffs = {
  taxiBase: number; taxiPerExtraPackage: number; taxiFreePackages: number;
  purchaseFee: number; multiVendorFee: number; earlySlotFee: number;
  zones: Record<string, [number, number, number]>; // price per weight band: 1-200, 201-450, 451-750
};

export const DEFAULT_TARIFFS: Tariffs = {
  taxiBase: 25, taxiPerExtraPackage: 2, taxiFreePackages: 4,
  purchaseFee: 20, multiVendorFee: 10, earlySlotFee: 5,
  zones: {
    "Lurín Cercado": [35, 50, 70],
    "Lurín - Julio C. Tello": [40, 55, 75],
    "Lurín - Huertos de Lurín": [45, 60, 80],
    "Lurín - Km 40 / Arica": [55, 70, 95],
    "Villa El Salvador (limítrofe)": [40, 55, 75],
    "Pachacámac (zonas bajas)": [45, 65, 85],
  },
};

export const MAX_MINIVAN_KG = 750;

export function weightBand(kg: number): 0 | 1 | 2 | -1 {
  if (kg <= 0) return 0;
  if (kg <= 200) return 0;
  if (kg <= 450) return 1;
  if (kg <= MAX_MINIVAN_KG) return 2;
  return -1;
}

/** Servicio 1: base + S/ x por bulto a partir del quinto bulto. */
export function taxiFee(packages: number, t: Tariffs = DEFAULT_TARIFFS) {
  return t.taxiBase + Math.max(0, packages - t.taxiFreePackages) * t.taxiPerExtraPackage;
}

/** Servicio 2: gestión de compra (+ consolidación si 3+ puestos) y flete por zona/peso (+ turno madrugada). */
export function minivanFee(opts: { zone: string; kg: number; vendors: number; early: boolean }, t: Tariffs = DEFAULT_TARIFFS) {
  const band = weightBand(opts.kg);
  const prices = t.zones[opts.zone];
  if (!prices || band === -1) return { ok: false as const, service: 0, shipping: 0 };
  const service = t.purchaseFee + (opts.vendors >= 3 ? t.multiVendorFee : 0);
  const shipping = prices[band] + (opts.early ? t.earlySlotFee : 0);
  return { ok: true as const, service, shipping };
}
