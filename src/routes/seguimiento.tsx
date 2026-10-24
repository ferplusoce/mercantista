import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, MessageCircle, PackageSearch } from "lucide-react";
import { soles, waLink } from "@/lib/data";
import { STATUS_FLOW, STATUS_LABEL, useStore, type Order } from "@/lib/store";
import { Card } from "@/components/Field";

export const Route = createFileRoute("/seguimiento")({
  validateSearch: (s: Record<string, unknown>) => ({ code: s.code as string | undefined }),
  head: () => ({ meta: [
    { title: "Seguimiento de pedido — Mercantista" },
    { name: "description", content: "Consulta el estado de tu pedido con tu código MCT." },
    { property: "og:title", content: "Seguimiento de pedido — Mercantista" },
    { property: "og:description", content: "Sigue tu compra desde Unicachi hasta tu bodega." },
  ] }),
  component: Seguimiento,
});

function detail(o: Order, s: string) {
  const d: Record<string, string> = {
    received: "Mercantista registró la orden.", verifying: "Coordinando con los vendedores de Unicachi.", purchasing: "Compra física y selección de calidad en proceso.",
    staging: o.service === "taxi_delivery" ? `Esperando o cargando el taxi placa ${o.taxi?.plate} en ${o.taxi?.meeting}.` : "Cargado en la miniván Mercantista, iniciando ruta a Lurín.",
    on_the_way: o.service === "taxi_delivery" ? "Tu taxi va en camino con la mercadería." : `En ruta a ${o.zone}. Llegada estimada: 40 min.`,
    delivered: "Mercadería recibida y verificada.",
  };
  return d[s];
}

function Seguimiento() {
  const { code } = Route.useSearch();
  const nav = useNavigate();
  const [q, setQ] = useState(code ?? "");
  const orders = useStore((s) => s.orders);
  const o = code ? orders.find((x) => x.code.toUpperCase() === code.toUpperCase()) : undefined;
  const idx = o ? STATUS_FLOW.indexOf(o.status) : -1;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-3xl font-bold">Seguimiento de pedido</h1>
      <form onSubmit={(e) => { e.preventDefault(); nav({ to: "/seguimiento", search: { code: q.trim() } }); }} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej. MCT-2026-0842" className="h-12 flex-1 rounded-xl border bg-card px-4 uppercase" />
        <button className="h-12 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">Consultar</button>
      </form>
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">Pedidos recientes: {orders.slice(0, 4).map((x) => <button key={x.code} onClick={() => { setQ(x.code); nav({ to: "/seguimiento", search: { code: x.code } }); }} className="rounded-full border px-2.5 py-0.5">{x.code}</button>)}</div>
      {code && !o && <Card className="text-center"><PackageSearch className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-2 font-semibold">No encontramos el pedido {code}</p><p className="text-sm text-muted-foreground">Revisa el código o escríbenos por WhatsApp.</p></Card>}
      {o && (
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-display text-2xl font-bold">{o.code}</p><p className="text-sm text-muted-foreground">{o.business} · {o.service === "taxi_delivery" ? "Taxi de confianza" : "Miniván Mercantista"} · {o.deliveryDate}</p></div>
            <p className="font-bold">{soles(o.total)}</p>
          </div>
          {o.status === "cancelled" ? <p className="rounded-xl bg-destructive/10 p-3 text-destructive">Pedido cancelado</p> : (
            <ol className="space-y-0">
              {STATUS_FLOW.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`grid h-8 w-8 place-items-center rounded-full border-2 ${i <= idx ? "border-success bg-success text-success-foreground" : "bg-card"}`}>{i <= idx ? <Check className="h-4 w-4" /> : i + 1}</span>
                    {i < STATUS_FLOW.length - 1 && <span className={`w-0.5 flex-1 ${i < idx ? "bg-success" : "bg-border"}`} />}
                  </div>
                  <div className="pb-5"><p className={`font-semibold ${i === idx ? "text-primary" : ""}`}>{STATUS_LABEL[s]}</p>{i <= idx && <p className="text-sm text-muted-foreground">{detail(o, s)}</p>}</div>
                </li>
              ))}
            </ol>
          )}
          <div className="rounded-xl bg-muted p-4 text-sm">
            <p className="font-semibold">Coordinador de turno en Unicachi</p><p className="text-muted-foreground">Carlos Medina (dato demostrativo)</p>
            <a href={waLink(`Hola Mercantista, quiero consultar sobre mi pedido ${o.code}`)} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-11 items-center rounded-xl bg-success px-4 font-semibold text-success-foreground"><MessageCircle className="mr-2 h-4 w-4" />Escribir por WhatsApp</a>
          </div>
        </Card>
      )}
    </div>
  );
}
