import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

import {
  doc,
  setDoc
} from "firebase/firestore";

import { auth, db } from "../firebase";

function Register() {

  const navigate = useNavigate();

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const register = async (e) => {

    e.preventDefault();

    if (password !== confirmPassword) {

      alert("كلمتا المرور غير متطابقتين");

      return;

    }

    try {

      setLoading(true);

      const result =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      await updateProfile(result.user, {
        displayName: name
      });

      await setDoc(
        doc(db, "users", result.user.uid),
        {
          uid: result.user.uid,
          name,
          email,
          phone,
          createdAt: new Date()
        }
      );

      alert("تم إنشاء الحساب بنجاح");

      navigate("/");

    } catch (err) {

      alert(err.message);

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="auth-page">

      <form
        className="auth-form"
        onSubmit={register}
      >

        <h2>إنشاء حساب</h2>

        <input
          placeholder="الاسم بالكامل"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
        />

        <input
          placeholder="رقم الموبايل"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
        />

        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="تأكيد كلمة المرور"
          value={confirmPassword}
          onChange={(e)=>setConfirmPassword(e.target.value)}
          required
        />

        <button type="submit">

          {loading ? "جارى الإنشاء..." : "إنشاء حساب"}

        </button>

        <p>

          لديك حساب؟

          <Link to="/login">

            تسجيل الدخول

          </Link>

        </p>

      </form>

    </div>

  );

}

export default Register;