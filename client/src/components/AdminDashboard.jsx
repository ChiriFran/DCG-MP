import React, { useState } from "react";

import AdminStats from "./AdminStats";
import AdminPedidos from "./AdminPedidos";
import AdminProductos from "./AdminProductos";
import AdminUsuarios from "./AdminUsuarios";

import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  // 👇 Arranca en estadísticas
  const [activeTab, setActiveTab] = useState("stats");

  return (
    <div className="adminDashboard-container">
      <h1 className="adminDashboard-title">Panel Administrativo</h1>

      <div className="adminDashboard-tabs">
        <button
          className={`tab-btn ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          📊 Estadísticas
        </button>

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

      <div className="adminDashboard-content">
        {activeTab === "stats" && <AdminStats />}
        {activeTab === "pedidos" && <AdminPedidos />}
        {activeTab === "productos" && <AdminProductos />}
        {activeTab === "usuarios" && <AdminUsuarios />}
      </div>
    </div>
  );
};

export default AdminDashboard;
