// StartPage.tsx
// Página principal de la aplicación
//
// Funcionalidad principal:
//   - Gestiona el estado de login y usuario
//   - Muestra el dashboard principal con FileManager, Editor y Chat si el usuario está logueado
//   - Muestra el formulario de login si el usuario no está logueado
//
// Principales funciones internas:
//   - handleLoginSuccess: Guarda el usuario en sessionStorage y actualiza el estado
//
// Efectos:
//   - useEffect para recuperar el usuario y estado de login de sessionStorage al cargar la página
//
// Renderiza:
//   - Navbar con saludo y botón de cerrar sesión
//   - FileManager, Editor y Chat si el usuario está logueado
//   - Login si el usuario no está logueado

import React, { useEffect, useState } from "react";
import Login from "../components/Login";
import { Chat } from "../components/Chat";
import FileManager from "../components/FileManager";
import Editor from "../components/Editor";
import type { Usuario } from "../types/Usuario";

const StartPage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [fileSelector, setFileSelector] = useState(null);

  useEffect(() => {
    const storedUsuario = sessionStorage.getItem("usuario");
    const storedLoginStatus = sessionStorage.getItem("isLoggedIn");
    if (storedUsuario && storedLoginStatus === "true") {
      setUsuario(JSON.parse(storedUsuario));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = (usuario: Usuario) => {
    sessionStorage.setItem("usuario", JSON.stringify(usuario));
    sessionStorage.setItem("isLoggedIn", "true");
    setUsuario(usuario);
    setIsLoggedIn(true);
  };

  useEffect(() => {
    console.log(fileSelector);
  },[fileSelector])


  return (
    <main className="container-fluid vh-100 d-flex flex-column">
      {isLoggedIn ? (
        <>
          <nav className={"navbar navbar-expand-lg navbar-dark bg-primary w-100 px-4"} style={{height: "10vh"}}>
            <h1 className={"navbar-brand mb-0 h1"}>Bienvenido, {usuario?.nombre}</h1>
            <button className={"btn btn-danger ms-auto"}
              onClick={() => {
                sessionStorage.clear();
                setIsLoggedIn(false);
                setUsuario(null);
              }}
            >
              Cerrar sesión
              <i className="bi bi-box-arrow-right ms-2"></i>
            </button>
          </nav>


          <div className="row flex-grow-1 overflow-hidden">
          {fileSelector ? (
            <>
              <div className="col-3 h-100 overflow-auto">
                <FileManager setFileSelector={setFileSelector} />
              </div>
              <div className="col-6 h-100 overflow-auto">
                <Editor fileSelector={fileSelector} />
              </div>
            </>
          ) : (
            <div className="col-9 h-100 overflow-auto">
              <FileManager setFileSelector={setFileSelector} />
            </div>
          )}
            
            
            <div className="col-3 h-100 overflow-auto">
              <Chat username={usuario?.nombre || ""} />
            </div>
          </div>
          <style type="text/css">
            {`
              body {
                background-color: #f8f9fa !important;
                background: none;
              }
            `}
          </style>
        </>
        
      ) : (
        <div className="row h-100 align-items-center justify-content-center">
          <div className="col-12 d-flex justify-content-center">
            <Login onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}
    </main>
  );
};

export default StartPage;
