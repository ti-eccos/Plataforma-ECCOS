import nodemailer from 'nodemailer';
import admin from 'firebase-admin';

// Configurar Firebase
const serviceAccount = require('../../.env.local'); // Caminho para suas credenciais do Firebase

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const transporter = nodemailer.createTransport({
  host: 'smtp.localweb.com.br',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: { rejectUnauthorized: false }
});

export const sendAdminNotification = async (subject: string, html: string) => {
  try {
    // Buscar admins no Firestore
    const snapshot = await admin.firestore()
      .collection('users')
      .where('isAdmin', '==', true)
      .get();

    const adminEmails = snapshot.docs.map(doc => doc.data().email);
    
    if (adminEmails.length === 0) return;

    await transporter.sendMail({
      from: '"Sistema de Reservas" <suporte@colegioeccos.com.br>',
      to: adminEmails.join(','),
      subject,
      html
    });
    
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw error;
  }
};