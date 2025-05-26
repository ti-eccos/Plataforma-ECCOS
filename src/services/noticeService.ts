import { db, storage } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  onSnapshot
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";

export interface Notice {
  id: string;
  type: 'text' | 'image';
  title: string;
  content?: string;
  imageUrl?: string;
  imagePath?: string; // Caminho da imagem no Storage para exclusão
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface CreateNoticeData {
  type: 'text' | 'image';
  title: string;
  content?: string;
  imageFile?: File; // Arquivo de imagem para upload
  priority: 'low' | 'medium' | 'high';
  expiresAt?: Date;
  isActive: boolean;
  createdBy: string;
}

export interface UpdateNoticeData {
  type?: 'text' | 'image';
  title?: string;
  content?: string;
  imageFile?: File; // Novo arquivo de imagem
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: Date;
  isActive?: boolean;
  updatedBy: string;
}

const noticesCollectionRef = collection(db, "avisos");

// Função para fazer upload da imagem
export const uploadNoticeImage = async (file: File, noticeId: string): Promise<{ url: string; path: string }> => {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const imagePath = `avisos/${noticeId}/${fileName}`;
    const imageRef = ref(storage, imagePath);
    
    await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(imageRef);
    
    return {
      url: downloadURL,
      path: imagePath
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// Função para deletar imagem do Storage
export const deleteNoticeImage = async (imagePath: string): Promise<void> => {
  try {
    if (imagePath) {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    // Não propagar o erro para não interromper outras operações
  }
};

// Buscar todos os avisos ativos
export const getActiveNotices = async (): Promise<Notice[]> => {
  try {
    const q = query(
      noticesCollectionRef,
      where("isActive", "==", true),
      orderBy("priority", "desc"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || undefined,
        updatedAt: data.updatedAt?.toDate() || undefined,
      } as Notice;
    });
  } catch (error) {
    console.error("Error getting active notices:", error);
    throw error;
  }
};

// Buscar todos os avisos (admin)
export const getAllNotices = async (): Promise<Notice[]> => {
  try {
    const q = query(
      noticesCollectionRef,
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || undefined,
        updatedAt: data.updatedAt?.toDate() || undefined,
      } as Notice;
    });
  } catch (error) {
    console.error("Error getting all notices:", error);
    throw error;
  }
};

// Criar novo aviso
export const createNotice = async (noticeData: CreateNoticeData): Promise<string> => {
  try {
    // Primeiro criar o documento para ter o ID
   const docData = {
  type: noticeData.type,
  title: noticeData.title,
  content: noticeData.content ?? '',
  imageUrl: '',
  imagePath: '',
  priority: noticeData.priority,
  isActive: noticeData.isActive,
  createdBy: noticeData.createdBy,
  createdAt: Timestamp.now(),
  expiresAt: noticeData.expiresAt ? Timestamp.fromDate(noticeData.expiresAt) : null,
  updatedAt: null,
  updatedBy: null,
};

    const docRef = await addDoc(noticesCollectionRef, docData);
    
    // Se há uma imagem, fazer upload e atualizar o documento
    if (noticeData.imageFile && noticeData.type === 'image') {
      const { url, path } = await uploadNoticeImage(noticeData.imageFile, docRef.id);
      
      await updateDoc(docRef, {
        imageUrl: url,
        imagePath: path
      });
    }
    
    return docRef.id;
  } catch (error) {
    console.error("Error creating notice:", error);
    throw error;
  }
};

// Atualizar aviso
export const updateNotice = async (noticeId: string, updateData: UpdateNoticeData): Promise<void> => {
  try {
    const noticeRef = doc(db, "avisos", noticeId);

    const docData: any = {
      updatedAt: Timestamp.now(),
      updatedBy: updateData.updatedBy,
    };

    if (updateData.title !== undefined) docData.title = updateData.title;
    if (updateData.type !== undefined) docData.type = updateData.type;
    if (updateData.content !== undefined) docData.content = updateData.content ?? '';
    if (updateData.priority !== undefined) docData.priority = updateData.priority;
    if (updateData.isActive !== undefined) docData.isActive = updateData.isActive;
    if (updateData.expiresAt !== undefined)
    if (updateData.content !== undefined)
      docData.content = updateData.content ?? '';
    if (updateData.title !== undefined)
      docData.title = updateData.title;
    if (updateData.priority !== undefined)
      docData.priority = updateData.priority;
    if (updateData.expiresAt !== undefined)
      docData.expiresAt = updateData.expiresAt ? Timestamp.fromDate(updateData.expiresAt) : null;
      docData.expiresAt = updateData.expiresAt ? Timestamp.fromDate(updateData.expiresAt) : null;

    // Se há uma nova imagem, fazer upload
    if (updateData.imageFile && updateData.type === 'image') {
      // Buscar dados atuais para deletar imagem antiga se existir
      const currentDoc = await getDocs(query(noticesCollectionRef, where("__name__", "==", noticeId)));
      if (!currentDoc.empty) {
        const currentData = currentDoc.docs[0].data();
        if (currentData.imagePath) {
          await deleteNoticeImage(currentData.imagePath);
        }
      }
      
      // Upload da nova imagem
      const { url, path } = await uploadNoticeImage(updateData.imageFile, noticeId);
      docData.imageUrl = url;
      docData.imagePath = path;
    }

    await updateDoc(noticeRef, docData);
  } catch (error) {
    console.error("Error updating notice:", error);
    throw error;
  }
};

// Deletar aviso (exclusão física)
export const deleteNotice = async (noticeId: string): Promise<void> => {
  try {
    // Buscar dados do aviso para deletar imagem se existir
    const noticeRef = doc(db, "avisos", noticeId);
    const noticeDoc = await getDocs(query(noticesCollectionRef, where("__name__", "==", noticeId)));
    
    if (!noticeDoc.empty) {
      const noticeData = noticeDoc.docs[0].data();
      if (noticeData.imagePath) {
        await deleteNoticeImage(noticeData.imagePath);
      }
    }
    
    await deleteDoc(noticeRef);
  } catch (error) {
    console.error("Error deleting notice:", error);
    throw error;
  }
};

// Desativar aviso (exclusão lógica)
export const deactivateNotice = async (noticeId: string, updatedBy: string): Promise<void> => {
  try {
    await updateNotice(noticeId, {
      isActive: false,
      updatedBy
    });
  } catch (error) {
    console.error("Error deactivating notice:", error);
    throw error;
  }
};

// Listener para avisos ativos em tempo real
export const subscribeToActiveNotices = (
  callback: (notices: Notice[]) => void
): (() => void) => {
  const q = query(
    noticesCollectionRef,
    where("isActive", "==", true),
    orderBy("priority", "desc"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const notices = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || undefined,
        updatedAt: data.updatedAt?.toDate() || undefined,
      } as Notice;
    });

    callback(notices);
  }, (error) => {
    console.error("Error in notices subscription:", error);
  });
};

// Verifica se o aviso está expirado
export const isNoticeExpired = (notice: Notice): boolean => {
  if (!notice.expiresAt) return false;
  return new Date() > notice.expiresAt;
};

// Desativa automaticamente os expirados
export const cleanupExpiredNotices = async (): Promise<void> => {
  try {
    const q = query(
      noticesCollectionRef,
      where("isActive", "==", true)
    );

    const snapshot = await getDocs(q);
    const expiredNotices = snapshot.docs.filter(doc => {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate();
      return expiresAt && new Date() > expiresAt;
    });

    const promises = expiredNotices.map(doc =>
      updateDoc(doc.ref, {
        isActive: false,
        updatedAt: Timestamp.now(),
        updatedBy: 'system'
      })
    );

    await Promise.all(promises);

    if (expiredNotices.length > 0) {
      console.log(`Cleaned up ${expiredNotices.length} expired notices`);
    }
  } catch (error) {
    console.error("Error cleaning up expired notices:", error);
  }
};