import express from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

router.get('', (req, res) => {
  console.log('[file] Solicitud a /file');

  const fileId = req.query.id as string;

  if (!fileId) {
    return res.status(400).send('Parámetro "id" requerido');
  }

  // Sanear el nombre del archivo para evitar ataques de path traversal
  const safeFileName = path.basename(fileId) + '.txt';
  const filePath = path.join(__dirname, '../uploads', safeFileName);

  console.log('[file] Ruta del archivo:', filePath);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('[file] Error al leer el archivo:', err.message);
      return res.status(404).send('El archivo no existe');
    }

    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(data);
  });
});

// Endpoint para descargar el archivo como .txt por id
router.get('/download', (req, res) => {
  const fileId = req.query.id as string;
  if (!fileId) {
    return res.status(400).send('Parámetro "id" requerido');
  }
  // Sanear el nombre del archivo para evitar ataques de path traversal
  const safeFileName = path.basename(fileId) + '.txt';
  const filePath = path.join(__dirname, '../uploads', safeFileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('El archivo no existe');
  }

  res.download(filePath, safeFileName, (err) => {
    if (err) {
      console.error('[file] Error al descargar el archivo:', err.message);
      res.status(500).send('Error al descargar el archivo');
    }
  });
});

export default router;
