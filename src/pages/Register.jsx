import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
  deleteUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import ReCAPTCHA from "react-google-recaptcha";

import { auth, db } from "../firebase";
import "./Auth.css";

// ==========================================================
// REGISTER OPTIONS
// ==========================================================

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

const interestOptions = [
  "العروض والخصومات",
  "المنتجات الجديدة",
  "الأكثر مبيعًا",
  "العروض الحصرية",
  "الشحن والتوصيل",
  "منتجات بأسعار منخفضة",
];

const discoveryOptions = [
  "فيسبوك",
  "إنستجرام",
  "تيك توك",
  "جوجل",
  "واتساب",
  "صديق أو قريب",
  "أخرى",
];

// ==========================================================
// HELPERS
// ==========================================================

const getRecaptchaSiteKey = () => {
  const key = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  return typeof key === "string" ? key.trim() : "";
};

// ==========================================================
// REGISTER
// ==========================================================

function Register() {
  const navigate = useNavigate();

  // ========================================================
  // FORM STATE
  // ========================================================

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const [gender, setGender] = useState("");
  const [favoriteCategories, setFavoriteCategories] = useState([]);
  const [interests, setInterests] = useState([]);
  const [discoverySource, setDiscoverySource] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ========================================================
  // CAPTCHA
  // ========================================================

  const [captchaToken, setCaptchaToken] = useState(null);

  // ========================================================
  // UI STATE
  // ========================================================

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // ========================================================
  // CAPTCHA SITE KEY
  // ========================================================

  const recaptchaSiteKey = getRecaptchaSiteKey();

  // ========================================================
  // ARRAY TOGGLE
  // ========================================================

  const toggleArrayItem = (
    setter,
    currentValue,
    item
  ) => {
    setter(
      currentValue.includes(item)
        ? currentValue.filter(
            (value) => value !== item
          )
        : [...currentValue, item]
    );
  };

  // ========================================================
  // CAPTCHA HANDLERS
  // ========================================================

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token || null);
  };

  const handleCaptchaExpired = () => {
    setCaptchaToken(null);
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
  };

  // ========================================================
  // REGISTER
  // ========================================================

  const handleRegister = async (event) => {
    event.preventDefault();

    if (loading) return;

    // ------------------------------------------------------
    // CAPTCHA CONFIG CHECK
    // ------------------------------------------------------

    if (!recaptchaSiteKey) {
      alert(
        "إعداد التحقق الأمني غير مكتمل.\n\n" +
          "أضف VITE_RECAPTCHA_SITE_KEY إلى ملف .env " +
          "ثم أعد تشغيل المشروع."
      );

      return;
    }

    // ------------------------------------------------------
    // CLEAN DATA
    // ------------------------------------------------------

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();
    const cleanWhatsapp = whatsapp.trim();
    const cleanEmail = email
      .trim()
      .toLowerCase();

    // ------------------------------------------------------
    // REQUIRED DATA
    // ------------------------------------------------------

    if (
      !cleanName ||
      !cleanPhone ||
      !cleanAddress ||
      !cleanWhatsapp ||
      !cleanEmail ||
      !gender ||
      !discoverySource
    ) {
      alert(
        "من فضلك أكمل جميع البيانات المطلوبة."
      );

      return;
    }

    // ------------------------------------------------------
    // FAVORITE CATEGORIES
    // ------------------------------------------------------

    if (favoriteCategories.length === 0) {
      alert(
        "من فضلك اختر قسمًا واحدًا على الأقل من الأقسام المفضلة."
      );

      return;
    }

    // ------------------------------------------------------
    // INTERESTS
    // ------------------------------------------------------

    if (interests.length === 0) {
      alert(
        "من فضلك اختر اهتمامًا واحدًا على الأقل."
      );

      return;
    }

    // ------------------------------------------------------
    // CAPTCHA
    // ------------------------------------------------------

    if (!captchaToken) {
      alert(
        "من فضلك أكد أنك لست روبوتًا."
      );

      return;
    }

    // ------------------------------------------------------
    // PASSWORD
    // ------------------------------------------------------

    if (password.length < 6) {
      alert(
        "كلمة المرور يجب ألا تقل عن 6 أحرف."
      );

      return;
    }

    if (password !== confirmPassword) {
      alert(
        "كلمتا المرور غير متطابقتين."
      );

      return;
    }

    // ------------------------------------------------------
    // START
    // ------------------------------------------------------

    setLoading(true);

    let createdUser = null;

    try {
      // ====================================================
      // CREATE FIREBASE AUTH USER
      // ====================================================

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      const user = userCredential.user;

      createdUser = user;

      // ====================================================
      // UPDATE PROFILE
      // ====================================================

      await updateProfile(user, {
        displayName: cleanName,
      });

      // ====================================================
      // EMAIL VERIFICATION
      // ====================================================

      try {
        await sendEmailVerification(user);
      } catch (verificationError) {
        console.warn(
          "Email verification could not be sent:",
          verificationError
        );
      }

      // ====================================================
      // SAVE USER DATA
      // ====================================================

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,

          name: cleanName,
          displayName: cleanName,
          fullName: cleanName,

          email: cleanEmail,

          phone: cleanPhone,
          whatsapp: cleanWhatsapp,
          address: cleanAddress,

          gender,

          favoriteCategories,
          interests,
          discoverySource,

          role: "user",
          active: true,

          emailVerified: false,

          loginCount: 0,
          lastLoginAt: null,

          visits: {
            register: 1,
          },

          createdAt: serverTimestamp(),
          registeredAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      // ====================================================
      // SUCCESS
      // ====================================================

      alert(
        "تم إنشاء حسابك بنجاح 🎉\n\n" +
          "تم إرسال رسالة تأكيد إلى بريدك الإلكتروني."
      );

      // ====================================================
      // SIGN OUT
      // ====================================================

      try {
        await signOut(auth);
      } catch (signOutError) {
        console.warn(
          "Sign out after registration failed:",
          signOutError
        );
      }

      setCaptchaToken(null);

      navigate("/");
    } catch (error) {
      console.error(
        "Register error:",
        error
      );

      // ====================================================
      // ROLLBACK AUTH USER
      // ====================================================
      // لو الحساب اتعمل في Firebase Auth
      // لكن حفظ بيانات users فشل، نحاول نحذف الحساب
      // حتى لا يتبقى حساب ناقص.

      if (
        createdUser &&
        error?.code !==
          "auth/email-already-in-use"
      ) {
        try {
          await deleteUser(createdUser);
        } catch (deleteError) {
          console.warn(
            "Could not rollback created user:",
            deleteError
          );

          try {
            await signOut(auth);
          } catch (signOutError) {
            console.warn(
              "Rollback sign out failed:",
              signOutError
            );
          }
        }
      }

      // ====================================================
      // ERROR MESSAGE
      // ====================================================

      let message =
        "حدث خطأ أثناء إنشاء الحساب.";

      switch (error?.code) {
        case "auth/email-already-in-use":
          message =
            "البريد الإلكتروني مستخدم بالفعل. جرّب تسجيل الدخول أو استخدم بريدًا آخر.";
          break;

        case "auth/invalid-email":
          message =
            "البريد الإلكتروني غير صحيح.";
          break;

        case "auth/weak-password":
          message =
            "كلمة المرور ضعيفة. استخدم كلمة مرور أقوى.";
          break;

        case "auth/network-request-failed":
          message =
            "حدثت مشكلة في الاتصال بالإنترنت. تأكد من اتصالك وحاول مرة أخرى.";
          break;

        case "auth/too-many-requests":
          message =
            "تم تنفيذ محاولات كثيرة. حاول مرة أخرى بعد قليل.";
          break;

        case "permission-denied":
        case "firestore/permission-denied":
          message =
            "حدثت مشكلة في حفظ بيانات المستخدم. تأكد من صلاحيات Firestore.";
          break;

        default:
          if (
            typeof error?.message ===
            "string"
          ) {
            console.error(
              error.message
            );
          }
          break;
      }

      alert(message);

      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <main
      className="auth-page auth-register-page"
      dir="rtl"
    >
      {/* ====================================================
          BACKGROUND
      ==================================================== */}

      <div
        className="auth-bg"
        aria-hidden="true"
      >
        <div className="auth-glow auth-glow-one" />
        <div className="auth-glow auth-glow-two" />
        <div className="auth-grid" />
      </div>

      <div className="auth-container auth-register-container">

        {/* ==================================================
            HERO
        ================================================== */}

        <section className="auth-hero">
          <div className="auth-hero-content">

            <Link
              to="/"
              className="auth-brand"
            >
              <span className="auth-brand-mark">
                س
              </span>

              <span className="auth-brand-name">
                ســـــَــــــــوا
              </span>
            </Link>

            <div className="auth-hero-badge">
              <span className="auth-badge-dot" />

              انضم لعائلة ســـــَــــــــوا
            </div>

            <h1>
              حسابك هو
              <br />

              <span>
                بداية تجربة أفضل.
              </span>
            </h1>

            <p className="auth-hero-description">
              أنشئ حسابك واستمتع بتجربة تسوق
              أسهل، أسرع وأكثر تخصيصًا، مع
              متابعة طلباتك وعروضك المفضلة
              في مكان واحد.
            </p>

            <div className="auth-benefits">

              <div className="auth-benefit">
                <span className="auth-benefit-icon">
                  ✓
                </span>

                <div>
                  <strong>
                    تجربة مخصصة
                  </strong>

                  <small>
                    عروض ومنتجات تناسب
                    اهتماماتك
                  </small>
                </div>
              </div>

              <div className="auth-benefit">
                <span className="auth-benefit-icon">
                  ✓
                </span>

                <div>
                  <strong>
                    تابع طلباتك بسهولة
                  </strong>

                  <small>
                    كل طلباتك وبياناتك في
                    حساب واحد
                  </small>
                </div>
              </div>

              <div className="auth-benefit">
                <span className="auth-benefit-icon">
                  ✓
                </span>

                <div>
                  <strong>
                    بياناتك بأمان
                  </strong>

                  <small>
                    حماية وأمان أثناء
                    استخدام حسابك
                  </small>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ==================================================
            REGISTER CARD
        ================================================== */}

        <section className="auth-card auth-register-card">

          {/* MOBILE BRAND */}

          <div className="auth-mobile-brand">
            <Link
              to="/"
              className="auth-mobile-logo"
            >
              <span className="auth-brand-mark">
                س
              </span>

              <span>
                ســـــَــــــــوا
              </span>
            </Link>
          </div>

          {/* HEADER */}

          <div className="auth-header">

            <div className="auth-welcome-icon">
              ✦
            </div>

            <div>
              <span className="auth-eyebrow">
                حساب جديد
              </span>

              <h2>
                أنشئ حسابك
              </h2>

              <p>
                املأ بياناتك واستمتع بتجربة
                ســـــَــــــــوا
              </p>
            </div>

          </div>

          <form
            className="auth-form auth-register-form"
            onSubmit={handleRegister}
          >

            {/* =================================================
                PERSONAL DATA
            ================================================= */}

            <div className="auth-section-title">

              <span>
                01
              </span>

              <div>
                <strong>
                  بياناتك الأساسية
                </strong>

                <small>
                  معلومات التواصل الخاصة بك
                </small>
              </div>

            </div>

            <div className="auth-form-grid">

              {/* الاسم */}

              <div className="auth-field">

                <label className="auth-label-row">
                  <span>
                    الاسم بالكامل
                  </span>

                  <b>*</b>
                </label>

                <div className="auth-input-wrap">

                  <span className="auth-input-icon">
                    👤
                  </span>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="اكتب اسمك بالكامل"
                    autoComplete="name"
                    disabled={loading}
                  />

                </div>

              </div>

              {/* الهاتف */}

              <div className="auth-field">

                <label className="auth-label-row">
                  <span>
                    رقم الهاتف
                  </span>

                  <b>*</b>
                </label>

                <div className="auth-input-wrap">

                  <span className="auth-input-icon">
                    📱
                  </span>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    placeholder="01xxxxxxxxx"
                    autoComplete="tel"
                    disabled={loading}
                  />

                </div>

              </div>

              {/* واتساب */}

              <div className="auth-field">

                <label className="auth-label-row">
                  <span>
                    رقم الواتساب
                  </span>

                  <b>*</b>
                </label>

                <div className="auth-input-wrap">

                  <span className="auth-input-icon">
                    💬
                  </span>

                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) =>
                      setWhatsapp(
                        e.target.value
                      )
                    }
                    placeholder="رقم الواتساب"
                    autoComplete="tel"
                    disabled={loading}
                  />

                </div>

              </div>

              {/* البريد */}

              <div className="auth-field">

                <label className="auth-label-row">
                  <span>
                    البريد الإلكتروني
                  </span>

                  <b>*</b>
                </label>

                <div className="auth-input-wrap">

                  <span className="auth-input-icon">
                    ✉
                  </span>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    placeholder="example@email.com"
                    autoComplete="email"
                    dir="ltr"
                    disabled={loading}
                  />

                </div>

              </div>

              {/* النوع */}

              <div className="auth-field">

                <label className="auth-label-row">
                  <span>
                    النوع
                  </span>

                  <b>*</b>
                </label>

                <div className="auth-input-wrap">

                  <span className="auth-input-icon">
                    ◉
                  </span>

                  <select
                    value={gender}
                    onChange={(e) =>
                      setGender(
                        e.target.value
                      )
                    }
                    disabled={loading}
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

                </div>

              </div>

              {/* مصدر المعرفة */}

              <div className="auth-field">

                <label className="auth-label-row">
                  <span>
                    عرفتنا منين؟
                  </span>

                  <b>*</b>
                </label>

                <div className="auth-input-wrap">

                  <span className="auth-input-icon">
                    ⌕
                  </span>

                  <select
                    value={
                      discoverySource
                    }
                    onChange={(e) =>
                      setDiscoverySource(
                        e.target.value
                      )
                    }
                    disabled={loading}
                  >

                    <option value="">
                      اختار مصدر
                    </option>

                    {discoveryOptions.map(
                      (option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

            </div>

            {/* العنوان */}

            <div className="auth-field">

              <label className="auth-label-row">
                <span>
                  العنوان
                </span>

                <b>*</b>
              </label>

              <div className="auth-input-wrap auth-textarea-wrap">

                <span className="auth-input-icon">
                  ⌂
                </span>

                <textarea
                  value={address}
                  onChange={(e) =>
                    setAddress(
                      e.target.value
                    )
                  }
                  placeholder="اكتب عنوانك بالتفصيل"
                  rows={3}
                  disabled={loading}
                />

              </div>

            </div>

            {/* =================================================
                PREFERENCES
            ================================================= */}

            <div className="auth-section-title">

              <span>
                02
              </span>

              <div>
                <strong>
                  اهتماماتك
                </strong>

                <small>
                  ساعدنا نعرض لك المنتجات
                  والعروض المناسبة
                </small>
              </div>

            </div>

            {/* CATEGORIES */}

            <div className="auth-choice-group">

              <label className="auth-choice-label">

                الأقسام اللي بتحبها

                <b>*</b>

              </label>

              <div className="auth-chips">

                {categoryOptions.map(
                  (category) => {

                    const selected =
                      favoriteCategories.includes(
                        category
                      );

                    return (
                      <button
                        type="button"
                        key={category}
                        className={`auth-chip ${
                          selected
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          toggleArrayItem(
                            setFavoriteCategories,
                            favoriteCategories,
                            category
                          )
                        }
                        disabled={loading}
                      >

                        <span className="auth-chip-check">
                          {selected
                            ? "✓"
                            : "+"}
                        </span>

                        {category}

                      </button>
                    );
                  }
                )}

              </div>

            </div>

            {/* INTERESTS */}

            <div className="auth-choice-group">

              <label className="auth-choice-label">

                إيه اللي يهمك؟

                <b>*</b>

              </label>

              <div className="auth-chips">

                {interestOptions.map(
                  (interest) => {

                    const selected =
                      interests.includes(
                        interest
                      );

                    return (
                      <button
                        type="button"
                        key={interest}
                        className={`auth-chip ${
                          selected
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          toggleArrayItem(
                            setInterests,
                            interests,
                            interest
                          )
                        }
                        disabled={loading}
                      >

                        <span className="auth-chip-check">
                          {selected
                            ? "✓"
                            : "+"}
                        </span>

                        {interest}

                      </button>
                    );
                  }
                )}

              </div>

            </div>

            {/* =================================================
                PASSWORD
            ================================================= */}

            <div className="auth-section-title">

              <span>
                03
              </span>

              <div>
                <strong>
                  تأمين الحساب
                </strong>

                <small>
                  اختار كلمة مرور قوية لحسابك
                </small>
              </div>

            </div>

            <div className="auth-form-grid">

              {/* PASSWORD */}

              <div className="auth-field">

                <label className="auth-label-row">
                  <span>
                    كلمة المرور
                  </span>

                  <b>*</b>
                </label>

                <div className="auth-input-wrap">

                  <span className="auth-input-icon">
                    ⌑
                  </span>

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="6 أحرف على الأقل"
                    autoComplete="new-password"
                    dir="ltr"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    aria-label={
                      showPassword
                        ? "إخفاء كلمة المرور"
                        : "إظهار كلمة المرور"
                    }
                    disabled={loading}
                  >
                    {showPassword
                      ? "◉"
                      : "◌"}
                  </button>

                </div>

              </div>

              {/* CONFIRM PASSWORD */}

              <div className="auth-field">

                <label className="auth-label-row">
                  <span>
                    تأكيد كلمة المرور
                  </span>

                  <b>*</b>
                </label>

                <div className="auth-input-wrap">

                  <span className="auth-input-icon">
                    ⌑
                  </span>

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="أعد كتابة كلمة المرور"
                    autoComplete="new-password"
                    dir="ltr"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "إخفاء كلمة المرور"
                        : "إظهار كلمة المرور"
                    }
                    disabled={loading}
                  >
                    {showConfirmPassword
                      ? "◉"
                      : "◌"}
                  </button>

                </div>

              </div>

            </div>

            {/* =================================================
                CAPTCHA
            ================================================= */}

            <div className="auth-captcha">

              {recaptchaSiteKey ? (
                <ReCAPTCHA
                  sitekey={recaptchaSiteKey}
                  onChange={
                    handleCaptchaChange
                  }
                  onExpired={
                    handleCaptchaExpired
                  }
                  onErrored={
                    handleCaptchaError
                  }
                />
              ) : (
                <div className="auth-captcha-missing">

                  <span>
                    ⚠️
                  </span>

                  <div>
                    <strong>
                      التحقق الأمني غير مُفعّل
                    </strong>

                    <small>
                      أضف VITE_RECAPTCHA_SITE_KEY
                      إلى ملف .env ثم أعد تشغيل
                      المشروع.
                    </small>
                  </div>

                </div>
              )}

            </div>

            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading || !recaptchaSiteKey}
            >

              {loading ? (
                <>
                  <span className="auth-spinner" />

                  جاري إنشاء الحساب...
                </>
              ) : (
                <>
                  <span>
                    إنشاء الحساب
                  </span>

                  <span className="auth-submit-arrow">
                    ←
                  </span>
                </>
              )}

            </button>

            {/* =================================================
                LOGIN
            ================================================= */}

            <div className="auth-register">

              <span>
                عندك حساب بالفعل؟
              </span>

              <Link to="/login">
                تسجيل الدخول
              </Link>

            </div>

            {/* =================================================
                BACK
            ================================================= */}

            <Link
              to="/"
              className="auth-back"
            >
              <span>
                →
              </span>

              العودة للمتجر
            </Link>

            {/* =================================================
                SECURITY NOTE
            ================================================= */}

            <div className="auth-secure-note">

              <span>
                🔒
              </span>

              بياناتك محمية ويتم التعامل
              معها بأمان

            </div>

          </form>
        </section>
      </div>
    </main>
  );
}

export default Register;