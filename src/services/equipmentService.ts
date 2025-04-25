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
  orderBy,
  writeBatch
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
  location?: string;
  serialNumber?: string;
  model?: string;
  brand?: string;
  purchaseDate?: string;
  warrantyUntil?: string;
  notes?: string;
  lastMaintenance?: string;
  properties?: Record<string, string>;
}

const equipmentCollectionRef = collection(db, "equipment");

export const addEquipment = async (equipment: Omit<Equipment, "id">) => {
  try {
    const docRef = await addDoc(equipmentCollectionRef, equipment);
    return { id: docRef.id, ...equipment };
  } catch (error) {
    console.error("Error adding equipment:", error);
    throw error;
  }
};

export const addMultipleEquipment = async (equipments: Omit<Equipment, "id">[]) => {
  try {
    const batch = writeBatch(db);
    equipments.forEach(equipment => {
      const docRef = doc(equipmentCollectionRef);
      batch.set(docRef, equipment);
    });
    await batch.commit();
    return equipments;
  } catch (error) {
    console.error("Error adding multiple equipment:", error);
    throw error;
  }
};

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

export const getSortedEquipmentForLending = async (): Promise<Equipment[]> => {
  try {
    const snapshot = await getDocs(equipmentCollectionRef);
    const equipment = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Equipment[];
    
    const lendingEquipment = equipment.filter(
      item => item.type === "Chromebook" || item.type === "iPad"
    );
    
    return lendingEquipment.sort((a, b) => {
      if (a.type === "Chromebook" && b.type === "iPad") return -1;
      if (a.type === "iPad" && b.type === "Chromebook") return 1;
      
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("Error getting sorted equipment:", error);
    throw error;
  }
};

export const deleteMultipleEquipment = async (ids: string[]) => {
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      const docRef = doc(db, "equipment", id);
      batch.delete(docRef);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error deleting multiple equipment:", error);
    throw error;
  }
};

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

export const deleteEquipment = async (id: string) => {
  try {
    await deleteDoc(doc(db, "equipment", id));
    return true;
  } catch (error) {
    console.error("Error deleting equipment:", error);
    throw error;
  }
};

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