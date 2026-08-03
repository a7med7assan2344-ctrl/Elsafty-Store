import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

import { db, auth } from "../firebase";

export const addReview = async (
  productId,
  rating,
  comment
) => {

  const user = auth.currentUser;

  if (!user) {
    throw new Error("يجب تسجيل الدخول");
  }

  const q = query(
    collection(db, "reviews"),
    where("productId", "==", productId),
    where("userId", "==", user.uid)
  );

  const exist = await getDocs(q);

  if (!exist.empty) {
    throw new Error("لقد قمت بتقييم هذا المنتج بالفعل");
  }

  await addDoc(collection(db, "reviews"), {
    productId,
    userId: user.uid,
    customerName: user.displayName || "مستخدم",
    rating,
    comment,
    createdAt: serverTimestamp()
  });

};

export const getReviews = async (productId) => {

  const q = query(
    collection(db, "reviews"),
    where("productId", "==", productId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

};

export const getRating = async (productId) => {

  const reviews = await getReviews(productId);

  if (reviews.length === 0) {
    return {
      average: 0,
      count: 0
    };
  }

  const total = reviews.reduce(
    (sum, review) => sum + Number(review.rating),
    0
  );

  return {
    average: Number(total / reviews.length).toFixed(1),
    count: reviews.length
  };

};