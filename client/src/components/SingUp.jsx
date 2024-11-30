import "../styles/SingUp.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { auth, createUserWithEmailAndPassword } from "../firebase/config";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase/config";

function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage("");
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      await addDoc(collection(db, "users"), {
        uid: user.uid,
        firstName: firstName,
        lastName: lastName,
        email: email,
      });

      setSuccessMessage("Registration successfully completed!");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="SignUpFormContainer">
        <section className="SignUpForm-sing-up">
          <div className="form-box-sing-up">
            <form className="form-sing-up" onSubmit={handleSignUp}>
              <span className="title-sing-up">Create account</span>
              <span className="subtitle-sing-up">Create a free account with your email.</span>
              <div className="form-container-sing-up">
                <input
                  type="text"
                  className="input-sing-up"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                ></input>
                <input
                  type="text"
                  className="input-sing-up"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                ></input>
                <input
                  type="email"
                  className="input-sing-up"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                ></input>
                <input
                  type="password"
                  className="input-sing-up"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                ></input>
                <input
                  type="password"
                  className="input-sing-up"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                ></input>
                <button type="submit" disabled={loading}>
                  {loading ? "Signing up..." : "Sign up"}
                </button>
              </div>
            </form>
            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
            <div className="form-section-sing-up">
              <p>
                Have an account? <Link to="/LogIn">Log In</Link> or <Link to="/">Go Home</Link>
              </p>
            </div>
          </div>
        </section>
      </section>
    </>
  );
}

export default SignUp;
