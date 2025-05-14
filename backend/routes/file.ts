import express from 'express';

const router = express.Router();
import path from 'path';
import fs from 'fs';


router.get('', (req, res) => {
    console.log("[file] Solicitud a /file");


    console.log(req.query);
    const filePath = path.join(__dirname+"/../uploads/"+req.query.id+".txt");

    console.log(filePath);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(500, {'Content-Type': 'text/plain'});
          res.end('No existe el archivo');
        } else {
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.end(data);
        }
      });
    
    
});

export default router;