import JoditEditor from 'jodit-react';
import React, { useState, useEffect, useRef } from 'react';

const Editor = ({fileSelector }) => {
  const [content, setContent] = useState('');
  const ws = useRef(null);
  const clientId = useRef(fileSelector);
  const fileName = useRef(`${clientId.current}.txt`); // Nombre del archivo basado en el usuario
  const [readOnly, setReadOnly] = useState(true);

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
          setReadOnly(true);
        } else if(msg.author === clientId.current) {
          setReadOnly(false);
        }
      } catch (err) {
        console.error('[WebSocket] Error al procesar mensaje:', err);
      }
    };

    return () => {
      ws.current.close();
    };
  }, [content]);

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
  },[fileSelector])

  const handleContentChange = (newContent) => {
    //setContent(newContent);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          content: newContent,
          author: clientId.current,
          fileName: fileName.current, // enviamos el nombre del archivo al servidor
          date: new Date().toISOString(),
        })
      );
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {readOnly && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          backgroundColor: 'rgba(255, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }}>
          Otro usuario está editando el documento...
        </div>
      )}
      <JoditEditor
        value={content}
        config={{ readonly: readOnly, height: 400 }}
        onChange={(e) => handleContentChange(e)}
        onBlur={handleContentChange}
      />
    </div>
  );
};

export default Editor;
