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
