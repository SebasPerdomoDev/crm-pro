import React from "react";
import "./Login.css"; // Este archivo contendrá los estilos

export default function Login() {
  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">INCIHUILA</h2>
        <form className="login-form">
          <label className="login-label">Correo electrónico</label>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            className="login-input"
            required
          />
          <label className="login-label">Contraseña</label>
          <input
            type="password"
            placeholder="********"
            className="login-input"
            required
          />
          
          <button type="submit" className="login-button">
            Entrar
          </button>
        </form>
        
      </div>
    </div>
  );
}
