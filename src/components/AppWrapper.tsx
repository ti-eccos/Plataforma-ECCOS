// src/components/AppWrapper.tsx
import { useEffect } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import SupportFab from "@/components/SupportFab"; // Adicione esta importação

const AppWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedPath = sessionStorage.getItem("redirectPath");
    if (savedPath && savedPath !== "/") {
      sessionStorage.removeItem("redirectPath");
      navigate(savedPath);
    }
  }, [navigate, location]);

  return (
    <>
      <Outlet />
      <SupportFab /> {/* Botão flutuante em todas as páginas */}
    </>
  );
};

export default AppWrapper;