import React, { useState } from "react";

// Importá tus otros componentes
import AdminPedidos from "./AdminPedidos";
import AdminProductos from "./AdminProductos";
import AdminUsuarios from "./AdminUsuarios";

import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("pedidos");

    return (
        <div className="adminDashboard-container">
            <h1 className="adminDashboard-title">Panel Administrativo</h1>

            {/* ------------------- TABS ------------------- */}
            <div className="adminDashboard-tabs">
                <button
                    className={`tab-btn ${activeTab === "pedidos" ? "active" : ""}`}
                    onClick={() => setActiveTab("pedidos")}
                >
                    📦 Pedidos
                </button>

                <button
                    className={`tab-btn ${activeTab === "productos" ? "active" : ""}`}
                    onClick={() => setActiveTab("productos")}
                >
                    🛍️ Productos
                </button>

                <button
                    className={`tab-btn ${activeTab === "usuarios" ? "active" : ""}`}
                    onClick={() => setActiveTab("usuarios")}
                >
                    👥 Usuarios
                </button>
            </div>

            {/* ------------------- RENDER SEGÚN TAB ------------------- */}
            <div className="adminDashboard-content">
                {activeTab === "pedidos" && <AdminPedidos />}
                {activeTab === "productos" && <AdminProductos />}
                {activeTab === "usuarios" && <AdminUsuarios />}
            </div>
        </div>
    );
};

export default AdminDashboard;
