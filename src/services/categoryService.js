import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import {
  db,
} from "../firebase";

// ==================================================
// جلب الفئات النشطة للموقع
// ==================================================

export const getCategories = async () => {
  const q = query(
    collection(db, "categories"),
    where("active", "==", true)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    parentId: item.data().parentId || null,
    ...item.data(),
  }));
};

// ==================================================
// جلب كل الفئات للوحة الإدارة
// ==================================================

export const getAllCategories = async () => {
  const snapshot = await getDocs(
    collection(db, "categories")
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    parentId: item.data().parentId || null,
    ...item.data(),
  }));
};

// ==================================================
// إضافة فئة
// ==================================================

export const addCategory = async (category) => {
  await addDoc(
    collection(db, "categories"),
    {
      name: category.name || "",

      // رقم القسم
      categoryNumber:
        category.categoryNumber || "",

      // رقم واتساب القسم
      whatsapp:
        category.whatsapp || "",

      icon:
        category.icon || "",

      image:
        category.image || "",

      parentId:
        category.parentId || null,

      active:
        category.active ?? true,
    }
  );
};

// ==================================================
// تعديل فئة
// ==================================================

export const editCategory = async (id, data) => {
  await updateDoc(
    doc(db, "categories", id),
    {
      ...data,

      // ضمان حفظ رقم القسم
      categoryNumber:
        data.categoryNumber || "",

      // ضمان حفظ رقم واتساب القسم
      whatsapp:
        data.whatsapp || "",
    }
  );
};

// ==================================================
// حذف فئة
// ==================================================

export const removeCategory = async (id) => {
  await deleteDoc(
    doc(db, "categories", id)
  );
};