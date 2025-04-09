
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  serverTimestamp,
  getDoc,
  doc,
  updateDoc,
  orderBy
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { formatDateToYYYYMMDD } from "./availabilityService";

const COLLECTION_NAME = "reservations";
const PURCHASE_COLLECTION = "purchases";
const SUPPORT_COLLECTION = "support";

export type RequestStatus = 
  | "pending" 
  | "approved" 
  | "rejected" 
  | "in-progress" 
  | "completed" 
  | "canceled";

export type RequestType = "reservation" | "purchase" | "support";

export interface ReservationData {
  date: Date;
  startTime: string;
  endTime: string;
  equipmentIds: string[];
  location: string;
  purpose: string;
}

export interface Conflict {
  equipmentId: string;
  equipmentName: string;
  startTime: string;
  endTime: string;
}

export interface MessageData {
  userId: string;
  userName: string;
  message: string;
  timestamp: any;
  isAdmin: boolean;
}

// Add a new reservation
export const addReservation = async (reservation: ReservationData): Promise<void> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const reservationData = {
      ...reservation,
      date: Timestamp.fromDate(reservation.date),
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,
      status: "pending", // pending, approved, rejected
      createdAt: serverTimestamp(),
      type: "reservation",
      messages: []
    };

    await addDoc(collection(db, COLLECTION_NAME), reservationData);
  } catch (error) {
    console.error("Error adding reservation:", error);
    throw error;
  }
};

// Check for conflicts with existing reservations
export const checkConflicts = async (
  reservation: {
    date: Date;
    startTime: string;
    endTime: string;
    equipmentIds: string[];
  }
): Promise<Conflict[]> => {
  try {
    const conflicts: Conflict[] = [];
    const dateStr = formatDateToYYYYMMDD(reservation.date);
    
    // Query reservations for the same date
    const q = query(
      collection(db, COLLECTION_NAME),
      where("date", "==", Timestamp.fromDate(reservation.date))
    );
    
    const reservationsSnapshot = await getDocs(q);
    const reservations = reservationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Check for time overlap with each equipment
    for (const equipmentId of reservation.equipmentIds) {
      for (const existingReservation of reservations) {
        const existingData = existingReservation as any; // Type assertion to avoid TS errors
        
        // Skip if this reservation doesn't include the current equipment
        if (!existingData.equipmentIds || !existingData.equipmentIds.includes(equipmentId)) {
          continue;
        }
        
        // Check if time periods overlap
        const existingStart = existingData.startTime;
        const existingEnd = existingData.endTime;
        
        // Time periods overlap if:
        // - New start time is before existing end time AND
        // - New end time is after existing start time
        if (reservation.startTime < existingEnd && 
            reservation.endTime > existingStart) {
          
          // Get equipment name
          const equipmentDoc = await getDoc(doc(db, "equipment", equipmentId));
          const equipmentName = equipmentDoc.exists() ? equipmentDoc.data().name : "Equipamento";
          
          conflicts.push({
            equipmentId,
            equipmentName,
            startTime: existingStart,
            endTime: existingEnd
          });
          
          // No need to check other reservations for this equipment once we found a conflict
          break;
        }
      }
    }
    
    return conflicts;
  } catch (error) {
    console.error("Error checking reservation conflicts:", error);
    throw error;
  }
};

// Get user reservations
export const getUserReservations = async (): Promise<any[]> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", user.uid)
    );
    
    const reservationsSnapshot = await getDocs(q);
    return reservationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting user reservations:", error);
    throw error;
  }
};

// For admin: Get all reservations
export const getAllRequests = async (showHidden: boolean = false): Promise<any[]> => {
  try {
    // Get reservations
    const reservationsQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc")
    );
    const reservationsSnapshot = await getDocs(reservationsQuery);
    const reservations = reservationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      collectionName: COLLECTION_NAME
    }));
    
    // Get purchases
    const purchasesQuery = query(
      collection(db, PURCHASE_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const purchasesSnapshot = await getDocs(purchasesQuery);
    const purchases = purchasesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      collectionName: PURCHASE_COLLECTION
    }));
    
    // Get support requests
    const supportQuery = query(
      collection(db, SUPPORT_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const supportSnapshot = await getDocs(supportQuery);
    const support = supportSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      collectionName: SUPPORT_COLLECTION
    }));
    
    // Combine all requests
    let allRequests = [...reservations, ...purchases, ...support];
    
    // Filter out hidden statuses if needed
    if (!showHidden) {
      allRequests = allRequests.filter(
        req => !["canceled", "completed", "rejected"].includes(req.status)
      );
    }
    
    return allRequests;
  } catch (error) {
    console.error("Error getting all requests:", error);
    throw error;
  }
};

// Update request status
export const updateRequestStatus = async (
  requestId: string, 
  status: RequestStatus,
  collectionName: string
): Promise<void> => {
  try {
    const requestRef = doc(db, collectionName, requestId);
    await updateDoc(requestRef, { status });
  } catch (error) {
    console.error("Error updating request status:", error);
    throw error;
  }
};

// Add message to request
export const addMessageToRequest = async (
  requestId: string, 
  message: string,
  isAdmin: boolean,
  collectionName: string
): Promise<void> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const requestRef = doc(db, collectionName, requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error("Request not found");
    }
    
    const requestData = requestDoc.data();
    const messages = requestData.messages || [];
    
    const newMessage = {
      userId: user.uid,
      userName: user.displayName || user.email,
      message,
      timestamp: serverTimestamp(),
      isAdmin
    };
    
    await updateDoc(requestRef, {
      messages: [...messages, newMessage]
    });
  } catch (error) {
    console.error("Error adding message to request:", error);
    throw error;
  }
};

// Get request by ID
export const getRequestById = async (
  requestId: string,
  collectionName: string
): Promise<any> => {
  try {
    const requestRef = doc(db, collectionName, requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error("Request not found");
    }
    
    return {
      id: requestDoc.id,
      ...requestDoc.data(),
      collectionName
    };
  } catch (error) {
    console.error("Error getting request by ID:", error);
    throw error;
  }
};
