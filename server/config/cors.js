// config/cors.js
import cors from 'cors';

export const corsConfig = cors({
  origin: [
    'https://jackson-luis.github.io',
    'https://gerenciamento-lojas-calculadora-precos.onrender.com',
    'http://localhost:8080',
    'https://seoptmizer.com.br',
  ],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
});
