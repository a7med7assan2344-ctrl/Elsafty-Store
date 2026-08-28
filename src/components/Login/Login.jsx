import React, { useState } from "react";

import {
  signInWithEmailAndPassword,
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

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // ==========================================================
  // HANDLE LOGIN
  // ==========================================================

  const handleLogin = async () => {

    const email =
      username.trim().toLowerCase();

    if (!email) {
      alert("من فضلك اكتب البريد الإلكتروني");
      return;
    }

    if (!password) {
      alert("من فضلك اكتب كلمة المرور");
      return;
    }


    setLoading(true);


    try {

      // ======================================================
      // 1️⃣ تسجيل الدخول في Firebase Authentication
      // ======================================================

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


      const user =
        userCredential.user;


      // ======================================================
      // 2️⃣ البحث عن المشرف في Firestore
      // ======================================================

      const adminsQuery =
        query(
          collection(db, "admins"),
          where(
            "email",
            "==",
            email
          )
        );


      const adminsSnapshot =
        await getDocs(
          adminsQuery
        );


      // ======================================================
      // 3️⃣ التأكد أن الحساب مشرف
      // ======================================================

      if (
        adminsSnapshot.empty
      ) {

        await auth.signOut();

        alert(
          "❌ هذا الحساب ليس لديه صلاحيات مشرف."
        );

        return;
      }


      const adminDoc =
        adminsSnapshot.docs[0];


      const adminData =
        adminDoc.data();


      // ======================================================
      // 4️⃣ التأكد أن المشرف مفعل
      // ======================================================

      if (
        adminData.active === false
      ) {

        await auth.signOut();

        alert(
          "🔴 حساب المشرف معطل حاليًا."
        );

        return;
      }


      // ======================================================
      // 5️⃣ حفظ بيانات الدخول
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
        user.email || email
      );


      // ======================================================
      // 6️⃣ الدخول إلى لوحة الإدارة
      // ======================================================

      setLogin(true);


    } catch (error) {

      console.error(
        "Admin login error:",
        error
      );


      let message =
        "❌ بيانات الدخول غير صحيحة.";


      if (
        error?.code ===
        "auth/invalid-credential"
      ) {

        message =
          "❌ البريد الإلكتروني أو كلمة المرور غير صحيحة.";

      } else if (
        error?.code ===
        "auth/user-not-found"
      ) {

        message =
          "❌ لا يوجد حساب بهذا البريد الإلكتروني.";

      } else if (
        error?.code ===
        "auth/wrong-password"
      ) {

        message =
          "❌ كلمة المرور غير صحيحة.";

      } else if (
        error?.code ===
        "auth/too-many-requests"
      ) {

        message =
          "⚠️ تم إجراء محاولات كثيرة، حاول مرة أخرى لاحقًا.";

      }


      alert(message);

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        direction: "rtl",
      }}
    >

      <div>

        <h2>
          🔐 تسجيل دخول الإدارة
        </h2>


        {/* EMAIL */}

        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={username}
          onChange={(e) =>
            setUsername(
              e.target.value
            )
          }
          disabled={loading}
        />


        <br />
        <br />


        {/* PASSWORD */}

        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          disabled={loading}
        />


        <br />
        <br />


        {/* LOGIN */}

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
        >

          {loading
            ? "⏳ جاري تسجيل الدخول..."
            : "دخول"}

        </button>

      </div>

    </div>

  );

}


export default Login;
