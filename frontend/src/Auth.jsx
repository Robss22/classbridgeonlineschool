import React, { useState } from "react";
import API from "./api";

function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Signup modes
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [curriculumId, setCurriculumId] = useState("1"); // Default to 1 (Cambridge)
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Dynamic endpoint selection
    const endpoint = isLogin ? "/auth/login" : "/auth/signup";

    // Enforce role security: Self-signups are strictly registered as students
    const payload = isLogin
      ? { email, password }
      : {
          username,
          email,
          password,
          role: "student",
          curriculum_id: parseInt(curriculumId),
        };

    try {
      setLoading(true);
      const response = await API.post(endpoint, payload);

      if (response.data.success) {
        if (isLogin) {
          // 1. Store token and user details in localStorage
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));

          // 2. Notify the parent App component that login succeeded
          onAuthSuccess(response.data.user);
        } else {
          // If signup succeeded, switch them automatically to the login view
          alert(
            "Registration successful! Please log in with your new student credentials.",
          );
          setIsLogin(true);
          setError("");
          setPassword(""); // Clear out password text securely
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          "Authentication failed. Check your network connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "80px auto",
        padding: "30px",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        fontFamily: "sans-serif",
        color: "#2c3e50",
      }}
    >
      <h2
        style={{ textAlign: "center", marginBottom: "25px", color: "#2c3e50" }}
      >
        {isLogin ? "Log In to ClassBridge" : "Create an Account"}
      </h2>

      {error && (
        <div
          style={{
            backgroundColor: "#fde8e8",
            color: "#e74c3c",
            padding: "12px",
            borderRadius: "5px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        {!isLogin && (
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
              placeholder="e.g., john_doe"
            />
          </div>
        )}

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
            placeholder="student@classbridge.com"
          />
        </div>

        <div>
          <label
            style={{
              style: "block",
              marginBottom: "5px",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
            placeholder="••••••••"
          />
        </div>

        {/* CURRICULUM SELECTOR: Only visible during account signup */}
        {!isLogin && (
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "12px",
              borderRadius: "6px",
              borderLeft: "4px solid #3498db",
              marginTop: "5px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
                fontSize: "14px",
                color: "#2c3e50",
              }}
            >
              Select Your Curriculum
            </label>
            <select
              value={curriculumId}
              onChange={(e) => setCurriculumId(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: "#fff",
              }}
            >
              <option value="1">
                Cambridge Assessment International Education
              </option>
              <option value="2">
                UNEB (Uganda National Examinations Board)
              </option>
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: "#2c3e50",
            color: "#ffffff",
            padding: "12px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            marginTop: "10px",
            fontSize: "16px",
          }}
        >
          {loading ? "Processing..." : isLogin ? "Sign In" : "Register Account"}
        </button>
      </form>

      <p
        style={{
          textAlign: "center",
          marginTop: "20px",
          fontSize: "14px",
          color: "#7f8c8d",
        }}
      >
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <span
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}
          style={{
            color: "#3498db",
            cursor: "pointer",
            fontWeight: "bold",
            textDecoration: "underline",
          }}
        >
          {isLogin ? "Sign Up" : "Log In"}
        </span>
      </p>
    </div>
  );
}

export default Auth;
