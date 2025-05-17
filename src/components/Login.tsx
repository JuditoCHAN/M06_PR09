import React, { useState } from "react";
import "../css/login.css";
import type { Usuario } from "../types/Usuario";

interface LoginProps {
  onLoginSuccess: (usuario: Usuario) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();
      if (!data.success) throw new Error("Error en la solicitud de login");
      const usuario: Usuario = data.usuario;
      alert(`Bienvenido, ${usuario.nombre}`);
      setError(null);
      onLoginSuccess(usuario);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError("Credenciales no válidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-glass">
        <h2 className="login-title">Bienvenido</h2>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="login-input"
          />
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
          />
          <button type="submit" className="login-button">
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                <span> Cargando ...</span>
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
