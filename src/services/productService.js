import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "../firebase";


// اسم مجموعة المنتجات في Firestore
const productsCollection = collection(
  db,
  "products"
);



// إضافة منتج
export const addProduct = async (product) => {

  const result = await addDoc(
    productsCollection,
    product
  );

  return result;

};



// جلب المنتجات
export const getProducts = async () => {

  const snapshot = await getDocs(
    productsCollection
  );


  const products = snapshot.docs.map(
    (item)=>({

      id:item.id,

      ...item.data()

    })
  );


  return products;

};



// تعديل منتج
export const editProduct = async (
  id,
  product
)=>{


  const productRef = doc(
    db,
    "products",
    id
  );


  await updateDoc(
    productRef,
    product
  );


};



// حذف منتج
export const removeProduct = async (
  id
)=>{


  const productRef = doc(
    db,
    "products",
    id
  );


  await deleteDoc(
    productRef
  );


};