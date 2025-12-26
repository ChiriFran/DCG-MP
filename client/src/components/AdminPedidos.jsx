// src/components/AdminPedidos.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { saveAs } from "file-saver";
import "../styles/AdminPedidos.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function AdminPedidos() {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState("desc");
    const [selectedCollection, setSelectedCollection] = useState("pedidosExitosos");
    const [downloadFormat, setDownloadFormat] = useState("pdf");
    const [search, setSearch] = useState("");

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
            console.error("Error al obtener pedidos:", error);
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

    const skeletonCount = 6;

    // =============================
    // busqueda
    const filteredPedidos = pedidos.filter((p) => {
        const text = search.toLowerCase();
        return (
            p.comprador?.toLowerCase().includes(text) ||
            p.email?.toLowerCase().includes(text)
        );
    });
    // =============================
    // GENERAR EXCEL
    // =============================
    const generateExcel = () => {
        if (!pedidos.length) return;

        const data = pedidos.map((p) => ({
            Fecha: new Date(p.fecha).toLocaleString("es-AR"),
            Nombre: p.comprador || "",
            Email: p.email || "",
            DNI: p.dni || "",
            Teléfono: p.telefono?.completo || "",
            Dirección: `${p.envio?.street_name || ""} ${p.envio?.street_number || ""}`,
            Ciudad: p.envio?.city || "",
            Provincia: p.envio?.province || "",
            CP: p.envio?.zip_code || "",
            Estado: p.estado || "",
            "Costo Envío": p.costoEnvio || 0,
            Total: p.precioTotal || 0,
            Productos: p.productos
                ?.map(
                    (prod) =>
                        `${prod.title} (${prod.talle}) x${prod.cantidad} - $${prod.precio}`
                )
                .join(" | "),
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);

        // 📐 Ancho de columnas
        worksheet["!cols"] = [
            { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 15 },
            { wch: 18 }, { wch: 30 }, { wch: 18 }, { wch: 18 },
            { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 15 },
            { wch: 50 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

        XLSX.writeFile(workbook, `${selectedCollection}.xlsx`);
    };
    // =============================
    // GENERAR PDF
    // =============================
    const generatePDF = () => {
        const doc = new jsPDF("l", "pt", "a4"); // horizontal

        doc.setFontSize(16);
        doc.text(`Reporte de ${selectedCollection}`, 40, 40);

        const tableData = pedidos.map((p) => [
            new Date(p.fecha).toLocaleString("es-AR"),
            p.comprador || "",
            p.email || "",
            p.estado || "",
            `$${p.costoEnvio || 0}`,
            `$${p.precioTotal || 0}`,
            p.productos
                ?.map(
                    (prod) =>
                        `${prod.title} (${prod.talle}) x${prod.cantidad}`
                )
                .join(" | "),
        ]);

        autoTable(doc, {
            startY: 70,
            head: [[
                "Fecha",
                "Nombre",
                "Email",
                "Estado",
                "Envío",
                "Total",
                "Productos"
            ]],
            body: tableData,
            theme: "grid",
            styles: {
                fontSize: 8,
                cellPadding: 4,
                valign: "top",
            },
            headStyles: {
                fillColor: [16, 185, 129],
                textColor: 255,
            },
            columnStyles: {
                6: { cellWidth: 260 }, // productos
            },
            pageBreak: "auto",
        });

        doc.save(`${selectedCollection}.pdf`);
    };

    // =============================
    // BOTÓN DE DESCARGA
    // =============================
    const handleDownload = () => {
        if (downloadFormat === "pdf") generatePDF();
        if (downloadFormat === "excel") generateExcel();
    };

    return (
        <div className="adminPedidos-container">
            <div className="adminPedidos-controls">

                {/* 🔍 Barra de búsqueda */}
                <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="adminPedidos-search control-full"
                />

                {/* 🗂 Selección de colección */}
                <select
                    value={selectedCollection}
                    onChange={handleCollectionChange}
                    className="control-half"
                >
                    <option value="pedidosExitosos">Pedidos Exitosos</option>
                    <option value="pedidosPendientes">Pedidos Pendientes</option>
                    <option value="pedidosRechazados">Pedidos Rechazados</option>
                    <option value="pedidos">Todos los Pedidos</option>
                </select>

                {/* 📅 Orden */}
                <select
                    value={sortOrder}
                    onChange={handleSortChange}
                    className="control-half"
                >
                    <option value="desc">Más recientes</option>
                    <option value="asc">Más antiguos</option>
                </select>

                {/* 📝 Formato de descarga */}
                <select
                    value={downloadFormat}
                    onChange={(e) => setDownloadFormat(e.target.value)}
                    className="control-half"
                >
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel (.xlsx)</option>
                </select>

                {/* ⬇ Botón Descargar */}
                <button
                    onClick={handleDownload}
                    className="control-half"
                >
                    ⬇ Descargar
                </button>

                {/* 🔄 Botón Refrescar */}
                <button
                    onClick={() => fetchPedidos(selectedCollection)}
                    className="control-full"
                >
                    🔄 Refrescar
                </button>
            </div>

            <div className="adminPedidos-cards">
                {loading &&
                    Array(skeletonCount)
                        .fill()
                        .map((_, i) => (
                            <div key={`skeleton-${i}`} className="pedido-card skeleton-card"></div>
                        ))}

                {!loading &&
                    filteredPedidos.map((pedido) => (
                        <div key={pedido.id} className="pedido-card">
                            <div className="pedido-header">
                                <h3>{pedido.comprador || "Sin nombre"}</h3>
                                <span className="pedido-fecha">
                                    {new Date(pedido.fecha).toLocaleString("es-AR")}
                                </span>
                            </div>

                            <div className="pedido-body">
                                {/* Comprador */}
                                <div className="pedido-section">
                                    <h4>👤 Comprador</h4>
                                    <p><span className="label">Nombre:</span><span className="dots"></span><span className="value">{pedido.comprador}</span></p>
                                    <p><span className="label">Email:</span><span className="dots"></span><span className="value">{pedido.email}</span></p>
                                    <p><span className="label">DNI:</span><span className="dots"></span><span className="value">{pedido.dni}</span></p>
                                    <p><span className="label">Teléfono:</span><span className="dots"></span><span className="value">{pedido.telefono?.completo}</span></p>
                                </div>

                                {/* Envio */}
                                <div className="pedido-section">
                                    <h4>📦 Envío</h4>
                                    <p><span className="label">Dirección:</span><span className="dots"></span><span className="value">{pedido.envio?.street_name} {pedido.envio?.street_number}</span></p>
                                    <p><span className="label">Ciudad:</span><span className="dots"></span><span className="value">{pedido.envio?.city}</span></p>
                                    <p><span className="label">Provincia:</span><span className="dots"></span><span className="value">{pedido.envio?.province}</span></p>
                                    <p><span className="label">Código Postal:</span><span className="dots"></span><span className="value">{pedido.envio?.zip_code}</span></p>
                                </div>

                                {/* Detalles */}
                                <div className="pedido-section">
                                    <h4>💰 Detalles</h4>
                                    <p><span className="label">Estado:</span><span className="dots"></span><span className="value">{pedido.estado}</span></p>
                                    <p><span className="label">Costo Envío:</span><span className="dots"></span><span className="value">${pedido.costoEnvio}</span></p>
                                    <p><span className="label">Total:</span><span className="dots"></span><span className="value">${pedido.precioTotal}</span></p>
                                </div>

                                {/* Productos */}
                                <div className="pedido-section productos">
                                    <h4>🛍 Productos</h4>
                                    {pedido.productos?.map((p, i) => (
                                        <p key={i}>
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
}
