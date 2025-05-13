import React, { useState, useEffect, useRef } from 'react';

const RealTimeEditor = () => {
  const [content, setContent] = useState('');
  const ws = useRef(null);
  const clientId = useRef(crypto.randomUUID());
  const fileName = useRef(`${clientId.current}.txt`); // Nombre del archivo basado en el usuario

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:5002/editor');

    ws.current.onopen = () => {
      console.log('[WebSocket] Conectado al servidor');
    };

    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.author !== clientId.current && msg.content !== content) {
          setContent(msg.content);
        }
      } catch (err) {
        console.error('[WebSocket] Error al procesar mensaje:', err);
      }
    };

    return () => {
      ws.current.close();
    };
  }, [content]);

  const handleContentChange = (newContent) => {
    setContent(newContent);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          content: newContent,
          author: clientId.current,
          fileName: fileName.current, // Enviar el nombre del archivo al servidor
        })
      );
    }
  };

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        style={{ width: '100%', height: '90vh', resize: 'none' }}
      ></textarea>
    </div>
  );
};

export default RealTimeEditor;
