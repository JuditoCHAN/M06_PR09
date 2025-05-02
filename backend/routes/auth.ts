import express from 'express';

const router = express.Router();

const usuarios = [
  { username: 'root', password: 'root' },
  { username: 'profe', password: '1234' },
];

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const usuario = usuarios.find(u => u.username === username && u.password === password);

  if (usuario) {
    res.json({ success: true, message: 'Login exitoso', username });
  } else {
    res.status(401).json({ success: false, message: 'Credenciales inválidas' });
  }
});

export default router;