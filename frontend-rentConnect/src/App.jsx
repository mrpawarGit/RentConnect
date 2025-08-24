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
