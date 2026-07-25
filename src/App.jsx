import React, { useEffect, useState } from "react";

import Admin from "./components/Admin/Admin.jsx";
import AdminLogin from "./pages/AdminLogin";
import Home from "./pages/Home";

import { 
  onAuthStateChanged 
} from "firebase/auth";

import { auth } from "./firebase";

import {
  getProducts
} from "./services/productService";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

function App() {
  const [products, setProducts] = useState([]);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (error) {
      console.log(error);
      setProducts([]);
    } finally {
      // بنجبر الـ loading يقف حتى لو حصل خطأ عشان الصفحة تفتح وما تختفيش
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          setAdmin(true);
        } else {
          setAdmin(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Cairo, sans-serif" }}>
        <h2>جاري تحميل المتجر... ⏳</h2>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* صفحة الزباين */}
        <Route
          path="/"
          element={
            <Home products={products}/>
          }
        />

        {/* صفحة دخول الأدمن */}
        <Route
          path="/admin-login"
          element={
            admin ?
            <Navigate to="/admin"/>
            :
            <AdminLogin
              setAdmin={setAdmin}
            />
          }
        />

        {/* لوحة الإدارة */}
        <Route
          path="/admin"
          element={
            admin ?
            <Admin
              products={products}
              loadProducts={loadProducts}
            />
            :
            <Navigate to="/admin-login"/>
          }
        />

        {/* أي رابط غلط يرجع للمتجر */}
        <Route
          path="*"
          element={
            <Navigate to="/" />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;