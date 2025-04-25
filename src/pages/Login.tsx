import React, { useEffect, useState, useRef } from 'react';
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
import logo from '@/images/Logo-eccos.jpg';

const Login = () => {
  const { signInWithGoogle, currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const cardRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  useEffect(() => {
    const handlePostLogin = async () => {
      if (!currentUser || isRedirecting) return;

      setIsRedirecting(true);
      try {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          lastActive: serverTimestamp()
        });

        const redirectPath = sessionStorage.getItem("redirectPath") || 
                           location.state?.from?.pathname || 
                           "/";
        sessionStorage.removeItem("redirectPath");

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

  if (loading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 border-4 border-t-sidebar border-r-eccos-purple border-b-eccos-purple border-l-sidebar rounded-full animate-spin" />
          <p className="mt-4 text-sidebar font-medium">Carregando...</p>
        </motion.div>
      </div>
    );
  }

  if (currentUser) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const calculateShineEffect = () => {
    if (!cardRef.current) return { x: "50%", y: "50%" };
    
    const card = cardRef.current.getBoundingClientRect();
    const cardCenterX = card.left + card.width / 2;
    const cardCenterY = card.top + card.height / 2;
    
    const moveX = ((mousePosition.x - cardCenterX) / (card.width / 2)) * 100;
    const moveY = ((mousePosition.y - cardCenterY) / (card.height / 2)) * 100;
    
    return {
      x: `${50 + moveX * 0.1}%`,
      y: `${50 + moveY * 0.1}%`
    };
  };

  const shineStyle = calculateShineEffect();

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4 md:p-0 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-sidebar blur-[100px]" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-eccos-purple blur-[100px]" 
        />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{ 
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
              opacity: [0, 0.4, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 15 + Math.random() * 10,
              ease: "easeInOut",
              delay: i * 2
            }}
            className={`absolute h-${Math.floor(Math.random() * 16) + 8} w-${Math.floor(Math.random() * 16) + 8} rounded-full bg-${
              i % 2 === 0 ? 'sidebar' : 'eccos-purple'
            } blur-xl`}
          />
        ))}
      </div>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md z-10"
      >
        <div className="relative" ref={cardRef}>
          <div 
            className="absolute -inset-1 bg-gradient-to-r from-eccos-blue via-eccos-purple to-eccos-blue rounded-2xl opacity-70 blur-lg"
            style={{
              background: `radial-gradient(circle at ${shineStyle.x} ${shineStyle.y}, rgba(139, 92, 246, 0.8), rgba(0, 116, 224, 0.5), transparent 70%)`,
              transition: "background 0.1s ease"
            }}
          />
          
          <Card className="overflow-hidden shadow-lg border-0 bg-white backdrop-blur-lg relative z-10">
            <CardHeader className="space-y-1 text-center pb-4">
              <motion.div 
                variants={itemVariants}
                className="mb-2 flex justify-center"
              >
                <img 
                  src={logo} 
                  alt="ECCOS Logo" 
                  className="h-40 w-auto mb-4"
                />
              </motion.div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <motion.div
                variants={itemVariants}
                className="text-center text-gray-600 mb-6"
              >
                <p>Para acessar a plataforma, faça login com sua conta institucional do Google.</p>
                <p className="text-sm font-medium text-sidebar mt-2">@colegioeccos.com.br</p>
              </motion.div>
            </CardContent>
            
            <CardFooter className="pb-6">
              <motion.div
                variants={itemVariants}
                className="w-full"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  className="w-full bg-gradient-to-r from-sidebar to-eccos-purple hover:from-sidebar/90 hover:to-eccos-purple/90 text-white font-medium py-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg"
                  size="lg"
                  onClick={signInWithGoogle}
                  disabled={loading}
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#FFFFFF"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#FFFFFF"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FFFFFF"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#FFFFFF"
                    />
                  </svg>
                  Entrar com Google
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
        </div>

        <motion.div
          variants={itemVariants}
          className="mt-10 text-center text-gray-500 text-sm"
        >
          © {new Date().getFullYear()} Colégio ECCOS - Todos os direitos reservados
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;