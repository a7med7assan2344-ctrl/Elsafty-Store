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
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import {
  auth,
  db,
} from "../firebase";

import {
  CartContext,
} from "../context/CartContext";

import {
  getGovernorates,
  getDistricts,
} from "egypt-geo-navigator";

import "./Checkout.css";

/* =====================================================
   CLOUDINARY CONFIG
===================================================== */

const CLOUDINARY_CLOUD_NAME = "wkcpvsqi";

const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
  "elsafty_store";

const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const MAX_PAYMENT_PROOF_SIZE =
  5 * 1024 * 1024;

/* =====================================================
   HELPERS
===================================================== */

const isFirestoreFieldValue = (value) =>
  value &&
  typeof value === "object" &&
  typeof value._methodName === "string";

const sanitizeForFirestore = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (isFirestoreFieldValue(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        sanitizeForFirestore(item)
      )
      .filter(
        (item) =>
          item !== undefined
      );
  }

  if (typeof value === "object") {
    const result = {};

    Object.entries(value).forEach(
      ([key, item]) => {
        const sanitized =
          sanitizeForFirestore(item);

        if (
          sanitized !== undefined
        ) {
          result[key] = sanitized;
        }
      }
    );

    return result;
  }

  return value;
};

const normalizePhone = (
  phone = ""
) => {
  let value = String(phone)
    .replace(/\D/g, "");

  if (value.startsWith("0020")) {
    value = value.slice(4);
  }

  if (
    value.startsWith("20") &&
    value.length >= 12
  ) {
    value = value.slice(2);
  }

  if (value.startsWith("0")) {
    value = value.slice(1);
  }

  return value;
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
   MONEY
===================================================== */

const formatMoney = (
  value
) =>
  `${Number(
    value || 0
  ).toFixed(2)} جنيه`;

/* =====================================================
   ORDER NUMBER
===================================================== */

const generateOrderNumber = () => {
  const now = new Date();

  const datePart =
    `${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}`;

  const timePart =
    `${String(
      now.getHours()
    ).padStart(2, "0")}${String(
      now.getMinutes()
    ).padStart(2, "0")}${String(
      now.getSeconds()
    ).padStart(2, "0")}`;

  const randomPart =
    Math.floor(
      1000 +
      Math.random() * 9000
    );

  return `SWA-${datePart}-${timePart}-${randomPart}`;
};

/* =====================================================
   COMPONENT
===================================================== */

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    cart,
    setCart,
  } = useContext(CartContext);

  /* =====================================================
     AUTH
  ===================================================== */

  const [
    user,
    setUser,
  ] = useState(null);

  const [
    authLoading,
    setAuthLoading,
  ] = useState(true);

  /* =====================================================
     CUSTOMER
  ===================================================== */

  const [
    name,
    setName,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    address,
    setAddress,
  ] = useState("");

  const [
    notes,
    setNotes,
  ] = useState("");

  /* =====================================================
     LOCATIONS
  ===================================================== */

  const [
    governorates,
    setGovernorates,
  ] = useState([]);

  const [
    cities,
    setCities,
  ] = useState([]);

  const [
    villages,
    setVillages,
  ] = useState([]);

  const [
    selectedGovernorate,
    setSelectedGovernorate,
  ] = useState("");

  const [
    selectedCity,
    setSelectedCity,
  ] = useState("");

  const [
    selectedVillage,
    setSelectedVillage,
  ] = useState("");

  /* =====================================================
     SEPARATE LOCATION LOADING STATES
===================================================== */

  const [
    governoratesLoading,
    setGovernoratesLoading,
  ] = useState(false);

  const [
    citiesLoading,
    setCitiesLoading,
  ] = useState(false);

  const [
    villagesLoading,
    setVillagesLoading,
  ] = useState(false);

  /* =====================================================
     FIRESTORE DATA
===================================================== */

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    paymentMethods,
    setPaymentMethods,
  ] = useState([]);

  const [
    shippingZones,
    setShippingZones,
  ] = useState([]);

  const [
    dataLoading,
    setDataLoading,
  ] = useState(true);

  /* =====================================================
     PAYMENT
===================================================== */

  const [
    selectedPaymentMethod,
    setSelectedPaymentMethod,
  ] = useState("");

  const [
    paymentProofFile,
    setPaymentProofFile,
  ] = useState(null);

  const [
    paymentProofPreview,
    setPaymentProofPreview,
  ] = useState("");

  const [
    paymentProofUrl,
    setPaymentProofUrl,
  ] = useState("");

  const [
    paymentProofPublicId,
    setPaymentProofPublicId,
  ] = useState("");

  const [
    paymentProofAssetId,
    setPaymentProofAssetId,
  ] = useState("");

  const [
    paymentProofUploading,
    setPaymentProofUploading,
  ] = useState(false);

  /* =====================================================
     SHIPPING
===================================================== */

  const [
    selectedShippingZone,
    setSelectedShippingZone,
  ] = useState("");

  /* =====================================================
     COUPON
===================================================== */

  const [
    couponCode,
    setCouponCode,
  ] = useState("");

  const [
    couponData,
    setCouponData,
  ] = useState(null);

  const [
    couponLoading,
    setCouponLoading,
  ] = useState(false);

  const [
    couponError,
    setCouponError,
  ] = useState("");

  /* =====================================================
     ORDER
===================================================== */

  const [
    loading,
    setLoading,
  ] = useState(false);

  /* =====================================================
     WHEEL
===================================================== */

  const [
    wheelPrize,
    setWheelPrize,
  ] = useState(null);

  /* =====================================================
     AUTH LISTENER
===================================================== */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
          setAuthLoading(false);

          if (currentUser) {
            setName(
              currentUser.displayName ||
                currentUser.email?.split(
                  "@"
                )[0] ||
                ""
            );
          }
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =====================================================
     PAYMENT PREVIEW CLEANUP
