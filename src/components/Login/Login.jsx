import React, { useState } from "react";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "../firebase";


// ============================================================
// ADMIN LOGIN
// ============================================================

function Login({ setLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");


  // ==========================================================
  // HANDLE LOGIN
  // ==========================================================

  const handleLogin = async (event) => {
    if (event) {
      event.preventDefault();
    }

    if (loading) {
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    setErrorMessage("");
    setSuccessMessage("");

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!cleanEmail) {
      setErrorMessage("من فضلك اكتب البريد الإلكتروني.");
      return;
    }

    if (!password) {
      setErrorMessage("من فضلك اكتب كلمة المرور.");
      return;
    }

    setLoading(true);

    try {
      // ======================================================
      // 1. FIREBASE AUTHENTICATION
      // ======================================================

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      const user = userCredential?.user;

      if (!user) {
        throw new Error("لم يتم العثور على بيانات المستخدم.");
      }


      // ======================================================
      // 2. SEARCH ADMIN IN FIRESTORE
      // ======================================================

      const adminsQuery = query(
        collection(db, "admins"),
        where("email", "==", cleanEmail)
      );

      const adminsSnapshot = await getDocs(
        adminsQuery
      );


      // ======================================================
      // 3. CHECK ADMIN ACCOUNT
      // ======================================================

      if (adminsSnapshot.empty) {
        await signOut(auth);

        setErrorMessage(
          "هذا الحساب ليس لديه صلاحيات مشرف."
        );

        return;
      }


      // ======================================================
      // 4. GET ADMIN DATA
      // ======================================================

      const adminDoc =
        adminsSnapshot.docs[0];

      const adminData =
        adminDoc.data() || {};


      // ======================================================
      // 5. CHECK ACTIVE STATUS
      // ======================================================

      if (adminData.active === false) {
        await signOut(auth);

        setErrorMessage(
          "حساب المشرف معطل حاليًا. يرجى التواصل مع مدير المتجر."
        );

        return;
      }


      // ======================================================
      // 6. SAVE ADMIN SESSION
      // ======================================================

      localStorage.setItem(
        "adminLogin",
        "true"
      );

      localStorage.setItem(
        "adminId",
        adminDoc.id
      );

      localStorage.setItem(
        "adminEmail",
        user.email || cleanEmail
      );


      // حفظ اسم المشرف لو موجود
      if (adminData.name) {
        localStorage.setItem(
          "adminName",
          String(adminData.name)
        );
      } else {
        localStorage.removeItem("adminName");
      }


      // ======================================================
      // 7. SUCCESS
      // ======================================================

      setSuccessMessage(
        "تم تسجيل الدخول بنجاح، جاري فتح لوحة الإدارة..."
      );

      // إعطاء React فرصة لإظهار رسالة النجاح
      setTimeout(() => {
        setLogin(true);
      }, 250);


    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );


      // ------------------------------------------------------
      // FIREBASE ERROR MESSAGES
      // ------------------------------------------------------

      let message =
        "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.";


      switch (error?.code) {
        case "auth/invalid-credential":
          message =
            "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
          break;

        case "auth/user-not-found":
          message =
            "لا يوجد حساب بهذا البريد الإلكتروني.";
          break;

        case "auth/wrong-password":
          message =
            "كلمة المرور غير صحيحة.";
          break;

        case "auth/invalid-email":
          message =
            "البريد الإلكتروني غير صحيح.";
          break;

        case "auth/user-disabled":
          message =
            "هذا الحساب معطل في Firebase.";
          break;

        case "auth/too-many-requests":
          message =
            "تم إجراء محاولات كثيرة. حاول مرة أخرى لاحقًا.";
          break;

        case "auth/network-request-failed":
          message =
            "تعذر الاتصال بالإنترنت. تحقق من الاتصال وحاول مرة أخرى.";
          break;

        case "auth/operation-not-allowed":
          message =
            "تسجيل الدخول بالبريد الإلكتروني غير مفعل في Firebase.";
          break;

        case "permission-denied":
          message =
            "ليس لديك صلاحية للوصول إلى بيانات المشرفين.";
          break;

        default:
          if (
            error?.message?.includes(
              "Missing or insufficient permissions"
            )
          ) {
            message =
              "لا توجد صلاحية لقراءة بيانات المشرفين في Firestore.";
          }
          break;
      }


      // ------------------------------------------------------
      // CLEAR POSSIBLE SESSION DATA
      // ------------------------------------------------------

      localStorage.removeItem("adminLogin");
      localStorage.removeItem("adminId");
      localStorage.removeItem("adminEmail");
      localStorage.removeItem("adminName");


      setErrorMessage(message);

    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // HANDLE ENTER
  // ==========================================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !loading
    ) {
      handleLogin(event);
    }
  };


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        boxSizing: "border-box",

        background:
          "linear-gradient(135deg, #071A36 0%, #0B1F3A 55%, #132B4F 100%)",

        fontFamily:
          "Cairo, Tahoma, Arial, sans-serif",
      }}
    >

      {/* =====================================================
          LOGIN CARD
      ===================================================== */}

      <div
        style={{
          width: "100%",
          maxWidth: "450px",

          background: "#ffffff",

          borderRadius: "24px",

          padding: "36px 32px",

          boxSizing: "border-box",

          boxShadow:
            "0 25px 70px rgba(0, 0, 0, 0.30)",

          border:
            "1px solid rgba(255,255,255,0.15)",
        }}
      >

        {/* ===================================================
            LOGO / HEADER
        =================================================== */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >

          <div
            style={{
              width: "76px",
              height: "76px",

              margin:
                "0 auto 18px",

              borderRadius: "22px",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              background:
                "linear-gradient(135deg, #071A36, #0B1F3A)",

              color: "#D4AF37",

              fontSize: "34px",

              boxShadow:
                "0 12px 30px rgba(7, 26, 54, 0.25)",
            }}
          >
            🔐
          </div>


          <h1
            style={{
              margin: "0 0 8px",

              color: "#071A36",

              fontSize: "27px",

              fontWeight: "800",

              lineHeight: 1.4,
            }}
          >
            تسجيل دخول الإدارة
          </h1>


          <p
            style={{
              margin: 0,

              color: "#6b7280",

              fontSize: "14px",

              lineHeight: 1.8,
            }}
          >
            سجّل الدخول للوصول إلى لوحة تحكم المتجر
          </p>

        </div>


        {/* ===================================================
            SUCCESS MESSAGE
        =================================================== */}

        {successMessage && (
          <div
            style={{
              marginBottom: "18px",

              padding: "13px 15px",

              borderRadius: "12px",

              background: "#ecfdf5",

              border:
                "1px solid #a7f3d0",

              color: "#047857",

              fontSize: "14px",

              fontWeight: "600",

              lineHeight: 1.7,

              textAlign: "right",
            }}
          >
            ✓ {successMessage}
          </div>
        )}


        {/* ===================================================
            ERROR MESSAGE
        =================================================== */}

        {errorMessage && (
          <div
            style={{
              marginBottom: "18px",

              padding: "13px 15px",

              borderRadius: "12px",

              background: "#fef2f2",

              border:
                "1px solid #fecaca",

              color: "#b91c1c",

              fontSize: "14px",

              fontWeight: "600",

              lineHeight: 1.7,

              textAlign: "right",
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}


        {/* ===================================================
            FORM
        =================================================== */}

        <form
          onSubmit={handleLogin}
          autoComplete="on"
        >

          {/* =================================================
              EMAIL
          ================================================= */}

          <div
            style={{
              marginBottom: "18px",
            }}
          >

            <label
              htmlFor="admin-email"
              style={{
                display: "block",

                marginBottom: "8px",

                color: "#071A36",

                fontSize: "14px",

                fontWeight: "700",
              }}
            >
              البريد الإلكتروني
            </label>


            <div
              style={{
                position: "relative",
              }}
            >

              <span
                style={{
                  position: "absolute",

                  right: "15px",
                  top: "50%",

                  transform:
                    "translateY(-50%)",

                  fontSize: "18px",

                  pointerEvents: "none",
                }}
              >
                ✉️
              </span>


              <input
                id="admin-email"
                name="email"
                type="email"

                placeholder="أدخل البريد الإلكتروني"

                value={email}

                onChange={(event) => {
                  setEmail(event.target.value);

                  if (errorMessage) {
                    setErrorMessage("");
                  }
                }}

                onKeyDown={handleKeyDown}

                disabled={loading}

                autoComplete="username"

                dir="ltr"

                style={{
                  width: "100%",

                  height: "52px",

                  boxSizing: "border-box",

                  padding:
                    "0 48px 0 15px",

                  borderRadius: "13px",

                  border:
                    "1px solid #d9dee7",

                  outline: "none",

                  background: "#f9fafb",

                  color: "#111827",

                  fontSize: "15px",

                  transition:
                    "all 0.2s ease",
                }}

                onFocus={(event) => {
                  event.currentTarget.style.borderColor =
                    "#D4AF37";

                  event.currentTarget.style.background =
                    "#ffffff";

                  event.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(212, 175, 55, 0.12)";
                }}

                onBlur={(event) => {
                  event.currentTarget.style.borderColor =
                    "#d9dee7";

                  event.currentTarget.style.background =
                    "#f9fafb";

                  event.currentTarget.style.boxShadow =
                    "none";
                }}
              />

            </div>

          </div>


          {/* =================================================
              PASSWORD
          ================================================= */}

          <div
            style={{
              marginBottom: "24px",
            }}
          >

            <label
              htmlFor="admin-password"
              style={{
                display: "block",

                marginBottom: "8px",

                color: "#071A36",

                fontSize: "14px",

                fontWeight: "700",
              }}
            >
              كلمة المرور
            </label>


            <div
              style={{
                position: "relative",
              }}
            >

              <span
                style={{
                  position: "absolute",

                  right: "15px",
                  top: "50%",

                  transform:
                    "translateY(-50%)",

                  fontSize: "18px",

                  pointerEvents: "none",
                }}
              >
                🔑
              </span>


              <input
                id="admin-password"
                name="password"

                type={
                  showPassword
                    ? "text"
                    : "password"
                }

                placeholder="أدخل كلمة المرور"

                value={password}

                onChange={(event) => {
                  setPassword(event.target.value);

                  if (errorMessage) {
                    setErrorMessage("");
                  }
                }}

                onKeyDown={handleKeyDown}

                disabled={loading}

                autoComplete="current-password"

                dir="ltr"

                style={{
                  width: "100%",

                  height: "52px",

                  boxSizing: "border-box",

                  padding:
                    "0 48px 0 52px",

                  borderRadius: "13px",

                  border:
                    "1px solid #d9dee7",

                  outline: "none",

                  background: "#f9fafb",

                  color: "#111827",

                  fontSize: "15px",

                  transition:
                    "all 0.2s ease",
                }}

                onFocus={(event) => {
                  event.currentTarget.style.borderColor =
                    "#D4AF37";

                  event.currentTarget.style.background =
                    "#ffffff";

                  event.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(212, 175, 55, 0.12)";
                }}

                onBlur={(event) => {
                  event.currentTarget.style.borderColor =
                    "#d9dee7";

                  event.currentTarget.style.background =
                    "#f9fafb";

                  event.currentTarget.style.boxShadow =
                    "none";
                }}
              />


              {/* SHOW PASSWORD */}

              <button
                type="button"

                onClick={() =>
                  setShowPassword(
                    (previous) =>
                      !previous
                  )
                }

                disabled={loading}

                aria-label={
                  showPassword
                    ? "إخفاء كلمة المرور"
                    : "إظهار كلمة المرور"
                }

                style={{
                  position: "absolute",

                  left: "10px",
                  top: "50%",

                  transform:
                    "translateY(-50%)",

                  width: "36px",
                  height: "36px",

                  border: "none",

                  background:
                    "transparent",

                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer",

                  borderRadius: "8px",

                  fontSize: "17px",

                  opacity:
                    loading ? 0.5 : 1,
                }}
              >
                {showPassword
                  ? "🙈"
                  : "👁️"}
              </button>

            </div>

          </div>


          {/* =================================================
              LOGIN BUTTON
          ================================================= */}

          <button
            type="submit"

            disabled={loading}

            style={{
              width: "100%",

              height: "54px",

              border: "none",

              borderRadius: "14px",

              background:
                loading
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #071A36, #0B1F3A)",

              color: "#ffffff",

              fontSize: "16px",

              fontWeight: "800",

              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              gap: "9px",

              boxShadow:
                loading
                  ? "none"
                  : "0 10px 25px rgba(7, 26, 54, 0.22)",

              transition:
                "all 0.2s ease",
            }}

            onMouseEnter={(event) => {
              if (!loading) {
                event.currentTarget.style.transform =
                  "translateY(-2px)";

                event.currentTarget.style.boxShadow =
                  "0 14px 30px rgba(7, 26, 54, 0.30)";
              }
            }}

            onMouseLeave={(event) => {
              event.currentTarget.style.transform =
                "translateY(0)";

              event.currentTarget.style.boxShadow =
                loading
                  ? "none"
                  : "0 10px 25px rgba(7, 26, 54, 0.22)";
            }}
          >

            {loading ? (
              <>
                <span
                  style={{
                    width: "18px",
                    height: "18px",

                    border:
                      "2px solid rgba(255,255,255,0.35)",

                    borderTopColor:
                      "#ffffff",

                    borderRadius: "50%",

                    display: "inline-block",

                    animation:
                      "adminLoginSpin 0.8s linear infinite",
                  }}
                />

                جاري تسجيل الدخول...
              </>
            ) : (
              <>
                🔐
                دخول لوحة الإدارة
              </>
            )}

          </button>

        </form>


        {/* ===================================================
            FOOTER
        =================================================== */}

        <div
          style={{
            marginTop: "26px",

            paddingTop: "18px",

            borderTop:
              "1px solid #eef0f4",

            textAlign: "center",

            color: "#9ca3af",

            fontSize: "12px",

            lineHeight: 1.8,
          }}
        >
          لوحة الإدارة
          <span
            style={{
              color: "#D4AF37",
              margin: "0 5px",
            }}
          >
            •
          </span>
          ســـــَــــــــوا
        </div>

      </div>


      {/* =====================================================
          SPINNER ANIMATION
      ===================================================== */}

      <style>
        {`
          @keyframes adminLoginSpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 520px) {
            .admin-login-card {
              padding: 28px 20px !important;
            }
          }
        `}
      </style>

    </div>
  );
}


export default Login;