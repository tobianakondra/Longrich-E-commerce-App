import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AdminProvider } from './contexts/AdminContext';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { BottomNav } from './components/Layout/BottomNav';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { Cart } from './pages/Cart';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Contact } from './pages/Contact';
import { About } from './pages/About';
import { Privacy } from './pages/Privacy';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { ProductDetail } from './pages/ProductDetail';

// Chemin d'administration sécurisé et difficile à deviner
const SECURE_ADMIN_PATH = "dashboard-management-secure-x29a7b";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AdminProvider>
          <Router>
            <div className="min-h-screen flex flex-col">
              <Header adminPath={SECURE_ADMIN_PATH} />
              <main className="flex-1 pb-16 md:pb-0">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path={`/${SECURE_ADMIN_PATH}`} element={<AdminDashboard />} />
                  <Route path="/product/detail/:id" element={<ProductDetail />} />
                </Routes>
              </main>
              <Footer />
              <BottomNav />
            </div>
          </Router>
        </AdminProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;