import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db, auth } from "../../firebase";

import { signOut } from "firebase/auth";

import "./Admin.css";

import {
  addProduct,
  editProduct,
  removeProduct,
} from "../../services/productService";

import {
  getAllCategories,
  addCategory,
  editCategory,
  removeCategory,
} from "../../services/categoryService";


function Admin({
  products = [],
  loadProducts,
}) {
  const navigate = useNavigate();

  // ==================================================
  // GENERAL STATES
  // ==================================================

  const [tab, setTab] = useState("products");

  const [orders, setOrders] = useState([]);

  const [categories, setCategories] = useState([]);

  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [showUserDetails, setShowUserDetails] =
    useState(false);

  const [savingProduct, setSavingProduct] =
    useState(false);

  const [savingCategory, setSavingCategory] =
    useState(false);

  // ==================================================
  // ORDER NOTIFICATION
  // ==================================================

  const firstLoad = useRef(true);

  const previousOrdersCount = useRef(0);

  const audio = useRef(null);

  // ==================================================
  // PRODUCT STATES
  // ==================================================

  const [title, setTitle] = useState("");

  const [description, setDescription] =
    useState("");

  const [price, setPrice] = useState("");

  const [oldPrice, setOldPrice] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [rating, setRating] = useState(5);

  const [stock, setStock] = useState(1);

  const [offer, setOffer] = useState(false);

  const [bestSeller, setBestSeller] =
    useState(false);

  const [newArrival, setNewArrival] =
    useState(false);

  const [recommended, setRecommended] =
    useState(false);

  const [hasVariants, setHasVariants] =
    useState(false);

  const [variants, setVariants] =
    useState([]);

  const [image, setImage] = useState("");

  const [images, setImages] = useState([]);

  const [editingId, setEditingId] =
    useState(null);

  // ==================================================
  // VARIANTS
  // ==================================================

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `variant-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        name: "",
        price: "",
        oldPrice: "",
        stock: 1,
      },
    ]);
  };

  const updateVariant = (
    id,
    field,
    value
  ) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === id
          ? {
              ...variant,
              [field]: value,
            }
          : variant
      )
    );
  };

  const removeVariant = (id) => {
    setVariants((prev) =>
      prev.filter(
        (variant) =>
          variant.id !== id
      )
    );
  };

  // ==================================================
  // CATEGORY STATES
  // ==================================================

  const [categoryName, setCategoryName] =
    useState("");

  const [categoryIcon, setCategoryIcon] =
    useState("");

  const [categoryImage, setCategoryImage] =
    useState("");

  const [editingCategoryId, setEditingCategoryId] =
    useState(null);

  const [categoryParentId, setCategoryParentId] =
    useState("");

  // ==================================================
  // INITIALIZE AUDIO
  // ==================================================

  useEffect(() => {
    try {
      audio.current = new Audio(
        "/sounds/new-order.mp3"
      );

      audio.current.preload = "auto";
    } catch (error) {
      console.error(
        "Audio initialization error:",
        error
      );
    }

    return () => {
      if (audio.current) {
        audio.current.pause();
        audio.current = null;
      }
    };
  }, []);

  // ==================================================
  // NOTIFICATION PERMISSION
  // ==================================================

  useEffect(() => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    if (
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(
        (error) => {
          console.log(
            "Notification permission error:",
            error
          );
        }
      );
    }
  }, []);

  // ==================================================
  // TOTAL SALES
  // ==================================================

  const totalSales = useMemo(() => {
    return orders.reduce(
      (sum, order) =>
        sum + Number(order?.total || 0),
      0
    );
  }, [orders]);

  // ==================================================
  // CATEGORY MAP
  // ==================================================

  const categoryMap = useMemo(() => {
    const map = {};

    categories.forEach((cat) => {
      map[cat.id] = cat;
    });

    return map;
  }, [categories]);

  // ==================================================
  // CLEAR PRODUCT FORM
  // ==================================================

  const clearForm = () => {
    setTitle("");

    setDescription("");

    setPrice("");

    setOldPrice("");

    setCategory("");

    setRating(5);

    setStock(1);

    setOffer(false);

    setBestSeller(false);

    setNewArrival(false);

    setRecommended(false);

    setHasVariants(false);

    setVariants([]);

    setImage("");

    setImages([]);

    setEditingId(null);
  };

  // ==================================================
  // IMAGE UPLOAD
  // ==================================================

  const handleImageUpload = (e) => {
    const files = Array.from(
      e.target.files || []
    );

    if (!files.length) {
      return;
    }

    const readers = files.map((file) => {
      return new Promise(
        (resolve, reject) => {
          const reader =
            new FileReader();

          reader.onloadend = () => {
            resolve(
              reader.result
            );
          };

          reader.onerror = reject;

          reader.readAsDataURL(file);
        }
      );
    });

    Promise.all(readers)
      .then((result) => {
        setImages(result);

        setImage(
          result[0] || ""
        );
      })
      .catch((error) => {
        console.error(
          "Image read error:",
          error
        );

        alert(
          "حدث خطأ أثناء قراءة الصور"
        );
      });

    // يسمح باختيار نفس الصورة مرة أخرى
    e.target.value = "";
  };

  // ==================================================
  // CATEGORY IMAGE UPLOAD
  // ==================================================

  const handleCategoryImageUpload = (
    e
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    const reader =
      new FileReader();

    reader.onloadend = () => {
      setCategoryImage(
        reader.result || ""
      );
    };

    reader.onerror = () => {
      alert(
        "حدث خطأ أثناء قراءة صورة القسم"
      );
    };

    reader.readAsDataURL(file);

    e.target.value = "";
  };

  // ==================================================
  // UPLOAD IMAGE TO CLOUDINARY
  // ==================================================

  const uploadImageToCloudinary =
    async (imageData) => {
      if (
        !imageData ||
        typeof imageData !== "string"
      ) {
        return "";
      }

      // الصورة بالفعل URL
      if (
        !imageData.startsWith("data:")
      ) {
        return imageData;
      }

      const formData =
        new FormData();

      const blob =
        await (
          await fetch(imageData)
        ).blob();

      formData.append(
        "file",
        blob
      );

      formData.append(
        "upload_preset",
        "elsafty_store"
      );

      const response =
        await fetch(
          "https://api.cloudinary.com/v1_1/wkcpvsqi/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Cloudinary upload error:",
          data
        );

        throw new Error(
          data?.error?.message ||
            "فشل رفع الصورة"
        );
      }

      return (
        data?.secure_url || ""
      );
    };

  // ==================================================
  // UPLOAD MULTIPLE IMAGES
  // ==================================================

  const uploadProductImages =
    async (sourceImages) => {
      const uploadedImages = [];

      for (
        const img of sourceImages
      ) {
        if (!img) {
          continue;
        }

        const imageUrl =
          await uploadImageToCloudinary(
            img
          );

        if (imageUrl) {
          uploadedImages.push(
            imageUrl
          );
        }
      }

      return uploadedImages;
    };

  // ==================================================
  // SAVE PRODUCT
  // ==================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (savingProduct) {
      return;
    }

    const cleanTitle =
      title.trim();

    const numericPrice =
      Number(price);

    const numericOldPrice =
      Number(oldPrice || 0);

    const numericRating =
      Number(rating || 5);

    const numericStock =
      Number(stock || 0);

    // --------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------

    if (
      !cleanTitle ||
      price === "" ||
      Number.isNaN(numericPrice) ||
      numericPrice <= 0 ||
      !image
    ) {
      alert(
        "اكمل بيانات المنتج بشكل صحيح"
      );

      return;
    }

    if (
      numericOldPrice < 0
    ) {
      alert(
        "السعر قبل الخصم غير صحيح"
      );

      return;
    }

    if (
      numericRating < 0 ||
      numericRating > 5
    ) {
      alert(
        "التقييم يجب أن يكون بين 0 و 5"
      );

      return;
    }

    if (
      numericStock < 0
    ) {
      alert(
        "المخزون لا يمكن أن يكون أقل من صفر"
      );

      return;
    }

    // --------------------------------------------------
    // VARIANT VALIDATION
    // --------------------------------------------------

    if (
      hasVariants &&
      variants.length === 0
    ) {
      alert(
        "أضف متغير واحد على الأقل للمنتج"
      );

      return;
    }

    setSavingProduct(true);

    try {
      // ==================================================
      // UPLOAD PRODUCT IMAGES
      // ==================================================

      const sourceImages =
        images.length
          ? images
          : image
          ? [image]
          : [];

      const uploadedImages =
        await uploadProductImages(
          sourceImages
        );

      if (
        uploadedImages.length === 0
      ) {
        throw new Error(
          "لم يتم رفع أي صورة للمنتج"
        );
      }

      // ==================================================
      // CLEAN VARIANTS
      // ==================================================

      const cleanedVariants =
        variants
          .filter(
            (variant) =>
              variant?.name
                ?.trim() !== ""
          )
          .map(
            (
              variant,
              index
            ) => ({
              id:
                variant.id ||
                `variant-${Date.now()}-${index}`,

              name:
                variant.name.trim(),

              price:
                Number(
                  variant.price || 0
                ),

              oldPrice:
                Number(
                  variant.oldPrice || 0
                ),

              stock:
                Number(
                  variant.stock || 0
                ),
            })
          );

      // ==================================================
      // VALIDATE CLEANED VARIANTS
      // ==================================================

      if (hasVariants) {
        const invalidVariant =
          cleanedVariants.find(
            (variant) =>
              !variant.name ||
              variant.price <= 0 ||
              variant.stock < 0 ||
              variant.oldPrice < 0
          );

        if (invalidVariant) {
          alert(
            "تأكد من إدخال اسم وسعر ومخزون صحيح لكل متغير"
          );

          setSavingProduct(false);

          return;
        }
      }

      // ==================================================
      // PRODUCT OBJECT
      // ==================================================

      const product = {
        title: cleanTitle,

        description:
          description.trim(),

        price:
          numericPrice,

        oldPrice:
          numericOldPrice,

        image:
          uploadedImages[0],

        images:
          uploadedImages,

        categoryId:
          category || null,

        rating:
          numericRating,

        stock:
          numericStock,

        offer:
          Boolean(offer),

        bestSeller:
          Boolean(bestSeller),

        newArrival:
          Boolean(newArrival),

        recommended:
          Boolean(recommended),

        hasVariants:
          Boolean(hasVariants),

        variants:
          hasVariants
            ? cleanedVariants
            : [],
      };

      // ==================================================
      // SAVE TO FIRESTORE
      // ==================================================

      const wasEditing =
        Boolean(editingId);

      if (wasEditing) {
        await editProduct(
          editingId,
          product
        );
      } else {
        await addProduct(
          product
        );
      }

      // ==================================================
      // REFRESH PRODUCTS
      // ==================================================

      if (
        typeof loadProducts ===
        "function"
      ) {
        await loadProducts();
      }

      // ==================================================
      // CLEAR FORM
      // ==================================================

      clearForm();

      alert(
        wasEditing
          ? "تم تعديل المنتج بنجاح ✅"
          : "تم إضافة المنتج بنجاح ✅"
      );
    } catch (error) {
      console.error(
        "Save Product Error:",
        error
      );

      alert(
        error?.message ||
          "حدث خطأ أثناء حفظ المنتج"
      );
    } finally {
      setSavingProduct(false);
    }
  };

  // ==================================================
  // EDIT PRODUCT
  // ==================================================

  const handleEdit = (
    product
  ) => {
    if (!product) {
      return;
    }

    setEditingId(
      product.id
    );

    setTitle(
      product.title || ""
    );

    setDescription(
      product.description || ""
    );

    setPrice(
      product.price ?? ""
    );

    setOldPrice(
      product.oldPrice ?? ""
    );

    setCategory(
      product.categoryId ||
        product.category ||
        ""
    );

    setRating(
      product.rating ?? 5
    );

    setStock(
      product.stock ?? 1
    );

    setOffer(
      Boolean(product.offer)
    );

    setBestSeller(
      Boolean(product.bestSeller)
    );

    setNewArrival(
      Boolean(product.newArrival)
    );

    setRecommended(
      Boolean(product.recommended)
    );

    setHasVariants(
      Boolean(product.hasVariants)
    );

    setVariants(
      Array.isArray(
        product.variants
      )
        ? product.variants.map(
            (
              variant,
              index
            ) => ({
              id:
                variant.id ||
                `variant-${Date.now()}-${index}`,

              name:
                variant.name || "",

              price:
                variant.price ?? "",

              oldPrice:
                variant.oldPrice ??
                "",

              stock:
                variant.stock ?? 1,
            })
          )
        : []
    );

    setImage(
      product.image || ""
    );

    setImages(
      Array.isArray(
        product.images
      ) &&
        product.images.length
        ? product.images
        : product.image
        ? [product.image]
        : []
    );

    setTab("products");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==================================================
  // DELETE PRODUCT
  // ==================================================

  const handleDelete = async (
    id
  ) => {
    if (!id) {
      return;
    }

    if (
      !window.confirm(
        "هل أنت متأكد من حذف المنتج؟"
      )
    ) {
      return;
    }

    try {
      await removeProduct(id);

      if (
        typeof loadProducts ===
        "function"
      ) {
        await loadProducts();
      }

      if (
        editingId === id
      ) {
        clearForm();
      }

      alert(
        "تم حذف المنتج بنجاح ✅"
      );
    } catch (error) {
      console.error(
        "Delete Product Error:",
        error
      );

      alert(
        error?.message ||
          "فشل حذف المنتج"
      );
    }
  };

  // ==================================================
  // LOAD ORDERS
  // ==================================================

  useEffect(() => {
    const ordersQuery =
      query(
        collection(
          db,
          "orders"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const unsubscribe =
      onSnapshot(
        ordersQuery,
        (snapshot) => {
          const list =
            snapshot.docs.map(
              (item) => ({
                id: item.id,
                ...item.data(),
              })
            );

          const currentCount =
            list.length;

          // ------------------------------------------
          // FIRST LOAD
          // ------------------------------------------

          if (
            firstLoad.current
          ) {
            firstLoad.current =
              false;

            previousOrdersCount.current =
              currentCount;

            setOrders(list);

            return;
          }

          // ------------------------------------------
          // NEW ORDER
          // ------------------------------------------

          if (
            currentCount >
            previousOrdersCount.current
          ) {
            const latestOrder =
              list[0];

            // Play sound
            if (audio.current) {
              audio.current.currentTime = 0;

              audio.current
                .play()
                .catch(
                  (error) => {
                    console.log(
                      "لم يتم تشغيل صوت الطلب:",
                      error
                    );
                  }
                );
            }

            // Browser notification
            if (
              typeof window !==
                "undefined" &&
              "Notification" in
                window &&
              Notification.permission ===
                "granted"
            ) {
              try {
                new Notification(
                  "🛒 طلب جديد",
                  {
                    body:
                      `${
                        latestOrder
                          ?.customerName ||
                        "عميل جديد"
                      } - ${
                        latestOrder
                          ?.total ||
                        0
                      } جنيه`,
                  }
                );
              } catch (error) {
                console.log(
                  "Notification error:",
                  error
                );
              }
            }
          }

          previousOrdersCount.current =
            currentCount;

          setOrders(list);
        },
        (error) => {
          console.error(
            "Orders Error:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  // ==================================================
  // CHANGE ORDER STATUS
  // ==================================================

  const changeOrderStatus =
    async (
      id,
      status
    ) => {
      if (!id || !status) {
        return;
      }

      try {
        await updateDoc(
          doc(
            db,
            "orders",
            id
          ),
          {
            status,
          }
        );
      } catch (error) {
        console.error(
          "Order Status Error:",
          error
        );

        alert(
          "فشل تحديث حالة الطلب"
        );
      }
    };

  // ==================================================
  // LOAD CATEGORIES
  // ==================================================

  const loadCategories =
    async () => {
      try {
        const data =
          await getAllCategories();

        setCategories(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Categories Error:",
          error
        );

        setCategories([]);
      }
    };

  useEffect(() => {
    loadCategories();
  }, []);

  // ==================================================
  // LOAD USERS
  // ==================================================

  useEffect(() => {
    const usersQuery =
      query(
        collection(
          db,
          "users"
        )
      );

    const unsubscribe =
      onSnapshot(
        usersQuery,
        (snapshot) => {
          const list =
            snapshot.docs.map(
              (item) => ({
                id: item.id,
                ...item.data(),
              })
            );

          setUsers(list);
        },
        (error) => {
          console.error(
            "Users Error:",
            error
          );

          setUsers([]);
        }
      );

    return () =>
      unsubscribe();
  }, []);

  // ==================================================
  // GET USER ORDERS
  // ==================================================

  const getOrdersForUser = (
    userId
  ) => {
    if (!userId) {
      return [];
    }

    return orders.filter(
      (order) =>
        order?.userId ===
          userId ||
        order?.uid ===
          userId ||
        order?.customerId ===
          userId ||
        order?.userUID ===
          userId
    );
  };

  // ==================================================
  // SELECTED USER ORDERS
  // ==================================================

  const selectedUserOrders =
    useMemo(() => {
      if (!selectedUser?.id) {
        return [];
      }

      return getOrdersForUser(
        selectedUser.id
      );
    }, [
      orders,
      selectedUser,
    ]);

  // ==================================================
  // OPEN USER DETAILS
  // ==================================================

  const openUserDetails = (
    user
  ) => {
    if (!user) {
      return;
    }

    setSelectedUser(user);

    setShowUserDetails(true);
  };

  // ==================================================
  // CLOSE USER DETAILS
  // ==================================================

  const closeUserDetails =
    () => {
      setSelectedUser(null);

      setShowUserDetails(false);
    };

  // ==================================================
  // SAVE CATEGORY
  // ==================================================

  const saveCategory =
    async () => {
      if (savingCategory) {
        return;
      }

      const cleanName =
        categoryName.trim();

      if (!cleanName) {
        alert(
          "اكتب اسم القسم"
        );

        return;
      }

      // ------------------------------------------
      // PREVENT SELF PARENT
      // ------------------------------------------

      if (
        editingCategoryId &&
        categoryParentId ===
          editingCategoryId
      ) {
        alert(
          "لا يمكن جعل القسم أبًا لنفسه"
        );

        return;
      }

      // ------------------------------------------
      // PREVENT CIRCULAR TREE
      // ------------------------------------------

      if (
        editingCategoryId &&
        categoryParentId &&
        isCategoryDescendant(
          categoryParentId,
          editingCategoryId
        )
      ) {
        alert(
          "لا يمكن اختيار قسم فرعي تابع لهذا القسم كقسم أب"
        );

        return;
      }

      setSavingCategory(true);

      try {
        const existingCategory =
          editingCategoryId
            ? categories.find(
                (cat) =>
                  cat.id ===
                  editingCategoryId
              )
            : null;

        // ------------------------------------------
        // UPLOAD CATEGORY IMAGE
        // ------------------------------------------

        let finalCategoryImage =
          categoryImage || "";

        if (
          finalCategoryImage.startsWith(
            "data:"
          )
        ) {
          finalCategoryImage =
            await uploadImageToCloudinary(
              finalCategoryImage
            );
        }

        const data = {
          name:
            cleanName,

          icon:
            categoryIcon.trim(),

          image:
            finalCategoryImage,

          parentId:
            categoryParentId ||
            null,

          active:
            editingCategoryId
              ? existingCategory?.active ??
                true
              : true,
        };

        // ------------------------------------------
        // SAVE
        // ------------------------------------------

        const wasEditing =
          Boolean(
            editingCategoryId
          );

        if (wasEditing) {
          await editCategory(
            editingCategoryId,
            data
          );
        } else {
          await addCategory(
            data
          );
        }

        await loadCategories();

        clearCategoryForm();

        alert(
          wasEditing
            ? "تم تعديل القسم بنجاح ✅"
            : "تم إضافة القسم بنجاح ✅"
        );
      } catch (error) {
        console.error(
          "Save Category Error:",
          error
        );

        alert(
          error?.message ||
            "حدث خطأ أثناء حفظ القسم"
        );
      } finally {
        setSavingCategory(false);
      }
    };

  // ==================================================
  // CLEAR CATEGORY FORM
  // ==================================================

  const clearCategoryForm =
    () => {
      setCategoryName("");

      setCategoryIcon("");

      setCategoryImage("");

      setCategoryParentId("");

      setEditingCategoryId(null);
    };

  // ==================================================
  // EDIT CATEGORY
  // ==================================================

  const handleEditCategory =
    (cat) => {
      if (!cat) {
        return;
      }

      setEditingCategoryId(
        cat.id
      );

      setCategoryName(
        cat.name || ""
      );

      setCategoryIcon(
        cat.icon || ""
      );

      setCategoryImage(
        cat.image || ""
      );

      setCategoryParentId(
        cat.parentId || ""
      );

      setTab("categories");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // ==================================================
  // DELETE CATEGORY
  // ==================================================

  const handleDeleteCategory =
    async (id) => {
      if (!id) {
        return;
      }

      // ------------------------------------------
      // CHECK CHILDREN
      // ------------------------------------------

      const hasChildren =
        categories.some(
          (cat) =>
            (cat.parentId ||
              null) === id
        );

      if (hasChildren) {
        alert(
          "لا يمكن حذف هذا القسم لأنه يحتوي على أقسام فرعية. احذف أو انقل الأقسام الفرعية أولاً."
        );

        return;
      }

      // ------------------------------------------
      // CHECK PRODUCTS
      // ------------------------------------------

      const hasProducts =
        products.some(
          (product) =>
            product?.categoryId ===
            id
        );

      if (hasProducts) {
        alert(
          "لا يمكن حذف القسم لأنه مرتبط بمنتجات. انقل المنتجات لقسم آخر أولاً."
        );

        return;
      }

      // ------------------------------------------
      // CONFIRM
      // ------------------------------------------

      if (
        !window.confirm(
          "هل أنت متأكد من حذف القسم؟"
        )
      ) {
        return;
      }

      try {
        await removeCategory(
          id
        );

        await loadCategories();

        if (
          editingCategoryId ===
          id
        ) {
          clearCategoryForm();
        }

        alert(
          "تم حذف القسم بنجاح ✅"
        );
      } catch (error) {
        console.error(
          "Delete Category Error:",
          error
        );

        alert(
          error?.message ||
            "فشل حذف القسم"
        );
      }
    };

  // ==================================================
  // TOGGLE CATEGORY STATUS
  // ==================================================

  const toggleCategoryStatus =
    async (cat) => {
      if (!cat?.id) {
        return;
      }

      try {
        await editCategory(
          cat.id,
          {
            active:
              !Boolean(cat.active),
          }
        );

        await loadCategories();
      } catch (error) {
        console.error(
          "Category Status Error:",
          error
        );

        alert(
          "فشل تغيير حالة القسم"
        );
      }
    };

  // ==================================================
  // LOGOUT
  // ==================================================

  const handleLogout =
    async () => {
      try {
        await signOut(auth);

        navigate("/");
      } catch (error) {
        console.error(
          "Logout Error:",
          error
        );

        alert(
          "حدث خطأ أثناء تسجيل الخروج"
        );
      }
    };

  // ==================================================
  // CATEGORY DESCENDANT CHECK
  // ==================================================

  const isCategoryDescendant =
    (
      possibleChildId,
      categoryId
    ) => {
      if (
        !possibleChildId ||
        !categoryId
      ) {
        return false;
      }

      let currentId =
        possibleChildId;

      const visited =
        new Set();

      while (
        currentId &&
        !visited.has(currentId)
      ) {
        visited.add(
          currentId
        );

        const currentCategory =
          categories.find(
            (cat) =>
              cat.id ===
              currentId
          );

        if (
          !currentCategory
        ) {
          return false;
        }

        const parentId =
          currentCategory.parentId ||
          null;

        if (
          parentId ===
          categoryId
        ) {
          return true;
        }

        currentId =
          parentId;
      }

      return false;
    };

  // ==================================================
  // CATEGORY TREE OPTIONS
  // ==================================================

  const getCategoryTreeOptions =
    (
      parentId = null,
      level = 0,
      visited = new Set()
    ) => {
      let result = [];

      categories
        .filter((cat) => {
          const currentParentId =
            cat.parentId ||
            null;

          return (
            currentParentId ===
            parentId
          );
        })
        .forEach((cat) => {
          // Prevent circular data
          if (
            visited.has(cat.id)
          ) {
            return;
          }

          // Don't allow current category
          // to become its own parent
          if (
            cat.id ===
            editingCategoryId
          ) {
            return;
          }

          // Don't allow descendants
          // as parent
          if (
            editingCategoryId &&
            isCategoryDescendant(
              cat.id,
              editingCategoryId
            )
          ) {
            return;
          }

          result.push({
            ...cat,
            level,
          });

          const nextVisited =
            new Set(visited);

          nextVisited.add(
            cat.id
          );

          result = [
            ...result,
            ...getCategoryTreeOptions(
              cat.id,
              level + 1,
              nextVisited
            ),
          ];
        });

      return result;
    };

  // ==================================================
  // CATEGORY TREE
  // ==================================================

  const getCategoryTree =
    (
      parentId = null,
      level = 0,
      visited = new Set()
    ) => {
      let result = [];

      categories
        .filter((cat) => {
          const currentParentId =
            cat.parentId ||
            null;

          return (
            currentParentId ===
            parentId
          );
        })
        .forEach((cat) => {
          // Prevent circular data
          if (
            visited.has(cat.id)
          ) {
            return;
          }

          result.push({
            ...cat,
            level,
          });

          const nextVisited =
            new Set(visited);

          nextVisited.add(
            cat.id
          );

          result = [
            ...result,
            ...getCategoryTree(
              cat.id,
              level + 1,
              nextVisited
            ),
          ];
        });

      return result;
    };

  // ==================================================
  // MEMOIZED CATEGORY TREE
  // ==================================================

  const categoryTree =
    useMemo(() => {
      return getCategoryTree();
    }, [categories]);

  // ==================================================
  // MEMOIZED CATEGORY OPTIONS
  // ==================================================

  const categoryTreeOptions =
    useMemo(() => {
      return getCategoryTreeOptions();
    }, [
      categories,
      editingCategoryId,
    ]);

  // ==================================================
  // FORMAT DATE
  // ==================================================

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "غير مسجل";
    }

    try {
      let date;

      if (
        typeof value?.toDate ===
        "function"
      ) {
        date =
          value.toDate();
      } else if (
        typeof value?.seconds ===
        "number"
      ) {
        date =
          new Date(
            value.seconds *
              1000
          );
      } else if (
        value instanceof Date
      ) {
        date = value;
      } else {
        date =
          new Date(value);
      }

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "غير مسجل";
      }

      return date.toLocaleString(
        "ar-EG",
        {
          dateStyle:
            "medium",
          timeStyle:
            "short",
        }
      );
    } catch {
      return "غير مسجل";
    }
  };

  // ==================================================
  // USER NAME
  // ==================================================

  const getUserName = (
    user
  ) => {
    return (
      user?.name ||
      user?.displayName ||
      user?.fullName ||
      user?.email ||
      "مستخدم بدون اسم"
    );
  };

  // ==================================================
  // USER EMAIL
  // ==================================================

  const getUserEmail = (
    user
  ) => {
    return (
      user?.email ||
      "غير مسجل"
    );
  };

  // ==================================================
  // USER PHONE
  // ==================================================

  const getUserPhone = (
    user
  ) => {
    return (
      user?.phone ||
      "غير مسجل"
    );
  };

  // ==================================================
  // USER ADDRESS
  // ==================================================

  const getUserAddress = (
    user
  ) => {
    return (
      user?.address ||
      "غير مسجل"
    );
  };

  // ==================================================
  // LOGIN COUNT
  // ==================================================

  const getLoginCount = (
    user
  ) => {
    return (
      user?.loginCount ??
      user?.loginAttempts ??
      0
    );
  };

  // ==================================================
  // VISITS
  // ==================================================

  const getVisits = (
    user
  ) => {
    const visits =
      user?.visits ||
      user?.loginHistory ||
      [];

    return Array.isArray(
      visits
    )
      ? visits
      : [];
  };

  // ==================================================
  // SORTED USERS
  // ==================================================

  const sortedUsers = useMemo(() => {
    return [...users].sort(
      (a, b) =>
        getUserName(a).localeCompare(
          getUserName(b),
          "ar"
        )
    );
  }, [users]);

  // ==================================================
  // ORDER STATUS TEXT
  // ==================================================

  const getOrderStatusText =
    (status) => {
      switch (status) {
        case "done":
          return "تم التسليم";

        case "shipping":
          return "جاري الشحن";

        case "cancel":
          return "ملغي";

        default:
          return "جديد";
      }
    };

  // ==================================================
  // WHATSAPP
  // ==================================================

  const openWhatsApp = (
    phone
  ) => {
    let cleanPhone =
      String(
        phone || ""
      ).replace(
        /\D/g,
        ""
      );

    if (
      cleanPhone.startsWith("0")
    ) {
      cleanPhone =
        "20" +
        cleanPhone.slice(1);
    }

    if (!cleanPhone) {
      alert(
        "رقم الهاتف غير مسجل"
      );

      return;
    }

    window.open(
      `https://wa.me/${cleanPhone}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ==================================================
  // RETURN
  // ==================================================

  return (
    <div
      className="admin-container"
      dir="rtl"
    >

      {/* ==================================================
          NEW ORDER ALERT
      ================================================== */}

      {orders.length > 0 && (
        <div className="new-order-alert">

          <span>
            🔔 يوجد{" "}
            {orders.length}{" "}
            طلب
          </span>

          <button
            type="button"
            onClick={() =>
              setTab("orders")
            }
          >
            عرض الطلبات
          </button>

        </div>
      )}

      {/* ==================================================
          STATS
      ================================================== */}

      <div className="admin-stats">

        <div
          className="stat-card"
          onClick={() =>
            setTab("products")
          }
        >
          <h3>
            📦 المنتجات
          </h3>

          <p>
            {products.length}
          </p>
        </div>

        <div
          className="stat-card"
          onClick={() =>
            setTab("orders")
          }
        >
          <h3>
            🧾 الطلبات
          </h3>

          <p>
            {orders.length}
          </p>
        </div>

        <div
          className="stat-card"
          onClick={() =>
            setTab("categories")
          }
        >
          <h3>
            🗂️ الفئات
          </h3>

          <p>
            {categories.length}
          </p>
        </div>

        <div
          className="stat-card"
          onClick={() =>
            setTab("users")
          }
        >
          <h3>
            👥 الحسابات
          </h3>

          <p>
            {users.length}
          </p>
        </div>

        <div className="stat-card">
          <h3>
            💰 المبيعات
          </h3>

          <p>
            {totalSales.toLocaleString(
              "ar-EG"
            )}{" "}
            ج.م
          </p>
        </div>

      </div>

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="admin-top-bar">

        <h2>
          لوحة التحكم
        </h2>

        <div className="admin-actions">

          <button
            type="button"
            className="store-btn"
            onClick={() =>
              navigate("/")
            }
          >
            🛒 العودة للمتجر
          </button>

          <button
            type="button"
            className="logout-btn"
            onClick={
              handleLogout
            }
          >
            🚪 تسجيل خروج
          </button>

        </div>

      </div>

      {/* ==================================================
          TABS
      ================================================== */}

      <div className="admin-tabs">

        <button
          type="button"
          className={
            tab === "products"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("products")
          }
        >
          📦 المنتجات
        </button>

        <button
          type="button"
          className={
            tab === "orders"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("orders")
          }
        >
          🧾 الطلبات (
          {orders.length}
          )
        </button>

        <button
          type="button"
          className={
            tab === "categories"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("categories")
          }
        >
          🗂️ الأقسام
        </button>

        <button
          type="button"
          className={
            tab === "users"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("users")
          }
        >
          👥 الحسابات (
          {users.length}
          )
        </button>

      </div>

      {/* ==================================================
          PRODUCTS FORM
      ================================================== */}

      {tab === "products" && (
        <form
          className="admin-form"
          onSubmit={
            handleSubmit
          }
        >

          <input
            type="text"
            placeholder="اسم المنتج"
            value={title}
            onChange={(e) =>
              setTitle(
                e.target.value
              )
            }
          />

          <textarea
            placeholder="وصف المنتج"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
          />

          <div className="price-row">

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="السعر"
              value={price}
              onChange={(e) =>
                setPrice(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="السعر قبل الخصم"
              value={oldPrice}
              onChange={(e) =>
                setOldPrice(
                  e.target.value
                )
              }
            />

          </div>

          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
          >

            <option value="">
              اختر القسم
            </option>

            {categoryTreeOptions.map(
              (cat) => (
                <option
                  key={cat.id}
                  value={cat.id}
                >
                  {"— ".repeat(
                    cat.level
                  )}
                  {cat.icon
                    ? `${cat.icon} `
                    : ""}
                  {cat.name}
                </option>
              )
            )}

          </select>

          {/* ==================================================
              PRODUCT OPTIONS
          ================================================== */}

          <div className="product-options">

            <label>
              <input
                type="checkbox"
                checked={offer}
                onChange={(e) =>
                  setOffer(
                    e.target.checked
                  )
                }
              />
              🔥 عرض
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  bestSeller
                }
                onChange={(e) =>
                  setBestSeller(
                    e.target.checked
                  )
                }
              />
              ⭐ الأكثر مبيعاً
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  newArrival
                }
                onChange={(e) =>
                  setNewArrival(
                    e.target.checked
                  )
                }
              />
              🆕 جديد
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  recommended
                }
                onChange={(e) =>
                  setRecommended(
                    e.target.checked
                  )
                }
              />
              ❤️ مميز
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  hasVariants
                }
                onChange={(e) =>
                  setHasVariants(
                    e.target.checked
                  )
                }
              />
              🔀 المنتج له متغيرات
            </label>

          </div>

          {/* ==================================================
              VARIANTS
          ================================================== */}

          {hasVariants && (
            <div className="variants-box">

              <h3>
                🔀 متغيرات المنتج
              </h3>

              {variants.length ===
                0 && (
                <p>
                  لم تتم إضافة متغيرات بعد.
                </p>
              )}

              {variants.map(
                (variant) => (
                  <div
                    className="variant-row"
                    key={
                      variant.id
                    }
                  >

                    <input
                      type="text"
                      placeholder="اسم المتغير"
                      value={
                        variant.name ||
                        ""
                      }
                      onChange={(e) =>
                        updateVariant(
                          variant.id,
                          "name",
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="السعر"
                      value={
                        variant.price ??
                        ""
                      }
                      onChange={(e) =>
                        updateVariant(
                          variant.id,
                          "price",
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="السعر قبل الخصم"
                      value={
                        variant.oldPrice ??
                        ""
                      }
                      onChange={(e) =>
                        updateVariant(
                          variant.id,
                          "oldPrice",
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="number"
                      min="0"
                      placeholder="المخزون"
                      value={
                        variant.stock ??
                        ""
                      }
                      onChange={(e) =>
                        updateVariant(
                          variant.id,
                          "stock",
                          e.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() =>
                        removeVariant(
                          variant.id
                        )
                      }
                    >
                      🗑 حذف
                    </button>

                  </div>
                )
              )}

              <button
                type="button"
                className="add-variant-btn"
                onClick={
                  addVariant
                }
              >
                ➕ إضافة متغير
              </button>

            </div>
          )}

          {/* ==================================================
              RATING / STOCK
          ================================================== */}

          <div className="price-row">

            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              placeholder="التقييم"
              value={rating}
              onChange={(e) =>
                setRating(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              min="0"
              placeholder="المخزون"
              value={stock}
              onChange={(e) =>
                setStock(
                  e.target.value
                )
              }
            />

          </div>

          {/* ==================================================
              IMAGES
          ================================================== */}

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={
              handleImageUpload
            }
          />

          {images.length > 1 && (
            <div className="image-preview-grid">

              {images.map(
                (img, index) => (
                  <img
                    key={index}
                    src={img}
                    className="img-preview"
                    alt={`preview-${index}`}
                  />
                )
              )}

            </div>
          )}

          {image &&
            images.length <= 1 && (
              <img
                src={image}
                className="img-preview"
                alt="preview"
              />
            )}

          {/* ==================================================
              FORM ACTIONS
          ================================================== */}

          <div className="admin-form-actions">

            <button
              type="submit"
              className="save-btn"
              disabled={
                savingProduct
              }
            >
              {savingProduct
                ? "⏳ جاري الحفظ..."
                : editingId
                ? "💾 حفظ التعديل"
                : "➕ إضافة المنتج"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-btn"
                onClick={
                  clearForm
                }
                disabled={
                  savingProduct
                }
              >
                ❌ إلغاء التعديل
              </button>
            )}

          </div>

        </form>
      )}

      {/* ==================================================
          CATEGORY FORM
      ================================================== */}

      {tab === "categories" && (
        <div className="category-box">

          <h2>
            🗂️ إدارة الأقسام
          </h2>

          <input
            placeholder="اسم القسم"
            value={
              categoryName
            }
            onChange={(e) =>
              setCategoryName(
                e.target.value
              )
            }
          />

          <select
            value={
              categoryParentId
            }
            onChange={(e) =>
              setCategoryParentId(
                e.target.value
              )
            }
          >

            <option value="">
              📁 قسم رئيسي
            </option>

            {categoryTreeOptions.map(
              (cat) => (
                <option
                  key={cat.id}
                  value={cat.id}
                >
                  {"— ".repeat(
                    cat.level
                  )}
                  {cat.icon
                    ? `${cat.icon} `
                    : ""}
                  {cat.name}
                </option>
              )
            )}

          </select>

          <input
            placeholder="أيقونة القسم - مثال: 📱"
            value={
              categoryIcon
            }
            onChange={(e) =>
              setCategoryIcon(
                e.target.value
              )
            }
          />

          <input
            type="file"
            accept="image/*"
            onChange={
              handleCategoryImageUpload
            }
          />

          {categoryImage && (
            <img
              src={
                categoryImage
              }
              className="category-img-preview"
              alt="category"
            />
          )}

          <div className="admin-form-actions">

            <button
              type="button"
              onClick={
                saveCategory
              }
              className="save-btn"
              disabled={
                savingCategory
              }
            >
              {savingCategory
                ? "⏳ جاري الحفظ..."
                : editingCategoryId
                ? "💾 حفظ التعديل"
                : "➕ إضافة قسم"}
            </button>

            {editingCategoryId && (
              <button
                type="button"
                className="cancel-btn"
                onClick={
                  clearCategoryForm
                }
                disabled={
                  savingCategory
                }
              >
                ❌ إلغاء التعديل
              </button>
            )}

          </div>

        </div>
      )}

      {/* ==================================================
          PRODUCTS TABLE
      ================================================== */}

      {tab === "products" && (
        <div className="table-container">

          <h2>
            📦 قائمة المنتجات
          </h2>

          <div className="table-scroll">

            <table className="admin-table">

              <thead>
                <tr>

                  <th>
                    الصورة
                  </th>

                  <th>
                    الاسم
                  </th>

                  <th>
                    السعر
                  </th>

                  <th>
                    القسم
                  </th>

                  <th>
                    الحالة
                  </th>

                  <th>
                    المخزون
                  </th>

                  <th>
                    الإجراءات
                  </th>

                </tr>
              </thead>

              <tbody>

                {products.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="7"
                    >
                      لا توجد منتجات
                    </td>
                  </tr>
                ) : (
                  products.map(
                    (product) => (
                      <tr
                        key={
                          product.id
                        }
                      >

                        <td>
                          <img
                            src={
                              product.image ||
                              "https://via.placeholder.com/80"
                            }
                            className="table-img"
                            alt={
                              product.title ||
                              "منتج"
                            }
                          />
                        </td>

                        <td>
                          {
                            product.title
                          }
                        </td>

                        <td>
                          {
                            product.price
                          }{" "}
                          ج.م
                        </td>

                        <td>
                          {
                            categoryMap[
                              product.categoryId
                            ]?.name ||
                              product.category ||
                              "بدون قسم"
                          }
                        </td>

                        <td>

                          {product.offer && (
                            <div>
                              🔥 عرض
                            </div>
                          )}

                          {product.bestSeller && (
                            <div>
                              ⭐ الأكثر مبيعاً
                            </div>
                          )}

                          {product.newArrival && (
                            <div>
                              🆕 جديد
                            </div>
                          )}

                          {product.recommended && (
                            <div>
                              ❤️ مميز
                            </div>
                          )}

                          {product.hasVariants && (
                            <div>
                              🔀 متغيرات
                            </div>
                          )}

                          {!product.offer &&
                            !product.bestSeller &&
                            !product.newArrival &&
                            !product.recommended &&
                            !product.hasVariants && (
                              <div>
                                عادي
                              </div>
                            )}

                        </td>

                        <td>
                          {
                            product.stock ??
                            0
                          }
                        </td>

                        <td>

                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() =>
                              handleEdit(
                                product
                              )
                            }
                          >
                            ✏️ تعديل
                          </button>

                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() =>
                              handleDelete(
                                product.id
                              )
                            }
                          >
                            🗑 حذف
                          </button>

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* ==================================================
          ORDERS TABLE
      ================================================== */}

      {tab === "orders" && (
        <div className="table-container">

          <h2>
            🧾 الطلبات
          </h2>

          <div className="table-scroll">

            <table className="admin-table">

              <thead>
                <tr>

                  <th>
                    العميل
                  </th>

                  <th>
                    الهاتف
                  </th>

                  <th>
                    العنوان
                  </th>

                  <th>
                    المنتجات
                  </th>

                  <th>
                    الإجمالي
                  </th>

                  <th>
                    الحالة
                  </th>

                  <th>
                    واتساب
                  </th>

                </tr>
              </thead>

              <tbody>

                {orders.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="7"
                    >
                      لا توجد طلبات
                    </td>
                  </tr>
                ) : (
                  orders.map(
                    (order) => (
                      <tr
                        key={
                          order.id
                        }
                      >

                        <td>
                          {
                            order.customerName ||
                            "غير مسجل"
                          }
                        </td>

                        <td dir="ltr">
                          {
                            order.phone ||
                            "غير مسجل"
                          }
                        </td>

                        <td>
                          {
                            order.address ||
                            "غير مسجل"
                          }
                        </td>

                        <td>
                          {Array.isArray(
                            order.products
                          ) &&
                            order.products.map(
                              (
                                item,
                                index
                              ) => (
                                <div
                                  key={
                                    index
                                  }
                                >
                                  {
                                    item?.title ||
                                    item?.name ||
                                    "منتج"
                                  }

                                  {" × "}

                                  {
                                    item?.quantity ||
                                    1
                                  }
                                </div>
                              )
                            )}
                        </td>

                        <td>
                          {Number(
                            order.total ||
                              0
                          ).toLocaleString(
                            "ar-EG"
                          )}{" "}
                          ج.م
                        </td>

                        <td>

                          <select
                            value={
                              order.status ||
                              "pending"
                            }
                            onChange={(e) =>
                              changeOrderStatus(
                                order.id,
                                e.target.value
                              )
                            }
                          >

                            <option value="pending">
                              جديد
                            </option>

                            <option value="shipping">
                              جاري الشحن
                            </option>

                            <option value="done">
                              تم التسليم
                            </option>

                            <option value="cancel">
                              ملغي
                            </option>

                          </select>

                        </td>

                        <td>

                          <button
                            type="button"
                            className="whatsapp-btn"
                            onClick={() =>
                              openWhatsApp(
                                order.phone
                              )
                            }
                          >
                            💬 واتساب
                          </button>

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* ==================================================
          CATEGORIES TABLE
      ================================================== */}

      {tab === "categories" && (
        <div className="table-container">

          <h2>
            🗂️ الأقسام
          </h2>

          <div className="table-scroll">

            <table className="admin-table">

              <thead>
                <tr>

                  <th>
                    الصورة
                  </th>

                  <th>
                    الاسم
                  </th>

                  <th>
                    الحالة
                  </th>

                  <th>
                    الإجراءات
                  </th>

                </tr>
              </thead>

              <tbody>

                {categoryTree.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="4"
                    >
                      لا توجد أقسام
                    </td>
                  </tr>
                ) : (
                  categoryTree.map(
                    (cat) => (
                      <tr
                        key={
                          cat.id
                        }
                      >

                        <td>

                          {cat.image ? (
                            <img
                              src={
                                cat.image
                              }
                              className="category-img"
                              alt={
                                cat.name
                              }
                            />
                          ) : (
                            cat.icon ||
                            "📁"
                          )}

                        </td>

                        <td>

                          <div className="category-tree-name">

                            <span className="category-level">
                              {"— ".repeat(
                                cat.level
                              )}
                            </span>

                            <span>
                              {cat.icon
                                ? `${cat.icon} `
                                : ""}

                              {
                                cat.name
                              }
                            </span>

                          </div>

                        </td>

                        <td>

                          <button
                            type="button"
                            className={
                              cat.active
                                ? "active-btn"
                                : "inactive-btn"
                            }
                            onClick={() =>
                              toggleCategoryStatus(
                                cat
                              )
                            }
                          >
                            {cat.active
                              ? "مفعلة ✅"
                              : "موقوفة ❌"}
                          </button>

                        </td>

                        <td>

                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() =>
                              handleEditCategory(
                                cat
                              )
                            }
                          >
                            ✏️ تعديل
                          </button>

                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() =>
                              handleDeleteCategory(
                                cat.id
                              )
                            }
                          >
                            🗑 حذف
                          </button>

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* ==================================================
          USERS / ACCOUNTS
      ================================================== */}

      {tab === "users" && (
        <div className="table-container accounts-container">

          <div className="accounts-header">

            <div>

              <h2>
                👥 حسابات العملاء
              </h2>

              <p>
                إجمالي الحسابات:
                {" "}
                <strong>
                  {users.length}
                </strong>
              </p>

            </div>

          </div>

          {!showUserDetails && (
            <div className="accounts-list">

              {sortedUsers.length ===
              0 ? (
                <div className="empty-state">

                  <div>
                    👥
                  </div>

                  <h3>
                    لا يوجد حسابات
                  </h3>

                  <p>
                    لم يتم تسجيل أي
                    حسابات حتى الآن.
                  </p>

                </div>
              ) : (
                sortedUsers.map(
                  (user) => {

                    const userOrders =
                      getOrdersForUser(
                        user.id
                      );

                    return (
                      <button
                        type="button"
                        className="account-list-item"
                        key={
                          user.id
                        }
                        onClick={() =>
                          openUserDetails(
                            user
                          )
                        }
                      >

                        <div className="account-avatar">
                          👤
                        </div>

                        <div className="account-list-info">

                          <h3>
                            {
                              getUserName(
                                user
                              )
                            }
                          </h3>

                          <p>
                            {
                              getUserEmail(
                                user
                              )
                            }
                          </p>

                        </div>

                        <div className="account-list-meta">

                          <span>
                            📦{" "}
                            {
                              userOrders.length
                            }{" "}
                            طلب
                          </span>

                          <span>
                            🔐{" "}
                            {
                              getLoginCount(
                                user
                              )
                            }{" "}
                            دخول
                          </span>

                        </div>

                        <div className="account-arrow">
                          ←
                        </div>

                      </button>
                    );
                  }
                )
              )}

            </div>
          )}

          {/* ==================================================
              USER DETAILS
          ================================================== */}

          {showUserDetails &&
            selectedUser && (
              <div className="account-details">

                <button
                  type="button"
                  className="account-back-button"
                  onClick={
                    closeUserDetails
                  }
                >
                  → رجوع للحسابات
                </button>

                {/* PROFILE */}

                <div className="account-profile-card">

                  <div className="account-profile-avatar">
                    👤
                  </div>

                  <div>

                    <h2>
                      {
                        getUserName(
                          selectedUser
                        )
                      }
                    </h2>

                    <p>
                      {
                        getUserEmail(
                          selectedUser
                        )
                      }
                    </p>

                  </div>

                </div>

                {/* PERSONAL DATA */}

                <div className="account-info-card">

                  <h3>
                    👤 البيانات الشخصية
                  </h3>

                  <div className="account-info-grid">

                    <div>
                      <span>
                        الاسم
                      </span>

                      <strong>
                        {
                          getUserName(
                            selectedUser
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        البريد الإلكتروني
                      </span>

                      <strong dir="ltr">
                        {
                          getUserEmail(
                            selectedUser
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        رقم الهاتف
                      </span>

                      <strong dir="ltr">
                        {
                          getUserPhone(
                            selectedUser
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        العنوان
                      </span>

                      <strong>
                        {
                          getUserAddress(
                            selectedUser
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        تاريخ التسجيل
                      </span>

                      <strong>
                        {
                          formatDate(
                            selectedUser.createdAt ||
                              selectedUser.registeredAt ||
                              selectedUser.createdDate
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        آخر دخول
                      </span>

                      <strong>
                        {
                          formatDate(
                            selectedUser.lastLoginAt ||
                              selectedUser.lastLogin
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        عدد مرات الدخول
                      </span>

                      <strong>
                        {
                          getLoginCount(
                            selectedUser
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        عدد الطلبات
                      </span>

                      <strong>
                        {
                          selectedUserOrders.length
                        }
                      </strong>
                    </div>

                  </div>

                </div>

                {/* VISITS */}

                <div className="account-info-card">

                  <h3>
                    🕐 سجل الزيارات والدخول
                  </h3>

                  {getVisits(
                    selectedUser
                  ).length === 0 ? (
                    <div className="account-empty-history">
                      لا يوجد سجل زيارات
                      مسجل لهذا الحساب.
                    </div>
                  ) : (
                    <div className="account-visits-list">

                      {[
                        ...getVisits(
                          selectedUser
                        ),
                      ]
                        .reverse()
                        .map(
                          (
                            visit,
                            index
                          ) => (
                            <div
                              className="account-visit-item"
                              key={
                                index
                              }
                            >

                              <span className="visit-icon">
                                🕐
                              </span>

                              <div>

                                <strong>
                                  {formatDate(
                                    visit?.date ||
                                      visit?.visitedAt ||
                                      visit?.loginAt ||
                                      visit
                                  )}
                                </strong>

                                {visit?.type && (
                                  <small>
                                    {
                                      visit.type
                                    }
                                  </small>
                                )}

                              </div>

                            </div>
                          )
                        )}

                    </div>
                  )}

                </div>

                {/* USER ORDERS */}

                <div className="account-info-card">

                  <h3>
                    🧾 طلبات العميل
                  </h3>

                  {selectedUserOrders.length ===
                  0 ? (
                    <div className="account-empty-history">
                      هذا العميل لم يقم
                      بعمل أي طلبات حتى الآن.
                    </div>
                  ) : (
                    <div className="user-orders-list">

                      {selectedUserOrders.map(
                        (order) => (
                          <div
                            className="user-order-card"
                            key={
                              order.id
                            }
                          >

                            <div className="user-order-header">

                              <strong>
                                طلب #
                                {order.id.slice(
                                  0,
                                  8
                                )}
                              </strong>

                              <span>
                                {
                                  formatDate(
                                    order.createdAt
                                  )
                                }
                              </span>

                            </div>

                            <div className="user-order-products">

                              {Array.isArray(
                                order.products
                              ) &&
                                order.products.map(
                                  (
                                    item,
                                    index
                                  ) => (
                                    <div
                                      key={
                                        index
                                      }
                                    >

                                      <span>
                                        {
                                          item?.title ||
                                          item?.name ||
                                          "منتج"
                                        }
                                      </span>

                                      <span>
                                        ×{" "}
                                        {
                                          item?.quantity ||
                                          1
                                        }
                                      </span>

                                    </div>
                                  )
                                )}

                            </div>

                            <div className="user-order-footer">

                              <strong>
                                الإجمالي:
                                {" "}
                                {Number(
                                  order.total ||
                                    0
                                ).toLocaleString(
                                  "ar-EG"
                                )}{" "}
                                ج.م
                              </strong>

                              <span
                                className={`order-status status-${
                                  order.status ||
                                  "pending"
                                }`}
                              >
                                {getOrderStatusText(
                                  order.status
                                )}
                              </span>

                            </div>

                          </div>
                        )
                      )}

                    </div>
                  )}

                </div>

              </div>
            )}

        </div>
      )}

    </div>
  );
}


export default Admin;