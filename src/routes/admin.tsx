import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Lock, Pause, Play, Plus, Trash2 } from "lucide-react";
import { ZONES, soles, type Vendor, type Availability } from "@/lib/data";
import { STATUS_FLOW, STATUS_LABEL, setState, useStore, type Order, type OrderStatus } from "@/lib/store";
import { useAdmin, useAllOrders, useOrderMutations } from "@/lib/orders";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, inputCls } from "@/components/Field";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Panel de operaciones — Mercantista" },
    { name: "description", content: "Gestión de puestos, precios diarios, pedidos, tarifas y costos operativos." },
    { property: "og:title", content: "Panel de operaciones — Mercantista" },
    { property: "og:description", content: "Operación diaria de Mercantista en Unicachi." },
    { name: "robots", content: "noindex" },
  ] }),
  component: Admin,
});

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const go = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) toast.error("Correo o contraseña incorrectos");
  };
  return (
    <Card className="mx-auto max-w-sm space-y-3 text-center">
      <Lock className="mx-auto h-10 w-10 text-primary" /><h1 className="text-2xl font-bold">Panel administrativo</h1>
      <p className="text-sm text-muted-foreground">Ingresa con tu cuenta de operador.</p>
      <input type="email" placeholder="Correo" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Contraseña" className={inputCls} value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} />
      <button className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground" onClick={go}>Ingresar</button>
    </Card>
  );
}

function Admin() {
  const a = useAdmin();
  if (a.loading) return <p className="text-center text-muted-foreground">Cargando...</p>;
  if (!a.email) return <Login />;
  if (!a.isAdmin) return (
    <Card className="mx-auto max-w-sm space-y-3 text-center">
      <p className="font-semibold">{a.email} no tiene permisos de administrador.</p>
      <button className="h-11 w-full rounded-xl border font-semibold" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
    </Card>
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-3xl font-bold">Panel de operaciones</h1><button className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => supabase.auth.signOut()}>Cerrar sesión ({a.email})</button></div>
      <Tabs defaultValue="resumen">
        <TabsList className="h-auto flex-wrap">
          {["resumen", "pedidos", "productos", "puestos", "tarifas", "reportes"].map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="resumen"><Resumen /></TabsContent>
        <TabsContent value="pedidos"><Pedidos /></TabsContent>
        <TabsContent value="productos"><Productos /></TabsContent>
        <TabsContent value="puestos"><Puestos /></TabsContent>
        <TabsContent value="tarifas"><Tarifas /></TabsContent>
        <TabsContent value="reportes"><Reportes /></TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ l, v }: { l: string; v: string }) { return <Card><p className="text-sm text-muted-foreground">{l}</p><p className="font-display text-2xl font-bold">{v}</p></Card>; }

function Resumen() {
  const orders = (useAllOrders().data ?? []).filter((o) => o.status !== "cancelled");
  const vendors = useStore((s) => s.vendors);
  const active = orders.filter((o) => o.status !== "delivered");
  const byStatus = STATUS_FLOW.map((s) => ({ name: STATUS_LABEL[s].split(" ")[0], pedidos: orders.filter((o) => o.status === s).length }));
  const visit = vendors.map((v) => ({ v, items: active.flatMap((o) => o.items.filter((i) => i.vendorId === v.id)) })).filter((x) => x.items.length);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat l="Pedidos activos" v={String(active.length)} />
        <Stat l="Kg proyectados" v={`${active.reduce((s, o) => s + o.weightKg, 0)} kg`} />
        <Stat l="Bultos" v={String(active.reduce((s, o) => s + o.packages, 0))} />
        <Stat l="Ingresos por servicio" v={soles(orders.reduce((s, o) => s + o.serviceFee + o.shippingFee, 0))} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><p className="mb-2 font-semibold">Pedidos por estado</p><ResponsiveContainer width="100%" height={220}><BarChart data={byStatus}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" fontSize={11} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="pedidos" fill="var(--primary)" radius={6} /></BarChart></ResponsiveContainer></Card>
        <Card>
          <p className="mb-2 font-semibold">Por servicio</p>
          {(["taxi_delivery", "minivan_delivery"] as const).map((s) => <div key={s} className="flex justify-between border-b py-2 text-sm"><span>{s === "taxi_delivery" ? "Servicio 1 · Taxi" : "Servicio 2 · Miniván"}</span><b>{orders.filter((o) => o.service === s).length} pedidos</b></div>)}
          <p className="mb-2 mt-4 font-semibold">Puestos a visitar hoy</p>
          {visit.map(({ v, items }) => <div key={v.id} className="flex justify-between py-1 text-sm"><span>{v.stall} · {v.name}</span><b>{items.reduce((s, i) => s + i.qty, 0)} bultos</b></div>)}
        </Card>
      </div>
    </div>
  );
}

