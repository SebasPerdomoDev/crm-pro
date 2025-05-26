import React from "react";
import "./Login.css";
import { Box, useTheme } from "@mui/material";
import { tokens } from "../../theme";

export default function Login() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

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
          background: `${colors.primary[400]}`,
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
            style={{ width: 250, height: 100, objectFit: "contain" }}
          />
        </Box>
        <form className="login-form">
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
            placeholder="correo@ejemplo.com"
            className="login-input"
            required
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
          <input
            type="password"
            placeholder="********"
            className="login-input"
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: 24,
              borderRadius: 6,
              border: "none",
              background: colors.primary[300],
              color: colors.grey[100],
              fontSize: "1rem",
              outline: "none",
            }}
          />
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
      </Box>
    </div>
  );
}
