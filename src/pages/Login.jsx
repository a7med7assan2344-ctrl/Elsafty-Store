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

      /*
        الحسابات الجديدة لازم تكون مؤكدة من Gmail
        قبل السماح لها بالدخول.
      */

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

        /*
          تسجيل الخروج فورًا حتى لا يظل المستخدم
          داخل الحساب وهو غير مؤكد.
        */

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
      // AUTH USER EXISTS BUT FIRESTORE USER MISSING
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


        {/* ==========================================
            EMAIL
        ========================================== */}

        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          disabled={loading}
          autoComplete="email"
          required
        />


        {/* ==========================================
            PASSWORD
        ========================================== */}

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
          autoComplete="current-password"
          required
        />


        {/* ==========================================
            LOGIN BUTTON
        ========================================== */}

        <button
          type="submit"
          disabled={loading}
        >

          {loading
            ? "⏳ جاري الدخول..."
            : "دخول"}

        </button>


        {/* ==========================================
            REGISTER
        ========================================== */}

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

export default Login;