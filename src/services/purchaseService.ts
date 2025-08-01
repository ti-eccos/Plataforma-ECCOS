import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { RequestData } from "./types";

export const addPurchaseRequest = async (data: Omit<RequestData, 'id' | 'collectionName'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'purchases'), {
      tipo: data.tipo, 
      ...data,
      financeiroVisible: false,
      type: 'purchase',
      status: 'pending',
      createdAt: Timestamp.now(),
      hidden: false,
      unreadMessages: 0,
      hasUnreadMessages: false,
      rejectionReason: '' // Novo campo adicionado
    });

    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar solicitação de compra:", error);
    throw error;
  }
};