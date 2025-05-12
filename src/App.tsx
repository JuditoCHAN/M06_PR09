import React from "react";
import { Route, Routes } from "react-router-dom";
import StartPage from "./pages/StartPage";
import DashboardPage from "./pages/DashboardPage";
import EditorPage from "./pages/EditorPage";

import "./css/app.css";
const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/editor" element={<EditorPage />} />

      </Routes>
    </>
  );
};

export default App;
