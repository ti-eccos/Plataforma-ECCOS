import { db, storage } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  arrayUnion,
  Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { RequestData, MessageData, FileAttachment, RequestType, RequestStatus } from "./types";

export const uploadFile = async (file: File, requestId: string): Promise<FileAttachment> => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `chat-files/${requestId}/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
      name: file.name,
      url: downloadURL,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error("Erro ao fazer upload do arquivo:", error);
    throw error;
  }
};

export const getAllRequests = async (showHidden: boolean = false): Promise<RequestData[]> => {
  try {
    const collections = ['reservations', 'purchases', 'supports'];
    const requests: RequestData[] = [];

    for (const col of collections) {
      const q = showHidden 
        ? query(collection(db, col))
        : query(collection(db, col), where("hidden", "==", false));

      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          collectionName: col,
          type: data.type as RequestType,
          status: data.status as RequestStatus,
          userName: data.userName,
          userEmail: data.userEmail,
          userId: data.userId,
          createdAt: data.createdAt,
          equipmentNames: data.equipmentNames || [],
          equipmentIds: data.equipmentIds || [],
          equipmentQuantities: data.equipmentQuantities || {},
          unreadMessages: data.unreadMessages || 0,
          hasUnreadMessages: data.hasUnreadMessages || false,
          ...data
        });
      });
    }

    return requests.sort((a, b) => 
      b.createdAt.toMillis() - a.createdAt.toMillis()
    );
  } catch (error) {
    console.error("Erro ao buscar solicitações:", error);
    return [];
  }
};

export const getRequestById = async (id: string, collectionName: string): Promise<RequestData> => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Solicitação não encontrada");
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      collectionName,
      type: data.type as RequestType,
      status: data.status as RequestStatus,
      userName: data.userName,
      userEmail: data.userEmail,
      userId: data.userId,
      createdAt: data.createdAt,
      equipmentNames: data.equipmentNames || [],
      equipmentIds: data.equipmentIds || [],
      equipmentQuantities: data.equipmentQuantities || {},
      unreadMessages: data.unreadMessages || 0,
      hasUnreadMessages: data.hasUnreadMessages || false,
      ...data
    };
  } catch (error) {
    console.error("Erro ao buscar solicitação:", error);
    throw error;
  }
};

export const getUserRequests = async (userId: string, userEmail?: string): Promise<RequestData[]> => {
  try {
    const collections = ["reservations", "purchases", "supports"];
    const requests: RequestData[] = [];

    for (const col of collections) {
      const q = userEmail 
        ? query(
            collection(db, col),
            where("userEmail", "==", userEmail),
            where("status", "!=", "canceled")
          )
        : query(
            collection(db, col),
            where("userId", "==", userId),
            where("status", "!=", "canceled")
          );

      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          collectionName: col,
          type: data.type as RequestType,
          status: data.status as RequestStatus,
          userName: data.userName,
          userEmail: data.userEmail,
          userId: data.userId,
          createdAt: data.createdAt,
          equipmentNames: data.equipmentNames || [],
          equipmentIds: data.equipmentIds || [],
          equipmentQuantities: data.equipmentQuantities || {},
          unreadMessages: data.unreadMessages || 0,
          hasUnreadMessages: data.hasUnreadMessages || false,
          ...data
        });
      });
    }

    return requests.sort((a, b) => 
      b.createdAt.toMillis() - a.createdAt.toMillis()
    );
  } catch (error) {
    console.error("Erro ao buscar solicitações do usuário:", error);
    return [];
  }
};

export const deleteRequest = async (id: string, collectionName: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error("Erro ao excluir solicitação:", error);
    throw error;
  }
};

// Funções de mensagens

export const addMessageToRequest = async (
  id: string,
  message: string,
  isAdmin: boolean,
  collectionName: string,
  userName: string,
  userId: string,
  attachment?: FileAttachment
): Promise<void> => {
  try {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageData: MessageData = {
      id: messageId,
      message,
      isAdmin,
      userName,
      userId,
      timestamp: Timestamp.now(),
      delivered: true,
      read: false,
      readBy: [],
      isDeleted: false,
      isEdited: false
    };

    if (attachment) {
      messageData.attachment = attachment;
    }

    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      messages: arrayUnion(messageData),
      hasUnreadMessages: true,
      unreadMessages: arrayUnion(messageId)
    });
  } catch (error) {
    console.error("Erro ao adicionar mensagem:", error);
    throw error;
  }
};

export const editMessage = async (
  requestId: string,
  collectionName: string,
  messageId: string,
  newMessage: string,
  userId: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, requestId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Solicitação não encontrada");
    }
    
    const data = docSnap.data();
    const messages = data.messages || [];
    
    const updatedMessages = messages.map((msg: MessageData) => {
      if (msg.id === messageId && msg.userId === userId) {
        return {
          ...msg,
          originalMessage: msg.isEdited ? msg.originalMessage : msg.message,
          message: newMessage,
          isEdited: true,
          editedAt: Timestamp.now()
        };
      }
      return msg;
    });

    await updateDoc(docRef, {
      messages: updatedMessages
    });
  } catch (error) {
    console.error("Erro ao editar mensagem:", error);
    throw error;
  }
};

export const deleteMessage = async (
  requestId: string,
  collectionName: string,
  messageId: string,
  userId: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, requestId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Solicitação não encontrada");
    }
    
    const data = docSnap.data();
    const messages = data.messages || [];
    
    const updatedMessages = messages.map((msg: MessageData) => {
      if (msg.id === messageId && msg.userId === userId) {
        return {
          ...msg,
          message: "Mensagem apagada",
          isDeleted: true,
          attachment: undefined
        };
      }
      return msg;
    });

    await updateDoc(docRef, {
      messages: updatedMessages
    });
  } catch (error) {
    console.error("Erro ao apagar mensagem:", error);
    throw error;
  }
};

export const markMessagesAsRead = async (
  requestId: string,
  collectionName: string,
  userId: string,
  isAdmin: boolean
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, requestId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return;
    
    const data = docSnap.data();
    const messages = data.messages || [];
    
    const updatedMessages = messages.map((msg: MessageData) => {
      if (msg.isAdmin !== isAdmin && !msg.readBy?.includes(userId)) {
        return {
          ...msg,
          read: true,
          readBy: [...(msg.readBy || []), userId]
        };
      }
      return msg;
    });

    await updateDoc(docRef, {
      messages: updatedMessages,
      hasUnreadMessages: false,
      unreadMessages: []
    });
  } catch (error) {
    console.error("Erro ao marcar mensagens como lidas:", error);
    throw error;
  }
};