import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const DEFAULT_PRIMARY = "#071A36";
const DEFAULT_TEXT = "#FFFFFF";
const DEFAULT_BRAND = "#D4AF37";

const safeString = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const getFirstValue = (...values) => {
  for (const value of values) {
    const normalized = safeString(value);
    if (normalized) return normalized;
  }
  return "";
};

const normalizePhone = (value) =>
  safeString(value).replace(/[^\d+]/g, "");

const normalizeWhatsApp = (value) =>
  safeString(value).replace(/\D/g, "");

const isExternalUrl = (value) =>
  /^https?:\/\//i.test(safeString(value));

const getInternalPath = (value, fallback = "/") => {
  const url = safeString(value);

  if (!url) return fallback;

  if (isExternalUrl(url)) {
    return url;
  }

  return url.startsWith("/") ? url : `/${url}`;
};

function Footer({ storeSettings = {} }) {
  const settings = storeSettings || {};
  const theme = settings?.theme || {};

  const footerSettings =
    settings?.footer ||
    settings?.footerSettings ||
    {};

  /*
   * ============================================================
   * THEME
   * ============================================================
   */

  const footerBackground = getFirstValue(
    footerSettings.background,
    footerSettings.backgroundColor,
    theme.footerBackground,
    theme.primary,
    settings.primaryColor,
    DEFAULT_PRIMARY
  );

  const footerText = getFirstValue(
    footerSettings.textColor,
    footerSettings.color,
    theme.footerText,
    theme.text,
    DEFAULT_TEXT
  );

  const footerBrand = getFirstValue(
    footerSettings.brandColor,
    footerSettings.accent,
    theme.footerBrand,
    theme.accent,
    settings.accentColor,
    DEFAULT_BRAND
  );

  const footerBorder = getFirstValue(
    footerSettings.borderColor,
    theme.footerBorder,
    footerBrand
  );

  /*
   * ============================================================
   * STORE INFORMATION
   * ============================================================
   */

  const storeName = getFirstValue(
    settings.storeName,
    settings.name,
    "ســـــَــــــــوا"
  );

  const storeDescription = getFirstValue(
    footerSettings.description,
    footerSettings.footerDescription,
    settings.footerDescription,
    settings.description,
    `تسوق بسهولة وأمان مع ${storeName}`
  );

  /*
   * اللوجو يأتي من Admin.jsx بعد رفع الصورة
   * وحفظ الرابط الناتج في settings.logo
   */

  const logo = getFirstValue(
    settings.logo,
    settings.logoUrl,
    settings.logoURL
  );

  /*
   * ============================================================
   * CONTACT
   * ============================================================
   */

  const phone = getFirstValue(
    settings.phone,
    settings.phoneNumber,
    settings.contactPhone
  );

  const whatsapp = getFirstValue(
    settings.whatsapp,
    settings.whatsappNumber,
    settings.contactWhatsapp
  );

  const email = getFirstValue(
    settings.email,
    settings.contactEmail
  );

  const address = getFirstValue(
    settings.address,
    settings.storeAddress,
    settings.location
  );

  /*
   * رابط "تواصل معنا"
   * يتحكم فيه Admin.jsx
   */

  const contactLink = getFirstValue(
    footerSettings.contactLink,
    settings.contactLink,
    settings.contactUrl,
    "/support"
  );

  /*
   * ============================================================
   * SOCIAL
   * ============================================================
   */

  const facebook = getFirstValue(
    settings.facebook,
    settings.facebookUrl,
    settings.socials?.facebook,
    settings.social?.facebook
  );

  const instagram = getFirstValue(
    settings.instagram,
    settings.instagramUrl,
    settings.socials?.instagram,
    settings.social?.instagram
  );

  const telegram = getFirstValue(
    settings.telegram,
    settings.telegramUrl,
    settings.socials?.telegram,
    settings.social?.telegram
  );

  const tiktok = getFirstValue(
    settings.tiktok,
    settings.tiktokUrl,
    settings.socials?.tiktok,
    settings.social?.tiktok
  );

  const youtube = getFirstValue(
    settings.youtube,
    settings.youtubeUrl,
    settings.socials?.youtube,
    settings.social?.youtube
  );

  /*
   * ============================================================
   * FOOTER LINKS
   * ============================================================
   */

  const configuredSections = Array.isArray(
    footerSettings.sections
  )
    ? footerSettings.sections
    : Array.isArray(settings.footerSections)
      ? settings.footerSections
      : [];

  const configuredLinks = Array.isArray(
    footerSettings.links
  )
    ? footerSettings.links
    : Array.isArray(settings.footerLinks)
      ? settings.footerLinks
      : [];

  const normalizeLink = (item, index) => {
    if (!item) return null;

    if (typeof item === "string") {
      return {
        id: `footer-link-${index}`,
        title: item,
        label: item,
        url: "/",
        active: true,
        order: index,
        external: false,
      };
    }

    return {
      id:
        item.id ||
        item.key ||
        `footer-link-${index}`,

      title: getFirstValue(
        item.title,
        item.label,
        item.name,
        item.text
      ),

      label: getFirstValue(
        item.label,
        item.title,
        item.name,
        item.text
      ),

      url: getFirstValue(
        item.url,
        item.link,
        item.href,
        item.path,
        "/"
      ),

      active:
        item.active !== false &&
        item.enabled !== false &&
        item.visible !== false,

      order: Number(
        item.order ??
          item.sortOrder ??
          item.position ??
          index
      ),

      external:
        item.external === true ||
        item.isExternal === true,
    };
  };

  const normalizedLinks = configuredLinks
    .map(normalizeLink)
    .filter(
      (item) =>
        item &&
        item.active &&
        item.label
    )
    .sort((a, b) => a.order - b.order);

  /*
   * ============================================================
   * DEFAULT SECTIONS
   * ============================================================
   */

  const defaultSections = [
    {
      id: "quick-links",

      title: getFirstValue(
        footerSettings.quickLinksTitle,
        footerSettings.linksTitle,
        "روابط مهمة"
      ),

      links: [
        {
          id: "home",
          label: "الرئيسية",
          url: "/",
        },
        {
          id: "offers",
          label: "العروض",
          url: "/offers",
        },
        {
          id: "best-sellers",
          label: "الأكثر مبيعًا",
          url: "/best-sellers",
        },
        {
          id: "new-arrivals",
          label: "أحدث المنتجات",
          url: "/new-arrivals",
        },
      ],
    },

    {
      id: "customer-service",

      title: getFirstValue(
        footerSettings.customerServiceTitle,
        "خدمة العملاء"
      ),

      links: [
        {
          id: "cart",
          label: "سلة المشتريات",
          url: "/cart",
        },
        {
          id: "orders",
          label: "طلباتي",
          url: "/orders",
        },
        {
          id: "favorites",
          label: "المفضلة",
          url: "/favorites",
        },

        /*
         * رابط تواصل معنا يتحكم فيه Admin.jsx
         */
        {
          id: "support",
          label: "تواصل معنا",
          url: contactLink,
        },
      ],
    },
  ];

  const adminSections = configuredSections
    .map((section, sectionIndex) => {
      if (!section) return null;

      const sectionLinks = Array.isArray(
        section.links
      )
        ? section.links
        : Array.isArray(section.items)
          ? section.items
          : [];

      return {
        id:
          section.id ||
          section.key ||
          `footer-section-${sectionIndex}`,

        title: getFirstValue(
          section.title,
          section.name,
          section.label
        ),

        order: Number(
          section.order ??
            section.sortOrder ??
            section.position ??
            sectionIndex
        ),

        links: sectionLinks
          .map(normalizeLink)
          .filter(
            (item) =>
              item &&
              item.active &&
              item.label
          )
          .sort(
            (a, b) => a.order - b.order
          ),
      };
    })
    .filter(
      (section) =>
        section &&
        section.title &&
        section.links.length > 0
    )
    .sort(
      (a, b) => a.order - b.order
    );

  const footerSections =
    adminSections.length > 0
      ? adminSections
      : normalizedLinks.length > 0
        ? [
            {
              id: "admin-links",

              title: getFirstValue(
                footerSettings.linksTitle,
                "روابط مهمة"
              ),

              links: normalizedLinks,
            },
          ]
        : defaultSections;

  /*
   * ============================================================
   * FOOTER VISIBILITY
   * ============================================================
   */

  const footerEnabled =
    footerSettings.enabled !== false &&
    settings.footerEnabled !== false;

  if (!footerEnabled) {
    return null;
  }

  /*
   * ============================================================
   * COPYRIGHT
   * ============================================================
   */

  const currentYear = new Date().getFullYear();

  const copyrightText = getFirstValue(
    footerSettings.copyright,
    settings.copyright
  );

  /*
   * ============================================================
   * SOCIAL LINKS
   * ============================================================
   */

  const showSocial =
    footerSettings.showSocial !== false &&
    settings.showSocial !== false;

  const socialLinks = [
    {
      key: "facebook",
      label: "Facebook",
      value: facebook,
      icon: "f",
    },
    {
      key: "instagram",
      label: "Instagram",
      value: instagram,
      icon: "◎",
    },
    {
      key: "telegram",
      label: "Telegram",
      value: telegram,
      icon: "✈",
    },
    {
      key: "tiktok",
      label: "TikTok",
      value: tiktok,
      icon: "♪",
    },
    {
      key: "youtube",
      label: "YouTube",
      value: youtube,
      icon: "▶",
    },
  ].filter((item) => item.value);

  /*
   * ============================================================
   * RENDER FOOTER LINK
   * ============================================================
   */

  const renderFooterLink = (item, index) => {
    if (!item) return null;

    const url = getInternalPath(item.url);

    const key =
      item.id ||
      item.key ||
      `${url}-${item.label || index}`;

    if (
      item.external ||
      isExternalUrl(url)
    ) {
      return (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          <span>{item.label}</span>
        </a>
      );
    }

    return (
      <Link
        key={key}
        to={url}
        className="footer-link"
      >
        <span>{item.label}</span>
      </Link>
    );
  };

  /*
   * ============================================================
   * CONTACT LINK
   * ============================================================
   */

  const renderContactLink = () => {
    const url = getInternalPath(contactLink);

    if (
      isExternalUrl(url)
    ) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          <span>تواصل معنا</span>
        </a>
      );
    }

    return (
      <Link
        to={url}
        className="footer-link"
      >
        <span>تواصل معنا</span>
      </Link>
    );
  };

  /*
   * ============================================================
   * RETURN
   * ============================================================
   */

  return (
    <footer
      className="store-footer"
      dir="rtl"
      style={{
        "--footer-background": footerBackground,
        "--footer-text": footerText,
        "--footer-brand": footerBrand,
        "--footer-border": footerBorder,
      }}
    >
      <div className="store-footer-container">

        {/* =====================================================
            BRAND
        ====================================================== */}

        <div className="footer-brand-section">
          <Link
            to="/"
            className="footer-brand-name"
            aria-label={storeName}
          >
            {logo ? (
              <img
                src={logo}
                alt={storeName}
                className="footer-logo"
                loading="lazy"
              />
            ) : (
              <span className="footer-brand-text">
                {storeName}
              </span>
            )}
          </Link>

          {storeDescription && (
            <p className="footer-description">
              {storeDescription}
            </p>
          )}

          {/* SOCIAL */}

          {showSocial &&
            socialLinks.length > 0 && (
              <div
                className="footer-social"
                aria-label="روابط التواصل الاجتماعي"
              >
                {socialLinks.map((social) => (
                  <a
                    key={social.key}
                    href={social.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`footer-social-link footer-social-${social.key}`}
                  >
                    <span aria-hidden="true">
                      {social.icon}
                    </span>

                    <span className="footer-social-label">
                      {social.label}
                    </span>
                  </a>
                ))}
              </div>
            )}
        </div>

        {/* =====================================================
            FOOTER SECTIONS
        ====================================================== */}

        {footerSections.map(
          (section, sectionIndex) => (
            <div
              className="footer-column"
              key={
                section.id ||
                `footer-section-${sectionIndex}`
              }
            >
              <h3>{section.title}</h3>

              <div className="footer-links-list">
                {section.links.map(
                  renderFooterLink
                )}
              </div>
            </div>
          )
        )}

        {/* =====================================================
            CONTACT
        ====================================================== */}

        {(phone ||
          whatsapp ||
          email ||
          address) && (
          <div className="footer-column footer-contact">
            <h3>
              {getFirstValue(
                footerSettings.contactTitle,
                "تواصل معنا"
              )}
            </h3>

            {phone && (
              <a
                href={`tel:${normalizePhone(phone)}`}
                className="footer-contact-item"
                dir="ltr"
              >
                <span
                  className="footer-contact-icon"
                  aria-hidden="true"
                >
                  ☎
                </span>

                <span>{phone}</span>
              </a>
            )}

            {whatsapp && (
              <a
                href={`https://wa.me/${normalizeWhatsApp(
                  whatsapp
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-item"
                dir="ltr"
              >
                <span
                  className="footer-contact-icon"
                  aria-hidden="true"
                >
                  💬
                </span>

                <span>واتساب</span>
              </a>
            )}

            {email && (
              <a
                href={`mailto:${email}`}
                className="footer-contact-item"
                dir="ltr"
              >
                <span
                  className="footer-contact-icon"
                  aria-hidden="true"
                >
                  ✉
                </span>

                <span>{email}</span>
              </a>
            )}

            {address && (
              <div className="footer-contact-item footer-address">
                <span
                  className="footer-contact-icon"
                  aria-hidden="true"
                >
                  📍
                </span>

                <span>{address}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =======================================================
          BOTTOM
      ======================================================== */}

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="footer-copyright">
            {copyrightText ? (
              copyrightText
            ) : (
              <>
                © {currentYear}{" "}
                <span className="footer-copyright-brand">
                  {storeName}
                </span>{" "}
                - جميع الحقوق محفوظة
              </>
            )}
          </p>

          <div className="footer-bottom-links">
            <Link
              to="/"
              key="footer-home-link"
            >
              الرئيسية
            </Link>

            {/* رابط التواصل من إعدادات الأدمن */}
            {renderContactLink()}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;