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

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 CHARACTERS long.";
    }
    if (!hasUppercase) {
      return "Password must include at least one UPPERCASE letter.";
    }
    if (!hasLowercase) {
      return "Password must include at least one LOWERCASE letter.";
    }
    if (!hasNumber) {
      return "Password must include at least one NUMBER.";
    }
    if (!hasSpecialChar) {
      return "Password must include at least one SPECIAL CHARACTER.";
    }
    return null;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

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
      setError("An error occurred while signing up. Please try again.");
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
                />
                <input
                  type="text"
                  className="input-sing-up"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                />
                <input
                  type="email"
                  className="input-sing-up"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <input
                  type="password"
                  className="input-sing-up"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <input
                  type="password"
                  className="input-sing-up"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                {password.length > 0 && (
                  <p
                    className={`password-hint ${validatePassword(password) ? "error-message" : "success-message"
                      }`}
                  >
                    {validatePassword(password) || "Password meets all security requirements!"}
                  </p>
                )}
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
