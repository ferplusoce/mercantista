import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, RotateCcw } from "lucide-react";
import { soles } from "@/lib/data";
import { STATUS_LABEL, addToCart } from "@/lib/store";
import { useCatalog } from "@/lib/catalog";
import { useMyOrders, useSession } from "@/lib/account";
import { Card } from "@/components/Field";

export const Route = createFileRoute("/mis-pedidos")({
  head: () => ({ meta: [
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { title: "Mis pedidos — Mercantista" },
    { name: "description", content: "Tus pedidos a Unicachi: estado, total, fotos por aprobar y repetir pedido." },
    { property: "og:title", content: "Mis pedidos — Mercantista" },
    { property: "og:description", content: "Sigue y repite tus pedidos." },
  ] }),
  component: MisPedidos,
});

function MisPedidos() {
  const { user, loading } = useSession();
  const q = useMyOrders(user?.id);
  const { products } = useCatalog();
  const nav = useNavigate();
  if (loading) return <p className="p-10 text-center text-muted-foreground">Cargando...</p>;
  if (!user) return (
    <Card className="mx-auto max-w-md space-y-3 text-center">
      <h1 className="text-2xl font-bold">Mis pedidos</h1>
      <p>Ingresa con tu celular para ver tus pedidos.</p>
      <Link to="/ingresar" search={{ redirect: "/mis-pedidos" }} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">Ingresar</Link>
    </Card>
  );
  const repeat = (items: { productId: string; qty: number }[]) => {
    const ok = items.filter((i) => products.some((p) => p.id === i.productId && p.active));
    ok.forEach((i) => addToCart(i.productId, i.qty));
    if (!ok.length) { toast.error("Esos productos ya no están en el catálogo"); return; }
    toast.success(ok.length < items.length ? "Agregamos los productos que siguen en el catálogo" : "Productos agregados a tu pedido");
    nav({ to: "/carrito" });
  };
  const orders = q.data ?? [];
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Mis pedidos</h1>
      {q.isLoading && <p className="text-muted-foreground">Cargando pedidos...</p>}
      {q.isError && <p className="text-destructive">No pudimos cargar tus pedidos.</p>}
      {!q.isLoading && orders.length === 0 && <Card className="text-center"><p>Aún no tienes pedidos.</p><Link to="/catalogo" className="mt-2 inline-block font-semibold text-primary">Haz el primero →</Link></Card>}
      {orders.map((o) => (
        <Card key={o.code} className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div><p className="text-lg font-bold">{o.code}</p><p className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })} · {o.items.length} productos</p></div>
            <p className="font-display text-xl font-bold">{soles(o.total)}</p>
          </div>
          <span className="inline-block rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">{STATUS_LABEL[o.status]}</span>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/seguimiento" search={{ code: o.code }} className="inline-flex h-12 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground"><Eye className="mr-1 h-5 w-5" />Ver detalle</Link>
            <button onClick={() => repeat(o.items)} className="inline-flex h-12 items-center justify-center rounded-xl border font-bold"><RotateCcw className="mr-1 h-5 w-5" />Repetir pedido</button>
          </div>
        </Card>
      ))}
    </div>
  );
}
