import React, { useEffect, useRef, useState } from 'react';
import { MensajeChat } from '../types/MensajeChat';
// import '../utils/mockSocket'; // se utiliza de manera implícita para interceptar y manejar las conexiones WebSocket realizadas por el componente, permitiendo q el componente funcione sin necesidad de un servidor WebSocket real

interface ChatRoomProps {
  username: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ username }) => {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [input, setInput] = useState('');
  const [expulsado, setExpulsado] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:5001');

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.tipo === 'expulsion') {
        setExpulsado(true);
        ws.current?.close();
      } else if (data.tipo === 'mensaje') {
        setMensajes(prev => [...prev, data]);
      }
    };

    ws.current.onerror = (error) => {
      console.error('Error en la conexión WebSocket:', error);
    };

    ws.current.onclose = () => {
      console.log('Conexión WebSocket cerrada');
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const handleEnviar = () => {
    if (!ws.current || expulsado) return;

    const nuevoMensaje: MensajeChat = {
      autor: username,
      contenido: input,
      timestamp: new Date().toISOString(),
    };

    ws.current.send(JSON.stringify({ tipo: 'mensaje', ...nuevoMensaje }));
    setInput('');
  };

  return (
    <section>
      <h2>Chat en tiempo real</h2>
      {expulsado ? (
        <p>🚫 Has sido expulsado del chat.</p>
      ) : (
        <>
          <div style={{ border: '1px solid #ccc', padding: '1rem', height: '200px', overflowY: 'auto' }}>
            {mensajes.map((msg, index) => (
              <p key={index}>
                <strong>{msg.autor}:</strong> {msg.contenido}
              </p>
            ))}
          </div>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button onClick={handleEnviar}>Enviar</button>
        </>
      )}
    </section>
  );
};

export default ChatRoom;
