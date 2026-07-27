import React from "react";
import { useNavigate } from "react-router-dom";
import "./Products.css";


function Products({ products = [], addToCart }) {

  const navigate = useNavigate();


  if (products.length === 0) {

    return (

      <div className="no-products">

        لا توجد منتجات مطابقة للبحث.

      </div>

    );

  }



  return (

    <div className="products-grid">


      {products.map((product) => {


        const productId = product.id;



        return (

          <div

            key={productId}

            className="product-card"

            onClick={() =>
              navigate(`/product/${productId}`)
            }

          >



            <div className="product-img-container">


              <img

                src={
                  product.image ||
                  "https://via.placeholder.com/300"
                }

                alt={
                  product.title ||
                  "منتج"
                }

              />


            </div>




            <div className="product-info">



              <h3 className="product-title">

                {
                  product.title ||
                  "منتج بدون اسم"
                }

              </h3>





              <div className="product-rating">


                {"⭐".repeat(
                  Math.floor(product.rating || 5)
                )}


                <span>

                  ({product.rating || 5})

                </span>


              </div>






              <div className="product-price">


                <span className="amount">

                  {product.price || 0}

                </span>


                <span className="currency">

                  ج.م

                </span>


              </div>






              <button

                className="add-to-cart-btn"


                onClick={(e)=>{

                  e.stopPropagation();


                  if(addToCart){

                    addToCart(product);

                    alert("تمت إضافة المنتج للسلة 🛒");

                  }

                }}


              >

                🛒 أضف إلى السلة


              </button>




            </div>



          </div>


        );


      })}



    </div>


  );

}


export default Products;