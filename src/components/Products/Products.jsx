import React from "react";
import "./Products.css";

function Products({ products, addToCart }) {


  if (products.length === 0) {

    return (
      <div className="no-products">
        لا توجد منتجات مطابقة للبحث.
      </div>
    );

  }


  return (

    <div className="products-grid">

      {
        products.map(product => (

          <div
            key={product._id || product.id}
            className="product-card"
          >


            <div className="product-img-container">

              <img
                src={
                  product.image ||
                  "https://via.placeholder.com/300"
                }
                alt={product.title}
              />

            </div>



            <div className="product-info">


              <h3 className="product-title">
                {product.title}
              </h3>



              <div className="product-rating">

                {"⭐".repeat(
                  Math.floor(product.rating || 5)
                )}

                ({product.rating || 5})

              </div>




              <div className="product-price">

                <span className="currency">
                  ج.م
                </span>

                <span className="amount">
                  {product.price}
                </span>

              </div>




              <button

                className="add-to-cart-btn"

                onClick={() => addToCart(product)}

              >

                🛒 أضف إلى السلة

              </button>



            </div>


          </div>

        ))

      }


    </div>

  );

}


export default Products;