function Pedidos() {
  const q = useAllOrders();
  const orders = q.data ?? [];
  const m = useOrderMutations();
  const vendors = useStore((s) => s.vendors);
  const [st, setSt] = useState("");
  const [sv, setSv] = useState("");
  const [date, setDate] = useState("");
  const [open, setOpen] = useState<Order | null>(null);
  const list = orders.filter((o) => (!st || o.status === st) && (!sv || o.service === sv) && (!date || o.deliveryDate === date));
  const live = open && orders.find((o) => o.code === open.code);
  return (
    <Card className="space-y-3">
      <div className="grid gap-2 md:grid-cols-3">
        <select className={inputCls} value={st} onChange={(e) => setSt(e.target.value)}><option value="">Todos los estados</option>{[...STATUS_FLOW, "cancelled" as const].map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
        <select className={inputCls} value={sv} onChange={(e) => setSv(e.target.value)}><option value="">Todo servicio</option><option value="taxi_delivery">Taxi</option><option value="minivan_delivery">Miniván</option></select>
        <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className="p-2">Código</th><th className="p-2">Bodega</th><th className="p-2">Servicio</th><th className="p-2">Total</th><th className="p-2">Estado</th></tr></thead>
          <tbody>{list.map((o) => (
            <tr key={o.code} className="border-t">
              <td className="p-2"><button className="font-semibold text-primary" onClick={() => setOpen(o)}>{o.code}</button></td>
              <td className="p-2">{o.business}</td><td className="p-2">{o.service === "taxi_delivery" ? "🚕 Taxi" : "🚐 Miniván"}</td><td className="p-2 tabular-nums">{soles(o.total)}</td>
              <td className="p-2"><select className="h-9 rounded-lg border bg-card px-2" value={o.status} onChange={(e) => { const ns = e.target.value as OrderStatus; m.setStatus(o, ns).then(() => toast.success(`${o.code}: ${STATUS_LABEL[ns]}`), () => toast.error("No se pudo cambiar el estado")); }}>{[...STATUS_FLOW, "cancelled" as const].map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></td>
            </tr>
          ))}</tbody>
        </table>
        {q.isLoading && <p className="p-6 text-center text-muted-foreground">Cargando pedidos...</p>}
        {!q.isLoading && list.length === 0 && <p className="p-6 text-center text-muted-foreground">Sin pedidos con esos filtros.</p>}
      </div>
      <Dialog open={!!live} onOpenChange={() => setOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
          {live && <>
            <DialogHeader><DialogTitle>{live.code} · {live.business}</DialogTitle></DialogHeader>
            <p className="font-semibold">Lista de compra para el comprador</p>
            {vendors.filter((v) => live.items.some((i) => i.vendorId === v.id)).map((v) => (
              <div key={v.id} className="rounded-xl bg-muted p-3 text-sm"><p className="font-semibold">{v.stall} · {v.name}</p>
                {live.items.filter((i) => i.vendorId === v.id).map((i, idx) => (
                  <div key={idx} className="mt-1 flex items-center justify-between gap-2"><span>{i.qty} × {i.name} {i.note && <em className="text-muted-foreground">({i.note})</em>}</span>
                    <input type="number" step="0.5" aria-label="Precio real" className="h-8 w-24 rounded-lg border bg-card px-2 text-right" key={`${live.code}-${idx}-${i.unitPrice}`} defaultValue={i.unitPrice}
                      onBlur={(e) => { const price = +e.target.value; if (price !== i.unitPrice) m.setItemPrice(live, live.items.indexOf(i), price).then(() => toast.success("Precio actualizado"), () => toast.error("No se pudo guardar el precio")); }} />
                  </div>
                ))}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Ajusta el precio unitario real comprado y sal del campo para guardar; el total se recalcula.</p>
            {live.taxi ? <div className="rounded-xl border p-3 text-sm"><p className="font-semibold">Taxi de confianza</p>{live.taxi.driver} · {live.taxi.plate} · {live.taxi.phone}<br />Llega {live.taxi.arrival} a {live.taxi.meeting}</div>
              : <div className="rounded-xl border p-3 text-sm"><p className="font-semibold">Hoja de ruta miniván</p>Unicachi → {live.zone} · {live.address}<br />{live.slot} · {live.weightKg} kg / {live.packages} bultos · Contacto {live.phone}</div>}
            <p className="text-right text-lg font-bold">Total {soles(live.total)}</p>
          </>}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Productos() {
  const products = useStore((s) => s.products);
  const vendors = useStore((s) => s.vendors);
  const [pct, setPct] = useState(5);
  const patch = (id: string, p: object) => setState((s) => ({ products: s.products.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const bulk = (sign: 1 | -1) => { setState((s) => ({ products: s.products.map((x) => ({ ...x, price: Math.round(x.price * (1 + (sign * pct) / 100) * 2) / 2 })) })); toast.success(`Precios ${sign > 0 ? "subidos" : "bajados"} ${pct}%`); };
  const add = () => setState((s) => ({ products: [...s.products, { id: `p-${Date.now()}`, name: "Nuevo producto", category: "hortalizas", vendorId: vendors[0].id, unit: "Saco de 50 kg", format: "Saco", weightKg: 50, price: 50, quality: "Primera", availability: "por_confirmar", desc: "Producto agregado por el operador.", emoji: "🥗" }] }));
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted p-3 text-sm">
        <span className="font-semibold">Actualización masiva (04:00 am):</span>
        <input type="number" className="h-9 w-20 rounded-lg border bg-card px-2" value={pct} onChange={(e) => setPct(+e.target.value)} />%
        <button className="h-9 rounded-lg bg-primary px-3 text-primary-foreground" onClick={() => bulk(1)}>Subir</button>
        <button className="h-9 rounded-lg border bg-card px-3" onClick={() => bulk(-1)}>Bajar</button>
        <button className="ml-auto inline-flex h-9 items-center rounded-lg border bg-card px-3" onClick={add}><Plus className="mr-1 h-4 w-4" />Producto</button>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="text-left text-muted-foreground"><tr><th className="p-2">Producto</th><th className="p-2">Presentación</th><th className="p-2">Puesto</th><th className="p-2">Precio S/</th><th className="p-2">Disponibilidad</th><th /></tr></thead>
        <tbody>{products.map((p) => (
          <tr key={p.id} className="border-t">
            <td className="p-2"><input className="h-9 w-48 rounded-lg border bg-card px-2" value={p.name} onChange={(e) => patch(p.id, { name: e.target.value })} /></td>
            <td className="p-2"><input className="h-9 w-40 rounded-lg border bg-card px-2" value={p.unit} onChange={(e) => patch(p.id, { unit: e.target.value })} /></td>
            <td className="p-2"><select className="h-9 rounded-lg border bg-card px-2" value={p.vendorId} onChange={(e) => patch(p.id, { vendorId: e.target.value })}>{vendors.map((v) => <option key={v.id} value={v.id}>{v.stall}</option>)}</select></td>
            <td className="p-2"><input type="number" step="0.5" className="h-9 w-24 rounded-lg border bg-card px-2" value={p.price} onChange={(e) => patch(p.id, { price: +e.target.value })} /></td>
            <td className="p-2"><select className="h-9 rounded-lg border bg-card px-2" value={p.availability} onChange={(e) => patch(p.id, { availability: e.target.value as Availability })}><option value="disponible">Disponible hoy</option><option value="agotado">Agotado en Unicachi</option><option value="por_confirmar">Precio por confirmar</option></select></td>
            <td className="p-2"><button aria-label="Eliminar" onClick={() => setState((s) => ({ products: s.products.filter((x) => x.id !== p.id) }))}><Trash2 className="h-4 w-4" /></button></td>
          </tr>
        ))}</tbody>
      </table></div>
    </Card>
  );
}

function Puestos() {
  const vendors = useStore((s) => s.vendors);
  const patch = (id: string, p: Partial<Vendor>) => setState((s) => ({ vendors: s.vendors.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const add = () => setState((s) => ({ vendors: [...s.vendors, { id: `v-${Date.now()}`, name: "Nuevo puesto", stall: "F-01", pavilion: "F", contact: "", phone: "", specialty: "", schedule: "03:00 am - 11:00 am", verified: false, active: true, notes: "", rating: 4.5 }] }));
  return (
    <div className="space-y-3">
      <button className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground" onClick={add}><Plus className="mr-1 h-4 w-4" />Nuevo puesto</button>
      <div className="grid gap-3 md:grid-cols-2">{vendors.map((v) => (
        <Card key={v.id} className={`grid grid-cols-2 gap-2 text-sm ${v.active ? "" : "opacity-60"}`}>
          {([["name", "Nombre"], ["stall", "Número"], ["pavilion", "Pabellón"], ["contact", "Responsable"], ["phone", "Teléfono"], ["schedule", "Horario"], ["specialty", "Especialidad"], ["notes", "Notas internas"]] as const).map(([k, l]) => (
            <label key={k} className={k === "specialty" || k === "notes" ? "col-span-2" : ""}><span className="text-xs text-muted-foreground">{l}</span><input className="h-9 w-full rounded-lg border bg-card px-2" value={v[k]} onChange={(e) => patch(v.id, { [k]: e.target.value })} /></label>
          ))}
          <div className="col-span-2 flex gap-2">
            <button className="inline-flex h-9 items-center rounded-lg border px-3" onClick={() => patch(v.id, { active: !v.active })}>{v.active ? <><Pause className="mr-1 h-4 w-4" />Pausar</> : <><Play className="mr-1 h-4 w-4" />Activar</>}</button>
            <button className="inline-flex h-9 items-center rounded-lg border px-3" onClick={() => patch(v.id, { verified: !v.verified })}>{v.verified ? "Quitar verificado" : "Verificar"}</button>
            <button className="ml-auto inline-flex h-9 items-center rounded-lg border px-3 text-destructive" onClick={() => setState((s) => ({ vendors: s.vendors.filter((x) => x.id !== v.id) }))}><Trash2 className="h-4 w-4" /></button>
          </div>
        </Card>
      ))}</div>
    </div>
  );
}

function Tarifas() {
  const t = useStore((s) => s.tariffs);
  const set = (p: Partial<typeof t>) => setState((s) => ({ tariffs: { ...s.tariffs, ...p } }));
  return (
    <div className="space-y-4">
      <Card className="grid gap-3 md:grid-cols-3">
        <label className="text-sm"><span className="text-muted-foreground">Taxi: precio fijo por pedido S/</span><input type="number" className={inputCls} value={t.taxiFlat} onChange={(e) => set({ taxiFlat: +e.target.value })} /></label>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th className="p-2">Van compartida</th><th className="p-2">Hasta 200 kg</th><th className="p-2">Hasta 450 kg</th><th className="p-2">Hasta 750 kg</th></tr></thead>
          <tbody>{([1, 2] as const).map((n) => <tr key={n} className="border-t"><td className="p-2">Tramo {n}<p className="text-xs text-muted-foreground">{ZONES.filter((z) => t.zoneTramo[z] === n).join(", ")}</p></td>{t.tramos[n].map((p, i) => <td key={i} className="p-2"><input type="number" step="0.5" className="h-9 w-24 rounded-lg border bg-card px-2" value={p} onChange={(e) => { const arr = [...t.tramos[n]] as [number, number, number]; arr[i] = +e.target.value; set({ tramos: { ...t.tramos, [n]: arr } }); }} /></td>)}</tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}

function Reportes() {
  const costs = useStore((s) => s.costs);
  const orders = (useAllOrders().data ?? []).filter((o) => o.service === "minivan_delivery");
  const income = orders.reduce((s, o) => s + o.serviceFee + o.shippingFee, 0);
  const data = costs.map((c, i) => { const cost = c.fuel + c.driver + c.maintenance + c.other + 12; const ing = 160 + ((i * 37) % 90); return { dia: c.date, costos: cost, ingresos: ing, margen: ing - cost }; });
  const avg = data.reduce((s, d) => s + d.margen, 0) / data.length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat l="Margen promedio diario miniván" v={soles(avg)} />
        <Stat l="Ingresos miniván (pedidos actuales)" v={soles(income)} />
        <Stat l="Costo diario promedio" v={soles(data.reduce((s, d) => s + d.costos, 0) / data.length)} />
      </div>
      <Card><p className="mb-2 font-semibold">Costos operativos vs ingresos (incluye depreciación S/ 12/día) · demostrativo</p>
        <ResponsiveContainer width="100%" height={260}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="dia" /><YAxis /><Tooltip /><Legend /><Line dataKey="ingresos" stroke="var(--success)" strokeWidth={2} /><Line dataKey="costos" stroke="var(--primary)" strokeWidth={2} /><Line dataKey="margen" stroke="var(--foreground)" strokeDasharray="4 4" /></LineChart></ResponsiveContainer>
      </Card>
    </div>
  );
}
