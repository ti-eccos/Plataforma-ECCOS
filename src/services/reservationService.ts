
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
  doc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { formatDateToYYYYMMDD } from "./availabilityService";

const COLLECTION_NAME = "reservations";

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
export const getAllReservations = async (): Promise<any[]> => {
  try {
    const reservationsSnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return reservationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting all reservations:", error);
    throw error;
  }
};
