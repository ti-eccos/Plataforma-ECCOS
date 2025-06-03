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
  recipients: string[];
  isBatch: boolean;
}

export const createBatchNotifications = async (notifications: Array<Omit<Notification, "id">>) => {
  try {
    // Filtrar notificações de status: apenas "Aprovada" e "Reprovada"
    const filteredNotifications = notifications.filter(notification => {
      if (notification.title === "Alteração de Status") {
        const allowedStatuses = ["Aprovada", "Reprovada"];
        return allowedStatuses.some(status => 
          notification.message.includes(`alterado para ${status}`)
        );
      }
      return true; // Mantém todas as outras notificações (globais e individuais)
    });

    // Se não houver notificações válidas após o filtro
    if (filteredNotifications.length === 0) return 0;

    const batch = writeBatch(db);
    const notificationsRef = collection(db, "notifications");

    filteredNotifications.forEach(notification => {
      const docRef = doc(notificationsRef);
      batch.set(docRef, {
        ...notification,
        createdAt: Timestamp.now(),
      });
    });

    await batch.commit();
    return filteredNotifications.length;
  } catch (error) {
    throw new Error("Failed to create batch notifications");
  }
};

export const createNotification = async (data: Omit<Notification, "id">) => {
  try {
    const docRef = await addDoc(collection(db, "notifications"), {
      ...data,
      createdAt: Timestamp.now(),
      link: data.link || null,
      readBy: data.readBy || [],
    });
    return docRef.id;
  } catch (error) {
    throw new Error("Failed to create notification");
  }
};

export const getNotifications = async (userEmail: string): Promise<Notification[]> => {
  try {
    const q = userEmail === "" 
      ? query(collection(db, "notifications"), orderBy("createdAt", "desc"))
      : query(
          collection(db, "notifications"),
          or(
            where("recipients", "array-contains", userEmail),
            where("recipients", "==", [])
          ),
          orderBy("createdAt", "desc")
        );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        message: data.message,
        createdAt: data.createdAt.toDate(),
        readBy: data.readBy || [],
        link: data.link || null,
        recipients: data.recipients || [],
        isBatch: data.isBatch || false,
      };
    });
  } catch (error) {
    throw new Error("Failed to fetch notifications");
  }
};

export const markAsRead = async (notificationId: string, userEmail: string) => {
  if (!userEmail) return;

  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      readBy: arrayUnion(userEmail),
    });
  } catch (error) {
    throw new Error("Failed to mark notification as read");
  }
};

export const markAllAsRead = async (notifications: Notification[], userEmail: string) => {
  if (!userEmail) return;

  try {
    const batch = writeBatch(db);
    const unreadNotifications = notifications.filter(
      notification => 
        (notification.recipients.includes(userEmail) || 
        (notification.recipients.length === 0)) &&
        !notification.readBy.includes(userEmail)
    );

    unreadNotifications.forEach(notification => {
      const notificationRef = doc(db, "notifications", notification.id);
      batch.update(notificationRef, {
        readBy: arrayUnion(userEmail)
      });
    });

    await batch.commit();
    return unreadNotifications.length;
  } catch (error) {
    throw new Error("Failed to mark all notifications as read");
  }
};

export const deleteNotification = async (id: string) => {
  try {
    await deleteDoc(doc(db, "notifications", id));
  } catch (error) {
    throw new Error("Failed to delete notification");
  }
};

export const setupNotificationsListener = (
  userEmail: string,
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, "notifications"),
    or(
      where("recipients", "array-contains", userEmail),
      where("recipients", "==", [])
    ),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        message: data.message,
        createdAt: data.createdAt.toDate(),
        readBy: data.readBy || [],
        link: data.link || null,
        recipients: data.recipients || [],
        isBatch: data.isBatch || false,
      };
    });
    callback(notifications);
  });
};