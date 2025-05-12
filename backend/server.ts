import express from 'express';
import http from 'http';
import cors from 'cors';
import authRoutes from './routes/auth';
import { initChatWebSocket } from './routes/chat';  
import { initEditorWebSocket } from './routes/editor'; 
import dashboard from './routes/dashboard';
import messageRoutes from './routes/messages';

const app = express();
const PORT = 5001;

// Crear el servidor HTTP
const server = http.createServer(app);

// Inicializar WebSocket para chat
initChatWebSocket(server, '/chat');

// Inicializar WebSocket para editor
initEditorWebSocket(server, '/editor');

// Middleware para habilitar CORS
// IMPORTANT!!!
// npx ts-node server.ts  --> para ejecutar el servidor
// npx ts-node-dev server.ts  --> para ejecutar y q se reinicie automáticamente el servidor al guardar cambios


// Inicializar el chat
initChatWebSocket(server, '/chat');

// Middleware para habilitar CORS: permite que el servidor acepte solicitudes de diferentes orígenes (del otro puerto del frontend)
app.use(cors());

// Middleware para procesar JSON
app.use(express.json());

// Rutas de autenticación
app.use('/api', authRoutes);
app.use('/dashboard', dashboard);
app.use('/api/messages', messageRoutes);

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
