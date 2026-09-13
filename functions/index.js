const {
  onCall,
  HttpsError,
} = require("firebase-functions/v2/https");

const {
  setGlobalOptions,
} = require("firebase-functions");

const {
  getAuth,
} = require("firebase-admin/auth");

const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

const {
  initializeApp,
} = require("firebase-admin/app");


// ============================================================
// INITIALIZE FIREBASE ADMIN
// ============================================================

initializeApp();

setGlobalOptions({
  maxInstances: 10,
});


// ============================================================
// CREATE ADMIN ACCOUNT
// ============================================================

exports.createAdminAccount = onCall(
  async (request) => {

    // ----------------------------------------------------------
    // التأكد أن المستخدم الحالي مسجل دخول
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

    const currentAdminSnapshot =
      await db
        .collection("admins")
        .where(
          "email",
          "==",
          request.auth.token.email || ""
        )
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

    if (
      currentAdmin.active === false
    ) {
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

    if (
      !name ||
      !String(name).trim()
    ) {
      throw new HttpsError(
        "invalid-argument",
        "اسم المشرف مطلوب"
      );
    }

    if (
      !email ||
      !String(email).trim()
    ) {
      throw new HttpsError(
        "invalid-argument",
        "البريد الإلكتروني مطلوب"
      );
    }

    if (
      !password ||
      String(password).length < 6
    ) {
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

      firebaseUser =
        await auth.createUser({
          email:
            String(email)
              .trim()
              .toLowerCase(),

          password:
            String(password),

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

          uid:
            firebaseUser.uid,

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

        success:
          true,

        uid:
          firebaseUser.uid,

        message:
          "تم إنشاء حساب المشرف بنجاح",
      };

    } catch (error) {

      // --------------------------------------------------------
      // Rollback
      // لو Firestore فشل نحذف حساب Auth
      // --------------------------------------------------------

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
  }
);


// ============================================================
// FIND USER EMAIL BY PHONE
// تسجيل الدخول برقم الهاتف بدل البريد الإلكتروني
// ============================================================

exports.findUserEmailByPhone = onCall(
  async (request) => {

    const db = getFirestore();

    // ----------------------------------------------------------
    // استقبال رقم الهاتف
    // ----------------------------------------------------------

    const phone = String(
      request.data?.phone || ""
    ).trim();

    if (!phone) {
      throw new HttpsError(
        "invalid-argument",
        "رقم الهاتف مطلوب"
      );
    }

    // ----------------------------------------------------------
    // توحيد رقم الهاتف المصري
    // ----------------------------------------------------------

    const normalizePhone = (
      value
    ) => {

      let digits =
        String(value || "")
          .replace(/\D/g, "");

      if (!digits) {
        return "";
      }

      // ----------------------------------------
      // 0020xxxxxxxxxx
      // ----------------------------------------

      if (
        digits.startsWith("0020")
      ) {
        digits =
          digits.slice(2);
      }

      // ----------------------------------------
      // 20xxxxxxxxxx
      // ----------------------------------------

      if (
        digits.startsWith("20") &&
        digits.length === 12
      ) {
        digits =
          "0" +
          digits.slice(2);
      }

      // ----------------------------------------
      // 10xxxxxxxx
      // 11xxxxxxxx
      // 12xxxxxxxx
      // 15xxxxxxxx
      // ----------------------------------------

      if (
        digits.length === 10 &&
        (
          digits.startsWith("10") ||
          digits.startsWith("11") ||
          digits.startsWith("12") ||
          digits.startsWith("15")
        )
      ) {
        digits =
          "0" + digits;
      }

      return digits;
    };

    const normalizedPhone =
      normalizePhone(phone);

    if (!normalizedPhone) {
      throw new HttpsError(
        "invalid-argument",
        "رقم الهاتف غير صحيح"
      );
    }

    // ----------------------------------------------------------
    // إنشاء كل الصيغ المحتملة للرقم المصري
    // ----------------------------------------------------------

    const variants =
      new Set();

    variants.add(
      normalizedPhone
    );

    if (
      normalizedPhone.startsWith("0")
    ) {

      const withoutZero =
        normalizedPhone.slice(1);

      variants.add(
        withoutZero
      );

      variants.add(
        "20" +
        withoutZero
      );

      variants.add(
        "+20" +
        withoutZero
      );

      variants.add(
        "0020" +
        withoutZero
      );
    }

    // ----------------------------------------------------------
    // البحث داخل users من خلال Admin SDK
    // ----------------------------------------------------------

    let userDoc = null;

    for (
      const variant of variants
    ) {

      try {

        const snapshot =
          await db
            .collection("users")
            .where(
              "phone",
              "==",
              variant
            )
            .limit(1)
            .get();

        if (
          !snapshot.empty
        ) {

          userDoc =
            snapshot.docs[0];

          break;
        }

      } catch (error) {

        console.error(
          "Phone lookup query error:",
          error
        );

        throw new HttpsError(
          "internal",
          "حدث خطأ أثناء البحث عن الحساب"
        );
      }
    }

    // ----------------------------------------------------------
    // الرقم غير موجود
    // ----------------------------------------------------------

    if (!userDoc) {

      throw new HttpsError(
        "not-found",
        "لا يوجد حساب مسجل برقم الهاتف ده"
      );
    }

    // ----------------------------------------------------------
    // بيانات المستخدم
    // ----------------------------------------------------------

    const userData =
      userDoc.data();

    // ----------------------------------------------------------
    // البريد المرتبط بالحساب
    // ----------------------------------------------------------

    const email =
      String(
        userData?.email || ""
      )
        .trim()
        .toLowerCase();

    if (!email) {

      throw new HttpsError(
        "failed-precondition",
        "الحساب ده غير مكتمل بيانات تسجيل الدخول"
      );
    }

    // ----------------------------------------------------------
    // حالة الحساب
    // ----------------------------------------------------------

    if (
      userData?.active === false
    ) {

      throw new HttpsError(
        "permission-denied",
        "هذا الحساب تم إيقافه"
      );
    }

    // ----------------------------------------------------------
    // إرجاع البريد فقط
    // ----------------------------------------------------------

    return {

      success:
        true,

      email,
    };
  }
);