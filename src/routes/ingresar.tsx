import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Field, inputCls } from "@/components/Field";
import { signIn, signUp, validateCredentials } from "@/lib/account";

type S = { redirect?: string };
export const Route = createFileRoute("/ingresar")({
  validateSearch: (s: Record<string, unknown>): S => ({ redirect: typeof s.redirect === "string" && s.redirect.startsWith("/") && !s.redirect.startsWith("//") ? s.redirect : undefined }),
  head: () => ({ meta: [
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { title: "Ingresa con tu celular — Mercantista" },
    { name: "description", content: "Crea tu cuenta o ingresa con tu celular y contraseña para hacer pedidos a Unicachi." },
    { property: "og:title", content: "Ingresa a Mercantista" },
    { property: "og:description", content: "Tu celular es tu usuario." },
  ] }),
  component: Ingresar,
});

function Ingresar() {
  const { redirect } = Route.useSearch();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ phone: "", password: "", business: "", owner: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateCredentials(f.phone, f.password);
    if (v) return setErr(v);
    if (mode === "up" && !f.business.trim()) return setErr("Escribe el nombre de tu bodega");
    setErr(""); setBusy(true);
    try {
      if (mode === "in") await signIn(f.phone, f.password); else await signUp(f.phone, f.password, f.business.trim(), f.owner.trim());
      toast.success(mode === "in" ? "¡Bienvenido!" : "¡Cuenta creada!");
      nav({ to: redirect ?? "/mis-pedidos", replace: true });
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  const big = inputCls + " h-14 text-lg";
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-3xl font-bold">{mode === "in" ? "Ingresa" : "Crea tu cuenta"}</h1>
      <div className="grid grid-cols-2 gap-2">
        {(["in", "up"] as const).map((m) => <button key={m} type="button" onClick={() => { setMode(m); setErr(""); }} className={`h-12 rounded-xl border text-base font-semibold ${mode === m ? "bg-primary text-primary-foreground" : "bg-card"}`}>{m === "in" ? "Ya tengo cuenta" : "Soy nuevo"}</button>)}
      </div>
      <Card>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Celular"><input className={big} inputMode="numeric" autoComplete="tel" maxLength={9} placeholder="9XXXXXXXX" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "") })} /></Field>
          <Field label="Contraseña (mínimo 6)"><input className={big} type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          {mode === "up" && <>
            <Field label="Nombre de tu bodega"><input className={big} value={f.business} onChange={(e) => setF({ ...f, business: e.target.value })} /></Field>
            <Field label="Tu nombre"><input className={big} value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} /></Field>
          </>}
          {err && <p role="alert" className="text-sm font-medium text-destructive">{err}</p>}
          <button disabled={busy} className="h-14 w-full rounded-xl bg-primary text-lg font-bold text-primary-foreground disabled:opacity-50">{busy ? "Un momento..." : mode === "in" ? "Ingresar" : "Crear cuenta"}</button>
        </form>
      </Card>
    </div>
  );
}
