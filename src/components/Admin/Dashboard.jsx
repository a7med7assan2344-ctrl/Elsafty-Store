import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "../../firebase";
import "./Dashboard.css";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(db, "products"),
      (snap) => {
        setProducts(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      }
    );

    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snap) => {
        setOrders(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        setUsers(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
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

  const chartData = [
    {
      name: "المنتجات",
      value: products.length,
    },
    {
      name: "الطلبات",
      value: orders.length,
    },
    {
      name: "العملاء",
      value: users.length,
    },
  ];
const updateOrderStatus = async (id, status) => {
  try {
    await updateDoc(doc(db, "orders", id), {
      status,
    });
  } catch (error) {
    console.error(error);
  }
};
  return (
    <div className="dashboard">

      <div className="stats-grid">

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

      <div className="chart-box">

        <h2>📊 إحصائيات المتجر</h2>

        <ResponsiveContainer width="100%" height={350}>

          <BarChart data={chartData}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

      <div className="latest-orders">

        <h2>📋 آخر الطلبات</h2>

        <table>

          <thead>

            <tr>

              <th>العميل</th>

              <th>الإجمالي</th>

              <th>الحالة</th>

            </tr>

          </thead>

          <tbody>

            {orders.length === 0 ? (
              <tr>
                <td colSpan="3">لا توجد طلبات</td>
              </tr>
            ) : (
              orders.slice(0, 5).map((order) => (
                <tr key={order.id}>
                  <td>{order.customerName || order.name || "-"}</td>
                  <td>{order.total || 0} جنيه</td>
<td>
  <select
    value={order.status || "جديد"}
    onChange={(e) =>
      updateOrderStatus(order.id, e.target.value)
    }
  >
    <option value="جديد">🆕 جديد</option>
    <option value="تم التأكيد">✅ تم التأكيد</option>
    <option value="جارى التجهيز">📦 جارى التجهيز</option>
    <option value="خرج للشحن">🚚 خرج للشحن</option>
    <option value="تم التسليم">✔ تم التسليم</option>
    <option value="ملغى">❌ ملغى</option>
  </select>
</td>                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}