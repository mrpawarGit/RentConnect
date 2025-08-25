import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardRouter from "./pages/DashboardRouter";
import PrivateRoute from "./components/PrivateRoute";
import SubmitRequest from "./pages/SubmitRequest";
import MyRequests from "./pages/MyRequests";
import LandlordRequests from "./pages/LandlordRequests";
import Chat from "./pages/Chat";
import TenantPayments from "./pages/TenantPayments";
import LandlordPayments from "./pages/LandlordPayments";
import LandlordProperties from "./pages/LandlordProperties";
import Features from "./components/footer_pages/Features";
import About from "./components/footer_pages/About";
import Contact from "./components/footer_pages/Contact";

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

            {/*  */}
            <Route
              path="/properties/admin"
              element={
                <PrivateRoute>
                  <LandlordProperties />
                </PrivateRoute>
              }
            />
            {/* footer pages */}

            <Route path="/features" element={<Features />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/*  */}

            <Route
              path="/payments"
              element={
                <PrivateRoute>
                  <TenantPayments />
                </PrivateRoute>
              }
            />
            <Route
              path="/payments/admin"
              element={
                <PrivateRoute>
                  <LandlordPayments />
                </PrivateRoute>
              }
            />

            {/* ... */}
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <Chat />
                </PrivateRoute>
              }
            />

            {/*  */}
            <Route
              path="/requests/admin"
              element={
                <PrivateRoute>
                  <LandlordRequests />
                </PrivateRoute>
              }
            />

            {/*  */}
            <Route
              path="/requests/new"
              element={
                <PrivateRoute>
                  <SubmitRequest />
                </PrivateRoute>
              }
            />
            <Route
              path="/requests/mine"
              element={
                <PrivateRoute>
                  <MyRequests />
                </PrivateRoute>
              }
            />

            {/* Protected dashboard route */}
            <Route
              path="/dashboard/*"
              element={
                <PrivateRoute>
                  <DashboardRouter />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
