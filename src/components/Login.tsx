import React, { useState } from "react";
import "../css/login.css";

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e) => {
    e.preventDefault(); //que no recarge la pagina

    try {
      const response = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error("Error en la solicitud");
      const data = await response.json();
      alert(`Bienvenido, ${data.username}`);
      setError(null);
      onLoginSuccess(username || "user"); // Llama a la función de éxito de inicio de sesión
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError("Credenciales no válidas");
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUserName(e.target.value)}
          className="login-input"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
        />
        <button type="submit" className="login-button">
          Iniciar sesión
        </button>
      </form>

      {error && <p className="login-error">{error}</p>}
    </div>
  );
};

export default Login;
