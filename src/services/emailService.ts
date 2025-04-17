// emailService.ts
import nodemailer from "nodemailer";
import admin from "firebase-admin";
import path from "path";
import fs from "fs";
// Corrigir importação da função getAllUsers
import { getAllUsers } from "./userService"; // Adicione esta linha

const serviceAccountPath = path.resolve(process.cwd(), "firebase-service-account.json");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Declarar o transporter antes de usar
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

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

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

export const notifyAdmins = async (subject: string, html: string): Promise<void> => {
  try {
    // Usar a função importada corretamente
    const allUsers = await getAllUsers();
    
    const adminEmails = allUsers
      .filter(user => 
        (user.role === "admin" || user.role === "superadmin") && 
        !user.blocked &&
        user.email
      )
      .map(user => user.email) as string[];

    if (adminEmails.length === 0) return;

    // Usar o transporter declarado
    await transporter.sendMail({
      from: '"Sistema de Reservas" <cirandinha2008@smtplw.com.br>',
      bcc: adminEmails.join(","),
      subject: `[Notificação] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #1a365d;">Nova solicitação registrada</h2>
          ${html}
          <p style="margin-top: 20px; color: #666;">
            Acesse o sistema para ver detalhes: ${process.env.NEXT_PUBLIC_APP_URL}
          </p>
        </div>
      `,
      headers: {
        "x-source": "api",
        "x-api-message-id": Date.now().toString(),
      },
    });

    console.log("Notificação enviada para", adminEmails.length, "administradores.");
  } catch (error) {
    console.error("Erro ao notificar admins:", error);
    throw error;
  }
};