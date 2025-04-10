
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, Timestamp } from "firebase/firestore";

const COLLECTION_NAME = "availability";

// Format for storing dates in Firestore
export interface AvailabilityDate {
  id: string; // Date in YYYY-MM-DD format
  date: Timestamp;
}

// Get all available dates
export const getAvailableDates = async (): Promise<Date[]> => {
  try {
    const datesSnapshot = await getDocs(collection(db, COLLECTION_NAME));
    // Convert Firestore timestamps to Date objects and ensure they're valid
    return datesSnapshot.docs
      .map(doc => {
        const data = doc.data();
        // Handle case where date might be a Timestamp or might already be a Date
        if (data.date instanceof Timestamp) {
          return data.date.toDate();
        } else if (data.date instanceof Date) {
          return data.date;
        }
        return null;
      })
      .filter((date): date is Date => date !== null && !isNaN(date.getTime()));
  } catch (error) {
    console.error("Error fetching availability dates:", error);
    throw error;
  }
};

// Add multiple dates as available
export const addAvailableDates = async (dates: Date[]): Promise<void> => {
  try {
    // Filter out invalid dates
    const validDates = dates.filter(date => date instanceof Date && !isNaN(date.getTime()));
    
    const batch = validDates.map(async (date) => {
      // Create a date string in YYYY-MM-DD format for the document ID
      const dateStr = formatDateToYYYYMMDD(date);
      const dateDoc = doc(db, COLLECTION_NAME, dateStr);
      await setDoc(dateDoc, { 
        id: dateStr,
        date: Timestamp.fromDate(date)
      });
    });
    
    await Promise.all(batch);
  } catch (error) {
    console.error("Error adding available dates:", error);
    throw error;
  }
};

// Remove dates from available
export const removeAvailableDates = async (dates: Date[]): Promise<void> => {
  try {
    // Filter out invalid dates
    const validDates = dates.filter(date => date instanceof Date && !isNaN(date.getTime()));
    
    const batch = validDates.map(async (date) => {
      const dateStr = formatDateToYYYYMMDD(date);
      const dateDoc = doc(db, COLLECTION_NAME, dateStr);
      await deleteDoc(dateDoc);
    });
    
    await Promise.all(batch);
  } catch (error) {
    console.error("Error removing available dates:", error);
    throw error;
  }
};

// Helper function to format date to YYYY-MM-DD
export const formatDateToYYYYMMDD = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to formatDateToYYYYMMDD');
  }
  return date.toISOString().split('T')[0];
};

// Check if a date is in the past or today
export const isDateInPastOrToday = (date: Date): boolean => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return true; // Consider invalid dates as in the past
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Create a new date to avoid modifying the original
  const compareDateCopy = new Date(date);
  compareDateCopy.setHours(0, 0, 0, 0);
  
  return compareDateCopy <= today;
};
