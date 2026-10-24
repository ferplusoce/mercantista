import { createFileRoute } from "@tanstack/react-router";
import { Car, Truck } from "lucide-react";
import { ZONES, soles } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Simulator } from "@/components/Simulator";

export const Route = createFileRoute("/servicios")({
  head: () => ({ meta: [
    { title: "Servicios y tarifas — Mercantista" },
    { name: "description", content: "Entrega a tu taxi de confianza o con nuestra miniván. Simula el costo según zona y peso." },
    { property: "og:title", content: "Servicios y tarifas — Mercantista" },
    { property: "og:description", content: "Tarifas transparentes para Lurín y Lima Sur." },
  ] }),
  component: Servicios,
});

function Servicios() {
  const t = useStore((s) => s.tariffs);
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Servicios y tarifas</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <Car className="h-8 w-8 text-primary" />
          <h2 className="mt-3 text-xl font-bold">Servicio 1: Compra y Estiba hacia tu Taxi de Confianza</h2>
          <p className="mt-2 text-sm text-muted-foreground">Compramos en los puestos de Unicachi, reunimos, revisamos calidad y subimos todo al taxi o transportista que tú envíes al mercado.</p>
          <p className="mt-3 font-semibold">{soles(t.taxiBase)} base + {soles(t.taxiPerExtraPackage)} por bulto desde el {t.taxiFreePackages + 1}.º</p>
          <p className="mt-3 rounded-xl bg-muted p-3 text-xs">La carrera del taxi la pagas directo a tu conductor. Mercantista solo cobra por compra, control de calidad y carga en Unicachi.</p>
        </div>
        <div className="rounded-2xl border border-primary/40 bg-card p-6 shadow-sm">
          <Truck className="h-8 w-8 text-primary" />
          <h2 className="mt-3 text-xl font-bold">Servicio 2: Compra, Carga y Entrega con Miniván Mercantista</h2>
          <p className="mt-2 text-sm text-muted-foreground">Nos encargamos de todo: compramos, cargamos y llevamos el pedido hasta la puerta de tu bodega. Capacidad útil de 750 a 800 kg.</p>
          <p className="mt-3 font-semibold">Gestión {soles(t.purchaseFee)} + flete según zona y peso</p>
        </div>
      </div>
      <section><h2 className="mb-3 text-2xl font-bold">Simulador de tarifa</h2><Simulator /></section>
      <section>
        <h2 className="mb-3 text-2xl font-bold">Flete miniván por zona</h2>
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left"><tr><th className="p-3">Zona</th><th className="p-3">1–200 kg</th><th className="p-3">201–450 kg</th><th className="p-3">451–750 kg</th></tr></thead>
            <tbody>{ZONES.map((z) => <tr key={z} className="border-t"><td className="p-3 font-medium">{z}</td>{t.zones[z].map((p, i) => <td key={i} className="p-3 tabular-nums">{soles(p)}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Adicional {soles(t.multiVendorFee)} si compras en 3 o más puestos. Turno madrugada +{soles(t.earlySlotFee)}. Tarifas demostrativas.</p>
      </section>
    </div>
  );
}
