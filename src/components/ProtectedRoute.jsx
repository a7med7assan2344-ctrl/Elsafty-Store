import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../firebase";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ==============================
  // AUTH LOADING
  // ==============================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          direction: "rtl",
          fontFamily: "Cairo, Tahoma, sans-serif",
          background: "#f0f4f8",
          color: "#071a36",
          fontSize: "20px",
          fontWeight: "700",
        }}
      >
        جاري تحميل الحساب... ⏳
      </div>
    );
  }

  // ==============================
  // NOT LOGGED IN
  // ==============================

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ==============================
  // LOGGED IN
  // ==============================

  return children;
}

export default ProtectedRoute;