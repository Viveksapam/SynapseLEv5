import React from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function ProductModal({ objSelectedProduct, onClose }) {
  const navigate = useNavigate();

  if (!objSelectedProduct) return null;

  const handleBrowseShop = () => {
    onClose();
    navigate('/shop');
  };

  return (
    <div className="portfolio-modal-overlay" onClick={onClose}>
      <div className="portfolio-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '40rem' }}>
        
        {/* Modal Header */}
        <div className="portfolio-modal-header" style={{ borderTop: `4px solid var(--accent-primary)` }}>
          <div className="portfolio-modal-header-left">
            <div className="portfolio-icon-box" style={{ background: 'var(--theme-light)', color: 'var(--accent-primary)' }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <h4 className="portfolio-card-title">{objSelectedProduct.strName}</h4>
              <p className="portfolio-modal-meta-title">Exclusive Apparel</p>
            </div>
          </div>
          <button onClick={onClose} className="portfolio-close-button">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="portfolio-modal-body" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            
            <div style={{ width: '100%', maxWidth: '300px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
              <img 
                src={objSelectedProduct.strImageUrl} 
                alt={objSelectedProduct.strName} 
                style={{ width: '100%', height: 'auto', display: 'block' }} 
              />
            </div>

            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 12px 0' }}>
                {objSelectedProduct.strName}
              </h2>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)', margin: '0 0 20px 0' }}>
                ₹{objSelectedProduct.numPrice}
              </p>
              
              <div style={{ 
                background: 'var(--bg-main)', 
                padding: '20px', 
                borderRadius: '12px', 
                color: 'var(--text-muted)', 
                fontSize: '1.05rem', 
                lineHeight: 1.6,
                border: '1px solid var(--border-light)'
              }}>
                {objSelectedProduct.strDescription || "Premium quality developer gear designed for comfort and code."}
              </div>
            </div>
            
          </div>
        </div>

        {/* Modal Footer */}
        <div className="portfolio-modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ color: objSelectedProduct.boolIsAvailable ? 'var(--accent-primary)' : 'red', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
            {objSelectedProduct.boolIsAvailable ? 'In Stock - Ready to Ship' : 'Currently Sold Out'}
          </span>
          <button onClick={handleBrowseShop} className="portfolio-close-footer-button">
            Go to Shop
          </button>
        </div>

      </div>
    </div>
  );
}

export default ProductModal;

