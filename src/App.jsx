import { Routes, Route } from "react-router-dom";
import Navbar from './pages/Navbar.jsx';
import Home from './pages/Home.jsx';
import Footer from "./pages/Footer.jsx";
import Stores from "./pages/Stores.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Deals from "./pages/Deals.jsx";
import Profile from "./pages/Profile.jsx";
import Store from "./pages/Store.jsx";
import Delivery from "./pages/Delivery.jsx";
import CardOrder from "./pages/CardOrder.jsx";
import './App.css'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/stores' element={<Stores/>} />
        <Route path='/store/:id' element={<Store/>} />
        <Route path='/signup' element={<Signup/>} />
        <Route path='/delivery' element={<Delivery/>} />
        <Route path='/card/:id' element={<CardOrder/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/deals' element={<Deals/>} />
        <Route path='/profile' element={<Profile/>} />
      </Routes>
      <Footer />
    </>
  )
}

export default App
