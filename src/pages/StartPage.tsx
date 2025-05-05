import React, { useEffect, useState } from "react";
import Login from "../components/Login";
import { Chat } from "../components/Chat";

const StartPage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedLoginStatus = localStorage.getItem("isLoggedIn");

    if (storedUsername && storedLoginStatus === "true") {
      setUsername(storedUsername);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = (username: string) => {
    localStorage.setItem("username", username);
    localStorage.setItem("isLoggedIn", "true");
    setUsername(username);
    setIsLoggedIn(true);
  };

  return (
    <main>
      {isLoggedIn ? (
        <Chat username={username} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </main>
  );
};

export default StartPage;
