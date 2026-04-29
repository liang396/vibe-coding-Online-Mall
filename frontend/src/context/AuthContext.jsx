import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getUser, loginUser, registerUser, switchUserRole, updateUser } from "../api/userApi";
import {
  clearAuthStorage,
  getStoredUser,
  getToken,
  saveAuthStorage
} from "../utils/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleExpired = () => {
      setToken(null);
      setUser(null);
      clearAuthStorage();
    };

    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const register = async (payload) => {
    setLoading(true);
    try {
      return await registerUser(payload);
    } finally {
      setLoading(false);
    }
  };

  const login = async (payload) => {
    setLoading(true);
    try {
      const loginData = await loginUser(payload);
      const rawToken = loginData.token;
      setToken(rawToken);
      saveAuthStorage(rawToken, null);
      const nextUser = await getUser(loginData.userId);
      setUser(nextUser);
      saveAuthStorage(rawToken, nextUser);
      return nextUser;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async (userId) => {
    const profile = await getUser(userId);
    setUser(profile);
    saveAuthStorage(token, profile);
    return profile;
  };

  const saveProfile = async (userId, payload) => {
    await updateUser(userId, payload);
    return refreshProfile(userId);
  };

  const changeRole = async (userId, role) => {
    const nextUser = await switchUserRole(userId, role);
    setUser(nextUser);
    saveAuthStorage(token, nextUser);
    return nextUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearAuthStorage();
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      register,
      login,
      logout,
      refreshProfile,
      saveProfile,
      changeRole
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
