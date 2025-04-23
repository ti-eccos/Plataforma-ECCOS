import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Login = () => {
  const { signInWithGoogle, currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Efeito para redirecionamento pós-login
  useEffect(() => {
    const handlePostLogin = async () => {
      if (!currentUser || isRedirecting) return;

      setIsRedirecting(true);
      try {
        // Atualizar última atividade
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          lastActive: serverTimestamp()
        });

        // Determinar destino
        const redirectPath = sessionStorage.getItem("redirectPath") || 
                           location.state?.from?.pathname || 
                           "/";
        sessionStorage.removeItem("redirectPath");

        // Navegar e mostrar feedback
        navigate(redirectPath, { replace: true });
        toast({
          title: "Login bem-sucedido",
          description: `Bem-vindo, ${currentUser.displayName || 'usuário'}!`,
        });
      } catch (error) {
        console.error("Erro no redirecionamento:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um problema durante o login",
          variant: "destructive"
        });
        navigate("/", { replace: true });
      } finally {
        setIsRedirecting(false);
      }
    };

    if (currentUser) handlePostLogin();
  }, [currentUser, navigate, toast, location, isRedirecting]);

  // Estados de carregamento
  if (loading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-blue"></div>
      </div>
    );
  }

  // Usuário já autenticado
  if (currentUser) return null;

  // Componente visual
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 md:p-0">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/3 top-1/4 h-[300px] w-[300px] rounded-full bg-eccos-blue opacity-20 blur-[100px]" />
        <div className="absolute right-1/3 bottom-1/4 h-[250px] w-[250px] rounded-full bg-eccos-green opacity-20 blur-[100px]" />
        <div className="absolute left-1/4 bottom-1/3 h-[350px] w-[350px] rounded-full bg-eccos-purple opacity-20 blur-[100px]" />
      </div>
      
      <Card className="w-full max-w-md glass-morphism">
        <CardHeader className="space-y-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <CardDescription className="text-2xl text-gradient">
              Colégio
            </CardDescription>  
            <CardTitle className="text-5xl text-gradient">ECCOS</CardTitle>
            <CardDescription className="text-muted-foreground text-base mt-1 text-2xl">
              Plataforma de Tecnologia
            </CardDescription>
          </motion.div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-center text-muted-foreground mb-6"
          >
            Para acessar a plataforma, faça login com sua conta institucional do Google (@colegioeccos.com.br).
          </motion.div>
        </CardContent>
        
        <CardFooter>
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <Button 
              className="w-full bg-gradient-to-r from-eccos-blue to-eccos-green hover:from-eccos-blue/90 hover:to-eccos-green/90 transition-all"
              size="lg"
              onClick={signInWithGoogle}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {loading ? 'Carregando...' : 'Entrar com Google'}
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;