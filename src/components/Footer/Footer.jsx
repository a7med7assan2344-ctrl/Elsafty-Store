import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const DEFAULT_PRIMARY = "#071A36";
const DEFAULT_TEXT = "#FFFFFF";
const DEFAULT_BRAND = "#D4AF37";

function Footer({ storeSettings = {} }) {
  const theme = storeSettings?.theme || {};

  const footerBackground =
    theme.footerBackground || DEFAULT_PRIMARY;

  const footerText =
    theme.footerText || DEFAULT_TEXT;

  const footerBrand =
    theme.footerBrand || theme.accent || DEFAULT_BRAND;

  const storeName =
    storeSettings?.storeName || "ســـــَــــــــوا";

  const phone = storeSettings?.phone || "";
  const whatsapp = storeSettings?.whatsapp || "";
  const email = storeSettings?.email || "";
  const address = storeSettings?.address || "";

  const facebook = storeSettings?.facebook || "";
  const instagram = storeSettings?.instagram || "";
  const telegram = storeSettings?.telegram || "";

  return (
    <footer
      className="store-footer"
      style={{
        "--footer-background": footerBackground,
        "--footer-text": footerText,
        "--footer-brand": footerBrand,
      }}
    >
      <div className="store-footer-container">

        {/* BRAND */}
        <div className="footer-brand-section">
          <Link to="/" className="footer-brand-name">
            {storeSettings?.logo ? (
              <img
                src={storeSettings.logo}
                alt={storeName}
                className="footer-logo"
              />
            ) : (
              <span
                style={{
                  color: "var(--footer-brand)",
                }}
              >
                {storeName}
              </span>
            )}
          </Link>

          <p className="footer-description">
            تسوق بسهولة وأمان مع {storeName}
          </p>
        </div>

        {/* QUICK LINKS */}
        <div className="footer-column">
          <h3>روابط مهمة</h3>

          <Link to="/">الرئيسية</Link>

          <Link to="/offers">العروض</Link>

          <Link to="/best-sellers">
            الأكثر مبيعًا
          </Link>

          <Link to="/new-arrivals">
            أحدث المنتجات
          </Link>
        </div>

        {/* CUSTOMER SERVICE */}
        <div className="footer-column">
          <h3>خدمة العملاء</h3>

          <Link to="/cart">
            سلة المشتريات
          </Link>

          <Link to="/orders">
            طلباتي
          </Link>

          <Link to="/favorites">
            المفضلة
          </Link>

          <Link to="/support">
            تواصل معنا
          </Link>
        </div>

        {/* CONTACT */}
        <div className="footer-column footer-contact">
          <h3>تواصل معنا</h3>

          {phone && (
            <a
              href={`tel:${phone}`}
              dir="ltr"
            >
              📞 {phone}
            </a>
          )}

          {whatsapp && (
            <a
              href={`https://wa.me/${String(
                whatsapp
              ).replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
            >
              💬 واتساب
            </a>
          )}

          {email && (
            <a
              href={`mailto:${email}`}
              dir="ltr"
            >
              ✉️ {email}
            </a>
          )}

          {address && (
            <span>
              📍 {address}
            </span>
          )}
        </div>
      </div>

      {/* SOCIAL */}
      {(facebook || instagram || telegram) && (
        <div className="footer-social">
          {facebook && (
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              Facebook
            </a>
          )}

          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              Instagram
            </a>
          )}

          {telegram && (
            <a
              href={telegram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
            >
              Telegram
            </a>
          )}
        </div>
      )}

      {/* COPYRIGHT */}
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()}{" "}
          <span
            style={{
              color: "var(--footer-brand)",
              fontWeight: "800",
            }}
          >
            {storeName}
          </span>{" "}
          - جميع الحقوق محفوظة
        </p>
      </div>
    </footer>
  );
}

export default Footer;
