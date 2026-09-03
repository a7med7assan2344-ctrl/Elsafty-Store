import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import ReCAPTCHA from "react-google-recaptcha";

import { auth, db } from "../firebase";
import "./Auth.css";

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

function Register() {
  const navigate = useNavigate();

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

  const [captchaToken, setCaptchaToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleArrayItem = (setter, currentValue, item) => {
    setter(
      currentValue.includes(item)
        ? currentValue.filter((value) => value !== item)
        : [...currentValue, item]
    );
  };

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const handleCaptchaExpired = () => {
    setCaptchaToken(null);
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (loading) return;

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();
    const cleanWhatsapp = whatsapp.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      !cleanName ||
      !cleanPhone ||
      !cleanAddress ||
      !cleanWhatsapp ||
      !cleanEmail ||
      !gender ||
      !discoverySource
    ) {
      alert("من فضلك أكمل جميع البيانات المطلوبة.");
      return;
    }

    if (favoriteCategories.length === 0) {
      alert("من فضلك اختر قسمًا واحدًا على الأقل من الأقسام المفضلة.");
      return;
    }

    if (interests.length === 0) {
      alert("من فضلك اختر اهتمامًا واحدًا على الأقل.");
      return;
    }

    if (!captchaToken) {
      alert("من فضلك أكد أنك لست روبوتًا.");
      return;
    }

    if (password.length < 6) {
      alert("كلمة المرور يجب ألا تقل عن 6 أحرف.");
      return;
    }

    if (password !== confirmPassword) {
      alert("كلمتا المرور غير متطابقتين.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: cleanName,
      });

      try {
        await sendEmailVerification(user);
      } catch (verificationError) {
        console.warn(
          "Email verification could not be sent:",
          verificationError
        );
      }

      await setDoc(doc(db, "users", user.uid), {
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
      });

      alert(
        "تم إنشاء حسابك بنجاح 🎉\n\nتم إرسال رسالة تأكيد إلى بريدك الإلكتروني."
      );

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
      console.error("Register error:", error);

      let message = "حدث خطأ أثناء إنشاء الحساب.";

      switch (error?.code) {
        case "auth/email-already-in-use":
          message =
            "البريد الإلكتروني مستخدم بالفعل. جرّب تسجيل الدخول أو استخدم بريدًا آخر.";
          break;

        case "auth/invalid-email":
          message = "البريد الإلكتروني غير صحيح.";
          break;

        case "auth/weak-password":
          message = "كلمة المرور ضعيفة. استخدم كلمة مرور أقوى.";
          break;

        case "auth/network-request-failed":
          message =
            "حدثت مشكلة في الاتصال بالإنترنت. تأكد من اتصالك وحاول مرة أخرى.";
          break;

        case "permission-denied":
        case "firestore/permission-denied":
          message =
            "تم إنشاء الحساب لكن حدثت مشكلة في حفظ بيانات المستخدم. راجع صلاحيات Firestore.";
          break;

        default:
          if (error?.message) {
            console.error(error.message);
          }
          break;
      }

      alert(message);
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-register-page" dir="rtl">
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-glow auth-glow-one" />
        <div className="auth-glow auth-glow-two" />
        <div className="auth-grid" />
      </div>

      <div className="auth-container auth-register-container">
        {/* =========================
            HERO
        ========================== */}
        <section className="auth-hero">
          <div className="auth-hero-content">
            <Link to="/" className="auth-brand">
              <span className="auth-brand-mark">س</span>

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
              <span>بداية تجربة أفضل.</span>
            </h1>

            <p className="auth-hero-description">
              أنشئ حسابك واستمتع بتجربة تسوق أسهل، أسرع وأكثر
              تخصيصًا، مع متابعة طلباتك وعروضك المفضلة في مكان واحد.
            </p>

            <div className="auth-benefits">
              <div className="auth-benefit">
                <span className="auth-benefit-icon">✓</span>

                <div>
                  <strong>تجربة مخصصة</strong>
                  <small>عروض ومنتجات تناسب اهتماماتك</small>
                </div>
              </div>

              <div className="auth-benefit">
                <span className="auth-benefit-icon">✓</span>

                <div>
                  <strong>تابع طلباتك بسهولة</strong>
                  <small>كل طلباتك وبياناتك في حساب واحد</small>
                </div>
              </div>

              <div className="auth-benefit">
                <span className="auth-benefit-icon">✓</span>

                <div>
                  <strong>بياناتك بأمان</strong>
                  <small>حماية وأمان أثناء استخدام حسابك</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            REGISTER CARD
        ========================== */}
        <section className="auth-card auth-register-card">
          <div className="auth-mobile-brand">
            <Link to="/" className="auth-mobile-logo">
              <span className="auth-brand-mark">س</span>
              <span>ســـــَــــــــوا</span>
            </Link>
          </div>

          <div className="auth-header">
            <div className="auth-welcome-icon">✦</div>

            <div>
              <span className="auth-eyebrow">
                حساب جديد
              </span>

              <h2>أنشئ حسابك</h2>

              <p>
                املأ بياناتك واستمتع بتجربة ســـــَــــــــوا
              </p>
            </div>
          </div>

          <form
            className="auth-form auth-register-form"
            onSubmit={handleRegister}
          >
            {/* =========================
                PERSONAL DATA
            ========================== */}
            <div className="auth-section-title">
              <span>01</span>

              <div>
                <strong>بياناتك الأساسية</strong>
                <small>معلومات التواصل الخاصة بك</small>
              </div>
            </div>

            <div className="auth-form-grid">
              {/* الاسم */}
              <div className="auth-field">
                <label className="auth-label-row">
                  <span>الاسم بالكامل</span>
                  <b>*</b>
                </label>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">👤</span>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اكتب اسمك بالكامل"
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* الهاتف */}
              <div className="auth-field">
                <label className="auth-label-row">
                  <span>رقم الهاتف</span>
                  <b>*</b>
                </label>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">📱</span>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    autoComplete="tel"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* واتساب */}
              <div className="auth-field">
                <label className="auth-label-row">
                  <span>رقم الواتساب</span>
                  <b>*</b>
                </label>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">💬</span>

                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="رقم الواتساب"
                    autoComplete="tel"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* البريد */}
              <div className="auth-field">
                <label className="auth-label-row">
                  <span>البريد الإلكتروني</span>
                  <b>*</b>
                </label>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">✉</span>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  <span>النوع</span>
                  <b>*</b>
                </label>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">◉</span>

                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">اختر النوع</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
              </div>

              {/* مصدر المعرفة */}
              <div className="auth-field">
                <label className="auth-label-row">
                  <span>عرفتنا منين؟</span>
                  <b>*</b>
                </label>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">⌕</span>

                  <select
                    value={discoverySource}
                    onChange={(e) =>
                      setDiscoverySource(e.target.value)
                    }
                    disabled={loading}
                  >
                    <option value="">اختار مصدر</option>

                    {discoveryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* العنوان */}
            <div className="auth-field">
              <label className="auth-label-row">
                <span>العنوان</span>
                <b>*</b>
              </label>

              <div className="auth-input-wrap auth-textarea-wrap">
                <span className="auth-input-icon">⌂</span>

                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="اكتب عنوانك بالتفصيل"
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>

            {/* =========================
                PREFERENCES
            ========================== */}
            <div className="auth-section-title">
              <span>02</span>

              <div>
                <strong>اهتماماتك</strong>
                <small>
                  ساعدنا نعرض لك المنتجات والعروض المناسبة
                </small>
              </div>
            </div>

            <div className="auth-choice-group">
              <label className="auth-choice-label">
                الأقسام اللي بتحبها
                <b>*</b>
              </label>

              <div className="auth-chips">
                {categoryOptions.map((category) => {
                  const selected =
                    favoriteCategories.includes(category);

                  return (
                    <button
                      type="button"
                      key={category}
                      className={`auth-chip ${
                        selected ? "selected" : ""
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
                        {selected ? "✓" : "+"}
                      </span>

                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="auth-choice-group">
              <label className="auth-choice-label">
                إيه اللي يهمك؟
                <b>*</b>
              </label>

              <div className="auth-chips">
                {interestOptions.map((interest) => {
                  const selected =
                    interests.includes(interest);

                  return (
                    <button
                      type="button"
                      key={interest}
                      className={`auth-chip ${
                        selected ? "selected" : ""
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
                        {selected ? "✓" : "+"}
                      </span>

                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* =========================
                PASSWORD
            ========================== */}
            <div className="auth-section-title">
              <span>03</span>

              <div>
                <strong>تأمين الحساب</strong>
                <small>اختار كلمة مرور قوية لحسابك</small>
              </div>
            </div>

            <div className="auth-form-grid">
              {/* كلمة المرور */}
              <div className="auth-field">
                <label className="auth-label-row">
                  <span>كلمة المرور</span>
                  <b>*</b>
                </label>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">⌑</span>

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
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
                      setShowPassword((value) => !value)
                    }
                    aria-label={
                      showPassword
                        ? "إخفاء كلمة المرور"
                        : "إظهار كلمة المرور"
                    }
                    disabled={loading}
                  >
                    {showPassword ? "◉" : "◌"}
                  </button>
                </div>
              </div>

              {/* تأكيد كلمة المرور */}
              <div className="auth-field">
                <label className="auth-label-row">
                  <span>تأكيد كلمة المرور</span>
                  <b>*</b>
                </label>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">⌑</span>

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
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
                    {showConfirmPassword ? "◉" : "◌"}
                  </button>
                </div>
              </div>
            </div>

            {/* =========================
                CAPTCHA
            ========================== */}
            <div className="auth-captcha">
              <ReCAPTCHA
                sitekey={
                  import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""
                }
                onChange={handleCaptchaChange}
                onExpired={handleCaptchaExpired}
              />
            </div>

            {/* =========================
                SUBMIT
            ========================== */}
            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  جاري إنشاء الحساب...
                </>
              ) : (
                <>
                  <span>إنشاء الحساب</span>
                  <span className="auth-submit-arrow">←</span>
                </>
              )}
            </button>

            {/* =========================
                LOGIN
            ========================== */}
            <div className="auth-register">
              <span>عندك حساب بالفعل؟</span>

              <Link to="/login">
                تسجيل الدخول
              </Link>
            </div>

            {/* =========================
                BACK
            ========================== */}
            <Link to="/" className="auth-back">
              <span>→</span>
              العودة للمتجر
            </Link>

            <div className="auth-secure-note">
              <span>🔒</span>
              بياناتك محمية ويتم التعامل معها بأمان
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default Register;