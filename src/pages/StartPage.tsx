import React, { useEffect, useState } from "react";
import Login from "../components/Login";
import { Chat } from "../components/Chat";

const StartPage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    const storedLoginStatus = sessionStorage.getItem("isLoggedIn");

    if (storedUsername && storedLoginStatus === "true") {
      setUsername(storedUsername);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = (username: string) => {
    sessionStorage.setItem("username", username);
    sessionStorage.setItem("isLoggedIn", "true");
    setUsername(username);
    setIsLoggedIn(true);
  };

  return (
    <main>
      {isLoggedIn ? (
        <>
          <nav className={"navbar navbar-expand-lg navbar-dark bg-primary w-100 px-4"}>
            <h1  className={"navbar-brand mb-0 h1"}>Bienvenido, {username}</h1>
            <button className={"btn btn-danger ms-auto"}
              onClick={() => {
                sessionStorage.clear();
                setIsLoggedIn(false);
              }}
            >
              Cerrar sesión
            </button>
          </nav>
          
          <Chat username={username} />
        </>
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </main>
  );
};

export default StartPage;
