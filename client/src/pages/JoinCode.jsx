import { Navigate, useParams } from "react-router-dom";

export default function JoinCode() {
  const { code = "" } = useParams();
  return <Navigate to={`/app/share?code=${encodeURIComponent(code.toUpperCase())}`} replace />;
}
