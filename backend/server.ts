import express from 'express';
import http from 'http';
import cors from 'cors';
import authRoutes from './routes/auth';
import { initChatWebSocket } from './routes/chat';  
import { initEditorWebSocket } from './routes/editor'; 
import dashboard from './routes/dashboard';
import messageRoutes from './routes/messages';

const app = express();
const PORT_CHAT = 5001;
const PORT_EDITOR = 5002;

// Crear el servidor HTTP para el chat
const serverChat = http.createServer(app);

// Crear el servidor HTTP para el editor
const serverEditor = http.createServer(app);

// Inicializar WebSocket para chat en el servidorChat
initChatWebSocket(serverChat, '/chat');

// Inicializar WebSocket para editor en el servidorEditor
initEditorWebSocket(serverEditor, '/editor');

// Middleware para habilitar CORS
app.use(cors());

// Middleware para procesar JSON
app.use(express.json());

// Rutas de autenticación
app.use('/api', authRoutes);
app.use('/dashboard', dashboard);
app.use('/api/messages', messageRoutes);

// Iniciar el servidor para el chat
serverChat.listen(PORT_CHAT, () => {
  console.log(`Servidor Chat escuchando en http://localhost:${PORT_CHAT}`);
});

// Iniciar el servidor para el editor
serverEditor.listen(PORT_EDITOR, () => {
  console.log(`Servidor Editor escuchando en http://localhost:${PORT_EDITOR}`);
});
