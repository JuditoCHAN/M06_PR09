import { Usuario } from './../../src/types/Usuario';
import express from 'express';
import fs from 'fs';

const router = express.Router();
const data = JSON.parse(fs.readFileSync('../data/data.json', 'utf8'));
const usuarios: Usuario[] = data.usuarios || [];

router.post('/login', (req, res) => {
  const { name, email } = req.body;
  const usuario = usuarios.find((u: Usuario) => u.nombre === name && u.email === email);

  if (usuario) {
    res.json({ success: true, message: 'Login exitoso', usuario });
    console.log('Usuario encontrado:', usuario);
  } else {
    res.status(401).json({ success: false, message: 'Credenciales inválidas' });
  }
});

export default router;