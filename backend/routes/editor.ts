// editor.ts
import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import fs from 'fs';
import path from 'path';

export function initEditorWebSocket(server: HTTPServer, wsPath: string = '/editor') {
  const wssEditor = new WebSocketServer({ server, path: wsPath });
  const clients: WebSocket[] = [];
  const messages: { fileName: string; content: string; author: string }[] = [];

  wssEditor.on('connection', (ws: WebSocket) => {
    clients.push(ws);
    console.log('[Editor] Cliente conectado en /editor');

    ws.send(JSON.stringify(messages));

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
        }

        // Enviar el mensaje a los demás clientes
        clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
          }
        });
      } catch (err) {
        console.error('[Editor] Error al procesar mensaje:', err);
      }
    });

    ws.on('close', () => {
      const index = clients.indexOf(ws);
      if (index !== -1) clients.splice(index, 1);
      console.log('[Editor] Cliente desconectado de /editor');
    });
  });

  console.log('WebSocket del editor inicializado en /editor');
}
