// jobs/keepAliveJob.js
import cron from 'node-cron';
import fetch from 'node-fetch';

export default function keepAliveJob() {
  const url = process.env.API_URL || 'http://localhost:3001/test-db';
  cron.schedule('*/4 * * * *', async () => {
    try {
      await fetch(url);
      console.log('🔄 KeepAlive job executado');
    } catch (err) {
      console.error('Erro KeepAlive:', err.message);
    }
  });
}
