import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User as FirebaseUser,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Permissions {
  [key: string]: boolean;
}

export interface Role {
  name: string;
  description: string;
  permissions: Permissions;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: string;
  blocked?: boolean;
  lastActive?: Date;
  createdAt?: Date;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  userPermissions: Permissions;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isSuperAdmin: boolean;
  updateUserData: (updates: Partial<AuthUser>) => void;
  hasDashboardPermission: boolean;
  refreshUser: () => Promise<void>;
  reloadPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permissions>({});
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const isSuperAdmin = currentUser?.email === "suporte@colegioeccos.com.br";
  const hasDashboardPermission = isSuperAdmin || userPermissions.dashboard;

  const updateUserData = useCallback((updates: Partial<AuthUser>) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const loadUserPermissions = useCallback(async (roleName: string) => {
    try {
      if (roleName === "superadmin") {
        setUserPermissions({ all: true });
        return;
      }

      const roleRef = doc(db, "roles", roleName);
      const roleSnap = await getDoc(roleRef);
      
      if (roleSnap.exists()) {
        const roleData = roleSnap.data() as Role;
        setUserPermissions(roleData.permissions || {});
      } else {
        setUserPermissions({});
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
      setUserPermissions({});
    }
  }, []);

  const reloadPermissions = useCallback(async () => {
    if (currentUser?.role) {
      await loadUserPermissions(currentUser.role);
    }
  }, [currentUser?.role, loadUserPermissions]);

  const refreshUser = useCallback(async () => {
    if (!auth.currentUser?.uid) {
      setCurrentUser(null);
      setUserPermissions({});
      return;
    }

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data() as AuthUser;
        setCurrentUser(userData);
        await loadUserPermissions(userData.role);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar dados do usuário",
        variant: "destructive",
      });
    }
  }, [loadUserPermissions, toast]);

  const handleUserDocument = useCallback(
    async (firebaseUser: FirebaseUser) => {
      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userRef);

        let userData: Partial<AuthUser>;

        if (docSnap.exists()) {
          userData = docSnap.data() as AuthUser;

          if (firebaseUser.email === "suporte@colegioeccos.com.br") {
            userData.role = "superadmin";
          }

          if (userData.blocked) {
            await firebaseSignOut(auth);
            toast({
              title: "Acesso bloqueado",
              description: "Sua conta foi bloqueada.",
              variant: "destructive",
            });
            return null;
          }

          await updateDoc(userRef, {
            lastActive: new Date(),
            role: userData.role,
          });
        } else {
          const role =
            firebaseUser.email === "suporte@colegioeccos.com.br"
              ? "superadmin"
              : "user";

          userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "Usuário sem nome",
            photoURL: firebaseUser.photoURL,
            role,
            blocked: false,
            lastActive: new Date(),
            createdAt: new Date(),
          };

          await setDoc(userRef, userData);
        }

        return {
          ...userData,
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
        } as AuthUser;
      } catch (error) {
        console.error("Error handling user document:", error);
        toast({
          title: "Erro de acesso",
          description: "Falha ao carregar seus dados.",
          variant: "destructive",
        });
        return null;
      }
    },
    [toast]
  );

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      setLoading(true);

      try {
        if (firebaseUser) {
          if (!firebaseUser.email?.endsWith("@colegioeccos.com.br")) {
            await firebaseSignOut(auth);
            toast({
              title: "Acesso negado",
              description: "Domínio inválido.",
              variant: "destructive",
            });
            return;
          }

          const authUser = await handleUserDocument(firebaseUser);
          if (authUser && isMounted) {
            setCurrentUser(authUser);
            await loadUserPermissions(authUser.role);
          }
        } else {
          setCurrentUser(null);
          setUserPermissions({});
        }
      } catch (error) {
        console.error("Auth state error:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [handleUserDocument, loadUserPermissions, toast]);

  useEffect(() => {
    const handleUserRoleChanged = async () => {
      await refreshUser();
      await reloadPermissions();
    };

    window.addEventListener("userRoleChanged", handleUserRoleChanged);
    return () => {
      window.removeEventListener("userRoleChanged", handleUserRoleChanged);
    };
  }, [refreshUser, reloadPermissions]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!result.user.email?.endsWith("@colegioeccos.com.br")) {
        await firebaseSignOut(auth);
        toast({
          title: "Domínio inválido",
          description: "Email não permitido.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Falha no login",
        variant: "destructive",
      });
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setUserPermissions({});
    toast({ title: "Logout realizado" });
  }, [toast]);

  const authContextValue = {
    currentUser,
    userPermissions,
    loading,
    signInWithGoogle,
    signOut,
    isSuperAdmin,
    updateUserData,
    hasDashboardPermission,
    refreshUser,
    reloadPermissions,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}