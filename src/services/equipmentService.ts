
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from "firebase/firestore";

export type EquipmentType = "Chromebook" | "iPad";

export interface Equipment {
  id?: string;
  name: string;
  type: EquipmentType;
  status?: "disponível" | "em uso" | "em manutenção";
  location?: string;
  serialNumber?: string;
}

// Collection reference
const equipmentCollectionRef = collection(db, "equipment");

// Add new equipment
export const addEquipment = async (equipment: Pick<Equipment, "name" | "type">) => {
  try {
    const docRef = await addDoc(equipmentCollectionRef, {
      ...equipment,
      status: "disponível", // Default status
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
