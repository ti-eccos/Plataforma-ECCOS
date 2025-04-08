
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
      <div className="space-y-6">
        <div className="bg-red-500/20 rounded-full p-6 w-fit mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          >
            <path d="M12 9v4" />
            <path d="M12 16h.01" />
            <path d="M14.5 4h-5l-.5 6h6l-.5-6z" />
            <path d="M18 18a3 3 0 1 1-6 0v-7" />
            <path d="M6 18a3 3 0 0 0 6 0v-7" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-gradient">Acesso Restrito</h1>
        <p className="mx-auto max-w-md text-muted-foreground md:text-xl/relaxed">
          Você não tem permissão para acessar esta página. Se acredita que isso é um erro, entre em contato com o administrador do sistema.
        </p>
        <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
          <Button asChild>
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
