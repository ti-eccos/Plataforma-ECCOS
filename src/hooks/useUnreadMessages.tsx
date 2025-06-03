import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RequestData } from '@/services/reservationService';

interface UseUnreadMessagesProps {
  userId?: string;
  userEmail?: string;
  isAdmin?: boolean;
}

interface UnreadMessagesState {
  unreadCounts: { [requestId: string]: number };
  totalUnread: number;
  requests: RequestData[];
  loading: boolean;
}

export const useUnreadMessages = ({ 
  userId, 
  userEmail, 
  isAdmin = false 
}: UseUnreadMessagesProps): UnreadMessagesState => {
  const [state, setState] = useState<UnreadMessagesState>({
    unreadCounts: {},
    totalUnread: 0,
    requests: [],
    loading: true
  });

  useEffect(() => {
    if (!userId && !userEmail) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    const collections = ['reservations', 'purchases', 'supports'];
    const unsubscribes: (() => void)[] = [];

    const setupListeners = async () => {
      const allRequests: RequestData[] = [];
      const unreadCounts: { [requestId: string]: number } = {};

      for (const collectionName of collections) {
        let q;
        
        if (isAdmin) {
          // Admin vê todas as solicitações
          q = query(
            collection(db, collectionName),
            where('hidden', '==', false)
          );
        } else {
          // Usuário vê apenas suas solicitações
          q = userEmail 
            ? query(
                collection(db, collectionName),
                where('userEmail', '==', userEmail),
                where('status', '!=', 'canceled')
              )
            : query(
                collection(db, collectionName),
                where('userId', '==', userId),
                where('status', '!=', 'canceled')
              );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const requestData: RequestData = {
              id: change.doc.id,
              collectionName,
              type: data.type,
              status: data.status,
              userName: data.userName,
              userEmail: data.userEmail,
              userId: data.userId,
              createdAt: data.createdAt,
              equipmentNames: data.equipmentNames || [],
              equipmentIds: data.equipmentIds || [],
              equipmentQuantities: data.equipmentQuantities || {},
              hasUnreadMessages: data.hasUnreadMessages || false,
              unreadMessages: data.unreadMessages || [],
              ...data
            };

            if (change.type === 'added' || change.type === 'modified') {
              // Contar mensagens não lidas
              const messages = data.messages || [];
              let unreadCount = 0;
              
              messages.forEach((msg: any) => {
                // Se for admin, contar mensagens não lidas do usuário
                // Se for usuário, contar mensagens não lidas do admin
                const shouldCount = isAdmin 
                  ? !msg.isAdmin && (!msg.readBy || !msg.readBy.includes(userId || ''))
                  : msg.isAdmin && (!msg.readBy || !msg.readBy.includes(userId || ''));
                
                if (shouldCount) {
                  unreadCount++;
                }
              });

              unreadCounts[change.doc.id] = unreadCount;
              
              // Atualizar array de requests
              const existingIndex = allRequests.findIndex(r => r.id === change.doc.id);
              if (existingIndex >= 0) {
                allRequests[existingIndex] = { ...requestData, unreadMessages: unreadCount };
              } else {
                allRequests.push({ ...requestData, unreadMessages: unreadCount });
              }
            } else if (change.type === 'removed') {
              delete unreadCounts[change.doc.id];
              const index = allRequests.findIndex(r => r.id === change.doc.id);
              if (index >= 0) {
                allRequests.splice(index, 1);
              }
            }
          });

          // Calcular total de mensagens não lidas
          const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

          setState({
            unreadCounts,
            totalUnread,
            requests: allRequests.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()),
            loading: false
          });
        });

        unsubscribes.push(unsubscribe);
      }
    };

    setupListeners();

    // Cleanup
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [userId, userEmail, isAdmin]);

  return state;
};

export default useUnreadMessages;