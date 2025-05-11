import React, { useState, useEffect, useRef } from 'react';
import JoditEditor from 'jodit-react';

const RealTimeEditor = () => {
  const [content, setContent] = useState('');
  const ws = useRef(null);
  const clientId = useRef(crypto.randomUUID());

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:5000/editor');

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
      ws.current.send(JSON.stringify({ content: newContent, author: clientId.current }));
    }
  };
  return (
    <div>
      <JoditEditor
        value={content}
        config={{ readonly: false, height: 400 }}
        onChange={handleContentChange}
      />
    </div>
  );
};

export default RealTimeEditor;
