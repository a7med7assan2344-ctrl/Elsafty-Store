import React, {
  useState,
  useContext,
  useEffect,
  useMemo,
  useRef
} from "react";

import { useNavigate } from "react-router-dom";

import "./ProductDetails.css";

import { CartContext } from "../context/CartContext";

import {
  addReview,
  getReviews,
  getRating
} from "../services/reviewService";

function ProductDetails({ product }) {
  const navigate = useNavigate();

  const { addToCart, cart } = useContext(CartContext);

  // =========================================================
  // STATES
  // =========================================================

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedImage, setSelectedImage] = useState("");
  const [zoom, setZoom] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const [userRating, setUserRating] = useState(5);
  const [comment, setComment] = useState("");

  const [copied, setCopied] = useState(false);

  const [showVariantSelector, setShowVariantSelector] =
    useState(false);

  const [openAttribute, setOpenAttribute] = useState(null);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [showAllThumbnails, setShowAllThumbnails] = useState(false);
  const [imageTouchStart, setImageTouchStart] = useState(null);
  const [imageTouchDelta, setImageTouchDelta] = useState(0);
  const imageSwipeRef = useRef(null);
  const thumbnailRailRef = useRef(null);
  const suppressImageClickRef = useRef(false);

  // =========================================================
  // PRODUCT IMAGES
  // =========================================================

  const productImages = useMemo(() => {
    if (!product) return [];

    const images = [];

    const collect = (source) => {
      if (!Array.isArray(source)) return;
      source.forEach((image) => {
        if (typeof image === "string" && image.trim()) {
          images.push(image.trim());
        }
      });
    };

    collect(product.images);
    if (typeof product.image === "string" && product.image.trim()) {
      images.push(product.image.trim());
    }
    collect(product.gallery);
    collect(product.photos);

    return [...new Set(images)];
  }, [product]);

  // =========================================================
  // VARIANTS
  // =========================================================

  const variants = useMemo(() => {
    if (
      !product ||
      !Array.isArray(product.variants)
    ) {
      return [];
    }

    return product.variants.filter(Boolean);
  }, [product]);

  // =========================================================
  // VARIANT PRICE
  // =========================================================

  const getVariantPrice = (variant) => {
    if (!variant) return 0;

    const price =
      variant.price ??
      variant.salePrice ??
      variant.finalPrice ??
      0;

    const numericPrice = Number(price);

    return Number.isFinite(numericPrice)
      ? numericPrice
      : 0;
  };

  const getVariantOldPrice = (variant) => {
    if (!variant) return 0;

    const price =
      variant.oldPrice ??
      variant.compareAtPrice ??
      variant.originalPrice ??
      0;

    const numericPrice = Number(price);

    return Number.isFinite(numericPrice)
      ? numericPrice
      : 0;
  };

  const getVariantStock = (variant) => {
    if (!variant) return 0;

    const stock = Number(
      variant.stock ?? 0
    );

    return Number.isFinite(stock)
      ? stock
      : 0;
  };

  // =========================================================
  // ADMIN-CONTROLLED VARIANT GROUPS
  // =========================================================

  const normalizeClientVariantGroup = (group = {}, index = 0) => {
    const id = String(
      group.id ||
        group.key ||
        group.attribute ||
        group.attributeKey ||
        `group-${index}`
    ).trim() || `group-${index}`;

    const name = String(
      group.name ||
        group.title ||
        group.label ||
        group.displayName ||
        group.groupName ||
        `الخيار ${index + 1}`
    ).trim();

    const aliases = [
      id,
      group.key,
      group.attribute,
      group.attributeKey,
      group.name,
      group.title,
      group.label,
      group.displayName,
      group.groupName
    ]
      .filter((value) => value !== undefined && value !== null)
      .map((value) => String(value).trim())
      .filter(Boolean);

    const options = (Array.isArray(group.options) ? group.options : [])
      .map((option, optionIndex) => {
        if (option && typeof option === "object") {
          const value = String(
            option.value ??
              option.name ??
              option.label ??
              option.title ??
              `اختيار ${optionIndex + 1}`
          ).trim();

          const rawPrice =
            option.price ??
            option.optionPrice ??
            option.amount ??
            option.salePrice ??
            option.finalPrice ??
            null;

          const rawOldPrice =
            option.oldPrice ??
            option.compareAtPrice ??
            option.originalPrice ??
            null;

          const rawStock =
            option.stock ??
            option.quantity ??
            option.availableStock ??
            null;

          const numericPrice =
            rawPrice === "" || rawPrice === null || rawPrice === undefined
              ? null
              : Number(rawPrice);

          const numericOldPrice =
            rawOldPrice === "" ||
            rawOldPrice === null ||
            rawOldPrice === undefined
              ? null
              : Number(rawOldPrice);

          const numericStock =
            rawStock === "" || rawStock === null || rawStock === undefined
              ? null
              : Number(rawStock);

          const images = [
            option.image,
            ...(Array.isArray(option.images) ? option.images : [])
          ]
            .filter((image) => typeof image === "string" && image.trim())
            .map((image) => image.trim());

          return {
            id: String(
              option.id ||
                `${id}-option-${optionIndex}`
            ).trim(),
            value,
            label: String(
              option.label ||
                option.name ||
                option.title ||
                value
            ).trim(),
            price:
              Number.isFinite(numericPrice) && numericPrice >= 0
                ? numericPrice
                : null,
            oldPrice:
              Number.isFinite(numericOldPrice) && numericOldPrice >= 0
                ? numericOldPrice
                : null,
            stock:
              Number.isFinite(numericStock) && numericStock >= 0
                ? numericStock
                : null,
            sku: String(option.sku || option.SKU || "").trim(),
            color: String(
              option.color ||
                option.colorCode ||
                option.hex ||
                ""
            ).trim(),
            image: images[0] || "",
            images: [...new Set(images)]
          };
        }

        const value = String(option ?? "").trim();
        return {
          id: `${id}-option-${optionIndex}`,
          value,
          label: value,
          price: null,
          oldPrice: null,
          stock: null,
          sku: "",
          color: "",
          image: "",
          images: []
        };
      })
      .filter((option) => option.value);

    return {
      id,
      name,
      aliases: [...new Set(aliases)],
      options
    };
  };

  const adminVariantGroups = useMemo(() => {
    const raw = Array.isArray(product?.variantGroups)
      ? product.variantGroups
      : Array.isArray(product?.variantSettings?.groups)
        ? product.variantSettings.groups
        : Array.isArray(product?.optionGroups)
          ? product.optionGroups
          : [];

    return raw
      .map(normalizeClientVariantGroup)
      .filter((group) => group.name && group.options.length);
  }, [product]);

  const hasVariants =
    variants.length > 0 || adminVariantGroups.length > 0;

  const getVariantAttributes = (variant) => {
    if (!variant) return {};

    const sources = [
      variant.attributes,
      variant.options,
      variant.specifications,
      variant.optionValues
    ];

    for (const source of sources) {
      if (
        source &&
        typeof source === "object" &&
        !Array.isArray(source) &&
        Object.keys(source).length
      ) {
        return source;
      }
    }

    return {};
  };

  const normalizeComparable = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const unwrapVariantValue = (value) => {
    if (value && typeof value === "object") {
      return (
        value.value ??
        value.name ??
        value.label ??
        value.title ??
        ""
      );
    }

    return value ?? "";
  };

  const getAttributeAliases = (attribute) => {
    const group = adminVariantGroups.find((item) =>
      item.aliases.some(
        (alias) =>
          normalizeComparable(alias) ===
          normalizeComparable(attribute)
      )
    );

    return group?.aliases?.length
      ? group.aliases
      : [String(attribute)];
  };

  const getVariantAttributeValue = (variant, attribute) => {
    if (!variant || !attribute) return "";

    const attributes = getVariantAttributes(variant);
    const aliases = getAttributeAliases(attribute);

    const directAttributeKeys = [
      ...aliases,
      attribute,
      String(attribute).trim()
    ].filter(Boolean);

    for (const key of directAttributeKeys) {
      if (
        attributes[key] !== undefined &&
        attributes[key] !== null
      ) {
        return unwrapVariantValue(attributes[key]);
      }
    }

    const normalizedAliases = directAttributeKeys.map(
      normalizeComparable
    );

    const matchedAttributeKey = Object.keys(attributes).find(
      (key) =>
        normalizedAliases.includes(
          normalizeComparable(key)
        )
    );

    if (matchedAttributeKey) {
      return unwrapVariantValue(
        attributes[matchedAttributeKey]
      );
    }

    const directVariantKey = Object.keys(variant).find((key) =>
      normalizedAliases.includes(normalizeComparable(key))
    );

    if (directVariantKey) {
      return unwrapVariantValue(variant[directVariantKey]);
    }

    return "";
  };

  const attributeGroups = useMemo(() => {
    const groups = {};

    adminVariantGroups.forEach((group) => {
      groups[group.id] = group.options.map(
        (option) => option.value
      );
    });

    // توافق كامل مع المنتجات القديمة التي لا تحتوي مجموعات أدمن صريحة.
    if (!adminVariantGroups.length) {
      variants.forEach((variant) => {
        Object.entries(getVariantAttributes(variant)).forEach(
          ([key, value]) => {
            const unwrapped = unwrapVariantValue(value);

            if (
              unwrapped === undefined ||
              unwrapped === null ||
              String(unwrapped).trim() === ""
            ) {
              return;
            }

            if (!groups[key]) groups[key] = [];

            const stringValue = String(unwrapped).trim();

            if (!groups[key].includes(stringValue)) {
              groups[key].push(stringValue);
            }
          }
        );
      });
    }

    return groups;
  }, [adminVariantGroups, variants]);

  const attributeKeys = Object.keys(attributeGroups);
  const hasAttributeVariants = attributeKeys.length > 0;

  // IMPORTANT: keep this calculation above every callback/render branch
  // that reads selectedOptionsCount to avoid temporal-dead-zone errors.
  const selectedOptionsCount = Object.keys(selectedOptions).filter(
    (key) =>
      selectedOptions[key] !== undefined &&
      selectedOptions[key] !== null &&
      String(selectedOptions[key]).trim() !== ""
  ).length;

  const getAdminAttributeLabel = (key) => {
    const explicitGroup = adminVariantGroups.find(group => String(group.id) === String(key));
    if (explicitGroup?.name) return explicitGroup.name;

    const sources = [
      product?.variantAttributeLabels,
      product?.attributeLabels,
      product?.variantLabels,
      product?.optionLabels,
      product?.variantSettings?.attributeLabels
    ];

    for (const source of sources) {
      if (source && typeof source === "object" && !Array.isArray(source)) {
        const value = source[key];
        if (typeof value === "string" && value.trim()) return value.trim();
      }
    }

    const groupArrays = [product?.optionGroups, product?.variantSettings?.groups, product?.variantSettings?.optionGroups];
    for (const groups of groupArrays) {
      if (!Array.isArray(groups)) continue;
      const group = groups.find(item => String(item?.key ?? item?.attribute ?? item?.attributeKey ?? item?.id ?? item?.name ?? "") === String(key));
      if (group) {
        const label = group.title ?? group.label ?? group.displayName ?? group.groupName ?? group.name;
        if (typeof label === "string" && label.trim()) return label.trim();
      }
    }

    return "";
  };

  const formatAttributeName = (key) => {
    const adminLabel = getAdminAttributeLabel(key);
    if (adminLabel) return adminLabel;
    const names = { color: "اللون", colour: "اللون", size: "المقاس", sizeName: "المقاس", material: "الخامة", weight: "الوزن", type: "النوع", model: "الموديل", style: "الشكل", capacity: "السعة", flavor: "النكهة", volume: "الحجم" };
    return names[key] || key;
  };

  // =========================================================
  // CURRENT PRODUCT VALUES
  // =========================================================

  const getAdminOption = (attribute, value) => {
    const group = adminVariantGroups.find((item) =>
      item.aliases.some(
        (alias) =>
          normalizeComparable(alias) ===
          normalizeComparable(attribute)
      )
    );

    if (!group) return null;

    return (
      group.options.find(
        (option) =>
          normalizeComparable(option.value) ===
          normalizeComparable(value) ||
          normalizeComparable(option.label) ===
          normalizeComparable(value)
      ) || null
    );
  };

  const getSelectedOptionStocks = (options = selectedOptions) =>
    Object.entries(options)
      .map(([attribute, value]) =>
        getAdminOption(attribute, value)
      )
      .filter(Boolean)
      .map((option) => Number(option.stock))
      .filter(
        (stock) =>
          Number.isFinite(stock) &&
          stock >= 0
      );

  const selectedOptionStocks =
    getSelectedOptionStocks();

  const selectedOptionStock =
    selectedOptionStocks.length
      ? Math.min(...selectedOptionStocks)
      : null;

  const getSelectedOptionPrice = (options = selectedOptions) => {
    const prices = Object.entries(options)
      .map(([attribute, value]) =>
        getAdminOption(attribute, value)
      )
      .filter(Boolean)
      .map((option) => Number(option.price))
      .filter(
        (price) =>
          Number.isFinite(price) &&
          price > 0
      );

    return prices.length
      ? Math.max(...prices)
      : 0;
  };

  const currentPrice = selectedVariant
    ? getVariantPrice(selectedVariant) || getSelectedOptionPrice() || Number(product?.price || 0)
    : selectedOptionStock !== null && Object.keys(selectedOptions).length > 0
      ? getSelectedOptionPrice() || Number(product?.price || 0)
      : Number(product?.price || 0);

  const currentOldPrice = selectedVariant
    ? getVariantOldPrice(selectedVariant) || Number(product?.oldPrice || 0)
    : Number(product?.oldPrice || 0);

  const currentStock = selectedVariant
    ? getVariantStock(selectedVariant)
    : selectedOptionStock !== null
      ? selectedOptionStock
      : Number(product?.stock || 0);

  const currentSKU =
    selectedVariant?.sku ||
    selectedVariant?.SKU ||
    product?.sku ||
    product?.SKU ||
    "";

  // =========================================================
  // CART COUNT
  // =========================================================

  const cartCount = (cart || []).reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0),
    0
  );

  // =========================================================
  // IMAGE INDEX
  // =========================================================

  const currentImageIndex = Math.max(
    0,
    productImages.indexOf(
      selectedImage
    )
  );

  // =========================================================
  // VARIANT IMAGES
  // =========================================================

  const getVariantImages = (variant) => {
    if (!variant) return [];

    const images = [];

    if (
      typeof variant.image ===
        "string" &&
      variant.image.trim()
    ) {
      images.push(variant.image);
    }

    if (Array.isArray(variant.images)) {
      variant.images.forEach(
        (image) => {
          if (
            typeof image ===
              "string" &&
            image.trim()
          ) {
            images.push(image);
          }
        }
      );
    }

    if (
      typeof variant.imageUrl ===
        "string" &&
      variant.imageUrl.trim()
    ) {
      images.push(
        variant.imageUrl
      );
    }

    return [...new Set(images)];
  };

  const activeGalleryImages = useMemo(() => {
    const variantImages = getVariantImages(selectedVariant);
    return [...new Set([...variantImages, ...productImages])];
  }, [selectedVariant, productImages]);

  const galleryImages = activeGalleryImages.length
    ? activeGalleryImages
    : productImages;

  const currentGalleryIndex = Math.max(
    0,
    galleryImages.indexOf(selectedImage)
  );

  const selectGalleryImage = (image) => {
    if (!image) return;
    setSelectedImage(image);
    setZoom(false);
  };

  const goGallery = (direction) => {
    if (galleryImages.length <= 1) return;

    const nextIndex =
      direction === "next"
        ? (currentGalleryIndex + 1) % galleryImages.length
        : (currentGalleryIndex - 1 + galleryImages.length) %
          galleryImages.length;

    selectGalleryImage(galleryImages[nextIndex]);
  };

  const handleImageTouchStart = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    setImageTouchStart({
      x: touch.clientX,
      y: touch.clientY
    });
    setImageTouchDelta(0);
  };

  const handleImageTouchMove = (event) => {
    if (!imageTouchStart) return;
    const touch = event.touches?.[0];
    if (!touch) return;

    setImageTouchDelta(touch.clientX - imageTouchStart.x);
  };

  const handleImageTouchEnd = () => {
    if (!imageTouchStart) return;

    const delta = imageTouchDelta;
    if (Math.abs(delta) >= 55) {
      // In RTL, a right swipe goes to the previous visual image.
      goGallery(delta < 0 ? "next" : "prev");
      suppressImageClickRef.current = true;
      window.setTimeout(() => {
        suppressImageClickRef.current = false;
      }, 350);
    }

    setImageTouchStart(null);
    setImageTouchDelta(0);
  };

  const handleImageWheel = (event) => {
    if (galleryImages.length <= 1) return;
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) return;
    event.preventDefault();
    goGallery(event.deltaX > 0 ? "next" : "prev");
  };

  const scrollThumbnailRail = (direction) => {
    const rail = thumbnailRailRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction === "next" ? 260 : -260,
      behavior: "smooth"
    });
  };

  // =========================================================
  // ATTRIBUTE OPTION PRICE
  // =========================================================

  const getMatchingVariantsForOptions = (options = selectedOptions) => {
    return variants.filter((variant) =>
      Object.entries(options).every(
        ([attribute, value]) =>
          normalizeComparable(
            getVariantAttributeValue(
              variant,
              attribute
            )
          ) === normalizeComparable(value)
      )
    );
  };

  const getAttributeOptionPrice = (attribute, value) => {
    const adminOption = getAdminOption(
      attribute,
      value
    );

    const directPrice = Number(
      adminOption?.price
    );

    if (
      Number.isFinite(directPrice) &&
      directPrice > 0
    ) {
      return {
        min: directPrice,
        max: directPrice,
        multiple: false,
        source: "admin"
      };
    }

    const possibleVariants = variants.filter(
      (variant) => {
        const attributeValue =
          getVariantAttributeValue(
            variant,
            attribute
          );

        if (
          normalizeComparable(attributeValue) !==
          normalizeComparable(value)
        ) {
          return false;
        }

        return Object.entries(
          selectedOptions
        )
          .filter(
            ([key]) => key !== attribute
          )
          .every(
            ([key, selectedValue]) =>
              normalizeComparable(
                getVariantAttributeValue(
                  variant,
                  key
                )
              ) ===
              normalizeComparable(
                selectedValue
              )
          );
      }
    );

    if (!possibleVariants.length) {
      return null;
    }

    const prices = [
      ...new Set(
        possibleVariants
          .map(getVariantPrice)
          .filter(
            (price) => price > 0
          )
      )
    ];

    if (!prices.length) {
      return null;
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return {
      min,
      max,
      multiple: min !== max,
      source: "variant"
    };
  };

  const getAttributeOptionStock = (attribute, value) => {
    const adminOption = getAdminOption(
      attribute,
      value
    );

    const directStock = Number(
      adminOption?.stock
    );

    if (
      Number.isFinite(directStock) &&
      directStock >= 0
    ) {
      return directStock;
    }

    const possibleVariants = variants.filter(
      (variant) => {
        if (
          normalizeComparable(
            getVariantAttributeValue(
              variant,
              attribute
            )
          ) !== normalizeComparable(value)
        ) {
          return false;
        }

        return Object.entries(
          selectedOptions
        )
          .filter(
            ([key]) => key !== attribute
          )
          .every(
            ([key, selectedValue]) =>
              normalizeComparable(
                getVariantAttributeValue(
                  variant,
                  key
                )
              ) ===
              normalizeComparable(
                selectedValue
              )
          );
      }
    );

    if (!possibleVariants.length) {
      return null;
    }

    const stocks = possibleVariants
      .map(getVariantStock)
      .filter((stock) => Number.isFinite(stock));

    if (!stocks.length) return null;

    return Math.max(...stocks);
  };

  // =========================================================
  // RESET PRODUCT
  // =========================================================

  useEffect(() => {
    if (!product) return;

    setQuantity(1);
    setZoom(false);
    setLightbox(false);
    setCopied(false);

    setSelectedOptions({});
    setSelectedVariant(null);

    setSelectedImage(
      productImages[0] || ""
    );

    setShowVariantSelector(false);
    setOpenAttribute(null);
  }, [
    product,
    productImages
  ]);

  // =========================================================
  // LOAD REVIEWS
  // =========================================================

  useEffect(() => {
    if (!product?.id) return;

    const loadReviews =
      async () => {
        try {
          const list =
            await getReviews(
              product.id
            );

          const rating =
            await getRating(
              product.id
            );

          setReviews(
            list || []
          );

          setAverage(
            Number(
              rating?.average || 0
            )
          );

          setReviewCount(
            Number(
              rating?.count || 0
            )
          );
        } catch (error) {
          console.log(
            "خطأ في تحميل التقييمات:",
            error
          );

          setReviews([]);
          setAverage(0);
          setReviewCount(0);
        }
      };

    loadReviews();
  }, [product]);

  // =========================================================
  // HANDLE VARIANT CHANGE
  // =========================================================

  const normalizeSelectedOptionsFromVariant = (variant) => {
    const rawAttributes = getVariantAttributes(variant);

    if (!adminVariantGroups.length) {
      return { ...rawAttributes };
    }

    const normalized = {};

    adminVariantGroups.forEach((group) => {
      const value = getVariantAttributeValue(
        variant,
        group.id
      );

      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        normalized[group.id] = value;
      }
    });

    return normalized;
  };

  const handleVariantChange = (
    variant
  ) => {
    if (!variant) return;

    if (
      getVariantStock(
        variant
      ) <= 0
    ) {
      return;
    }

    setSelectedVariant(
      variant
    );

    setSelectedOptions(
      normalizeSelectedOptionsFromVariant(
        variant
      )
    );

    setQuantity(1);

    const variantImages =
      getVariantImages(
        variant
      );

    if (
      variantImages.length
    ) {
      setSelectedImage(
        variantImages[0]
      );

      setZoom(false);
    }

    setOpenAttribute(null);
  };

  // =========================================================
  // HANDLE ATTRIBUTE CHANGE
  // =========================================================

  const handleAttributeChange = (attribute, value) => {
    const nextOptions = {
      ...selectedOptions,
      [attribute]: value
    };

    setSelectedOptions(nextOptions);
    setQuantity(1);

    const allSelected = attributeKeys.every(
      (key) =>
        nextOptions[key] !== undefined &&
        nextOptions[key] !== null &&
        String(nextOptions[key]).trim() !== ""
    );

    if (!allSelected) {
      setSelectedVariant(null);
      return;
    }

    // أولاً نبحث عن الـ combination الذي حفظه الأدمن.
    // لا نستبعد المخزون هنا، حتى لو الـ combination موجود لكنه نفد،
    // لأن العميل لازم يشوف أنه غير متاح بدل ما نعرض له بيانات اختيار آخر.
    const exactVariants = getMatchingVariantsForOptions(
      nextOptions
    );

    const matchingVariant =
      exactVariants.find(
        (variant) =>
          getVariantStock(variant) > 0
      ) || exactVariants[0] || null;

    if (matchingVariant) {
      setSelectedVariant(
        matchingVariant
      );

      const variantImages =
        getVariantImages(
          matchingVariant
        );

      if (variantImages.length) {
        setSelectedImage(
          variantImages[0]
        );
        setZoom(false);
      }

      setOpenAttribute(null);
      return;
    }

    // لو الأدمن لم يحفظ combinations كاملة، نستخدم مخزون
    // الخيارات نفسها كـ fallback.
    const optionStocks = attributeKeys.map(
      (key) => {
        const option = getAdminOption(
          key,
          nextOptions[key]
        );
        const stock = Number(
          option?.stock
        );

        return Number.isFinite(stock) &&
          stock >= 0
          ? stock
          : null;
      }
    );

    const hasExplicitOptionStock =
      optionStocks.every(
        (stock) => stock !== null
      );

    if (
      hasExplicitOptionStock &&
      Math.min(...optionStocks) > 0
    ) {
      setSelectedVariant(null);
      setOpenAttribute(null);
      return;
    }

    setSelectedVariant(null);
  };

  // =========================================================
  // ATTRIBUTE AVAILABILITY
  // =========================================================

  const isAttributeValueAvailable = (
    attribute,
    value
  ) => {
    const directStock =
      getAttributeOptionStock(
        attribute,
        value
      );

    // مخزون صريح من الأدمن هو المصدر الأول.
    if (directStock !== null) {
      if (directStock <= 0) {
        return false;
      }

      return Object.entries(
        selectedOptions
      )
        .filter(
          ([key]) => key !== attribute
        )
        .every(
          ([key, selectedValue]) => {
            const selectedOption =
              getAdminOption(
                key,
                selectedValue
              );

            const selectedStock =
              Number(
                selectedOption?.stock
              );

            if (
              Number.isFinite(
                selectedStock
              ) &&
              selectedStock >= 0
            ) {
              return selectedStock > 0;
            }

            return true;
          }
        );
    }

    // وإلا نعتمد على combinations المحفوظة في variants.
    return variants.some((variant) => {
      if (
        getVariantStock(variant) <= 0
      ) {
        return false;
      }

      if (
        normalizeComparable(
          getVariantAttributeValue(
            variant,
            attribute
          )
        ) !== normalizeComparable(value)
      ) {
        return false;
      }

      return Object.entries(
        selectedOptions
      )
        .filter(
          ([key]) => key !== attribute
        )
        .every(
          ([key, selectedValue]) =>
            normalizeComparable(
              getVariantAttributeValue(
                variant,
                key
              )
            ) ===
            normalizeComparable(
              selectedValue
            )
        );
    });
  };

  // =========================================================
  // QUANTITY
  // =========================================================

  const increaseQuantity = () => {
    if (
      hasVariants &&
      !selectedVariant &&
      !(hasAttributeVariants && selectedOptionsCount === attributeKeys.length && currentStock > 0)
    ) {
      setShowVariantSelector(
        true
      );
      return;
    }

    if (currentStock <= 0) {
      alert(
        "هذا المنتج غير متوفر حالياً"
      );
      return;
    }

    if (
      quantity >= currentStock
    ) {
      alert(
        "الكمية المطلوبة أكبر من المخزون المتاح"
      );
      return;
    }

    setQuantity(
      (prev) => prev + 1
    );
  };

  const decreaseQuantity = () => {
    setQuantity(
      (prev) =>
        prev > 1
          ? prev - 1
          : 1
    );
  };

  // =========================================================
  // ADD TO CART
  // =========================================================

  const handleAddToCart = () => {
    const configurationReady =
      !hasVariants ||
      Boolean(selectedVariant) ||
      (
        hasAttributeVariants &&
        selectedOptionsCount === attributeKeys.length &&
        currentStock > 0
      );

    if (!configurationReady) {
      setShowVariantSelector(true);

      alert(
        hasAttributeVariants
          ? "اختار تفاصيل المنتج أولاً"
          : "اختر النوع أولاً"
      );

      return;
    }

    if (currentStock <= 0) {
      alert(
        "هذا المنتج غير متوفر حالياً"
      );
      return;
    }

    if (
      quantity > currentStock
    ) {
      alert(
        "الكمية المطلوبة أكبر من المخزون المتاح"
      );
      return;
    }

    const cartId = selectedVariant
      ? `${product.id}-${selectedVariant.id}`
      : hasAttributeVariants
        ? `${product.id}-options-${JSON.stringify(
            Object.keys(selectedOptions)
              .sort()
              .reduce((acc, key) => {
                acc[key] = selectedOptions[key];
                return acc;
              }, {})
          )}`
        : product.id;

    addToCart({
      ...product,

      price: currentPrice,
      oldPrice:
        currentOldPrice,
      stock: currentStock,

      quantity,

      cartId,

      selectedVariant:
        selectedVariant
          ? {
              ...selectedVariant
            }
          : null,

      selectedOptions: {
        ...selectedOptions
      },

      selectedImage:
        selectedImage || null,

      sku: currentSKU
    });

    alert(
      `تم إضافة ${quantity} من المنتج للسلة 🛒`
    );
  };

  // =========================================================
  // IMAGE NAVIGATION
  // =========================================================

  const showPreviousImage = () => {
    goGallery("prev");
  };

  const showNextImage = () => {
    goGallery("next");
  };

  // =========================================================
  // LIGHTBOX
  // =========================================================

  const openLightbox = () => {
    if (
      !galleryImages.length
    ) {
      return;
    }

    setLightboxIndex(
      currentGalleryIndex
    );

    setLightbox(true);
  };

  const changeLightboxImage = (direction) => {
    if (galleryImages.length <= 1) return;

    setLightboxIndex((prev) => {
      if (direction === "next") {
        return prev >= galleryImages.length - 1 ? 0 : prev + 1;
      }

      return prev <= 0 ? galleryImages.length - 1 : prev - 1;
    });
  };

  useEffect(() => {
    if (!lightbox || !galleryImages[lightboxIndex]) return;
    setSelectedImage(galleryImages[lightboxIndex]);
  }, [lightboxIndex, lightbox, galleryImages]);

  // =========================================================
  // LIGHTBOX KEYBOARD
  // =========================================================

  useEffect(() => {
    if (!lightbox) return;

    const handleKeyDown = (
      event
    ) => {
      if (
        event.key === "Escape"
      ) {
        setLightbox(false);
      }

      if (
        event.key === "ArrowLeft"
      ) {
        changeLightboxImage(
          "next"
        );
      }

      if (
        event.key === "ArrowRight"
      ) {
        changeLightboxImage(
          "prev"
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    lightbox,
    galleryImages.length
  ]);

  // =========================================================
  // SHARE
  // =========================================================

  const handleShare = async () => {
    const shareData = {
      title:
        product.title ||
        "منتج",

      text: `شوف المنتج ده: ${
        product.title ||
        "منتج"
      }`,

      url:
        window.location.href
    };

    try {
      if (
        navigator.share
      ) {
        await navigator.share(
          shareData
        );

        return;
      }

      await navigator.clipboard.writeText(
        window.location.href
      );

      setCopied(true);

      setTimeout(
        () =>
          setCopied(false),
        2000
      );
    } catch (error) {
      console.log(
        "Share cancelled:",
        error
      );
    }
  };

  // =========================================================
  // BACK TO CATEGORY
  // =========================================================

  const handleBackToCategory = () => {
    const categoryId =
      product?.categoryId ||
      product?.categoryID ||
      product?.category?.id;

    if (categoryId) {
      navigate(
        `/category/${encodeURIComponent(
          categoryId
        )}`
      );

      return;
    }

    navigate("/");
  };

  // =========================================================
  // SUBMIT REVIEW
  // =========================================================

  const handleSubmitReview =
    async () => {
      if (!comment.trim()) {
        alert(
          "اكتب رأيك عن المنتج أولاً"
        );
        return;
      }

      try {
        await addReview(
          product.id,
          {
            rating:
              userRating,

            comment:
              comment.trim()
          }
        );

        const list =
          await getReviews(
            product.id
          );

        const rating =
          await getRating(
            product.id
          );

        setReviews(
          list || []
        );

        setAverage(
          Number(
            rating?.average || 0
          )
        );

        setReviewCount(
          Number(
            rating?.count || 0
          )
        );

        setComment("");
        setUserRating(5);

        alert(
          "تم إضافة تقييمك بنجاح ⭐"
        );
      } catch (error) {
        console.log(
          "Review Error:",
          error
        );

        alert(
          "حدث خطأ أثناء إضافة التقييم"
        );
      }
    };

  // =========================================================
  // PRODUCT NOT FOUND
  // =========================================================

  if (!product) {
    return (
      <div className="product-not-found">
        <div className="product-not-found-card">
          <div className="not-found-icon">
            🛍️
          </div>

          <h2>
            المنتج غير موجود
          </h2>

          <p>
            المنتج المطلوب غير متاح حالياً.
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

  // =========================================================
  // RATING
  // =========================================================

  const displayedRating =
    average > 0
      ? average
      : Number(
          product.rating || 5
        );

  // =========================================================
  // DISCOUNT
  // =========================================================

  const discountPercent =
    currentOldPrice >
      currentPrice &&
    currentOldPrice > 0 &&
    currentPrice > 0
      ? Math.round(
          ((currentOldPrice -
            currentPrice) /
            currentOldPrice) *
            100
        )
      : 0;

  const hasFinalVariantPrice =
    !hasVariants ||
    Boolean(selectedVariant) ||
    (
      hasAttributeVariants &&
      selectedOptionsCount === attributeKeys.length &&
      currentStock > 0
    );

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      className="product-details"
      dir="rtl"
    >
      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <div className="product-details-top">
        <div className="details-back-actions">
          <button
            type="button"
            className="back-store-btn back-category-btn"
            onClick={
              handleBackToCategory
            }
          >
            ← العودة للقسم
          </button>

          <button
            type="button"
            className="back-store-btn back-home-btn"
            onClick={() =>
              navigate("/")
            }
          >
            الرئيسية
          </button>
        </div>

        <div className="details-top-actions">
          <button
            type="button"
            className="details-share-btn"
            onClick={
              handleShare
            }
            aria-label="مشاركة"
          >
            🔗
            <span>
              {copied
                ? "تم"
                : "مشاركة"}
            </span>
          </button>

          <button
            type="button"
            className="details-cart-btn"
            onClick={() =>
              navigate("/cart")
            }
            aria-label="السلة"
          >
            🛒

            {cartCount > 0 && (
              <span className="details-cart-count">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =====================================================
          MAIN PRODUCT
      ===================================================== */}

      <div className="product-details-main">
        {/* ===================================================
            IMAGES
        =================================================== */}

        <section className="product-images-section">
          <div className="product-media-card">
            <div className="product-media-head">
              <div className="media-head-copy">
                <span className="media-kicker">صور المنتج</span>
                <span className="media-counter">
                  {currentGalleryIndex + 1} / {galleryImages.length || 1}
                </span>
              </div>

              <div className="media-head-actions">
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="media-arrow media-arrow-prev"
                      onClick={showPreviousImage}
                      aria-label="الصورة السابقة"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="media-arrow"
                      onClick={showNextImage}
                      aria-label="الصورة التالية"
                    >
                      ›
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="media-fullscreen-btn"
                  onClick={() => setIsImageFullscreen(true)}
                  aria-label="عرض الصور بملء الشاشة"
                >
                  ⛶
                </button>
              </div>
            </div>

            <div
              ref={imageSwipeRef}
              className={`product-image-stage ${
                zoom ? "is-zoomed" : ""
              }`}
              onTouchStart={handleImageTouchStart}
              onTouchMove={handleImageTouchMove}
              onTouchEnd={handleImageTouchEnd}
              onWheel={handleImageWheel}
              onDoubleClick={() => setIsImageFullscreen(true)}
              onClick={() => {
                if (suppressImageClickRef.current) return;
                openLightbox();
              }}
              role="button"
              tabIndex={0}
              aria-label="معرض صور المنتج"
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openLightbox();
                }
                if (event.key === "ArrowLeft") showNextImage();
                if (event.key === "ArrowRight") showPreviousImage();
              }}
            >
              {discountPercent > 0 && (
                <span className="product-discount-badge">
                  خصم {discountPercent}%
                </span>
              )}

              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.title || "صورة المنتج"}
                  className="main-image"
                  draggable="false"
                  style={{
                    transform:
                      imageTouchDelta && Math.abs(imageTouchDelta) > 10
                        ? `translateX(${imageTouchDelta * 0.08}px)`
                        : undefined
                  }}
                  onMouseEnter={() => setZoom(true)}
                  onMouseLeave={() => setZoom(false)}
                />
              ) : (
                <div className="product-image-placeholder">
                  <span>🛍️</span>
                  <small>لا توجد صورة</small>
                </div>
              )}

              {galleryImages.length > 1 && (
                <div className="image-swipe-hint" aria-hidden="true">
                  <span>اسحب للتصفح</span>
                </div>
              )}

              <button
                type="button"
                className="image-zoom-button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsImageFullscreen(true);
                }}
                aria-label="تكبير الصورة"
              >
                ⤢
              </button>
            </div>

            {galleryImages.length > 1 && (
              <div className="image-dots" aria-label="التنقل بين الصور">
                {galleryImages.map((image, index) => (
                  <button
                    type="button"
                    key={`dot-${image}-${index}`}
                    className={
                      index === currentGalleryIndex
                        ? "image-dot active"
                        : "image-dot"
                    }
                    onClick={() => selectGalleryImage(image)}
                    aria-label={`الصورة ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {galleryImages.length > 0 && (
              <div className="thumbnail-gallery-shell">
                {galleryImages.length > 5 && (
                  <button
                    type="button"
                    className="thumbnail-scroll-btn"
                    onClick={() => scrollThumbnailRail("prev")}
                    aria-label="صور سابقة"
                  >
                    ‹
                  </button>
                )}

                <div
                  className="image-gallery"
                  ref={thumbnailRailRef}
                  aria-label="صور المنتج المصغرة"
                >
                  {galleryImages.map((image, index) => (
                    <button
                      type="button"
                      key={`${image}-${index}`}
                      className={
                        selectedImage === image
                          ? "gallery-thumb active"
                          : "gallery-thumb"
                      }
                      onClick={() => selectGalleryImage(image)}
                      aria-label={`عرض الصورة ${index + 1}`}
                    >
                      <img
                        src={image}
                        alt={`${product.title || "المنتج"} ${index + 1}`}
                        loading={index > 3 ? "lazy" : "eager"}
                        draggable="false"
                      />
                      {selectedImage === image && (
                        <span className="thumb-active-mark">✓</span>
                      )}
                    </button>
                  ))}
                </div>

                {galleryImages.length > 5 && (
                  <button
                    type="button"
                    className="thumbnail-scroll-btn"
                    onClick={() => scrollThumbnailRail("next")}
                    aria-label="صور تالية"
                  >
                    ›
                  </button>
                )}
              </div>
            )}

            <div className="media-feature-strip">
              <span>⌕ تكبير عالي الدقة</span>
              <span>↔ سحب للتصفح</span>
              <span>⛶ عرض كامل</span>
            </div>
          </div>
        </section>

        {/* ===================================================
            PRODUCT INFO
        =================================================== */}

        <section className="product-info-section">
          {product.categoryName && (
            <div className="product-category-label">
              {
                product.categoryName
              }
            </div>
          )}

          <h1 className="product-title">
            {product.title ||
              product.name ||
              "منتج بدون اسم"}
          </h1>

          {/* =================================================
              COMPACT RATING
          ================================================= */}

          <div className="product-rating product-rating-compact">
            <span className="rating-stars">
              {"★".repeat(
                Math.round(
                  displayedRating
                )
              )}

              <span className="rating-stars-empty">
                {"★".repeat(
                  Math.max(
                    0,
                    5 -
                      Math.round(
                        displayedRating
                      )
                  )
                )}
              </span>
            </span>

            <strong>
              {displayedRating.toFixed(
                1
              )}
            </strong>

            <span className="rating-count">
              {reviewCount || 0}
            </span>
          </div>

          {currentSKU && (
            <div className="product-sku">
              SKU: {currentSKU}
            </div>
          )}

          <div className="product-description">
            <p>
              {product.description ||
                "منتج مميز بجودة عالية، مناسب للاستخدام اليومي."}
            </p>
          </div>

          {/* =================================================
              VARIANTS
          ================================================= */}

          {hasVariants && (
            <div className="product-variant-selector premium-variant-selector">
              <div className="variant-section-head premium-variant-header">
                <div className="variant-header-copy">
                  <span className="section-kicker">خيارات المنتج</span>
                  <h3>
                    {selectedOptionsCount > 0
                      ? "اختياراتك"
                      : "اختار المواصفات المناسبة"}
                  </h3>
                  <p>
                  </p>
                </div>

                <div className="variant-progress-wrap premium-progress-wrap">
                  <div className="variant-progress-topline">
                    <span className="variant-selected-count">
                      {hasAttributeVariants
                        ? `${selectedOptionsCount}/${attributeKeys.length}`
                        : "جاهز"}
                    </span>
                    <span className="variant-progress-label">
                      {hasAttributeVariants
                        ? "مواصفات محددة"
                        : "اختيار المنتج"}
                    </span>
                  </div>

                  {hasAttributeVariants && (
                    <div
                      className="variant-progress-bar"
                      aria-label="نسبة اكتمال اختيار المواصفات"
                    >
                      <span
                        style={{
                          width: `${
                            attributeKeys.length
                              ? Math.min(
                                  100,
                                  (selectedOptionsCount /
                                    attributeKeys.length) *
                                    100
                                )
                              : 0
                          }%`
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {hasAttributeVariants && (
                <div className="product-attribute-selector premium-attribute-accordion">
                  {Object.entries(attributeGroups).map(
                    ([attribute, values], groupIndex) => {
                      const selectedValue =
                        selectedOptions[attribute];

                      const selectedAdminOption = selectedValue
                        ? getAdminOption(
                            attribute,
                            selectedValue
                          )
                        : null;

                      const group = adminVariantGroups.find((item) =>
                        item.aliases.some(
                          (alias) =>
                            normalizeComparable(alias) ===
                            normalizeComparable(attribute)
                        )
                      );

                      const groupLabel =
                        group?.name ||
                        formatAttributeName(attribute) ||
                        `الخيار ${groupIndex + 1}`;

                      const isOpen =
                        openAttribute === attribute;

                      return (
                        <div
                          className={`variant-option-group premium-variant-accordion-group ${
                            selectedValue ? "has-selection" : ""
                          } ${isOpen ? "is-open" : ""}`}
                          key={attribute}
                        >
                          <button
                            type="button"
                            className="variant-group-toggle premium-variant-group-toggle"
                            aria-expanded={isOpen}
                            onClick={() =>
                              setOpenAttribute(
                                isOpen ? null : attribute
                              )
                            }
                          >
                            <span className="variant-group-toggle-main">
                              <span className="variant-group-toggle-copy">
                                <strong>{groupLabel}</strong>

                                <small>
                                  {selectedValue
                                    ? `المحدد: ${
                                        selectedAdminOption?.label ||
                                        selectedValue
                                      }`
                                    : `${values.length} ${
                                        values.length === 1
                                          ? "اختيار متاح"
                                          : "اختيارات متاحة"
                                      }`}
                                </small>
                              </span>
                            </span>

                            <span className="variant-group-toggle-side">
                              {selectedValue && (
                                <span className="variant-group-selected-chip premium-selected-chip">
                                  {selectedAdminOption?.label ||
                                    selectedValue}
                                </span>
                              )}

                              {selectedValue && (
                                <span
                                  role="button"
                                  tabIndex={0}
                                  className="clear-attribute-btn premium-clear-option"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();

                                    const next = {
                                      ...selectedOptions
                                    };

                                    delete next[attribute];

                                    setSelectedOptions(next);
                                    setSelectedVariant(null);
                                    setQuantity(1);
                                  }}
                                  onKeyDown={(event) => {
                                    if (
                                      event.key === "Enter" ||
                                      event.key === " "
                                    ) {
                                      event.preventDefault();
                                      event.stopPropagation();

                                      const next = {
                                        ...selectedOptions
                                      };

                                      delete next[attribute];

                                      setSelectedOptions(next);
                                      setSelectedVariant(null);
                                      setQuantity(1);
                                    }
                                  }}
                                >
                                  مسح
                                </span>
                              )}

                              <span className="variant-group-chevron">
                                {isOpen ? "⌃" : "⌄"}
                              </span>
                            </span>
                          </button>

                          {isOpen && (
                            <div className="variant-group-panel premium-variant-panel">
                              <div className="variant-panel-heading">
                                <div>
                                  <strong>اختار {groupLabel}</strong>
                                  <small>
                                    {values.length} 
                                  </small>
                                </div>

                                {selectedValue && (
                                  <span className="variant-panel-current">
                                    ✓ {selectedAdminOption?.label || selectedValue}
                                  </span>
                                )}
                              </div>

                              <div className="attribute-options premium-options premium-option-grid">
                                {values.map((value, optionIndex) => {
                                  const adminOption = getAdminOption(
                                    attribute,
                                    value
                                  );

                                  const available =
                                    isAttributeValueAvailable(
                                      attribute,
                                      value
                                    );

                                  const active =
                                    normalizeComparable(
                                      selectedOptions[attribute]
                                    ) === normalizeComparable(value);

                                  const optionStock =
                                    getAttributeOptionStock(
                                      attribute,
                                      value
                                    );

                                  const optionPrice =
                                    getAttributeOptionPrice(
                                      attribute,
                                      value
                                    );

                                  const optionLabel =
                                    adminOption?.label ||
                                    value;

                                  const optionColor =
                                    adminOption?.color || "";

                                  const lowerAttribute =
                                    String(groupLabel).toLowerCase();

                                  const isColor =
                                    lowerAttribute.includes("لون") ||
                                    lowerAttribute.includes("color") ||
                                    lowerAttribute.includes("colour") ||
                                    String(attribute)
                                      .toLowerCase()
                                      .includes("color") ||
                                    String(attribute)
                                      .toLowerCase()
                                      .includes("colour");

                                  const hasStock =
                                    optionStock !== null &&
                                    Number.isFinite(
                                      Number(optionStock)
                                    );

                                  return (
                                    <button
                                      type="button"
                                      key={`${attribute}-${value}-${optionIndex}`}
                                      disabled={!available}
                                      className={`attribute-option premium-attribute-option ${
                                        active ? "active" : ""
                                      } ${
                                        !available ? "disabled" : ""
                                      }`}
                                      onClick={() =>
                                        handleAttributeChange(
                                          attribute,
                                          value
                                        )
                                      }
                                    >
                                      <span className="premium-option-main">
                                        <span className="premium-option-leading">
                                          {isColor && (
                                            <span
                                              className="attribute-color-dot premium-color-dot"
                                              style={
                                                optionColor
                                                  ? {
                                                      background: optionColor
                                                    }
                                                  : undefined
                                              }
                                            />
                                          )}

                                          <span className="premium-option-number">
                                            {String(
                                              optionIndex + 1
                                            ).padStart(2, "0")}
                                          </span>
                                        </span>

                                        <span className="premium-option-copy">
                                          <strong>{optionLabel}</strong>

                                          {hasStock && (
                                            <small
                                              className={
                                                Number(optionStock) > 0
                                                  ? "is-stocked"
                                                  : "is-empty"
                                              }
                                            >
                                              {Number(optionStock) > 0
                                                ? `${Number(
                                                    optionStock
                                                  ).toLocaleString(
                                                    "ar-EG"
                                                  )} متاح`
                                                : "غير متاح"}
                                            </small>
                                          )}
                                        </span>

                                        {active && (
                                          <span className="attribute-option-check premium-option-check">
                                            ✓
                                          </span>
                                        )}
                                      </span>

                                      <span className="premium-option-meta">
                                        {optionPrice && (
                                          <span className="attribute-option-price premium-option-price">
                                            {optionPrice.multiple
                                              ? `من ${optionPrice.min.toLocaleString(
                                                  "ar-EG"
                                                )}`
                                              : optionPrice.min.toLocaleString(
                                                  "ar-EG"
                                                )} {" "}ج.م
                                          </span>
                                        )}

                                        {!available && (
                                          <span className="premium-option-unavailable">
                                            غير متاح
                                          </span>
                                        )}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {!hasAttributeVariants && (
                <div className="variants-list premium-variants-list">
                  {variants.map((variant, index) => {
                    const stock = getVariantStock(variant);
                    const active =
                      selectedVariant?.id === variant.id;

                    const variantLabel =
                      variant.name ||
                      variant.title ||
                      variant.label ||
                      `الخيار ${index + 1}`;

                    const variantGroupLabel =
                      variant.groupName ||
                      variant.optionName ||
                      variant.attributeName ||
                      product?.variantButtonTitle ||
                      "اختيار المنتج";

                    return (
                      <button
                        key={
                          variant.id ||
                          `${variantLabel}-${index}`
                        }
                        type="button"
                        disabled={stock <= 0}
                        className={`variant-btn premium-variant-btn ${
                          active ? "active" : ""
                        } ${
                          stock <= 0 ? "out-of-stock" : ""
                        }`}
                        onClick={() =>
                          handleVariantChange(variant)
                        }
                      >
                        <span className="variant-btn-content">
                          <small>{variantGroupLabel}</small>
                          <strong>{variantLabel}</strong>
                        </span>

                        <span className="variant-btn-meta">
                          {stock > 0 ? (
                            <>
                              <strong>
                                {getVariantPrice(
                                  variant
                                ).toLocaleString("ar-EG")} {" "}ج.م
                              </strong>
                              <span>
                                {stock.toLocaleString("ar-EG")} متاح
                              </span>
                            </>
                          ) : (
                            <span>غير متوفر</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedOptionsCount > 0 && (
                <div className="variant-selection-summary premium-summary premium-selection-summary">
                  <div className="summary-title">
                    <span>✓</span>
                    <strong>الاختيارات الحالية</strong>
                  </div>

                  <div className="summary-items">
                    {Object.entries(selectedOptions).map(
                      ([key, value]) => {
                        const option = getAdminOption(
                          key,
                          value
                        );

                        return (
                          <span key={key}>
                            <b>{formatAttributeName(key)}</b>
                            <em>
                              {option?.label || value}
                            </em>
                          </span>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {hasAttributeVariants &&
                selectedOptionsCount > 0 &&
                !selectedVariant &&
                selectedOptionsCount <
                  attributeKeys.length && (
                  <div className="variant-selection-hint premium-variant-hint">
                    <span>⌁</span>
                    <div>
                      <strong>كمّل الاختيارات</strong>
                      <p>
                        اختار باقي المواصفات عشان نحدد السعر والمخزون النهائي بدقة.
                      </p>
                    </div>
                  </div>
                )}

              {hasAttributeVariants &&
                selectedOptionsCount ===
                  attributeKeys.length &&
                !selectedVariant && (
                  <div
                    className={`variant-ready-badge premium-ready-badge ${
                      currentStock > 0
                        ? "is-ready"
                        : "is-unavailable"
                    }`}
                  >
                    <span className="ready-icon">
                      {currentStock > 0 ? "✓" : "!"}
                    </span>

                    <div>
                      <strong>
                        {currentStock > 0
                          ? "الاختيار جاهز للطلب"
                          : "الاختيار غير متاح حالياً"}
                      </strong>

                      <small>
                        {currentStock > 0
                          ? `${currentStock.toLocaleString(
                              "ar-EG"
                            )} قطعة متاحة حسب مخزون الاختيارات`
                          : "جرّب اختيار مواصفة مختلفة"}
                      </small>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* =================================================
              PRICE
          ================================================= */}

          <div className="product-price-card">
            {hasFinalVariantPrice ? (
              <div className="product-price">
                <div className="current-price">
                  <strong>
                    {(
                      currentPrice *
                      quantity
                    ).toLocaleString(
                      "ar-EG"
                    )}
                  </strong>

                  <span>
                    ج.م
                  </span>
                </div>

                {currentOldPrice >
                  currentPrice && (
                  <div className="price-before">
                    <span className="old-price">
                      {Number(
                        currentOldPrice *
                          quantity
                      ).toLocaleString(
                        "ar-EG"
                      )}{" "}
                      ج.م
                    </span>

                    {discountPercent >
                      0 && (
                      <span className="discount-text">
                        وفر{" "}
                        {(
                          (currentOldPrice -
                            currentPrice) *
                          quantity
                        ).toLocaleString(
                          "ar-EG"
                        )}{" "}
                        ج.م
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="product-variant-price-placeholder">
                <span>
                  اختار التفاصيل
                </span>
              </div>
            )}

            {hasFinalVariantPrice ? (
              <div
                className={
                  currentStock > 0
                    ? "product-stock available"
                    : "product-stock unavailable"
                }
              >
                <span>
                  ●
                </span>

                {currentStock >
                0
                  ? `${currentStock} قطعة متاحة`
                  : "غير متوفر"}
              </div>
            ) : null}
          </div>

          {/* =================================================
              PURCHASE
          ================================================= */}

          <div className="purchase-row">
            <div className="quantity-box">
              <span className="quantity-label">
                الكمية
              </span>

              <div className="quantity-controls">
                <button
                  type="button"
                  onClick={
                    decreaseQuantity
                  }
                  disabled={
                    quantity <= 1
                  }
                >
                  −
                </button>

                <span className="quantity-number">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={
                    increaseQuantity
                  }
                  disabled={
                    hasVariants &&
                    !selectedVariant &&
                    !(
                      hasAttributeVariants &&
                      selectedOptionsCount === attributeKeys.length &&
                      currentStock > 0
                    )
                      ? true
                      : currentStock <= 0 ||
                        quantity >= currentStock
                  }
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              className="add-btn"
              onClick={
                handleAddToCart
              }
              disabled={
                currentStock <= 0 ||
                (
                  hasVariants &&
                  !selectedVariant &&
                  !(
                    hasAttributeVariants &&
                    selectedOptionsCount === attributeKeys.length &&
                    currentStock > 0
                  )
                )
              }
            >
              🛒

              <span>
                {hasVariants &&
                !selectedVariant &&
                !(
                  hasAttributeVariants &&
                  selectedOptionsCount === attributeKeys.length &&
                  currentStock > 0
                )
                  ? "اختيار التفاصيل"
                  : "أضف للسلة"}
              </span>
            </button>
          </div>
        </section>
      </div>

      {/* =====================================================
          REVIEWS
      ===================================================== */}

      <section className="product-reviews-section">
        <div className="reviews-header">
          <div>
            <span className="section-kicker">
              آراء العملاء
            </span>

            <h2>
              تقييمات المنتج
            </h2>
          </div>

          <div className="reviews-summary">
            <strong>
              {displayedRating.toFixed(
                1
              )}
            </strong>

            <span>
              ★
            </span>

            <small>
              {reviewCount} تقييم
            </small>
          </div>
        </div>

        {/* REVIEW FORM */}

        <div className="review-form">
          <h3>
            أضف تقييمك
          </h3>

          <div className="stars-input">
            {[1, 2, 3, 4, 5].map(
              (star) => (
                <button
                  type="button"
                  key={star}
                  className={
                    userRating >=
                    star
                      ? "star active"
                      : "star"
                  }
                  onClick={() =>
                    setUserRating(
                      star
                    )
                  }
                  aria-label={`تقييم ${star} من 5`}
                >
                  ★
                </button>
              )
            )}
          </div>

          <textarea
            placeholder="اكتب رأيك عن المنتج..."
            value={comment}
            onChange={(event) =>
              setComment(
                event.target.value
              )
            }
          />

          <button
            type="button"
            onClick={
              handleSubmitReview
            }
          >
            إرسال التقييم
          </button>
        </div>

        {/* REVIEWS LIST */}

        {reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map(
              (
                review,
                index
              ) => (
                <article
                  className="review-item"
                  key={
                    review.id ||
                    index
                  }
                >
                  <div className="review-item-header">
                    <div className="review-avatar">
                      {(
                        review.userName ||
                        review.name ||
                        "ع"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {review.userName ||
                          review.name ||
                          "عميل"}
                      </strong>

                      <div className="review-stars">
                        {"★".repeat(
                          Math.min(
                            5,
                            Math.max(
                              0,
                              Number(
                                review.rating ||
                                  0
                              )
                            )
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <p>
                    {review.comment ||
                      ""}
                  </p>
                </article>
              )
            )}
          </div>
        ) : (
          <div className="no-reviews">
            لسه مفيش تقييمات للمنتج ⭐
          </div>
        )}
      </section>

      {/* =====================================================
          FULLSCREEN PRODUCT GALLERY
      ===================================================== */}

      {isImageFullscreen && (
        <div
          className="product-fullscreen-gallery"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsImageFullscreen(false)}
        >
          <button
            type="button"
            className="fullscreen-close"
            onClick={() => setIsImageFullscreen(false)}
            aria-label="إغلاق"
          >
            ×
          </button>

          <div
            className="fullscreen-gallery-content"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={handleImageTouchStart}
            onTouchMove={handleImageTouchMove}
            onTouchEnd={handleImageTouchEnd}
          >
            <div className="fullscreen-topbar">
              <span>
                {currentGalleryIndex + 1} / {galleryImages.length}
              </span>
              <strong>{product.title || "صورة المنتج"}</strong>
            </div>

            {galleryImages.length > 1 && (
              <button
                type="button"
                className="fullscreen-nav fullscreen-prev"
                onClick={() => showPreviousImage()}
                aria-label="السابق"
              >
                ‹
              </button>
            )}

            <img
              src={galleryImages[currentGalleryIndex] || selectedImage}
              alt={product.title || "صورة المنتج"}
              className="fullscreen-product-image"
              draggable="false"
            />

            {galleryImages.length > 1 && (
              <button
                type="button"
                className="fullscreen-nav fullscreen-next"
                onClick={() => showNextImage()}
                aria-label="التالي"
              >
                ›
              </button>
            )}

            {galleryImages.length > 1 && (
              <div className="fullscreen-thumbnails">
                {galleryImages.map((image, index) => (
                  <button
                    type="button"
                    key={`fullscreen-${image}-${index}`}
                    className={
                      index === currentGalleryIndex
                        ? "fullscreen-thumb active"
                        : "fullscreen-thumb"
                    }
                    onClick={() => {
                      selectGalleryImage(image);
                    }}
                  >
                    <img
                      src={image}
                      alt={`صورة ${index + 1}`}
                      draggable="false"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="fullscreen-hint">
              اسحب الصورة للتنقل بين الصور
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          LIGHTBOX
      ===================================================== */}

      {lightbox && (
        <div
          className="product-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() =>
            setLightbox(false)
          }
          onTouchStart={handleImageTouchStart}
          onTouchMove={handleImageTouchMove}
          onTouchEnd={handleImageTouchEnd}
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={() =>
              setLightbox(false)
            }
            aria-label="إغلاق"
          >
            ×
          </button>

          {galleryImages.length >
            1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-prev"
              onClick={(event) => {
                event.stopPropagation();

                changeLightboxImage(
                  "prev"
                );
              }}
              aria-label="السابق"
            >
              ❮
            </button>
          )}

          <div
            className="lightbox-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <img
              src={
                galleryImages[
                  lightboxIndex
                ]
              }
              alt={
                product.title ||
                "صورة المنتج"
              }
            />

            {galleryImages.length >
              1 && (
              <div className="lightbox-counter">
                {lightboxIndex +
                  1}{" "}
                /{" "}
                {
                  galleryImages.length
                }
              </div>
            )}
          </div>

          {galleryImages.length >
            1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-next"
              onClick={(event) => {
                event.stopPropagation();

                changeLightboxImage(
                  "next"
                );
              }}
              aria-label="التالي"
            >
              ❯
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductDetails;