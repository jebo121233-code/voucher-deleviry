import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./auth.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/user/login", form);
      alert("Login successful!");
      console.log(res.data);
      // Save JWT token in localStorage
      localStorage.setItem("token", res.data.token);
      navigate("/"); // redirect to home
    } catch (err) {
      console.log(err.response?.data || err.message);
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p
        className="signup-link"
      >
        Don't have an account?
      </p>

      <div className="signUp">
      <button
        onClick={() => navigate("/signup")}
      >
        Create Account
      </button>
      </div>
    </div>
  );
}