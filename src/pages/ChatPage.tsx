import React, { useState } from 'react';
import ChatRoom from '../components/ChatRoom';
import Login from '../components/Login';

const ChatPage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  const handleLoginSuccess = (username: string) => {
    setIsLoggedIn(true);
    setUsername(username);
  };

  return (
    <main>
      {isLoggedIn ? <ChatRoom username={username}/> : <Login onLoginSuccess = {handleLoginSuccess} />}
    </main>
  );
};

export default ChatPage;
