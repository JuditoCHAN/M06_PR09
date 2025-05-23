import React, { useState, useEffect, useRef } from 'react';

// Editor.tsx
// Componente de editor colaborativo en tiempo real con WebSocket
//
// Props:
//   - fileSelector: id del archivo a editar (string o number)
//   - usuario (opcional): objeto usuario con id, nombre y email
//
// Funcionalidad principal:
//   - Permite editar un archivo de texto de forma colaborativa
//   - Sincroniza el contenido con otros usuarios mediante WebSocket
//   - Bloquea el editor si otro usuario está editando el mismo archivo
//   - Permite descargar el archivo actual como .txt
//
// Principales funciones internas:
//   - handleContentChange: Envía el nuevo contenido al backend y actualiza el estado
//   - handleFocus: Notifica al backend que el usuario está editando (bloqueo)
//   - handleBlur: Notifica al backend que el usuario deja de editar (desbloqueo)
//   - loadFileContent: Carga el contenido del archivo seleccionado desde el backend
//
// Efectos:
//   - useEffect para conectar/desconectar el WebSocket y recibir mensajes de bloqueo/contenido
//   - useEffect para actualizar el archivo cuando cambia fileSelector
//
// Renderiza:
//   - Área de texto editable (o bloqueada)
//   - Botón para descargar el documento actual
//   - Aviso visual si el documento está siendo editado por otro usuario

const Editor = ({ fileSelector }) => {
  const [content, setContent] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockOwner, setLockOwner] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const clientId = useRef(Math.random().toString(36).substr(2, 9)); // ID único para este cliente
  const fileName = useRef(`${fileSelector}.txt`); // Nombre del archivo basado en el selector

  // Conexión al WebSocket
  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:5002/editor');

    ws.current.onopen = () => {
      console.log('[WebSocket] Conectado al servidor');
      // Notificar al servidor qué archivo estamos editando al conectarnos
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            author: clientId.current,
            fileName: fileName.current,
          })
        );
      }
    };

    ws.current.onmessage = (event) => {
      console.log('[WebSocket] Mensaje recibido bruto:', event.data);

      try {
        const msg = JSON.parse(event.data);
        console.log('[WebSocket] Mensaje parseado:', msg);

        // Si el mensaje es de bloqueo, actualizamos el estado de bloqueo
        if (msg.type === 'lock') {
          setIsLocked(msg.locked && msg.author !== clientId.current);
          if (msg.author && msg.locked) {
            setLockOwner(msg.author);
          } else {
            setLockOwner('');
          }
        }

        // Si el mensaje contiene contenido y es para nuestro archivo, sincronizamos el contenido
        if (msg.content) {
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

  // Actualizar nombre de archivo cuando cambia el selector
  useEffect(() => {
    const newFileName = `${fileSelector}.txt`;
    
    // Si cambió el nombre del archivo, actualizar y notificar al servidor
    if (fileName.current !== newFileName) {
      fileName.current = newFileName;
      
      // Cargar el contenido del nuevo archivo
      loadFileContent();
      
      // Notificar al servidor sobre el cambio de archivo
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            author: clientId.current,
            fileName: fileName.current,
          })
        );
      }
    }
  }, [fileSelector]);

  const loadFileContent = async () => {
    try {
      const response = await fetch(`http://localhost:5001/file?id=${fileSelector}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      setContent(text);
    } catch (error) {
      console.error("Error fetching file:", error);
      // En caso de error, inicializar con contenido vacío
      setContent('');
    }
  };

  // Carga inicial del contenido del archivo
  useEffect(() => {
    loadFileContent();
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
    console.log("Focus en editor", fileName.current);
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
    console.log("Dejado el focus en", fileName.current);
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

  // Función para descargar como TXT
  const handleDownloadTxt = () => {
    const url = `http://localhost:5001/file/download?id=${fileSelector}&format=txt`;
    window.open(url, '_blank');
  };

  // Función para descargar como PDF
  const handleDownloadPdf = () => {
    const url = `http://localhost:5001/file/download?id=${fileSelector}&format=pdf`;
    window.open(url, '_blank');
  };


  return (
    <div style={{ position: 'relative' }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        Editando: {fileName.current}
      </div>

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
          El documento está siendo editado por otro usuario.
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={isLocked}
        style={{ 
          width: '100%', 
          height: '400px', 
          fontFamily: 'Rubik, sans-serif',
          border: isLocked ? '2px solid red' : '2px solid green',
          borderRadius: '8px',
        }}
      />

      <div className="btn-group mt-3">
        <button
          type="button"
          className="btn btn-primary dropdown-toggle"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i className="bi bi-file-earmark-arrow-down me-2"></i>
          <span className="me-2">Descargar documento</span>
        </button>
        <ul className="dropdown-menu">
          <li>
            <button className="dropdown-item" onClick={handleDownloadTxt}>
              <i className="bi bi-filetype-txt me-2"></i>
              Descargar en .txt
            </button>
          </li>
          <li>
            <button className="dropdown-item" onClick={handleDownloadPdf}>
              <i className="bi bi-filetype-pdf me-2"></i>
              Descargar en .pdf
            </button>
          </li>
        </ul>
      </div>

    </div>
  );
};

export default Editor;
