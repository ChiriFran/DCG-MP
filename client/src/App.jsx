import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home.jsx";
import ItemListContainer from "./components/ItemListContainer.jsx";
import ItemDetailContainer from "./components/ItemDetailContainer.jsx";
import Navbar from "./components/Navbar.jsx";
import Eventos from "./components/Eventos.jsx";
import Blogs from "./components/Blogs.jsx";
import AboutUs from "./components/AboutUs.jsx";
import Faq from "./components/Faq.jsx";
import LogIn from "./components/LogIn.jsx";
import SignUp from "./components/SignUp.jsx";
import Carrito from "./components/Carrito.jsx";
import BuySuccess from "./components/BuySuccess.jsx";
import BuyPending from "./components/BuyPending.jsx";
import BuyFailed from "./components/BuyFailed.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import MusicList from "./components/MusicList.jsx";
import CartPopup from "./components/CartPopup.jsx";
import ContactFooter from "./components/ContactFooter.jsx";
import Footer from "./components/Footer.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import { OrdenCompraProvider } from "./context/OrdenCompraContext.jsx";

function App() {
  return (
    <OrdenCompraProvider>
      <UserProvider>
        <CartProvider>
          <HashRouter>
            <Navbar />
            <ScrollToTop>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/Productos" element={<ItemListContainer />} />
                <Route path="/Productos/:category" element={<ItemListContainer />} />
                <Route path="/Music" element={<MusicList />} />
                <Route path="/ProductoDetalles/:id" element={<ItemDetailContainer />} />
                <Route path="/AboutUs" element={<AboutUs />} />
                <Route path="/Faq" element={<Faq />} />
                <Route path="/Eventos" element={<Eventos />} />
                <Route path="/Blogs" element={<Blogs />} />
                <Route path="/LogIn" element={<LogIn />} />
                <Route path="/SignUp" element={<SignUp />} />
                <Route path="/Carrito" element={<Carrito />} />
                <Route path="/BuySuccess" element={<BuySuccess />} />
                <Route path="/BuyFailed" element={<BuyFailed />} />
                <Route path="/BuyPending" element={<BuyPending />} />
                <Route path="*" element={<p>Not Found</p>} />
              </Routes>
            </ScrollToTop>
            <CartPopup />
            <ContactFooter />
            <Footer />
          </HashRouter>
        </CartProvider>
      </UserProvider>
      </OrdenCompraProvider>
        );
}

        export default App;
