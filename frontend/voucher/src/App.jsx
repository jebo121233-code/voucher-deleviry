import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from './pages/Navbar.jsx';
import Home from './pages/Home.jsx';
import Footer from "./pages/Footer.jsx";
import Stores from "./pages/Stores.jsx";
import Search from "./pages/Search.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Deals from "./pages/Deals.jsx";
import Profile from "./pages/Profile.jsx";
import Store from "./pages/Store.jsx";
import Delivery from "./pages/Delivery.jsx";
import CardOrder from "./pages/CardOrder.jsx";
import Cart from "./pages/Cart.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ScrollToTop from './pages/ScrollToTop.jsx';
import OrderHistory from "./pages/OrderHistory.jsx";
import BottomNav from "./pages/BottomNav.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Admin from "./pages/Admin.jsx";
import PartnerRegister from "./pages/PartnerRegister.jsx";
import Driver from "./pages/Driver.jsx";
import Restaurant from "./pages/Restaurant.jsx";
import Points from "./pages/Points.jsx";
import TrackOrder from "./pages/TrackOrder.jsx";
import './App.css'
import DeliveryRegister from "./pages/DeliveryRegister.jsx";
import { loadDynamicStores } from "./data/dynamicStores.js";

function App() {
  // صفحة الأدمن منفصلة تماماً: من غير شريط الموقع ولا الفوتر ولا شريط التنقل السفلي
  const { pathname } = useLocation();
  const isAdminPage = pathname.startsWith("/ve-weza-23jj03only");
  // المحلات اللي جاية من الشيت (إضافة أدمن / طلب شراكة اتقبل) بتتحمّل وتتدمج مع محلات data.js
  const [, setStoresVersion] = useState(0);
  useEffect(() => {
    loadDynamicStores().then((changed) => changed && setStoresVersion((v) => v + 1));
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <ScrollToTop />
        {!isAdminPage && <Navbar />}
        <Routes>
          <Route path='/' element={<Home/>} />
          <Route path='/stores' element={<Stores/>} />
          <Route path='/search' element={<Search/>} />
          <Route path='/store/:id' element={<Store/>} />
          <Route path='/signup' element={<Signup/>} />
          <Route path='/register' element={<Register/>} />
          <Route path='/delivery' element={<Delivery/>} />
          <Route path='/card/:id' element={<CardOrder/>} />
          <Route path='/cart' element={<Cart/>} />
          <Route path='/login' element={<Login/>} />
          <Route path='/deals' element={<Deals/>} />
          <Route path='/profile' element={<Profile/>} />
          <Route path='/orders' element={<OrderHistory/>} />
          <Route path='/vouchers' element={<ComingSoon/>} /> 
          <Route path='/reset-password' element={<ResetPassword/>} />
          <Route path='/ve-weza-23jj03only' element={<Admin/>} />
          <Route path='/partner-register' element={<PartnerRegister/>} />
          <Route path="/delivery-register" element={<DeliveryRegister />} />
          <Route path="/driver" element={<Driver />} />
          <Route path="/restaurant" element={<Restaurant />} />
          <Route path="/points" element={<Points />} />
          <Route path="/track" element={<TrackOrder />} />
        </Routes>
        {!isAdminPage && <Footer />}
        {!isAdminPage && <BottomNav />}
      </CartProvider>
    </AuthProvider>
  )
}

export default App
