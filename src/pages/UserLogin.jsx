import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";

import { auth, db } from "../firebase";

function UserLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e) => {
    e.preventDefault();

    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      alert("برجاء إدخال البريد الإلكتروني");
      return;
    }

    if (!password) {
      alert("برجاء إدخال كلمة المرور");
      return;
    }

    setLoading(true);

    try {
      // ============================================
      // FIREBASE LOGIN
      // ============================================

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

      // ============================================
      // USER DOCUMENT
      // ============================================

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const userSnapshot =
        await getDoc(userRef);

      // ============================================
      // لو الحساب موجود في Firestore
      // ============================================

      if (userSnapshot.exists()) {
        const userData =
          userSnapshot.data();

        const currentLoginCount =
          Number(
            userData.loginCount || 0
          );

        const visit = {
          date: new Date().toISOString(),
          type: "login",
        };

        await updateDoc(
          userRef,
          {
            loginCount:
              currentLoginCount + 1,

            lastLoginAt:
              serverTimestamp(),

            visits:
              arrayUnion(visit),
          }
        );
      }

      // ============================================
      // لو الحساب قديم في Authentication
      // ومش موجود في users
      // ============================================

      else {
        await setDoc(
          userRef,
          {
            uid: user.uid,

            name:
              user.displayName ||
              "مستخدم",

            displayName:
              user.displayName ||
              "مستخدم",

            fullName:
              user.displayName ||
              "مستخدم",

            email:
              user.email ||
              cleanEmail,

            phone: "",

            address: "",

            role: "user",

            active: true,

            loginCount: 1,

            lastLoginAt:
              serverTimestamp(),

            createdAt:
              serverTimestamp(),

            registeredAt:
              serverTimestamp(),

            visits: [
              {
                date:
                  new Date().toISOString(),

                type: "login",
              },
            ],
          }
        );
      }

      // ============================================
      // SUCCESS
      // ============================================

      alert(
        "تم تسجيل الدخول بنجاح ✅"
      );

      navigate("/");

    } catch (err) {
      console.error(
        "User Login Error:",
        err
      );

      switch (err?.code) {
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

        case "auth/user-disabled":
          alert(
            "هذا الحساب تم إيقافه"
          );
          break;

        case "auth/too-many-requests":
          alert(
            "تمت محاولات دخول كثيرة، حاول مرة أخرى لاحقًا"
          );
          break;

        case "auth/network-request-failed":
          alert(
            "تأكد من اتصال الإنترنت وحاول مرة أخرى"
          );
          break;

        case "permission-denied":
        case "firestore/permission-denied":
          alert(
            "لا توجد صلاحية لتحديث بيانات الحساب"
          );
          break;

        default:
          alert(
            err?.message ||
              "حدث خطأ أثناء تسجيل الدخول"
          );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page"
      dir="rtl"
    >
      <form
        className="auth-form"
        onSubmit={login}
      >

        <h2>
          تسجيل الدخول
        </h2>

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
        />

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
        />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "⏳ جاري تسجيل الدخول..."
            : "تسجيل الدخول"}
        </button>

        <p>
          ليس لديك حساب؟

          {" "}

          <Link to="/register">
            إنشاء حساب
          </Link>
        </p>

      </form>
    </div>
  );
}

export default UserLogin;