===================================================== */

  useEffect(() => {
    return () => {
      if (paymentProofPreview) {
        URL.revokeObjectURL(
          paymentProofPreview
        );
      }
    };
  }, [paymentProofPreview]);

  /* =====================================================
     LOAD GOVERNORATES
===================================================== */

  useEffect(() => {
    let mounted = true;

    const loadGovernorates =
      async () => {
        try {
          setGovernoratesLoading(true);

          console.log(
            "SWA loading governorates..."
          );

          const result =
            getGovernorates();

          const prepared =
            prepareLocations(result);

          console.log(
            "SWA GOVERNORATES RAW:",
            result
          );

          console.log(
            "SWA GOVERNORATES:",
            prepared
          );

          if (mounted) {
            setGovernorates(
              prepared
            );
          }
        } catch (error) {
          console.error(
            "SWA GOVERNORATES ERROR:",
            error
          );

          if (mounted) {
            setGovernorates([]);
          }
        } finally {
          if (mounted) {
            setGovernoratesLoading(false);
          }
        }
      };

    loadGovernorates();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     LOAD CITIES / DISTRICTS
===================================================== */

  useEffect(() => {
    let mounted = true;

    if (!selectedGovernorate) {
      setCities([]);
      setSelectedCity("");
      setVillages([]);
      setSelectedVillage("");
      setCitiesLoading(false);
      setVillagesLoading(false);

      return () => {
        mounted = false;
      };
    }

    const loadCities =
      async () => {
        try {
          setCitiesLoading(true);

          setCities([]);
          setSelectedCity("");

          setVillages([]);
          setSelectedVillage("");

          const governorateId =
            String(
              selectedGovernorate
            ).trim();

          console.log(
            "================================"
          );

          console.log(
            "SWA LOADING DISTRICTS"
          );

          console.log(
            "Governorate ID:",
            governorateId
          );

          console.log(
            "================================"
          );

          const result =
            getDistricts(
              governorateId
            );

          const prepared =
            prepareLocations(result);

          console.log(
            "SWA DISTRICTS RAW:",
            result
          );

          console.log(
            "SWA DISTRICTS:",
            prepared
          );

          console.log(
            "SWA DISTRICTS COUNT:",
            prepared.length
          );

          if (mounted) {
            setCities(prepared);
          }
        } catch (error) {
          console.error(
            "SWA DISTRICTS ERROR:",
            error
          );

          if (mounted) {
            setCities([]);
            setSelectedCity("");
            setVillages([]);
            setSelectedVillage("");
          }
        } finally {
          if (mounted) {
            setCitiesLoading(false);
          }
        }
      };

    loadCities();

    return () => {
      mounted = false;
    };
  }, [selectedGovernorate]);

  /* =====================================================
     LOAD VILLAGES / AREAS
     
     لا نستخدم getLocations()
     لأن المكتبة تستخدم require()
     داخلياً وهذا لا يعمل بشكل صحيح
     مع Vite.
     
     نقرأ ملف JSON من public مباشرة.
===================================================== */

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

  /* =====================================================
     LOAD FIRESTORE DATA
===================================================== */

  useEffect(() => {
    let mounted = true;

    const loadData =
      async () => {
        try {
          setDataLoading(true);

          const [
            categoriesSnapshot,
            paymentMethodsSnapshot,
            shippingZonesSnapshot,
          ] =
            await Promise.all([
              getDocs(
                collection(
                  db,
                  "categories"
                )
              ),

              getDocs(
                collection(
                  db,
                  "paymentMethods"
                )
              ),

              getDocs(
                collection(
                  db,
                  "shippingZones"
                )
              ),
            ]);

          if (!mounted) {
            return;
          }

          const loadedCategories =
            categoriesSnapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            );

          const loadedPaymentMethods =
            paymentMethodsSnapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
              .filter(
                (method) =>
                  method.active !== false
              );

          const loadedShippingZones =
            shippingZonesSnapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
              .filter(
                (zone) =>
                  zone.active !== false
              );

          setCategories(
            loadedCategories
          );

          setPaymentMethods(
            loadedPaymentMethods.length
              ? loadedPaymentMethods
              : [
                  {
                    id: "cash_on_delivery",
                    name:
                      "الدفع عند الاستلام",
                    active: true,
                  },
                ]
          );

          setShippingZones(
            loadedShippingZones
          );

          const cashMethod =
            loadedPaymentMethods.find(
              (method) => {
                const id =
                  String(
                    method.id || ""
                  ).toLowerCase();

                const methodName =
                  String(
                    method.name || ""
                  ).toLowerCase();

                return (
                  id ===
                    "cash_on_delivery" ||
                  id === "cash" ||
                  id === "cod" ||
                  methodName.includes(
                    "الاستلام"
                  )
                );
              }
            );

          if (cashMethod) {
            setSelectedPaymentMethod(
              cashMethod.id
            );
          } else if (
            loadedPaymentMethods.length
          ) {
            setSelectedPaymentMethod(
              loadedPaymentMethods[0]
                .id
            );
          } else {
            setSelectedPaymentMethod(
              "cash_on_delivery"
            );
          }
        } catch (error) {
          console.error(
            "Failed to load checkout data:",
            error
          );

          if (mounted) {
            setPaymentMethods([
              {
                id: "cash_on_delivery",
                name:
                  "الدفع عند الاستلام",
                active: true,
              },
            ]);

            setSelectedPaymentMethod(
              "cash_on_delivery"
            );
          }
        } finally {
          if (mounted) {
            setDataLoading(false);
          }
        }
      };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     LOAD WHEEL PRIZE
===================================================== */

  useEffect(() => {
    try {
      const statePrize =
        location.state?.discountData;

      if (statePrize) {
        setWheelPrize(
          statePrize
        );

        return;
      }

      const storedPrize =
        localStorage.getItem(
          "elsafty_wheel_prize"
        );

      if (storedPrize) {
        setWheelPrize(
          JSON.parse(
            storedPrize
          )
        );
      }
    } catch (error) {
      console.error(
        "Failed to load wheel prize:",
        error
      );
    }
  }, [location.state]);

  /* =====================================================
     SELECTED PAYMENT
===================================================== */

  const selectedPayment =
    useMemo(() => {
      return paymentMethods.find(
        (method) =>
          method.id ===
          selectedPaymentMethod
      );
    }, [
      paymentMethods,
      selectedPaymentMethod,
    ]);

  /* =====================================================
     CASH PAYMENT
===================================================== */

  const isCashPayment =
    useMemo(() => {
      if (!selectedPayment) {
        return true;
      }

      const id =
        String(
          selectedPayment.id || ""
        ).toLowerCase();

      const nameValue =
        String(
          selectedPayment.name ||
            ""
        ).toLowerCase();

      return (
        id ===
          "cash_on_delivery" ||
        id === "cash" ||
        id === "cod" ||
        nameValue.includes(
          "الدفع عند الاستلام"
        ) ||
        nameValue.includes(
          "الدفع عند التسليم"
        ) ||
        nameValue.includes(
          "cash on delivery"
        )
      );
    }, [selectedPayment]);

  /* =====================================================
     PAYMENT NUMBER
===================================================== */

  const getPaymentNumber = (
    method
  ) => {
    if (!method) {
      return "";
    }

    return (
      method.number ||
      method.phone ||
      method.paymentNumber ||
      method.accountNumber ||
      method.walletNumber ||
      ""
    );
  };

  /* =====================================================
     CATEGORY MAP
===================================================== */

  const categoryMap =
    useMemo(() => {
      const map = {};

      categories.forEach(
        (category) => {
          map[category.id] =
            category;
        }
      );

      return map;
    }, [categories]);

  /* =====================================================
     FIND PRODUCT CATEGORY
===================================================== */

  const findCategoryForProduct =
    (product) => {
      if (!product) {
        return null;
      }

      const categoryId =
        product.categoryId ||
        product.categoryID ||
        product.category ||
        product.category_id;

      if (
        categoryId &&
        categoryMap[categoryId]
      ) {
        return categoryMap[
          categoryId
        ];
      }

      const categoryName =
        product.categoryName ||
        product.categoryTitle ||
        product.category_name;

      if (categoryName) {
        return (
          categories.find(
            (category) =>
              String(
                category.name || ""
              ).trim() ===
                String(
                  categoryName
                ).trim() ||
              String(
                category.title || ""
              ).trim() ===
                String(
                  categoryName
                ).trim()
          ) || null
        );
      }

      return null;
    };

  /* =====================================================
     CATEGORY WHATSAPP
===================================================== */

  const getCategoryWhatsapp =
    (category) => {
      if (!category) {
        return "";
      }

      return (
        category.whatsapp ||
        category.whatsApp ||
        category.whatsappNumber ||
        category.phone ||
        category.phoneNumber ||
        ""
      );
    };

  /* =====================================================
     ORDER DEPARTMENTS
===================================================== */

  const getDepartmentsForOrder =
    () => {
      const departments = [];

      cart.forEach(
        (product) => {
          const category =
            findCategoryForProduct(
              product
            );

          const whatsapp =
            getCategoryWhatsapp(
              category
            );

          if (!whatsapp) {
            return;
          }

          const normalized =
            normalizePhone(
              whatsapp
            );

          if (!normalized) {
            return;
          }

          const existing =
            departments.find(
              (department) =>
                department.whatsapp ===
                normalized
            );

          if (!existing) {
            departments.push({
              id:
                category?.id ||
                "",
              name:
                category?.name ||
                category?.title ||
                "قسم الطلبات",
              whatsapp:
                normalized,
            });
          }
        }
      );

      return departments;
    };

  /* =====================================================
     SUBTOTAL
===================================================== */

  const subtotal =
    useMemo(() => {
      return cart.reduce(
        (total, product) => {
          const price =
            Number(
              product.salePrice ??
                product.discountPrice ??
                product.price ??
                0
            );

          const quantity =
            Number(
              product.quantity ??
                product.qty ??
                product.count ??
                1
            );

          return (
            total +
            price * quantity
          );
        },
        0
      );
    }, [cart]);

  /* =====================================================
     WHEEL DISCOUNT
===================================================== */

  const wheelDiscount =
    useMemo(() => {
      if (!wheelPrize) {
        return 0;
      }

      const value =
        Number(
          wheelPrize.discount ??
            wheelPrize.discountValue ??
            wheelPrize.value ??
            0
        );

      const type =
        String(
          wheelPrize.type ||
            wheelPrize.discountType ||
            ""
        ).toLowerCase();

      if (
        type.includes("percent") ||
        type.includes("percentage") ||
        type.includes("نسبة")
      ) {
        return Math.min(
          subtotal,
          (subtotal * value) /
            100
        );
      }

      if (value > 0) {
        return Math.min(
          subtotal,
          value
        );
      }

      return 0;
    }, [
      wheelPrize,
      subtotal,
    ]);

  const subtotalAfterWheel =
    Math.max(
      0,
      subtotal - wheelDiscount
    );

  /* =====================================================
     SHIPPING ZONE
===================================================== */

  const selectedZone =
    useMemo(() => {
      return shippingZones.find(
        (zone) =>
          zone.id ===
          selectedShippingZone
      );
    }, [
      shippingZones,
      selectedShippingZone,
    ]);

  /* =====================================================
     SHIPPING COST
===================================================== */

  const shippingCost =
    useMemo(() => {
      if (!selectedZone) {
        return 0;
      }

      return Number(
        selectedZone.price ??
          selectedZone.shippingCost ??
          selectedZone.cost ??
          0
      );
    }, [selectedZone]);

  /* =====================================================
     COUPON DISCOUNT
===================================================== */

  const couponDiscount =
    useMemo(() => {
      if (!couponData) {
        return 0;
      }

      const value =
        Number(
          couponData.value ??
            couponData.discount ??
            couponData.amount ??
            0
        );

      const type =
        String(
          couponData.type ||
            couponData.discountType ||
            "fixed"
        ).toLowerCase();

      if (
        type === "percentage" ||
        type === "percent" ||
        type === "نسبة"
      ) {
        return Math.min(
          subtotalAfterWheel,
          (subtotalAfterWheel *
            value) /
            100
        );
      }

      return Math.min(
        subtotalAfterWheel,
        value
      );
    }, [
      couponData,
      subtotalAfterWheel,
    ]);

  /* =====================================================
     TOTALS
===================================================== */

  const totalDiscount =
    wheelDiscount +
    couponDiscount;

  const finalTotal =
    Math.max(
      0,
      subtotal +
        shippingCost -
        totalDiscount
    );

  /* =====================================================
     APPLY COUPON
===================================================== */

  const applyCoupon =
    async () => {
      const code =
        couponCode
          .trim()
          .toUpperCase();

      if (!code) {
        setCouponError(
          "اكتب كود الخصم أولاً."
        );

        return;
      }

      try {
        setCouponLoading(true);
        setCouponError("");
        setCouponData(null);

        const couponQuery =
          query(
            collection(
              db,
              "coupons"
            ),
            where(
              "code",
              "==",
              code
            )
          );

        const snapshot =
          await getDocs(
            couponQuery
          );

        if (snapshot.empty) {
          setCouponError(
            "كود الخصم غير صحيح."
          );

          return;
        }

        const coupon = {
          id:
            snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        };

        if (
          coupon.active === false
        ) {
          setCouponError(
            "كود الخصم غير مفعل."
          );

          return;
        }

        if (
          coupon.expiresAt &&
          typeof coupon.expiresAt
            .toDate ===
            "function"
        ) {
          if (
            coupon.expiresAt.toDate() <
            new Date()
          ) {
            setCouponError(
              "كود الخصم منتهي."
            );

            return;
          }
        }

        const minOrder =
          Number(
            coupon.minOrder ??
              coupon.minimumOrder ??
              coupon.minPurchase ??
              0
          );

        if (
          subtotalAfterWheel <
          minOrder
        ) {
          setCouponError(
            `الحد الأدنى لاستخدام الكود هو ${formatMoney(
              minOrder
            )}.`
          );

          return;
        }

        setCouponData(coupon);
      } catch (error) {
        console.error(
          "Coupon error:",
          error
        );

        setCouponError(
          "حدث خطأ أثناء التحقق من كود الخصم."
        );
      } finally {
        setCouponLoading(false);
      }
    };

  /* =====================================================
     REMOVE COUPON
===================================================== */

  const removeCoupon =
    () => {
      setCouponCode("");
      setCouponData(null);
      setCouponError("");
    };

  /* =====================================================
     PAYMENT PROOF SELECT
===================================================== */

  const handlePaymentProofChange =
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setPaymentProofUrl("");
      setPaymentProofPublicId("");
      setPaymentProofAssetId("");

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        alert(
          "من فضلك اختر صورة فقط لإثبات الدفع."
        );

        event.target.value = "";
        return;
      }

      if (
        file.size >
        MAX_PAYMENT_PROOF_SIZE
      ) {
        alert(
          "حجم صورة إثبات الدفع يجب ألا يتجاوز 5 ميجابايت."
        );

        event.target.value = "";
        return;
      }

      if (
        paymentProofPreview
      ) {
        URL.revokeObjectURL(
          paymentProofPreview
        );
      }

      const previewUrl =
        URL.createObjectURL(
          file
        );

      setPaymentProofFile(
        file
      );

      setPaymentProofPreview(
        previewUrl
      );
    };

  /* =====================================================
     REMOVE PAYMENT PROOF
===================================================== */

  const removePaymentProof =
    () => {
      if (
        paymentProofPreview
      ) {
        URL.revokeObjectURL(
          paymentProofPreview
        );
      }

      setPaymentProofFile(
        null
      );

      setPaymentProofPreview(
        ""
      );

      setPaymentProofUrl(
        ""
      );

      setPaymentProofPublicId(
        ""
      );

      setPaymentProofAssetId(
        ""
      );
    };

  /* =====================================================
     UPLOAD PAYMENT PROOF
===================================================== */

  const uploadPaymentProof =
    async (
      file,
      orderNumber
    ) => {
      if (
        !CLOUDINARY_CLOUD_NAME
      ) {
        throw new Error(
          "Cloudinary Cloud Name غير موجود."
        );
      }

      if (
        !CLOUDINARY_UPLOAD_PRESET
      ) {
        throw new Error(
          "Cloudinary Upload Preset غير موجود."
        );
      }

      if (!file) {
        throw new Error(
          "لم يتم اختيار صورة إثبات الدفع."
        );
      }

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
      );

      const response =
        await fetch(
          CLOUDINARY_UPLOAD_URL,
          {
            method: "POST",
            body: formData,
          }
        );

      let data = null;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "Cloudinary أرسل استجابة غير مفهومة."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
            "فشل رفع الصورة إلى Cloudinary."
        );
      }

      if (!data?.secure_url) {
        throw new Error(
          "تم الرفع ولكن لم يتم الحصول على رابط الصورة."
        );
      }

      return {
        url: data.secure_url,
        publicId:
          data.public_id || "",
        assetId:
          data.asset_id || "",
        orderNumber,
      };
    };

  /* =====================================================
     BUILD WHATSAPP MESSAGE
===================================================== */

  const buildWhatsappMessage =
    ({
      orderNumber,
      departmentName,
      paymentProof,
    }) => {
      const governorateObject =
        governorates.find(
          (item) =>
            String(
              item.id
            ) ===
            String(
              selectedGovernorate
            )
        ) || null;

      const cityObject =
        cities.find(
          (item) =>
            String(
              item.id
            ) ===
            String(
              selectedCity
            )
        ) || null;

      const villageObject =
        villages.find(
          (item) =>
            String(
              item.id
            ) ===
            String(
              selectedVillage
            )
        ) || null;

      let message = "";

      message +=
        "🛒 *طلب جديد من ســــَـــــوا*\n\n";

      message +=
        `📦 *رقم الطلب:* ${orderNumber}\n`;

      if (departmentName) {
        message +=
          `🏢 *القسم:* ${departmentName}\n`;
      }

      message += "\n";

      message +=
        "👤 *بيانات العميل*\n";

      message +=
        `الاسم: ${name.trim()}\n`;

      message +=
        `الهاتف: ${phone.trim()}\n`;

      if (
        governorateObject
      ) {
        message +=
          `المحافظة: ${getReadableLocationName(
            governorateObject
          )}\n`;
      }

      if (cityObject) {
        message +=
          `المدينة / المركز: ${getReadableLocationName(
            cityObject
          )}\n`;
      }

      if (villageObject) {
        message +=
          `القرية / المنطقة: ${getReadableLocationName(
            villageObject
          )}\n`;
      }

      message +=
        `العنوان بالتفصيل: ${address.trim()}\n`;

      if (notes.trim()) {
        message +=
          `ملاحظات: ${notes.trim()}\n`;
      }

      message += "\n";

      message +=
        "🛍️ *المنتجات*\n";

      cart.forEach(
        (product, index) => {
          const productPrice =
            Number(
              product.salePrice ??
                product.discountPrice ??
                product.price ??
                0
            );

          const quantity =
            Number(
              product.quantity ??
                product.qty ??
                product.count ??
                1
            );

          const productName =
            product.name ||
            product.title ||
            "منتج";

          const lineTotal =
            productPrice *
            quantity;

          message +=
            `${index + 1}. ${productName}\n`;

          message +=
            `   الكمية: ${quantity}\n`;

          message +=
            `   السعر: ${formatMoney(
              productPrice
            )}\n`;

          message +=
            `   الإجمالي: ${formatMoney(
              lineTotal
            )}\n`;
        }
      );

      message += "\n";

      message +=
        "💰 *ملخص الطلب*\n";

      message +=
        `الإجمالي قبل الخصم: ${formatMoney(
          subtotal
        )}\n`;

      if (
        wheelDiscount > 0
      ) {
        message +=
          `خصم عجلة الحظ: -${formatMoney(
            wheelDiscount
          )}\n`;
      }

      if (
        couponDiscount > 0
      ) {
        message +=
          `خصم الكوبون: -${formatMoney(
            couponDiscount
          )}\n`;
      }

      message +=
        `الشحن: ${formatMoney(
          shippingCost
        )}\n`;

      message +=
        `*الإجمالي النهائي: ${formatMoney(
          finalTotal
        )}*\n`;

      message += "\n";

      message +=
        `💳 *طريقة الدفع:* ${
          selectedPayment?.name ||
          "الدفع عند الاستلام"
        }\n`;

      const paymentNumber =
        getPaymentNumber(
          selectedPayment
        );

      if (
        paymentNumber &&
        !isCashPayment
      ) {
        message +=
          `رقم التحويل / الحساب: ${paymentNumber}\n`;
      }

      if (!isCashPayment) {
        message += "\n";

        message +=
          "📎 *إثبات الدفع:*\n";

        if (
          paymentProof?.url
        ) {
          message +=
            `${paymentProof.url}\n`;
        } else {
          message +=
            "تم رفع إثبات الدفع على الموقع.\n";
        }

        message += "\n";

        message +=
          "⚠️ تم رفع صورة إثبات الدفع على الموقع، يرجى مراجعة الرابط أعلاه.\n";

        message +=
          "📸 ويمكن للعميل أيضًا إرفاق صورة الإثبات يدويًا داخل محادثة واتساب إذا لزم الأمر.\n";
      }

      message += "\n";

      message +=
        "شكراً لاختياركم ســــَـــــوا ❤️";

      return message;
    };

  /* =====================================================
     FORM VALIDATION
===================================================== */

  const isFormValid =
    useMemo(() => {
      const basicValid =
        name.trim().length >= 2 &&
        phone.trim().length >= 8 &&
        address.trim().length >= 3 &&
        Boolean(
          selectedGovernorate
        ) &&
        Boolean(
          selectedCity
        ) &&
        Boolean(
          selectedPaymentMethod
        ) &&
        cart.length > 0 &&
        !couponError &&
        !couponLoading;

      if (!basicValid) {
        return false;
      }

      if (!isCashPayment) {
        return Boolean(
          paymentProofFile ||
            paymentProofUrl
        );
      }

      return true;
    }, [
      name,
      phone,
      address,
      selectedGovernorate,
      selectedCity,
      selectedPaymentMethod,
      cart,
      couponError,
      couponLoading,
      isCashPayment,
      paymentProofFile,
      paymentProofUrl,
    ]);

  /* =====================================================
     SEND ORDER
===================================================== */

  const sendOrder =
    async () => {
      if (loading) {
        return;
      }

      if (!user) {
        alert(
          "يجب تسجيل الدخول أولاً لإتمام الطلب."
        );

        return;
      }

      if (!cart.length) {
        alert(
          "السلة فارغة."
        );

        return;
      }

      if (!name.trim()) {
        alert(
          "من فضلك اكتب الاسم."
        );

        return;
      }

      if (!phone.trim()) {
        alert(
          "من فضلك اكتب رقم الهاتف."
        );

        return;
      }

      if (
        normalizePhone(
          phone
        ).length < 10
      ) {
        alert(
          "من فضلك أدخل رقم هاتف مصري صحيح."
        );

        return;
      }

      if (
        !selectedGovernorate
      ) {
        alert(
          "من فضلك اختر المحافظة."
        );

        return;
      }

      if (!selectedCity) {
        alert(
          "من فضلك اختر المدينة / المركز."
        );

        return;
      }

      if (!address.trim()) {
        alert(
          "من فضلك اكتب العنوان بالتفصيل."
        );

        return;
      }

      if (!selectedPayment) {
        alert(
          "من فضلك اختر طريقة الدفع."
        );

        return;
      }

      if (couponError) {
        alert(
          "من فضلك صحح مشكلة كود الخصم أولاً."
        );

        return;
      }

      if (
        !isCashPayment &&
        !paymentProofFile &&
        !paymentProofUrl
      ) {
        alert(
          "من فضلك ارفع صورة إثبات الدفع أولاً."
        );

        return;
      }

      const departments =
        getDepartmentsForOrder();

      if (!departments.length) {
        alert(
          "لم يتم العثور على رقم واتساب للقسم الخاص بالمنتجات."
        );

        return;
      }

      const targetDepartment =
        departments[0];

      if (
        !targetDepartment.whatsapp
      ) {
        alert(
          "رقم واتساب القسم غير موجود."
        );

        return;
      }

      setLoading(true);

      let uploadedPaymentProof =
        null;

      try {
        const orderNumber =
          generateOrderNumber();

        /* =============================================
           PAYMENT PROOF UPLOAD
        ============================================= */

        if (!isCashPayment) {
          setPaymentProofUploading(
            true
          );

          uploadedPaymentProof =
            await uploadPaymentProof(
              paymentProofFile,
              orderNumber
            );

          setPaymentProofUrl(
            uploadedPaymentProof.url
          );

          setPaymentProofPublicId(
            uploadedPaymentProof.publicId
          );

          setPaymentProofAssetId(
            uploadedPaymentProof.assetId
          );

          setPaymentProofUploading(
            false
          );
        }

        /* =============================================
           PRODUCTS
        ============================================= */

        const orderProducts =
          cart.map(
            (product) => {
              const price =
                Number(
                  product.salePrice ??
                    product.discountPrice ??
                    product.price ??
                    0
                );

              const quantity =
                Number(
                  product.quantity ??
                    product.qty ??
                    product.count ??
                    1
                );

              const category =
                findCategoryForProduct(
                  product
                );

              return {
                id:
                  product.id ||
                  product.productId ||
                  "",

                productId:
                  product.productId ||
                  product.id ||
                  "",

                name:
                  product.name ||
                  product.title ||
                  "منتج",

                image:
                  product.image ||
                  product.imageUrl ||
                  product.thumbnail ||
                  "",

                price,

                quantity,

                total:
                  price * quantity,

                categoryId:
                  product.categoryId ||
                  category?.id ||
                  "",

                categoryName:
                  product.categoryName ||
                  category?.name ||
                  category?.title ||
                  "",
              };
            }
          );

        /* =============================================
           LOCATION OBJECTS
        ============================================= */

        const governorateObject =
          governorates.find(
            (item) =>
              String(
                item.id
              ) ===
              String(
                selectedGovernorate
              )
          ) || null;

        const cityObject =
          cities.find(
            (item) =>
              String(
                item.id
              ) ===
              String(
                selectedCity
              )
          ) || null;

        const villageObject =
          villages.find(
            (item) =>
              String(
                item.id
              ) ===
              String(
                selectedVillage
              )
          ) || null;

        const governorateName =
          getReadableLocationName(
            governorateObject
          );

        const cityName =
          getReadableLocationName(
            cityObject
          );

        const villageName =
          getReadableLocationName(
            villageObject
          );

        /* =============================================
           STATUS
        ============================================= */

        const paymentStatus =
          isCashPayment
            ? "pending"
            : "proof_uploaded";

        const orderStatus =
          isCashPayment
            ? "pending"
            : "pending_payment";

        /* =============================================
           ORDER DATA
        ============================================= */

        const orderData = {
          orderNumber,

          storeName:
            "ســــَـــــوا",

          userId:
            user.uid,

          customerId:
            user.uid,

          customerName:
            name.trim(),

          customerPhone:
            phone.trim(),

          customerEmail:
            user.email || "",

          address:
            address.trim(),

          notes:
            notes.trim(),

          governorateId:
            selectedGovernorate ||
            "",

          governorateName,

          cityId:
            selectedCity ||
            "",

          cityName,

          villageId:
            selectedVillage ||
            "",

          villageName,

          village:
            villageObject
              ? {
                  id:
                    villageObject.id ||
                    "",

                  name:
                    villageName ||
                    "",

                  nameAr:
                    villageObject.nameAr ||
                    villageName ||
                    "",

                  nameEn:
                    villageObject.nameEn ||
                    "",

                  type:
                    villageObject.type ||
                    "",
                }
              : null,

          products:
            orderProducts,

          departments,

          departmentId:
            targetDepartment.id ||
            "",

          departmentName:
            targetDepartment.name ||
            "",

          departmentWhatsapp:
            targetDepartment.whatsapp ||
            "",

          shippingZoneId:
            selectedShippingZone ||
            "",

          shippingZoneName:
            selectedZone?.name ||
            selectedZone?.title ||
            "",

          shippingCost,

          subtotal,

          wheelDiscount,

          couponDiscount,

          totalDiscount,

          total:
            finalTotal,

          finalTotal,

          couponCode:
            couponData?.code ||
            couponCode
              .trim()
              .toUpperCase() ||
            "",

          coupon:
            couponData
              ? {
                  id:
                    couponData.id ||
                    "",

                  code:
                    couponData.code ||
                    couponCode
                      .trim()
                      .toUpperCase(),

                  value:
                    couponData.value ??
                    couponData.discount ??
                    0,

                  type:
                    couponData.type ||
                    couponData.discountType ||
                    "fixed",
                }
              : null,

          wheelPrize:
            wheelPrize || null,

          paymentMethod:
            selectedPayment.id,

          paymentMethodName:
            selectedPayment.name ||
            selectedPayment.title ||
            "",

          paymentNumber:
            getPaymentNumber(
              selectedPayment
            ),

          paymentStatus,

          paymentVerificationStatus:
            isCashPayment
              ? "not_required"
              : "pending",

          requiresPaymentProof:
            !isCashPayment,

          paymentProofStatus:
            isCashPayment
              ? "not_required"
              : "pending_review",

          paymentProofUploaded:
            !isCashPayment &&
            Boolean(
              uploadedPaymentProof?.url
            ),

          paymentProofUrl:
            uploadedPaymentProof?.url ||
            "",

          paymentProofPublicId:
            uploadedPaymentProof?.publicId ||
            "",

          paymentProofAssetId:
            uploadedPaymentProof?.assetId ||
            "",

          paymentProofUploadedAt:
            uploadedPaymentProof?.url
              ? serverTimestamp()
              : null,

          paidAmount:
            0,

          remainingAmount:
            finalTotal,

          status:
            orderStatus,

          orderStatus,

          whatsappMessageSent:
            false,

          whatsappTarget:
            targetDepartment.whatsapp,

          whatsappDepartment:
            targetDepartment.name ||
            "",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        };

        /* =============================================
           SAVE FIRESTORE
        ============================================= */

        const sanitizedOrder =
          sanitizeForFirestore(
            orderData
          );

        const orderRef =
          await addDoc(
            collection(
              db,
              "orders"
            ),
            sanitizedOrder
          );

        /* =============================================
           WHATSAPP
        ============================================= */

        const whatsappMessage =
          buildWhatsappMessage({
            orderNumber,
            departmentName:
              targetDepartment.name,
            paymentProof:
              uploadedPaymentProof,
          });

        const whatsappUrl =
          `https://wa.me/${targetDepartment.whatsapp}?text=${encodeURIComponent(
            whatsappMessage
          )}`;

        console.log(
          "Order created successfully:",
          orderRef.id
        );

        /* =============================================
           CLEAR CART
        ============================================= */

        setCart([]);

        try {
          localStorage.removeItem(
            "elsafty_wheel_prize"
          );
        } catch (error) {
          console.warn(
            "Could not clear wheel prize:",
            error
          );
        }

        /* =============================================
           OPEN WHATSAPP
        ============================================= */

        window.location.href =
          whatsappUrl;
      } catch (error) {
        console.error(
          "SEND ORDER ERROR:",
          error
        );

        alert(
          error?.message ||
            "حدث خطأ أثناء تسجيل الطلب. حاول مرة أخرى."
        );
      } finally {
        setLoading(false);

        setPaymentProofUploading(
          false
        );
      }
    };

  /* =====================================================
     EMPTY CART
===================================================== */

  if (
    !authLoading &&
    !cart.length
  ) {
    return (
      <div
        className="checkout-page"
        dir="rtl"
      >
        <div className="checkout-empty">

          <div className="checkout-empty-icon">
            🛒
          </div>

          <span className="checkout-empty-badge">
            ســــَـــــوا
          </span>

          <h2>
            السلة فارغة
          </h2>

          <p>
            أضف منتجات إلى السلة أولاً
            لإتمام طلبك.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
          >
            🛍️ العودة للمتجر
          </button>

        </div>
      </div>
    );
  }

  /* =====================================================
     MAIN RENDER
===================================================== */

  return (
    <div
      className="checkout-page"
      dir="rtl"
    >

      <div className="checkout-container">

        {/* =================================================
            TOP HEADER
        ================================================= */}

        <header className="checkout-header">

          <button
            type="button"
            className="checkout-back-button"
            onClick={() =>
              navigate(-1)
            }
          >
            <span>→</span>
            العودة
          </button>

          <div className="checkout-header-center">

            <span className="checkout-header-icon">
              🛒
            </span>

            <div>
              <span className="checkout-header-mini">
                ســــَـــــوا
              </span>

              <h1>
                إتمام الطلب
              </h1>
            </div>

          </div>

          <div className="checkout-secure">

            <span>
              🔒
            </span>

            <div>
              <strong>
                طلب آمن
              </strong>

              <small>
                بياناتك محمية
              </small>
            </div>

          </div>

        </header>

        {/* =================================================
            PROGRESS
        ================================================= */}

        <div className="checkout-progress">

          <div className="checkout-progress-step active">
            <span>1</span>

            <strong>
              بيانات الطلب
            </strong>
          </div>

          <div className="checkout-progress-line" />

          <div className="checkout-progress-step active">
            <span>2</span>

            <strong>
              الدفع
            </strong>
          </div>

          <div className="checkout-progress-line" />

          <div className="checkout-progress-step">
            <span>3</span>

            <strong>
              تأكيد الطلب
            </strong>
          </div>

        </div>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="checkout-grid">

          {/* =================================================
              LEFT / MAIN
          ================================================= */}

          <main className="checkout-main">

            {/* CUSTOMER */}

            <section className="checkout-card">

              <div className="checkout-card-title">

                <div className="checkout-section-icon">
                  👤
                </div>

                <div>
                  <h2>
                    بيانات العميل
                  </h2>

                  <p>
                    أدخل بيانات التواصل الخاصة بك
                  </p>
                </div>

              </div>

              <div className="checkout-form-grid">

                <div className="checkout-field">

                  <label>
                    الاسم الكامل
                    <span>*</span>
                  </label>

                  <div className="checkout-input-wrapper">

                    <span>
                      👤
                    </span>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) =>
                        setName(
                          e.target.value
                        )
                      }
                      placeholder="اكتب اسمك بالكامل"
                      autoComplete="name"
                    />

                  </div>

                </div>

                <div className="checkout-field">

                  <label>
                    رقم الهاتف
                    <span>*</span>
                  </label>

                  <div className="checkout-input-wrapper">

                    <span>
                      📱
                    </span>

                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(
                          e.target.value
                        )
                      }
                      placeholder="01xxxxxxxxx"
                      inputMode="numeric"
                      autoComplete="tel"
                    />

                  </div>

                </div>

              </div>

            </section>

            {/* ADDRESS */}

            <section className="checkout-card">

              <div className="checkout-card-title">

                <div className="checkout-section-icon">
                  📍
                </div>

                <div>
                  <h2>
                    عنوان التوصيل
                  </h2>

                  <p>
                    اختر موقعك واكتب العنوان بالتفصيل
                  </p>
                </div>

              </div>

              <div className="checkout-form-grid">

                {/* GOVERNORATE */}

                <div className="checkout-field">

                  <label>
                    المحافظة
                    <span>*</span>
                  </label>

                  <select
                    value={
                      selectedGovernorate
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value;

                      setSelectedGovernorate(
                        value
                      );

                      setSelectedCity("");
                      setSelectedVillage("");

                      setCities([]);
                      setVillages([]);
                    }}
                    disabled={
                      governoratesLoading
                    }
                  >

                    <option value="">
                      {governoratesLoading
                        ? "جاري تحميل المحافظات..."
                        : "اختر المحافظة"}
                    </option>

                    {governorates.map(
                      (item) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {getReadableLocationName(
                            item
                          )}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* CITY */}

                <div className="checkout-field">

                  <label>
                    المدينة / المركز
                    <span>*</span>
                  </label>

                  <select
                    value={
                      selectedCity
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value;

                      setSelectedCity(
                        value
                      );

                      setSelectedVillage(
                        ""
                      );

                      setVillages([]);
                    }}
                    disabled={
                      !selectedGovernorate ||
                      citiesLoading
                    }
                  >

                    <option value="">
                      {!selectedGovernorate
                        ? "اختر المحافظة أولاً"
                        : citiesLoading
                        ? "جاري تحميل المدن..."
                        : cities.length
                        ? "اختر المدينة / المركز"
                        : "لا توجد مدن متاحة"}
                    </option>

                    {cities.map(
                      (item) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {getReadableLocationName(
                            item
                          )}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* VILLAGE / AREA */}

                <div className="checkout-field">

                  <label>
                    القرية / المنطقة
                  </label>

                  <select
                    value={
                      selectedVillage
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value;

                      console.log(
                        "SWA SELECTED VILLAGE:",
                        value
                      );

                      setSelectedVillage(
                        value
                      );
                    }}
                    disabled={
                      !selectedCity ||
                      villagesLoading
                    }
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

                    {villages.map(
                      (item, index) => {
                        const villageId =
                          getLocationId(
                            item
                          );

                        const villageName =
                          getReadableLocationName(
                            item
                          );

                        if (
                          !villageId ||
                          !villageName
                        ) {
                          return null;
                        }

                        return (
                          <option
                            key={`${villageId}-${index}`}
                            value={
                              villageId
                            }
                          >
                            {villageName}
                          </option>
                        );
                      }
                    )}

                  </select>

                  {selectedCity &&
                    !villagesLoading &&
                    villages.length ===
                      0 && (
                      <small
                        style={{
                          display:
                            "block",
                          marginTop:
                            "8px",
                          color:
                            "#b45309",
                          fontSize:
                            "12px",
                        }}
                      >
                        لم يتم العثور على قرى لهذه المدينة / المركز.
                      </small>
                    )}

                </div>

                {/* DETAILED ADDRESS */}

                <div className="checkout-field checkout-field-full">

                  <label>
                    العنوان بالتفصيل
                    <span>*</span>
                  </label>

                  <textarea
                    value={
                      address
                    }
                    onChange={(e) =>
                      setAddress(
                        e.target.value
                      )
                    }
                    placeholder="اسم الشارع، رقم العقار، الدور، الشقة، وأي علامة مميزة..."
                    rows={4}
                  />

                </div>

                {/* NOTES */}

                <div className="checkout-field checkout-field-full">

                  <label>
                    ملاحظات على الطلب
                  </label>

                  <textarea
                    value={
                      notes
                    }
                    onChange={(e) =>
                      setNotes(
                        e.target.value
                      )
                    }
                    placeholder="أي ملاحظات إضافية تريد إخبارنا بها..."
                    rows={3}
                  />

                </div>

              </div>

            </section>

            {/* SHIPPING */}

            {shippingZones.length >
              0 && (
              <section className="checkout-card">

                <div className="checkout-card-title">

                  <div className="checkout-section-icon">
                    🚚
                  </div>

                  <div>
                    <h2>
                      طريقة الشحن
                    </h2>

                    <p>
                      اختر طريقة التوصيل المناسبة
                    </p>
                  </div>

                </div>

                <div className="checkout-shipping-list">

                  {shippingZones.map(
                    (zone) => (
                      <label
                        key={
                          zone.id
                        }
                        className={`checkout-shipping-option ${
                          selectedShippingZone ===
                          zone.id
                            ? "selected"
                            : ""
                        }`}
                      >

                        <input
                          type="radio"
                          name="shippingZone"
                          value={
                            zone.id
                          }
                          checked={
                            selectedShippingZone ===
                            zone.id
                          }
                          onChange={(e) =>
                            setSelectedShippingZone(
                              e.target.value
                            )
                          }
                        />

                        <div className="checkout-radio-mark">
                          <span />
                        </div>

                        <div className="checkout-shipping-content">

                          <strong>
                            {zone.name ||
                              zone.title ||
                              "الشحن"}
                          </strong>

                          <small>
                            توصيل للعنوان المحدد
                          </small>

                        </div>

                        <div className="checkout-shipping-price">

                          <strong>
                            {formatMoney(
                              zone.price ??
                                zone.shippingCost ??
                                zone.cost ??
                                0
                            )}
                          </strong>

                        </div>

                      </label>
                    )
                  )}

                </div>

              </section>
            )}

            {/* PAYMENT */}

            <section className="checkout-card">

              <div className="checkout-card-title">

                <div className="checkout-section-icon">
                  💳
                </div>

                <div>
                  <h2>
                    طريقة الدفع
                  </h2>

                  <p>
                    اختر طريقة الدفع المناسبة لك
                  </p>
                </div>

              </div>

              <div className="checkout-payment-list">

                {paymentMethods.map(
                  (method) => {
                    const methodId =
                      method.id;

                    const selected =
                      selectedPaymentMethod ===
                      methodId;

                    const methodNumber =
                      getPaymentNumber(
                        method
                      );

                    return (
                      <label
                        key={
                          methodId
                        }
                        className={`checkout-payment-option ${
                          selected
                            ? "selected"
                            : ""
                        }`}
                      >

                        <input
                          type="radio"
                          name="paymentMethod"
                          value={
                            methodId
                          }
                          checked={
                            selected
                          }
                          onChange={() => {

                            setSelectedPaymentMethod(
                              methodId
                            );

                            if (
                              methodId !==
                              selectedPaymentMethod
                            ) {
                              removePaymentProof();
                            }

                          }}
                        />

                        <div className="checkout-payment-radio">
                          <span />
                        </div>

                        <div className="checkout-payment-content">

                          <div className="checkout-payment-name">

                            <strong>
                              {method.name ||
                                method.title ||
                                "طريقة دفع"}
                            </strong>

                            {method.description && (
                              <small>
                                {
                                  method.description
                                }
                              </small>
                            )}

                          </div>

                          {!isCashPayment &&
                            selected &&
                            methodNumber && (
                              <div className="checkout-payment-number">

                                <span>
                                  رقم التحويل
                                </span>

                                <strong>
                                  {
                                    methodNumber
                                  }
                                </strong>

                              </div>
                            )}

                        </div>

                        {selected && (
                          <div className="checkout-payment-check">
                            ✓
                          </div>
                        )}

                      </label>
                    );
                  }
                )}

              </div>

              {/* PAYMENT PROOF */}

              {!isCashPayment &&
                selectedPayment && (
                  <div className="payment-proof-box">

                    <div className="payment-proof-top">

                      <div className="payment-proof-icon">
                        📸
                      </div>

                      <div>

                        <h3>
                          إثبات الدفع مطلوب
                        </h3>

                        <p>
                          بعد تحويل المبلغ، ارفع صورة واضحة للإيصال أو شاشة نجاح عملية الدفع.
                        </p>

                      </div>

                    </div>

                    {getPaymentNumber(
                      selectedPayment
                    ) && (
                      <div className="payment-proof-payment-number">

                        <div>
                          <span>
                            رقم التحويل / الحساب
                          </span>

                          <strong>
                            {getPaymentNumber(
                              selectedPayment
                            )}
                          </strong>
                        </div>

                        <span className="payment-proof-copy-hint">
                          استخدم هذا الرقم لإتمام التحويل
                        </span>

                      </div>
                    )}

                    {!paymentProofFile ? (
                      <div className="payment-proof-upload">

                        <input
                          id="payment-proof-input"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/*"
                          onChange={
                            handlePaymentProofChange
                          }
                          disabled={
                            paymentProofUploading ||
                            loading
                          }
                        />

                        <label
                          htmlFor="payment-proof-input"
                          className="payment-proof-label"
                        >

                          <span className="payment-proof-upload-icon">
                            ⬆️
                          </span>

                          <strong>
                            اضغط لاختيار صورة إثبات الدفع
                          </strong>

                          <small>
                            JPG / PNG / WEBP
                            <br />
                            الحد الأقصى 5 ميجابايت
                          </small>

                        </label>

                      </div>
                    ) : (
                      <div className="payment-proof-preview-box">

                        <div className="payment-proof-file-header">

                          <div>
                            <span className="payment-proof-file-icon">
                              🖼️
                            </span>

                            <div>
                              <strong>
                                تم اختيار إثبات الدفع
                              </strong>

                              <small>
                                {
                                  paymentProofFile.name
                                }
                              </small>
                            </div>
                          </div>

                          <span className="payment-proof-file-size">
                            {(
                              paymentProofFile.size /
                              1024 /
                              1024
                            ).toFixed(
                              2
                            )}{" "}
                            MB
                          </span>

                        </div>

                        {paymentProofPreview && (
                          <div className="payment-proof-image-wrapper">

                            <img
                              src={
                                paymentProofPreview
                              }
                              alt="معاينة إثبات الدفع"
                              className="payment-proof-image"
                            />

                            <div className="payment-proof-image-overlay">
                              ✓ صورة جاهزة للرفع
                            </div>

                          </div>
                        )}

                        <button
                          type="button"
                          className="payment-proof-remove"
                          onClick={
                            removePaymentProof
                          }
                          disabled={
                            paymentProofUploading ||
                            loading
                          }
                        >
                          🗑️ تغيير / حذف الصورة
                        </button>

                      </div>
                    )}

                    {paymentProofUploading && (
                      <div className="payment-proof-uploading">

                        <span className="payment-proof-spinner">
                          ⏳
                        </span>

                        <div>
                          <strong>
                            جاري رفع إثبات الدفع...
                          </strong>

                          <small>
                            لا تغلق الصفحة حتى يكتمل الرفع
                          </small>
                        </div>

                      </div>
                    )}

                    <div className="payment-proof-note">

                      <span>
                        🔒
                      </span>

                      <p>
                        سيتم رفع صورة الإثبات بشكل آمن إلى Cloudinary وربطها بالطلب داخل Firestore، وبعد نجاح التسجيل سيتم فتح محادثة واتساب الخاصة بالقسم.
                      </p>

                    </div>

                  </div>
                )}

            </section>

            {/* COUPON */}

            <section className="checkout-card">

              <div className="checkout-card-title">

                <div className="checkout-section-icon">
                  🎟️
                </div>

                <div>
                  <h2>
                    كود الخصم
                  </h2>

                  <p>
                    لديك كوبون؟ استخدمه الآن
                  </p>
                </div>

              </div>

              {!couponData ? (
                <div className="checkout-coupon">

                  <div className="checkout-coupon-input">

                    <span>
                      %
                    </span>

                    <input
                      type="text"
                      value={
                        couponCode
                      }
                      onChange={(e) => {
                        setCouponCode(
                          e.target.value.toUpperCase()
                        );

                        setCouponError(
                          ""
                        );
                      }}
                      placeholder="اكتب كود الخصم"
                    />

                  </div>

                  <button
                    type="button"
                    onClick={
                      applyCoupon
                    }
                    disabled={
                      couponLoading
                    }
                  >
                    {couponLoading
                      ? "جاري التحقق..."
                      : "تطبيق الكود"}
                  </button>

                </div>
              ) : (
                <div className="checkout-coupon-success">

                  <div>

                    <span>
                      ✓
                    </span>

                    <div>
                      <small>
                        تم تطبيق الكود بنجاح
                      </small>

                      <strong>
                        {
                          couponData.code
                        }
                      </strong>
                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={
                      removeCoupon
                    }
                  >
                    إزالة
                  </button>

                </div>
              )}

              {couponError && (
                <div className="checkout-error">
                  ⚠️{" "}
                  {couponError}
                </div>
              )}

            </section>

            {/* WHEEL */}

            {wheelPrize && (
              <section className="checkout-card checkout-wheel-card">

                <div className="checkout-card-title">

                  <div className="checkout-section-icon">
                    🎡
                  </div>

                  <div>
                    <h2>
                      خصم عجلة الحظ
                    </h2>

                    <p>
                      تم تطبيق الجائزة على طلبك
                    </p>
                  </div>

                </div>

                <div className="checkout-wheel-prize">

                  <div className="checkout-wheel-prize-icon">
                    🎁
                  </div>

                  <div>

                    <strong>
                      {wheelPrize.title ||
                        wheelPrize.name ||
                        "تم الحصول على خصم"}
                    </strong>

                    {wheelDiscount >
                      0 && (
                      <span>
                        خصم{" "}
                        {formatMoney(
                          wheelDiscount
                        )}
                      </span>
                    )}

                  </div>

                </div>

              </section>
            )}

          </main>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="checkout-sidebar">

            <section className="checkout-card checkout-summary-card">

              <div className="checkout-summary-header">

                <div className="checkout-card-title">

                  <div className="checkout-section-icon">
                    🧾
                  </div>

                  <div>
                    <h2>
                      ملخص الطلب
                    </h2>

                    <p>
                      {cart.length}{" "}
                      منتج في السلة
                    </p>
                  </div>

                </div>

              </div>

              {/* PRODUCTS */}

              <div className="checkout-products-summary">

                {cart.map(
                  (
                    product,
                    index
                  ) => {
                    const price =
                      Number(
                        product.salePrice ??
                          product.discountPrice ??
                          product.price ??
                          0
                      );

                    const quantity =
                      Number(
                        product.quantity ??
                          product.qty ??
                          product.count ??
                          1
                      );

                    const image =
                      product.image ||
                      product.imageUrl ||
                      product.thumbnail;

                    return (
                      <div
                        className="checkout-summary-product"
                        key={
                          product.id ||
                          product.productId ||
                          index
                        }
                      >

                        <div className="checkout-summary-product-image">

                          {image ? (
                            <img
                              src={
                                image
                              }
                              alt={
                                product.name ||
                                product.title ||
                                "منتج"
                              }
                            />
                          ) : (
                            <span>
                              📦
                            </span>
                          )}

                          <b>
                            {quantity}
                          </b>

                        </div>

                        <div className="checkout-summary-product-info">

                          <strong>
                            {product.name ||
                              product.title ||
                              "منتج"}
                          </strong>

                          <span>
                            الكمية:{" "}
                            {quantity}
                          </span>

                          <b>
                            {formatMoney(
                              price *
                                quantity
                            )}
                          </b>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

              {/* SUMMARY LINES */}

              <div className="checkout-summary-lines">

                <div>
                  <span>
                    إجمالي المنتجات
                  </span>

                  <strong>
                    {formatMoney(
                      subtotal
                    )}
                  </strong>
                </div>

                {wheelDiscount >
                  0 && (
                  <div className="discount-line">

                    <span>
                      🎡 خصم عجلة الحظ
                    </span>

                    <strong>
                      -
                      {formatMoney(
                        wheelDiscount
                      )}
                    </strong>

                  </div>
                )}

                {couponDiscount >
                  0 && (
                  <div className="discount-line">

                    <span>
                      🎟️ خصم الكوبون
                    </span>

                    <strong>
                      -
                      {formatMoney(
                        couponDiscount
                      )}
                    </strong>

                  </div>
                )}

                <div>

                  <span>
                    🚚 الشحن
                  </span>

                  <strong>
                    {formatMoney(
                      shippingCost
                    )}
                  </strong>

                </div>

              </div>

              {/* TOTAL */}

              <div className="checkout-total-row">

                <div>

                  <span>
                    الإجمالي النهائي
                  </span>

                  <small>
                    شامل الخصومات والشحن
                  </small>

                </div>

                <strong>
                  {formatMoney(
                    finalTotal
                  )}
                </strong>

              </div>

              {/* PAYMENT */}

              <div className="checkout-payment-summary">

                <span>
                  💳 طريقة الدفع
                </span>

                <strong>
                  {selectedPayment?.name ||
                    "لم يتم الاختيار"}
                </strong>

              </div>

              {/* PAYMENT PROOF STATUS */}

              {!isCashPayment && (
                <div
                  className={`checkout-proof-summary ${
                    paymentProofFile
                      ? "ready"
                      : "required"
                  }`}
                >

                  <div>

                    <span>
                      📸 إثبات الدفع
                    </span>

                    <small>
                      {paymentProofFile
                        ? "جاهز للرفع"
                        : "مطلوب قبل تأكيد الطلب"}
                    </small>

                  </div>

                  <strong>
                    {paymentProofFile
                      ? "✓"
                      : "!"}
                  </strong>

                </div>
              )}

              {/* CONFIRM */}

              <button
                type="button"
                className="checkout-confirm-button"
                onClick={
                  sendOrder
                }
                disabled={
                  loading ||
                  authLoading ||
                  dataLoading ||
                  governoratesLoading ||
                  citiesLoading ||
                  villagesLoading ||
                  paymentProofUploading ||
                  !isFormValid
                }
              >

                <span className="checkout-confirm-icon">
                  {paymentProofUploading
                    ? "⏳"
                    : loading
                    ? "⏳"
                    : !isCashPayment &&
                      !paymentProofFile &&
                      !paymentProofUrl
                    ? "📸"
                    : "✓"}
                </span>

                <span>
                  {paymentProofUploading
                    ? "جاري رفع إثبات الدفع..."
                    : loading
                    ? "جاري تسجيل الطلب..."
                    : !isCashPayment &&
                      !paymentProofFile &&
                      !paymentProofUrl
                    ? "ارفع إثبات الدفع أولاً"
                    : "تأكيد الطلب وإرسال واتساب"}
                </span>

              </button>

              {/* SECURITY */}

              <div className="checkout-security-note">

                <span>
                  🔐
                </span>

                <div>

                  <strong>
                    عملية دفع آمنة
                  </strong>

                  <small>
                    يتم حفظ بيانات طلبك بشكل آمن
                  </small>

                </div>

              </div>

            </section>

            {/* BACK TO STORE */}

            <button
              type="button"
              className="checkout-back-store-button"
              onClick={() =>
                navigate("/")
              }
            >

              <span>
                ←
              </span>

              العودة للتسوق

            </button>

          </aside>

        </div>

      </div>

    </div>
  );
};

export default Checkout;