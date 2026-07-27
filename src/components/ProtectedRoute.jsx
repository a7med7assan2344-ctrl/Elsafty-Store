import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function ProtectedRoute({ children }) {

  const { user, loading } = useContext(AuthContext);

  if (loading) {

    return <h2>جارى التحميل...</h2>;

  }

  if (!user) {

    return <Navigate to="/login" />;

  }

  return children;

}

export default ProtectedRoute;