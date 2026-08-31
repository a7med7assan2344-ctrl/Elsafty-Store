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
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";

import { auth, db } from "../firebase";

function UserLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      const result = await signInWithEmailAndPassword(
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

      const userSnapshot = await getDoc(userRef);

      // ============================================
      // USER EXISTS
      // ============================================

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();

        const currentLoginCount = Number(
          userData.loginCount || 0
        );

        const visit = {
          date: new Date().toISOString(),
          type: "login",
        };

        await updateDoc(userRef, {
          loginCount: currentLoginCount + 1,

          lastLoginAt: serverTimestamp(),

          visits: arrayUnion(visit),
        });
      }

      // ============================================
      // OLD AUTH ACCOUNT
      // ============================================

      else {
        await setDoc(userRef, {
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

          lastLoginAt: serverTimestamp(),

          createdAt: serverTimestamp(),

          registeredAt: serverTimestamp(),

          visits: [
            {
              date: new Date().toISOString(),
              type: "login",
            },
          ],
        });
      }

      // ============================================
      // SUCCESS
      // ============================================

      alert("تم تسجيل الدخول بنجاح ✅");

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
    <div className="auth-page" dir="rtl">

      {/* ============================================
          BACKGROUND DECORATION
      ============================================ */}

      <div className="auth-bg-shape auth-bg-shape-one" />
      <div className="auth-bg-shape auth-bg-shape-two" />

      {/* ============================================
          MAIN AUTH CARD
      ============================================ */}

      <div className="auth-container">

        {/* ==========================================
            BRAND SECTION
        ========================================== */}

        <div className="auth-brand">

          <div className="auth-logo">
            <span>ELSAFTY</span>
            <small>STORE</small>
          </div>

          <h1>
            أهلاً بيك في
            <strong> Elsafty Store</strong>
          </h1>

          <p>
            سجل دخولك واستمتع بتجربة تسوق
            أسرع وأسهل
          </p>

        </div>

        {/* ==========================================
            FORM CARD
        ========================================== */}

        <div className="auth-card">

          <div className="auth-card-header">

            <div className="auth-icon">
              👤
            </div>

            <div>
              <h2>
                تسجيل الدخول
              </h2>

              <p>
                ادخل بيانات حسابك للمتابعة
              </p>
            </div>

          </div>

          <form
            className="auth-form"
            onSubmit={login}
          >

            {/* EMAIL */}

            <div className="auth-field">

              <label htmlFor="login-email">
                البريد الإلكتروني
              </label>

              <div className="auth-input-wrapper">

                <span className="auth-input-icon">
                  ✉️
                </span>

                <input
                  id="login-email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  disabled={loading}
                  autoComplete="email"
                  required
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="auth-field">

              <div className="auth-label-row">

                <label htmlFor="login-password">
                  كلمة المرور
                </label>

                <Link
                  to="/forgot-password"
                  className="forgot-password"
                >
                  نسيت كلمة المرور؟
                </Link>

              </div>

              <div className="auth-input-wrapper">

                <span className="auth-input-icon">
                  🔒
                </span>

                <input
                  id="login-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "إخفاء كلمة المرور"
                      : "إظهار كلمة المرور"
                  }
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>

              </div>

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="auth-spinner" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  تسجيل الدخول
                  <span>←</span>
                </>
              )}

            </button>

          </form>

          {/* DIVIDER */}

          <div className="auth-divider">
            <span>أو</span>
          </div>

          {/* REGISTER */}

          <div className="auth-register">

            <span>
              ليس لديك حساب؟
            </span>

            <Link to="/register">
              إنشاء حساب جديد
            </Link>

          </div>

          {/* STORE LINK */}

          <Link
            to="/"
            className="back-to-store"
          >
            ← العودة للمتجر
          </Link>

        </div>

        {/* ==========================================
            FOOTER
        ========================================== */}

        <div className="auth-footer">
          <span>
            © {new Date().getFullYear()}
          </span>

          <strong>
            Elsafty Store
          </strong>

          <span>
            جميع الحقوق محفوظة
          </span>
        </div>

      </div>
    </div>
  );
}

export default UserLogin;
