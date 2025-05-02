import React from "react";
import { Route, Routes, Link } from "react-router-dom";
import StartPage from "./pages/StartPage";

const App: React.FC = () => {
  return (
    <>
      <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
        <Link to="/">Chat</Link>
      </nav>
      <Routes>
        <Route path="/" element={<StartPage />} />
      </Routes>
    </>
  );
};

export default App;
