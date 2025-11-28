// AdminProductos.jsx
import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    addDoc
} from "firebase/firestore";
import { db, storage } from "../firebase/config";
import {
    ref as storageRef,
    uploadBytesResumable,
    getDownloadURL
} from "firebase/storage";
import "../styles/AdminProductos.css";

/* ----------------- Subcomponentes ----------------- */
function Campo({ label, valor, edit, tipo = "text", onChange, isUrl = false }) {
    return (
        <div className="campo-box">
            <label>{label}</label>
            {edit ? (
                <input type={tipo} value={valor} onChange={(e) => onChange(e.target.value)} />
            ) : (
                <p className={isUrl ? "vista-text url-small" : "vista-text"}>{valor}</p>
            )}
        </div>
    );
}

function CampoTextarea({ label, valor, edit, onChange }) {
    return (
        <div className="campo-box">
            <label>{label}</label>
            {edit ? (
                <textarea value={valor} onChange={(e) => onChange(e.target.value)} />
            ) : (
                <p className="vista-text">{valor}</p>
            )}
        </div>
    );
}

/* ----------------- Componente principal ----------------- */
export default function AdminProductos() {
    const [productos, setProductos] = useState([]);
    const [editando, setEditando] = useState(null);
    const [tempData, setTempData] = useState({});
    const [guardando, setGuardando] = useState(false);

    // Modal / nuevo
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

    // previews y archivos para subir (por campo)
    const [previewImage, setPreviewImage] = useState({
        image: "",
        imageDetail: "",
        imageBack: ""
    });

    const [filesToUpload, setFilesToUpload] = useState({
        image: null,
        imageDetail: null,
        imageBack: null
    });

    // progreso por campo (0-100)
    const [uploadProgress, setUploadProgress] = useState({
        image: 0,
        imageDetail: 0,
        imageBack: 0
    });

    /* ----------------- Fetch productos ----------------- */
    const fetchProductos = async () => {
        const snap = await getDocs(collection(db, "productos"));
        setProductos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    useEffect(() => {
        fetchProductos();
    }, []);

    /* ----------------- Helper: subir archivo y obtener URL ----------------- */
    const uploadFileAndGetURL = (file, carpeta = "productos", onProgress) => {
        if (!file) return Promise.resolve(null);

        const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
        const ref = storageRef(storage, `${carpeta}/${filename}`);
        const uploadTask = uploadBytesResumable(ref, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    if (onProgress) onProgress(prog);
                },
                (err) => reject(err),
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(url);
                }
            );
        });
    };

    /* ----------------- handleFileSelect: sube automáticamente y actualiza estado ----------------- */
    // type: "image" | "imageDetail" | "imageBack"
    // targetState: "nuevo" | "edit"
    const handleFileSelect = async (type, file, targetState = "nuevo") => {
        if (!file) return;

        // preview inmediato
        const localUrl = URL.createObjectURL(file);
        setPreviewImage((prev) => ({ ...prev, [type]: localUrl }));
        setFilesToUpload((prev) => ({ ...prev, [type]: file }));
        setUploadProgress((prev) => ({ ...prev, [type]: 0 }));

        // subir archivo
        try {
            const url = await uploadFileAndGetURL(
                file,
                "productos",
                (prog) => setUploadProgress((prev) => ({ ...prev, [type]: prog }))
            );

            if (targetState === "nuevo") {
                setNuevo((prev) => ({ ...prev, [type]: url }));
            } else {
                setTempData((prev) => ({ ...prev, [type]: url }));
            }

            // limpiar archivo local (opcional)
            setFilesToUpload((prev) => ({ ...prev, [type]: null }));
            setUploadProgress((prev) => ({ ...prev, [type]: 100 }));
        } catch (e) {
            console.error("Error al subir:", e);
            alert("Error subiendo la imagen. Reintentá.");
            setUploadProgress((prev) => ({ ...prev, [type]: 0 }));
        }
    };

    /* ----------------- Edición y Guardado ----------------- */
    const activarEdicion = (p) => {
        setEditando(p.id);
        // copy full product to tempData (asegúrate campos coinciden)
        setTempData({ ...p });
        setPreviewImage({ image: "", imageDetail: "", imageBack: "" });
        setFilesToUpload({ image: null, imageDetail: null, imageBack: null });
        setUploadProgress({ image: 0, imageDetail: 0, imageBack: 0 });
    };

    const cancelarEdicion = () => {
        setEditando(null);
        setTempData({});
        setPreviewImage({ image: "", imageDetail: "", imageBack: "" });
        setFilesToUpload({ image: null, imageDetail: null, imageBack: null });
        setUploadProgress({ image: 0, imageDetail: 0, imageBack: 0 });
    };

    const cambiarCampo = (campo, valor) => {
        setTempData((prev) => ({ ...prev, [campo]: valor }));
    };

    const guardarCambios = async (id) => {
        if (!confirm("¿Guardar cambios en este producto?")) return;

        setGuardando(true);

        try {
            // tempData ya puede contener las URLs cargadas por handleFileSelect (image, imageDetail, imageBack)
            await updateDoc(doc(db, "productos", id), tempData);
            await fetchProductos();
            cancelarEdicion();
        } catch (e) {
            console.error(e);
            alert("Error guardando cambios");
        } finally {
            setGuardando(false);
        }
    };

    /* ----------------- Eliminar ----------------- */
    const eliminarProducto = async (id) => {
        if (!confirm("¿Eliminar producto definitivamente?")) return;
        await deleteDoc(doc(db, "productos", id));
        fetchProductos();
    };

    /* ----------------- Crear nuevo ----------------- */
    const crearProducto = async () => {
        // validaciones (imagen ya debería estar cargada en nuevo.image / imageDetail por handleFileSelect)
        if (!nuevo.title.trim()) return alert("El título es obligatorio");
        if (!nuevo.category.trim()) return alert("La categoría es obligatoria");
        if (!nuevo.price) return alert("El precio es obligatorio");
        if (!nuevo.image.trim()) return alert("La imagen principal es obligatoria");
        if (!nuevo.imageDetail.trim()) return alert("La imagen de detalle es obligatoria");

        setGuardando(true);

        try {
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

            // reset
            setModalOpen(false);
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
            setPreviewImage({ image: "", imageDetail: "", imageBack: "" });
            setFilesToUpload({ image: null, imageDetail: null, imageBack: null });
            setUploadProgress({ image: 0, imageDetail: 0, imageBack: 0 });

            fetchProductos();
        } catch (e) {
            console.error(e);
            alert("Error creando producto");
        } finally {
            setGuardando(false);
        }
    };

    /* ----------------- JSX ----------------- */
    return (
        <div className="adminProductos-container">
            <h2 className="productos-title">Administración de Productos</h2>

            {/* BOTÓN AGREGAR */}
            <button
                className="btn-add"
                onClick={() => {
                    setModalOpen(true);
                }}
            >
                ➕ Agregar producto
            </button>

            {/* -------------------------- MODAL -------------------------- */}
            {modalOpen && (
                <div className="modal-bg">
                    <div className="modal-box">
                        <h3 className="modal-title">Nuevo producto</h3>

                        <div className="modal-grid">
                            <Campo
                                label="Título"
                                edit
                                valor={nuevo.title}
                                onChange={(v) => setNuevo({ ...nuevo, title: v })}
                            />

                            <Campo
                                label="Categoría"
                                edit
                                valor={nuevo.category}
                                onChange={(v) => setNuevo({ ...nuevo, category: v })}
                            />

                            <Campo
                                label="Precio"
                                edit
                                tipo="number"
                                valor={nuevo.price}
                                onChange={(v) => setNuevo({ ...nuevo, price: v })}
                            />

                            <CampoTextarea
                                label="Descripción"
                                edit
                                valor={nuevo.description}
                                onChange={(v) => setNuevo({ ...nuevo, description: v })}
                            />

                            {/* SIN TALLE */}
                            <div className="switch-box">
                                <label>Producto sin talle</label>
                                <input
                                    type="checkbox"
                                    checked={nuevo.sinTalle}
                                    onChange={() => setNuevo({ ...nuevo, sinTalle: !nuevo.sinTalle })}
                                />
                            </div>

                            {/* STOCK TOTAL */}
                            <Campo
                                label="Stock total"
                                tipo="number"
                                edit
                                valor={nuevo.stock}
                                onChange={(v) => setNuevo({ ...nuevo, stock: v })}
                            />

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

                            {/* IMÁGENES - subida por campo */}
                            {/* Imagen principal */}
                            <div>
                                <label>Imagen principal (obligatoria)</label>
                                <div className="image-uploader">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handleFileSelect("image", f, "nuevo");
                                        }}
                                    />
                                    <div className="uploader-preview">
                                        {previewImage.image ? (
                                            <img src={previewImage.image} alt="preview" className="uimg" />
                                        ) : nuevo.image ? (
                                            <img src={nuevo.image} alt="current" className="uimg" />
                                        ) : (
                                            <div className="u-placeholder">Seleccioná una imagen</div>
                                        )}
                                        {uploadProgress.image > 0 && uploadProgress.image < 100 && (
                                            <progress value={uploadProgress.image} max="100">
                                                {uploadProgress.image}%
                                            </progress>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Imagen detalle */}
                            <div>
                                <label>Imagen detalle (obligatoria)</label>
                                <div className="image-uploader">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handleFileSelect("imageDetail", f, "nuevo");
                                        }}
                                    />
                                    <div className="uploader-preview">
                                        {previewImage.imageDetail ? (
                                            <img src={previewImage.imageDetail} alt="preview" className="uimg" />
                                        ) : nuevo.imageDetail ? (
                                            <img src={nuevo.imageDetail} alt="current" className="uimg" />
                                        ) : (
                                            <div className="u-placeholder">Seleccioná una imagen</div>
                                        )}
                                        {uploadProgress.imageDetail > 0 && uploadProgress.imageDetail < 100 && (
                                            <progress value={uploadProgress.imageDetail} max="100">
                                                {uploadProgress.imageDetail}%
                                            </progress>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Imagen espalda */}
                            <div>
                                <label>Imagen espalda (opcional)</label>
                                <div className="image-uploader">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handleFileSelect("imageBack", f, "nuevo");
                                        }}
                                    />
                                    <div className="uploader-preview">
                                        {previewImage.imageBack ? (
                                            <img src={previewImage.imageBack} alt="preview" className="uimg" />
                                        ) : nuevo.imageBack ? (
                                            <img src={nuevo.imageBack} alt="current" className="uimg" />
                                        ) : (
                                            <div className="u-placeholder">Seleccioná una imagen (opcional)</div>
                                        )}
                                        {uploadProgress.imageBack > 0 && uploadProgress.imageBack < 100 && (
                                            <progress value={uploadProgress.imageBack} max="100">
                                                {uploadProgress.imageBack}%
                                            </progress>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-btns">
                            <button
                                className="save-btn"
                                onClick={crearProducto}
                                disabled={
                                    (filesToUpload.image && uploadProgress.image < 100) ||
                                    (filesToUpload.imageDetail && uploadProgress.imageDetail < 100)
                                }
                            >
                                ✔ Crear
                            </button>
                            <button
                                className="cancel-btn"
                                onClick={() => {
                                    setModalOpen(false);
                                    setPreviewImage({ image: "", imageDetail: "", imageBack: "" });
                                    setFilesToUpload({ image: null, imageDetail: null, imageBack: null });
                                    setUploadProgress({ image: 0, imageDetail: 0, imageBack: 0 });
                                }}
                            >
                                ✖ Cancelar
                            </button>
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
                                <img src={p.image} className="img-preview" alt="" />
                                <img src={p.imageBack} className="img-preview" alt="" />
                                <img src={p.imageDetail} className="img-preview" alt="" />
                            </div>

                            <div className="inputs-grid">
                                <Campo
                                    label="Título"
                                    valor={esEdit ? tempData.title : p.title}
                                    edit={esEdit}
                                    onChange={(v) => cambiarCampo("title", v)}
                                />

                                <Campo
                                    label="Categoría"
                                    valor={esEdit ? tempData.category : p.category}
                                    edit={esEdit}
                                    onChange={(v) => cambiarCampo("category", v)}
                                />

                                <CampoTextarea
                                    label="Descripción"
                                    valor={esEdit ? tempData.description : p.description}
                                    edit={esEdit}
                                    onChange={(v) => cambiarCampo("description", v)}
                                />

                                <Campo
                                    label="Precio"
                                    tipo="number"
                                    valor={esEdit ? tempData.price : p.price}
                                    edit={esEdit}
                                    onChange={(v) => cambiarCampo("price", Number(v))}
                                />

                                {/* STOCK TOTAL */}
                                <Campo
                                    label="Stock total"
                                    tipo="number"
                                    valor={esEdit ? tempData.stock : p.stock}
                                    edit={esEdit}
                                    onChange={(v) => cambiarCampo("stock", Number(v))}
                                />

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
                                                        onChange={(e) => cambiarCampo(`stock${t}`, Number(e.target.value))}
                                                    />
                                                ) : (
                                                    <p className="vista-text">{p[`stock${t}`]}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Imagen principal (edición) */}
                                <div>
                                    <label>Imagen principal</label>
                                    {esEdit ? (
                                        <div className="image-uploader">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) handleFileSelect("image", f, "edit");
                                                }}
                                            />
                                            <div className="uploader-preview">
                                                {tempData.image ? (
                                                    <img src={tempData.image} alt="preview" className="uimg" />
                                                ) : p.image ? (
                                                    <img src={p.image} alt="current" className="uimg" />
                                                ) : (
                                                    <div className="u-placeholder">Sin imagen</div>
                                                )}
                                                {uploadProgress.image > 0 && uploadProgress.image < 100 && (
                                                    <progress value={uploadProgress.image} max="100">
                                                        {uploadProgress.image}%
                                                    </progress>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="vista-text url-small">{p.image}</p>
                                    )}
                                </div>

                                {/* Imagen espalda (edición) */}
                                <div>
                                    <label>Imagen espalda</label>
                                    {esEdit ? (
                                        <div className="image-uploader">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) handleFileSelect("imageBack", f, "edit");
                                                }}
                                            />
                                            <div className="uploader-preview">
                                                {tempData.imageBack ? (
                                                    <img src={tempData.imageBack} alt="preview" className="uimg" />
                                                ) : p.imageBack ? (
                                                    <img src={p.imageBack} alt="current" className="uimg" />
                                                ) : (
                                                    <div className="u-placeholder">Sin imagen</div>
                                                )}
                                                {uploadProgress.imageBack > 0 && uploadProgress.imageBack < 100 && (
                                                    <progress value={uploadProgress.imageBack} max="100">
                                                        {uploadProgress.imageBack}%
                                                    </progress>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="vista-text url-small">{p.imageBack}</p>
                                    )}
                                </div>

                                {/* Imagen detalle (edición) */}
                                <div>
                                    <label>Imagen detalle</label>
                                    {esEdit ? (
                                        <div className="image-uploader">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) handleFileSelect("imageDetail", f, "edit");
                                                }}
                                            />
                                            <div className="uploader-preview">
                                                {tempData.imageDetail ? (
                                                    <img src={tempData.imageDetail} alt="preview" className="uimg" />
                                                ) : p.imageDetail ? (
                                                    <img src={p.imageDetail} alt="current" className="uimg" />
                                                ) : (
                                                    <div className="u-placeholder">Sin imagen</div>
                                                )}
                                                {uploadProgress.imageDetail > 0 && uploadProgress.imageDetail < 100 && (
                                                    <progress value={uploadProgress.imageDetail} max="100">
                                                        {uploadProgress.imageDetail}%
                                                    </progress>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="vista-text url-small">{p.imageDetail}</p>
                                    )}
                                </div>
                            </div>

                            <div className="card-buttons">
                                {!esEdit && (
                                    <>
                                        <button className="edit-btn" onClick={() => activarEdicion(p)}>
                                            ✏️ Editar
                                        </button>
                                        <button className="delete-btn" onClick={() => eliminarProducto(p.id)}>
                                            🧺 Eliminar
                                        </button>
                                    </>
                                )}

                                {esEdit && (
                                    <>
                                        <button
                                            className="save-btn"
                                            disabled={guardando}
                                            onClick={() => guardarCambios(p.id)}
                                        >
                                            {guardando ? "Guardando..." : "✔ Guardar"}
                                        </button>

                                        <button className="cancel-btn" disabled={guardando} onClick={cancelarEdicion}>
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
