import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/config";
import "../styles/AdminEventos.css";

const emptyEvent = {
  title: "",
  image: "",
  buyLink: "",
  id: "",
};

const AdminEventos = () => {
  const [eventoActual, setEventoActual] = useState(null);
  const [eventosPasados, setEventosPasados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyEvent);
  const [preview, setPreview] = useState(null);

  const fetchEventos = async () => {
    setLoading(true);

    const q = query(collection(db, "eventos"), orderBy("id", "desc"));
    const snap = await getDocs(q);

    const data = snap.docs.map((d) => ({
      docId: d.id,
      ...d.data(),
    }));

    if (data.length > 0) {
      setEventoActual(data[0]);
      setEventosPasados(data.slice(1));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  /* ===== SUBIDA DE IMAGEN ===== */
  const handleImageUpload = async (file) => {
    if (!file) return;

    setUploading(true);

    const fileRef = ref(storage, `eventos/${Date.now()}-${file.name}`);

    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    setForm((prev) => ({ ...prev, image: url }));
    setPreview(url);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.image || !form.id) return;

    if (editingId) {
      await updateDoc(doc(db, "eventos", editingId), {
        ...form,
        id: Number(form.id),
      });
    } else {
      await addDoc(collection(db, "eventos"), {
        ...form,
        id: Number(form.id),
      });
    }

    setForm(emptyEvent);
    setPreview(null);
    setEditingId(null);
    fetchEventos();
  };

  const handleEdit = (evento) => {
    setEditingId(evento.docId);
    setForm({
      title: evento.title || "",
      image: evento.image || "",
      buyLink: evento.buyLink || "",
      id: evento.id || "",
    });
    setPreview(evento.image);
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("¿Eliminar este evento?")) return;
    await deleteDoc(doc(db, "eventos", docId));
    fetchEventos();
  };

  const renderCard = (evento, highlight = false) => (
    <div
      key={evento.docId}
      className={`adminEvento-card ${highlight ? "active" : ""}`}
    >
      <div className="adminEvento-img">
        <img src={evento.image} alt={evento.title} />
      </div>

      <div className="adminEvento-info">
        <strong>{evento.title}</strong>
        <span>ID: {evento.id}</span>
      </div>

      <div className="adminEvento-actions">
        <button onClick={() => handleEdit(evento)}>✏️</button>
        <button onClick={() => handleDelete(evento.docId)}>🗑️</button>
      </div>
    </div>
  );

  return (
    <div className="adminEventos-container">
      <h2 className="adminEventos-title">🎫 Administración de Eventos</h2>

      {/* FORM */}
      <form className="adminEventos-form" onSubmit={handleSubmit}>
        <input
          placeholder="Título del evento"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <input
          placeholder="Link de compra"
          value={form.buyLink}
          onChange={(e) => setForm({ ...form, buyLink: e.target.value })}
        />

        <input
          type="number"
          placeholder="ID del evento"
          value={form.id}
          onChange={(e) => setForm({ ...form, id: e.target.value })}
        />

        {/* FILE INPUT */}
        <label className="adminEventos-upload">
          {uploading ? "Subiendo imagen..." : "📤 Subir imagen"}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleImageUpload(e.target.files[0])}
          />
        </label>

        <button type="submit" disabled={uploading}>
          {editingId ? "Guardar cambios" : "Crear evento"}
        </button>
      </form>

      {/* PREVIEW */}
      {preview && (
        <div className="adminEventos-preview">
          <img src={preview} alt="Preview" />
        </div>
      )}

      {loading ? (
        <div className="adminEventos-loading">Cargando eventos...</div>
      ) : (
        <>
          {eventoActual && (
            <>
              <h4 className="section-title">Evento actual</h4>
              <div className="adminEventos-grid">
                {renderCard(eventoActual, true)}
              </div>
            </>
          )}

          {eventosPasados.length > 0 && (
            <>
              <h4 className="section-title">Eventos pasados</h4>
              <div className="adminEventos-grid">
                {eventosPasados.map((e) => renderCard(e))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AdminEventos;
