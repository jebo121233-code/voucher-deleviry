import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Profile.css";

export default function Profile() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <h2>لازم تسجل دخول الأول 🔒</h2>
        <div className="signUp" style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={() => navigate("/login")}>تسجيل الدخول</button>
          <button onClick={() => navigate("/register")}>إنشاء حساب</button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="profile-container">
      <h2>حسابي</h2>

      <div className="profile-card">
        <div className="profile-info-row">
          <span className="profile-label">الاسم</span>
          <span className="profile-value">{user.name}</span>
        </div>
        <div className="profile-info-row">
          <span className="profile-label">رقم الموبايل</span>
          <span className="profile-value">{user.phone}</span>
        </div>
        <div className="profile-info-row">
          <span className="profile-label">نقاطك</span>
          <span className="profile-value profile-points">⭐ {user.points || 0}</span>
        </div>
      </div>

      <div className="profile-actions">
        <button className="profile-action-btn" onClick={() => navigate("/orders")}>
          📦 طلباتي
        </button>
        <button className="profile-action-btn logout-btn" onClick={handleLogout}>
          🚪 تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
