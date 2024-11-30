import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/HomeNavLinks.css";

function HomeNavLinks() {
  const location = useLocation();

  return (
    <div className="homeNavLinksContainer">
      <ul>
        <Link to="/Productos" className={`homeNavLink ${location.pathname === "/Productos" ? "active" : ""}`}>
          Shop
        </Link>
      </ul>
      <ul>
        <Link to="/Music" className={`homeNavLink ${location.pathname === "/Music" ? "active" : ""}`}>
          Music
        </Link>
      </ul>
      <ul>
        <Link to="/Eventos" className={`homeNavLink ${location.pathname === "/Eventos" ? "active" : ""}`}>
          Events
        </Link>
      </ul>
      <ul>
        <Link to="/Blogs" className={`homeNavLink ${location.pathname === "/Blogs" ? "active" : ""}`}>
          Blogs
        </Link>
      </ul>
      <ul>
        <Link to="/AboutUs" className={`homeNavLink ${location.pathname === "/AboutUs" ? "active" : ""}`}>
          About Us
        </Link>
      </ul>
      <ul>
        <Link to="/Faq" className={`homeNavLink ${location.pathname === "/Faq" ? "active" : ""}`}>
          FAQ
        </Link>
      </ul>
    </div>
  );
}

export default HomeNavLinks;
