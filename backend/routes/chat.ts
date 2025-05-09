// chat.ts
import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer} from 'http';
import fs from 'fs';
import path from 'path';

// Archivo para guardar los mensajes
const filePath = path.join(__dirname, '../../data/messages.json');


export function initChatWebSocket(server: HTTPServer,path: string = '/chat') {
  const wss = new WebSocketServer({ server, path }); 
  const clients: WebSocket[] = [];
  const messages: any[] = [];


  // Guardar mensajes en el JSON
  function saveMessagesToFile() {
    try {
      fs.writeFileSync(filePath, JSON.stringify(messages, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error al guardar los mensajes:', err);
    }
  }


  wss.on('connection', (ws: WebSocket) => {
    clients.push(ws);
    console.log('[Chat] Cliente conectado');

    // notificación a los demás clientes de que un nuevo usuario se ha unido
    const notification = { type: 'notification', text: 'Un nuevo usuario se ha unido al chat' };
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification));
      }
    });

    // enviar el historial de mensajes al nuevo cliente
    ws.send(JSON.stringify(messages));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        messages.push(msg);
        console.log('[Chat] Mensaje recibido:', msg);
        saveMessagesToFile();
        clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) { // enviar mensaje a los demás clientes
            client.send(JSON.stringify(msg));
          }
        });
      } catch (err) {
        console.error('Mensaje inválido:', err);
      }
    });

    ws.on('close', () => {
      // notificación a los demás clientes de que el usurio se ha desconectado
      const notification = { type: 'notification', text: 'Un usuario ha salido del chat' };
      clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(notification));
        }
      });

      const index = clients.indexOf(ws);
      if (index !== -1) {
        clients.splice(index, 1);
      }
      console.log('[Chat] Cliente desconectado');
    });
  });
}
