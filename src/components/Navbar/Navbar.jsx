import React from "react";
import "./Navbar.css";


function Navbar({

  setCurrentView,
  cartCount,
  searchTerm,
  setSearchTerm,
  admin,

}) {



  const scrollToSection = (className)=>{

    document
    .querySelector(className)
    ?.scrollIntoView({

      behavior:"smooth"

    });

  };





  // تحريك شريط الأقسام

  const moveCategories = (direction)=>{

    const bar = document.querySelector(".navbar-bottom");


    if(bar){

      bar.scrollBy({

        left: direction,

        behavior:"smooth"

      });

    }

  };





  return (

    <>


      {/* شريط العروض */}

      <div className="top-offer-bar">

        <div className="offer-text">

          🚚 شحن مجاني للطلبات فوق 500 جنيه

          <span>|</span>

          🔥 خصومات حتى 50%

          <span>|</span>

          💳 دفع آمن 100%

          <span>|</span>

          📞 دعم فني طوال الأسبوع

          <span>|</span>

          ⭐ منتجات أصلية بضمان الجودة

          <span>|</span>

          🎁 عروض حصرية كل يوم


        </div>

      </div>





      <header className="navbar">





        <div className="navbar-top">





          {/* اللوجو */}

          <div

          className="logo"

          onClick={()=>setCurrentView("store")}

          >


            <img

            src="/logo/logo.png"

            alt="Elsafty Store"

            />



            <div className="logo-text">

              <h2>
                Elsafty Store
              </h2>


              <span>
                Everything You Need
              </span>


            </div>


          </div>







          {/* البحث */}


          <div className="search-box">


            <input

            type="text"

            placeholder="ابحث عن أي منتج..."

            value={searchTerm}

            onChange={(e)=>

              setSearchTerm(e.target.value)

            }

            />



            <button>

              🔍

            </button>


          </div>








          {/* الأكشن */}


          <div className="actions">



            <div className="nav-icon">

              <span>
                ❤️
              </span>

              <p>
                المفضلة
              </p>

            </div>







            <div className="nav-icon">

              <span>
                👤
              </span>

              <p>
                حسابي
              </p>

            </div>







            {

            admin &&

            <button

            className="admin-btn"

            onClick={()=>setCurrentView("admin")}

            >

              ⚙️ لوحة الإدارة


            </button>

            }









            {/* السلة */}


            <div

            className="cart-icon"

            onClick={()=>setCurrentView("cart")}

            >



              {

              cartCount > 0 &&

              <span className="cart-badge">

                {cartCount}

              </span>

              }






              <span className="cart-symbol">

                🛒

              </span>




              <p>

                السلة

              </p>



            </div>






          </div>





        </div>









        {/* شريط الأقسام */}



        <div className="category-wrapper">






          {/* سهم اليمين */}

          <button

          className="category-arrow"

          onClick={()=>moveCategories(300)}

          >

            ❯

          </button>








          <div className="navbar-bottom">





            <button

            onClick={()=>setCurrentView("store")}

            >

              🏠 الرئيسية

            </button>







            <button

            onClick={()=>scrollToSection(".categories")}

            >

              📱 الأقسام

            </button>








            <button>

              📱 الموبايلات

            </button>







            <button>

              💻 اللابتوبات

            </button>







            <button>

              🎧 الإكسسوارات

            </button>







            <button>

              ⌚ الساعات الذكية

            </button>







            <button>

              🛒 السوبر ماركت

            </button>








            <button

            onClick={()=>scrollToSection(".offer-banner")}

            >

              🔥 العروض

            </button>








            <button

            onClick={()=>scrollToSection(".best-selling-section")}

            >

              ⭐ الأكثر مبيعًا

            </button>








            <button

            onClick={()=>scrollToSection(".new-arrivals-section")}

            >

              🆕 وصل حديثًا

            </button>






          </div>









          {/* سهم الشمال */}


          <button

          className="category-arrow"

          onClick={()=>moveCategories(-300)}

          >

            ❮

          </button>





        </div>






      </header>


    </>

  );

}


export default Navbar;