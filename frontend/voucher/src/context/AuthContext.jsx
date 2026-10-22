import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CART_SCRIPT_URL } from "../data/data.js";

const AuthContext = createContext(null);

const ACCOUNTS_KEY = "ve_accounts";
const ACTIVE_KEY = "ve_active_account";
const LEGACY_KEY = "ve_user"; // القديم: بنكمل نكتب فيه بيانات العميل الحالي عشان أي صفحة لسه بتقراه

const digits = (v) => String(v ?? "").replace(/\D/g, "");

// بيعمل معرّف ثابت للحساب: عميل/دليفري بالرقم، مطعم بالـ restaurantId (يعني مفيش حسابين بنفس الرقم على الجهاز)
export const accountIdOf = (role, data) =>
  role === "restaurant" ? `restaurant:${data.restaurantId}` : `${role}:${digits(data.phone)}`;

export const homePathFor = (role) =>
  role === "delivery" ? "/driver" : role === "restaurant" ? "/restaurant" : "/";

async function callApi(body) {
  const res = await fetch(CART_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  return res.json();
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const accounts = JSON.parse(raw);
      if (Array.isArray(accounts)) {
        let activeId = localStorage.getItem(ACTIVE_KEY);
        if (!accounts.some((a) => a.id === activeId)) activeId = null;
        return { accounts, activeId };
      }
    }
    // ترحيل الحساب القديم (قبل نظام التبديل)
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const data = JSON.parse(legacy);
      if (data && data.phone) {
        const id = accountIdOf("customer", data);
        return {
          accounts: [{ id, role: "customer", label: data.name || String(data.phone), data, token: null }],
          activeId: id,
        };
      }
    }
  } catch (err) {
    console.error("فشل قراءة الحسابات المحفوظة:", err);
  }
  return { accounts: [], activeId: null };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(loadInitial);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(state.accounts));
      if (state.activeId) localStorage.setItem(ACTIVE_KEY, state.activeId);
      else localStorage.removeItem(ACTIVE_KEY);

      const active = state.accounts.find((a) => a.id === state.activeId);
      if (active && active.role === "customer") {
        localStorage.setItem(LEGACY_KEY, JSON.stringify(active.data));
      } else if (!state.accounts.some((a) => a.role === "customer")) {
        localStorage.removeItem(LEGACY_KEY);
      }
    } catch (err) {
      console.error("فشل حفظ الحسابات:", err);
    }
  }, [state]);

  const activeAccount = state.accounts.find((a) => a.id === state.activeId) || null;
  const role = activeAccount ? activeAccount.role : null;
  const user = role === "customer" ? activeAccount.data : null;
  const driver = role === "delivery" ? activeAccount.data : null;
  const restaurant = role === "restaurant" ? activeAccount.data : null;

  // بيضيف الحساب (أو بيحدّثه لو موجود) ويخليه الحساب الحالي. لو التوكن مجاش بنحتفظ بالقديم.
  const upsert = useCallback((accRole, data, token) => {
    const id = accountIdOf(accRole, data);
    setState((prev) => {
      const existing = prev.accounts.find((a) => a.id === id);
      const acc = {
        id,
        role: accRole,
        label: data.name || String(data.phone || ""),
        data,
        token: token || (existing && existing.token) || null,
      };
      const accounts = existing ? prev.accounts.map((a) => (a.id === id ? acc : a)) : [...prev.accounts, acc];
      return { accounts, activeId: id };
    });
    return id;
  }, []);

  // نفس الاستخدام القديم: login(user) — والتوكن اختياري (login(user, token))
  const login = useCallback((userData, token) => upsert("customer", userData, token), [upsert]);
  const loginDriver = useCallback((data, token) => upsert("delivery", data, token), [upsert]);
  const loginRestaurant = useCallback((data, token) => upsert("restaurant", data, token), [upsert]);

  // خروج من الحساب الحالي بس، والحسابات التانية فاضلة محفوظة للتبديل
  const logout = useCallback(() => {
    setState((prev) => ({ accounts: prev.accounts, activeId: null }));
  }, []);

  const removeAccount = useCallback((id) => {
    setState((prev) => ({
      accounts: prev.accounts.filter((a) => a.id !== id),
      activeId: prev.activeId === id ? null : prev.activeId,
    }));
  }, []);

  const switchTo = useCallback(async (id) => {
    const acc = stateRef.current.accounts.find((a) => a.id === id);
    if (!acc) return { success: false, error: "الحساب مش موجود" };
    if (!acc.token) return { success: false, error: "سجل دخول للحساب ده تاني", needsLogin: true };
    try {
      const res = await callApi({
        action: "switchAccount",
        role: acc.role,
        token: acc.token,
        phone: acc.data.phone,
        restaurantId: acc.data.restaurantId,
      });
      if (!res.success) return { success: false, error: res.error || "سجل دخول تاني", needsLogin: true };
      const data = res.user || res.delivery || res.restaurant;
      setState((prev) => ({
        accounts: prev.accounts.map((a) =>
          a.id === id ? { ...a, data, label: data.name || a.label } : a
        ),
        activeId: id,
      }));
      return { success: true, role: acc.role };
    } catch (err) {
      return { success: false, error: "مشكلة في الاتصال، حاول تاني" };
    }
  }, []);

  // بيجيب بيانات العميل الحالية من السيرفر (النقاط والعناوين) — مفيد بعد أوردر أو شحن نقاط
  const refreshUser = useCallback(async () => {
    const acc = stateRef.current.accounts.find((a) => a.id === stateRef.current.activeId);
    if (!acc || acc.role !== "customer" || !acc.token) return null;
    try {
      const res = await callApi({ action: "switchAccount", role: "customer", token: acc.token, phone: acc.data.phone });
      if (!res.success) return null;
      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) => (a.id === acc.id ? { ...a, data: res.user, label: res.user.name || a.label } : a)),
      }));
      return res.user;
    } catch (err) {
      return null;
    }
  }, []);

  // تعديل محلي سريع على بيانات العميل الحالي (زي النقاط بعد الأوردر)
  const updateUser = useCallback((patch) => {
    setState((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) =>
        a.id === prev.activeId && a.role === "customer" ? { ...a, data: { ...a.data, ...patch } } : a
      ),
    }));
  }, []);

  const updateAddresses = async (newAddresses) => {
    if (!user) return;
    updateUser({ addresses: newAddresses });
    try {
      await callApi({ action: "updateAddresses", phone: user.phone, addresses: newAddresses });
    } catch (err) {
      console.error("فشل حفظ العنوان على السيرفر:", err);
    }
  };

  const value = useMemo(
    () => ({
      // القديم (العميل)
      user,
      login,
      logout,
      isLoggedIn: !!user,
      updateAddresses,
      // الجديد
      role,
      driver,
      restaurant,
      token: activeAccount ? activeAccount.token : null,
      accounts: state.accounts,
      activeId: state.activeId,
      loginDriver,
      loginRestaurant,
      switchTo,
      removeAccount,
      refreshUser,
      updateUser,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
