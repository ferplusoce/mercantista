import { useState } from "react";
import { SLOTS, ZONES, soles } from "@/lib/data";
import { minivanFee, taxiFee } from "@/lib/pricing";
import { useStore } from "@/lib/store";

export function Simulator() {
  const t = useStore((s) => s.tariffs);
  const [zone, setZone] = useState<string>(ZONES[0]);
  const [kg, setKg] = useState(250);
  const [vendors, setVendors] = useState(2);
  const [slot, setSlot] = useState<string>(SLOTS[0]);
  const packages = Math.max(1, Math.ceil(kg / 45));
  const m = minivanFee({ zone, kg, vendors, early: slot === SLOTS[0] }, t);
  const c = "h-11 w-full rounded-xl border bg-card px-3 text-sm";
  return (
    <div className="grid gap-5 rounded-2xl border bg-card p-5 shadow-sm md:grid-cols-2">
      <div className="space-y-3">
        <label className="block text-sm font-medium">Zona de entrega<select className={c} value={zone} onChange={(e) => setZone(e.target.value)}>{ZONES.map((z) => <option key={z}>{z}</option>)}</select></label>
        <label className="block text-sm font-medium">Peso del pedido: <b>{kg} kg</b> (~{packages} bultos)<input type="range" min={20} max={800} step={10} value={kg} onChange={(e) => setKg(+e.target.value)} className="w-full accent-[var(--primary)]" /></label>
        <label className="block text-sm font-medium">Puestos visitados<select className={c} value={vendors} onChange={(e) => setVendors(+e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} {n === 1 ? "puesto" : "puestos"}</option>)}</select></label>
        <label className="block text-sm font-medium">Horario<select className={c} value={slot} onChange={(e) => setSlot(e.target.value)}>{SLOTS.map((z) => <option key={z}>{z}</option>)}</select></label>
      </div>
      <div className="grid gap-3">
        <div className="rounded-xl bg-muted p-4">
          <p className="text-sm font-semibold">Servicio 1 · Taxi de confianza</p>
          <p className="font-display text-3xl font-bold">{soles(taxiFee(packages, t))}</p>
          <p className="text-xs text-muted-foreground">S/ {t.taxiBase} base + S/ {t.taxiPerExtraPackage} por bulto desde el {t.taxiFreePackages + 1}.º. La carrera la pagas a tu chofer.</p>
        </div>
        <div className="rounded-xl bg-accent p-4">
          <p className="text-sm font-semibold">Servicio 2 · Miniván Mercantista</p>
          {m.ok ? <>
            <p className="font-display text-3xl font-bold text-accent-foreground">{soles(m.service + m.shipping)}</p>
            <p className="text-xs">Compra y consolidación {soles(m.service)}{vendors >= 3 && " (incluye adicional por 3+ puestos)"} · Flete {soles(m.shipping)}{slot === SLOTS[0] && " (incluye turno madrugada)"}</p>
          </> : <p className="mt-1 text-sm text-destructive">Supera la capacidad de la miniván (750 kg). Divide el pedido o elige taxi.</p>}
        </div>
      </div>
    </div>
  );
}
