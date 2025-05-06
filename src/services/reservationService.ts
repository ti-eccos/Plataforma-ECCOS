import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  addDoc,
  deleteDoc,
  arrayUnion,
  Timestamp
} from "firebase/firestore";

export type RequestStatus = "pending" | "approved" | "rejected" | "in-progress" | "completed" | "canceled";
export type RequestType = "reservation" | "purchase" | "support";

export interface MessageData {
  message: string;
  isAdmin: boolean;
  userName: string;
  timestamp: Timestamp;
}

export interface RequestData {
  id: string;
  collectionName: string;
  type: RequestType;
  status: RequestStatus;
  description?: string;
  userName: string;
  userEmail: string;
  userId: string;
  createdAt: Timestamp;
  equipmentNames: string[];
  equipmentIds: string[];
  equipmentQuantities: { [type: string]: number };
  [key: string]: any;
}

export const addReservation = async (data: {
  date: Date;
  startTime: string;
  endTime: string;
  equipmentIds: string[];
  location: string;
  purpose: string;
  userName: string;
  userEmail: string;
  userId: string;
  status?: RequestStatus;
  equipmentQuantities: { [type: string]: number };
}): Promise<string> => {
  try {
    const equipmentNames = await Promise.all(
      data.equipmentIds.map(async (id) => {
        const equipDoc = await getDoc(doc(db, 'equipment', id));
        return equipDoc.exists() ? equipDoc.data().name : 'Equipamento desconhecido';
      })
    );

    const docRef = await addDoc(collection(db, 'reservations'), {
      ...data,
      equipmentNames,
      equipmentIds: data.equipmentIds,
      equipmentQuantities: data.equipmentQuantities,
      date: Timestamp.fromDate(data.date),
      type: 'reservation',
      status: data.status || 'pending',
      createdAt: Timestamp.now(),
      hidden: false
    });

    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar reserva:", error);
    throw error;
  }
};

export const checkConflicts = async (data: {
  date: Date;
  startTime: string;
  endTime: string;
  equipmentIds: string[];
}): Promise<Array<{ equipmentName: string; startTime: string; endTime: string }>> => {
  try {
    const conflicts = [];
    const [reqStartHours, reqStartMinutes] = data.startTime.split(':').map(Number);
    const [reqEndHours, reqEndMinutes] = data.endTime.split(':').map(Number);
    const reqStartTotal = reqStartHours * 60 + reqStartMinutes;
    const reqEndTotal = reqEndHours * 60 + reqEndMinutes;

    const requestDate = new Date(data.date);
    requestDate.setHours(0, 0, 0, 0);

    const reservationsQuery = query(
      collection(db, 'reservations'),
      where('status', 'in', ['pending', 'approved', 'in-progress']),
      where('hidden', '==', false)
    );

    const querySnapshot = await getDocs(reservationsQuery);
    const equipmentMap = new Map();

    for (const equipId of data.equipmentIds) {
      const equipDoc = await getDoc(doc(db, 'equipment', equipId));
      if (equipDoc.exists()) {
        equipmentMap.set(equipId, equipDoc.data().name);
      }
    }

    for (const docSnapshot of querySnapshot.docs) {
      const reservation = docSnapshot.data();
      const reservationDate = reservation.date.toDate();
      reservationDate.setHours(0, 0, 0, 0);

      if (reservationDate.getTime() !== requestDate.getTime()) continue;

      const [resStartHours, resStartMinutes] = reservation.startTime.split(':').map(Number);
      const [resEndHours, resEndMinutes] = reservation.endTime.split(':').map(Number);
      const resStartTotal = resStartHours * 60 + resStartMinutes;
      const resEndTotal = resEndHours * 60 + resEndMinutes;

      const hasOverlap = (
        (reqStartTotal >= resStartTotal && reqStartTotal < resEndTotal) ||
        (reqEndTotal > resStartTotal && reqEndTotal <= resEndTotal) ||
        (reqStartTotal <= resStartTotal && reqEndTotal >= resEndTotal)
      );

      if (hasOverlap) {
        const commonEquipment = reservation.equipmentIds.filter((id: string) => 
          data.equipmentIds.includes(id)
        );

        for (const equipId of commonEquipment) {
          conflicts.push({
            equipmentName: equipmentMap.get(equipId) || 'Equipamento desconhecido',
            startTime: reservation.startTime,
            endTime: reservation.endTime
          });
        }
      }
    }

    return conflicts;
  } catch (error) {
    console.error("Erro ao verificar conflitos:", error);
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
      ...data
    };
  } catch (error) {
    console.error("Erro ao buscar solicitação:", error);
    throw error;
  }
};

export const addMessageToRequest = async (
  id: string,
  message: string,
  isAdmin: boolean,
  collectionName: string,
  userName: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      messages: arrayUnion({
        message,
        isAdmin,
        userName,
        timestamp: Timestamp.now()
      })
    });
  } catch (error) {
    console.error("Erro ao adicionar mensagem:", error);
    throw error;
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

export const getEquipmentReservations = async (equipmentId: string): Promise<RequestData[]> => {
  try {
    const q = query(
      collection(db, 'reservations'),
      where('equipmentIds', 'array-contains', equipmentId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      collectionName: 'reservations',
      ...doc.data() as RequestData
    }));
  } catch (error) {
    console.error("Erro ao buscar reservas do equipamento:", error);
    return [];
  }
};

export const addPurchaseRequest = async (data: Omit<RequestData, 'id' | 'collectionName'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'purchases'), {
      tipo: data.tipo, 
      ...data,
      type: 'purchase',
      status: 'pending',
      createdAt: Timestamp.now(),
      hidden: false
    });

    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar solicitação de compra:", error);
    throw error;
  }
};

export const addSupportRequest = async (data: Omit<RequestData, 'id' | 'collectionName'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'supports'), {
      tipo: data.tipo, 
      ...data,
      type: 'support',
      status: 'pending',
      createdAt: Timestamp.now(),
      hidden: false
    });

    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar solicitação de suporte:", error);
    throw error;
  }
};