import React, { useState } from "react";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase";

export default function AdminLogin({ setAdmin }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // ======================================================
  // LOGIN
  // ======================================================

  const login = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      alert("برجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setLoading(true);

    try {

      // ==================================================
      // FIREBASE AUTH LOGIN
      // ==================================================

      const result =
        await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      const user = result.user;

      if (!user?.uid) {
        throw new Error(
          "لم يتم تسجيل الدخول بشكل صحيح"
        );
      }

      // ==================================================
      // GET USER DATA FROM FIRESTORE
      // users/{uid}
      // ==================================================

      const userRef =
        doc(
          db,
          "users",
          user.uid
        );

      const userSnap =
        await getDoc(userRef);

      // ==================================================
      // USER DOCUMENT NOT FOUND
      // ==================================================

      if (!userSnap.exists()) {

        await signOut(auth);

        setAdmin(false);

        alert(
          "هذا الحساب غير مسجل في قاعدة بيانات المستخدمين"
        );

        return;
      }

      // ==================================================
      // USER DATA
      // ==================================================

      const userData =
        userSnap.data();

      // ==================================================
      // CHECK ADMIN ROLE
      // ==================================================

      if (userData.role !== "admin") {

        await signOut(auth);

        setAdmin(false);

        alert(
          "هذا الحساب ليس لديه صلاحية دخول لوحة الإدارة"
        );

        return;
      }

      // ==================================================
      // ADMIN LOGIN SUCCESS
      // ==================================================

      setAdmin(true);

    } catch (error) {

      console.error(
        "Admin Login Error:",
        error
      );

      setAdmin(false);

      switch (error?.code) {

        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":

          alert(
            "البريد الإلكتروني أو كلمة المرور غير صحيحة"
          );

          break;

        case "auth/invalid-email":

          alert(
            "البريد الإلكتروني غير صحيح"
          );

          break;

        case "auth/too-many-requests":

          alert(
            "تمت محاولات تسجيل دخول كثيرة، حاول مرة أخرى لاحقًا"
          );

          break;

        case "auth/network-request-failed":

          alert(
            "تأكد من اتصال الإنترنت وحاول مرة أخرى"
          );

          break;

        default:

          alert(
            "حدث خطأ أثناء تسجيل الدخول"
          );
      }

    } finally {

      setLoading(false);

    }
  };

  // ======================================================
  // UI
  // ======================================================

  return (

    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f0f4f8",
        fontFamily: "Cairo, Tahoma, sans-serif",
      }}
    >

      <div
        style={{
          width: "350px",
          maxWidth: "90%",
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow:
            "0 5px 25px rgba(0,0,0,0.12)",
          textAlign: "center",
        }}
      >

        <h2
          style={{
            color: "#071a36",
            marginBottom: "25px",
          }}
        >
          تسجيل دخول الإدارة
        </h2>

        <form onSubmit={login}>

          {/* EMAIL */}

          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            disabled={loading}
            autoComplete="email"
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginBottom: "15px",
              border:
                "1px solid #ddd",
              borderRadius: "8px",
              outline: "none",
              fontFamily:
                "Cairo, Tahoma, sans-serif",
            }}
          />

          {/* PASSWORD */}

          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            disabled={loading}
            autoComplete="current-password"
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginBottom: "20px",
              border:
                "1px solid #ddd",
              borderRadius: "8px",
              outline: "none",
              fontFamily:
                "Cairo, Tahoma, sans-serif",
            }}
          />

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              background: "#071a36",
              color: "#fff",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              fontFamily:
                "Cairo, Tahoma, sans-serif",
              fontWeight: "700",
              fontSize: "16px",
              opacity: loading
                ? 0.7
                : 1,
            }}
          >
            {loading
              ? "⏳ جاري تسجيل الدخول..."
              : "دخول الإدارة"}
          </button>

        </form>

      </div>

    </div>
  );
}