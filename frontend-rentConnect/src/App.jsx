import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TenantDashboard from "./pages/TenantDashboard";
import LandlordDashboard from "./pages/LandlordDashboard";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-custom text-custom pt-16">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/tenant-dashboard" element={<TenantDashboard />} />
            <Route path="/landlord-dashboard" element={<LandlordDashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
