import React, { useState, useEffect, useContext, useRef } from "react";
import "../styles/Navbar.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import logoMobile from '../../media/logo/logoMobile.png';
import logo from '../../media/logo/logo.svg';
import cartIcon from '../../media/icons/cart.svg';

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [currentLogo, setCurrentLogo] = useState(window.innerWidth <= 700 ? logoMobile : logo);
  const { carrito } = useContext(CartContext);

  const { userEmail, loggedIn } = useUser();
  const navigate = useNavigate();

  const menuRef = useRef();
  const location = useLocation();

  const getTotalItems = () => carrito.reduce((total, prod) => total + prod.cantidad, 0);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
    document.body.classList.toggle("no-scroll");
  };

  const handleUserClick = () => {
    if (loggedIn) {
      navigate("/LogIn");
    }
  };

  // Cambiar logo según el ancho de pantalla
  useEffect(() => {
    const handleResize = () => {
      setCurrentLogo(window.innerWidth <= 700 ? logoMobile : logo);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        if (showMenu) toggleMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <>
      <nav className={`nav ${showMenu ? "active" : ""}`}>
        <ul className="userMenuDesktop">
          {loggedIn ? (
            <li>
              <button className="link usernameNav" onClick={handleUserClick}>
                {userEmail}
              </button>
            </li>
          ) : (
            <li>
              <Link to="/LogIn" className="link">Log in</Link>
            </li>
          )}
        </ul>

        <Link to="/" className="link">
          <img className="logoImg" src={currentLogo} alt="Logo" />
          <h1 className="brand">Detroit Classic Gallery</h1>
        </Link>

        <ul className="carritoContainerDesktop">
          <li>
            <Link to="/Carrito" className="link">
              <img src={cartIcon} alt="cart" title="cart" className="headerCartIcon" />
              <span>{getTotalItems()}</span>
            </Link>
          </li>
        </ul>

        <div className={`menuIcon ${showMenu ? "hidden" : ""}`} onClick={toggleMenu}>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>

        <div ref={menuRef} className={`mobileMenu ${showMenu ? "active" : "inactive"}`}>
          <div className="closeIcon" onClick={toggleMenu}>
            &#10005;
          </div>
          <ul className="navMenu">
            {["/", "/Productos", "/Music", "/Eventos", "/Blogs", "/AboutUs", "/Faq"].map((path, index) => (
              <li key={index}>
                <Link to={path} className={`link ${location.pathname === path ? "active" : ""}`} onClick={toggleMenu}>
                  {path === "/" ? "Home" : path === "/Productos" ? "Shop" : path.slice(1)}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="carritoContainer">
            <li>
              <Link to="/Carrito" className="link" onClick={toggleMenu}>
                <img src={cartIcon} alt="cart" title="cart" className="headerCartIcon" />
                <span>{getTotalItems()}</span>
              </Link>
            </li>
          </ul>

          <ul className="userMenu">
            {loggedIn ? (
              <li>
                <button className="link usernameNav" onClick={handleUserClick}>{userEmail}</button>
              </li>
            ) : (
              <>
                <li><Link to="/LogIn" className="link">Log in</Link></li>
                <li><Link to="/SingUp" className="link">Create account</Link></li>
              </>
            )}
          </ul>
        </div>
      </nav>

      <div className="navBarDesktopContainer">
        <ul className="navMenuDesktop">
          {["/", "/Productos", "/Music", "/Eventos", "/Blogs", "/AboutUs", "/Faq"].map((path, index) => (
            <li key={index}>
              <Link to={path} className={`link ${location.pathname === path ? "active" : ""}`}>
                {path === "/"
                  ? "Home"
                  : path === "/Productos"
                    ? "Shop"
                    : path === "/Eventos"
                      ? "Events"
                      : path.slice(1)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Navbar;
