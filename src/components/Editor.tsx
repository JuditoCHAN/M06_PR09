import JoditEditor from 'jodit-react';
import React, { useState, useEffect, useRef } from 'react';

const Editor = ({fileSelector }) => {
  const [content, setContent] = useState('');
  const ws = useRef(null);
  const clientId = useRef(fileSelector);
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
    //setContent(newContent);
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
      <JoditEditor
        value={content}
        config={{ readonly: false, height: 400 }}
        onChange={(e) => handleContentChange(e)}
        onBlur={handleContentChange}
      />


    </div>
    
  );
};

export default Editor;
