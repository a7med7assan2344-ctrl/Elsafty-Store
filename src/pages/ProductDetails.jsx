import React, {
  useState,
  useContext
} from "react";

import {
  useNavigate
} from "react-router-dom";

import "./ProductDetails.css";

import {
  CartContext
} from "../context/CartContext";
import {
  addReview,
  getReviews,
  getRating
} from "../services/reviewService";

import {
  useEffect
} from "react";


function ProductDetails({ product }) {


const navigate = useNavigate();



const {
addToCart,
cart
} = useContext(CartContext);



const [quantity,setQuantity] = useState(1);
const productImages =
  product?.images?.length
    ? product.images
    : [product?.image];

const [selectedImage, setSelectedImage] = useState("");
const [zoom, setZoom] = useState(false);
const [reviews, setReviews] = useState([]);

const [average, setAverage] = useState(0);

const [reviewCount, setReviewCount] = useState(0);

const [userRating, setUserRating] = useState(5);

const [comment, setComment] = useState("");




const cartCount = cart.reduce(

(total,item)=>

total + item.quantity

,0

);







if(!product){


return (

<div className="no-product">


<h2>
المنتج غير موجود
</h2>



<button

onClick={()=>navigate("/")}

>

الرجوع للمتجر

</button>



</div>

);


}

useEffect(() => {

  if (!product) return;

  const loadReviews = async () => {

    const list = await getReviews(product.id);

    const rating = await getRating(product.id);

    setReviews(list);

    setAverage(rating.average);

    setReviewCount(rating.count);

  };

  loadReviews();

}, [product]);





const increaseQuantity = ()=>{

setQuantity(prev=>prev + 1);

};






const decreaseQuantity = ()=>{

setQuantity(prev=>

prev > 1 ? prev - 1 : 1

);

};









const handleAddToCart = ()=>{


addToCart({

...product,

quantity

});



alert(
`تم إضافة ${quantity} من المنتج للسلة 🛒`
);



};










return (


<div className="product-details">







<div className="details-image">

<img
  src={
    selectedImage ||
    "https://via.placeholder.com/400"
  }
  alt={product.title}
  className={`main-image ${zoom ? "zoomed" : ""}`}
  onMouseEnter={() => setZoom(true)}
  onMouseLeave={() => setZoom(false)}
  onClick={() => setZoom(!zoom)}
/>
  {productImages.length > 1 && (

    <div className="image-gallery">

      {productImages.map((img, index) => (

        <img
          key={index}
          src={img}
          alt=""
          className={
            selectedImage === img
              ? "gallery-thumb active"
              : "gallery-thumb"
          }
          onClick={() => setSelectedImage(img)}
        />

      ))}

    </div>

  )}

</div>








<div className="details-info">



<h1>

{

product.title ||

"منتج بدون اسم"

}

</h1>









<div className="details-rating">


⭐⭐⭐⭐⭐


<span>

(
{product.rating || 5}
)

</span>


</div>









<p className="details-description">


{

product.description ||

"منتج مميز بجودة عالية، مناسب للاستخدام اليومي."

}


</p>









<div className="details-price">


{

Number(product.price || 0) * quantity

}

ج.م


</div>









<div className="quantity-box">


<span>

الكمية:

</span>







<button

onClick={decreaseQuantity}

>

-

</button>







<strong>

{quantity}

</strong>







<button

onClick={increaseQuantity}

>

+

</button>





</div>









<div className="details-actions">





<button

className="add-btn"

onClick={handleAddToCart}

>

🛒 أضف للسلة

</button>
<div className="reviews-section">

  <h2>⭐ تقييمات العملاء</h2>

  <p className="rating-summary">
    ⭐ {average} من 5 ({reviewCount} تقييم)
  </p>

  <div className="rating-input">

    {[1,2,3,4,5].map((star) => (
      <span
        key={star}
        className={userRating >= star ? "star active" : "star"}
        onClick={() => setUserRating(star)}
      >
        ★
      </span>
    ))}

  </div>

  <textarea
    placeholder="اكتب رأيك عن المنتج..."
    value={comment}
    onChange={(e) => setComment(e.target.value)}
  />

  <button
    className="send-review-btn"
    onClick={async () => {

      try {

        await addReview(
          product.id,
          userRating,
          comment
        );

        const list = await getReviews(product.id);
        const rating = await getRating(product.id);

        setReviews(list);
        setAverage(rating.average);
        setReviewCount(rating.count);
        setComment("");
        setUserRating(5);

        alert("تم إرسال التقييم بنجاح ⭐");

      } catch (err) {

        alert(err.message);

      }

    }}
  >
    إرسال التقييم
  </button>

  <div className="reviews-list">

    {reviews.map((review) => (

      <div
        className="review-card"
        key={review.id}
      >

        <h4>{review.customerName}</h4>

        <p>
          {"★".repeat(review.rating)}
        </p>

        <p>{review.comment}</p>

      </div>

    ))}

  </div>

</div>







<button

className="cart-go-btn"

onClick={()=>navigate("/cart")}

>

🛍 اذهب للسلة

</button>






</div>









<button

className="back-btn"

onClick={()=>navigate("/")}

>

⬅ العودة للمتجر

</button>







</div>






</div>


);


}


export default ProductDetails;