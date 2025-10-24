import React, { useState, useEffect } from "react";
import "../styles/PopUpNewsletter.css";
import { db } from "../firebase/config";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

const PopUpNewsletter = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doNotShow, setDoNotShow] = useState(false);

  useEffect(() => {
    const showPopUp = localStorage.getItem("doNotShowPopUp") !== "true";
    if (isOpen && showPopUp) {
      setTimeout(() => setIsVisible(true), 10);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    // Validar formato de correo
    const emailPattern = /^[a-zA-Z0-9._%+-]+@(gmail|hotmail|yahoo|outlook)\.com$/;
    if (!emailPattern.test(email)) {
      setErrorMessage("Please enter a valid email ending in @gmail.com, @hotmail.com, or @yahoo.com.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 🔹 Verificar si ya existe
      const emailQuery = query(collection(db, "newsletter"), where("email", "==", email));
      const querySnapshot = await getDocs(emailQuery);
      if (!querySnapshot.empty) {
        setErrorMessage("This email is already registered in our newsletter.");
        setIsSubmitting(false);
        return;
      }

      // 🔹 Guardar en Firestore
      await addDoc(collection(db, "newsletter"), {
        email: email,
        timestamp: new Date(),
      });

      // 🔹 Enviar correo de bienvenida
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: "Welcome to Detroit Classic Gallery! 🎉",
          html: `
            <h2>¡Hola!</h2>
            <p>Gracias por suscribirte a nuestro newsletter 💌</p>
            <p>Recibirás promociones, lanzamientos y descuentos exclusivos de <strong>Detroit Classic Gallery</strong>.</p>
            <p>Nos alegra tenerte en nuestra comunidad 💫</p>
          `,
        }),
      });

      // 🔹 Mensaje de éxito visual
      setEmail("");
      setSuccessMessage("🎉 You are subscribed! Welcome to Detroit Classic Gallery!");
      setTimeout(() => {
        setSuccessMessage("");
        handleClose();
      }, 4000);
    } catch (error) {
      console.error("❌ Error subscribing or sending email:", error);
      setErrorMessage("There was an error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (doNotShow) localStorage.setItem("doNotShowPopUp", "true");
    setTimeout(() => onClose(), 300);
  };

  const handleCheckboxChange = () => setDoNotShow(!doNotShow);

  if (!isOpen) return null;

  return (
    <div className={`popupOverlay ${isVisible ? "fadeIn" : "fadeOut"}`} onClick={handleClose}>
      <dialog
        className={`popupNewsletter ${isVisible ? "open" : ""}`}
        open
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modalCloseButton" onClick={handleClose}>X</button>
        <div className="modalNewsletterContainer">
          <h3 className="modalNewsletterTitle">Become part of our community</h3>
          <p className="modalNewsletterText">Receive exclusive promotions and discounts.</p>
          <form className="modalNewsletterForm" onSubmit={handleSubmit}>
            <div className="modalFormGroup">
              <input
                placeholder="email@example.com"
                type="email"
                id="emailPopUp"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {errorMessage && <p className="modalErrorMessage">{errorMessage}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`modalSubmitButton ${isSubmitting ? "modalSubmitting" : ""}`}
            >
              {isSubmitting ? "Sending..." : "Send"}
            </button>
            {successMessage && <p className="modalSuccessMessage">{successMessage}</p>}
          </form>
          <div className="doNotShowAgain">
            <input
              type="checkbox"
              id="doNotShow"
              checked={doNotShow}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="doNotShow">Do not show again</label>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default PopUpNewsletter;
