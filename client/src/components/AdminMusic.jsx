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
import Loader from "./Loader";
import "../styles/AdminMusic.css";

const AdminMusic = () => {
  const [music, setMusic] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const [newItem, setNewItem] = useState({
    title: "",
    author: "",
    price: "",
    order: "",
    urlSong: "",
    urlToBuy: "",
    imageFile: null,
  });

  useEffect(() => {
    fetchMusic();
  }, []);

  const fetchMusic = async () => {
    setLoading(true);
    const q = query(collection(db, "music"), orderBy("order", "desc"));
    const snap = await getDocs(q);
    setMusic(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  /* ---------- IMAGE UPLOAD ---------- */
  const uploadImage = async (file) => {
    const fileRef = ref(storage, `music/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  /* ---------- CREATE ---------- */
  const createMusic = async (e) => {
    e.preventDefault();

    let imageUrl = "";
    if (newItem.imageFile) {
      imageUrl = await uploadImage(newItem.imageFile);
    }

    await addDoc(collection(db, "music"), {
      title: newItem.title,
      author: newItem.author,
      price: Number(newItem.price),
      order: Number(newItem.order),
      urlSong: newItem.urlSong,
      urlToBuy: newItem.urlToBuy,
      image: imageUrl,
    });

    setNewItem({
      title: "",
      author: "",
      price: "",
      order: "",
      urlSong: "",
      urlToBuy: "",
      imageFile: null,
    });

    fetchMusic();
  };

  /* ---------- EDIT ---------- */
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    await updateDoc(doc(db, "music", editingId), {
      title: editData.title,
      author: editData.author,
      price: Number(editData.price),
      order: Number(editData.order),
      urlSong: editData.urlSong,
      urlToBuy: editData.urlToBuy,
    });
    setEditingId(null);
    fetchMusic();
  };

  const changeImage = async (id, file) => {
    const imageUrl = await uploadImage(file);
    await updateDoc(doc(db, "music", id), { image: imageUrl });
    fetchMusic();
  };

  /* ---------- DELETE ---------- */
  const remove = async (id) => {
    if (!window.confirm("¿Eliminar este disco?")) return;
    await deleteDoc(doc(db, "music", id));
    fetchMusic();
  };

  if (loading) return <Loader />;

  return (
    <div className="adminMusic">
      <h2 className="section-title">🎧 Música</h2>

      {/* CREATE */}
      <form className="adminMusic-form" onSubmit={createMusic}>
        <input
          placeholder="Título"
          value={newItem.title}
          onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
        />
        <input
          placeholder="Autor"
          value={newItem.author}
          onChange={(e) => setNewItem({ ...newItem, author: e.target.value })}
        />
        <input
          placeholder="Precio"
          type="number"
          value={newItem.price}
          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
        />
        <input
          placeholder="Orden"
          type="number"
          value={newItem.order}
          onChange={(e) => setNewItem({ ...newItem, order: e.target.value })}
        />
        <input
          placeholder="URL Song (iframe)"
          value={newItem.urlSong}
          onChange={(e) => setNewItem({ ...newItem, urlSong: e.target.value })}
        />
        <input
          placeholder="URL Compra"
          value={newItem.urlToBuy}
          onChange={(e) => setNewItem({ ...newItem, urlToBuy: e.target.value })}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setNewItem({ ...newItem, imageFile: e.target.files[0] })
          }
        />
        <button>Agregar disco</button>
      </form>

      {/* LIST */}
      <div className="adminMusic-list">
        {music.map((m) => {
          const isEditing = editingId === m.id;

          return (
            <div key={m.id} className="adminMusic-item">
              <label>
                <img src={m.image} alt={m.title} />
                {isEditing && (
                  <input
                    type="file"
                    hidden
                    onChange={(e) => changeImage(m.id, e.target.files[0])}
                  />
                )}
              </label>

              <div className="adminMusic-info">
                {isEditing ? (
                  <>
                    <input
                      value={editData.title}
                      onChange={(e) =>
                        setEditData({ ...editData, title: e.target.value })
                      }
                    />
                    <input
                      value={editData.author}
                      onChange={(e) =>
                        setEditData({ ...editData, author: e.target.value })
                      }
                    />
                    <input
                      type="number"
                      value={editData.price}
                      onChange={(e) =>
                        setEditData({ ...editData, price: e.target.value })
                      }
                    />
                    <input
                      type="number"
                      value={editData.order}
                      onChange={(e) =>
                        setEditData({ ...editData, order: e.target.value })
                      }
                    />
                    <input
                      value={editData.urlSong}
                      onChange={(e) =>
                        setEditData({ ...editData, urlSong: e.target.value })
                      }
                    />
                    <input
                      value={editData.urlToBuy}
                      onChange={(e) =>
                        setEditData({ ...editData, urlToBuy: e.target.value })
                      }
                    />
                  </>
                ) : (
                  <>
                    <strong>{m.title}</strong>
                    <p>{m.author}</p>
                    <small>
                      ${m.price} · orden {m.order}
                    </small>
                  </>
                )}
              </div>

              <div className="adminMusic-actions">
                {!isEditing ? (
                  <button onClick={() => startEdit(m)}>✏️</button>
                ) : (
                  <>
                    <button onClick={saveEdit}>💾</button>
                    <button onClick={cancelEdit}>❌</button>
                  </>
                )}
                <button onClick={() => remove(m.id)}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminMusic;
