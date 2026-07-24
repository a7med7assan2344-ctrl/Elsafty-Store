import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar/Navbar';
import Store from './components/Store/Store';
import Admin from './components/Admin/Admin';
import Cart from './components/Cart/Cart';
import Checkout from './components/Checkout/Checkout';
import initialProducts from './data/products';
import './App.css';

function App() {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('amazon_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [cart, setCart] = useState([]);
  const [currentView, setCurrentView] = useState('store'); // store, admin, cart, checkout
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    localStorage.setItem('amazon_products', JSON.stringify(products));
  }, [products]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  return (
    <div className="app">
      <Navbar 
        setCurrentView={setCurrentView} 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <main className="main-content">
        {currentView === 'store' && (
          <Store 
            products={products}
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            addToCart={addToCart}
          />
        )}

        {currentView === 'admin' && (
          <Admin 
            products={products}
            setProducts={setProducts}
          />
        )}

        {currentView === 'cart' && (
          <Cart 
            cart={cart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'checkout' && (
          <Checkout 
            cart={cart}
            setCart={setCart}
            setCurrentView={setCurrentView}
          />
        )}
      </main>
    </div>
  );
}

export default App;