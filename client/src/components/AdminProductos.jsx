import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import "../styles/AdminProductos.css";

export default function AdminProductos() {
    const [productos, setProductos] = useState([]);
    const [editando, setEditando] = useState(null);
    const [tempData, setTempData] = useState({});
    const [guardando, setGuardando] = useState(false);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [nuevo, setNuevo] = useState({
        title: "",
        category: "",
        description: "",
        price: "",
        sinTalle: false,
        stock: 10,
        image: "",
        imageDetail: "",
        imageBack: "",
        stockS: 0,
        stockM: 0,
        stockL: 0,
        stockXL: 0,
        stockXXL: 0
    });

    const fetchProductos = async () => {
        const snap = await getDocs(collection(db, "productos"));
        setProductos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    useEffect(() => { fetchProductos(); }, []);

    const activarEdicion = (p) => {
        setEditando(p.id);
        setTempData({ ...p });
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

    /* ---------------------------------------------------------
     *   CREAR NUEVO PRODUCTO
     * ---------------------------------------------------------*/
    const crearProducto = async () => {
        if (!nuevo.title.trim()) return alert("El título es obligatorio");
        if (!nuevo.category.trim()) return alert("La categoría es obligatoria");
        if (!nuevo.price) return alert("El precio es obligatorio");
        if (!nuevo.image.trim()) return alert("La imagen principal es obligatoria");
        if (!nuevo.imageDetail.trim()) return alert("La imagen de detalle es obligatoria");

        let data = {
            title: nuevo.title,
            category: nuevo.category,
            description: nuevo.description,
            price: Number(nuevo.price),
            stock: Number(nuevo.stock),
            image: nuevo.image,
            imageDetail: nuevo.imageDetail,
            imageBack: nuevo.imageBack || ""
        };

        // Si tiene talle → agregar stocks por talle
        if (!nuevo.sinTalle) {
            data = {
                ...data,
                stockS: Number(nuevo.stockS),
                stockM: Number(nuevo.stockM),
                stockL: Number(nuevo.stockL),
                stockXL: Number(nuevo.stockXL),
                stockXXL: Number(nuevo.stockXXL)
            };
        }

        await addDoc(collection(db, "productos"), data);

        setModalOpen(false);

        // reset
        setNuevo({
            title: "",
            category: "",
            description: "",
            price: "",
            sinTalle: false,
            stock: 10,
            image: "",
            imageDetail: "",
            imageBack: "",
            stockS: 0,
            stockM: 0,
            stockL: 0,
            stockXL: 0,
            stockXXL: 0
        });

        fetchProductos();
    };

    return (
        <div className="adminProductos-container">
            <h2 className="productos-title">Administración de Productos</h2>

            {/* BOTÓN AGREGAR */}
            <button className="btn-add" onClick={() => setModalOpen(true)}>
                ➕ Agregar producto
            </button>

            {/* -------------------------- MODAL -------------------------- */}
            {modalOpen && (
                <div className="modal-bg">
                    <div className="modal-box">

                        <h3 className="modal-title">Nuevo producto</h3>

                        <div className="modal-grid">

                            <Campo label="Título" edit valor={nuevo.title}
                                onChange={(v) => setNuevo({ ...nuevo, title: v })} />

                            <Campo label="Categoría" edit valor={nuevo.category}
                                onChange={(v) => setNuevo({ ...nuevo, category: v })} />

                            <Campo label="Precio" edit tipo="number" valor={nuevo.price}
                                onChange={(v) => setNuevo({ ...nuevo, price: v })} />

                            <CampoTextarea label="Descripción" edit valor={nuevo.description}
                                onChange={(v) => setNuevo({ ...nuevo, description: v })} />

                            {/* SIN TALLE */}
                            <div className="switch-box">
                                <label>Producto sin talle</label>
                                <input
                                    type="checkbox"
                                    checked={nuevo.sinTalle}
                                    onChange={() =>
                                        setNuevo({ ...nuevo, sinTalle: !nuevo.sinTalle })
                                    }
                                />
                            </div>

                            {/* STOCK TOTAL */}
                            <Campo label="Stock total" tipo="number"
                                edit valor={nuevo.stock}
                                onChange={(v) => setNuevo({ ...nuevo, stock: v })} />

                            {/* STOCK POR TALLE (solo si tiene talle) */}
                            {!nuevo.sinTalle && (
                                <div className="talla-section modal-tallas">
                                    {["S", "M", "L", "XL", "XXL"].map((t) => (
                                        <div key={t}>
                                            <label>{t}</label>
                                            <input
                                                type="number"
                                                value={nuevo[`stock${t}`]}
                                                onChange={(e) =>
                                                    setNuevo({
                                                        ...nuevo,
                                                        [`stock${t}`]: e.target.value
                                                    })
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* IMÁGENES */}
                            <Campo label="Imagen principal (obligatoria)"
                                edit valor={nuevo.image}
                                isUrl
                                onChange={(v) => setNuevo({ ...nuevo, image: v })} />

                            <Campo label="Imagen detalle (obligatoria)"
                                edit valor={nuevo.imageDetail}
                                isUrl
                                onChange={(v) => setNuevo({ ...nuevo, imageDetail: v })} />

                            <Campo label="Imagen espalda (opcional)"
                                edit valor={nuevo.imageBack}
                                isUrl
                                onChange={(v) => setNuevo({ ...nuevo, imageBack: v })} />
                        </div>

                        <div className="modal-btns">
                            <button className="save-btn" onClick={crearProducto}>✔ Crear</button>
                            <button className="cancel-btn" onClick={() => setModalOpen(false)}>✖ Cancelar</button>
                        </div>

                    </div>
                </div>
            )}

            {/* -------------------------- LISTA DE PRODUCTOS -------------------------- */}
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

                                {/* STOCK TOTAL */}
                                <Campo label="Stock total" tipo="number"
                                    valor={esEdit ? tempData.stock : p.stock}
                                    edit={esEdit}
                                    onChange={(v) => cambiarCampo("stock", Number(v))} />

                                {/* STOCK POR TALLE */}
                                {p.stockS !== undefined && (
                                    <div className="talla-section">
                                        {["S", "M", "L", "XL", "XXL"].map((t) => (
                                            <div key={t}>
                                                <label>{t}</label>
                                                {esEdit ? (
                                                    <input
                                                        type="number"
                                                        value={tempData[`stock${t}`]}
                                                        onChange={(e) =>
                                                            cambiarCampo(`stock${t}`, Number(e.target.value))
                                                        }
                                                    />
                                                ) : (
                                                    <p className="vista-text">{p[`stock${t}`]}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* URLs */}
                                <Campo label="Imagen principal" valor={esEdit ? tempData.image : p.image}
                                    edit={esEdit} isUrl onChange={(v) => cambiarCampo("image", v)} />

                                <Campo label="Imagen espalda" valor={esEdit ? tempData.imageBack : p.imageBack}
                                    edit={esEdit} isUrl onChange={(v) => cambiarCampo("imageBack", v)} />

                                <Campo label="Imagen detalle" valor={esEdit ? tempData.imageDetail : p.imageDetail}
                                    edit={esEdit} isUrl onChange={(v) => cambiarCampo("imageDetail", v)} />

                            </div>

                            <div className="card-buttons">
                                {!esEdit && (
                                    <>
                                        <button className="edit-btn" onClick={() => activarEdicion(p)}>✏️ Editar</button>
                                        <button className="delete-btn" onClick={() => eliminarProducto(p.id)}>🧺 Eliminar</button>
                                    </>
                                )}

                                {esEdit && (
                                    <>
                                        <button className="save-btn" disabled={guardando}
                                            onClick={() => guardarCambios(p.id)}>
                                            {guardando ? "Guardando..." : "✔ Guardar"}
                                        </button>

                                        <button className="cancel-btn" disabled={guardando}
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


/* --------------------- SUBCOMPONENTES --------------------- */
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
