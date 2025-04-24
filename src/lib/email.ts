// src/lib/email.ts
import emailjs from '@emailjs/browser';
import { getAdminEmails } from '@/services/userService';

emailjs.init('ooADCrOkTxcKdeikN');

export const sendAdminNotification = async (
  requestType: string,
  userName: string
) => {
  try {
    console.log('[Email] Iniciando processo de notificação');
    console.log('[Email] Buscando emails de admin...');
    
    const adminEmails = await getAdminEmails();
    console.log('[Email] Admins encontrados:', adminEmails);

    if (adminEmails.length === 0) {
      console.warn('[Email] Nenhum admin encontrado para notificar');
      return;
    }

    console.log('[Email] Iniciando envio para:', adminEmails);
    
    await Promise.all(adminEmails.map(async (email) => {
      try {
        console.log(`[Email] Enviando para: ${email}`);
        const response = await emailjs.send(
          'service_iwabe3j',
          'template_qslkooq',
          {
            tipo_solicitacao: requestType,
            nome_usuario: userName,
            to_email: email
          }
        );
        console.log(`[Email] Sucesso para ${email}:`, response.status);
      } catch (error) {
        console.error(`[Email] Erro para ${email}:`, error);
      }
    }));
    
    console.log('[Email] Processo de notificação concluído');
  } catch (error) {
    console.error('[Email] Erro geral:', error);
  }
};
// src/lib/email.ts
export const sendUserNotification = async (
  userEmail: string,
  requestType: string,
  status: string
) => {
  try {
    await emailjs.send(
      'service_iwabe3j', // ID do serviço
      'template_status_usuario', // Novo ID do template
      {
        tipo_solicitacao: requestType,
        status_solicitacao: status,
        to_email: userEmail
      }
    );
    console.log('[Email] Notificação de status enviada para o usuário');
  } catch (error) {
    console.error('[Email] Erro ao enviar para usuário:', error);
  }
};