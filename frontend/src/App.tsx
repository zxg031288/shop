import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { getCart, getCurrentUser } from './api';
import Home from './pages/Home';
import Search from './pages/Search';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import MyPage from './pages/MyPage';
import MyOrders from './pages/MyOrders';
import Login from './pages/Login';
import Register from './pages/Register';
import AddressList from './pages/AddressList';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductUpload from './pages/admin/AdminProductUpload';
import AdminProductList from './pages/admin/AdminProductList';
import AdminOrderList from './pages/admin/AdminOrderList';
import AdminHomeBanner from './pages/admin/AdminHomeBanner';
import PayOrder from './pages/PayOrder';

// 购物车上下文
interface CartContextType {
  cartCount: number;
  setCartCount: (count: number) => void;
  refreshCart: () => Promise<void>;
}

// Toast 上下文
interface ToastContextType {
  showToast: (msg: string) => void;
}

// 用户上下文
interface UserType {
  id: number;
  username: string;
  nickname: string;
  phone: string;
}

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  setCartCount: () => {},
  refreshCart: async () => {},
});

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

// 用户上下文（全局可用）
const UserContext = createContext<UserType | null>(null);

export function useCart() {
  return useContext(CartContext);
}

export function useToast() {
  return useContext(ToastContext);
}

export function useUser() {
  return useContext(UserContext);
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </ToastContext.Provider>
  );
}

export default function App() {
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<UserType | null>(null);

  const refreshCart = useCallback(async () => {
    try {
      const res = await getCart();
      if (res.code === 0) {
        setCartCount(res.data?.length || 0);
      }
    } catch {
      // ignore
    }
  }, []);

  // 检查登录状态：以服务端 Cookie 为准，避免各端 localStorage 陈旧导致「看起来登录信息不一致」
  const checkUser = useCallback(async () => {
    try {
      const res = await getCurrentUser();
      if (res.code === 0 && res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } else if (res.code === 0 && !res.data) {
        localStorage.removeItem('user');
        setUser(null);
      }
    } catch {
      const saved = localStorage.getItem('user');
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    }
  }, []);

  useEffect(() => {
    refreshCart();
    checkUser();
  }, [refreshCart, checkUser]);

  // 从其他设备/标签页返回时同步服务端状态
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      checkUser();
      refreshCart();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [checkUser, refreshCart]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <ToastProvider>
        <UserContext.Provider value={user}>
          <CartContext.Provider value={{ cartCount, setCartCount, refreshCart }}>
            <Routes>
              {/* 买家端 */}
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/my" element={<MyPage onLogout={handleLogout} />} />
              <Route path="/my/orders" element={<MyOrders />} />
              <Route path="/addresses" element={<AddressList />} />

              {/* 买家登录/注册 */}
              <Route path="/login" element={<Login onLogin={(u) => { setUser(u); }} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pay-order" element={<PayOrder />} />

              {/* 商家端（独立入口） */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProductList />} />
                <Route path="upload" element={<AdminProductUpload />} />
                <Route path="orders" element={<AdminOrderList />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="home-banner" element={<AdminHomeBanner />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartContext.Provider>
        </UserContext.Provider>
      </ToastProvider>
    </BrowserRouter>
  );
}
