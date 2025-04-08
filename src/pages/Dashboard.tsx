
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingCart, PlusCircle, Wrench, AreaChart, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { currentUser, isAdmin } = useAuth();

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      }
    })
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient mb-2">
            Bem-vindo, {currentUser?.displayName?.split(' ')[0]}
          </h2>
          <p className="text-muted-foreground">
            Acesse as principais funções da plataforma de forma rápida.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="hover:border-eccos-purple/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Nova Reserva</CardTitle>
                <PlusCircle className="h-5 w-5 text-eccos-purple" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">
                  Solicite a reserva de equipamentos ou espaços tecnológicos.
                </CardDescription>
                <Button asChild className="w-full bg-eccos-purple hover:bg-eccos-purple/80">
                  <Link to="/nova-solicitacao/reserva">Solicitar</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="hover:border-eccos-orange/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Nova Compra</CardTitle>
                <ShoppingCart className="h-5 w-5 text-eccos-orange" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">
                  Solicite a compra de novos equipamentos ou materiais.
                </CardDescription>
                <Button asChild className="w-full bg-eccos-orange hover:bg-eccos-orange/80">
                  <Link to="/nova-solicitacao/compra">Solicitar</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="hover:border-eccos-green/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Suporte Técnico</CardTitle>
                <Wrench className="h-5 w-5 text-eccos-green" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">
                  Solicite suporte técnico para resolver problemas.
                </CardDescription>
                <Button asChild className="w-full bg-eccos-green hover:bg-eccos-green/80">
                  <Link to="/nova-solicitacao/suporte">Solicitar</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {isAdmin && (
          <>
            <div className="flex justify-between items-center mt-10 mb-4">
              <h3 className="text-xl font-semibold">Painel Administrativo</h3>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Card className="hover:border-eccos-blue/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">Visão Geral</CardTitle>
                    <AreaChart className="h-5 w-5 text-eccos-blue" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Solicitações pendentes</span>
                        <span className="font-medium">8</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Equipamentos disponíveis</span>
                        <span className="font-medium">24</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Usuários ativos</span>
                        <span className="font-medium">42</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                custom={4}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Card className="hover:border-eccos-pink/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">Atividade Recente</CardTitle>
                    <BarChart3 className="h-5 w-5 text-eccos-pink" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Reservas hoje</span>
                        <span className="font-medium">3</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Suportes resolvidos</span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Compras aprovadas</span>
                        <span className="font-medium">5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
