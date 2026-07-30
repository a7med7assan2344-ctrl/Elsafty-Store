import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot
} from "firebase/firestore";
import { db } from "../../firebase";
import "./Dashboard.css";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(db, "products"),
      (snap) => {
        setProducts(snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      }
    );

    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snap) => {
        setOrders(snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        setUsers(snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      }
    );

    return () => {
      unsubProducts();
      unsubOrders();
      unsubUsers();
    };
  }, []);

  const totalSales = orders.reduce(
    (sum, order) => sum + (Number(order.total) || 0),
    0
  );

  return (
    <div className="dashboard">

      <div className="card">
        <h3>📦 المنتجات</h3>
        <span>{products.length}</span>
      </div>

      <div className="card">
        <h3>🛒 الطلبات</h3>
        <span>{orders.length}</span>
      </div>

      <div className="card">
        <h3>👥 العملاء</h3>
        <span>{users.length}</span>
      </div>

      <div className="card">
        <h3>💰 المبيعات</h3>
        <span>{totalSales} جنيه</span>
      </div>

    </div>
  );
}