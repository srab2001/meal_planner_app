import React, { useState } from 'react';
import './PaymentPage.css';

const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

function PaymentPage({ user, onPaymentComplete, onLogout, selectedStores, preferences }) {
  const [discountCode, setDiscountCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [discountApplied, setDiscountApplied] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const PRICE = 9.99; // Base price in dollars

  const handleValidateCode = async () => {
    if (!discountCode.trim()) {
      setCodeError('Please enter a discount code');
      return;
    }

    setIsValidatingCode(true);
    setCodeError('');

    try {
      const response = await fetch(`${API_BASE}/api/validate-discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: discountCode.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setDiscountApplied(data);
        setCodeError('');
      } else {
        setCodeError(data.error || 'Invalid discount code');
        setDiscountApplied(null);
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      setCodeError('Failed to validate code. Please try again.');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);

    try {
      // If discount is 100%, skip payment and mark as complete
      if (discountApplied && discountApplied.percentOff === 100) {
        const response = await fetch(`${API_BASE}/api/apply-free-access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code: discountCode.trim() }),
        });

        if (response.ok) {
          onPaymentComplete();
          return;
        }
      }

      // For paid plans, create Stripe checkout session
      const response = await fetch(`${API_BASE}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          discountCode: discountApplied ? discountCode.trim() : null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const calculatePrice = () => {
    if (!discountApplied) return PRICE;

    if (discountApplied.percentOff === 100) return 0;

    if (discountApplied.percentOff) {
      return (PRICE * (1 - discountApplied.percentOff / 100)).toFixed(2);
    }

    if (discountApplied.amountOff) {
      return Math.max(0, PRICE - discountApplied.amountOff).toFixed(2);
    }

    return PRICE;
  };

  const finalPrice = calculatePrice();

  return (
    <div className="payment-page">
      <nav className="navbar">
        <h2>AI Meal Planner</h2>
        <div className="user-info">
          <img src={user.picture} alt={user.name} className="user-avatar" />
          <span>{user.name}</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="payment-container">
        <div className="payment-header">
          <h1>Get Your Personalized Meal Plan</h1>
          <p className="subtitle">One-time payment for a complete 7-day meal plan</p>
        </div>

        <div className="payment-content">
          <div className="plan-summary">
            <h2>Your Plan Includes:</h2>
            <ul className="features-list">
              <li>✅ 7-day personalized meal plan</li>
              <li>✅ Recipes tailored to your preferences</li>
              <li>✅ Complete shopping list with prices</li>
              <li>✅ Prep and cook times for each meal</li>
              <li>✅ Regenerate individual meals anytime</li>
              <li>✅ Print-friendly recipes and shopping list</li>
            </ul>

            <div className="preferences-summary">
              <h3>Based on your preferences:</h3>
              <div className="pref-item">
                <span className="pref-label">Cuisines:</span>
                <span className="pref-value">{preferences?.cuisines?.join(', ')}</span>
              </div>
              <div className="pref-item">
                <span className="pref-label">People:</span>
                <span className="pref-value">{preferences?.people}</span>
              </div>
              <div className="pref-item">
                <span className="pref-label">Meals:</span>
                <span className="pref-value">{preferences?.selectedMeals?.join(', ')}</span>
              </div>
              <div className="pref-item">
                <span className="pref-label">Store:</span>
                <span className="pref-value">
                  {selectedStores?.primaryStore?.name}
                  {selectedStores?.comparisonStore && ` vs ${selectedStores.comparisonStore.name}`}
                </span>
              </div>
            </div>
          </div>

          <div className="payment-form">
            <div className="pricing-section">
              <div className="price-display">
                {discountApplied && (
                  <div className="original-price">${PRICE}</div>
                )}
                <div className="final-price">
                  ${finalPrice}
                  {discountApplied && discountApplied.percentOff === 100 && (
                    <span className="free-badge">FREE</span>
                  )}
                </div>
                {discountApplied && discountApplied.percentOff !== 100 && (
                  <div className="discount-badge">
                    {discountApplied.percentOff}% OFF
                  </div>
                )}
              </div>
            </div>

            <div className="discount-section">
              <label htmlFor="discountCode">Have a discount code?</label>
              <div className="discount-input-group">
                <input
                  id="discountCode"
                  type="text"
                  className="discount-input"
                  placeholder="Enter code"
                  value={discountCode}
                  onChange={(e) => {
                    setDiscountCode(e.target.value.toUpperCase());
                    setCodeError('');
                  }}
                  disabled={isValidatingCode || discountApplied}
                />
                {!discountApplied && (
                  <button
                    className="validate-code-btn"
                    onClick={handleValidateCode}
                    disabled={isValidatingCode || !discountCode.trim()}
                  >
                    {isValidatingCode ? 'Validating...' : 'Apply'}
                  </button>
                )}
              </div>
              {codeError && <p className="code-error">{codeError}</p>}
              {discountApplied && (
                <div className="code-success">
                  ✅ Code "{discountCode}" applied!
                  {discountApplied.percentOff === 100
                    ? ' Your meal plan is FREE!'
                    : ` You save ${discountApplied.percentOff}%!`}
                </div>
              )}
            </div>

            <button
              className="payment-btn"
              onClick={handlePayment}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment
                ? 'Processing...'
                : finalPrice === 0
                  ? 'Get Free Meal Plan'
                  : `Pay $${finalPrice} - Get Meal Plan`}
            </button>

            <p className="payment-note">
              {finalPrice === 0
                ? 'Click to generate your free meal plan'
                : 'Secure payment powered by Stripe'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
