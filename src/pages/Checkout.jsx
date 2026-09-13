import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "../firebase";
import { CartContext } from "../context/CartContext";
import * as EgyptGeo from "egypt-geo-navigator";

const { getGovernorates, getDistricts } = EgyptGeo;
import "./Checkout.css";

const CLOUDINARY_CLOUD = "wkcpvsqi";
const CLOUDINARY_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "elsafty_store";
const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;
const MAX_PAYMENT_PROOF_SIZE = 5 * 1024 * 1024;

const CASH_IDS = ["cash_on_delivery", "cash", "cod"];

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const formatMoney = (value) =>
  `${Math.max(0, safeNumber(value)).toLocaleString("ar-EG", {
    maximumFractionDigits: 2,
  })} جنيه`;

const getLocalDateKey = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const generateOrderNumber = () => {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const time = [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join("");
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SWA-${stamp}-${time}-${random}`;
};

const normalizePhone = (value) => {
  let phone = String(value || "").replace(/\D/g, "");
  if (phone.startsWith("00")) phone = phone.slice(2);
  if (phone.startsWith("0")) phone = `20${phone.slice(1)}`;
  return phone;
};

/* =====================================================
   EGYPT LOCATION HELPERS
===================================================== */

const getLocationId = (item) => {
  if (
    item === null ||
    item === undefined
  ) {
    return "";
  }

  if (
    typeof item === "string" ||
    typeof item === "number"
  ) {
    return String(item).trim();
  }

  return String(
    item.id ??
      item.code ??
      item.value ??
      item.locationId ??
      item.location_id ??
      item.districtId ??
      item.district_id ??
      item.governorateId ??
      item.governorate_id ??
      ""
  ).trim();
};

/* =====================================================
   FIX ARABIC ENCODING
===================================================== */

const fixArabicEncoding = (
  value
) => {
  const text =
    String(value ?? "").trim();

  if (!text) {
    return "";
  }

  if (
    /[\u0600-\u06FF]/.test(text) &&
    !/[ØÙÃÂ]/.test(text)
  ) {
    return text;
  }

  if (/[ØÙÃÂ]/.test(text)) {
    try {
      const bytes =
        Uint8Array.from(
          Array.from(text),
          (char) =>
            char.charCodeAt(0) & 0xff
        );

      const decoded =
        new TextDecoder("utf-8").decode(
          bytes
        );

      if (
        decoded &&
        decoded !== text &&
        /[\u0600-\u06FF]/.test(
          decoded
        )
      ) {
        return decoded.trim();
      }
    } catch (error) {
      console.warn(
        "SWA Arabic encoding fix failed:",
        error
      );
    }
  }

  return text;
};

/* =====================================================
   READ LOCATION NAME
===================================================== */

const getReadableLocationName = (
  item
) => {
  if (
    item === null ||
    item === undefined
  ) {
    return "";
  }

  if (
    typeof item === "string" ||
    typeof item === "number"
  ) {
    return fixArabicEncoding(item);
  }

  const value =
    item.nameAr ??
    item.name_ar ??
    item.arabicName ??
    item.arabic_name ??
    item.name ??
    item.label ??
    item.title ??
    item.locationName ??
    item.location_name ??
    item.villageName ??
    item.village_name ??
    item.areaName ??
    item.area_name ??
    item.townName ??
    item.town_name ??
    item.nameEn ??
    item.name_en ??
    "";

  return fixArabicEncoding(value);
};

/* =====================================================
   NORMALIZE LOCATION ARRAY
===================================================== */

const normalizeLocationArray = (
  result
) => {
  if (!result) {
    return [];
  }

  if (Array.isArray(result)) {
    return result;
  }

  const possibleKeys = [
    "locations",
    "villages",
    "village",
    "data",
    "results",
    "items",
    "records",
    "towns",
    "areas",
    "children",
    "districts",
    "governorates",
  ];

  for (const key of possibleKeys) {
    if (
      Array.isArray(result?.[key])
    ) {
      return result[key];
    }
  }

  if (
    typeof result === "object"
  ) {
    const values =
      Object.values(result);

    const arrayValue =
      values.find((item) =>
        Array.isArray(item)
      );

    if (arrayValue) {
      return arrayValue;
    }

    const objectValues =
      values.filter(
        (item) =>
          item &&
          typeof item === "object"
      );

    if (objectValues.length) {
      return objectValues;
    }
  }

  return [];
};

/* =====================================================
   PREPARE LOCATIONS
===================================================== */

const prepareLocations = (
  result
) => {
  const source =
    normalizeLocationArray(result);

  const seenIds = new Set();
  const seenNames = new Set();

  const locations = source
    .map((item) => {
      if (
        item === null ||
        item === undefined
      ) {
        return null;
      }

      if (
        typeof item === "string" ||
        typeof item === "number"
      ) {
        const value =
          String(item).trim();

        if (!value) {
          return null;
        }

        return {
          id: value,
          nameAr:
            fixArabicEncoding(value),
          name:
            fixArabicEncoding(value),
          nameEn: value,
        };
      }

      const id =
        getLocationId(item);

      const name =
        getReadableLocationName(item);

      if (!id && !name) {
        return null;
      }

      const nameAr =
        fixArabicEncoding(
          item.nameAr ??
            item.name_ar ??
            item.arabicName ??
            item.arabic_name ??
            item.name ??
            name
        );

      const nameValue =
        fixArabicEncoding(
          item.name ??
            item.nameAr ??
            item.name_ar ??
            item.arabicName ??
            item.arabic_name ??
            name
        );

      return {
        ...item,

        id:
          id ||
          name,

        nameAr,

        name:
          nameValue,

        nameEn:
          item.nameEn ??
          item.name_en ??
          "",
      };
    })
    .filter(Boolean)
    .filter((item) => {
      const id =
        String(
          item.id || ""
        ).trim();

      const name =
        String(
          getReadableLocationName(item) ||
            ""
        ).trim();

      const nameKey =
        name.toLowerCase();

      if (
        id &&
        seenIds.has(id)
      ) {
        return false;
      }

      if (
        nameKey &&
        seenNames.has(nameKey)
      ) {
        return false;
      }

      if (id) {
        seenIds.add(id);
      }

      if (nameKey) {
        seenNames.add(nameKey);
      }

      return true;
    });

  locations.sort((a, b) => {
    const nameA =
      getReadableLocationName(a);

    const nameB =
      getReadableLocationName(b);

    return String(nameA).localeCompare(
      String(nameB),
      "ar",
      {
        sensitivity: "base",
      }
    );
  });

  return locations;
};

/* =====================================================
   COMPONENT
===================================================== */

const isFirestoreFieldValue = (value) =>
  value &&
  typeof value === "object" &&
  (typeof value.isEqual === "function" ||
    value.constructor?.name === "FieldValueImpl" ||
    value.constructor?.name === "Timestamp");

const sanitizeForFirestore = (value) => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (isFirestoreFieldValue(value)) return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(sanitizeForFirestore);
  if (typeof value === "object") {
    const result = {};
    Object.entries(value).forEach(([key, item]) => {
      if (item !== undefined) result[key] = sanitizeForFirestore(item);
    });
    return result;
  }
  return value;
};

const normalizePrizeType = (prize) =>
  String(
    prize?.type ||
      prize?.prizeType ||
      prize?.rewardType ||
      ""
  )
    .trim()
    .toLowerCase();

const getPrizeValue = (prize) =>
  Math.max(
    0,
    safeNumber(
      prize?.value ??
        prize?.amount ??
        prize?.discountValue ??
        prize?.discountAmount ??
        0
    )
  );

const isPercentagePrizeType = (type) =>
  ["discount", "percentage", "percent"].includes(type);

const isFixedPrizeType = (type) =>
  ["fixed", "fixed-discount", "amount", "fixed_amount"].includes(type);

const isFreeShippingPrizeType = (type) =>
  ["free-shipping", "free_shipping", "freeshipping"].includes(type);

const isGiftPrizeType = (type) =>
  ["gift", "free-gift", "free_gift"].includes(type);

const getPrizeDescription = (prize) => {
  if (!prize) return "";
  const type = normalizePrizeType(prize);
  const value = getPrizeValue(prize);
  if (isPercentagePrizeType(type)) return `خصم ${value}%`;
  if (isFixedPrizeType(type)) return `خصم ${formatMoney(value)}`;
  if (isFreeShippingPrizeType(type)) return "شحن مجاني";
  if (isGiftPrizeType(type)) return prize.title || prize.name || "هدية مجانية";
  return prize.description || prize.title || prize.name || "جائزة من المتجر";
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart = [], setCart } = useContext(CartContext) || {};

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [governorates, setGovernorates] = useState([]);
  const [cities, setCities] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [governoratesLoading, setGovernoratesLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [villagesLoading, setVillagesLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [shippingZones, setShippingZones] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [selectedShippingZone, setSelectedShippingZone] = useState("");

  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState("");
  const [paymentProofUploading, setPaymentProofUploading] = useState(false);
  const [uploadedPaymentProof, setUploadedPaymentProof] = useState(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const [gamePrize, setGamePrize] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      if (paymentProofPreview) URL.revokeObjectURL(paymentProofPreview);
    };
  }, [paymentProofPreview]);

  useEffect(() => {
    let mounted = true;
    const loadLocations = async () => {
      try {
        setGovernoratesLoading(true);
        const result = await getGovernorates();
        if (mounted) setGovernorates(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Governorates Error:", error);
        if (mounted) setGovernorates([]);
      } finally {
        if (mounted) setGovernoratesLoading(false);
      }
    };
    loadLocations();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedGovernorate) {
      setCities([]);
      return;
    }
    let mounted = true;
    const loadCities = async () => {
      try {
        setCitiesLoading(true);
        const result = await getDistricts(selectedGovernorate);
        if (mounted) setCities(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Cities Error:", error);
        if (mounted) setCities([]);
      } finally {
        if (mounted) setCitiesLoading(false);
      }
    };
    loadCities();
    return () => {
      mounted = false;
    };
  }, [selectedGovernorate]);

  useEffect(() => {
    let cancelled = false;

    if (
      !selectedGovernorate ||
      !selectedCity
    ) {
      setVillages([]);
      setSelectedVillage("");
      setVillagesLoading(false);

      return () => {
        cancelled = true;
      };
    }

    const loadVillages =
      async () => {
        try {
          setVillagesLoading(true);

          setVillages([]);
          setSelectedVillage("");

          const governorateId =
            String(
              selectedGovernorate
            )
              .trim()
              .padStart(2, "0");

          const cityId =
            String(
              selectedCity
            ).trim();

          console.log(
            "================================"
          );

          console.log(
            "SWA LOAD VILLAGES"
          );

          console.log(
            "Governorate ID:",
            governorateId
          );

          console.log(
            "City / District ID:",
            cityId
          );

          console.log(
            "================================"
          );

          /* =============================================
             BASE URL
          ============================================= */

          const baseUrl =
            import.meta.env.BASE_URL || "/";

          const normalizedBaseUrl =
            baseUrl.endsWith("/")
              ? baseUrl
              : `${baseUrl}/`;

          const jsonUrl =
            `${normalizedBaseUrl}egypt-geo/governorates/gov-${governorateId}.json`;

          console.log(
            "SWA JSON URL:",
            jsonUrl
          );

          /* =============================================
             FETCH JSON
          ============================================= */

          const response =
            await fetch(
              jsonUrl,
              {
                cache: "no-store",
              }
            );

          console.log(
            "SWA JSON STATUS:",
            response.status
          );

          console.log(
            "SWA JSON OK:",
            response.ok
          );

          if (!response.ok) {
            throw new Error(
              `فشل تحميل ملف المحافظة: ${response.status}`
            );
          }

          const governorateData =
            await response.json();

          console.log(
            "SWA GOVERNORATE DATA:",
            governorateData
          );

          /* =============================================
             DISTRICTS
          ============================================= */

          const districts =
            Array.isArray(
              governorateData?.districts
            )
              ? governorateData.districts
              : [];

          console.log(
            "SWA DISTRICTS COUNT:",
            districts.length
          );

          /* =============================================
             FIND DISTRICT BY ID
          ============================================= */

          let selectedDistrict =
            districts.find(
              (district) =>
                String(
                  district?.id ?? ""
                ).trim() === cityId
            ) || null;

          /* =============================================
             FALLBACK ID SEARCH
          ============================================= */

          if (!selectedDistrict) {
            selectedDistrict =
              districts.find(
                (district) => {
                  const possibleIds = [
                    district?.id,
                    district?.code,
                    district?.value,
                    district?.locationId,
                    district?.location_id,
                    district?.districtId,
                    district?.district_id,
                  ]
                    .filter(
                      (value) =>
                        value !==
                          null &&
                        value !==
                          undefined &&
                        String(
                          value
                        ).trim() !== ""
                    )
                    .map(
                      (value) =>
                        String(
                          value
                        ).trim()
                    );

                  return possibleIds.includes(
                    cityId
                  );
                }
              ) || null;
          }

          console.log(
            "SWA SELECTED DISTRICT:",
            selectedDistrict
          );

          /* =============================================
             DISTRICT NOT FOUND
          ============================================= */

          if (!selectedDistrict) {
            console.warn(
              "SWA DISTRICT NOT FOUND",
              {
                governorateId,
                cityId,

                availableDistricts:
                  districts.map(
                    (district) => ({
                      id:
                        district?.id,

                      nameAr:
                        fixArabicEncoding(
                          district?.nameAr
                        ),

                      nameEn:
                        district?.nameEn,

                      locationsCount:
                        Array.isArray(
                          district?.locations
                        )
                          ? district
                              .locations
                              .length
                          : 0,
                    })
                  ),
              }
            );

            if (!cancelled) {
              setVillages([]);
              setSelectedVillage("");
            }

            return;
          }

          /* =============================================
             READ LOCATIONS
          ============================================= */

          let locations = [];

          if (
            Array.isArray(
              selectedDistrict.locations
            )
          ) {
            locations =
              selectedDistrict.locations;
          } else if (
            Array.isArray(
              selectedDistrict.villages
            )
          ) {
            locations =
              selectedDistrict.villages;
          } else if (
            Array.isArray(
              selectedDistrict.areas
            )
          ) {
            locations =
              selectedDistrict.areas;
          } else if (
            Array.isArray(
              selectedDistrict.children
            )
          ) {
            locations =
              selectedDistrict.children;
          }

          console.log(
            "SWA RAW LOCATIONS:",
            locations
          );

          console.log(
            "SWA RAW LOCATIONS COUNT:",
            locations.length
          );

          /* =============================================
             PREPARE LOCATIONS
          ============================================= */

          const prepared =
            prepareLocations(
              locations
            );

          console.log(
            "SWA FINAL VILLAGES:",
            prepared
          );

          console.log(
            "SWA FINAL VILLAGES COUNT:",
            prepared.length
          );

          if (!cancelled) {
            setVillages(
              prepared
            );

            setSelectedVillage("");
          }
        } catch (error) {
          console.error(
            "SWA VILLAGES ERROR:",
            error
          );

          if (!cancelled) {
            setVillages([]);
            setSelectedVillage("");
          }
        } finally {
          if (!cancelled) {
            setVillagesLoading(false);
          }
        }
      };

    loadVillages();

    return () => {
      cancelled = true;
    };
  }, [
    selectedGovernorate,
    selectedCity,
  ]);

  useEffect(() => {
    const loadCheckoutData = async () => {
      setDataLoading(true);
      try {
        const [categorySnap, paymentSnap, shippingSnap] = await Promise.all([
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "paymentMethods")),
          getDocs(collection(db, "shippingZones")),
        ]);

        const nextCategories = categorySnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        const nextPayments = paymentSnap.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item) => item.active !== false);

        const nextShipping = shippingSnap.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item) => item.active !== false);

        setCategories(nextCategories);
        setPaymentMethods(
          nextPayments.length
            ? nextPayments
            : [
                {
                  id: "cash_on_delivery",
                  name: "الدفع عند الاستلام",
                  title: "الدفع عند الاستلام",
                  description: "ادفع قيمة الطلب عند استلامه",
                  active: true,
                },
              ]
        );
        setShippingZones(nextShipping);
      } catch (error) {
        console.error("Checkout Data Error:", error);
        setCategories([]);
        setPaymentMethods([
          {
            id: "cash_on_delivery",
            name: "الدفع عند الاستلام",
            title: "الدفع عند الاستلام",
            description: "ادفع قيمة الطلب عند استلامه",
            active: true,
          },
        ]);
        setShippingZones([]);
      } finally {
        setDataLoading(false);
      }
    };
    loadCheckoutData();
  }, []);

  useEffect(() => {
    if (!paymentMethods.length) return;
    const exists = paymentMethods.some(
      (item) => String(item.id) === String(selectedPaymentMethod)
    );
    if (!exists) {
      const cash = paymentMethods.find((item) =>
        CASH_IDS.includes(String(item.id).toLowerCase())
      );
      setSelectedPaymentMethod(cash?.id || paymentMethods[0].id);
    }
  }, [paymentMethods, selectedPaymentMethod]);

  useEffect(() => {
    if (!shippingZones.length) {
      setSelectedShippingZone("");
      return;
    }
    const exists = shippingZones.some(
      (item) => String(item.id) === String(selectedShippingZone)
    );
    if (!exists) setSelectedShippingZone(shippingZones[0].id);
  }, [shippingZones, selectedShippingZone]);

  useEffect(() => {
    try {
      const statePrize = location.state?.discountData;
      if (statePrize && typeof statePrize === "object") {
        setGamePrize(statePrize);
        localStorage.setItem("elsafty_game_prize", JSON.stringify(statePrize));
        localStorage.setItem("elsafty_wheel_prize", JSON.stringify(statePrize));
        return;
      }

      const gameSaved = localStorage.getItem("elsafty_game_prize");
      if (gameSaved) {
        const parsed = JSON.parse(gameSaved);
        if (parsed && typeof parsed === "object") {
          setGamePrize(parsed);
          return;
        }
      }

      const wheelSaved = localStorage.getItem("elsafty_wheel_prize");
      if (wheelSaved) {
        const parsed = JSON.parse(wheelSaved);
        if (parsed && typeof parsed === "object") {
          setGamePrize(parsed);
          localStorage.setItem("elsafty_game_prize", JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error("Game Prize Load Error:", error);
      setGamePrize(null);
    }
  }, [location.state]);

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [categories]);

  const findCategoryForProduct = (product) => {
    if (!product) return null;
    const categoryId =
      product.categoryId ||
      product.categoryID ||
      product.category_id ||
      product.category?.id ||
      product.category?.categoryId;

    if (categoryId) {
      const direct = categories.find(
        (item) => String(item.id) === String(categoryId)
      );
      if (direct) return direct;
    }

    if (typeof product.category === "string") {
      const category = categories.find(
        (item) =>
          String(item.id) === String(product.category) ||
          String(item.categoryNumber) === String(product.category) ||
          String(item.name || "").trim().toLowerCase() ===
            String(product.category || "").trim().toLowerCase()
      );
      if (category) return category;
    }

    const number =
      product.categoryNumber ||
      product.categoryNo ||
      product.departmentNumber;
    if (number !== undefined && number !== null && number !== "") {
      return (
        categories.find(
          (item) => String(item.categoryNumber) === String(number)
        ) || null
      );
    }
    return null;
  };

  const getCategoryWhatsapp = (product) => {
    let category = findCategoryForProduct(product);
    const visited = new Set();
    while (category && !visited.has(category.id)) {
      visited.add(category.id);
      const whatsapp = normalizePhone(
        category.whatsapp ||
          category.whatsappPhone ||
          category.whatsappNumber ||
          category.phone ||
          category.phoneNumber ||
          category.contactPhone ||
          ""
      );
      if (whatsapp) {
        return {
          id: category.id,
          name: category.name || "قسم",
          whatsapp,
        };
      }
      category = category.parentId
        ? categoryMap[category.parentId] ||
          categories.find(
            (item) => String(item.id) === String(category.parentId)
          )
        : null;
    }
    return null;
  };

  const getDepartmentsForOrder = () => {
    const map = new Map();
    cart.forEach((item) => {
      const department = getCategoryWhatsapp(item);
      if (department && !map.has(department.id)) {
        map.set(department.id, department);
      }
    });
    return Array.from(map.values());
  };

  const selectedPayment = useMemo(
    () =>
      paymentMethods.find(
        (item) => String(item.id) === String(selectedPaymentMethod)
      ) || null,
    [paymentMethods, selectedPaymentMethod]
  );

  const isCashPayment = CASH_IDS.includes(
    String(selectedPaymentMethod || "").toLowerCase()
  );

  const getPaymentNumber = (method) =>
    method?.number || method?.phone || method?.paymentNumber || "";

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const price = safeNumber(
          item?.salePrice ??
            item?.discountPrice ??
            item?.price ??
            0
        );
        const quantity = Math.max(
          1,
          safeNumber(item?.quantity ?? item?.qty ?? item?.count ?? 1, 1)
        );
        return sum + price * quantity;
      }, 0),
    [cart]
  );

  const gamePrizeType = normalizePrizeType(gamePrize);
  const gamePrizeValue = getPrizeValue(gamePrize);
  const gameDiscount = useMemo(() => {
    if (!gamePrize) return 0;
    if (isPercentagePrizeType(gamePrizeType)) {
      return Math.min(subtotal, (subtotal * gamePrizeValue) / 100);
    }
    if (isFixedPrizeType(gamePrizeType)) {
      return Math.min(subtotal, gamePrizeValue);
    }
    return 0;
  }, [gamePrize, gamePrizeType, gamePrizeValue, subtotal]);

  const gameFreeShipping = isFreeShippingPrizeType(gamePrizeType);
  const normalShippingCost = useMemo(() => {
    const zone = shippingZones.find(
      (item) => String(item.id) === String(selectedShippingZone)
    );
    return safeNumber(
      zone?.price ?? zone?.shippingCost ?? zone?.cost ?? 0
    );
  }, [shippingZones, selectedShippingZone]);

  const shippingCost = gameFreeShipping ? 0 : normalShippingCost;

  const couponDiscount = useMemo(() => {
    if (!couponData) return 0;
    const value = safeNumber(
      couponData.value ?? couponData.discount ?? couponData.amount ?? 0
    );
    const type = String(
      couponData.type || couponData.discountType || "fixed"
    ).toLowerCase();
    if (type === "percentage" || type === "percent") {
      return Math.min(subtotal - gameDiscount, ((subtotal - gameDiscount) * value) / 100);
    }
    return Math.min(Math.max(0, subtotal - gameDiscount), value);
  }, [couponData, subtotal, gameDiscount]);

  const totalDiscount = gameDiscount + couponDiscount;
  const finalTotal = Math.max(
    0,
    subtotal + shippingCost - totalDiscount
  );

  const selectedZone = shippingZones.find(
    (item) => String(item.id) === String(selectedShippingZone)
  );

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError("اكتب كود الخصم أولاً.");
      return;
    }
    setCouponLoading(true);
    setCouponError("");
    try {
      const couponQuery = query(
        collection(db, "coupons"),
        where("code", "==", code)
      );
      const snapshot = await getDocs(couponQuery);
      if (snapshot.empty) {
        setCouponError("كود الخصم غير صحيح أو غير موجود.");
        setCouponData(null);
        return;
      }
      const docSnap = snapshot.docs[0];
      const data = { id: docSnap.id, ...docSnap.data() };
      if (data.active === false) {
        setCouponError("هذا الكوبون غير متاح حاليًا.");
        setCouponData(null);
        return;
      }
      if (data.expiresAt?.toDate && data.expiresAt.toDate() < new Date()) {
        setCouponError("انتهت صلاحية هذا الكوبون.");
        setCouponData(null);
        return;
      }
      const minimum = safeNumber(data.minimumOrder ?? data.minOrder ?? 0);
      if (subtotal < minimum) {
        setCouponError(`الحد الأدنى لاستخدام الكوبون هو ${formatMoney(minimum)}.`);
        setCouponData(null);
        return;
      }
      setCouponData({ ...data, code });
    } catch (error) {
      console.error("Coupon Error:", error);
      setCouponError("حصل خطأ أثناء التحقق من الكوبون.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponData(null);
    setCouponCode("");
    setCouponError("");
  };

  const removeGamePrize = () => {
    setGamePrize(null);
    try {
      localStorage.removeItem("elsafty_game_prize");
      localStorage.removeItem("elsafty_wheel_prize");
    } catch (error) {
      console.warn("Could not remove game prize:", error);
    }
  };

  const handlePaymentProofChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("من فضلك اختر صورة صحيحة لإثبات الدفع.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_PAYMENT_PROOF_SIZE) {
      alert("حجم صورة إثبات الدفع يجب ألا يتجاوز 5 ميجابايت.");
      event.target.value = "";
      return;
    }
    if (paymentProofPreview) URL.revokeObjectURL(paymentProofPreview);
    const preview = URL.createObjectURL(file);
    setPaymentProofFile(file);
    setPaymentProofPreview(preview);
    setUploadedPaymentProof(null);
    setPaymentProofUrl("");
  };

  const removePaymentProof = () => {
    if (paymentProofPreview) URL.revokeObjectURL(paymentProofPreview);
    setPaymentProofFile(null);
    setPaymentProofPreview("");
    setUploadedPaymentProof(null);
    setPaymentProofUrl("");
    const input = document.getElementById("payment-proof-input");
    if (input) input.value = "";
  };

  const uploadPaymentProof = async () => {
    if (!paymentProofFile) return null;
    setPaymentProofUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", paymentProofFile);
      formData.append("upload_preset", CLOUDINARY_PRESET);
      formData.append("folder", "elsafty_store/payment_proofs");
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.secure_url) {
        throw new Error(result?.error?.message || "فشل رفع إثبات الدفع.");
      }
      const uploaded = {
        url: result.secure_url,
        publicId: result.public_id || "",
        assetId: result.asset_id || "",
      };
      setUploadedPaymentProof(uploaded);
      setPaymentProofUrl(uploaded.url);
      return uploaded;
    } finally {
      setPaymentProofUploading(false);
    }
  };

  const getLocationObject = (items, id) =>
    items.find((item) => String(getLocationId(item)) === String(id)) || null;

  const governorateObject = getLocationObject(
    governorates,
    selectedGovernorate
  );
  const cityObject = getLocationObject(cities, selectedCity);
  const villageObject = getLocationObject(villages, selectedVillage);
  const governorateName = getReadableLocationName(governorateObject);
  const cityName = getReadableLocationName(cityObject);
  const villageName = getReadableLocationName(villageObject);

  const isFormValid = Boolean(
    user?.uid &&
      name.trim() &&
      normalizePhone(phone).length >= 10 &&
      selectedGovernorate &&
      selectedCity &&
      address.trim() &&
      selectedPaymentMethod &&
      (!shippingZones.length || selectedShippingZone) &&
      (isCashPayment || paymentProofFile || paymentProofUrl)
  );

  const getProductPrice = (product) =>
    safeNumber(
      product?.salePrice ??
        product?.discountPrice ??
        product?.price ??
        0
    );

  const getProductQuantity = (product) =>
    Math.max(
      1,
      safeNumber(
        product?.quantity ?? product?.qty ?? product?.count ?? 1,
        1
      )
    );

  const getDepartmentGroups = (storeWhatsapp = "") => {
    const groups = new Map();
    const fallbackWhatsapp = normalizePhone(storeWhatsapp);

    cart.forEach((product) => {
      const department = getCategoryWhatsapp(product);
      const key = department?.id || "general";
      const existing = groups.get(key) || {
        id: key,
        name: department?.name || "خدمة العملاء",
        whatsapp: department?.whatsapp || fallbackWhatsapp,
        products: [],
      };

      existing.products.push(product);
      if (!existing.whatsapp && department?.whatsapp) {
        existing.whatsapp = department.whatsapp;
      }
      groups.set(key, existing);
    });

    return Array.from(groups.values());
  };

  const buildWhatsappMessage = ({
    orderNumber,
    departmentName,
    paymentProof,
    products = [],
    departmentSubtotal = subtotal,
  }) => {
    const lines = [
      "🛒 طلب جديد من ســــَـــــوا",
      `📌 رقم الطلب: ${orderNumber}`,
      `👤 العميل: ${name.trim()}`,
      `📱 الهاتف: ${phone.trim()}`,
      `📍 المحافظة: ${governorateName || "-"}`,
      `🏙️ المدينة / المركز: ${cityName || "-"}`,
      `🏘️ القرية / المنطقة: ${villageName || "-"}`,
      `🏠 العنوان: ${address.trim()}`,
      `💳 الدفع: ${selectedPayment?.name || selectedPayment?.title || "-"}`,
      `🏢 القسم: ${departmentName || "-"}`,
      "",
      "📦 منتجات القسم:",
    ];

    products.forEach((product, index) => {
      const quantity = getProductQuantity(product);
      const price = getProductPrice(product);
      const productName = product?.name || product?.title || "منتج";
      const variant =
        product?.variantName ||
        product?.selectedVariant?.name ||
        product?.variant?.name ||
        product?.size ||
        product?.color ||
        "";
      lines.push(
        `${index + 1}. ${productName}${variant ? ` — ${variant}` : ""}`
      );
      lines.push(`   الكمية: ${quantity} × ${formatMoney(price)} = ${formatMoney(price * quantity)}`);
    });

    lines.push("");
    lines.push(`💵 إجمالي منتجات القسم: ${formatMoney(departmentSubtotal)}`);
    lines.push(`🚚 الشحن: ${gameFreeShipping ? "مجاني" : formatMoney(shippingCost)}`);
    lines.push(`💰 إجمالي الطلب النهائي: ${formatMoney(finalTotal)}`);

    if (gamePrize) {
      lines.push(`🎁 جائزة اللعبة: ${getPrizeDescription(gamePrize)}`);
      if (isPercentagePrizeType(gamePrizeType)) {
        lines.push(`💸 خصم الجائزة: ${gamePrizeValue}%`);
      }
      if (isFixedPrizeType(gamePrizeType)) {
        lines.push(`💸 قيمة خصم الجائزة: ${formatMoney(gamePrizeValue)}`);
      }
      if (gameFreeShipping) lines.push("🚚 الجائزة تشمل شحن مجاني");
    }

    if (couponData) {
      lines.push(`🎟️ الكوبون: ${couponData.code || couponCode}`);
    }

    if (!isCashPayment && paymentProof?.url) {
      lines.push(`📸 إثبات الدفع: ${paymentProof.url}`);
    }

    if (notes.trim()) lines.push(`📝 ملاحظات: ${notes.trim()}`);
    return lines.join("\n");
  };

  const sendOrder = async () => {
    if (loading || paymentProofUploading) return;

    if (!user?.uid) {
      alert("من فضلك سجل الدخول أولاً لإتمام الطلب.");
      navigate("/login");
      return;
    }

    if (!name.trim()) {
      alert("اكتب الاسم بالكامل.");
      return;
    }
    if (normalizePhone(phone).length < 10) {
      alert("اكتب رقم هاتف صحيح.");
      return;
    }
    if (!selectedGovernorate || !selectedCity || !address.trim()) {
      alert("من فضلك أكمل بيانات العنوان.");
      return;
    }
    if (!selectedPayment) {
      alert("اختر طريقة الدفع.");
      return;
    }
    if (!isCashPayment && !paymentProofFile && !paymentProofUrl) {
      alert("ارفع إثبات الدفع أولاً.");
      return;
    }

    setLoading(true);

    try {
      let uploadedProof = uploadedPaymentProof;
      if (!isCashPayment && paymentProofFile && !uploadedProof?.url) {
        uploadedProof = await uploadPaymentProof();
      }

      // General store WhatsApp is only a fallback. Department WhatsApp
      // numbers are resolved from the product category and its parents.
      const storeSnap = await getDoc(doc(db, "settings", "store"));
      const storeData = storeSnap.exists() ? storeSnap.data() : {};
      const generalWhatsapp = normalizePhone(
        storeData.hotlineWhatsApp ||
          storeData.whatsapp ||
          storeData.whatsappNumber ||
          ""
      );

      const departmentGroups = getDepartmentGroups(generalWhatsapp);

      if (!departmentGroups.length) {
        throw new Error("السلة فارغة أو لم يتم العثور على منتجات لإرسال الطلب.");
      }

      const missingWhatsapp = departmentGroups.find((group) => !group.whatsapp);
      if (missingWhatsapp) {
        throw new Error(
          `لا يوجد رقم واتساب للقسم «${missingWhatsapp.name}»، كما لا يوجد رقم واتساب عام للمتجر.`
        );
      }

      const orderNumber = generateOrderNumber();
      const orderProducts = cart.map((product) => ({
        ...product,
        quantity: getProductQuantity(product),
      }));

      const paymentStatus = isCashPayment ? "pending" : "proof_uploaded";
      const orderStatus = isCashPayment ? "pending" : "pending_payment";

      const gamePrizeData = gamePrize
        ? {
            id: gamePrize.id || gamePrize.prizeId || "",
            title: gamePrize.title || gamePrize.name || "",
            type: gamePrize.type || gamePrize.prizeType || "",
            value:
              gamePrize.value ??
              gamePrize.amount ??
              gamePrize.discountValue ??
              0,
            gameKey: gamePrize.gameKey || gamePrize.gameId || "",
            gameName: gamePrize.gameName || "",
            source: gamePrize.source || "customer-game",
            awardedAt: gamePrize.awardedAt || null,
            description: gamePrize.description || "",
            code: gamePrize.code || "",
            ...gamePrize,
          }
        : null;

      // Keep ONE Firestore order for the whole cart. The departmentGroups
      // field contains the exact WhatsApp routing and products per department.
      const departmentOrderData = departmentGroups.map((group) => ({
        id: group.id,
        name: group.name,
        whatsapp: group.whatsapp,
        productIds: group.products.map(
          (product) => product?.id || product?.productId || ""
        ),
        productCount: group.products.length,
        subtotal: group.products.reduce(
          (sum, product) =>
            sum + getProductPrice(product) * getProductQuantity(product),
          0
        ),
      }));

      const departments = departmentOrderData;
      const primaryDepartment = departmentGroups[0];

      const orderData = {
        orderNumber,
        storeName: "ســــَـــــوا",
        userId: user.uid,
        customerId: user.uid,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: user.email || "",
        address: address.trim(),
        notes: notes.trim(),
        governorateId: selectedGovernorate || "",
        governorateName,
        cityId: selectedCity || "",
        cityName,
        villageId: selectedVillage || "",
        villageName,
        village: villageObject
          ? {
              id: villageObject.id || getLocationId(villageObject) || "",
              name: villageName || "",
              nameAr: villageObject.nameAr || villageName || "",
              nameEn: villageObject.nameEn || "",
              type: villageObject.type || "",
            }
          : null,
        products: orderProducts,
        departments,
        departmentGroups: departmentOrderData,
        departmentCount: departmentGroups.length,
        departmentId: primaryDepartment?.id || "",
        departmentName: primaryDepartment?.name || "",
        departmentWhatsapp: primaryDepartment?.whatsapp || "",
        shippingZoneId: selectedShippingZone || "",
        shippingZoneName:
          selectedZone?.name || selectedZone?.title || "",
        shippingCost,
        normalShippingCost,
        freeShippingPrize: gameFreeShipping,
        subtotal,
        gameDiscount,
        gamePrizeDiscount: gameDiscount,
        couponDiscount,
        totalDiscount,
        total: finalTotal,
        finalTotal,
        couponCode:
          couponData?.code || couponCode.trim().toUpperCase() || "",
        coupon: couponData
          ? {
              id: couponData.id || "",
              code:
                couponData.code || couponCode.trim().toUpperCase(),
              value:
                couponData.value ?? couponData.discount ?? 0,
              type:
                couponData.type || couponData.discountType || "fixed",
            }
          : null,
        gamePrize: gamePrizeData,
        gamePrizeType: gamePrizeType || "",
        gamePrizeValue,
        gamePrizeDescription: gamePrizeData
          ? getPrizeDescription(gamePrizeData)
          : "",
        wheelPrize: gamePrizeData,
        wheelDiscount: gameDiscount,
        paymentMethod: selectedPayment.id,
        paymentMethodName:
          selectedPayment.name || selectedPayment.title || "",
        paymentNumber: getPaymentNumber(selectedPayment),
        paymentStatus,
        paymentVerificationStatus: isCashPayment
          ? "not_required"
          : "pending",
        requiresPaymentProof: !isCashPayment,
        paymentProofStatus: isCashPayment
          ? "not_required"
          : "pending_review",
        paymentProofUploaded:
          !isCashPayment && Boolean(uploadedProof?.url),
        paymentProofUrl: uploadedProof?.url || "",
        paymentProofPublicId: uploadedProof?.publicId || "",
        paymentProofAssetId: uploadedProof?.assetId || "",
        paymentProofUploadedAt: uploadedProof?.url
          ? serverTimestamp()
          : null,
        paidAmount: 0,
        remainingAmount: finalTotal,
        status: orderStatus,
        orderStatus,
        whatsappMessageSent: false,
        whatsappTargets: departmentGroups.map((group) => ({
          departmentId: group.id,
          departmentName: group.name,
          whatsapp: group.whatsapp,
          productIds: group.products.map(
            (product) => product?.id || product?.productId || ""
          ),
        })),
        whatsappTarget: primaryDepartment?.whatsapp || "",
        whatsappDepartment: primaryDepartment?.name || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const sanitizedOrder = sanitizeForFirestore(orderData);
      const orderRef = await addDoc(
        collection(db, "orders"),
        sanitizedOrder
      );

      // Open one WhatsApp conversation per department. Each conversation
      // receives ONLY that department's products.
      const whatsappUrls = departmentGroups.map((group) => {
        const departmentSubtotal = group.products.reduce(
          (sum, product) =>
            sum + getProductPrice(product) * getProductQuantity(product),
          0
        );

        const whatsappMessage = buildWhatsappMessage({
          orderNumber,
          departmentName: group.name,
          paymentProof: uploadedProof,
          products: group.products,
          departmentSubtotal,
        });

        return (
          `https://wa.me/${group.whatsapp}?text=` +
          encodeURIComponent(whatsappMessage)
        );
      });

      console.log("Order created successfully:", orderRef.id);
      console.log("WhatsApp department targets:", departmentGroups);

      if (typeof setCart === "function") setCart([]);

      try {
        localStorage.removeItem("elsafty_game_prize");
        localStorage.removeItem("elsafty_wheel_prize");
      } catch (error) {
        console.warn("Could not clear customer prize:", error);
      }

      if (whatsappUrls.length === 1) {
        window.location.href = whatsappUrls[0];
        return;
      }

      // The click on the confirm button gives the browser permission to open
      // multiple tabs. We still fall back to the first URL if a popup blocker
      // prevents opening the other conversations.
      const openedWindows = whatsappUrls.map((url) => {
        try {
          return window.open(url, "_blank", "noopener,noreferrer");
        } catch (error) {
          console.warn("Could not open WhatsApp tab:", error);
          return null;
        }
      });

      if (!openedWindows.some(Boolean)) {
        window.location.href = whatsappUrls[0];
      }
    } catch (error) {
      console.error("SEND ORDER ERROR:", error);
      alert(
        error?.message ||
          "حدث خطأ أثناء تسجيل الطلب. حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
      setPaymentProofUploading(false);
    }
  };

  if (!authLoading && !cart.length) {
    return (
      <div className="checkout-page" dir="rtl">
        <div className="checkout-empty">
          <div className="checkout-empty-icon">🛒</div>
          <span className="checkout-empty-badge">ســــَـــــوا</span>
          <h2>السلة فارغة</h2>
          <p>أضف منتجات إلى السلة أولاً لإتمام طلبك.</p>
          <button type="button" onClick={() => navigate("/")}>🛍️ العودة للمتجر</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page" dir="rtl">
      <div className="checkout-container">
        <header className="checkout-header">
          <button type="button" className="checkout-back-button" onClick={() => navigate(-1)}>
            <span>→</span> العودة
          </button>
          <div className="checkout-header-center">
            <span className="checkout-header-icon">🛒</span>
            <div>
              <span className="checkout-header-mini">ســــَـــــوا</span>
              <h1>إتمام الطلب</h1>
            </div>
          </div>
          <div className="checkout-secure">
            <span>🔒</span>
            <div><strong>طلب آمن</strong><small>بياناتك محمية</small></div>
          </div>
        </header>

        <div className="checkout-progress">
          <div className="checkout-progress-step active"><span>1</span><strong>بيانات الطلب</strong></div>
          <div className="checkout-progress-line" />
          <div className="checkout-progress-step active"><span>2</span><strong>الدفع</strong></div>
          <div className="checkout-progress-line" />
          <div className="checkout-progress-step"><span>3</span><strong>تأكيد الطلب</strong></div>
        </div>

        <div className="checkout-grid">
          <main className="checkout-main">
            <section className="checkout-card">
              <div className="checkout-card-title">
                <div className="checkout-section-icon">👤</div>
                <div><h2>بيانات العميل</h2><p>أدخل بيانات التواصل الخاصة بك</p></div>
              </div>
              <div className="checkout-form-grid">
                <div className="checkout-field">
                  <label>الاسم الكامل <span>*</span></label>
                  <div className="checkout-input-wrapper">
                    <span>👤</span>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="اكتب اسمك بالكامل" autoComplete="name" />
                  </div>
                </div>
                <div className="checkout-field">
                  <label>رقم الهاتف <span>*</span></label>
                  <div className="checkout-input-wrapper">
                    <span>📱</span>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" inputMode="numeric" autoComplete="tel" />
                  </div>
                </div>
              </div>
            </section>

            <section className="checkout-card">
              <div className="checkout-card-title">
                <div className="checkout-section-icon">📍</div>
                <div><h2>عنوان التوصيل</h2><p>اختر موقعك واكتب العنوان بالتفصيل</p></div>
              </div>
              <div className="checkout-form-grid">
                <div className="checkout-field">
                  <label>المحافظة <span>*</span></label>
                  <select value={selectedGovernorate} onChange={(e) => { setSelectedGovernorate(e.target.value); setSelectedCity(""); setSelectedVillage(""); setCities([]); setVillages([]); }} disabled={governoratesLoading}>
                    <option value="">{governoratesLoading ? "جاري تحميل المحافظات..." : "اختر المحافظة"}</option>
                    {governorates.map((item) => <option key={getLocationId(item)} value={getLocationId(item)}>{getReadableLocationName(item)}</option>)}
                  </select>
                </div>
                <div className="checkout-field">
                  <label>المدينة / المركز <span>*</span></label>
                  <select value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedVillage(""); setVillages([]); }} disabled={!selectedGovernorate || citiesLoading}>
                    <option value="">{!selectedGovernorate ? "اختر المحافظة أولاً" : citiesLoading ? "جاري تحميل المدن..." : cities.length ? "اختر المدينة / المركز" : "لا توجد مدن متاحة"}</option>
                    {cities.map((item) => <option key={getLocationId(item)} value={getLocationId(item)}>{getReadableLocationName(item)}</option>)}
                  </select>
                </div>
                <div className="checkout-field">
                  <label>القرية / المنطقة</label>
                  <select
                    value={selectedVillage}
                    onChange={(e) => setSelectedVillage(e.target.value)}
                    disabled={!selectedCity || villagesLoading}
                  >
                    <option value="">
                      {!selectedCity
                        ? "اختر المدينة أولاً"
                        : villagesLoading
                        ? "جاري تحميل القرى والمناطق..."
                        : villages.length
                        ? "اختر القرية / المنطقة"
                        : "لا توجد قرى / مناطق متاحة"}
                    </option>
                    {villages.map((item, index) => {
                      const villageId = getLocationId(item);
                      const villageName = getReadableLocationName(item);
                      if (!villageId || !villageName) return null;
                      return (
                        <option key={`${villageId}-${index}`} value={villageId}>
                          {villageName}
                        </option>
                      );
                    })}
                  </select>
                  {selectedCity && !villagesLoading && villages.length === 0 && (
                    <small style={{ display: "block", marginTop: 8, color: "#b45309", fontSize: 12 }}>
                      لم يتم العثور على قرى لهذه المدينة / المركز.
                    </small>
                  )}
                </div>
                <div className="checkout-field checkout-field-full">
                  <label>العنوان بالتفصيل <span>*</span></label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="اسم الشارع، رقم العقار، الدور، الشقة، وأي علامة مميزة..." rows={4} />
                </div>
                <div className="checkout-field checkout-field-full">
                  <label>ملاحظات على الطلب</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="أي ملاحظات إضافية تريد إخبارنا بها..." rows={3} />
                </div>
              </div>
            </section>

            {shippingZones.length > 0 && (
              <section className="checkout-card">
                <div className="checkout-card-title">
                  <div className="checkout-section-icon">🚚</div>
                  <div><h2>طريقة الشحن</h2><p>اختر طريقة التوصيل المناسبة</p></div>
                </div>
                <div className="checkout-shipping-list">
                  {shippingZones.map((zone) => (
                    <label key={zone.id} className={`checkout-shipping-option ${selectedShippingZone === zone.id ? "selected" : ""}`}>
                      <input type="radio" name="shippingZone" value={zone.id} checked={selectedShippingZone === zone.id} onChange={(e) => setSelectedShippingZone(e.target.value)} />
                      <div className="checkout-radio-mark"><span /></div>
                      <div className="checkout-shipping-content"><strong>{zone.name || zone.title || "الشحن"}</strong><small>توصيل للعنوان المحدد</small></div>
                      <div className="checkout-shipping-price"><strong>{gameFreeShipping ? "مجاني" : formatMoney(zone.price ?? zone.shippingCost ?? zone.cost ?? 0)}</strong></div>
                    </label>
                  ))}
                </div>
              </section>
            )}

            <section className="checkout-card">
              <div className="checkout-card-title">
                <div className="checkout-section-icon">💳</div>
                <div><h2>طريقة الدفع</h2><p>اختر طريقة الدفع المناسبة لك</p></div>
              </div>
              <div className="checkout-payment-list">
                {paymentMethods.map((method) => {
                  const selected = selectedPaymentMethod === method.id;
                  const methodNumber = getPaymentNumber(method);
                  return (
                    <label key={method.id} className={`checkout-payment-option ${selected ? "selected" : ""}`}>
                      <input type="radio" name="paymentMethod" value={method.id} checked={selected} onChange={() => { setSelectedPaymentMethod(method.id); if (method.id !== selectedPaymentMethod) removePaymentProof(); }} />
                      <div className="checkout-payment-radio"><span /></div>
                      <div className="checkout-payment-content">
                        <div className="checkout-payment-name"><strong>{method.name || method.title || "طريقة دفع"}</strong>{method.description && <small>{method.description}</small>}</div>
                        {!isCashPayment && selected && methodNumber && <div className="checkout-payment-number"><span>رقم التحويل</span><strong>{methodNumber}</strong></div>}
                      </div>
                      {selected && <div className="checkout-payment-check">✓</div>}
                    </label>
                  );
                })}
              </div>

              {!isCashPayment && selectedPayment && (
                <div className="payment-proof-box">
                  <div className="payment-proof-top">
                    <div className="payment-proof-icon">📸</div>
                    <div><h3>إثبات الدفع مطلوب</h3><p>بعد تحويل المبلغ، ارفع صورة واضحة للإيصال أو شاشة نجاح عملية الدفع.</p></div>
                  </div>
                  {getPaymentNumber(selectedPayment) && <div className="payment-proof-payment-number"><div><span>رقم التحويل / الحساب</span><strong>{getPaymentNumber(selectedPayment)}</strong></div><span className="payment-proof-copy-hint">استخدم هذا الرقم لإتمام التحويل</span></div>}
                  {!paymentProofFile ? (
                    <div className="payment-proof-upload">
                      <input id="payment-proof-input" type="file" accept="image/jpeg,image/png,image/webp,image/*" onChange={handlePaymentProofChange} disabled={paymentProofUploading || loading} />
                      <label htmlFor="payment-proof-input" className="payment-proof-label"><span className="payment-proof-upload-icon">⬆️</span><strong>اضغط لاختيار صورة إثبات الدفع</strong><small>JPG / PNG / WEBP<br />الحد الأقصى 5 ميجابايت</small></label>
                    </div>
                  ) : (
                    <div className="payment-proof-preview-box">
                      <div className="payment-proof-file-header"><div><span className="payment-proof-file-icon">🖼️</span><div><strong>تم اختيار إثبات الدفع</strong><small>{paymentProofFile.name}</small></div></div><span className="payment-proof-file-size">{(paymentProofFile.size / 1024 / 1024).toFixed(2)} MB</span></div>
                      {paymentProofPreview && <div className="payment-proof-image-wrapper"><img src={paymentProofPreview} alt="معاينة إثبات الدفع" className="payment-proof-image" /><div className="payment-proof-image-overlay">✓ صورة جاهزة للرفع</div></div>}
                      <button type="button" className="payment-proof-remove" onClick={removePaymentProof} disabled={paymentProofUploading || loading}>🗑️ تغيير / حذف الصورة</button>
                    </div>
                  )}
                  {paymentProofUploading && <div className="payment-proof-uploading"><span className="payment-proof-spinner">⏳</span><div><strong>جاري رفع إثبات الدفع...</strong><small>لا تغلق الصفحة حتى يكتمل الرفع</small></div></div>}
                  <div className="payment-proof-note"><span>🔒</span><p>سيتم رفع صورة الإثبات بشكل آمن إلى Cloudinary وربطها بالطلب داخل Firestore، وبعد نجاح التسجيل سيتم فتح محادثة واتساب الخاصة بالقسم.</p></div>
                </div>
              )}
            </section>

            <section className="checkout-card">
              <div className="checkout-card-title"><div className="checkout-section-icon">🎟️</div><div><h2>كود الخصم</h2><p>لديك كوبون؟ استخدمه الآن</p></div></div>
              {!couponData ? (
                <div className="checkout-coupon"><div className="checkout-coupon-input"><span>%</span><input type="text" value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }} placeholder="اكتب كود الخصم" /></div><button type="button" onClick={applyCoupon} disabled={couponLoading}>{couponLoading ? "جاري التحقق..." : "تطبيق الكود"}</button></div>
              ) : (
                <div className="checkout-coupon-success"><div><span>✓</span><div><small>تم تطبيق الكود بنجاح</small><strong>{couponData.code}</strong></div></div><button type="button" onClick={removeCoupon}>إزالة</button></div>
              )}
              {couponError && <div className="checkout-error">⚠️ {couponError}</div>}
            </section>

            {gamePrize && (
              <section className="checkout-card checkout-wheel-card">
                <div className="checkout-card-title"><div className="checkout-section-icon">🎁</div><div><h2>جائزة اللعبة</h2><p>تم الحصول على الجائزة وتطبيقها على طلبك</p></div></div>
                <div className="checkout-wheel-prize">
                  <div className="checkout-wheel-prize-icon">{gameFreeShipping ? "🚚" : isGiftPrizeType(gamePrizeType) ? "🎁" : "🏆"}</div>
                  <div>
                    <strong>{gamePrize.title || gamePrize.name || "جائزة من ألعاب ســــَـــــوا"}</strong>
                    {isPercentagePrizeType(gamePrizeType) && <span>خصم {gamePrizeValue}% — وفر {formatMoney(gameDiscount)}</span>}
                    {isFixedPrizeType(gamePrizeType) && <span>خصم {formatMoney(gamePrizeValue)} — وفر {formatMoney(gameDiscount)}</span>}
                    {gameFreeShipping && <span>🚚 شحن مجاني</span>}
                    {isGiftPrizeType(gamePrizeType) && <span>🎁 {gamePrize.title || "هدية مجانية"}</span>}
                    {!isPercentagePrizeType(gamePrizeType) && !isFixedPrizeType(gamePrizeType) && !gameFreeShipping && !isGiftPrizeType(gamePrizeType) && <span>{gamePrize.description || "جائزة خاصة من المتجر"}</span>}
                    <button type="button" onClick={removeGamePrize} disabled={loading} style={{ marginTop: 8, border: "none", background: "transparent", color: "#d32f2f", cursor: "pointer" }}>إزالة الجائزة</button>
                  </div>
                </div>
              </section>
            )}
          </main>

          <aside className="checkout-sidebar">
            <section className="checkout-card checkout-summary-card">
              <div className="checkout-summary-header"><div className="checkout-card-title"><div className="checkout-section-icon">🧾</div><div><h2>ملخص الطلب</h2><p>{cart.length} منتج في السلة</p></div></div></div>
              <div className="checkout-products-summary">
                {cart.map((product, index) => {
                  const price = safeNumber(product.salePrice ?? product.discountPrice ?? product.price ?? 0);
                  const quantity = Math.max(1, safeNumber(product.quantity ?? product.qty ?? product.count ?? 1, 1));
                  const image = product.image || product.imageUrl || product.thumbnail;
                  return <div className="checkout-summary-product" key={product.id || product.productId || index}><div className="checkout-summary-product-image">{image ? <img src={image} alt={product.name || product.title || "منتج"} /> : <span>📦</span>}<b>{quantity}</b></div><div className="checkout-summary-product-info"><strong>{product.name || product.title || "منتج"}</strong><span>الكمية: {quantity}</span><b>{formatMoney(price * quantity)}</b></div></div>;
                })}
              </div>
              <div className="checkout-summary-lines">
                <div><span>إجمالي المنتجات</span><strong>{formatMoney(subtotal)}</strong></div>
                {gameDiscount > 0 && <div className="discount-line"><span>🎁 خصم جائزة اللعبة</span><strong>-{formatMoney(gameDiscount)}</strong></div>}
                {couponDiscount > 0 && <div className="discount-line"><span>🎟️ خصم الكوبون</span><strong>-{formatMoney(couponDiscount)}</strong></div>}
                <div><span>🚚 الشحن</span><strong>{gameFreeShipping ? "مجاني" : formatMoney(shippingCost)}</strong></div>
              </div>
              <div className="checkout-total-row"><div><span>الإجمالي النهائي</span><small>شامل الخصومات والشحن</small></div><strong>{formatMoney(finalTotal)}</strong></div>
              <div className="checkout-payment-summary"><span>💳 طريقة الدفع</span><strong>{selectedPayment?.name || selectedPayment?.title || "لم يتم الاختيار"}</strong></div>
              {!isCashPayment && <div className={`checkout-proof-summary ${paymentProofFile || paymentProofUrl ? "ready" : "required"}`}><div><span>📸 إثبات الدفع</span><small>{paymentProofFile || paymentProofUrl ? "جاهز للرفع" : "مطلوب قبل تأكيد الطلب"}</small></div><strong>{paymentProofFile || paymentProofUrl ? "✓" : "!"}</strong></div>}
              <button type="button" className="checkout-confirm-button" onClick={sendOrder} disabled={loading || authLoading || dataLoading || governoratesLoading || citiesLoading || villagesLoading || paymentProofUploading || !isFormValid}>
                <span className="checkout-confirm-icon">{paymentProofUploading || loading ? "⏳" : !isCashPayment && !paymentProofFile && !paymentProofUrl ? "📸" : "✓"}</span>
                <span>{paymentProofUploading ? "جاري رفع إثبات الدفع..." : loading ? "جاري تسجيل الطلب..." : !isCashPayment && !paymentProofFile && !paymentProofUrl ? "ارفع إثبات الدفع أولاً" : "تأكيد الطلب وإرسال واتساب"}</span>
              </button>
              <div className="checkout-security-note"><span>🔐</span><div><strong>عملية دفع آمنة</strong><small>يتم حفظ بيانات طلبك بشكل آمن</small></div></div>
            </section>
            <button type="button" className="checkout-back-store-button" onClick={() => navigate("/")}><span>←</span> العودة للتسوق</button>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
