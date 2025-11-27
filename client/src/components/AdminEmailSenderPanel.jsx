import { useState } from "react";
import "../styles/AdminEmailSenderPanel.css";

export default function AdminEmailSenderPanel({ usuarios = [], newsletter = [] }) {
    const [selectedList, setSelectedList] = useState("usuarios");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);

    // 🔵 Obtiene la lista final de emails según selección
    const getEmailList = () => {
        if (selectedList === "usuarios") return usuarios;
        if (selectedList === "newsletter") return newsletter;
        return [...usuarios, ...newsletter];
    };

    // 🚀 Enviar emails
    const handleSend = async () => {
        if (!subject.trim()) {
            alert("❗ El asunto no puede estar vacío.");
            return;
        }
        if (!message.trim()) {
            alert("❗ El mensaje no puede estar vacío.");
            return;
        }

        setSending(true);
        setResult(null);

        try {
            const emails = getEmailList();

            // 🟣 URL correcta (funciona en localhost y producción)
            const API_URL = "/api/send-bulk-email";

            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emails,
                    subject,
                    html: `<p>${message.replace(/\n/g, "<br>")}</p>`
                })
            });

            const data = await res.json();
            setResult(data);
        } catch (e) {
            setResult({ error: "Error enviando emails" });
        }

        setSending(false);
    };

    return (
        <div className="admin-email-panel-container">
            <h1 className="admin-email-panel-title">Envío Masivo de Emails</h1>

            <div className="admin-email-panel-box">

                {/* Selección de lista */}
                <div className="admin-email-panel-field">
                    <label>Enviar a:</label>
                    <select
                        value={selectedList}
                        onChange={e => setSelectedList(e.target.value)}
                    >
                        <option value="usuarios">Usuarios ({usuarios.length})</option>
                        <option value="newsletter">Newsletter ({newsletter.length})</option>
                        <option value="ambos">Ambos ({usuarios.length + newsletter.length})</option>
                    </select>
                </div>

                {/* Asunto */}
                <div className="admin-email-panel-field">
                    <label>Asunto:</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                    />
                </div>

                {/* Mensaje */}
                <div className="admin-email-panel-field">
                    <label>Mensaje:</label>
                    <textarea
                        rows={6}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />
                </div>

                {/* Botón */}
                <button
                    className="admin-email-panel-send-btn"
                    onClick={() => setModalOpen(true)}
                >
                    🚀 Enviar Email Masivo
                </button>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="admin-email-panel-modal-bg">
                    <div className="admin-email-panel-modal">

                        {/* Confirmación */}
                        {!sending && !result && (
                            <>
                                <h2 className="admin-email-panel-modal-title">Confirmar envío</h2>
                                <p className="admin-email-panel-modal-text">
                                    ¿Enviar email a <b>{getEmailList().length}</b> destinatarios?
                                </p>

                                <div className="admin-email-panel-modal-actions">
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        className="admin-email-panel-cancel"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        onClick={handleSend}
                                        className="admin-email-panel-confirm"
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Enviando */}
                        {sending && (
                            <p className="admin-email-panel-sending">Enviando...</p>
                        )}

                        {/* Resultado */}
                        {!sending && result && (
                            <div className="admin-email-panel-result">
                                {result.error ? (
                                    <p className="admin-email-panel-error">❌ {result.error}</p>
                                ) : (
                                    <p className="admin-email-panel-success">
                                        ✔ Enviados: {result.enviados || 0}<br />
                                        ❗ Fallados: {result.fallados || 0}
                                    </p>
                                )}

                                <button
                                    onClick={() => {
                                        setModalOpen(false);
                                        setResult(null);
                                    }}
                                    className="admin-email-panel-close"
                                >
                                    Cerrar
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}
