
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where,
  updateDoc,
  getDoc,
  orderBy
} from "firebase/firestore";

export type EquipmentType = 
  | "Chromebook" 
  | "iPad" 
  | "Projetor" 
  | "Cabo" 
  | "Desktop" 
  | "Periférico"
  | "Áudio"
  | "Rede"
  | "Outro";

export interface Equipment {
  id?: string;
  name: string;
  type: EquipmentType;
  status: "disponível" | "em uso" | "em manutenção" | "obsoleto";
  location?: string;
  serialNumber?: string;
  model?: string;
  brand?: string;
  purchaseDate?: string;
  warrantyUntil?: string;
  notes?: string;
  lastMaintenance?: string;
  properties?: Record<string, string>; // For type-specific properties
}

// Collection reference
const equipmentCollectionRef = collection(db, "equipment");

// Add new equipment
export const addEquipment = async (equipment: Omit<Equipment, "id">) => {
  try {
    const docRef = await addDoc(equipmentCollectionRef, {
      ...equipment,
      status: equipment.status || "disponível", // Default status
    });
    return { id: docRef.id, ...equipment };
  } catch (error) {
    console.error("Error adding equipment:", error);
    throw error;
  }
};

// Get all equipment
export const getAllEquipment = async (): Promise<Equipment[]> => {
  try {
    const snapshot = await getDocs(equipmentCollectionRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Equipment[];
  } catch (error) {
    console.error("Error getting equipment:", error);
    throw error;
  }
};

// Get sorted equipment for lending (Chromebooks first, then iPads, all alphabetically)
export const getSortedEquipmentForLending = async (): Promise<Equipment[]> => {
  try {
    const snapshot = await getDocs(equipmentCollectionRef);
    const equipment = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Equipment[];
    
    // Filter only Chromebooks and iPads
    const lendingEquipment = equipment.filter(
      item => item.type === "Chromebook" || item.type === "iPad"
    );
    
    // Sort by type (Chromebooks first) and then by name alphabetically
    return lendingEquipment.sort((a, b) => {
      // First sort by type (Chromebook first)
      if (a.type === "Chromebook" && b.type === "iPad") return -1;
      if (a.type === "iPad" && b.type === "Chromebook") return 1;
      
      // If types are the same, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("Error getting sorted equipment:", error);
    throw error;
  }
};

// Get a single equipment by ID
export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
  try {
    const docRef = doc(db, "equipment", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Equipment;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting equipment by ID:", error);
    throw error;
  }
};

// Update equipment
export const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
  try {
    const equipmentRef = doc(db, "equipment", id);
    await updateDoc(equipmentRef, updates);
    return true;
  } catch (error) {
    console.error("Error updating equipment:", error);
    throw error;
  }
};

// Delete equipment
export const deleteEquipment = async (id: string) => {
  try {
    await deleteDoc(doc(db, "equipment", id));
    return true;
  } catch (error) {
    console.error("Error deleting equipment:", error);
    throw error;
  }
};

// Filter equipment by type
export const filterEquipmentByType = async (type: EquipmentType): Promise<Equipment[]> => {
  try {
    const q = query(equipmentCollectionRef, where("type", "==", type));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Equipment[];
  } catch (error) {
    console.error("Error filtering equipment:", error);
    throw error;
  }
};
