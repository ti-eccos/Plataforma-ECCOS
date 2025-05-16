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

  const featureVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: custom => ({
      opacity: 1,
      y: 0,
      transition: { 
        delay: custom * 0.2,
        duration: 0.6
      }
    })
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

  const features = [
    {
      icon: (
        <svg className="h-8 w-8 text-eccos-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: "Gestão de Solicitações",
      description: "Criação e acompanhamento de solicitações de compras, reservas e suporte técnico"
    },
    {
      icon: (
        <svg className="h-8 w-8 text-sidebar" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: "Controle de Equipamentos",
      description: "Cadastro e monitoramento de equipamentos com status de disponibilidade"
    },
    {
      icon: (
        <svg className="h-8 w-8 text-eccos-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Processos de Compras",
      description: "Fluxo completo para requisições de aquisições e gestão financeira"
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sidebar blur-3xl" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-eccos-purple blur-3xl" 
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{ 
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
              opacity: [0, 0.3, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 15 + Math.random() * 10,
              ease: "easeInOut",
              delay: i * 1.5
            }}
            className={`absolute h-${Math.floor(Math.random() * 6) + 4} w-${Math.floor(Math.random() * 6) + 4} rounded-full bg-${
              i % 2 === 0 ? 'sidebar' : 'eccos-purple'
            } blur-lg`}
          />
        ))}
      </div>
      
      {/* Header Section */}
      <header className="relative z-10 pt-6 px-4 md:px-16 flex justify-between items-center">
        <div className="flex items-center">
          <img 
            src={logo} 
            alt="ECCOS Logo" 
            className="h-16 w-auto"
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Button 
            className="bg-gradient-to-r from-sidebar to-eccos-purple hover:from-sidebar/90 hover:to-eccos-purple/90 text-white font-medium rounded-xl shadow-md transition-all duration-300 hover:shadow-lg"
            onClick={signInWithGoogle}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
            Entrar
          </Button>
        </motion.div>
      </header>

      {/* Hero Section */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col md:flex-row items-center justify-between px-4 md:px-16 pt-12 md:pt-20 pb-16"
      >
        <div className="w-full md:w-1/2 mb-12 md:mb-0">
          <motion.h1 
            variants={itemVariants}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent"
          >
            Plataforma de Gestão ECCOS
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-gray-700 mb-8 max-w-lg"
          >
            Sistema integrado para gestão de processos internos, solicitações e controle de equipamentos
          </motion.p>
          
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4"
          >
            <Button 
              className="w-full sm:w-auto bg-gradient-to-r from-sidebar to-eccos-purple hover:from-sidebar/90 hover:to-eccos-purple/90 text-white font-medium py-6 px-8 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg"
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
        </div>
        
        <div className="w-full md:w-1/2 flex justify-center" ref={cardRef}>
          <motion.div
            variants={itemVariants}
            className="relative"
          >
            <div 
              className="absolute -inset-2 bg-gradient-to-r from-eccos-blue via-eccos-purple to-eccos-blue rounded-3xl opacity-70 blur-lg"
              style={{
                background: `radial-gradient(circle at ${shineStyle.x} ${shineStyle.y}, rgba(139, 92, 246, 0.8), rgba(0, 116, 224, 0.5), transparent 70%)`,
                transition: "background 0.1s ease"
              }}
            />
            <motion.div
              whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
            >
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="relative z-10 bg-gray-50 py-20 px-4 md:px-16">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Funcionalidades Principais</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Ferramentas especializadas para gestão eficiente de processos
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={featureVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="bg-gray-50 p-3 rounded-lg inline-block mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="relative z-10 py-20 px-4 md:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Fluxo de Trabalho</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Processo simplificado para gestão de solicitações
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="bg-eccos-purple/10 w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-eccos-purple font-bold text-2xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Registro</h3>
              <p className="text-gray-600">Criação da solicitação pelo usuário</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-eccos-purple/10 w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-eccos-purple font-bold text-2xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Análise</h3>
              <p className="text-gray-600">Validação pela equipe responsável</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-eccos-purple/10 w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-eccos-purple font-bold text-2xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Execução</h3>
              <p className="text-gray-600">Implementação prática do processo</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-eccos-purple/10 w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-eccos-purple font-bold text-2xl">4</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Conclusão</h3>
              <p className="text-gray-600">Finalização e documentação</p>
            </div>
          </div>
        </div>
      </section>

       {/* Footer */}
      <footer className="relative z-10 bg-gray-50 py-10 px-4 md:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            {/* Logo e Sistema */}
            <div className="flex flex-col items-center mb-4">
              <img 
                src={logo} 
                alt="ECCOS Logo" 
                className="h-16 w-auto mb-4"
              />
              <p className="text-gray-600 text-sm font-medium">
                Sistema interno de gestão operacional
              </p>
            </div>

            {/* Copyright */}
            <div className="flex flex-col items-center">
              <p className="text-gray-500 text-sm mb-2">
                © 2025 Colégio ECCOS - Todos os direitos reservados
              </p>
              <div className="flex justify-center space-x-4">
                <a href="#" className="text-sidebar hover:text-eccos-purple transition-colors">
                  <span className="text-sm">Suporte Técnico</span>
                </a>
                <a href="#" className="text-sidebar hover:text-eccos-purple transition-colors">
                  <span className="text-sm">Políticas de Uso</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;