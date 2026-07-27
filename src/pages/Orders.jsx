import { useContext, useEffect, useState } from "react";

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from "firebase/firestore";

import { db } from "../firebase";

import { AuthContext } from "../context/AuthContext";

function Orders() {

  const { user } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const data = snapshot.docs.map(doc => ({

        id: doc.id,

        ...doc.data()

      }));

      setOrders(data);

      setLoading(false);

    });

    return () => unsubscribe();

  }, [user]);

  if (!user) {

    return (

      <div className="orders-page">

        <h2>

          يجب تسجيل الدخول أولاً

        </h2>

      </div>

    );

  }

  if (loading) {

    return (

      <div className="orders-page">

        <h2>

          جارٍ تحميل الطلبات...

        </h2>

      </div>

    );

  }

  return (

    <div
      className="orders-page"
      style={{
        maxWidth: "1000px",
        margin: "40px auto",
        padding: "20px"
      }}
    >

      <h2>

        📦 طلباتي

      </h2>

      {

        orders.length === 0 ? (

          <p>

            لا توجد طلبات حتى الآن.

          </p>

        ) : (

          orders.map(order => (

            <div
              key={order.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "20px",
                marginBottom: "20px"
              }}
            >

              <h3>

                حالة الطلب:
                {" "}
                {order.status}

              </h3>

              <p>

                👤 {order.customerName}

              </p>

              <p>

                📱 {order.phone}

              </p>

              <p>

                📍 {order.address}

              </p>

              <hr />

              {

                order.products.map((item, index) => (

                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px"
                    }}
                  >

                    <span>

                      {item.title || item.name}

                    </span>

                    <span>

                      {item.quantity} × {item.price} جنيه

                    </span>

                  </div>

                ))

              }

              <hr />

              <h3>

                الإجمالي:

                {" "}

                {order.total}

                {" "}

                جنيه

              </h3>

            </div>

          ))

        )

      }

    </div>

  );

}

export default Orders;