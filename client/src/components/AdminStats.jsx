import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";

import "../styles/AdminStats.css";

/* ---------------- Helpers ---------------- */

const normalizarFecha = (fecha) => {
  if (!fecha) return new Date(0);
  if (fecha.toDate) return fecha.toDate();
  if (fecha instanceof Date) return fecha;
  return new Date(fecha);
};

const agruparPorDia = (pedidos) => {
  const map = {};
  pedidos.forEach((p) => {
    const d = p.fechaObj.getDate().toString().padStart(2, "0");
    map[d] = (map[d] || 0) + Number(p.precioTotal || 0);
  });
  return Object.keys(map)
    .sort((a, b) => Number(a) - Number(b))
    .map((d) => ({ dia: d, total: map[d] }));
};

const contarProductos = (pedidos) => {
  const map = {};
  pedidos.forEach((p) => {
    (p.productos || []).forEach((prod) => {
      map[prod.title] = (map[prod.title] || 0) + Number(prod.cantidad || 0);
    });
  });
  return Object.keys(map)
    .map((k) => ({ nombre: k, ventas: map[k] }))
    .sort((a, b) => b.ventas - a.ventas);
};

const calcularStockTotal = (p) => {
  if (p.stock !== undefined) return Number(p.stock);
  return ["S", "M", "L", "XL", "XXL"].reduce(
    (acc, t) => acc + Number(p[`stock${t}`] || 0),
    0,
  );
};

const calcularVendidoTotal = (s) => {
  if (typeof s.cantidad === "number") return s.cantidad;
  return ["S", "M", "L", "XL", "XXL"].reduce(
    (acc, t) => acc + Number(s[t] || 0),
    0,
  );
};

const tieneTalles = (stock) => {
  if (!stock) return false;
  return Object.keys(stock).length > 1;
};

/* ---------------- Componente ---------------- */

export default function AdminStats() {
  const [loading, setLoading] = useState(true);

  const [pedidos, setPedidos] = useState([]);
  const [newsletter, setNewsletter] = useState([]);
  const [productos, setProductos] = useState([]);
  const [stockVendido, setStockVendido] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const pedidosSnap = await getDocs(collection(db, "pedidosExitosos"));
      const newsletterSnap = await getDocs(collection(db, "newsletter"));
      const productosSnap = await getDocs(collection(db, "productos"));
      const stockSnap = await getDocs(collection(db, "stock"));

      setPedidos(
        pedidosSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          fechaObj: normalizarFecha(d.data().fecha),
        })),
      );

      setNewsletter(newsletterSnap.docs.map((d) => d.data()));
      setProductos(productosSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setStockVendido(stockSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="adminStats-loading">
        <div className="loader" />
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  /* --------- Métricas --------- */

  const totalFacturado = pedidos.reduce(
    (acc, p) => acc + Number(p.precioTotal || 0),
    0,
  );

  const ventasPorDia = agruparPorDia(pedidos);
  const productosTop = contarProductos(pedidos);

  const vendidosPorProducto = stockVendido.map((s) => ({
    nombre: s.nombre || s.producto || s.id,
    vendido: calcularVendidoTotal(s),
  }));

  /* --------- Render --------- */

  return (
    <div className="adminStats-container">
      <h2 className="adminStats-title">📊 Estadísticas Generales</h2>

      {/* KPIs */}
      <div className="adminStats-cards">
        <div className="stat-card">
          <span>Total facturado</span>
          <strong>${totalFacturado.toLocaleString("es-AR")}</strong>
        </div>
        <div className="stat-card">
          <span>Pedidos exitosos</span>
          <strong>{pedidos.length}</strong>
        </div>
        <div className="stat-card">
          <span>Ticket promedio</span>
          <strong>${(totalFacturado / pedidos.length || 0).toFixed(0)}</strong>
        </div>
        <div className="stat-card">
          <span>Producto más vendido</span>
          <strong>{productosTop[0]?.nombre || "-"}</strong>
        </div>
        <div className="stat-card">
          <span>Newsletter</span>
          <strong>{newsletter.length}</strong>
        </div>
      </div>

      {/* FILA 1 */}
      <div className="adminStats-charts">
        <div className="chart-card">
          <h4>Ventas por día</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={ventasPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Line dataKey="total" stroke="#10e09b" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>Productos más vendidos</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={productosTop.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="ventas" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FILA 2 */}
      <div className="adminStats-charts">
        {/* Stock actual */}
        <div className="chart-card">
          <h4>Stock de Producto</h4>

          <div className="productos-scroll">
            <div className="productos-resumen">
              {productos.map((p) => (
                <div key={p.id} className="producto-row">
                  <span className="prod-nombre">{p.title}</span>
                  <span className="prod-precio">
                    ${Number(p.price).toLocaleString("es-AR")}
                  </span>
                  <span
                    className={`prod-stock ${
                      calcularStockTotal(p) <= 3 ? "low" : ""
                    }`}
                  >
                    {calcularStockTotal(p)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Stock vendido */}
        <div className="chart-card">
          <h4>Stock vendido</h4>

          <div className="productos-scroll">
            <div className="productos-resumen">
              {stockVendido.map((s) => {
                const nombre = s.nombre || s.producto || s.id;
                const conTalles = tieneTalles(s);

                return (
                  <div
                    key={nombre}
                    className="producto-row vendido producto-row-extended"
                  >
                    {/* fila principal */}
                    <div className="prod-main">
                      <span className="prod-nombre">{nombre}</span>
                      <span className="prod-stock sold">
                        {calcularVendidoTotal(s)}
                      </span>
                    </div>

                    {/* talles (solo si existen) */}
                    {conTalles && (
                      <div className="prod-talles">
                        {Object.entries(s)
                          .filter(
                            ([k]) =>
                              k !== "cantidad" &&
                              k !== "nombre" &&
                              k !== "producto",
                          )
                          .map(([talle, qty]) => (
                            <span
                              key={talle}
                              className={`talle ${qty === 0 ? "sin-stock" : ""}`}
                            >
                              {talle}: {qty}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
