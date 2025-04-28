import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  deleteDoc
} from "firebase/firestore";

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  link?: string | null;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const q = query(
    collection(db, "notifications"),
    orderBy("createdAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as any).toDate(),
  })) as Notification[];
};

export const createNotification = async (data: Omit<Notification, "id">) => {
  const notificationData = {
    ...data,
    createdAt: new Date(),
    link: data.link || null,
  };

  await addDoc(collection(db, "notifications"), notificationData);
};

export const markAsRead = async (id: string) => {
  await updateDoc(doc(db, "notifications", id), {
    read: true,
  });
};

export const deleteNotification = async (id: string) => {
  await deleteDoc(doc(db, "notifications", id));
};