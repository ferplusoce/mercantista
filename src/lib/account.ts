import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { fromRow } from "./orders";

/** El celular es el usuario: 9 dígitos que empiezan con 9. */
export const PHONE_RE = /^9\d{8}$/;
export const MIN_PASSWORD = 6;
export const cleanPhone = (s: string) => s.replace(/\D/g, "").replace(/^51(?=9\d{8}$)/, "");
/** Correo interno derivado del celular (no se le muestra al usuario ni recibe correos). */
export const phoneToEmail = (phone: string) => `${cleanPhone(phone)}@clientes.mercantista.pe`;
export const emailToPhone = (email?: string | null) => (email?.endsWith("@clientes.mercantista.pe") ? email.split("@")[0] : "");

export function validateCredentials(phone: string, password: string): string | null {
  if (!PHONE_RE.test(cleanPhone(phone))) return "El celular debe tener 9 dígitos y empezar con 9";
  if (password.length < MIN_PASSWORD) return `La contraseña debe tener mínimo ${MIN_PASSWORD} caracteres`;
  return null;
}

const authError = (m?: string) =>
  !m ? "No se pudo continuar. Inténtalo de nuevo." :
  /invalid login/i.test(m) ? "Celular o contraseña incorrectos" :
  /already registered|already exists/i.test(m) ? "Ese celular ya tiene cuenta. Inicia sesión." :
  "No se pudo continuar. Inténtalo de nuevo.";

export async function signIn(phone: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: phoneToEmail(phone), password });
  if (error) throw new Error(authError(error.message));
}
export async function signUp(phone: string, password: string, business: string, owner: string) {
  const { data, error } = await supabase.auth.signUp({ email: phoneToEmail(phone), password, options: { data: { phone: cleanPhone(phone), business_name: business, owner_name: owner } } });
  if (error) throw new Error(authError(error.message));
  if (!data.session) await signIn(phone, password);
}
export const signOut = () => supabase.auth.signOut();

export function useSession() {
  const [s, setS] = useState<{ loading: boolean; user: User | null }>({ loading: true, user: null });
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setS({ loading: false, user: data.user }));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setS({ loading: false, user: session?.user ?? null }));
    return () => data.subscription.unsubscribe();
  }, []);
  return s;
}

export type Profile = { business_name: string; owner_name: string; phone: string; doc_type: string; doc_number: string };
export type Address = { id: string; zone: string; line: string; ref: string };
export type Taxi = { id: string; driver: string; plate: string; phone: string };

export function useAccount(userId?: string) {
  const qc = useQueryClient();
  const key = ["account", userId];
  const q = useQuery({
    queryKey: key, enabled: !!userId,
    queryFn: async () => {
      const [p, a, t] = await Promise.all([
        supabase.from("profiles").select("business_name, owner_name, phone, doc_type, doc_number").eq("user_id", userId!).maybeSingle(),
        supabase.from("addresses").select("id, zone, line, ref").order("created_at"),
        supabase.from("taxis").select("id, driver, plate, phone").order("created_at"),
      ]);
      if (p.error || a.error || t.error) throw new Error("No se pudo cargar tu cuenta");
      return { profile: (p.data ?? { business_name: "", owner_name: "", phone: "", doc_type: "DNI", doc_number: "" }) as Profile, addresses: (a.data ?? []) as Address[], taxis: (t.data ?? []) as Taxi[] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: key });
  const check = (r: { error: unknown }) => { if (r.error) throw new Error("No se pudo guardar"); };
  return {
    ...q,
    saveProfile: async (p: Profile) => { check(await supabase.from("profiles").upsert({ user_id: userId!, ...p })); await refresh(); },
    addAddress: async (a: Omit<Address, "id">) => { check(await supabase.from("addresses").insert({ user_id: userId!, ...a })); await refresh(); },
    removeAddress: async (id: string) => { check(await supabase.from("addresses").delete().eq("id", id)); await refresh(); },
    addTaxi: async (t: Omit<Taxi, "id">) => { check(await supabase.from("taxis").insert({ user_id: userId!, ...t })); await refresh(); },
    removeTaxi: async (id: string) => { check(await supabase.from("taxis").delete().eq("id", id)); await refresh(); },
  };
}

/** Pedidos del usuario con sesión (RLS: solo los suyos). */
export function useMyOrders(userId?: string) {
  return useQuery({
    queryKey: ["my-orders", userId], enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("user_id", userId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((r) => fromRow(r as never));
    },
  });
}
