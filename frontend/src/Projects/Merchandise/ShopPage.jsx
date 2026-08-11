import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductGrid from './ProductGrid';
import CartDrawer from './CartDrawer';
import SEO from '../../components/SEO';
import { postCreateRazorpayOrder, postVerifyRazorpaySignature } from '../../api/paymentApi';
import { fetchProductList } from '../../api/productApi';
import { useAuth } from '../../hooks/useAuth';
import './ShopPage.css';

function ShopPage() {
  const navigate = useNavigate();
  const { boolIsLoggedInState, strTokenState, objUserState } = useAuth();
  
  const [arrProductsState, setArrProductsState] = useState([]);
  const [boolIsLoadingState, setBoolIsLoadingState] = useState(true);
  const [strCategoryState, setStrCategoryState] = useState('All');
  const [arrCartState, setArrCartState] = useState([]);
  const [boolCartOpenState, setBoolCartOpenState] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      const res = await fetchProductList();
      if (res.data) setArrProductsState(res.data);
      setBoolIsLoadingState(false);
    };
    loadProducts();
  }, []);

  const handleAddToCart = (objItem) => {
    setArrCartState((prev) => {
      const objExist = prev.find((i) => i.id === objItem.id);
      if (objExist) {
        return prev.map((i) => i.id === objItem.id ? { ...i, numQuantity: i.numQuantity + 1 } : i);
      }
      return [...prev, { ...objItem, numQuantity: 1 }];
    });
    setBoolCartOpenState(true);
  };

  const handleUpdateQty = (itemId, numChange) => {
    setArrCartState((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, numQuantity: i.numQuantity + numChange } : i))
    );
  };

  const handleRemoveItem = (itemId) => {
    setArrCartState((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleCheckout = async () => {
    if (!boolIsLoggedInState || !strTokenState) {
      alert('You must be logged in to checkout.');
      return;
    }

    const numTotal = arrCartState.reduce((acc, curr) => acc + (curr.numPrice * curr.numQuantity), 0);
    try {
      
      const objData = await postCreateRazorpayOrder(arrCartState, strTokenState);

      const objOptions = {
        key: objData.strKeyId,
        amount: objData.numAmount * 100,
        currency: 'INR',
        name: 'Synapse Apparel Store',
        description: 'Apparel & Merchandise Order',
        order_id: objData.strOrderId,
        handler: async function (response) {
          try {
            
            await postVerifyRazorpaySignature(response, strTokenState);
            alert('Payment Successful! Order placed.');
            setArrCartState([]);
            setBoolCartOpenState(false);
          } catch (verifyErr) {
            alert('Verification failed: ' + verifyErr.message);
          }
        },
        prefill: { 
          name: objUserState?.username || 'Coder', 
          email: objUserState?.email || 'coder@example.com' 
        },
        theme: { color: '#f43f5e' }
      };
      
      const rzp = new window.Razorpay(objOptions);
      rzp.on('payment.failed', function (response){
        alert(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      alert('Error initiating checkout: ' + err.message);
    }
  };

  return (
    <div className="shop-page-wrapper">
      <SEO 
        title="Synapse Store - Exclusive Apparel" 
        description="Premium quality developer gear designed for comfort and code. Shop exclusive Synapse merchandise."
      />
      <header className="shop-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Back to Home
        </button>
        <button className="btn-cart-toggle" onClick={() => setBoolCartOpenState(true)}>
          <ShoppingBag size={20} />
          {arrCartState.length > 0 && <span className="cart-badge">{arrCartState.reduce((a, b) => a + b.numQuantity, 0)}</span>}
        </button>
      </header>

      <main className="shop-content">
        <div className="shop-title-area">
          <h1 className="shop-title">Exclusive Apparel & Merchandise</h1>
          <div className="shop-filters">
            {['All', 'Apparel', 'Accessories', 'Memes', 'Comfort Wear'].map((cat) => (
              <button key={cat} className={`btn-filter ${strCategoryState === cat ? 'active' : ''}`} onClick={() => setStrCategoryState(cat)}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {boolIsLoadingState ? (
          <div className="shop-empty-state">
            <ShoppingBag className="shop-empty-state-icon" size={36} strokeWidth={1.5} />
            <p className="shop-empty-state-title">Loading the shop...</p>
          </div>
        ) : arrProductsState.length === 0 ? (
          <div className="shop-empty-state">
            <ShoppingBag className="shop-empty-state-icon" size={36} strokeWidth={1.5} />
            <p className="shop-empty-state-title">No merchandise available right now</p>
            <p className="shop-empty-state-desc">New gear is on the way — check back soon.</p>
          </div>
        ) : (
          <ProductGrid arrProducts={arrProductsState} strSelectedCategory={strCategoryState} handleAddToCart={handleAddToCart} />
        )}
      </main>

      <CartDrawer arrCart={arrCartState} boolIsOpen={boolCartOpenState} handleClose={() => setBoolCartOpenState(false)} handleUpdateQty={handleUpdateQty} handleRemove={handleRemoveItem} handleCheckout={handleCheckout} />
    </div>
  );
}

export default ShopPage;

