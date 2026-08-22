// قاعدة بيانات المنتجات (يمكنك تعديلها وإضافة ما تحب بحرية)
const products = [
    { id: 1, name: "سماعات بلوتوث لاسلكية", price: 450, category: "electronics", image: "https://via.placeholder.com/150" },
    { id: 2, name: "هاتف ذكي حديث", price: 5500, category: "electronics", image: "https://via.placeholder.com/150" },
    { id: 3, name: "تيشيرت رجالي قطن", price: 150, category: "clothes", image: "https://via.placeholder.com/150" }
];

let cart = [];

// عرض المنتجات في الشاشة
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
}

// تحديث محتوى السلة
function updateCartModal() {
    const cartItemsContainer = document.getElementById("cart-items");
    cartItemsContainer.innerHTML = "";
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        cartItemsContainer.innerHTML += `<p>${item.name} - ${item.price} جنيه</p>`;
    });
    document.getElementById("total-price").innerText = total;
}

// فتح وإغلاق السلة
function toggleCart() {
    const modal = document.getElementById("cart-modal");
    modal.classList.toggle("hidden");
}

// الربط الفعلي بواتساب لإرسال الأوردر


    // ضع رقم واتساب الخاص بك هنا (متبوعاً برمز الدولة، مثال لمصر: 201xxxxxxxxx)
    const myWhatsAppNumber = "201000000000"; 

    let message = "مرحباً، أريد طلب المنتجات التالية:%0A";
    let total = 0;

    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} - ${item.price} جنيه%0A`;
        total += item.price;
    });

    message += `%0Aالإجمالي الكلي: ${total} جنيه`;

    // فتح واتساب مباشرة برسالة الأوردر الجاهزة
    window.open(`https://wa.me/${myWhatsAppNumber}?text=${message}`, '_blank');
}

// تشغيل عرض المنتجات عند فتح الصفحة
displayProducts(products);