// file.ts
// Rutas para la gestión y descarga de archivos individuales
//
// Endpoints principales:
//   - GET /file?id=...: Devuelve el contenido de un archivo .txt por id
//   - GET /file/download?id=...&format=...: Descarga el archivo .txt o .pdf
//
// Funcionalidad principal:
//   - Lee archivos de la carpeta /uploads
//   - Permite descargar archivos de forma segura evitando path traversal

import express from 'express';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';

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

// Endpoint para descargar el archivo como .txt o .pdf por id y formato
router.get('/download', async (req, res) => {
  const fileId = req.query.id as string;
  const format = (req.query.format as string)?.toLowerCase() || 'txt';
  console.log('format: ', format);
  if (!fileId) {
    return res.status(400).send('Parámetro "id" requerido');
  }
  // Sanear el nombre del archivo para evitar ataques de path traversal
  const safeFileName = path.basename(fileId) + '.txt';
  const filePath = path.join(__dirname, '../uploads', safeFileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('El archivo no existe');
  }

  if (format === 'pdf') {
    // Generar PDF usando pdfkit
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(fileId)}.pdf"`);
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    doc.pipe(res);
    let fileContent = '';
    stream.on('data', chunk => { fileContent += chunk; });
    stream.on('end', () => {
      doc.font('Times-Roman').fontSize(12).text(fileContent, { align: 'left' });
      doc.end();
    });
    stream.on('error', err => {
      console.error('[file] Error al leer el archivo para PDF:', err.message);
      res.status(500).send('Error al generar el PDF');
    });
    return;
  }

  // Por defecto, descarga como .txt
  res.download(filePath, safeFileName, (err) => {
    if (err) {
      console.error('[file] Error al descargar el archivo:', err.message);
      res.status(500).send('Error al descargar el archivo');
    }
  });
});

export default router;
