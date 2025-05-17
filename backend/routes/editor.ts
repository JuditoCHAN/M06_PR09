import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import * as fs from 'fs';
import * as path from 'path';

export function initEditorWebSocket(server: HTTPServer, wsPath: string = '/editor') {
  const wssEditor = new WebSocketServer({ server, path: wsPath });
  const clients: { ws: WebSocket; clientId: string }[] = [];
  let currentEditor: string | null = null; // El usuario que tiene el foco (bloqueando el archivo)

  wssEditor.on('connection', (ws: WebSocket) => {
    const clientId = Math.random().toString(36).substr(2, 9); // Identificador único para cada cliente
    clients.push({ ws, clientId });
    console.log('[Editor] Cliente conectado en /editor', clientId);

    // Enviar el estado inicial de bloqueo al nuevo cliente
    ws.send(JSON.stringify({ type: 'lock', locked: currentEditor !== null }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // Sincronización del contenido entre clientes
        if (msg.content) {
          const filePath = path.join(__dirname, '../uploads', msg.fileName);

          // Guardar el contenido en el archivo
          fs.writeFileSync(filePath, msg.content, 'utf8');
          console.log('[Editor] Archivo guardado:', filePath);

          // Enviar el contenido actualizado a todos los clientes, excepto al autor
          clients.forEach(({ ws: clientWs }) => {
            if (clientWs !== ws && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ content: msg.content, author: msg.author }));
            }
          });
        }

        // Control de bloqueo cuando alguien hace foco en el editor
        if (msg.editorFocus ) {
          if (currentEditor === null || currentEditor === msg.author) {
            currentEditor = msg.author; // Bloquear a todos los demás usuarios
            // Informar a todos los clientes que el editor está bloqueado
            clients.forEach(({ ws: clientWs }) => {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'lock', locked: clientWs !== ws }));
              }
            });
          }
        } else if (!msg.editorFocus && currentEditor === msg.author && !msg.content) {
          currentEditor = null; // Desbloquear a todos los usuarios
          clients.forEach(({ ws: clientWs }) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'lock', locked: false }));
            }
          });
        }
      } catch (err) {
        console.error('[Editor] Error al procesar mensaje:', err);
      }
    });

    ws.on('close', () => {
      const index = clients.findIndex(client => client.ws === ws);
      if (index !== -1) {
        const { clientId } = clients[index];
        if (currentEditor === clientId) {
          currentEditor = null;
          clients.forEach(({ ws: clientWs }) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'lock', locked: false }));
            }
          });
        }
        clients.splice(index, 1);
        console.log('[Editor] Cliente desconectado', clientId);
      }
    });
  });

  console.log('Servidor WebSocket del editor inicializado en /editor');
}
