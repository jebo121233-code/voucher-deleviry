import { Routes, Route } from "react-router-dom";
import Navbar from './pages/Navbar.jsx';
import Home from './pages/Home.jsx';
import Footer from "./pages/Footer.jsx";
import Stores from "./pages/Stores.jsx";
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
import './App.css'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ScrollToTop />
        <Navbar />
        <Routes>
          <Route path='/' element={<Home/>} />
          <Route path='/stores' element={<Stores/>} />
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
        </Routes>
        <Footer />
        <BottomNav />
      </CartProvider>
    </AuthProvider>
  )
}

export default App
