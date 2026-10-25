import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand">SemesterSync</Link>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </nav>
    </header>
  );
}
