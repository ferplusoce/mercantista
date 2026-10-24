import { useSyncExternalStore } from "react";
import { PRODUCTS, VENDORS, type Product, type Vendor } from "./data";
import { DEFAULT_TARIFFS, type Tariffs } from "./pricing";

export type CartItem = { productId: string; qty: number; note: string };
export type OrderStatus = "received" | "verifying" | "purchasing" | "staging" | "on_the_way" | "delivered" | "cancelled";
export type Order = {
  code: string; createdAt: string; business: string; contact: string; phone: string;
  service: "taxi_delivery" | "minivan_delivery"; status: OrderStatus;
  items: { productId: string; name: string; vendorId: string; qty: number; unitPrice: number; unit: string; weightKg: number; note: string }[];
  subtotal: number; serviceFee: number; shippingFee: number; total: number; weightKg: number; packages: number;
  paymentPlan: string; paymentMethod: string; paymentStatus: "pending" | "partially_paid" | "paid";
  deliveryDate: string; slot: string; address?: string; zone?: string;
  taxi?: { driver: string; plate: string; phone: string; arrival: string; meeting: string };
  history: { status: OrderStatus; at: string }[];
};
export type CustomRequest = { code: string; createdAt: string; business: string; contact: string; phone: string; address: string; date: string; items: { name: string; qty: string; unit: string; quality: string; vendor: string; notes: string }[]; attachment?: string; status: "pending" | "quoted" | "approved" | "rejected" };
export type Profile = { business: string; owner: string; phone: string; doc: string; addresses: { zone: string; line: string; ref: string }[]; taxis: { driver: string; plate: string; phone: string }[] };
export type Cost = { date: string; fuel: number; driver: number; maintenance: number; other: number };

type State = { cart: CartItem[]; orders: Order[]; requests: CustomRequest[]; products: Product[]; vendors: Vendor[]; tariffs: Tariffs; profile: Profile; costs: Cost[] };

const today = new Date().toISOString().slice(0, 10);
const mkOrder = (code: string, status: OrderStatus, service: Order["service"], business: string, items: [string, number][]): Order => {
  const its = items.map(([id, qty]) => { const pr = PRODUCTS.find((x) => x.id === id)!; return { productId: id, name: pr.name, vendorId: pr.vendorId, qty, unitPrice: pr.price, unit: pr.unit, weightKg: pr.weightKg, note: "" }; });
  const subtotal = its.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const weightKg = its.reduce((s, i) => s + i.qty * i.weightKg, 0);
  const packages = its.reduce((s, i) => s + i.qty, 0);
  const serviceFee = service === "taxi_delivery" ? 25 + Math.max(0, packages - 4) * 2 : 20;
  const shippingFee = service === "taxi_delivery" ? 0 : 50;
  const order = ["received", "verifying", "purchasing", "staging", "on_the_way", "delivered"] as OrderStatus[];
  return { code, createdAt: new Date().toISOString(), business, contact: "Cliente demo", phone: "999111222", service, status, items: its, subtotal, serviceFee, shippingFee, total: subtotal + serviceFee + shippingFee, weightKg, packages, paymentPlan: "Contra entrega", paymentMethod: "Yape / Plin", paymentStatus: status === "delivered" ? "paid" : "pending", deliveryDate: today, slot: "Madrugada (05:30 - 07:30 am)", zone: service === "minivan_delivery" ? "Lurín Cercado" : undefined, address: service === "minivan_delivery" ? "Av. Principal 123, Lurín" : undefined, taxi: service === "taxi_delivery" ? { driver: "Pedro Salas", plate: "ABC-123", phone: "988777666", arrival: "05:00", meeting: "Puerta 2" } : undefined, history: order.slice(0, order.indexOf(status) + 1).map((s) => ({ status: s, at: new Date().toISOString() })) };
};

const initial = (): State => ({
  cart: [], products: PRODUCTS, vendors: VENDORS, tariffs: DEFAULT_TARIFFS,
  orders: [
    mkOrder("MCT-2026-0840", "purchasing", "minivan_delivery", "Bodega Los Ángeles", [["papa-canchan", 3], ["cebolla-roja", 2], ["tomate-katia", 4]]),
    mkOrder("MCT-2026-0841", "staging", "taxi_delivery", "Minimarket Rosita", [["limon-sutil", 2], ["platano-seda", 3]]),
    mkOrder("MCT-2026-0842", "delivered", "minivan_delivery", "Bodega Don Pepe", [["papa-amarilla", 2], ["zanahoria", 1], ["lechuga", 2]]),
  ],
  requests: [],
  profile: { business: "Bodega Don Pepe", owner: "José Ramírez", phone: "999111222", doc: "10456789123", addresses: [{ zone: "Lurín Cercado", line: "Av. Principal 123", ref: "Frente al parque, portón verde" }], taxis: [{ driver: "Pedro Salas", plate: "ABC-123", phone: "988777666" }] },
  costs: Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return { date: d.toISOString().slice(5, 10), fuel: 60 + (i % 3) * 8, driver: 70, maintenance: 15, other: 10 }; }),
});

const KEY = "mercantista-v1";
let state: State = initial();
let loaded = false;
const listeners = new Set<() => void>();
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) state = { ...state, ...JSON.parse(raw) }; } catch { /* ignore */ }
}
export function setState(fn: (s: State) => Partial<State>) {
  load();
  state = { ...state, ...fn(state) };
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}
const serverSnap = initial();
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => { load(); listeners.add(l); l(); return () => listeners.delete(l); },
    () => sel(state),
    () => sel(serverSnap),
  );
}
export const getState = () => { load(); return state; };

export const addToCart = (productId: string, qty = 1) => setState((s) => {
  const ex = s.cart.find((c) => c.productId === productId);
  return { cart: ex ? s.cart.map((c) => (c.productId === productId ? { ...c, qty: c.qty + qty } : c)) : [...s.cart, { productId, qty, note: "" }] };
});
export const updateCart = (productId: string, patch: Partial<CartItem>) => setState((s) => ({ cart: s.cart.map((c) => (c.productId === productId ? { ...c, ...patch } : c)).filter((c) => c.qty > 0) }));
export const clearCart = () => setState(() => ({ cart: [] }));

export function nextCode(prefix = "MCT") {
  const n = getState().orders.length + getState().requests.length + 843;
  return `${prefix}-2026-${String(n).padStart(4, "0")}`;
}

export const STATUS_LABEL: Record<OrderStatus, string> = { received: "Pedido recibido", verifying: "Verificando precios y puestos", purchasing: "Comprando en Unicachi", staging: "En estiba / punto de encuentro", on_the_way: "En camino a tu bodega", delivered: "Entregado y completado", cancelled: "Cancelado" };
export const STATUS_FLOW: OrderStatus[] = ["received", "verifying", "purchasing", "staging", "on_the_way", "delivered"];

export function setOrderStatus(code: string, status: OrderStatus) {
  setState((s) => ({ orders: s.orders.map((o) => (o.code === code ? { ...o, status, history: [...o.history, { status, at: new Date().toISOString() }] } : o)) }));
}

/** Resume el carrito con productos actuales. */
export function cartSummary(cart: CartItem[], products: Product[]) {
  const lines = cart.map((c) => ({ ...c, product: products.find((p) => p.id === c.productId)! })).filter((l) => l.product);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.product.price, 0);
  const weightKg = lines.reduce((s, l) => s + l.qty * l.product.weightKg, 0);
  const packages = lines.reduce((s, l) => s + l.qty, 0);
  const vendors = new Set(lines.map((l) => l.product.vendorId)).size;
  return { lines, subtotal, weightKg, packages, vendors };
}
