import React from 'react';

/**
 * ProductGrid renders a filterable list of merchandise items.
 */
function ProductGrid({ arrProducts, strSelectedCategory, handleAddToCart }) {
  const arrFiltered = strSelectedCategory === 'All' 
    ? arrProducts 
    : arrProducts.filter(item => item.strCategory === strSelectedCategory);

  return (
    <div className="shop-grid">
      {arrFiltered.map((objProduct) => (
        <div key={objProduct.id} className="shop-card">
          <span className="shop-card-tag">{objProduct.strCategory}</span>
          <div className="shop-card-image">
            <img src={objProduct.strImage} alt={objProduct.strName} />
          </div>
          <div className="shop-card-info">
            <h3 className="shop-card-title">{objProduct.strName}</h3>
            <p className="shop-card-desc">{objProduct.strDescription}</p>
            <div className="shop-card-footer">
              <span className="shop-card-price">₹{objProduct.numPrice}</span>
              <button 
                className="btn-add-cart" 
                onClick={() => handleAddToCart(objProduct)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductGrid;

