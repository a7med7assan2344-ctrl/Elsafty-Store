import React, { useEffect, useState } from "react";
import "./Hero.css";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1600",
    title: "عروض الإلكترونيات",
    text: "خصومات تصل إلى 50%"
  },
  {
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600",
    title: "وصل حديثًا",
    text: "اكتشف أحدث المنتجات"
  },
  {
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1600",
    title: "أزياء وموضة",
    text: "أفضل الأسعار كل يوم"
  }
];

function Hero() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      className="hero"
      style={{
        backgroundImage: `url(${slides[current].image})`,
      }}
    >
      <div className="hero-overlay">
        <h1>{slides[current].title}</h1>
        <p>{slides[current].text}</p>

        <button>تسوق الآن</button>
      </div>
    </section>
  );
}

export default Hero;