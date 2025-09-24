// middlewares/auth.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const SECRET = process.env.JWT_SECRET || 'chave_muito_secreta';

export function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}
