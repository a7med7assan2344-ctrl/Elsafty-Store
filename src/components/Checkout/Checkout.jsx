import React, { useState } from "react";
import "./Checkout.css";


function Checkout({ cart, setCart, setCurrentView }) {


  const [name,setName] = useState("");
  const [phone,setPhone] = useState("");
  const [address,setAddress] = useState("");



  const totalPrice = cart.reduce(
    (sum,item)=>
      sum + Number(item.price || 0) * item.quantity,
    0
  );




  const handleWhatsAppOrder = (e)=>{

    e.preventDefault();


    if(!name || !phone || !address){

      alert(
        "الرجاء إكمال بيانات الشحن (الاسم، الهاتف، العنوان)"
      );

      return;

    }




    // ضع رقم الواتساب الخاص بك هنا
    const adminWhatsApp = "201000000000";




    let message = 
`🛒 *طلب جديد من Elsafty Store* 🛒

👤 *اسم العميل:* ${name}

📞 *رقم الهاتف:* ${phone}

📍 *العنوان:* ${address}


📦 *المنتجات المطلوبة:*

`;



    cart.forEach((item,index)=>{


      message += 
`${index + 1}- ${
        item.title ||
        item.name ||
        "منتج"
      }

الكمية: ${item.quantity}

السعر: ${
        Number(item.price || 0) *
        item.quantity
      } جنيه

`;



    });




    message +=
`\n💰 *الإجمالي الكلي:*
${totalPrice} جنيه`;




    const whatsappUrl =
    `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(message)}`;



    window.open(
      whatsappUrl,
      "_blank"
    );



    setCart([]);

    setCurrentView("store");



    alert(
      "تم إرسال طلبك بنجاح عبر الواتساب!"
    );


  };





  return (

    <div className="checkout-container">


      <h2>
        إتمام الطلب عبر واتساب 📱
      </h2>





      <form

        onSubmit={handleWhatsAppOrder}

        className="checkout-form"

      >




        <div className="form-group">


          <label>
            الاسم الكامل:
          </label>


          <input

            type="text"

            placeholder="أدخل اسمك هنا"

            value={name}

            onChange={(e)=>
              setName(e.target.value)
            }

          />


        </div>







        <div className="form-group">


          <label>
            رقم الهاتف:
          </label>


          <input

            type="tel"

            placeholder="01xxxxxxxxx"

            value={phone}

            onChange={(e)=>
              setPhone(e.target.value)
            }

          />


        </div>







        <div className="form-group">


          <label>
            عنوان الشحن بالتفصيل:
          </label>


          <textarea

            placeholder="المحافظة - المدينة - الشارع - رقم المنزل"

            value={address}

            onChange={(e)=>
              setAddress(e.target.value)
            }

            rows="4"

          />


        </div>







        <div className="order-summary-box">


          <h4>

            إجمالي الطلب:
            
            <span>
              {totalPrice} جنيه
            </span>


          </h4>


        </div>








        <button

          type="submit"

          className="whatsapp-submit-btn"

        >

          إرسال الطلب الآن عبر الواتساب 🟢


        </button>




      </form>



    </div>

  );

}


export default Checkout;