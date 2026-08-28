const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

setGlobalOptions({
  maxInstances: 10,
});

// ============================================================
// CREATE ADMIN ACCOUNT
// ============================================================

exports.createAdminAccount = onCall(async (request) => {
  // ----------------------------------------------------------
  // التأكد أن المستخدم الحالي أدمن
  // ----------------------------------------------------------

  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "يجب تسجيل الدخول أولاً"
    );
  }

  const db = getFirestore();
  const auth = getAuth();

  // ----------------------------------------------------------
  // التحقق من الأدمن الحالي
  // ----------------------------------------------------------

  const currentAdminSnapshot = await db
    .collection("admins")
    .where("email", "==", request.auth.token.email || "")
    .limit(1)
    .get();

  if (currentAdminSnapshot.empty) {
    throw new HttpsError(
      "permission-denied",
      "ليس لديك صلاحية لإنشاء مشرف"
    );
  }

  const currentAdmin =
    currentAdminSnapshot.docs[0].data();

  if (currentAdmin.active === false) {
    throw new HttpsError(
      "permission-denied",
      "حساب المشرف الحالي معطل"
    );
  }

  // ----------------------------------------------------------
  // البيانات القادمة من Admin.jsx
  // ----------------------------------------------------------

  const {
    name,
    email,
    password,
    permissions,
    active,
  } = request.data || {};

  if (!name || !String(name).trim()) {
    throw new HttpsError(
      "invalid-argument",
      "اسم المشرف مطلوب"
    );
  }

  if (!email || !String(email).trim()) {
    throw new HttpsError(
      "invalid-argument",
      "البريد الإلكتروني مطلوب"
    );
  }

  if (!password || String(password).length < 6) {
    throw new HttpsError(
      "invalid-argument",
      "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
    );
  }

  if (
    !Array.isArray(permissions) ||
    permissions.length === 0
  ) {
    throw new HttpsError(
      "invalid-argument",
      "يجب اختيار صلاحية واحدة على الأقل"
    );
  }

  // ----------------------------------------------------------
  // إنشاء حساب Firebase Authentication
  // ----------------------------------------------------------

  let firebaseUser;

  try {
    firebaseUser = await auth.createUser({
      email: String(email)
        .trim()
        .toLowerCase(),

      password: String(password),

      displayName:
        String(name).trim(),

      disabled:
        active === false,
    });

  } catch (error) {

    if (
      error.code ===
      "auth/email-already-exists"
    ) {
      throw new HttpsError(
        "already-exists",
        "هذا البريد الإلكتروني مستخدم بالفعل"
      );
    }

    console.error(
      "Firebase Auth error:",
      error
    );

    throw new HttpsError(
      "internal",
      "حدث خطأ أثناء إنشاء حساب المشرف"
    );
  }

  // ----------------------------------------------------------
  // حفظ بيانات المشرف في Firestore
  // ----------------------------------------------------------

  try {

    await db
      .collection("admins")
      .doc(firebaseUser.uid)
      .set({
        uid: firebaseUser.uid,

        name:
          String(name).trim(),

        email:
          String(email)
            .trim()
            .toLowerCase(),

        role:
          "admin",

        permissions,

        active:
          active !== false,

        createdAt:
          FieldValue.serverTimestamp(),

        updatedAt:
          FieldValue.serverTimestamp(),
      });

    return {
      success: true,

      uid:
        firebaseUser.uid,

      message:
        "تم إنشاء حساب المشرف بنجاح",
    };

  } catch (error) {

    // لو Firestore فشل نحذف حساب Auth
    // حتى لا يتبقى حساب ناقص

    try {
      await auth.deleteUser(
        firebaseUser.uid
      );
    } catch (deleteError) {
      console.error(
        "Rollback Auth error:",
        deleteError
      );
    }

    console.error(
      "Firestore admin creation error:",
      error
    );

    throw new HttpsError(
      "internal",
      "حدث خطأ أثناء حفظ بيانات المشرف"
    );
  }
});