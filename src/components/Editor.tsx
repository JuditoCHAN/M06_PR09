import React, { useState, useEffect, useRef } from 'react';

const Editor = ({ fileSelector }) => {
  const [content, setContent] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const clientId = useRef(fileSelector);
  const fileName = useRef(`${clientId.current}.txt`); // Nombre del archivo basado en el usuario

  // Conexión al WebSocket
  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:5002/editor');

    ws.current.onopen = () => {
      console.log('[WebSocket] Conectado al servidor');
    };

    ws.current.onmessage = (event) => {
      console.log('[WebSocket] Mensaje recibido bruto:', event.data); // NUEVO LOG

      try {
        const msg = JSON.parse(event.data);
        console.log('[WebSocket] Mensaje parseado:', msg); // NUEVO LOG

        // Si el mensaje es de bloqueo, actualizamos el estado de bloqueo
        if (msg.type === 'lock') {
          setIsLocked(msg.locked && msg.author !== clientId.current);
        }

        // Si el mensaje contiene contenido, sincronizamos el contenido
        if (msg.content && msg.author) {
          setContent(msg.content);
        }
      } catch (err) {
        console.error('[WebSocket] Error al procesar mensaje:', err);
      }
    };
    return () => {
      ws.current?.close();
    };
  }, []);

    const prueba = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5001/file?id=${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      setContent(text);
    } catch (error) {
      console.error("Error fetching file:", error);
    }
  };

  useEffect(() => {
    prueba(fileSelector);
  }, [fileSelector]);
  
  // Función para manejar el cambio de contenido
  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    // Si el WebSocket está abierto y el contenido ha cambiado, lo enviamos
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          content: newContent,
          author: clientId.current,
          fileName: fileName.current,
          date: new Date().toISOString(),
        })
      );
    }
  };

  // Funciones para manejar el foco
  const handleFocus = () => {
    console.log("focus")
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          editorFocus: true,
          author: clientId.current,
          fileName: fileName.current,
          isLocked: true, // El archivo debe estar bloqueado cuando alguien hace foco
        })
      );
    }
  };

  const handleBlur = () => {
    console.log("Dejado el focus")
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          editorFocus: false,
          author: clientId.current,
          fileName: fileName.current,
          isLocked: false, // Desbloquear el archivo cuando se pierde el foco
        })
      );
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {isLocked && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            backgroundColor: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          El documento está bloqueado para edición.
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={isLocked}
        style={{ width: '100%', height: '400px', fontFamily: 'Arial, sans-serif' }}
      />
    </div>
  );
};

export default Editor;
