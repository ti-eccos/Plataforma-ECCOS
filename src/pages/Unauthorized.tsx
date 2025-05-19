import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Fundos decorativos */}
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

      {/* Partículas animadas */}
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

      {/* Conteúdo principal centralizado */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4"
      >
        <div className="w-full max-w-md mx-auto text-center space-y-8">
          {/* Ícone de acesso negado */}
          <div className="bg-gray-100 p-6 rounded-full w-fit mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-sidebar"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              <line x1="12" y1="15" x2="12" y2="15"></line>
            </svg>
          </div>

          {/* Título */}
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
            Acesso Não Autorizado
          </h1>

          {/* Descrição */}
          <p className="text-gray-700 text-lg max-w-lg mx-auto">
            Você não tem permissão para acessar esta página. Se acredita que isso é um erro, entre em contato com o administrador do sistema.
          </p>

          {/* Botão de voltar */}
          <Button
            asChild
            className="bg-gradient-to-r from-sidebar to-eccos-purple hover:from-sidebar/90 hover:to-eccos-purple/90 text-white font-medium py-3 px-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg"
          >
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </div>
      </motion.section>
    </div>
  );
};

export default Unauthorized;