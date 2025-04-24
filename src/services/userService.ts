
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  query, 
  where,
  arrayUnion,
  arrayRemove,
  getDoc
} from "firebase/firestore";

export type UserRole = "user" | "admin" | "superadmin";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  blocked?: boolean;
  lastActive: string;
  department?: string;
  pendingRoleChange?: {
    from: UserRole;
    to: UserRole;
    requestedBy: string;
    approvals: string[];
    createdAt?: string;
  };
}


const usersCollectionRef = collection(db, "users");

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const snapshot = await getDocs(usersCollectionRef);
    return snapshot.docs.map(doc => {
      const data = doc.data();

      const lastActive = data.lastActive ? data.lastActive.toDate().toISOString() : null;
      return {
        ...data,
        lastActive 
      } as User;
    });
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
};

export const toggleBlockUser = async (uid: string, blocked: boolean): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { blocked });
    return true;
  } catch (error) {
    console.error("Error toggling user block status:", error);
    throw error;
  }
};

export const changeUserRole = async (uid: string, role: UserRole): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { 
      role,
      pendingRoleChange: null
    });
    return true;
  } catch (error) {
    console.error("Error changing user role:", error);
    throw error;
  }
};

export const requestRoleChange = async (
  uid: string, 
  fromRole: UserRole, 
  toRole: UserRole, 
  requestedBy: string
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { 
      pendingRoleChange: {
        from: fromRole,
        to: toRole,
        requestedBy,
        approvals: [requestedBy]
      }
    });
    return true;
  } catch (error) {
    console.error("Error requesting role change:", error);
    throw error;
  }
};

export const approveRoleChange = async (
  uid: string, 
  adminUid: string
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userDoc.data() as User;
    
    if (!userData.pendingRoleChange) {
      throw new Error("No pending role change");
    }
    
    await updateDoc(userRef, {
      "pendingRoleChange.approvals": arrayUnion(adminUid)
    });

    const updatedDoc = await getDoc(userRef);
    const updatedData = updatedDoc.data() as User;
    
    if (updatedData.pendingRoleChange?.approvals.length >= 2) {
      await updateDoc(userRef, {
        role: updatedData.pendingRoleChange.to,
        pendingRoleChange: null
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error approving role change:", error);
    throw error;
  }
};

export const cancelRoleChange = async (uid: string): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { 
      pendingRoleChange: null
    });
    return true;
  } catch (error) {
    console.error("Error cancelling role change:", error);
    throw error;
  }
};

export const getUserById = async (uid: string): Promise<User | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return userDoc.data() as User;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};
export const getUserRequests = async (userId: string): Promise<any[]> => {
  try {
    const collections = ["reservations", "purchases", "supports"];
    const requests = [];
    
    for (const col of collections) {
      const q = query(
        collection(db, col),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      requests.push(...querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    }
    
    return requests;
  } catch (error) {
    console.error("Error fetching user requests:", error);
    throw error;
  }
};
export const getAdminEmails = async (): Promise<string[]> => {
  try {
    const users = await getAllUsers();

    const filtered = users.filter(user => 
      (user.role === 'admin' || user.role === 'superadmin') && 
      !user.blocked &&
      user.email
    );
    
    return filtered.map(user => user.email).filter(Boolean);
  } catch (error) {
    console.error("[Admins] Erro crítico:", error);
    return [];
  }
};