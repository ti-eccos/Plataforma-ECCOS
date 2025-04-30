import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  where,
  or,
  onSnapshot,
  arrayUnion,
  Timestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  readBy: string[];
  link?: string | null;
  userEmail: string;
}

export const createNotification = async (data: Omit<Notification, "id">) => {
  try {
    const docRef = await addDoc(collection(db, "notifications"), {
      ...data,
      createdAt: new Date(),
      link: data.link || null,
      readBy: data.readBy || [],
    });
    console.log("Notificação criada com ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    throw error;
  }
};

export const getNotifications = async (
  userEmail: string
): Promise<Notification[]> => {
  try {
    let q;

    if (userEmail === "") {
      q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    } else {
      q = query(
        collection(db, "notifications"),
        or(
          where("userEmail", "==", userEmail),
          where("userEmail", "==", "")
        ),
        orderBy("createdAt", "desc")
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as {
        title: string;
        message: string;
        createdAt: Timestamp;
        readBy?: string[];
        link?: string | null;
        userEmail: string;
      };
      return {
        id: doc.id,
        title: data.title,
        message: data.message,
        createdAt: data.createdAt.toDate(),
        readBy: data.readBy || [],
        link: data.link ?? null,
        userEmail: data.userEmail,
      } as Notification;
    });
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return [];
  }
};

export const setupNotificationsListener = (
  userEmail: string,
  onUpdate: (notifications: Notification[]) => void
) => {
  if (!userEmail) return () => {};

  const q = query(
    collection(db, "notifications"),
    or(
      where("userEmail", "==", userEmail),
      where("userEmail", "==", "")
    ),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((doc) => {
        const data = doc.data() as {
          title: string;
          message: string;
          createdAt: Timestamp;
          readBy?: string[];
          link?: string | null;
          userEmail: string;
        };
        return {
          id: doc.id,
          title: data.title,
          message: data.message,
          createdAt: data.createdAt.toDate(),
          readBy: data.readBy || [],
          link: data.link ?? null,
          userEmail: data.userEmail,
        } as Notification;
      });
      onUpdate(notifications);
    },
    (error) => {
      console.error("Erro ao ouvir notificações:", error);
    }
  );
};

export const markAsRead = async (
  notificationId: string,
  userEmail: string
) => {
  if (!userEmail) return;

  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      readBy: arrayUnion(userEmail),
    });
    console.log(
      `Notificação ${notificationId} marcada como lida por ${userEmail}`
    );
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    throw error;
  }
};

export const markAllAsRead = async (
  notifications: Notification[],
  userEmail: string
) => {
  if (!userEmail || notifications.length === 0) return;

  try {
    const batch = writeBatch(db);
    
    // Filtra apenas notificações não lidas pelo usuário
    const unreadNotifications = notifications.filter(
      notification => !notification.readBy.includes(userEmail)
    );
    
    // Atualiza cada notificação não lida
    unreadNotifications.forEach(notification => {
      const notificationRef = doc(db, "notifications", notification.id);
      batch.update(notificationRef, {
        readBy: arrayUnion(userEmail)
      });
    });
    
    await batch.commit();
    console.log(
      `${unreadNotifications.length} notificações marcadas como lidas por ${userEmail}`
    );
    return unreadNotifications.length;
  } catch (error) {
    console.error("Erro ao marcar todas notificações como lidas:", error);
    throw error;
  }
};

export const deleteNotification = async (id: string) => {
  try {
    await deleteDoc(doc(db, "notifications", id));
    console.log(`Notificação ${id} excluída com sucesso`);
  } catch (error) {
    console.error("Erro ao excluir notificação:", error);
    throw error;
  }
};