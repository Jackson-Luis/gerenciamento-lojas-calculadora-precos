// server.js (ponto de entrada)
import dotenv from 'dotenv';
import express from 'express';
import { corsConfig } from './config/cors.js';
import { startCronJob } from './config/cron.js';

import authRoutes from './routes/authRoutes.js';
import funcionarioRoutes from './routes/funcionarioRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import lojaRoutes from './routes/lojaRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import iaRoutes from './routes/iaRoutes.js';
import amazonRoutes from './routes/amazonRoutes.js';
import stripeRoutes from "./routes/stripeRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(corsConfig);

// ⚠️ Webhook vem antes do express.json()
app.use("/stripe", stripeRoutes);

// depois sim o body parser normal
app.use(express.json());

// health & test endpoint
app.get("/test-db", (req, res) => {
  res.json({ message: "Servidor ativo", timestamp: new Date().toISOString() });
});

// suas rotas
app.use("/auth", authRoutes);
app.use("/funcionarios", funcionarioRoutes);
app.use("/clientes", clienteRoutes);
app.use("/lojas", lojaRoutes);
app.use("/emails", emailRoutes);
app.use("/ia", iaRoutes);
app.use("/amazon", amazonRoutes);

// jobs
startCronJob();

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
