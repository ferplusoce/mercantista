import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, Trash2 } from "lucide-react";
import { ZONES } from "@/lib/data";
import { emailToPhone, signOut, useAccount, useSession, type Profile } from "@/lib/account";
import { Card, Field, inputCls } from "@/components/Field";
import { Welcome } from "@/components/Welcome";

export const Route = createFileRoute("/cuenta")({
  head: () => ({ meta: [
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { title: "Mi cuenta — Mercantista" },
    { name: "description", content: "Datos de tu bodega, direcciones, taxis de confianza e historial de pedidos." },
    { property: "og:title", content: "Mi cuenta — Mercantista" },
    { property: "og:description", content: "Gestiona tu abastecimiento." },
  ] }),
  component: Cuenta,
});

function Cuenta() {
  const { user, loading } = useSession();
  const acc = useAccount(user?.id);
  const nav = useNavigate();
  const qc = useQueryClient();
  const [p, setP] = useState<Profile | null>(null);
  const [taxi, setTaxi] = useState({ driver: "", plate: "", phone: "" });
  const [addr, setAddr] = useState({ zone: ZONES[0] as string, line: "", ref: "" });
  useEffect(() => { if (acc.data) setP(acc.data.profile); }, [acc.data]);
  const fail = () => toast.error("No se pudo guardar");
  if (loading) return <p className="p-10 text-center text-muted-foreground">Cargando...</p>;
  if (!user) return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-3xl font-bold">Mi cuenta</h1><Welcome /></div>
      <Card className="mx-auto max-w-md space-y-3 text-center">
        <p>Ingresa con tu celular para guardar tu bodega, direcciones y taxis.</p>
        <Link to="/ingresar" search={{ redirect: "/cuenta" }} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">Ingresar o crear cuenta</Link>
      </Card>
    </div>
  );
  const upd = (k: keyof Profile) => (e: { target: { value: string } }) => p && setP({ ...p, [k]: e.target.value });
  const logout = async () => { await qc.cancelQueries(); qc.clear(); await signOut(); nav({ to: "/", replace: true }); };
  const d = acc.data;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">Mi cuenta</h1>
        <div className="flex gap-2"><Welcome /><button onClick={logout} className="inline-flex h-10 items-center rounded-xl border px-3 text-sm font-semibold"><LogOut className="mr-1 h-4 w-4" />Salir</button></div>
      </div>
      <p className="text-sm text-muted-foreground">Ingresaste con el celular {emailToPhone(user.email) || p?.phone}.</p>
      {!p ? <p className="text-muted-foreground">Cargando tus datos...</p> : (
      <Card className="grid gap-3 md:grid-cols-5">
        <Field label="Bodega"><input className={inputCls} value={p.business_name} onChange={upd("business_name")} /></Field>
        <Field label="Dueño"><input className={inputCls} value={p.owner_name} onChange={upd("owner_name")} /></Field>
        <Field label="Teléfono"><input className={inputCls} inputMode="numeric" value={p.phone} onChange={upd("phone")} /></Field>
        <Field label="Documento"><select className={inputCls} value={p.doc_type} onChange={upd("doc_type")}><option>DNI</option><option>RUC</option></select></Field>
        <Field label="Número"><input className={inputCls} inputMode="numeric" value={p.doc_number} onChange={upd("doc_number")} /></Field>
        <button className="h-11 rounded-xl bg-primary font-semibold text-primary-foreground md:col-span-5" onClick={() => acc.saveProfile(p).then(() => toast.success("Datos guardados"), fail)}>Guardar mis datos</button>
      </Card>)}
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="font-bold">Direcciones de entrega</h2>
          {d?.addresses.map((a) => <div key={a.id} className="flex justify-between rounded-xl bg-muted p-3 text-sm"><div><p className="font-semibold">{a.line}</p><p className="text-muted-foreground">{a.zone} · {a.ref}</p></div><button aria-label="Eliminar" onClick={() => acc.removeAddress(a.id).catch(fail)}><Trash2 className="h-4 w-4" /></button></div>)}
          <select className={inputCls} value={addr.zone} onChange={(e) => setAddr({ ...addr, zone: e.target.value })}>{ZONES.map((z) => <option key={z}>{z}</option>)}</select>
          <input className={inputCls} placeholder="Dirección" value={addr.line} onChange={(e) => setAddr({ ...addr, line: e.target.value })} />
          <input className={inputCls} placeholder="Referencia (portón, color, esquina)" value={addr.ref} onChange={(e) => setAddr({ ...addr, ref: e.target.value })} />
          <button className="h-11 w-full rounded-xl border font-semibold" onClick={() => { if (!addr.line) { toast.error("Ingresa la dirección"); return; } acc.addAddress(addr).then(() => setAddr({ ...addr, line: "", ref: "" }), fail); }}>Guardar dirección</button>
        </Card>
        <Card className="space-y-3">
          <h2 className="font-bold">Mis taxis de confianza</h2>
          {d?.taxis.map((t) => <div key={t.id} className="flex justify-between rounded-xl bg-muted p-3 text-sm"><span>🚕 {t.driver} · {t.plate} · {t.phone}</span><button aria-label="Eliminar" onClick={() => acc.removeTaxi(t.id).catch(fail)}><Trash2 className="h-4 w-4" /></button></div>)}
          <input className={inputCls} placeholder="Nombre del chofer" value={taxi.driver} onChange={(e) => setTaxi({ ...taxi, driver: e.target.value })} />
          <div className="grid grid-cols-2 gap-2"><input className={inputCls} placeholder="Placa" value={taxi.plate} onChange={(e) => setTaxi({ ...taxi, plate: e.target.value.toUpperCase() })} /><input className={inputCls} placeholder="Celular" inputMode="numeric" value={taxi.phone} onChange={(e) => setTaxi({ ...taxi, phone: e.target.value })} /></div>
          <button className="h-11 w-full rounded-xl border font-semibold" onClick={() => { if (!taxi.driver || !taxi.plate) { toast.error("Completa chofer y placa"); return; } acc.addTaxi(taxi).then(() => setTaxi({ driver: "", plate: "", phone: "" }), fail); }}>Guardar taxi</button>
        </Card>
      </div>
      <Link to="/mis-pedidos" className="inline-flex h-12 w-full items-center justify-center rounded-xl border font-bold">Ver mis pedidos</Link>
    </div>
  );
}
