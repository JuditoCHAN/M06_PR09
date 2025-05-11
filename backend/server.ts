// server.ts
import express from 'express';
import http from 'http';
import cors from 'cors';
import authRoutes from './routes/auth';
import { initChatWebSocket } from './routes/chat';  
import { initEditorWebSocket } from './routes/editor'; 
import dashboard from './routes/dashboard';

const app = express();
const PORT = 5001;

// Crear el servidor HTTP
const server = http.createServer(app);

// Inicializar WebSocket para chat
initChatWebSocket(server, '/chat');

// Inicializar WebSocket para editor
initEditorWebSocket(server, '/editor');

// Middleware para habilitar CORS
app.use(cors());

// Middleware para procesar JSON
app.use(express.json());

// Rutas de autenticación
app.use('/api', authRoutes);
app.use('/dashboard', dashboard);

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
