import React, { useState } from "react";
import Login from "../components/Login";
import { Chat } from "../components/Chat";
const StartPage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  const handleLoginSuccess = (username: string) => {
    setIsLoggedIn(true);
    setUsername(username);
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
