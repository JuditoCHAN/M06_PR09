import express, { Request, Response } from 'express';
import http from 'http';
import WebSocket from 'ws';
import cors from 'cors';
import authRoutes from './routes/auth';
// import messageRoutes from './routes/messages';

const app = express();
const PORT = 5001;

// IMPORTANT!!!
// npx ts-node server.ts  --> para ejecutar el servidor
// npx ts-node-dev server.ts  --> para ejecutar y q se reinicie automáticamente el servidor al guardar cambios

// Middleware para habilitar CORS: permite que el servidor acepte solicitudes de diferentes orígenes (del otro puerto del frontend)
app.use(cors());

// Middleware para procesar JSON
app.use(express.json());

// Rutas de autenticación: todas las rutas de auth.ts estarán disponibles bajo el prefijo /api
app.use('/api', authRoutes);

// Rutas de mensajes e historial
// app.use('/api/messages', messageRoutes);


const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Cliente conectado');

  // Manejar mensajes recibidos desde el cliente
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.tipo === 'mensaje') {
        console.log(`Mensaje recibido: ${data.contenido}`);

        // Reenviar el mensaje a todos los clientes conectados
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } else if (data.tipo === 'expulsion') {
        console.log('Solicitud de expulsión recibida');
        ws.close();
      }
    } catch (error) {
      console.error('Error al procesar el mensaje:', error);
    }
  });

  ws.on('close', () => {
    console.log('Cliente desconectado');
  });
});

// Endpoint para enviar mensajes a través de WebSocket
// app.post('/api/message', (req: Request, res: Response) => {
//   const { message } = req.body;
//   if (!message) return res.status(400).json({ error: 'Mensaje vacío' });

//   wss.clients.forEach((client) => {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(message);
//     }
//   });
//   res.json({ status: 'Mensaje enviado' });
// });

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});