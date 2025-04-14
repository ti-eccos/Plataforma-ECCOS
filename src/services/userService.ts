
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
  lastActive: string; // Alterado para obrigatório
  department?: string;
  pendingRoleChange?: {
    from: UserRole;
    to: UserRole;
    requestedBy: string;
    approvals: string[];
    createdAt?: string;
  };
}

// Collection reference
const usersCollectionRef = collection(db, "users");

// Alteração na função getAllUsers para converter o Timestamp
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const snapshot = await getDocs(usersCollectionRef);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Convertendo o Timestamp para ISO string
      const lastActive = data.lastActive ? data.lastActive.toDate().toISOString() : null;
      return {
        ...data,
        lastActive // Atribuindo a versão convertida
      } as User;
    });
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
};

// Block/unblock user
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

// Change user role (direct change - for superadmin)
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

// Request role change (for admin to admin)
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

// Approve role change request
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
    
    // Add approval
    await updateDoc(userRef, {
      "pendingRoleChange.approvals": arrayUnion(adminUid)
    });
    
    // Check if we have enough approvals
    const updatedDoc = await getDoc(userRef);
    const updatedData = updatedDoc.data() as User;
    
    if (updatedData.pendingRoleChange?.approvals.length >= 2) {
      // Apply the role change
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

// Cancel role change request
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

// Get user by ID
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
