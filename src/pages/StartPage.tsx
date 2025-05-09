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
        <Chat username={username} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </main>
  );
};

export default StartPage;
