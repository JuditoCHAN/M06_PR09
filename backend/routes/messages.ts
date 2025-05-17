import express from 'express';
import fs from 'fs';
import path from 'path';
import { MensajeChat } from '../../src/types/MensajeChat';

const router = express.Router();
const historyFilePath = path.join(__dirname, '../historial/chats/messages.json');

// Endpoint para visualizar el historial de mensajes 
router.get('/view_hist', (req, res) => {
    try {
        const history: MensajeChat[] = JSON.parse(fs.readFileSync(historyFilePath, 'utf-8'));
        res.json(history);
    } catch (error) {
        console.log('Error al leer el historial:', error);
        res.status(500).json({ error: 'No se ha podido leer el historial' });
    }
});

// Endpoint para descargar el historial de mensajes
router.get('/export_hist', (req, res) => {
  if (!fs.existsSync(historyFilePath)) {
    return res.status(404).json({ error: 'No hay historial disponible' });
  }
  try {
    const history: MensajeChat[] = JSON.parse(fs.readFileSync(historyFilePath, 'utf-8'));
    const exportPath = path.join(__dirname, '../historial/chats/messages_download.text');

    fs.writeFileSync(exportPath, JSON.stringify(history, null, 2), 'utf-8');
    res.download(exportPath, 'messagesHistory.txt');
  } catch (error) {
    console.log('Error al exportar el historial:', error);
    res.status(500).json({ error: 'No se ha podido exportar el historial' });
  }
});

export default router;