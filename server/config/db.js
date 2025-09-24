// config/db.js
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
