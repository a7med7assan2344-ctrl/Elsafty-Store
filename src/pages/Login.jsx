import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth";

import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { auth, db } from "../firebase";


function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = async (e) => {

    e.preventDefault();

    if (loading) {
      return;
    }

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      alert(
        "من فضلك أدخل البريد الإلكتروني وكلمة المرور"
      );
      return;
    }

    try {

      setLoading(true);

      // ==========================================
      // FIREBASE AUTH
      // ==========================================

      const result =
        await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      const user = result.user;

      if (!user?.uid) {
        throw new Error(
          "لم يتم العثور على بيانات المستخدم"
        );
      }

      // ==========================================
      // EMAIL VERIFICATION
      // ==========================================

      if (!user.emailVerified) {

        try {

          await sendEmailVerification(user);

        } catch (verificationError) {

          console.error(
            "Verification Email Error:",
            verificationError
          );

        }

        alert(
          "📧 هذا الحساب لم يتم تأكيد البريد الإلكتروني الخاص به.\n\n" +
          "تم إرسال رسالة تأكيد جديدة إلى Gmail الخاص بك.\n\n" +
          "افتح الرسالة واضغط على رابط التأكيد، ثم حاول تسجيل الدخول مرة أخرى."
        );

        await auth.signOut();

        return;
      }

      // ==========================================
      // FIRESTORE USER
      // ==========================================

      const userRef =
        doc(
          db,
          "users",
          user.uid
        );

      const userSnap =
        await getDoc(userRef);

      // ==========================================
      // LOGIN VISIT
      // ==========================================

      const loginVisit = {

        date:
          new Date().toISOString(),

        type:
          "login"

      };

      // ==========================================
      // USER EXISTS
      // ==========================================

      if (userSnap.exists()) {

        const userData =
          userSnap.data();

        const oldVisits =
          Array.isArray(
            userData.visits
          )
            ? userData.visits
            : [];

        await updateDoc(
          userRef,
          {

            lastLoginAt:
              serverTimestamp(),

            loginCount:
              Number(
                userData.loginCount || 0
              ) + 1,

            visits: [
              ...oldVisits,
              loginVisit
            ],

            updatedAt:
              serverTimestamp()

          }
        );

      }

      // ==========================================
      // AUTH USER EXISTS
      // BUT FIRESTORE USER MISSING
      // ==========================================

      else {

        await setDoc(
          userRef,
          {

            uid:
              user.uid,

            name:
              user.displayName || "",

            displayName:
              user.displayName || "",

            email:
              user.email || "",

            phone:
              user.phoneNumber || "",

            role:
              "user",

            active:
              true,

            emailVerified:
              true,

            loginCount:
              1,

            lastLoginAt:
              serverTimestamp(),

            visits: [
              loginVisit
            ],

            createdAt:
              serverTimestamp(),

            registeredAt:
              serverTimestamp(),

            address:
              "",

            whatsapp:
              "",

            gender:
              "",

            favoriteCategories:
              [],

            interests:
              [],

            discoverySource:
              "",

            updatedAt:
              serverTimestamp()

          }
        );

      }

      // ==========================================
      // SUCCESS
      // ==========================================

      navigate("/");

    }

    catch (err) {

      console.error(
        "Login Error:",
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

        case "auth/user-disabled":

          alert(
            "هذا الحساب تم إيقافه. يرجى التواصل مع إدارة المتجر."
          );

          break;

        default:

          alert(
            "حدث خطأ أثناء تسجيل الدخول"
          );

      }

    }

    finally {

      setLoading(false);

    }

  };

  return (

    <main
      className="auth-page"
      dir="rtl"
    >

      {/* ==========================================
          BACKGROUND DECORATION
      ========================================== */}

      <div className="auth-bg-circle auth-bg-circle-one" />
      <div className="auth-bg-circle auth-bg-circle-two" />

      {/* ==========================================
          LOGIN CARD
      ========================================== */}

      <section className="auth-card">

        {/* ========================================
            BRAND
        ======================================== */}

        <div className="auth-brand">

          <Link
            to="/"
            className="auth-logo"
            aria-label="Elsafty Store"
          >

            <span className="auth-logo-main">
              ELSAFTY
            </span>

            <span className="auth-logo-sub">
              STORE
            </span>

          </Link>

          <div className="auth-brand-line" />

        </div>


        {/* ========================================
            HEADER
        ======================================== */}

        <div className="auth-header">

          <div className="auth-icon">
            <span>👤</span>
          </div>

          <h1>
            تسجيل الدخول
          </h1>

          <p>
            أهلاً بيك في Elsafty Store
          </p>

          <small>
            سجل دخولك للوصول إلى حسابك وطلباتك
          </small>

        </div>


        {/* ========================================
            FORM
        ======================================== */}

        <form
          className="auth-form"
          onSubmit={login}
        >

          {/* EMAIL */}

          <div className="auth-field">

            <label htmlFor="login-email">
              البريد الإلكتروني
            </label>

            <div className="auth-input-wrap">

              <span className="auth-input-icon">
                ✉
              </span>

              <input
                id="login-email"
                type="email"
                placeholder="example@gmail.com"
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

            <label htmlFor="login-password">
              كلمة المرور
            </label>

            <div className="auth-input-wrap">

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
                    !showPassword
                  )
                }
                disabled={loading}
                aria-label={
                  showPassword
                    ? "إخفاء كلمة المرور"
                    : "إظهار كلمة المرور"
                }
              >

                {showPassword
                  ? "🙈"
                  : "👁️"}

              </button>

            </div>

          </div>


          {/* FORGOT PASSWORD */}

          <div className="auth-options">

            <Link
              to="/forgot-password"
              className="auth-forgot"
            >
              نسيت كلمة المرور؟
            </Link>

          </div>


          {/* LOGIN */}

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
                <span className="auth-submit-arrow">
                  ←
                </span>
              </>

            )}

          </button>

        </form>


        {/* ========================================
            REGISTER
        ======================================== */}

        <div className="auth-register">

          <span>
            ليس لديك حساب؟
          </span>

          <Link to="/register">
            إنشاء حساب جديد
          </Link>

        </div>


        {/* ========================================
            BACK TO STORE
        ======================================== */}

        <Link
          to="/"
          className="auth-back"
        >
          ← العودة إلى المتجر
        </Link>

      </section>

    </main>

  );

}

export default Login;
