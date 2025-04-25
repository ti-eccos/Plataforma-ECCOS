import { useEffect } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";

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

  return <Outlet />;
};

export default AppWrapper;
