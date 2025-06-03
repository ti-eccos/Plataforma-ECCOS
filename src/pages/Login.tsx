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
import logo from '@/images/Logo-eccos.png';

const Login = () => {
  const { signInWithGoogle, currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
  const handlePostLogin = async () => {
    if (!currentUser || isRedirecting) return;
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        lastActive: serverTimestamp()
      });

      // Obter o caminho base correto para o ambiente atual
      const base = import.meta.env.BASE_URL;
      let redirectPath = sessionStorage.getItem("redirectPath") || 
                       location.state?.from?.pathname || 
                       "/";
      
      // Remover o base path se estiver presente
      if (base && redirectPath.startsWith(base)) {
        redirectPath = redirectPath.slice(base.length);
      }
      
      // Garantir que comece com /
      redirectPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
      
      sessionStorage.removeItem("redirectPath");
      navigate(redirectPath, { replace: true });

      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${currentUser.displayName || 'usuário'}!`,
      });
    } catch (error) {
      console.error("Erro no redirecionamento:", error);
      // Adicionar delay para garantir que o toast apareça acima de tudo
      setTimeout(() => {
        toast({
          title: "Erro",
          description: "Ocorreu um problema durante o login",
          variant: "destructive"
        });
      }, 100);
      navigate("/", { replace: true });
    } finally {
      setIsRedirecting(false);
    }
  };

  if (currentUser) handlePostLogin();
}, [currentUser, navigate, toast, location, isRedirecting]);

  // Calcula posição do efeito de brilho
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

  // Features da página inicial
  const features = [
  {
    icon: (
      <svg className="h-8 w-8 text-sidebar" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Reservas de Equipamentos",
    description: "Registro e acompanhamento de reservas de equipamentos de tecnologia com calendário integrado"
  },
  {
  icon: (
    <svg className="h-8 w-8 text-eccos-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  ),
  title: "Solicitações de Manutenção",
  description: "Registro e acompanhamento de solicitações de manutenção corretiva e preventiva"
},
  {
    icon: (
      <svg className="h-8 w-8 text-sidebar" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: "Gestão de Processos de Compra",
    description: "Fluxo completo para requisições de aquisições e gestão financeira"
  }
];

  const handleLogin = async () => {
    try {
      await signInWithGoogle(); // Firebase gerencia popup sozinho
    } catch (error: any) {
      console.error("Login error:", error);

      // Garantir que o toast seja exibido com delay para aparecer acima de tudo
      setTimeout(() => {
        if (error.code === 'auth/popup-blocked') {
          toast({
            title: "Popup bloqueado",
            description: "Por favor permita popups para este site nas configurações do navegador.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro no login",
            description: error.message || "Falha ao realizar login",
            variant: "destructive"
          });
        }
      }, 100);
    }
  };

  // Se estiver carregando, mostra loader visual
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white relative z-50">
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

  // Não renderiza nada se já está logado
  if (currentUser) return null;

  // Animações Framer Motion
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
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.2,
        duration: 0.6
      }
    })
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Estilos adicionais */}
      <style>{`
        .google-auth-popup {
          animation: popupScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes popupScale {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        /* Garantir que botões sejam clicáveis em todas as telas */
        .clickable-button {
          position: relative;
          z-index: 999 !important;
          pointer-events: auto !important;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Área de toque mínima para mobile */
        .touch-target {
          min-height: 48px;
          min-width: 48px;
          position: relative;
          z-index: 999;
        }
        
        /* Elementos de fundo com z-index baixo */
        .background-element {
          position: absolute;
          z-index: 1 !important;
          pointer-events: none !important;
        }
        
        /* Container principal com z-index médio */
        .content-layer {
          position: relative;
          z-index: 10;
        }
        
        /* Elementos interativos com z-index alto */
        .interactive-layer {
          position: relative;
          z-index: 100;
        }
        
        /* Toast/popup deve ficar acima de tudo */
        [data-sonner-toaster] {
          z-index: 9999 !important;
        }
        
        /* Garantir que todos os elementos do toast tenham z-index alto */
        [data-sonner-toast] {
          z-index: 9999 !important;
        }
        
        /* Para outros tipos de popup/modal */
        .toast-container,
        .modal-overlay,
        .popup-overlay,
        [role="dialog"],
        [role="alertdialog"] {
          z-index: 9999 !important;
        }
        
        @media (max-width: 768px) {
          .decorative-bg {
            opacity: 0.02 !important;
            z-index: 1 !important;
          }
          .floating-particles {
            display: none;
          }
          
          /* Garantir que botões funcionem em mobile */
          .clickable-button {
            min-height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
        
        /* Remover qualquer sobreposição em elementos de fundo */
        .decorative-bg, .floating-particles {
          pointer-events: none !important;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
      `}</style>

      {/* Fundos decorativos - com z-index baixo */}
      <div className="background-element absolute inset-0 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="decorative-bg absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sidebar blur-3xl" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="decorative-bg absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-eccos-purple blur-3xl" 
        />
      </div>

      {/* Partículas animadas - com z-index baixo */}
      <div className="floating-particles background-element absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              opacity: 0
            }}
            animate={{ 
              y: [
                Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800), 
                Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)
              ],
              opacity: [0, 0.2, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 20 + Math.random() * 10,
              ease: "easeInOut",
              delay: i * 2
            }}
            className={`absolute h-4 w-4 rounded-full bg-${
              i % 2 === 0 ? 'sidebar' : 'eccos-purple'
            } blur-lg`}
          />
        ))}
      </div>

      {/* Header */}
      <header className="interactive-layer pt-4 sm:pt-6 px-4 sm:px-8 md:px-16 flex justify-between items-center">
        <img src={logo} alt="ECCOS Logo" className="h-12 sm:h-16 w-auto" />
        <Button 
          onClick={handleLogin} 
          disabled={loading}
          className="clickable-button touch-target bg-gradient-to-r from-sidebar to-eccos-purple hover:from-sidebar/90 hover:to-eccos-purple/90 text-white font-medium px-4 sm:px-6 py-3 rounded-lg shadow-md transition-all duration-300"
        >
          Entrar
        </Button>
      </header>

      {/* Conteúdo Principal */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="content-layer flex flex-col items-center justify-center px-4 sm:px-8 md:px-16 pt-8 sm:pt-12 md:pt-20 pb-12 sm:pb-16"
      >
        <div className="w-full max-w-4xl text-center">
          <motion.h1 
            variants={itemVariants}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent"
          >
            Plataforma de Gestão ECCOS
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto px-2"
          >
            Sistema integrado para gestão de processos internos, solicitações e controle de equipamentos
          </motion.p>
          <motion.div 
            variants={itemVariants}
            className="flex justify-center interactive-layer"
          >
            <Button 
              className="clickable-button touch-target w-full sm:w-auto bg-gradient-to-r from-sidebar to-eccos-purple hover:from-sidebar/90 hover:to-eccos-purple/90 text-white font-medium py-4 sm:py-6 px-6 sm:px-8 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg text-base sm:text-lg max-w-xs sm:max-w-none"
              onClick={handleLogin}
              disabled={loading}
            >
              <svg className="mr-2 h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
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
              <span className="whitespace-nowrap">Entrar com Google</span>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Funcionalidades */}
      <section className="content-layer bg-gray-50 py-12 sm:py-16 md:py-20 px-4 sm:px-8 md:px-16">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-800">Funcionalidades Principais</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-2">
              Ferramentas especializadas para gestão eficiente de processos
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={featureVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="bg-white rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="bg-gray-50 p-3 rounded-lg inline-block mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="content-layer bg-gray-50 py-8 sm:py-10 px-4 sm:px-8 md:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <p className="text-gray-500 text-xs sm:text-sm">
              © 2025 Colégio ECCOS - Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;