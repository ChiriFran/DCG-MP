import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import "../styles/AdminProductos.css";

export default function AdminProductos() {
    const [productos, setProductos] = useState([]);
    const [editando, setEditando] = useState(null); // ID del producto editándose
    const [tempData, setTempData] = useState({});
    const [guardando, setGuardando] = useState(false);

    const fetchProductos = async () => {
        const snap = await getDocs(collection(db, "productos"));
        setProductos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    useEffect(() => { fetchProductos(); }, []);

    const activarEdicion = (p) => {
        setEditando(p.id);
        setTempData({ ...p }); // copia local temporal
    };

    const cancelarEdicion = () => {
        setEditando(null);
        setTempData({});
    };

    const cambiarCampo = (campo, valor) => {
        setTempData((prev) => ({ ...prev, [campo]: valor }));
    };

    const guardarCambios = async (id) => {
        if (!confirm("¿Guardar cambios en este producto?")) return;

        setGuardando(true);

        try {
            await updateDoc(doc(db, "productos", id), tempData);
            await fetchProductos();
        } finally {
            setGuardando(false);
            setEditando(null);
        }
    };

    const eliminarProducto = async (id) => {
        if (!confirm("¿Eliminar producto definitivamente?")) return;
        await deleteDoc(doc(db, "productos", id));
        fetchProductos();
    };

    return (
        <div className="adminProductos-container">
            <h2 className="productos-title">Administración de Productos</h2>

            <div className="productos-grid">
                {productos.map((p) => {
                    const esEdit = editando === p.id;

                    return (
                        <div key={p.id} className="producto-card">

                            {/* IMÁGENES */}
                            <div className="imagenes-section">
                                <img src={p.image} className="img-preview" />
                                <img src={p.imageBack} className="img-preview" />
                                <img src={p.imageDetail} className="img-preview" />
                            </div>

                            {/* CAMPOS */}
                            <div className="inputs-grid">

                                <Campo label="Título" valor={esEdit ? tempData.title : p.title}
                                    edit={esEdit} onChange={(v) => cambiarCampo("title", v)} />

                                <Campo label="Categoría" valor={esEdit ? tempData.category : p.category}
                                    edit={esEdit} onChange={(v) => cambiarCampo("category", v)} />

                                <CampoTextarea label="Descripción"
                                    valor={esEdit ? tempData.description : p.description}
                                    edit={esEdit}
                                    onChange={(v) => cambiarCampo("description", v)} />

                                <Campo label="Precio" tipo="number"
                                    valor={esEdit ? tempData.price : p.price}
                                    edit={esEdit}
                                    onChange={(v) => cambiarCampo("price", Number(v))} />

                                <Campo label="Stock total" tipo="number"
                                    valor={esEdit ? tempData.stock : p.stock}
                                    edit={esEdit}
                                    onChange={(v) => cambiarCampo("stock", Number(v))} />

                                {/* STOCK POR TALLA */}
                                <div className="talla-section">
                                    {["S", "M", "L", "XL", "XXL"].map((size) => (
                                        <div key={size}>
                                            <label>{size}</label>
                                            {esEdit ? (
                                                <input
                                                    type="number"
                                                    value={tempData[`stock${size}`]}
                                                    onChange={(e) =>
                                                        cambiarCampo(`stock${size}`, Number(e.target.value))
                                                    }
                                                />
                                            ) : (
                                                <p className="vista-text">{p[`stock${size}`]}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* URLs de imágenes */}
                                <Campo
                                    label="Imagen principal"
                                    valor={esEdit ? tempData.image : p.image}
                                    edit={esEdit}
                                    isUrl={true}
                                    onChange={(v) => cambiarCampo("image", v)}
                                />

                                <Campo
                                    label="Imagen espalda"
                                    valor={esEdit ? tempData.imageBack : p.imageBack}
                                    edit={esEdit}
                                    isUrl={true}
                                    onChange={(v) => cambiarCampo("imageBack", v)}
                                />

                                <Campo
                                    label="Imagen detalle"
                                    valor={esEdit ? tempData.imageDetail : p.imageDetail}
                                    edit={esEdit}
                                    isUrl={true}
                                    onChange={(v) => cambiarCampo("imageDetail", v)}
                                />
                            </div>

                            {/* BOTONES */}
                            <div className="card-buttons">
                                {!esEdit && (
                                    <>
                                        <button className="edit-btn" onClick={() => activarEdicion(p)}>✏️ Editar</button>
                                        <button className="delete-btn" onClick={() => eliminarProducto(p.id)}>🧺 Eliminar</button>
                                    </>
                                )}

                                {esEdit && (
                                    <>
                                        <button className="save-btn"
                                            disabled={guardando}
                                            onClick={() => guardarCambios(p.id)}>
                                            {guardando ? "Guardando..." : "✔ Guardar"}
                                        </button>

                                        <button className="cancel-btn"
                                            disabled={guardando}
                                            onClick={cancelarEdicion}>
                                            ✖ Cancelar
                                        </button>
                                    </>
                                )}
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
}




/* COMPONENTES REUTILIZABLES */
function Campo({ label, valor, edit, tipo = "text", onChange, isUrl = false }) {
    return (
        <div>
            <label>{label}</label>

            {edit ? (
                <input
                    type={tipo}
                    value={valor}
                    onChange={(e) => onChange(e.target.value)}
                />
            ) : (
                <p className={isUrl ? "vista-text url-small" : "vista-text"}>
                    {valor}
                </p>
            )}
        </div>
    );
}

function CampoTextarea({ label, valor, edit, onChange }) {
    return (
        <div>
            <label>{label}</label>
            {edit ? (
                <textarea value={valor} onChange={(e) => onChange(e.target.value)} />
            ) : (
                <p className="vista-text">{valor}</p>
            )}
        </div>
    );
}
