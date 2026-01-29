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

/* ---------------- Componente ---------------- */

export default function AdminStats() {
  const [loading, setLoading] = useState(true);

  const [pedidos, setPedidos] = useState([]);
  const [newsletter, setNewsletter] = useState([]);
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // pedidos exitosos
      const pedidosSnap = await getDocs(collection(db, "pedidosExitosos"));
      const pedidosData = pedidosSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          fechaObj: normalizarFecha(d.fecha),
        };
      });

      // newsletter
      const newsletterSnap = await getDocs(collection(db, "newsletter"));
      const newsletterData = newsletterSnap.docs.map((d) => d.data());

      // productos
      const productosSnap = await getDocs(collection(db, "productos"));
      const productosData = productosSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setPedidos(pedidosData);
      setNewsletter(newsletterData);
      setProductos(productosData);

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="adminStats-loading">Cargando estadísticas...</div>;
  }

  /* --------- Métricas --------- */

  const totalFacturado = pedidos.reduce(
    (acc, p) => acc + Number(p.precioTotal || 0),
    0,
  );

  const cantidadPedidos = pedidos.length;
  const ticketPromedio = cantidadPedidos ? totalFacturado / cantidadPedidos : 0;

  const ventasPorDia = agruparPorDia(pedidos);
  const productosTop = contarProductos(pedidos);

  /* --------- Render --------- */

  return (
    <div className="adminStats-container">
      <h2 className="adminStats-title">📊 Estadísticas Generales</h2>

      {/* --------- Cards --------- */}
      <div className="adminStats-cards">
        <div className="stat-card">
          <span>Total facturado</span>
          <strong>${totalFacturado.toLocaleString("es-AR")}</strong>
        </div>

        <div className="stat-card">
          <span>Pedidos exitosos</span>
          <strong>{cantidadPedidos}</strong>
        </div>

        <div className="stat-card">
          <span>Ticket promedio</span>
          <strong>${Math.round(ticketPromedio).toLocaleString("es-AR")}</strong>
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

      {/* --------- Gráficos --------- */}
      <div className="adminStats-charts">
        <div className="chart-card">
          <h4>Ventas por día</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={ventasPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#10e09b"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>Productos más vendidos</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={productosTop.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" tick={false} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="ventas" fill="#2572ef" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* --------- Resumen productos --------- */}
        <div className="chart-card">
          <h4>📦 Resumen de productos</h4>

          <div className="productos-resumen">
            {productos.slice(0, 8).map((p) => {
              const stockTotal = calcularStockTotal(p);

              return (
                <div key={p.id} className="producto-row">
                  <span className="prod-nombre">{p.title}</span>
                  <span className="prod-precio">
                    ${Number(p.price).toLocaleString("es-AR")}
                  </span>
                  <span
                    className={`prod-stock ${stockTotal <= 3 ? "low" : ""}`}
                  >
                    {stockTotal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
