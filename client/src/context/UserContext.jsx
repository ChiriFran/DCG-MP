import { createContext, useContext, useState, useEffect } from 'react';

// Crear el contexto
const UserContext = createContext();

// Crear el proveedor del contexto
export const UserProvider = ({ children }) => {
    const [userEmail, setUserEmail] = useState("");
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        const storedUserEmail = localStorage.getItem("userEmail");
        const storedLoggedIn = localStorage.getItem("loggedIn") === "true";

        if (storedLoggedIn) {
            setLoggedIn(true);
            setUserEmail(storedUserEmail);
        }
    }, []);

    return (
        <UserContext.Provider value={{ userEmail, setUserEmail, loggedIn, setLoggedIn }}>
            {children}
        </UserContext.Provider>
    );
};

// Hook para acceder al contexto
export const useUser = () => {
    return useContext(UserContext);
};
