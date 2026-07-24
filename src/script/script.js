// قاعدة بيانات المنتجات (يمكنك تعديل الأسماء، الأسعار، الروابط، والأقسام هنا بحرية)
const products = [
    { id: 1, name: "سماعات بلوتوث لاسلكية برو", price: 450, category: "electronics", image: "https://via.placeholder.com/150" },
    { id: 2, name: "هاتف ذكي حديث بشاشة أموليد", price: 5500, category: "electronics", image: "https://via.placeholder.com/150" },
    { id: 3, name: "تيشيرت رجالي قطن فاخر", price: 150, category: "clothes", image: "https://via.placeholder.com/150" },
    { id: 4, name: "ساعة يد ذكية سمارت", price: 750, category: "electronics", image: "https://via.placeholder.com/150" }
];

let cart = [];

// عرض المنتجات على الشاشة
function displayProducts(productsToDisplay) {
    const grid = document.getElementById("product-grid");
    grid.innerHTML = "";
    productsToDisplay.forEach(product => {
        grid.innerHTML += `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.price} جنيه</p>
                <button onclick="addToCart(${product.id})">إضافة للسلة</button>
            </div>
        `;
    });
}

// تصفية المنتجات حسب القسم (Category)
function filterProducts(category) {
    if (category === 'all') {
        displayProducts(products);
    } else {
        const filtered = products.filter(p => p.category === category);
        displayProducts(filtered);
    }
}

// إضافة منتج للسلة
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    cart.push(product);
    document.getElementById("cart-count").innerText = cart.length;
    updateCartModal();
    // فتح السلة تلقائياً عند إضافة منتج (اختياري)
    toggleCartOnAdd();
}

// تحديث محتوى نافذة السلة
function updateCartModal() {
    const cartItemsContainer = document.getElementById("cart-items");
    cartItemsContainer.innerHTML = "";
    let total = 0;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p style='text-align:center; color:#777;'>السلة فارغة حالياً</p>";
    }

    cart.forEach((item, index) => {
        total += item.price;
        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <span>${item.name}</span>
                <span><b>${item.price} جنيه</b></span>
            </div>
        `;
    });
    document.getElementById("total-price").innerText = total;
}

// إظهار وإخفاء نافذة السلة
function toggleCart() {
    const modal = document.getElementById("cart-modal");
    modal.classList.toggle("hidden");
}

let isCartOpen = false;
function toggleCartOnAdd() {
    const modal = document.getElementById("cart-modal");
    if (modal.classList.contains("hidden")) {
        modal.classList.remove("hidden");
    }
}

// إرسال الطلب عبر واتساب مع تفاصيل المنتجات
function sendToWhatsApp() {
    if (cart.length === 0) {
        alert("سلة المشتريات فارغة!");
        return;
    }

    // ضع رقم واتساب الخاص بك هنا (مثلاً بمصر: 201000000000 بدون علامة +)
    const myWhatsAppNumber = "201553570220"; 

    let message = "مرحباً، أريد طلب المنتجات التالية من *Elsafty Store*:%0A%0A";
    let total = 0;

    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} - *${item.price} جنيه*%0A`;
        total += item.price;
    });

    message += `%0A━━━━━━━━━━━━━━%0A*الإجمالي الكلي: ${total} جنيه*`;

    // فتح محادثة واتساب بالرسالة الجاهزة
    window.open(`https://wa.me/${myWhatsAppNumber}?text=${message}`, '_blank');
}

// تشغيل عرض المنتجات لأول مرة عند فتح الصفحة
displayProducts(products);