import React, { useState } from "react";
import "../styles/Newsletter.css";
import { db } from "../firebase/config";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

function Newsletter() {
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const emailPattern = /^[a-zA-Z0-9._%+-]+@(gmail|hotmail|yahoo)\.com$/;

    if (!emailPattern.test(email)) {
      setErrorMessage(
        "Please enter a valid email ending in @gmail.com, @hotmail.com, or @yahoo.com."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      // Verificar si el correo ya existe en la base de datos
      const emailQuery = query(collection(db, "newsletter"), where("email", "==", email));
      const querySnapshot = await getDocs(emailQuery);

      if (!querySnapshot.empty) {
        setErrorMessage("This email is already registered in our newsletter.");
        setIsSubmitting(false);
        return;
      }

      // Si no está registrado, lo añadimos
      await addDoc(collection(db, "newsletter"), {
        email: email,
        timestamp: new Date(),
      });

      setEmail("");
      setSuccessMessage("¡You have subscribed to our newsletter!");

      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("There was an error when subscribing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="newsletterContainer">
      <h3 className="newsletterTitle">Become part of our community</h3>
      <p className="newsletterText">
        Receive exclusive promotions and discounts.
      </p>
      <form className="newsletterForm" onSubmit={handleSubmit}>
        <div className="formGroup">
          <input
            placeholder="email@example.com"
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {errorMessage && <p className="errorMessage">{errorMessage}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`submitButton ${isSubmitting ? "submitting" : ""}`}
        >
          {isSubmitting ? "Sending..." : "Send"}
        </button>
        {successMessage && <p className="successMessage">{successMessage}</p>}
      </form>
    </div>
  );
}

export default Newsletter;
