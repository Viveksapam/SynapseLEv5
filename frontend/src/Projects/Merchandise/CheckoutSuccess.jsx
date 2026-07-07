import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle } from 'lucide-react';

const CheckoutSuccess = ({ strOrderId }) => (
  <div className="checkout-page">
    <div className="checkout-card success-card">
      <div className="success-icon-wrapper">
        <CheckCircle size={64} color="#34d399" />
      </div>
      <h1>Payment Successful!</h1>
      <p>Thank you for your purchase.</p>
      <div className="order-details">
        <span>Order ID:</span>
        <strong>{strOrderId}</strong>
      </div>
      <button className="checkout-btn" onClick={() => { window.location.href = '/'; }}>
        Return Home
      </button>
    </div>
  </div>
);

CheckoutSuccess.propTypes = {
  strOrderId: PropTypes.string.isRequired,
};

export default CheckoutSuccess;
