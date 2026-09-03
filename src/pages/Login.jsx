import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
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

    const cleanEmail = email.trim().toLowerCase();

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

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const userSnap = await getDoc(userRef);

      // ==========================================
      // LOGIN VISIT
      // ==========================================

      const loginVisit = {
        date: new Date().toISOString(),
        type: "login",
      };

      // ==========================================
      // USER EXISTS
      // ==========================================

      if (userSnap.exists()) {
        const userData = userSnap.data();

        const oldVisits = Array.isArray(
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
              loginVisit,
            ],

            updatedAt:
              serverTimestamp(),
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
            uid: user.uid,

            name:
              user.displayName || "",

            displayName:
              user.displayName || "",

            email:
              user.email || "",

            phone:
              user.phoneNumber || "",

            role: "user",

            active: true,

            emailVerified: true,

            loginCount: 1,

            lastLoginAt:
              serverTimestamp(),

            visits: [
              loginVisit,
            ],

            createdAt:
              serverTimestamp(),

            registeredAt:
              serverTimestamp(),

            address: "",

            whatsapp: "",

            gender: "",

            favoriteCategories: [],

            interests: [],

            discoverySource: "",

            updatedAt:
              serverTimestamp(),
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
          BACKGROUND
      ========================================== */}

      <div className="auth-bg">
        <div className="auth-glow auth-glow-one" />
        <div className="auth-glow auth-glow-two" />
        <div className="auth-grid" />
      </div>

      {/* ==========================================
          AUTH LAYOUT
      ========================================== */}

      <div className="auth-container">

        {/* ========================================
            BRAND / HERO
        ======================================== */}

        <aside className="auth-hero">

          <div className="auth-hero-content">

            <Link
              to="/"
              className="auth-brand"
              aria-label="ســـــَــــــــوا"
            >
              <span className="auth-brand-mark">
                س
              </span>

              <span className="auth-brand-name">
                ســـــَــــــــوا
              </span>
            </Link>

            <div className="auth-hero-badge">
              ✦ تجربة تسوق مختلفة
            </div>

            <h2>
              كل اللي بتحبه...
              <br />
              <span>في مكان واحد</span>
            </h2>

            <p>
              سجّل دخولك واستمتع بتجربة
              تسوق أسهل وأسرع مع ســـــَــــــــوا.
            </p>

            <div className="auth-benefits">

              <div className="auth-benefit">
                <span className="auth-benefit-icon">
                  🛍️
                </span>

                <div>
                  <strong>
                    اختيارات أكتر
                  </strong>

                  <small>
                    منتجات تناسب احتياجاتك
                  </small>
                </div>
              </div>

              <div className="auth-benefit">
                <span className="auth-benefit-icon">
                  ⚡
                </span>

                <div>
                  <strong>
                    تجربة أسرع
                  </strong>

                  <small>
                    تابع طلباتك بسهولة
                  </small>
                </div>
              </div>

              <div className="auth-benefit">
                <span className="auth-benefit-icon">
                  🔒
                </span>

                <div>
                  <strong>
                    حسابك في أمان
                  </strong>

                  <small>
                    حماية وخصوصية أفضل
                  </small>
                </div>
              </div>

            </div>

          </div>

          <div className="auth-hero-footer">
            © ســـــَــــــــوا — كل الحقوق محفوظة
          </div>

        </aside>

        {/* ========================================
            LOGIN CARD
        ======================================== */}

        <section className="auth-card">

          {/* MOBILE BRAND */}

          <div className="auth-mobile-brand">

            <Link
              to="/"
              className="auth-mobile-logo"
            >
              <span>
                س
              </span>

              ســـــَــــــــوا
            </Link>

          </div>

          {/* HEADER */}

          <div className="auth-header">

            <div className="auth-welcome-icon">
              👋
            </div>

            <div>

              <div className="auth-eyebrow">
                مرحباً بعودتك
              </div>

              <h1>
                تسجيل الدخول
              </h1>

              <p>
                ادخل بياناتك للوصول إلى حسابك
              </p>

            </div>

          </div>

          {/* FORM */}

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

              <div className="auth-label-row">

                <label htmlFor="login-password">
                  كلمة المرور
                </label>

                <Link
                  to="/forgot-password"
                  className="auth-forgot"
                >
                  نسيت كلمة المرور؟
                </Link>

              </div>

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

            {/* LOGIN BUTTON */}

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
                  <span>
                    تسجيل الدخول
                  </span>

                  <span className="auth-submit-arrow">
                    ←
                  </span>
                </>
              )}

            </button>

          </form>

          {/* REGISTER */}

          <div className="auth-register">

            <span>
              لسه معندكش حساب؟
            </span>

            <Link to="/register">
              إنشاء حساب جديد
            </Link>

          </div>

          {/* BACK */}

          <Link
            to="/"
            className="auth-back"
          >
            <span>←</span>
            العودة إلى المتجر
          </Link>

        </section>

      </div>

    </main>
  );
}

export default Login;
