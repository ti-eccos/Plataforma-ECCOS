
import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type UserRole = "user" | "admin" | "superadmin";

interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  blocked?: boolean;
}

interface AuthContextType {
  currentUser: AuthUser | null;
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user's email is from the allowed domain
        if (!user.email?.endsWith("@colegioeccos.com.br")) {
          await firebaseSignOut(auth);
          toast({
            title: "Acesso negado",
            description: "Apenas emails do domínio @colegioeccos.com.br são permitidos.",
            variant: "destructive"
          });
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        try {
          // Get or create user document in Firestore
          const userRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userRef);
          
          let userData: any;
          
          if (docSnap.exists()) {
            userData = docSnap.data();
            
            // Check if user is blocked
            if (userData.blocked) {
              await firebaseSignOut(auth);
              toast({
                title: "Acesso bloqueado",
                description: "Sua conta foi bloqueada. Entre em contato com um administrador.",
                variant: "destructive"
              });
              setCurrentUser(null);
              setLoading(false);
              return;
            }
            
            // Update last active
            await setDoc(userRef, {
              ...userData,
              lastActive: new Date().toISOString()
            }, { merge: true });
          } else {
            // Initialize new user
            let role: UserRole = "user";
            if (user.email === "suporte@colegioeccos.com.br") {
              role = "superadmin";
            }
            
            userData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || "",
              photoURL: user.photoURL,
              role: role,
              blocked: false,
              lastActive: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              department: "Não definido"
            };
            
            await setDoc(userRef, userData);
          }
          
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "",
            photoURL: user.photoURL,
            role: userData.role,
            blocked: userData.blocked
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao carregar seus dados.",
            variant: "destructive"
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo à Plataforma ECCOS.",
      });
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Ocorreu um erro durante o login.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({
        title: "Erro ao fazer logout",
        description: error.message || "Ocorreu um erro durante o logout.",
        variant: "destructive"
      });
    }
  };

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    signOut,
    isAdmin,
    isSuperAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
