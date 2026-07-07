import React from 'react';
import { X, Trash2, Plus, Minus } from 'lucide-react';

/**
 * CartDrawer renders the slide-out shopping cart sidebar with details and simulated checkout.
 */
function CartDrawer({ 
  arrCart, 
  boolIsOpen, 
  handleClose, 
  handleUpdateQty, 
  handleRemove, 
  handleCheckout 
}) {
  const numTotal = arrCart.reduce((acc, curr) => acc + (curr.numPrice * curr.numQuantity), 0);

  if (!boolIsOpen) return null;

  return (
    <div className="cart-overlay">
      <div className="cart-drawer">
        <div className="cart-header">
          <h2>Shopping Cart ({arrCart.length})</h2>
          <button className="btn-close-cart" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className="cart-items">
          {arrCart.length === 0 ? (
            <div className="cart-empty">
              <p>Your cart is empty.</p>
            </div>
          ) : (
            arrCart.map((objItem) => (
              <div key={objItem.id} className="cart-item">
                <img src={objItem.strImage} alt={objItem.strName} className="cart-item-img" />
                <div className="cart-item-details">
                  <h4>{objItem.strName}</h4>
                  <p className="cart-item-price">₹{objItem.numPrice}</p>
                  <div className="cart-item-qty-actions">
                    <button onClick={() => handleUpdateQty(objItem.id, -1)} disabled={objItem.numQuantity <= 1}>
                      <Minus size={14} />
                    </button>
                    <span>{objItem.numQuantity}</span>
                    <button onClick={() => handleUpdateQty(objItem.id, 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <button className="btn-remove-item" onClick={() => handleRemove(objItem.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {arrCart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total Amount:</span>
              <span>₹{numTotal}</span>
            </div>
            <button className="btn-checkout" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartDrawer;

