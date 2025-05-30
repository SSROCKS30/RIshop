import "./App.css";
import { useContext } from 'react';
import Home from "./components/Home";
import Navbar from "./components/Navbar";
import AddProduct from "./components/AddProduct";
import Product from "./components/Product";
import UpdateProduct from "./components/UpdateProduct";
import Cart from "./components/Cart";
import ProgressBar from "./components/ProgressBar";
import LoadingOverlay from "./components/LoadingOverlay";
import PageTransition from "./components/PageTransition";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import ChatPage from "./components/Chat/ChatPage";
import AppContext from "./Context/Context";
import { ChatProvider } from "./Context/ChatContext";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ProfilePage from "./pages/ProfilePage";

const ProtectedRoute = () => {
  const { authToken, isAuthLoading } = useContext(AppContext);

  if (isAuthLoading) {
    return <LoadingOverlay />;
  }

  return authToken ? <Outlet /> : <Navigate to="/login" replace />;
};

const MainLayout = () => (
  <div className="app-container">
    <ProgressBar />
    <LoadingOverlay />
    <Navbar onSelectCategory={(category) => console.log(category)} />
    <main className="main-content">
      <AnimatePresence mode="wait">
        <Outlet />
      </AnimatePresence>
    </main>
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>RIshop</h3>
          <p>Your one-stop shop for amazing products</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/add_product">Add Product</a></li>
            <li><a href="/cart">Cart</a></li>
            <li><a href="/chat">Messages</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>Email: sahil.rit.cs@gmail.com</p>
          <p>Phone: +91 9125959307</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} RIshop. All rights reserved.</p>
      </div>
    </footer>
  </div>
);

function App() {
  const { authToken, isAuthLoading, logout } = useContext(AppContext);

  if (isAuthLoading) {
    return <LoadingOverlay />;
  }

  return (
    <BrowserRouter>
      <ChatProvider>
        <Routes>
          <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
          <Route path="/signup" element={<PageTransition><SignupPage /></PageTransition>} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />
              <Route path="/add_product" element={<PageTransition><AddProduct /></PageTransition>} />
              <Route path="/product/:id" element={<PageTransition><Product /></PageTransition>} />
              <Route path="/product/update/:id" element={<PageTransition><UpdateProduct /></PageTransition>} />
              <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
              <Route path="/chat" element={<PageTransition><ChatPage /></PageTransition>} />
              <Route path="/chat/:conversationId" element={<PageTransition><ChatPage /></PageTransition>} />
              <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
              <Route path="/category/:categoryName" element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="page-container"
                >
                  <h2>Category Products</h2>
                  <p>Products in this category will appear here</p>
                </motion.div>
              } />
            </Route>
          </Route>

          <Route path="*" element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="page-container not-found"
              style={{ textAlign: 'center', marginTop: '50px' }}
            >
              <h2>404 - Page Not Found</h2>
              <p>The page you are looking for does not exist.</p>
              {authToken ? (
                <button onClick={() => window.history.back()} style={{padding: '10px 20px', marginTop: '20px', cursor: 'pointer'}}>Go Back</button>
              ) : (
                <button onClick={() => window.location.href = '/login'} style={{padding: '10px 20px', marginTop: '20px', cursor: 'pointer'}}>Go to Login</button>
              )}
            </motion.div>
          } />
        </Routes>
      </ChatProvider>
    </BrowserRouter>
  );
}

export default App;