import express from 'express';
import cors from 'cors';
import { sendAdminNotification } from './emailService';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/notify-admins', async (req, res) => {
  try {
    await sendAdminNotification(req.body.subject, req.body.content);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Falha no envio de notificação' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});