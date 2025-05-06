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

export type UserRole = "user" | "admin" | "superadmin" | "financeiro" | "operacional";

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

  const handleUserDocument = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(userRef);
      
      let userData: Partial<AuthUser>;

      if (docSnap.exists()) {
        userData = docSnap.data() as AuthUser;
        
        if (userData.blocked) {
          await firebaseSignOut(auth);
          toast({
            title: "Acesso bloqueado",
            description: "Sua conta foi bloqueada. Entre em contato com um administrador.",
            variant: "destructive"
          });
          return null;
        }

        // Atualiza último acesso
        await setDoc(userRef, {
          lastActive: new Date()
        }, { merge: true });

      } else {
        // Cria novo documento apenas para emails válidos
        if (!firebaseUser.email?.endsWith("@colegioeccos.com.br")) return null;

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

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "Usuário sem nome",
        photoURL: firebaseUser.photoURL,
        role: userData.role || "user",
        ...userData
      } as AuthUser;

    } catch (error) {
      console.error("Error handling user document:", error);
      toast({
        title: "Erro de acesso",
        description: "Ocorreu um erro ao carregar seus dados de usuário.",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      setLoading(true);
      
      try {
        if (firebaseUser) {
          // Verifica domínio do email
          if (!firebaseUser.email?.endsWith("@colegioeccos.com.br")) {
            await firebaseSignOut(auth);
            toast({
              title: "Acesso negado",
              description: "Apenas emails do domínio @colegioeccos.com.br são permitidos.",
              variant: "destructive"
            });
            return;
          }

          const authUser = await handleUserDocument(firebaseUser);
          if (authUser) setCurrentUser(authUser);
          
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Auth state error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [handleUserDocument, toast]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      
      // Verificação adicional de domínio
      if (!result.user.email?.endsWith("@colegioeccos.com.br")) {
        await firebaseSignOut(auth);
        toast({
          title: "Domínio não permitido",
          description: "Apenas emails @colegioeccos.com.br são aceitos",
          variant: "destructive"
        });
      }
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
      setCurrentUser(null);
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
      {!loading && children}
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