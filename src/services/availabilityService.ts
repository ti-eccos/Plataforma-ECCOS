import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  Timestamp 
} from "firebase/firestore";

const COLLECTION_NAME = "availability";

export interface AvailabilityDate {
  id: string;
  date: Date;
}

export const getAvailableDates = async (): Promise<Date[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        const firestoreDate = data.date instanceof Timestamp 
          ? data.date.toDate() 
          : new Date(data.date);
        return new Date(firestoreDate.setHours(0, 0, 0, 0));
      })
      .filter((date): date is Date => !isNaN(date.getTime()));
  } catch (error) {
    throw new Error("Erro ao buscar datas disponíveis");
  }
};

export const addAvailableDates = async (dates: Date[]): Promise<void> => {
  try {
    await Promise.all(dates.map(async (date) => {
      const normalizedDate = new Date(date.setHours(0, 0, 0, 0));
      const dateId = formatDateToYYYYMMDD(normalizedDate);
      
      await setDoc(doc(db, COLLECTION_NAME, dateId), {
        id: dateId,
        date: Timestamp.fromDate(normalizedDate)
      });
    }));
  } catch (error) {
    throw new Error("Erro ao adicionar datas");
  }
};

export const removeAvailableDates = async (dates: Date[]): Promise<void> => {
  try {
    await Promise.all(dates.map(async (date) => {
      const normalizedDate = new Date(date.setHours(0, 0, 0, 0));
      const dateId = formatDateToYYYYMMDD(normalizedDate);
      
      await deleteDoc(doc(db, COLLECTION_NAME, dateId));
    }));
  } catch (error) {
    throw new Error("Erro ao remover datas");
  }
};

export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isDateInPast = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};