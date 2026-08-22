import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";

import "./Cart.css";

import { CartContext } from "../context/CartContext";

import Navbar from "../components/Navbar";


function Cart() {

  const navigate = useNavigate();


  // ==================================================
  // CART CONTEXT
  // ==================================================

  const {
    cart,
    updateQuantity,
    removeFromCart,
  } = useContext(CartContext);


  // ==================================================
  // CART COUNT
  // ==================================================

  const cartCount = cart.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0),
    0
  );


  // ==================================================
  // TOTAL PRICE
  // ==================================================

  const totalPrice = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );


  // ==================================================
  // EMPTY CART
  // ==================================================

  if (cart.length === 0) {

    return (

      <div>

        <Navbar
          setCurrentView={(page) => {

            if (page === "store") {
              navigate("/");
            }

          }}
          cartCount={0}
          searchTerm=""
          setSearchTerm={() => {}}
          admin={false}
        />


        <div className="cart-empty">

          <h2>
            🛒 سلة الصفتي ستور فارغة
          </h2>


          <p>
            ليس لديك أي منتجات في السلة حالياً.
          </p>


          <button
            type="button"
            className="back-store-btn"
            onClick={() =>
              navigate("/")
            }
          >
            ⬅ العودة للمتجر
          </button>

        </div>

      </div>

    );

  }


  // ==================================================
  // RETURN
  // ==================================================

  return (

    <div>


      {/* ==================================================
          NAVBAR
      ================================================== */}

      <Navbar

        setCurrentView={(page) => {

          if (page === "store") {
            navigate("/");
          }

          if (page === "cart") {
            navigate("/cart");
          }

        }}

        cartCount={cartCount}

        searchTerm=""

        setSearchTerm={() => {}}

        admin={false}

      />


      {/* ==================================================
          CART CONTAINER
      ================================================== */}

      <div className="cart-container">


        <h2>
          🛒 سلة المشتريات
        </h2>


        {/* ==================================================
            CART ITEMS
        ================================================== */}

        <div className="cart-items">

          {cart.map(
            (item, index) => {

              const id =
                item.cartId ||
                item.id ||
                item._id ||
                index;


              const itemPrice =
                Number(
                  item.price || 0
                );


              const itemQuantity =
                Number(
                  item.quantity || 0
                );


              const itemTotal =
                itemPrice *
                itemQuantity;


              const variantName =
                item.variantName ||
                item.selectedVariant?.name ||
                "";


              return (

                <div
                  key={id}
                  className="cart-item"
                >


                  {/* ==================================================
                      IMAGE
                  ================================================== */}

                  <img
                    src={
                      item.image ||
                      item.images?.[0] ||
                      "https://via.placeholder.com/100"
                    }
                    alt={
                      item.title ||
                      item.name ||
                      "product"
                    }
                  />


                  {/* ==================================================
                      DETAILS
                  ================================================== */}

                  <div className="cart-item-details">


                    <h4>

                      {
                        item.title ||
                        item.name ||
                        "منتج بدون اسم"
                      }

                    </h4>


                    {/* VARIANT */}

                    {variantName && (

                      <div className="cart-variant">

                        🔀 النوع:

                        {" "}

                        <strong>
                          {variantName}
                        </strong>

                      </div>

                    )}


                    {/* PRICE */}

                    <p className="cart-item-price">

                      {itemPrice.toLocaleString(
                        "ar-EG"
                      )}

                      {" "}
                      ج.م

                    </p>


                    {/* ==================================================
                        CONTROLS
                    ================================================== */}

                    <div className="cart-controls">


                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            id,
                            -1
                          )
                        }
                        disabled={
                          itemQuantity <= 1
                        }
                      >
                        -
                      </button>


                      <span>
                        {itemQuantity}
                      </span>


                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            id,
                            1
                          )
                        }
                      >
                        +
                      </button>


                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() =>
                          removeFromCart(id)
                        }
                      >
                        🗑 حذف
                      </button>


                    </div>


                    {/* ==================================================
                        ITEM TOTAL
                    ================================================== */}

                    <div className="cart-item-total">

                      الإجمالي:

                      {" "}

                      <strong>

                        {itemTotal.toLocaleString(
                          "ar-EG"
                        )}

                        {" "}
                        ج.م

                      </strong>

                    </div>


                  </div>


                </div>

              );

            }
          )}

        </div>


        {/* ==================================================
            CART SUMMARY
        ================================================== */}

        <div className="cart-summary">


          <h3>

            المجموع الكلي:

            {" "}

            <span>

              {totalPrice.toLocaleString(
                "ar-EG"
              )}

              {" "}
              ج.م

            </span>

          </h3>


          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div className="cart-buttons">


            {/* BACK TO STORE */}

            <button
              type="button"
              className="back-store-btn"
              onClick={() =>
                navigate("/")
              }
            >
              ⬅ العودة للمتجر
            </button>


            {/* CHECKOUT */}

            <button
              type="button"
              className="checkout-btn"
              onClick={() =>
                navigate("/checkout")
              }
            >
              📦 إتمام الطلب
            </button>


          </div>


        </div>


      </div>


    </div>

  );

}


export default Cart;