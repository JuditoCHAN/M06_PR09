import express, { Request, Response } from 'express';
import http from 'http';
import WebSocket from 'ws';
import cors from 'cors';
import authRoutes from './routes/auth';
import { initChatWebSocket } from './routes/chat';
import dashboard from './routes/dashboard';

// import messageRoutes from './routes/messages';

const app = express();
const PORT = 5001;

// IMPORTANT!!!
// npx ts-node server.ts  --> para ejecutar el servidor
// npx ts-node-dev server.ts  --> para ejecutar y q se reinicie automáticamente el servidor al guardar cambios

// Rutas de mensajes e historial
// app.use('/api/messages', messageRoutes);

const server = http.createServer(app);


// Inicializar el chat
initChatWebSocket(server, '/chat');
// Middleware para habilitar CORS: permite que el servidor acepte solicitudes de diferentes orígenes (del otro puerto del frontend)
app.use(cors());

// Middleware para procesar JSON
app.use(express.json());

// Rutas de autenticación: todas las rutas de auth.ts estarán disponibles bajo el prefijo /api
app.use('/api', authRoutes);
app.use('/dashboard', dashboard);


// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});