import nodemailer from "nodemailer";
import admin from "firebase-admin";
import path from "path";
import fs from "fs";

// Certificado Firebase Admin (ex: .env.local ou firebase-service-account.json)
const serviceAccountPath = path.resolve(process.cwd(), ".env.local");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const transporter = nodemailer.createTransport({
  host: "smtplw.com.br",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "cirandinha2008",
    pass: process.env.SMTP_PASS || "rjbynRqK8814",
  },
  tls: {
    ciphers: "SSLv3",
  },
});

// Interface para e-mails diretos
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

// Envia e-mail para destinatário único
export const sendEmail = async ({ to, subject, html }: EmailPayload): Promise<void> => {
  try {
    await transporter.sendMail({
      from: '"Sistema de Reservas" <cirandinha2008@smtplw.com.br>',
      to,
      subject,
      html,
    });
    console.log(`E-mail enviado para ${to}`);
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    throw error;
  }
};

// Notifica todos os admins (admin ou superadmin) com base no Firestore
export const notifyAdmins = async (subject: string, html: string): Promise<void> => {
  try {
    const snapshot = await admin.firestore()
      .collection("users")
      .where("role", "in", ["admin", "superadmin"])
      .get();

    const adminEmails = snapshot.docs
      .map(doc => doc.data().email)
      .filter((email): email is string => !!email);

    if (adminEmails.length === 0) return;

    await transporter.sendMail({
      from: '"Sistema de Reservas" <cirandinha2008@smtplw.com.br>',
      to: adminEmails.join(","),
      subject,
      html,
      headers: {
        "x-source": "api",
        "x-api-message-id": Date.now().toString(),
      },
    });

    console.log("Notificação enviada para admins.");
  } catch (error) {
    console.error("Erro ao notificar admins:", error);
    throw error;
  }
};
