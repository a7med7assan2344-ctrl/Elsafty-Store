import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  db,
  auth,
} from "../firebase";

import "./Account.css";

// ======================================================
// ACCOUNT PAGE
// ======================================================

function Account() {
  const navigate = useNavigate();

  // ======================================================
  // STATES
  // ======================================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [user, setUser] =
    useState(null);

  const [form, setForm] =
    useState({
      name: "",
      phone: "",
      email: "",
      address: "",
    });

  // ======================================================
  // LOAD USER
  // ======================================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {

          // ----------------------------------------------
          // NO USER
          // ----------------------------------------------

          if (!currentUser) {
            setUser(null);
            setLoading(false);
            return;
          }

          // ----------------------------------------------
          // SET FIREBASE USER
          // ----------------------------------------------

          setUser(currentUser);

          // ----------------------------------------------
          // LOAD FIRESTORE DATA
          // ----------------------------------------------

          try {
            const userRef = doc(
              db,
              "users",
              currentUser.uid
            );

            const userSnap =
              await getDoc(userRef);

            if (
              userSnap.exists()
            ) {
              const data =
                userSnap.data();

              setForm({
                name:
                  data.name ||
                  data.displayName ||
                  currentUser.displayName ||
                  "",

                phone:
                  data.phone ||
                  "",

                email:
                  data.email ||
                  currentUser.email ||
                  "",

                address:
                  data.address ||
                  "",
              });
            } else {
              // ------------------------------------------
              // FIRESTORE DOCUMENT DOES NOT EXIST
              // ------------------------------------------

              setForm({
                name:
                  currentUser.displayName ||
                  "",

                phone:
                  "",

                email:
                  currentUser.email ||
                  "",

                address:
                  "",
              });
            }

          } catch (error) {

            console.error(
              "Error loading account:",
              error
            );

            // ------------------------------------------
            // FALLBACK FIREBASE DATA
            // ------------------------------------------

            setForm({
              name:
                currentUser.displayName ||
                "",

              phone:
                "",

              email:
                currentUser.email ||
                "",

              address:
                "",
            });
          }

          setLoading(false);
        }
      );

    return () =>
      unsubscribe();

  }, []);

  // ======================================================
  // HANDLE INPUT CHANGE
  // ======================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  // ======================================================
  // SAVE ACCOUNT
  // ======================================================

  const handleSave = async (
    event
  ) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    try {
      setSaving(true);

      const userRef =
        doc(
          db,
          "users",
          user.uid
        );

      await updateDoc(
        userRef,
        {
          name:
            form.name.trim(),

          phone:
            form.phone.trim(),

          email:
            form.email.trim(),

          address:
            form.address.trim(),

          updatedAt:
            new Date(),
        }
      );

      alert(
        "تم حفظ بيانات الحساب بنجاح ✅"
      );

    } catch (error) {

      console.error(
        "Error saving account:",
        error
      );

      alert(
        "حدث خطأ أثناء حفظ البيانات"
      );

    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // BACK TO STORE
  // ======================================================

  const backToStore = () => {
    navigate("/");
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="account-page">

        <div className="account-loading">

          جاري تحميل بيانات الحساب... ⏳

        </div>

      </div>
    );
  }

  // ======================================================
  // USER NOT LOGGED IN
  // ======================================================

  if (!user) {
    return (
      <div className="account-page">

        <div className="account-container">

          <div className="account-card account-login-message">

            <div className="account-icon">
              👤
            </div>

            <h2>
              معلومات الحساب
            </h2>

            <p>
              يجب تسجيل الدخول أولًا
              لعرض معلومات حسابك.
            </p>

            <div className="account-actions">

              <button
                type="button"
                className="account-save-btn"
                onClick={() =>
                  navigate("/login")
                }
              >
                🔑 تسجيل الدخول
              </button>

              <button
                type="button"
                className="account-cancel-btn"
                onClick={
                  backToStore
                }
              >
                ← العودة للمتجر
              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }

  // ======================================================
  // ACCOUNT PAGE
  // ======================================================

  return (
    <div className="account-page">

      <div className="account-container">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="account-header">

          {/* BACK TO STORE */}

          <button
            type="button"
            className="account-back-btn"
            onClick={
              backToStore
            }
          >
            ← العودة للمتجر
          </button>

          {/* TITLE */}

          <div className="account-header-title">

            <div className="account-header-icon">
              👤
            </div>

            <div>

              <h1>
                معلومات الحساب
              </h1>

              <p>
                عرض وتعديل بيانات حسابك
              </p>

            </div>

          </div>

        </div>

        {/* ==================================================
            ACCOUNT CARD
        ================================================== */}

        <div className="account-card">

          {/* CARD TITLE */}

          <div className="account-card-title">

            <span>
              👤
            </span>

            <div>

              <h2>
                بياناتي الشخصية
              </h2>

              <p>
                يمكنك تعديل بياناتك
                وحفظ التغييرات
              </p>

            </div>

          </div>

          {/* ==================================================
              FORM
          ================================================== */}

          <form
            onSubmit={
              handleSave
            }
          >

            {/* ==================================================
                NAME
            ================================================== */}

            <div className="account-form-group">

              <label
                htmlFor="account-name"
              >
                الاسم
              </label>

              <input
                id="account-name"
                type="text"
                name="name"
                value={
                  form.name
                }
                onChange={
                  handleChange
                }
                placeholder="اكتب اسمك"
                autoComplete="name"
              />

            </div>

            {/* ==================================================
                PHONE
            ================================================== */}

            <div className="account-form-group">

              <label
                htmlFor="account-phone"
              >
                رقم الهاتف
              </label>

              <input
                id="account-phone"
                type="tel"
                name="phone"
                value={
                  form.phone
                }
                onChange={
                  handleChange
                }
                placeholder="01xxxxxxxxx"
                dir="ltr"
                autoComplete="tel"
              />

            </div>

            {/* ==================================================
                EMAIL
            ================================================== */}

            <div className="account-form-group">

              <label
                htmlFor="account-email"
              >
                البريد الإلكتروني
              </label>

              <input
                id="account-email"
                type="email"
                name="email"
                value={
                  form.email
                }
                onChange={
                  handleChange
                }
                placeholder="example@email.com"
                dir="ltr"
                autoComplete="email"
              />

            </div>

            {/* ==================================================
                ADDRESS
            ================================================== */}

            <div className="account-form-group">

              <label
                htmlFor="account-address"
              >
                العنوان
              </label>

              <textarea
                id="account-address"
                name="address"
                value={
                  form.address
                }
                onChange={
                  handleChange
                }
                placeholder="اكتب عنوانك بالتفصيل"
                rows="4"
                autoComplete="street-address"
              />

            </div>

            {/* ==================================================
                BUTTONS
            ================================================== */}

            <div className="account-actions">

              {/* SAVE */}

              <button
                type="submit"
                className="account-save-btn"
                disabled={
                  saving
                }
              >
                {saving
                  ? "جاري الحفظ..."
                  : "💾 حفظ التعديلات"}
              </button>

              {/* BACK */}

              <button
                type="button"
                className="account-cancel-btn"
                onClick={
                  backToStore
                }
              >
                ← العودة للمتجر
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}

// ======================================================
// EXPORT
// ======================================================

export default Account;