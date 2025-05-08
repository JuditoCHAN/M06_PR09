import React from "react";
import { Route, Routes, Link } from "react-router-dom";
import StartPage from "./pages/StartPage";
import DashboardPage from "./pages/DashboardPage";
import "./css/app.css";
const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

      </Routes>
    </>
  );
};

export default App;
