import React, { useState } from "react";
import API from "./api";

const AdminProvisioning = ({ onLogout }) => {
  // 1. Keep data schemas directly inside the component scope to avoid undefined reference crashes
  const sharedFields = [
    {
      id: "username",
      label: "System Username",
      type: "text",
      placeholder: "e.g., ben_m",
      required: true,
    },
    {
      id: "email",
      label: "Institutional Email",
      type: "email",
      placeholder: "e.g., ben@classbridge.edu",
      required: true,
    },
    {
      id: "password",
      label: "Temporary Access Password",
      type: "password",
      placeholder: "••••••••",
      required: true,
    },
  ];

  const roles = [
    { value: "teacher", label: "Teacher / Academic Evaluator" },
    { value: "admin", label: "System Administrator" },
  ];

  const curricula = [
    { value: 1, label: "Cambridge International Syllabus Standards" },
    { value: 2, label: "National Curriculum Assessment Framework" },
  ];

  // 2. State Topology
  const [mode, setMode] = useState("staff"); // 'staff' | 'student'
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "teacher",
    curriculum_id: "",
  });
  const [selectedCurricula, setSelectedCurricula] = useState([]);
  const [status, setStatus] = useState({ state: "idle", feedback: "" });

  // 3. Logout Handler
  const handleLogout = () => {
    // Clear authentication data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Notify parent component if callback provided
    if (onLogout) {
      onLogout();
    }
  };

  // 4. Action Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (curriculumId) => {
    setSelectedCurricula((prev) =>
      prev.includes(curriculumId)
        ? prev.filter((id) => id !== curriculumId)
        : [...prev, curriculumId],
    );
  };

  const handleModeReset = (targetMode) => {
    setMode(targetMode);
    setStatus({ state: "idle", feedback: "" });
    setSelectedCurricula([]);
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "teacher",
      curriculum_id: "",
    });
  };

  // 5. API Dispatch Process
  const executeProvisioning = async (e) => {
    e.preventDefault();
    setStatus({ state: "submitting", feedback: "" });

    if (
      mode === "staff" &&
      formData.role === "teacher" &&
      selectedCurricula.length === 0
    ) {
      setStatus({
        state: "error",
        feedback: "Please assign the teacher to at least one curriculum track.",
      });
      return;
    }

    const targetUrl =
      mode === "staff" ? "/admin/onboard-staff" : "/admin/enroll-student";

    const payload =
      mode === "staff"
        ? {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            curricula_ids: formData.role === "teacher" ? selectedCurricula : [],
          }
        : {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            curriculum_id: parseInt(formData.curriculum_id, 10),
          };

    try {
      const response = await API.post(targetUrl, payload);

      if (response.data.success) {
        setStatus({ state: "success", feedback: response.data.message });
        setSelectedCurricula([]);
        setFormData({
          username: "",
          email: "",
          password: "",
          role: "teacher",
          curriculum_id: "",
        });
      }
    } catch (err) {
      setStatus({
        state: "error",
        feedback:
          err.response?.data?.error ||
          "Infrastructure core registry communication failure.",
      });
    }
  };

  return (
    <div className="cb-portal-card">
      <header
        className="cb-portal-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1>ClassBridge Identity Engine</h1>
          <p>
            Provision user contexts directly into secured relational ledger
            tracks.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            backgroundColor: "#e74c3c",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            whiteSpace: "nowrap",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#c0392b")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#e74c3c")}
        >
          Logout
        </button>
      </header>

      {/* Mode Toggles */}
      <div className="cb-toggle-group">
        <button
          type="button"
          onClick={() => handleModeReset("staff")}
          className={`cb-toggle-btn ${mode === "staff" ? "active" : ""}`}
        >
          Staff Directory
        </button>
        <button
          type="button"
          onClick={() => handleModeReset("student")}
          className={`cb-toggle-btn ${mode === "student" ? "active" : ""}`}
        >
          Student Enrollment
        </button>
      </div>

      {/* Notifications */}
      {status.state !== "idle" && status.feedback && (
        <div className={`cb-alert cb-alert-${status.state}`}>
          {status.feedback}
        </div>
      )}

      <form onSubmit={executeProvisioning} className="cb-form">
        {/* Render Primary Core Credentials */}
        {sharedFields.map((field) => (
          <div key={field.id} className="cb-form-group">
            <label htmlFor={field.id}>{field.label}</label>
            <input
              id={field.id}
              type={field.type}
              name={field.id}
              value={formData[field.id] || ""}
              placeholder={field.placeholder}
              onChange={handleInputChange}
              required={field.required}
            />
          </div>
        ))}

        {/* Context-Specific Fields Blocks */}
        {mode === "staff" ? (
          <>
            <div className="cb-form-group">
              <label htmlFor="role">System Authorization Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Teacher Explicit Multi-Curriculum Matrix */}
            {formData.role === "teacher" && (
              <div className="cb-form-group" style={{ marginTop: "1rem" }}>
                <label
                  style={{
                    marginBottom: "0.6rem",
                    display: "block",
                    fontWeight: "bold",
                  }}
                >
                  Assigned Curriculum Track Boundaries
                </label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                    background: "#f9fafb",
                    padding: "14px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                >
                  {curricula.map((track) => (
                    <label
                      key={track.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontWeight: "normal",
                        cursor: "pointer",
                        color: "#374151",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCurricula.includes(track.value)}
                        onChange={() => handleCheckboxChange(track.value)}
                        style={{ width: "auto", cursor: "pointer" }}
                      />
                      {track.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="cb-form-group">
            <label htmlFor="curriculum_id">Academic Curriculum Track</label>
            <select
              id="curriculum_id"
              name="curriculum_id"
              value={formData.curriculum_id}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Bind Academic Track --</option>
              {curricula.map((track) => (
                <option key={track.value} value={track.value}>
                  {track.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={status.state === "submitting"}
          className="cb-submit-btn"
        >
          {status.state === "submitting"
            ? "Processing Registration Ledger..."
            : `Provision ${mode === "staff" ? "Staff Member" : "Student"}`}
        </button>
      </form>
    </div>
  );
};

export default AdminProvisioning;
