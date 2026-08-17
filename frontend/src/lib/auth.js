import { createContext, useContext, useEffect, useState } from "react";
import { http } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem("da_lang") || "en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("da_user");
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch (_) {}
    }
    setReady(true);
  }, []);

  const login = (token, u) => {
    localStorage.setItem("da_token", token);
    localStorage.setItem("da_user", JSON.stringify(u));
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem("da_token");
    localStorage.removeItem("da_user");
    setUser(null);
  };
  const toggleLang = () => {
    const next = lang === "en" ? "bm" : "en";
    localStorage.setItem("da_lang", next);
    setLang(next);
  };
  return (
    <AuthCtx.Provider value={{ user, lang, ready, login, logout, toggleLang, http }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
