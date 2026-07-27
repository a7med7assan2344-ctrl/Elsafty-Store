import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";

import {
  db
} from "../firebase";



// جلب الفئات النشطة للموقع
export const getCategories = async()=>{

  const q = query(
    collection(db,"categories"),
    where("active","==",true)
  );


  const snapshot = await getDocs(q);


  return snapshot.docs.map(doc=>({

    id:doc.id,

    ...doc.data()

  }));

};



// جلب كل الفئات للوحة الإدارة
export const getAllCategories = async()=>{

  const snapshot = await getDocs(
    collection(db,"categories")
  );


  return snapshot.docs.map(doc=>({

    id:doc.id,

    ...doc.data()

  }));

};



// إضافة فئة
export const addCategory = async(category)=>{

  await addDoc(
    collection(db,"categories"),
    category
  );

};



// تعديل فئة
export const editCategory = async(id,data)=>{

  await updateDoc(
    doc(db,"categories",id),
    data
  );

};



// حذف فئة
export const removeCategory = async(id)=>{

  await deleteDoc(
    doc(db,"categories",id)
  );

};