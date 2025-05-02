import React, { useState } from "react";

interface LoginProps {
    onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ( { onLoginSuccess } ) => {
    const [username, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json',},
                body: JSON.stringify({ username, password }),
            });

            if(!response.ok) throw new Error('Error en la solicitud');
            const data = await response.json();
            alert(`Bienvenido, ${data.username}`);
            setError(null);
            onLoginSuccess(username || 'user'); // Llama a la función de éxito de inicio de sesión
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            setError('Credenciales no válidas');
        }
    }

    return (
        <div>
            <h2>Login</h2>
            <input 
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={e => setUserName(e.target.value)}
            />
            <input 
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Iniciar sesión</button>

            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default Login;