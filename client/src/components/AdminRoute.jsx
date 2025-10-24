import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const AdminRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.email === "admin@gmail.com") {
                setIsAdmin(true);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <p className="text-center mt-10">Verificando acceso...</p>;

    if (!isAdmin) return <Navigate to="/home" replace />;

    return children;
};

export default AdminRoute;
