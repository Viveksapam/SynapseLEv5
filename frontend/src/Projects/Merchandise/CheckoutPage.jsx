import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { postCreateRazorpayOrder, postVerifyRazorpaySignature } from '../../api/paymentApi';
import { CreditCard, AlertCircle, ShieldCheck } from 'lucide-react';
import CheckoutSuccess from './CheckoutSuccess';
import './CheckoutPage.css';

const buildRazorpayOptions = (objOrder, objUser, strToken, setSuccess, setError) => ({
  key: objOrder.strKeyId,
  amount: objOrder.numAmount * 100,
  currency: 'INR',
  name: 'Synapse Live Exchange',
  description: 'Test Transaction',
  order_id: objOrder.strOrderId,
  handler: async (objResponse) => {
    try {
      await postVerifyRazorpaySignature(objResponse, strToken);
      setSuccess(objResponse.razorpay_order_id);
    } catch (objErr) {
      setError(objErr.message || 'Payment verification failed.');
    }
  },
  prefill: {
    name: objUser?.username || 'Guest',
    email: objUser?.email || 'guest@example.com',
    contact: '9999999999',
  },
  notes: { address: 'Synapse Corporate Office' },
  theme: { color: '#8b5cf6' },
});

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load payment SDK.'));
    document.body.appendChild(script);
  });

const CheckoutPage = () => {
  const { boolIsLoggedInState, strTokenState, objUserState } = useAuth();
  const [strAmountState, setStrAmountState] = useState('500');
  const [boolIsLoadingState, setBoolIsLoadingState] = useState(false);
  const [strErrorMsgState, setStrErrorMsgState] = useState('');
  const [strSuccessOrderIdState, setStrSuccessOrderIdState] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    setStrErrorMsgState('');

    if (!boolIsLoggedInState || !strTokenState) {
      setStrErrorMsgState('You must be logged in to make a payment.');
      return;
    }
    const numAmount = parseFloat(strAmountState);
    if (isNaN(numAmount) || numAmount <= 0) {
      setStrErrorMsgState('Please enter a valid amount.');
      return;
    }

    setBoolIsLoadingState(true);
    try {
      await loadRazorpayScript();
      const objOrder = await postCreateRazorpayOrder(numAmount, strTokenState);
      const objOptions = buildRazorpayOptions(
        objOrder, objUserState, strTokenState,
        setStrSuccessOrderIdState, setStrErrorMsgState
      );
      const objRzp = new window.Razorpay(objOptions);
      objRzp.on('payment.failed', (objResponse) => {
        setStrErrorMsgState(`Payment Failed: ${objResponse.error.description}`);
      });
      objRzp.open();
    } catch (objErr) {
      setStrErrorMsgState(objErr.message || 'Failed to initiate checkout.');
    } finally {
      setBoolIsLoadingState(false);
    }
  };

  if (strSuccessOrderIdState) return <CheckoutSuccess strOrderId={strSuccessOrderIdState} />;

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <div className="checkout-header">
          <div className="checkout-icon"><CreditCard size={32} /></div>
          <h2>Secure Checkout</h2>
          <p>Powered by Razorpay</p>
        </div>

        {!boolIsLoggedInState ? (
          <div className="checkout-alert">
            <AlertCircle size={20} />
            <span>Please log in using the navigation bar to proceed with checkout.</span>
          </div>
        ) : (
          <form className="checkout-form" onSubmit={handlePayment}>
            {strErrorMsgState && (
              <div className="checkout-error">
                <AlertCircle size={16} />
                <span>{strErrorMsgState}</span>
              </div>
            )}

            <div className="input-group">
              <label>Amount (INR)</label>
              <div className="amount-input-wrapper">
                <span className="currency-symbol">₹</span>
                <input
                  type="number" value={strAmountState}
                  onChange={(e) => setStrAmountState(e.target.value)}
                  min="1" step="1" required
                />
              </div>
            </div>

            <div className="checkout-summary">
              <div className="summary-row"><span>Subtotal</span><span>₹{strAmountState || '0'}</span></div>
              <div className="summary-row"><span>Tax</span><span>₹0</span></div>
              <div className="summary-row total"><span>Total</span><span>₹{strAmountState || '0'}</span></div>
            </div>

            <button type="submit" className="checkout-btn" disabled={boolIsLoadingState || !strAmountState}>
              {boolIsLoadingState ? 'Processing...' : `Pay ₹${strAmountState || '0'}`}
            </button>

            <div className="checkout-trust">
              <ShieldCheck size={16} />
              <span>256-bit SSL encrypted secure transaction</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
