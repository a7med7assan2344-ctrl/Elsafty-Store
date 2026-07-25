import React, { useState } from "react";
import "../styles/store.css";
import logo from "../assets/logo.png";

function Home({ products = [] }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // إضافة منتج للسلة
  const addToCart = (product) => {
    const existingIndex = cart.findIndex(
      (item) => item.id === product.id
    );

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          ...product,
          quantity: 1
        }
      ]);
    }

    setIsCartOpen(true);
  };


  // تحديث كمية المنتج
  const updateQuantity = (id, delta) => {
    const updatedCart = cart
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;

          return newQty > 0
            ? { ...item, quantity: newQty }
            : null;
        }

        return item;
      })
      .filter(Boolean);

    setCart(updatedCart);
  };


  // حساب السعر
  const totalPrice = cart.reduce(
    (total, item) =>
      total + Number(item.price || 0) * item.quantity,
    0
  );


  // واتساب
  const sendToWhatsApp = () => {
    if (cart.length === 0) return;

    let message =
      "مرحباً، أود طلب المنتجات التالية من متجر السيفتي:\n\n";

    cart.forEach((item, index) => {
      message += `${index + 1}. ${
        item.name || "منتج"
      } - الكمية: ${
        item.quantity
      } - السعر: ${
        Number(item.price || 0) * item.quantity
      } جنيه\n`;
    });

    message += `\nالإجمالي الكلي: ${totalPrice} جنيه`;


    const phone = "201553570220";

    const url =
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };


  // البحث في المنتجات (تم إصلاح المشكلة هنا)
  const filteredProducts = products.filter((product) =>
    (product.name || "")
      .toLowerCase()
      .includes(
        (searchTerm || "").toLowerCase()
      )
  );


  return (
    <div className="store-container">

      <header className="store-header">

        <div className="nav-logo">
          <img 
            src={logo}
            alt="Elsafty Store"
          />
        </div>


        <div className="nav-search">

          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />

          <span className="search-icon">
            🔍
          </span>

        </div>


        <button
          className="cart-btn"
          onClick={() =>
            setIsCartOpen(true)
          }
        >
          🛒 السلة (
          {
            cart.reduce(
              (acc,item)=>
                acc + item.quantity,
              0
            )
          }
          )
        </button>


      </header>



      <section className="hero-banner">

        <h2>
          أفضل المنتجات بأفضل الأسعار
        </h2>

        <p>
          مرحباً بك في متجر السيفتي (Elsafty Store)
        </p>

      </section>




      <div className="product-grid">


        {
          filteredProducts.length > 0 ?


          filteredProducts.map((product)=>(


            <div
              className="product-card"
              key={product.id}
            >


              <div className="product-img-container">

                <img
                  src={
                    product.image ||
                    "/default-product.png"
                  }
                  alt={
                    product.name ||
                    "Product"
                  }
                />

              </div>



              <h3>
                {
                  product.name ||
                  "منتج بدون اسم"
                }
              </h3>



              <p className="product-price">

                {
                  product.price ||
                  0
                }
                جنيه

              </p>



              <button
                className="add-to-cart-btn"
                onClick={() =>
                  addToCart(product)
                }
              >
                أضف للسلة
              </button>


            </div>


          ))


          :

          <p className="no-products">
            لا توجد منتجات مطابقة للبحث...
          </p>


        }


      </div>





      {
        isCartOpen &&

        <div
          className="cart-overlay"
          onClick={() =>
            setIsCartOpen(false)
          }
        >


          <div
            className="cart-drawer"
            onClick={(e)=>
              e.stopPropagation()
            }
          >


            <div className="cart-header">

              <h3>
                سلة المشتريات
              </h3>


              <button
                className="close-cart"
                onClick={() =>
                  setIsCartOpen(false)
                }
              >
                ✕
              </button>


            </div>





            <div className="cart-items">


              {
                cart.length === 0 ?

                <p className="empty-cart">
                  السلة فارغة حالياً
                </p>


                :


                cart.map((item)=>(


                  <div
                    className="cart-item"
                    key={item.id}
                  >


                    <img
                      src={
                        item.image ||
                        "/default-product.png"
                      }
                      alt={
                        item.name ||
                        "Product"
                      }
                    />


                    <div className="cart-item-details">


                      <h4>
                        {
                          item.name ||
                          "منتج"
                        }
                      </h4>


                      <p>
                        {
                          item.price ||
                          0
                        }
                        جنيه
                      </p>



                      <div className="quantity-controls">


                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              -1
                            )
                          }
                        >
                          -
                        </button>



                        <span>
                          {item.quantity}
                        </span>



                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              1
                            )
                          }
                        >
                          +
                        </button>


                      </div>


                    </div>


                  </div>


                ))

              }


            </div>





            {
              cart.length > 0 &&

              <div className="cart-footer">


                <div className="cart-total">

                  <span>
                    الإجمالي:
                  </span>


                  <span>
                    {totalPrice} جنيه
                  </span>


                </div>



                <button
                  className="whatsapp-btn"
                  onClick={sendToWhatsApp}
                >
                  إرسال الطلب عبر واتساب 📱
                </button>



              </div>

            }


          </div>


        </div>

      }


    </div>
  );
}

export default Home;