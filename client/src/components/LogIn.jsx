import "../styles/LogIn.css";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, signInWithEmailAndPassword, signOut } from "../firebase/config";
import { useUser } from "../context/UserContext"; // Importar el hook del contexto

function LogIn() {
  const { userEmail, setUserEmail, loggedIn, setLoggedIn } = useUser(); // Usar el contexto
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Función para limpiar el email del usuario
  const getCleanedEmail = (email) => {
    const atIndex = email.indexOf("@");
    const cleanedEmail = email.slice(0, atIndex);
    return cleanedEmail;
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setLoggedIn(true);
        const cleanedEmail = getCleanedEmail(user.email);
        setUserEmail(cleanedEmail);
        localStorage.setItem("userEmail", cleanedEmail);
        localStorage.setItem("loggedIn", "true");
      } else {
        setLoggedIn(false);
        setUserEmail("");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("loggedIn");
      }
    });
    return unsubscribe;
  }, [setLoggedIn, setUserEmail]);

  const handleLogIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      const userEmail = user ? getCleanedEmail(user.email) : "Usuario";
      setLoggedIn(true);
      setUserEmail(userEmail);
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("loggedIn", "true");

      // Redirigir a la página anterior
      navigate(-1);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogOut = async () => {
    try {
      await signOut(auth);
      setLoggedIn(false);
      setUserEmail("");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("loggedIn");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <section className="LogInFormContainer">
      <section className="LogInForm-log-in">
        <div className="form-box-log-in">
          {loggedIn ? (
            <div className="logedInContainer">
              <p className="logedInUser">Welcome {userEmail}</p>
              <Link className="logedInButtonTienda" to="/Productos">
                ¡Visitar Tienda!
              </Link>
              <button onClick={handleLogOut} className="logOutButton">Log out</button>
            </div>
          ) : (
            <form className="form-log-in" onSubmit={handleLogIn}>
              <span className="title-log-in">{loggedIn ? "Log out" : "Log in"}</span>
              <span className="subtitle-log-in">Welcome back.</span>
              <div className="form-container-log-in">
                <input
                  type="email"
                  className="input-log-in"
                  placeholder="Email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                ></input>
                <input
                  type="password"
                  className="input-log-in"
                  placeholder="Password"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                ></input>
                <button type="submit" className="logedInButton" disabled={loading}>
                  {loading ? "Logging in..." : "Log in"}
                </button>
              </div>
            </form>
          )}
          {error && <p className="error-message">{error}</p>}
          {!loggedIn && !loading && (
            <div className="form-section-log-in">
              <p>
                Don't have an account? <Link to="/SingUp">Sign Up</Link> or{" "}
                <Link to="/">Go Home</Link>
              </p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

export default LogIn;
