import React, { useState, useEffect, useRef } from "react";
import "../css/chat.css";

interface ChatProps {
  username: string;
}

export const Chat: React.FC<ChatProps> = ({ username }) => {
  const [mensaje, setMensaje] = useState("");
  const [nombre] = useState(username);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Establecer la conexión al WebSocket
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5001/chat");
    setSocket(ws);

    ws.onmessage = (event) => {
      //console.log("Mensaje recibido del servidor:", event.data);
      try {
        const data = JSON.parse(event.data);
        console.log(data);
        if(Array.isArray(data)){
          data.map((msg: any) => {
            setMessages((prevMessages) => [
              ...prevMessages,
              { sender: msg.sender, text: msg.text, date: msg.date },
            ]);
          })
        }else{
          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: data.sender, text: data.text, date: data.date },
          ]);

        }

      } catch (error) {
        console.error("Error al parsear el mensaje recibido:", error);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // envio de mensajes
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); //que no recarge la pagina
    const date = new Date();
    socket?.send(JSON.stringify({ sender: nombre, text: mensaje, date: date.toISOString() }));
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: nombre, text: mensaje, date: date.toISOString() },
    ]);
    setMensaje("");
    
  };

  const handleChangeMensaje = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMensaje(e.target.value);
  };

  return (
    <div className="container py-4">
      <div
        className="chat-container d-flex flex-column rounded-4 shadow-lg overflow-hidden"
        style={{
          backgroundColor: "white",
          height: "80vh",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
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

            return (
              <div
                key={index}
                className={`message ${
                  msg.sender === nombre ? "user text-end" : "others"
                }`}
              >
                <div className="message-text bg-primary text-white p-3 rounded-4 d-inline-block shadow-sm">
                  <div>
                    <strong>{msg.sender === nombre ? nombre : msg.sender}:</strong>{" "}
                    {msg.text}
                  </div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: "4px" }}>
                    {hora}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="chat-input border-top p-3"
          style={{ backgroundColor: "#f7f7f7" }}
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
              style={{
                border: "1px solid #ddd",
                borderRadius: "20px",
                padding: "12px 20px",
                flexGrow: 1,
                marginRight: "7px",
                fontSize: "16px",
              }}
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
                cursor: "pointer",
                transition: "background-color 0.3s ease",
                opacity: mensaje ? 1 : 0.5,
              }}
              disabled={!mensaje}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
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
      <button>
        
      </button>
    </div>
  );
};
