// editor.ts
import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import * as fs from 'fs';
import * as path from 'path';

export function initEditorWebSocket(server: HTTPServer, wsPath: string = '/editor') {
  const wssEditor = new WebSocketServer({ server, path: wsPath });
  const clients: { ws: WebSocket; clientId: string }[] = [];
  const messages: { fileName: string; content: string; author: string }[] = [];
  let currentEditor: string | null = null;

  wssEditor.on('connection', (ws: WebSocket) => {
    const clientId = Math.random().toString(36).substr(2, 9); // Generar un clientId único
    clients.push({ ws, clientId });
    console.log('[Editor] Cliente conectado en /editor');

    // Enviar el estado de bloqueo inicial al cliente
    ws.send(JSON.stringify({ type: 'lock', locked: currentEditor !== null }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        messages.push(msg);
        console.log('[Editor] Mensaje recibido:', msg);

        // Guardar el contenido en un archivo .txt
        if (msg.fileName && msg.content) {
          const filePath = path.join(__dirname, '../uploads', msg.fileName);
          fs.writeFileSync(filePath, msg.content, 'utf8');
          console.log(`[Editor] Archivo guardado en: ${filePath}`);

          // Guardar datos del mensaje (autor, contenido añadido, hora) en un JSON en la carpeta historial
          const historialPath = path.join(__dirname, '../historial', msg.fileName.replace('.txt', '.json'));
          let historialData = [];

          // Leer el archivo existente si ya existe
          if (fs.existsSync(historialPath)) {
            try {
              const existingData = fs.readFileSync(historialPath, 'utf8');
              historialData = JSON.parse(existingData);
            } catch (err) {
              console.error(`[Editor] Error al leer el historial existente: ${err}`);
            }
          }

          // Asegurarse de que historialData sea un array
          if (!Array.isArray(historialData)) {
            console.warn(`[Editor] El historial existente no es un array. Se inicializará como un array vacío.`);
            historialData = [];
          }

          // Agregar el nuevo cambio al historial
          historialData.push({
            fileName: msg.fileName,
            content: msg.content,
            author: msg.author,
            date: msg.date,
          });

          // Guardar el historial actualizado
          try {
            fs.writeFileSync(historialPath, JSON.stringify(historialData, null, 2), 'utf8');
            console.log(`[Editor] Historial actualizado en: ${historialPath}`);
          } catch (err) {
            console.error(`[Editor] Error al guardar el historial: ${err}`);
          }

          clients.forEach(({ ws: clientWs }) => {
            if (clientWs !== ws && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify(msg));
            }
          });
        } else if (msg.fileName && msg.editorFocus !== undefined) {
          console.log('[Editor] Estan editando el archivo', msg);

          if (msg.editorFocus && currentEditor === null) {
            currentEditor = msg.author;
            clients.forEach(({ ws: clientWs }) => {
              if (clientWs !== ws && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'lock', locked: true, author: msg.author }));
              }
            });
          } else if (!msg.editorFocus && currentEditor === msg.author) {
            currentEditor = null;
            clients.forEach(({ ws: clientWs }) => {
              if (clientWs !== ws && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'lock', locked: false }));
              }
            });
          }
        }
      } catch (err) {
        console.error('[Editor] Error al procesar mensaje:', err);
      }
    });

    ws.on('close', () => {
      const clientIndex = clients.findIndex(client => client.ws === ws);
      if (clientIndex !== -1) {
        const { clientId } = clients[clientIndex];
        if (currentEditor === clientId) {
          currentEditor = null;
          clients.forEach(({ ws: clientWs }) => {
            if (clientWs !== ws && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'lock', locked: false }));
            }
          });
        }
        clients.splice(clientIndex, 1);
        console.log('[Editor] Cliente desconectado de /editor');
      }
    });
  });

  console.log('WebSocket del editor inicializado en /editor');
}
