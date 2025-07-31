import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: { [key: string]: boolean };
}

export async function getAllRoles(): Promise<Role[]> {
  try {
    const snapshot = await getDocs(collection(db, "roles"));
    return snapshot.docs.map(doc => doc.data() as Role);
  } catch (error) {
    console.error("Erro ao buscar roles:", error);
    return [];
  }
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  blocked: boolean;
  createdAt?: Date;
  lastActive?: Date;
  photoURL?: string;
}

export async function getAllUsers(): Promise<User[]> {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      blocked: data.blocked ?? false,
      createdAt: data.createdAt?.toDate(),
      lastActive: data.lastActive?.toDate(),
      photoURL: data.photoURL ?? null,
    };
  });
}

export async function updateUserRole(uid: string, newRole: string) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { role: newRole });
}

export async function blockUser(uid: string, blocked: boolean) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { blocked });
}

export async function createUserIfNotExists(user: User) {
  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);
  if (!docSnap.exists()) {
    await setDoc(userRef, user);
  }
}
