import React from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import ChatPage from './pages/ChatPage';

const App: React.FC = () => {
  return (
    <>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/">Chat</Link>
      </nav>
      <Routes>
        <Route path="/" element={<ChatPage />} />
      </Routes>
    </>
  );
};

export default App;
