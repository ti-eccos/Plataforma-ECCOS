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
export type RequestType = "reservation" | "purchase" | "support"; // Deve estar exportado

export const addReservation = async (data: {
  date: Date;
  startTime: string;
  endTime: string;
  equipmentIds: string[];
  location: string;
  purpose: string;
  userName: string;
  userEmail: string;
}) => {
  const docRef = await addDoc(collection(db, 'reservations'), {
    ...data,
    type: 'reservation' as const,
    status: 'pending' as const,
    createdAt: new Date(),
    hidden: false
  });
  return docRef.id;
};

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
  userName: string;
  userEmail: string;
  createdAt: Timestamp;
  [key: string]: any;
}

export const getAllRequests = async (showHidden: boolean): Promise<RequestData[]> => {
  const collections = ['reservations', 'purchases', 'supports'];
  const requests: RequestData[] = [];

  for (const col of collections) {
    const q = query(
      collection(db, col),
      where("hidden", "==", showHidden)
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
        createdAt: data.createdAt,
        ...data
      });
    });
  }

  return requests.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
};

export const getRequestById = async (id: string, collectionName: string): Promise<RequestData> => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error(`Solicitação não encontrada na coleção ${collectionName}`);
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    collectionName,
    type: data.type as RequestType,
    status: data.status as RequestStatus,
    userName: data.userName,
    userEmail: data.userEmail,
    createdAt: data.createdAt,
    ...data
  };
};

export const updateRequestStatus = async (
  id: string, 
  status: RequestStatus, 
  collectionName: string
): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, { status });
};

export const addMessageToRequest = async (
  id: string,
  message: string,
  isAdmin: boolean,
  collectionName: string,
  userName: string
): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    messages: arrayUnion({
      message,
      isAdmin,
      userName,
      timestamp: Timestamp.now()
    })
  });
};

export const deleteRequest = async (id: string, collectionName: string): Promise<void> => {
  await deleteDoc(doc(db, collectionName, id));
};

export const addPurchaseRequest = async (data: Omit<RequestData, 'id' | 'collectionName'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'purchases'), {
    ...data,
    type: 'purchase' as const,
    status: 'pending' as const,
    createdAt: Timestamp.now(),
    hidden: false
  });
  return docRef.id;
};