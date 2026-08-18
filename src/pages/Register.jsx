import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

function Register() {
  const navigate = useNavigate();

  // ==================================================
  // STATES
  // ==================================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);

  // ==================================================
  // REGISTER
  // ==================================================

  const register = async (e) => {
    e.preventDefault();

    // منع الضغط أكثر من مرة
    if (loading) {
      return;
    }

    // ==================================================
    // CLEAN DATA
    // ==================================================

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!cleanName) {
      alert("برجاء إدخال الاسم بالكامل");
      return;
    }

    if (!cleanEmail) {
      alert("برجاء إدخال البريد الإلكتروني");
      return;
    }

    if (!password) {
      alert("برجاء إدخال كلمة المرور");
      return;
    }

    if (password.length < 6) {
      alert(
        "كلمة المرور يجب أن تكون 6 أحرف أو أكثر"
      );
      return;
    }

    if (password !== confirmPassword) {
      alert("كلمتا المرور غير متطابقتين");
      return;
    }

    // ==================================================
    // START LOADING
    // ==================================================

    setLoading(true);

    try {
      // ==================================================
      // CREATE FIREBASE AUTH ACCOUNT
      // ==================================================

      const result =
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      const user = result.user;

      if (!user?.uid) {
        throw new Error(
          "لم يتم إنشاء حساب المستخدم بشكل صحيح"
        );
      }

      // ==================================================
      // UPDATE FIREBASE AUTH PROFILE
      // ==================================================

      await updateProfile(user, {
        displayName: cleanName,
      });

      // ==================================================
      // USER DOCUMENT
      // users/{uid}
      // ==================================================

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      // ==================================================
      // SAVE USER DATA TO FIRESTORE
      // ==================================================

      await setDoc(userRef, {
        // ----------------------------------------------
        // USER ID
        // ----------------------------------------------

        uid: user.uid,

        // ----------------------------------------------
        // NAME
        // ----------------------------------------------

        name: cleanName,

        displayName: cleanName,

        fullName: cleanName,

        // ----------------------------------------------
        // EMAIL
        // ----------------------------------------------

        email: cleanEmail,

        // ----------------------------------------------
        // PHONE
        // ----------------------------------------------

        phone: cleanPhone,

        // ----------------------------------------------
        // ROLE
        // ----------------------------------------------

        role: "user",

        // ----------------------------------------------
        // ACCOUNT STATUS
        // ----------------------------------------------

        active: true,

        // ----------------------------------------------
        // LOGIN INFORMATION
        // ----------------------------------------------

        loginCount: 1,

        lastLoginAt: serverTimestamp(),

        // ----------------------------------------------
        // VISITS / LOGIN HISTORY
        // ----------------------------------------------

        visits: [
          {
            date: new Date().toISOString(),
            type: "register",
          },
        ],

        // ----------------------------------------------
        // REGISTRATION DATE
        // ----------------------------------------------

        createdAt: serverTimestamp(),

        registeredAt: serverTimestamp(),

        // ----------------------------------------------
        // ADDRESS
        // ----------------------------------------------

        address: "",
      });

      // ==================================================
      // SUCCESS
      // ==================================================

      alert(
        "تم إنشاء الحساب بنجاح ✅"
      );

      // الانتقال للمتجر
      navigate("/");

    } catch (err) {
      console.error(
        "Register Error:",
        err
      );

      // ==================================================
      // FIREBASE ERRORS
      // ==================================================

      switch (err?.code) {
        case "auth/email-already-in-use":
          alert(
            "البريد الإلكتروني مستخدم بالفعل"
          );
          break;

        case "auth/invalid-email":
          alert(
            "البريد الإلكتروني غير صحيح"
          );
          break;

        case "auth/weak-password":
          alert(
            "كلمة المرور ضعيفة، استخدم 6 أحرف أو أكثر"
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
            "لا توجد صلاحية لحفظ بيانات الحساب في قاعدة البيانات"
          );
          break;

        default:
          alert(
            err?.message ||
              "حدث خطأ أثناء إنشاء الحساب"
          );
      }

    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // RETURN
  // ==================================================

  return (
    <div
      className="auth-page"
      dir="rtl"
    >
      <form
        className="auth-form"
        onSubmit={register}
      >

        {/* ============================================
            TITLE
        ============================================ */}

        <h2>
          إنشاء حساب
        </h2>

        {/* ============================================
            NAME
        ============================================ */}

        <input
          type="text"
          placeholder="الاسم بالكامل"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          disabled={loading}
          autoComplete="name"
          required
        />

        {/* ============================================
            EMAIL
        ============================================ */}

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

        {/* ============================================
            PHONE
        ============================================ */}

        <input
          type="tel"
          inputMode="tel"
          placeholder="رقم الموبايل"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
          disabled={loading}
          autoComplete="tel"
        />

        {/* ============================================
            PASSWORD
        ============================================ */}

        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          disabled={loading}
          autoComplete="new-password"
          minLength={6}
          required
        />

        {/* ============================================
            CONFIRM PASSWORD
        ============================================ */}

        <input
          type="password"
          placeholder="تأكيد كلمة المرور"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(
              e.target.value
            )
          }
          disabled={loading}
          autoComplete="new-password"
          minLength={6}
          required
        />

        {/* ============================================
            SUBMIT
        ============================================ */}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "⏳ جاري إنشاء الحساب..."
            : "إنشاء حساب"}
        </button>

        {/* ============================================
            LOGIN LINK
        ============================================ */}

        <p>
          لديك حساب؟

          {" "}

          <Link to="/login">
            تسجيل الدخول
          </Link>
        </p>

      </form>
    </div>
  );
}

export default Register;