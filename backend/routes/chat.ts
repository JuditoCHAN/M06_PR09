// chat.ts
import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer} from 'http';

export function initChatWebSocket(server: HTTPServer,path: string = '/chat') {
  const wss = new WebSocketServer({ server, path }); 
  const clients: WebSocket[] = [];

  wss.on('connection', (ws: WebSocket) => {
    clients.push(ws);
    console.log('[Chat] Cliente conectado');

    ws.send('Bienvenido al chat');

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
          }
        });
      } catch (err) {
        console.error('Mensaje inválido:', err);
      }
    });

    ws.on('close', () => {
      const index = clients.indexOf(ws);
      if (index !== -1) clients.splice(index, 1);
      console.log('[Chat] Cliente desconectado');
    });
  });
}
