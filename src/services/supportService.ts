import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { RequestData } from "./types";

export const addSupportRequest = async (data: Omit<RequestData, 'id' | 'collectionName'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'supports'), {
      ...data,
      type: 'support',
      status: 'pending',
      createdAt: Timestamp.now(),
      hidden: false,
      unreadMessages: 0,
      hasUnreadMessages: false
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar solicitação de suporte:", error);
    throw error;
  }
};