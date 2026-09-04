import { createContext, useContext, useState, useEffect } from "react";
import { CART_SCRIPT_URL } from "../data/data.js";

const AuthContext = createContext(null);
const STORAGE_KEY = "ve_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateAddresses = async (newAddresses) => {
    if (!user) return;
    const updatedUser = { ...user, addresses: newAddresses };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

    try {
      await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "updateAddresses",
          phone: user.phone,
          addresses: newAddresses,
        }),
      });
    } catch (err) {
      console.error("فشل حفظ العنوان على السيرفر:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user, updateAddresses }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
