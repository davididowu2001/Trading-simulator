import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 1. Read the production base URL environment variable, or fallback to local
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    const endpoint = isLogin ? "/auth/login" : "/auth/signup";

    try {
      // 2. Use the dynamic base URL here instead of localhost:8080
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (response.ok && data.token) {
        localStorage.setItem("jwt", data.token);
        navigate("/portfolio");
      } else {
        setError(
          data.error ||
            data.message ||
            "Authentication failed. Please check your credentials.",
        );
      }
    } catch (error) {
      setError("Network error. Is your backend server running?");
      console.error("Authentication failed:", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "var(--bg-color)",
      }}
    >
      <div
        className="trade-panel"
        style={{
          width: "100%",
          maxWidth: "420px",
          margin: "20px",
          padding: "40px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2 style={{ fontSize: "32px", marginBottom: "10px" }}>
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <div className="subtitle" style={{ margin: "0" }}>
            {isLogin
              ? "Enter your details to access your portfolio."
              : "Start your trading journey today."}
          </div>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "rgba(239, 71, 111, 0.1)",
              color: "#EF476F",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              textAlign: "center",
              fontSize: "14px",
              border: "1px solid rgba(239, 71, 111, 0.3)",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "var(--text-secondary)",
                fontSize: "14px",
              }}
            >
              Username
            </label>
            <input
              type="text"
              required
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "var(--text-secondary)",
                fontSize: "14px",
              }}
            >
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              marginTop: "10px",
              padding: "14px",
              fontSize: "16px",
            }}
          >
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setFormData({ username: "", password: "" });
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-blue)",
              padding: "0",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
