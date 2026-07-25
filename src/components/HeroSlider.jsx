import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { useNavigate } from "react-router-dom";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import "./HeroSlider.css";

const slides = [
  {
    image: "/banners/banner1.jpg",
    title: "خصومات حتى 50%",
    text: "أفضل الأسعار على آلاف المنتجات",
  },
  {
    image: "/banners/banner2.jpg",
    title: "وصل حديثًا",
    text: "اكتشف أحدث المنتجات بأفضل الأسعار.",
  },
  {
    image: "/banners/banner3.jpg",
    title: "شحن سريع",
    text: "توصيل لجميع المحافظات في أسرع وقت.",
  },
];

export default function HeroSlider() {
  const navigate = useNavigate();

  return (
    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      autoplay={{
        delay: 4000,
        disableOnInteraction: false,
      }}
      pagination={{ clickable: true }}
      navigation
      loop
    >
      {slides.map((slide, index) => (
        <SwiperSlide key={index}>
          <div
            className="hero-slide"
            style={{
              backgroundImage: `url(${slide.image})`,
            }}
          >
            <div className="hero-overlay">
              <div className="hero-text">
                <span className="hero-tag">
                  🔥 عرض خاص
                </span>

                <h1>{slide.title}</h1>

                <p>{slide.text}</p>

                <button
                  onClick={() => navigate("/")}
                >
                  تسوق الآن
                </button>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}