import { NavLink } from "react-router-dom";
import "./BottomNav.css";

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className="bottom-nav-item">
        <span className="bottom-nav-icon">🏠</span>
        <span>الرئيسية</span>
      </NavLink>

      <NavLink to="/orders" className="bottom-nav-item">
        <span className="bottom-nav-icon">📦</span>
        <span>طلباتي</span>
      </NavLink>

      <NavLink to="/profile" className="bottom-nav-item">
        <span className="bottom-nav-icon">⭐</span>
        <span>نقاطي</span>
      </NavLink>

      <NavLink to="/vouchers" className="bottom-nav-item">
        <span className="bottom-nav-icon">🎟️</span>
        <span>عروض</span>
      </NavLink>

      <NavLink to="/profile" className="bottom-nav-item">
        <span className="bottom-nav-icon">👤</span>
        <span>حسابي</span>
      </NavLink>
    </nav>
  );
}
