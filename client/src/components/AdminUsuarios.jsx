import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { jsPDF } from "jspdf";
import "../styles/AdminUsuarios.css";
import AdminEmailSenderPanel from "./AdminEmailSenderPanel";

export default function AdminUsuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [newsletter, setNewsletter] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const usersSnap = await getDocs(collection(db, "users"));
            const usersData = usersSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setUsuarios(usersData);

            const newsletterSnap = await getDocs(collection(db, "newsletter"));
            const newsletterData = newsletterSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setNewsletter(newsletterData);
        };

        fetchData();
    }, []);

    const copiarEmails = (lista) => {
        const texto = lista.join(", ");
        navigator.clipboard.writeText(texto);
        alert("✔ Copiado al portapapeles");
    };

    const generarPDF = (titulo, listaCorreos) => {
        const doc = new jsPDF();

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(18);
        doc.text(titulo, 14, 20);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(12);

        let y = 35;

        listaCorreos.forEach((email, index) => {
            doc.text(`${index + 1}. ${email}`, 14, y);
            y += 10;

            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        });

        doc.save(`${titulo}.pdf`);
    };

    return (
        <div className="admin-users-container">

            <AdminEmailSenderPanel usuarios={usuarios} newsletter={newsletter} />

            <h1 className="admin-users-title">Gestión de Usuarios</h1>

            <div className="admin-users-grid">

                {/* 🟦 USUARIOS */}
                <div className="users-card">
                    <div className="card-header">
                        <h2 className="card-title">Usuarios</h2>

                        <div className="top-buttons">
                            <button
                                className="top-btn"
                                onClick={() => copiarEmails(usuarios.map(u => u.email))}
                            >
                                📋 Copiar emails
                            </button>

                            <button
                                className="top-btn"
                                onClick={() =>
                                    generarPDF("Usuarios Registrados", usuarios.map(u => u.email))
                                }
                            >
                                📄 PDF
                            </button>

                        </div>
                    </div>

                    {usuarios.length === 0 ? (
                        <p className="empty">No hay usuarios registrados.</p>
                    ) : (
                        <div className="list">
                            {usuarios.map((u) => (
                                <div key={u.id} className="list-item">
                                    <div>
                                        <p className="email">{u.email}</p>
                                        <p className="name">{u.firstName} {u.lastName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 🟩 NEWSLETTER */}
                <div className="users-card">
                    <div className="card-header">
                        <h2 className="card-title">Newsletter</h2>

                        <div className="top-buttons">
                            <button
                                className="top-btn"
                                onClick={() => copiarEmails(newsletter.map(n => n.email))}
                            >
                                📋 Copiar emails
                            </button>

                            <button
                                className="top-btn"
                                onClick={() =>
                                    generarPDF("Newsletter", newsletter.map(n => n.email))
                                }
                            >
                                📄 PDF
                            </button>

                        </div>
                    </div>

                    {newsletter.length === 0 ? (
                        <p className="empty">No hay suscripciones.</p>
                    ) : (
                        <div className="list">
                            {newsletter.map((n) => (
                                <div key={n.id} className="list-item">
                                    <div>
                                        <p className="email">{n.email}</p>
                                        <p className="timestamp">
                                            {n.timestamp?.toDate
                                                ? n.timestamp.toDate().toLocaleString()
                                                : n.timestamp}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
