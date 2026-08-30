import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import ReCAPTCHA from "react-google-recaptcha";

import { auth, db } from "../firebase";

function Register() {
  const navigate = useNavigate();

  // ==================================================
  // BASIC DATA
  // ==================================================

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  // ==================================================
  // PERSONAL DATA
  // ==================================================

  const [gender, setGender] = useState("");

  const [favoriteCategories, setFavoriteCategories] =
    useState([]);

  const [interests, setInterests] =
    useState([]);

  const [discoverySource, setDiscoverySource] =
    useState("");

  // ==================================================
  // PASSWORD
  // ==================================================

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  // ==================================================
  // GOOGLE reCAPTCHA
  // ==================================================

  const [captchaToken, setCaptchaToken] =
    useState(null);

  // ==================================================
  // LOADING
  // ==================================================

  const [loading, setLoading] = useState(false);

  // ==================================================
  // CATEGORY OPTIONS
  // ==================================================

  const categoryOptions = [
    "ملابس",
    "أحذية",
    "ساعات",
    "إكسسوارات",
    "مأكولات",
    "أجهزة",
    "مستلزمات منزلية",
    "عطور",
    "مستحضرات تجميل",
    "أخرى",
  ];

  // ==================================================
  // INTEREST OPTIONS
  // ==================================================

  const interestOptions = [
    "العروض والخصومات",
    "المنتجات الجديدة",
    "الأكثر مبيعًا",
    "العروض الحصرية",
    "الشحن والتوصيل",
    "منتجات بأسعار منخفضة",
  ];

  // ==================================================
  // TOGGLE ARRAY ITEM
  // ==================================================

  const toggleArrayItem = (value, setter) => {
    setter((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }

      return [...prev, value];
    });
  };

  // ==================================================
  // CAPTCHA CHANGE
  // ==================================================

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  // ==================================================
  // CAPTCHA EXPIRED
  // ==================================================

  const handleCaptchaExpired = () => {
    setCaptchaToken(null);
  };

  // ==================================================
  // CAPTCHA ERROR
  // ==================================================

  const handleCaptchaError = () => {
    setCaptchaToken(null);

    alert(
      "حدث خطأ في التحقق من Google reCAPTCHA، حاول مرة أخرى."
    );
  };

  // ==================================================
  // REGISTER
  // ==================================================

  const register = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    // ==================================================
    // CLEAN DATA
    // ==================================================

    const cleanName = name.trim();

    const cleanPhone = phone.trim();

    const cleanAddress = address.trim();

    const cleanWhatsapp = whatsapp.trim();

    const cleanEmail = email.trim().toLowerCase();

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!cleanName) {
      alert("برجاء إدخال الاسم بالكامل");
      return;
    }

    if (!cleanPhone) {
      alert("برجاء إدخال رقم الهاتف");
      return;
    }

    if (!cleanAddress) {
      alert("برجاء إدخال العنوان");
      return;
    }

    if (!cleanWhatsapp) {
      alert("برجاء إدخال رقم الواتساب");
      return;
    }

    if (!cleanEmail) {
      alert("برجاء إدخال البريد الإلكتروني");
      return;
    }

    if (!gender) {
      alert("برجاء اختيار النوع");
      return;
    }

    if (favoriteCategories.length === 0) {
      alert(
        "برجاء اختيار فئة واحدة مفضلة على الأقل"
      );
      return;
    }

    if (interests.length === 0) {
      alert(
        "برجاء اختيار اهتمام واحد على الأقل"
      );
      return;
    }

    if (!discoverySource) {
      alert(
        "برجاء اختيار عرفت المتجر منين"
      );
      return;
    }

    // ==================================================
    // reCAPTCHA VALIDATION
    // ==================================================

    if (!captchaToken) {
      alert(
        "برجاء إكمال التحقق من Google reCAPTCHA أولاً"
      );
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
      alert(
        "كلمتا المرور غير متطابقتين"
      );
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
      // UPDATE FIREBASE PROFILE
      // ==================================================

      await updateProfile(user, {
        displayName: cleanName,
      });

      // ==================================================
      // SEND EMAIL VERIFICATION
      // ==================================================

      await sendEmailVerification(user);

      // ==================================================
      // FIRESTORE USER
      // ==================================================

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      // ==================================================
      // SAVE USER
      // ==================================================

      await setDoc(userRef, {
        // ----------------------------------------------
        // ID
        // ----------------------------------------------

        uid: user.uid,

        // ----------------------------------------------
        // NAME
        // ----------------------------------------------

        name: cleanName,

        displayName: cleanName,

        fullName: cleanName,

        // ----------------------------------------------
        // CONTACT
        // ----------------------------------------------

        email: cleanEmail,

        phone: cleanPhone,

        whatsapp: cleanWhatsapp,

        address: cleanAddress,

        // ----------------------------------------------
        // PERSONAL
        // ----------------------------------------------

        gender: gender,

        favoriteCategories:
          favoriteCategories,

        interests: interests,

        discoverySource:
          discoverySource,

        // ----------------------------------------------
        // ROLE
        // ----------------------------------------------

        role: "user",

        // ----------------------------------------------
        // ACCOUNT STATUS
        // ----------------------------------------------

        active: true,

        emailVerified: false,

        // ----------------------------------------------
        // LOGIN
        // ----------------------------------------------

        loginCount: 0,

        lastLoginAt: null,

        // ----------------------------------------------
        // VISITS
        // ----------------------------------------------

        visits: [
          {
            date:
              new Date().toISOString(),

            type: "register",
          },
        ],

        // ----------------------------------------------
        // DATES
        // ----------------------------------------------

        createdAt:
          serverTimestamp(),

        registeredAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      });

      // ==================================================
      // SUCCESS
      // ==================================================

      alert(
        "تم إنشاء الحساب بنجاح ✅\n\n" +
        "📧 تم إرسال رسالة تأكيد إلى بريدك الإلكتروني.\n\n" +
        "افتح Gmail واضغط على رابط تأكيد الحساب، ثم سجل الدخول."
      );

      // ==================================================
      // SIGN OUT
      // ==================================================

      await auth.signOut();

      // ==================================================
      // RESET CAPTCHA
      // ==================================================

      setCaptchaToken(null);

      // ==================================================
      // GO LOGIN
      // ==================================================

      navigate("/login");

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
          إنشاء حساب جديد
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
            PHONE
        ============================================ */}

        <input
          type="tel"
          inputMode="tel"
          placeholder="رقم الهاتف"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
          disabled={loading}
          autoComplete="tel"
          required
        />

        {/* ============================================
            WHATSAPP
        ============================================ */}

        <input
          type="tel"
          inputMode="tel"
          placeholder="رقم الواتساب"
          value={whatsapp}
          onChange={(e) =>
            setWhatsapp(e.target.value)
          }
          disabled={loading}
          autoComplete="tel"
          required
        />

        {/* ============================================
            ADDRESS
        ============================================ */}

        <textarea
          placeholder="العنوان بالتفصيل"
          value={address}
          onChange={(e) =>
            setAddress(e.target.value)
          }
          disabled={loading}
          rows="3"
          required
        />

        {/* ============================================
            EMAIL
        ============================================ */}

        <input
          type="email"
          placeholder="البريد الإلكتروني / Gmail"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          disabled={loading}
          autoComplete="email"
          required
        />

        {/* ============================================
            GENDER
        ============================================ */}

        <label className="auth-field-label">
          النوع
        </label>

        <select
          value={gender}
          onChange={(e) =>
            setGender(e.target.value)
          }
          disabled={loading}
          required
        >

          <option value="">
            اختر النوع
          </option>

          <option value="male">
            ذكر
          </option>

          <option value="female">
            أنثى
          </option>

        </select>

        {/* ============================================
            FAVORITE CATEGORIES
        ============================================ */}

        <div className="auth-options-group">

          <strong>
            الفئات المفضلة
          </strong>

          <p>
            اختار المنتجات التي تهمك
          </p>

          <div className="auth-options">

            {categoryOptions.map(
              (category) => (

                <label
                  key={category}
                  className="auth-option"
                >

                  <input
                    type="checkbox"
                    checked={favoriteCategories.includes(
                      category
                    )}
                    onChange={() =>
                      toggleArrayItem(
                        category,
                        setFavoriteCategories
                      )
                    }
                    disabled={loading}
                  />

                  <span>
                    {category}
                  </span>

                </label>

              )
            )}

          </div>

        </div>

        {/* ============================================
            INTERESTS
        ============================================ */}

        <div className="auth-options-group">

          <strong>
            اهتماماتك
          </strong>

          <p>
            اختار ما تحب أن يصلك عنه عروض
          </p>

          <div className="auth-options">

            {interestOptions.map(
              (interest) => (

                <label
                  key={interest}
                  className="auth-option"
                >

                  <input
                    type="checkbox"
                    checked={interests.includes(
                      interest
                    )}
                    onChange={() =>
                      toggleArrayItem(
                        interest,
                        setInterests
                      )
                    }
                    disabled={loading}
                  />

                  <span>
                    {interest}
                  </span>

                </label>

              )
            )}

          </div>

        </div>

        {/* ============================================
            DISCOVERY SOURCE
        ============================================ */}

        <label className="auth-field-label">
          عرفتنا منين؟
        </label>

        <select
          value={discoverySource}
          onChange={(e) =>
            setDiscoverySource(
              e.target.value
            )
          }
          disabled={loading}
          required
        >

          <option value="">
            اختر إجابة
          </option>

          <option value="facebook">
            فيسبوك
          </option>

          <option value="instagram">
            إنستجرام
          </option>

          <option value="tiktok">
            تيك توك
          </option>

          <option value="google">
            جوجل
          </option>

          <option value="whatsapp">
            واتساب
          </option>

          <option value="friend">
            عن طريق صديق
          </option>

          <option value="advertisement">
            إعلان
          </option>

          <option value="other">
            أخرى
          </option>

        </select>

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
            GOOGLE reCAPTCHA
        ============================================ */}

        <div className="captcha-box">

          <ReCAPTCHA
            sitekey="6LeQjJ8tAAAAAM0rtOjkTfaUBr-dV7yfD57bg6BS"
            onChange={handleCaptchaChange}
            onExpired={handleCaptchaExpired}
            onErrored={handleCaptchaError}
          />

          <small>
            تحقق من Google للتأكد أنك لست روبوت 🤖
          </small>

        </div>

        {/* ============================================
            EMAIL VERIFICATION NOTICE
        ============================================ */}

        <div className="email-verification-notice">

          📧 بعد إنشاء الحساب سيتم إرسال
          رسالة تأكيد إلى Gmail الخاص بك.

        </div>

        {/* ============================================
            SUBMIT
        ============================================ */}

        <button
          type="submit"
          disabled={
            loading ||
            !captchaToken
          }
        >

          {loading
            ? "⏳ جاري إنشاء الحساب..."
            : "إنشاء الحساب"}

        </button>

        {/* ============================================
            LOGIN
        ============================================ */}

        <p>

          لديك حساب بالفعل؟

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
