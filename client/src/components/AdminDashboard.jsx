import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { saveAs } from "file-saver";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState("desc");
    const [selectedCollection, setSelectedCollection] = useState("pedidosExitosos");

    const fetchPedidos = async (collectionName = "pedidosExitosos") => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            let pedidosData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            pedidosData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            setPedidos(pedidosData);
        } catch (error) {
            console.error("Error al obtener los pedidos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPedidos(selectedCollection);
    }, [selectedCollection]);

    const handleSortChange = (e) => {
        const order = e.target.value;
        setSortOrder(order);
        setPedidos((prev) =>
            [...prev].sort((a, b) =>
                order === "asc"
                    ? new Date(a.fecha) - new Date(b.fecha)
                    : new Date(b.fecha) - new Date(a.fecha)
            )
        );
    };

    const handleCollectionChange = (e) => {
        setSelectedCollection(e.target.value);
    };

    const handleExportJSON = () => {
        const json = JSON.stringify(pedidos, null, 2);
        const blob = new Blob([json], { type: "application/json;charset=utf-8" });
        saveAs(blob, `${selectedCollection}.json`);
    };

    const handleExportCSV = () => {
        if (!pedidos.length) return;
        const headers = [
            "Fecha",
            "Comprador",
            "Email",
            "DNI",
            "Teléfono",
            "Dirección",
            "Provincia",
            "Ciudad",
            "Código Postal",
            "Detalles Depto",
            "Costo Envío",
            "Estado",
            "Total",
            "Productos",
        ];
        const rows = pedidos.map((p) => [
            new Date(p.fecha).toLocaleString("es-AR"),
            p.comprador,
            p.email,
            p.dni,
            p.telefono?.completo || "",
            `${p.envio?.street_name || ""} ${p.envio?.street_number || ""}`,
            p.envio?.province || "",
            p.envio?.city || "",
            p.envio?.zip_code || "",
            `${p.envio?.apartment || ""} ${p.envio?.floor || ""}`.trim(),
            p.costoEnvio,
            p.estado,
            p.precioTotal,
            p.productos
                ?.map((prod) => `${prod.title} (${prod.talle}) x${prod.cantidad}`)
                .join(" | "),
        ]);
        const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        saveAs(blob, `${selectedCollection}.csv`);
    };

    // Creamos un array de 6 elementos para skeleton
    const skeletonCount = 6;

    return (
        <div className="admin-container">
            <h1 className="admin-title">📦 Panel Administrativo</h1>

            <div className="admin-controls">
                <div className="sort-container">
                    <select value={selectedCollection} onChange={handleCollectionChange}>
                        <option value="pedidosExitosos">Pedidos Exitosos</option>
                        <option value="pedidosPendientes">Pedidos Pendientes</option>
                        <option value="pedidosRechazados">Pedidos Rechazados</option>
                        <option value="pedidos">Todos los Pedidos</option>
                    </select>

                    <select value={sortOrder} onChange={handleSortChange}>
                        <option value="desc">Más recientes</option>
                        <option value="asc">Más antiguos</option>
                    </select>
                </div>

                <div className="admin-buttons">
                    <button onClick={() => fetchPedidos(selectedCollection)} className="refresh-btn">
                        🔄 Refrescar
                    </button>
                    <button onClick={handleExportJSON} className="export-btn">
                        💾 Exportar JSON
                    </button>
                    <button onClick={handleExportCSV} className="export-btn">
                        📊 Exportar CSV
                    </button>
                </div>
            </div>

            <div className="cards-container">
                {/* Skeleton base */}
                {loading &&
                    Array(skeletonCount)
                        .fill()
                        .map((_, i) => <div key={`skeleton-${i}`} className="pedido-card skeleton-card"></div>)
                }

                {/* Pedidos dinámicos */}
                {!loading &&
                    pedidos.map((pedido) => (
                        <div key={pedido.id} className="pedido-card">
                            <div className="pedido-header">
                                <h3>{pedido.comprador || "Sin nombre"}</h3>
                                <span className="pedido-fecha">
                                    {new Date(pedido.fecha).toLocaleString("es-AR")}
                                </span>
                            </div>

                            <div className="pedido-body">
                                {/* 👤 COMPRADOR */}
                                <div className="pedido-section">
                                    <h4>👤 Comprador</h4>
                                    <p><span className="label">Nombre:</span><span className="dots"></span><span className="value">{pedido.comprador}</span></p>
                                    <p><span className="label">Email:</span><span className="dots"></span><span className="value">{pedido.email}</span></p>
                                    <p><span className="label">DNI:</span><span className="dots"></span><span className="value">{pedido.dni}</span></p>
                                    <p><span className="label">Teléfono:</span><span className="dots"></span><span className="value">{pedido.telefono?.completo || "No disponible"}</span></p>
                                </div>

                                {/* 📦 ENVÍO */}
                                <div className="pedido-section">
                                    <h4>📦 Datos de envío</h4>
                                    <p><span className="label">Dirección:</span><span className="dots"></span><span className="value">{pedido.envio?.street_name} {pedido.envio?.street_number}</span></p>
                                    <p><span className="label">Ciudad:</span><span className="dots"></span><span className="value">{pedido.envio?.city}</span></p>
                                    <p><span className="label">Provincia:</span><span className="dots"></span><span className="value">{pedido.envio?.province}</span></p>
                                    <p><span className="label">Código Postal:</span><span className="dots"></span><span className="value">{pedido.envio?.zip_code}</span></p>
                                    <p><span className="label">Detalles Depto:</span><span className="dots"></span>
                                        <span className="value">
                                            {pedido.envio?.apartment || pedido.envio?.floor
                                                ? `${pedido.envio.apartment || ""} ${pedido.envio.floor || ""}`.trim()
                                                : "No especificado"}
                                        </span>
                                    </p>
                                </div>

                                {/* 💰 DETALLES */}
                                <div className="pedido-section">
                                    <h4>💰 Detalles del pedido</h4>
                                    <p><span className="label">Estado:</span><span className="dots"></span><span className="value">{pedido.estado}</span></p>
                                    <p><span className="label">Costo de envío:</span><span className="dots"></span><span className="value">${pedido.costoEnvio}</span></p>
                                    <p><span className="label">Total:</span><span className="dots"></span><span className="value">${pedido.precioTotal}</span></p>
                                </div>

                                {/* 🛍 PRODUCTOS */}
                                <div className="pedido-section productos">
                                    <h4>🛍 Productos</h4>
                                    {pedido.productos?.map((p, i) => (
                                        <p key={i} className="producto-item">
                                            <span className="label">{p.title} ({p.talle}) x{p.cantidad}</span>
                                            <span className="dots"></span>
                                            <span className="value">${p.precio}</span>
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default AdminDashboard;
