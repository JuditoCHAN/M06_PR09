import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import * as fs from 'fs';
import * as path from 'path';

interface Client {
  ws: WebSocket;
  clientId: string;
  fileName: string; // Archivo que está editando el cliente
}

interface FileRoom {
  fileName: string;
  clients: Client[];
  currentEditor: string | null; // ID del cliente que tiene el foco actualmente
}

export function initEditorWebSocket(server: HTTPServer, wsPath: string = '/editor') {
  const wssEditor = new WebSocketServer({ server, path: wsPath });
  const clients: Client[] = [];
  const fileRooms: Map<string, FileRoom> = new Map(); // Salas basadas en nombres de archivo

  wssEditor.on('connection', (ws: WebSocket) => {
    const clientId = Math.random().toString(36).substr(2, 9); // Identificador único para cada cliente
    let currentClient: Client = { ws, clientId, fileName: '' };
    clients.push(currentClient);
    console.log('[Editor] Cliente conectado en /editor', clientId);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        const fileName = msg.fileName;

        // Actualizar el archivo asociado al cliente si ha cambiado
        if (fileName && currentClient.fileName !== fileName) {
          // Eliminar cliente de la sala anterior si existe
          if (currentClient.fileName) {
            removeClientFromRoom(currentClient);
          }
          
          // Actualizar el nombre de archivo del cliente
          currentClient.fileName = fileName;
          
          // Añadir cliente a la nueva sala
          addClientToRoom(currentClient, fileName);
          
          // Enviar estado inicial de bloqueo al cliente
          const room = fileRooms.get(fileName);
          if (room) {
            ws.send(JSON.stringify({ 
              type: 'lock', 
              locked: room.currentEditor !== null && room.currentEditor !== clientId,
              author: room.currentEditor
            }));
          }
        }

        // Si no hay sala para este archivo, ignorar el mensaje
        if (!fileName || !fileRooms.has(fileName)) {
          return;
        }

        const room = fileRooms.get(fileName)!;

        // Sincronización del contenido entre clientes de la misma sala
        if (msg.content) {
          const filePath = path.join(__dirname, '../uploads', fileName);

          // Guardar el contenido en el archivo
          fs.writeFileSync(filePath, msg.content, 'utf8');
          console.log('[Editor] Archivo guardado:', filePath);

          // Enviar el contenido actualizado a todos los clientes de la misma sala, excepto al autor
          room.clients.forEach((client) => {
            if (client.ws !== ws && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({ content: msg.content, author: msg.author }));
            }
          });
        }

        // Control de bloqueo cuando alguien hace foco en el editor
        if (msg.editorFocus !== undefined) {
          if (msg.editorFocus) {
            // Cliente quiere tomar el foco
            if (room.currentEditor === null || room.currentEditor === msg.author) {
              room.currentEditor = msg.author; // Bloquear a todos los demás usuarios
              // Informar a todos los clientes de la sala que el editor está bloqueado
              room.clients.forEach((client) => {
                if (client.ws.readyState === WebSocket.OPEN) {
                  client.ws.send(JSON.stringify({ 
                    type: 'lock', 
                    locked: client.clientId !== msg.author,
                    author: msg.author
                  }));
                }
              });
            }
          } else if (!msg.editorFocus && room.currentEditor === msg.author && !msg.content) {
            // Cliente libera el foco
            room.currentEditor = null; // Desbloquear a todos los usuarios
            room.clients.forEach((client) => {
              if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({ type: 'lock', locked: false }));
              }
            });
          }
        }
      } catch (err) {
        console.error('[Editor] Error al procesar mensaje:', err);
      }
    });

    ws.on('close', () => {
      // Eliminar cliente de su sala y de la lista global
      removeClientFromRoom(currentClient);
      const index = clients.findIndex(client => client.ws === ws);
      if (index !== -1) {
        clients.splice(index, 1);
        console.log('[Editor] Cliente desconectado', currentClient.clientId);
      }
    });
  });

  // Función para añadir un cliente a una sala
  function addClientToRoom(client: Client, fileName: string) {
    if (!fileRooms.has(fileName)) {
      fileRooms.set(fileName, {
        fileName,
        clients: [],
        currentEditor: null
      });
    }
    
    const room = fileRooms.get(fileName)!;
    room.clients.push(client);
    console.log(`[Editor] Cliente ${client.clientId} añadido a la sala ${fileName}`);
  }

  // Función para eliminar un cliente de su sala
  function removeClientFromRoom(client: Client) {
    if (!client.fileName || !fileRooms.has(client.fileName)) {
      return;
    }

    const room = fileRooms.get(client.fileName)!;
    const index = room.clients.findIndex(c => c.clientId === client.clientId);
    
    if (index !== -1) {
      room.clients.splice(index, 1);
      console.log(`[Editor] Cliente ${client.clientId} eliminado de la sala ${client.fileName}`);
      
      // Si este cliente era el editor actual, liberar el bloqueo
      if (room.currentEditor === client.clientId) {
        room.currentEditor = null;
        room.clients.forEach((c) => {
          if (c.ws.readyState === WebSocket.OPEN) {
            c.ws.send(JSON.stringify({ type: 'lock', locked: false }));
          }
        });
      }
      
      // Si la sala queda vacía, eliminarla
      if (room.clients.length === 0) {
        fileRooms.delete(client.fileName);
        console.log(`[Editor] Sala ${client.fileName} eliminada`);
      }
    }
  }

  console.log('Servidor WebSocket del editor inicializado en /editor');
}
