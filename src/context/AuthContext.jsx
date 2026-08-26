import React, {
  createContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase";

// ======================================================
// AUTH CONTEXT
// ======================================================

export const AuthContext = createContext({
  user: null,
  logout: async () => {},
  loading: true,
});

// ======================================================
// AUTH PROVIDER
// ======================================================

function AuthProvider({ children }) {

  const [user, setUser] = useState(null);

  const [loading, setLoading] =
    useState(true);

  // ====================================================
  // مراقبة حالة تسجيل الدخول
  // ====================================================

  useEffect(() => {

    let mounted = true;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {

          if (!mounted) {
            return;
          }

          setUser(currentUser);

          setLoading(false);

        },
        (error) => {

          console.error(
            "Auth State Error:",
            error
          );

          if (!mounted) {
            return;
          }

          setUser(null);

          setLoading(false);

        }
      );

    return () => {

      mounted = false;

      unsubscribe();

    };

  }, []);

  // ====================================================
  // تسجيل الخروج
  // ====================================================

  const logout = async () => {

    try {

      await signOut(auth);

      setUser(null);

    } catch (error) {

      console.error(
        "Logout Error:",
        error
      );

      throw error;

    }

  };

  // ====================================================
  // CONTEXT VALUE
  // ====================================================

  const contextValue = {
    user,
    logout,
    loading,
  };

  // ====================================================
  // PROVIDER
  // ====================================================

  return (

    <AuthContext.Provider
      value={contextValue}
    >

      {children}

    </AuthContext.Provider>

  );

}

// ======================================================
// EXPORT
// ======================================================

export default AuthProvider;