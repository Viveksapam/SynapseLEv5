import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

const MerchandiseSection = ({ arrProductsState, boolIsLoadingState }) => {
  if (!boolIsLoadingState && arrProductsState.length === 0) return null;

  return (
    <section className="ath-merch-section ath-reveal" id="merchandise">
      <div className="ath-merch-container">
        <div className="ath-merch-header">
          <div>
            <span className="ath-section-eyebrow">Shop</span>
            <h2 className="ath-section-title">SLE Merch</h2>
          </div>
          <Link to="/shop" className="ath-btn-outline">
            Browse Full Shop
          </Link>
        </div>

        {boolIsLoadingState ? (
          <div className="ath-empty-state">
            <ShoppingBag className="ath-empty-state-icon" size={32} strokeWidth={1.5} />
            <p className="ath-empty-state-title">Loading merchandise...</p>
          </div>
        ) : (
          <div className="ath-merch-grid">
            {arrProductsState.slice(0, 3).map((product) => (
              <Link
                key={product.id}
                to="/shop"
                className="ath-merch-card"
              >
                <div className="ath-merch-img-wrapper">
                  <img src={product.strImage} alt={product.strName} className="ath-merch-img" />
                  <span className="ath-merch-price">₹{product.numPrice}</span>
                </div>
                <div className="ath-merch-info">
                  <h3 className="ath-merch-title">{product.strName}</h3>
                  <p className="ath-merch-desc">{product.strDescription}</p>
                  <span className="ath-merch-action">
                    <span>INSPECT ITEM</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

MerchandiseSection.propTypes = {
  arrProductsState: PropTypes.array.isRequired,
  boolIsLoadingState: PropTypes.bool.isRequired
};

export default MerchandiseSection;
