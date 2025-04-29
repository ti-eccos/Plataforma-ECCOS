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
  arrayUnion
} from "firebase/firestore";

export const createNotification = async (data: Omit<Notification, "id">) => {
  try {
    const docRef = await addDoc(collection(db, "notifications"), {
      ...data,
      createdAt: new Date(),
      link: data.link || null,
      readBy: data.readBy || []
    });
    console.log('Notificação criada com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }
};

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  readBy: string[];
  link?: string | null;
  userEmail: string;
}

export const getNotifications = async (userEmail: string): Promise<Notification[]> => {
  let q;
  
  if (userEmail === "") {
    q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );
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

  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: (doc.data().createdAt as any).toDate(),
          readBy: doc.data().readBy || [],
        })) as Notification[];
        resolve(notifications);
      },
      (error) => reject(error)
    );
  });
};

export const markAsRead = async (notificationId: string, userEmail: string) => {
  await updateDoc(doc(db, "notifications", notificationId), {
    readBy: arrayUnion(userEmail)
  });
};

export const deleteNotification = async (id: string) => {
  await deleteDoc(doc(db, "notifications", id));
};