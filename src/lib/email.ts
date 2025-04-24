import emailjs from '@emailjs/browser';
import { getAdminEmails } from '@/services/userService';

emailjs.init('ooADCrOkTxcKdeikN');

export const sendAdminNotification = async (
  requestType: string,
  userName: string
) => {
  try {
    const adminEmails = await getAdminEmails();

    if (adminEmails.length === 0) {
      console.warn('[Email] Nenhum admin encontrado para notificar');
      return;
    }
    
    await Promise.all(adminEmails.map(async (email) => {
      try {
        const response = await emailjs.send(
          'service_iwabe3j',
          'template_qslkooq',
          {
            tipo_solicitacao: requestType,
            nome_usuario: userName,
            to_email: email
          }
        );
      } catch (error) {
        console.error(`[Email] Erro para ${email}:`, error);
      }
    }));
    
  } catch (error) {
    console.error('[Email] Erro geral:', error);
  }
};
export const sendUserNotification = async (
  userEmail: string,
  requestType: string,
  status: string
) => {
  try {
    await emailjs.send(
      'service_iwabe3j',
      'template_k0ngicy',
      {
        tipo_solicitacao: requestType,
        status_solicitacao: status,
        to_email: userEmail
      }
    );
  } catch (error) {
    console.error('[Email] Erro ao enviar para usuário:', error);
  }
};