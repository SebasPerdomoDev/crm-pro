import React, { useState } from "react";
import "./Login.css";
import { Box, useTheme, Snackbar, Alert, IconButton, TextField } from "@mui/material";
import { tokens } from "../../theme";
import { useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function Login() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  // Simulación de usuario "base de datos"
  const USER = { email: "admin@gmail.com", password: "admin123" };

  const [form, setForm] = useState({ email: "", password: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  // Leer usuarios desde localStorage
  const getUsers = () => {
    const stored = localStorage.getItem("teamUsers");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const users = getUsers();
    const found = users.find(
      (u) => u.email === form.email && u.password === form.password
    );
    if (found) {
      localStorage.setItem("loggedIn", "true");
      setSnackbar({ open: true, message: "Ingresaste correctamente", severity: "success" });
      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } else {
      setSnackbar({ open: true, message: "Credenciales inválidas", severity: "error" });
    }
  };

  return (
    <div
      className="login-container"
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.blueAccent[700]} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        className="login-card"
        sx={{
          background: `${colors.primary[400]}`, // Fondo oscuro original
          color: colors.grey[100],
          borderRadius: 4,
          boxShadow: `0 4px 24px 0 ${colors.primary[900]}55`,
          padding: "2.5rem 2rem",
          minWidth: 340,
          maxWidth: 370,
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: "2rem",
          }}
        >
          <img
            src="/assets/logo inci.png"
            alt="Logo INCIHUILA"
            style={{
              width: 250,
              height: 100,
              objectFit: "contain",
              borderRadius: "18px",
              // sin sombra
            }}
          />
        </Box>
        <form className="login-form" onSubmit={handleSubmit}>
          <label
            className="login-label"
            style={{
              color: colors.grey[200],
              fontWeight: 500,
              marginBottom: 4,
              display: "block",
            }}
          >
            Correo electrónico
          </label>
          <input
            type="email"
            name="email"
            placeholder="correo@ejemplo.com"
            className="login-input"
            required
            value={form.email}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: 18,
              borderRadius: 6,
              border: "none",
              background: colors.primary[300],
              color: colors.grey[100],
              fontSize: "1rem",
              outline: "none",
            }}
          />
          <label
            className="login-label"
            style={{
              color: colors.grey[200],
              fontWeight: 500,
              marginBottom: 4,
              display: "block",
            }}
          >
            Contraseña
          </label>
          <div style={{ position: "relative", width: "100%", marginBottom: 24 }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="********"
              className="login-input"
              required
              value={form.password}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px 40px 10px 12px",
                borderRadius: 6,
                border: "none",
                background: colors.primary[300],
                color: colors.grey[100],
                fontSize: "1rem",
                outline: "none",
              }}
            />
            <IconButton
              onClick={() => setShowPassword((show) => !show)}
              edge="end"
              sx={{
                position: "absolute",
                right: 24, // Más a la izquierda
                top: "38%", // Más arriba
                transform: "translateY(-50%)",
                color: colors.grey[300],
                padding: 0,
                zIndex: 2,
              }}
              tabIndex={-1}
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </div>
          <Box
            component="button"
            type="submit"
            sx={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              background:
                "linear-gradient(90deg, #4cceac 0%, #6870fa 100%)",
              color: "white",
              px: 3,
              py: 1.5,
              borderRadius: "30px",
              fontWeight: "bold",
              boxShadow: "0px 4px 15px rgba(5, 5, 5, 0.6)",
              transition: "background 0.3s ease",
              "&:hover": {
                background:
                  "linear-gradient(90deg, #6870fa 0%, #4cceac 100%)",
              },
              userSelect: "none",
              fontSize: "1rem",
              border: "none",
              outline: "none",
              mt: 2,
            }}
            className="login-button"
          >
            Entrar
          </Box>
        </form>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={2000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </div>
  );
}
