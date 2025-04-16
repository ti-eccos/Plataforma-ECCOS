import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type UserRole = "user" | "admin" | "superadmin";

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  blocked?: boolean;
  lastActive?: Date;
  createdAt?: Date;
  department?: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const isSuperAdmin = currentUser?.email === "suporte@colegioeccos.com.br";
  const isAdmin = currentUser?.role === "admin" || isSuperAdmin;

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!isMounted) return;

      if (firebaseUser) {
        if (!firebaseUser.email?.endsWith("@colegioeccos.com.br")) {
          await firebaseSignOut(auth);
          if (isMounted) {
            toast({
              title: "Acesso negado",
              description: "Apenas emails do domínio @colegioeccos.com.br são permitidos.",
              variant: "destructive"
            });
            setCurrentUser(null);
            setLoading(false);
          }
          return;
        }

        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(userRef);
          
          let userData: Partial<AuthUser>;
          
          if (docSnap.exists()) {
            userData = docSnap.data() as AuthUser;
            
            if (userData.blocked) {
              await firebaseSignOut(auth);
              if (isMounted) {
                toast({
                  title: "Acesso bloqueado",
                  description: "Sua conta foi bloqueada. Entre em contato com um administrador.",
                  variant: "destructive"
                });
                setCurrentUser(null);
                setLoading(false);
              }
              return;
            }
            
            await setDoc(userRef, {
              ...userData,
              lastActive: new Date()
            }, { merge: true });
          } else {
            const role: UserRole = firebaseUser.email === "suporte@colegioeccos.com.br" 
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
              department: "Não definido"
            };
            
            await setDoc(userRef, userData);
          }
          
          if (isMounted) {
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "Usuário sem nome",
              photoURL: firebaseUser.photoURL,
              role: userData.role || "user",
              ...userData
            });
          }
        } catch (error) {
          console.error("Error handling auth state:", error);
          if (isMounted) {
            toast({
              title: "Erro",
              description: "Ocorreu um erro ao carregar seus dados.",
              variant: "destructive"
            });
          }
        }
      } else if (isMounted) {
        setCurrentUser(null);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Erro no login",
        description: error.message || "Falha ao realizar login",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Logout realizado",
        description: "Até breve!",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Erro no logout",
        description: error.message || "Falha ao sair da conta",
        variant: "destructive"
      });
    }
  }, [toast]);

  const authContextValue = useMemo(() => ({
    currentUser,
    user: currentUser,
    loading,
    signInWithGoogle,
    signOut,
    isAdmin,
    isSuperAdmin
  }), [currentUser, loading, signInWithGoogle, signOut, isAdmin, isSuperAdmin]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}