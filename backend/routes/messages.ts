// import express from 'express';
// import fs from 'fs';
// import path from 'path';

// const router = express.Router();

// const historyFilePath = path.join(__dirname, '../data/messageHistory.json');

// // Endpoint para enviar mensajes (SEND_MESSAGE)
// router.post('/send', (req, res) => {
//   const { message } = req.body;
//   if (!message) return res.status(400).json({ error: 'Mensaje vacío' });

//   // Guardar mensaje en el historial
//   const timestamp = new Date().toISOString();
//   const newMessage = { message, timestamp };

//   let history = [];
//   if (fs.existsSync(historyFilePath)) {
//     history = JSON.parse(fs.readFileSync(historyFilePath, 'utf-8'));
//   }
//   history.push(newMessage);
//   fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));

//   res.json({ status: 'Mensaje enviado', message: newMessage });
// });

// // Endpoint para guardar el historial en un archivo JSON (SAVE_HIST)
// router.post('/save', (req, res) => {
//   const { messages } = req.body;
//   if (!Array.isArray(messages)) {
//     return res.status(400).json({ error: 'Formato de mensajes inválido' });
//   }

//   fs.writeFileSync(historyFilePath, JSON.stringify(messages, null, 2));
//   res.json({ status: 'Historial guardado' });
// });

// // Endpoint para visualizar, recuperar y exportar el historial (VIEW_HIST)
// router.get('/history', (req, res) => {
//   if (!fs.existsSync(historyFilePath)) {
//     return res.status(404).json({ error: 'No hay historial disponible' });
//   }

//   const history = JSON.parse(fs.readFileSync(historyFilePath, 'utf-8'));
//   res.json({ history });
// });

// router.get('/export', (req, res) => {
//   if (!fs.existsSync(historyFilePath)) {
//     return res.status(404).json({ error: 'No hay historial disponible' });
//   }

//   const history = JSON.parse(fs.readFileSync(historyFilePath, 'utf-8'));
//   const exportPath = path.join(__dirname, '../data/messageHistory.txt');
//   const exportContent = history.map((msg: any) => `${msg.timestamp}: ${msg.message}`).join('\n');

//   fs.writeFileSync(exportPath, exportContent);
//   res.download(exportPath, 'messageHistory.txt');
// });

// export default router;