import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc,
  Timestamp
} from "firebase/firestore";
import { RequestStatus, RequestData } from "./types";

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
      hidden: false,
      unreadMessages: 0,
      hasUnreadMessages: false
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