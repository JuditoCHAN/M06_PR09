// chat.ts
import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer} from 'http';
import fs from 'fs';
import path from 'path';
import { MensajeChat } from '../../src/types/MensajeChat';

// Archivo para guardar los mensajes
const filePath = path.join(__dirname, '../historial/chats/messages.json');

export function initChatWebSocket(server: HTTPServer, path: string = '/chat') {
  const wss = new WebSocketServer({ server, path });
  const clients: WebSocket[] = [];
  const messages: MensajeChat[] = [];

  // Cargar mensajes desde el JSON al iniciar el servidor
  function loadMessagesFromFile() {
    try {
      if(fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        const loadedMessages = JSON.parse(data);
        if (Array.isArray(loadedMessages)) {
          loadedMessages.forEach((msg: MensajeChat) => {
            messages.push(msg);
          });
        } else {
          console.error('El formato del archivo de mensajes no es válido');
        }
      }
    } catch (err) {
      console.error('Erro al cargar los mensajes:', err);
    }
  }


  // Guardar mensajes en el JSON (cada vez que se recibe un mensaje)
  function saveMessagesToFile() {
    try {
      fs.writeFileSync(filePath, JSON.stringify(messages, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error al guardar los mensajes:', err);
    }
  }

  loadMessagesFromFile(); // cargamos mensajes al iniciar el servidor

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
    ws.send(JSON.stringify({ type: 'notification', text: 'Te has unido al chat' }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        console.log('[Chat] Mensaje recibido:', msg);
        messages.push(msg);
        saveMessagesToFile();
        clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) { // enviar mensaje a los demás clientes
            client.send(JSON.stringify(msg));
          }
        });
      } catch (err) {
        console.error('[Chat] Error al procesar mensaje:', err);
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

  console.log('WebSocket del chat inicializado en /chat');
}
