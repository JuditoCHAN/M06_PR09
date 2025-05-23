import React, { useState, useEffect, useRef } from "react";
import "../css/chat.css";
import { MensajeChat } from "../types/MensajeChat";

// Chat.tsx
// Componente de chat en tiempo real con WebSocket y visualización de historial
//
// Props:
//   - username: string - nombre del usuario actual
//
// Funcionalidad principal:
//   - Conecta a un WebSocket para recibir y enviar mensajes de chat
//   - Muestra mensajes en tiempo real y notificaciones
//   - Permite visualizar y exportar el historial de mensajes
//   - Permite borrar el chat localmente
//
// Principales funciones internas:
//   - handleVerHistorial: Obtiene el historial de mensajes del backend y lo muestra en un modal
//   - handleSubmit: Envía un mensaje al WebSocket y lo añade al estado local
//   - handleChangeMensaje: Actualiza el estado del input de mensaje
//   - exportChats: Descarga el historial de mensajes como archivo
//   - borrarChats: Limpia los mensajes del estado local
//
// Efectos:
//   - useEffect para conectar/desconectar el WebSocket y recibir mensajes
//   - useEffect para hacer scroll automático al último mensaje
//
// Renderiza:
//   - Lista de mensajes
//   - Input para enviar mensajes
//   - Botones para exportar, ver historial y borrar chats
//   - Modal para mostrar el historial completo

interface ChatProps {
  username: string;
}

export const Chat: React.FC<ChatProps> = ({ username }) => {
  const [mensaje, setMensaje] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<MensajeChat[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [historial, setHistorial] = useState<MensajeChat[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [usuarioEscribiendo, setUsuarioEscribiendo] = useState<string | null>(null);

  const handleVerHistorial = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/messages/view_hist');
      const data = await res.json();
      setHistorial(data);
      setShowModal(true);
    } catch (error) {
      console.error('Error al obtener historial:', error);
    }
  };

  // Establecer la conexión al WebSocket
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5001/chat");
    setSocket(ws);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if(Array.isArray(data)){
          // historial de mensajes
          data.map((msg: MensajeChat) => {
            setMessages((prevMessages) => [
              ...prevMessages,
              { sender: msg.sender, text: msg.text, date: msg.date, type: msg.type },
            ]);
          })
        }else{
          if (data.type === 'typing' && data.sender !== username) { // otro usuario escribiendo
            setUsuarioEscribiendo(data.sender);
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            // limpiar luego de unos segundos
            setTimeout(() => {
              setUsuarioEscribiendo(null);
            }, 4000);
          } else if (data.type !== 'typing') {
            // mensaje individual o notificación (NO agregar typing)
            setMessages((prevMessages) => [
              ...prevMessages,
              { sender: data.sender, text: data.text, date: data.date, type: data.type },
            ]);
          }
        }
      } catch (error) {
        console.error("Error al parsear el mensaje recibido:", error);
      }
    };

    return () => {
      ws.close();
    };
  }, [username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // envio de mensajes
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); //que no recarge la pagina
    const date = new Date();
    socket?.send(JSON.stringify({ sender: username, text: mensaje, date: date.toISOString(), type: 'message' }));
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: username, text: mensaje, date: date.toISOString(), type: 'message' },
    ]);
    setMensaje("");
  };

  const handleChangeMensaje = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMensaje(e.target.value);

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'typing',
        sender: username,
      }));
    }
  };

  const exportChats = () => {
    window.open("http://localhost:5001/api/messages/export_hist", "_blank");
  };

  const borrarChats = () => {
    setMessages([]);
  }

  return (
    <div className="container py-4" style={{ height: "90vh" }}>
      <div className="chat-container d-flex flex-column rounded-4 shadow-lg overflow-hidden">
        {/* MENSAJES */}
        <div className="chat-messages flex-grow-1 overflow-auto p-3">
          {/* Renderizar los mensajes desde el estado */}

          {messages.map((msg, index) => {
            const hora = msg.date
              ? new Date(msg.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            if (msg.type === 'notification') {
              return (
                <div key={index} className="text-center text-secondary my-3" style={{ fontSize: "0.85rem" }}>
                  {msg.text}
                </div>
              );
            }

            return (
              <div
                key={index}
                className={`message ${
                  msg.sender === username ? "user text-end" : "others"
                }`}
              >
                <div className="message-text-wrapper">
                  <div className="message-sender">
                    <strong>{msg.sender === username ? username : msg.sender}</strong>
                  </div>
                  <div className="message-text p-3 d-inline-block shadow-sm position-relative">
                    <div>{msg.text}</div>
                    <div className="message-hour-inside">{hora}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {usuarioEscribiendo && (
            <div className="typing-indicator text-muted">
              {usuarioEscribiendo} está escribiendo
              <span className="dots">
                <span></span><span></span><span></span>
              </span>
            </div>
          )}

          <div ref={bottomRef}></div>
        </div>

        <div
          className="chat-input border-top p-3"
          style={{ backgroundColor: "#f0f2f5" }}
        >
          <form
            className="d-flex align-items-center w-100"
            onSubmit={handleSubmit}
          >
            <input
              name="mensaje"
              type="text"
              placeholder="Escribe un mensaje..."
              className="chat-input-field"
              value={mensaje}
              onChange={handleChangeMensaje}
            />
            <button
              type="submit"
              className="chat-send-button"
              style={{
                backgroundColor: mensaje ? "#007bff" : "#ddd",
                border: "none",
                borderRadius: "50%",
                width: "50px",
                padding: "12px",
                cursor: mensaje ? "pointer" : "default",
                transition: "background-color 0.3s ease",
                opacity: mensaje ? 1 : 0.5,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              disabled={!mensaje}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="21"
                fill="white"
                className="bi bi-send-fill"
                viewBox="0 0 16 16"
              >
                <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <div className="btn-group dropup mt-3">
        <button
          type="button"
          className="btn btn-secondary dropdown-toggle"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i className="bi bi-gear me-2"></i>
          <span className="me-2">Opciones</span>
        </button>
        <ul className="dropdown-menu">
          <li>
            <button className="dropdown-item" onClick={exportChats}>
              <i className="bi bi-file-arrow-down me-2"></i>
              Exportar chats
            </button>
          </li>
          <li>
            <button className="dropdown-item" onClick={handleVerHistorial}>
              <i className="bi bi-eye me-2"></i>
              Visualizar historial
            </button>
          </li>
          <li>
            <button className="dropdown-item" onClick={borrarChats}>
              <i className="bi bi-trash3 me-2"></i>
              Borrar chats
            </button>
          </li>
        </ul>
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)} // cerrar al hacer clic fuera
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '10px',
              maxWidth: '90%',
              maxHeight: '80%',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()} // evita que al hacer clic dentro se cierre
          >
            <h5>Historial de mensajes</h5>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(historial, null, 2)}
            </pre>
            <button onClick={() => setShowModal(false)} className="btn btn-sm btn-secondary mt-3">
              Cerrar
            </button>
          </div>
        </div>
        )}
    </div>
  );
};
