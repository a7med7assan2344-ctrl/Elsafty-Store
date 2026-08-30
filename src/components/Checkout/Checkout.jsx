```css
/* ==========================================================
   ELSAFTY STORE - CHECKOUT
   Professional RTL Checkout
   Blue + Gold / Responsive
   ========================================================== */

.checkout-container {
  width: 100%;
  max-width: 820px;
  margin: 35px auto;
  padding: 30px;
  background: #ffffff;
  direction: rtl;
  border: 1px solid rgba(212, 175, 55, 0.55);
  border-radius: 22px;
  box-shadow:
    0 12px 35px rgba(7, 26, 54, 0.10),
    0 2px 8px rgba(7, 26, 54, 0.04);
  box-sizing: border-box;
}

/* ==========================================================
   NAVIGATION
   ========================================================== */

.checkout-navigation {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 28px;
}

.checkout-nav-btn {
  min-height: 48px;
  padding: 12px 18px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    opacity 0.2s ease;
}

.back-store-btn {
  border: 1px solid #0b1f3a;
  background: #0b1f3a;
  color: #ffffff;
}

.back-cart-btn {
  border: 1px solid #d4af37;
  background: #ffffff;
  color: #0b1f3a;
}

.checkout-nav-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 7px 18px rgba(7, 26, 54, 0.14);
}

.back-store-btn:hover:not(:disabled) {
  background: #071a36;
}

.back-cart-btn:hover:not(:disabled) {
  background: #fffdf5;
}

.checkout-nav-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ==========================================================
   HEADER
   ========================================================== */

.checkout-container h2 {
  margin: 0;
  text-align: center;
  color: #0b1f3a;
  font-size: 29px;
  font-weight: 900;
  line-height: 1.4;
}

.checkout-subtitle {
  margin: 8px 0 30px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
  line-height: 1.8;
}

/* ==========================================================
   FORM
   ========================================================== */

.checkout-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #071a36;
  font-size: 14px;
  font-weight: 800;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  min-height: 50px;
  padding: 13px 15px;
  box-sizing: border-box;

  border: 1px solid #d8dee8;
  border-radius: 11px;

  background: #ffffff;
  color: #071a36;

  font-family: inherit;
  font-size: 15px;

  outline: none;

  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;
}

.form-group textarea {
  min-height: 120px;
  line-height: 1.8;
  resize: vertical;
}

.form-group select {
  cursor: pointer;
  appearance: auto;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #94a3b8;
}

.form-group input:hover,
.form-group textarea:hover,
.form-group select:hover {
  border-color: #b9c3d1;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: #d4af37;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.14);
  background: #fffef9;
}

.form-group input:disabled,
.form-group textarea:disabled,
.form-group select:disabled {
  background: #f8fafc;
  cursor: not-allowed;
  opacity: 0.7;
}

/* ==========================================================
   PAYMENT METHODS
   ========================================================== */

.payment-method-section {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;

  background: #fbfcfe;
  border: 1px solid #e1e6ee;
  border-radius: 17px;
}

.payment-method-section h3 {
  margin: 0 0 15px;
  color: #0b1f3a;
  font-size: 19px;
  font-weight: 900;
}

.payment-methods {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
}

.payment-method-card {
  position: relative;

  display: flex;
  align-items: flex-start;
  gap: 12px;

  min-width: 0;
  padding: 17px;

  border: 1px solid #dce2ea;
  border-radius: 14px;

  background: #ffffff;

  cursor: pointer;

  box-sizing: border-box;

  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.payment-method-card:hover {
  transform: translateY(-2px);
  border-color: #d4af37;
  box-shadow: 0 6px 16px rgba(7, 26, 54, 0.08);
}

.payment-method-card.selected {
  border-color: #d4af37;
  background: #fffdf5;
  box-shadow:
    0 6px 18px rgba(212, 175, 55, 0.12),
    inset 0 0 0 1px rgba(212, 175, 55, 0.12);
}

.payment-method-card input[type="radio"] {
  width: 18px;
  height: 18px;
  margin: 3px 0 0;

  accent-color: #d4af37;

  flex-shrink: 0;
  cursor: pointer;
}

.payment-method-content {
  width: 100%;
  min-width: 0;
}

.payment-method-title {
  display: flex;
  align-items: center;
  gap: 9px;

  min-width: 0;

  color: #071a36;
}

.payment-method-title strong {
  font-size: 15px;
  font-weight: 900;
  line-height: 1.5;
}

.payment-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 34px;
  height: 34px;

  flex-shrink: 0;

  border-radius: 9px;

  background: #f1f5f9;

  font-size: 20px;
}

.payment-method-card.selected .payment-icon {
  background: #fff3bd;
}

.payment-method-content p {
  margin: 8px 0 0;

  color: #64748b;
  font-size: 12px;
  line-height: 1.7;
}

.payment-number {
  margin-top: 10px;

  color: #475569;
  font-size: 12px;

  direction: ltr;
  text-align: right;
}

.payment-number strong {
  color: #0b1f3a;
  font-size: 14px;
  letter-spacing: 0.3px;
}

.payment-notice {
  margin-top: 14px;
  padding: 14px 15px;

  border: 1px solid #e6c94c;
  border-radius: 12px;

  background: #fff9df;
  color: #6b5510;

  font-size: 13px;
  line-height: 1.8;
}

.payment-notice strong {
  color: #4d3b00;
}

/* ==========================================================
   COUPON
   ========================================================== */

.coupon-section {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;

  background: #f8fafc;
  border: 1px solid #e0e5ec;
  border-radius: 17px;
}

.coupon-section h3 {
  margin: 0 0 13px;

  color: #0b1f3a;
  font-size: 18px;
  font-weight: 900;
}

.coupon-input-row {
  display: flex;
  align-items: stretch;
  gap: 10px;
  width: 100%;
}

.coupon-input-row input {
  flex: 1;
  min-width: 0;

  padding: 13px 14px;

  border: 1px solid #d8dee8;
  border-radius: 10px;

  background: #ffffff;
  color: #071a36;

  font-family: inherit;
  font-size: 15px;
  font-weight: 800;

  outline: none;

  text-transform: uppercase;
  direction: ltr;
  text-align: left;

  box-sizing: border-box;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.coupon-input-row input::placeholder {
  color: #94a3b8;
  text-transform: none;
}

.coupon-input-row input:focus {
  border-color: #d4af37;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.13);
}

.coupon-input-row input:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.save-btn,
.cancel-btn {
  min-width: 120px;
  padding: 12px 18px;

  border-radius: 10px;

  font-family: inherit;
  font-size: 14px;
  font-weight: 900;

  cursor: pointer;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    opacity 0.2s ease;
}

.save-btn {
  border: 1px solid #0b1f3a;
  background: #0b1f3a;
  color: #ffffff;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #071a36;
  box-shadow: 0 5px 13px rgba(7, 26, 54, 0.18);
}

.cancel-btn {
  border: 1px solid #d4af37;
  background: #ffffff;
  color: #0b1f3a;
}

.cancel-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #fffdf5;
  box-shadow: 0 5px 13px rgba(212, 175, 55, 0.12);
}

.save-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.coupon-error,
.coupon-success {
  margin-top: 11px;
  padding: 11px 13px;

  border-radius: 10px;

  font-size: 13px;
  line-height: 1.7;
}

.coupon-error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.coupon-success {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

/* ==========================================================
   ORDER PRODUCTS
   ========================================================== */

.order-products-preview {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;

  background: #ffffff;
  border: 1px solid #e0e5ec;
  border-radius: 17px;
}

.order-products-preview h3 {
  margin: 0 0 12px;

  color: #0b1f3a;
  font-size: 19px;
  font-weight: 900;
}

.checkout-product-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;

  align-items: center;
  gap: 15px;

  padding: 15px 0;

  border-bottom: 1px solid #edf0f4;
}

.checkout-product-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.checkout-product-row > div {
  min-width: 0;
}

.checkout-product-row strong {
  display: block;

  color: #071a36;
  font-size: 14px;
  font-weight: 800;

  line-height: 1.6;
}

.checkout-product-row small {
  display: block;

  margin-top: 5px;

  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.checkout-product-row > span {
  color: #475569;
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
}

.checkout-product-row > strong:last-child {
  color: #0b1f3a;
  font-size: 15px;
  white-space: nowrap;
}

/* ==========================================================
   ORDER SUMMARY
   ========================================================== */

.order-summary-box {
  width: 100%;
  padding: 20px;

  box-sizing: border-box;

  border: 1px solid #d4af37;
  border-radius: 17px;

  background:
    linear-gradient(
      135deg,
      #0b1f3a 0%,
      #071a36 100%
    );

  color: #ffffff;

  box-shadow: 0 8px 22px rgba(7, 26, 54, 0.14);
}

.order-summary-box h4 {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 15px;

  margin: 0;
  padding: 10px 0;

  color: #ffffff;

  font-size: 15px;
  font-weight: 700;

  line-height: 1.6;
}

.order-summary-box h4 + h4 {
  border-top: 1px solid rgba(212, 175, 55, 0.22);
}

.order-summary-box h4 span {
  color: #d4af37;

  font-size: 17px;
  font-weight: 900;

  white-space: nowrap;
}

.order-summary-box h4:last-child {
  margin-top: 8px;
  padding-top: 16px;

  border-top: 1px solid rgba(212, 175, 55, 0.75);

  color: #ffffff;

  font-size: 18px;
  font-weight: 900;
}

.order-summary-box h4:last-child span {
  color: #f4d06f;
  font-size: 23px;
}

/* ==========================================================
   SUBMIT ORDER
   ========================================================== */

.submit-order-btn {
  width: 100%;

  min-height: 56px;
  padding: 15px 20px;

  border: 1px solid #d4af37;
  border-radius: 12px;

  background: #0b1f3a;
  color: #f4d06f;

  font-family: inherit;
  font-size: 17px;
  font-weight: 900;

  cursor: pointer;

  transition:
    background 0.25s ease,
    transform 0.25s ease,
    box-shadow 0.25s ease,
    opacity 0.25s ease;
}

.submit-order-btn:hover:not(:disabled) {
  background: #071a36;
  transform: translateY(-2px);

  box-shadow:
    0 9px 22px rgba(7, 26, 54, 0.20);
}

.submit-order-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* ==========================================================
   WHATSAPP BUTTON
   ========================================================== */

.whatsapp-submit-btn {
  width: 100%;

  min-height: 54px;
  padding: 15px;

  border: none;
  border-radius: 12px;

  background: #25d366;
  color: #ffffff;

  font-family: inherit;
  font-size: 17px;
  font-weight: 900;

  cursor: pointer;

  transition:
    background 0.25s ease,
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.whatsapp-submit-btn:hover {
  background: #1ebe5d;
  transform: translateY(-2px);

  box-shadow: 0 8px 18px rgba(37, 211, 102, 0.20);
}

/* ==========================================================
   MAIN CANCEL
   ========================================================== */

.checkout-cancel-main-btn {
  width: 100%;

  min-height: 50px;
  padding: 13px 20px;

  border: 1px solid #dc2626;
  border-radius: 12px;

  background: #ffffff;
  color: #b91c1c;

  font-family: inherit;
  font-size: 15px;
  font-weight: 900;

  cursor: pointer;

  transition:
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.checkout-cancel-main-btn:hover:not(:disabled) {
  background: #fef2f2;
  transform: translateY(-1px);

  box-shadow:
    0 5px 14px rgba(220, 38, 38, 0.10);
}

.checkout-cancel-main-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ==========================================================
   EMPTY STATE
   ========================================================== */

.empty-state {
  width: 100%;

  padding: 25px 18px;

  box-sizing: border-box;

  text-align: center;

  border: 1px dashed #cbd5e1;
  border-radius: 13px;

  background: #f8fafc;
  color: #64748b;

  font-size: 14px;
  line-height: 1.7;
}

/* ==========================================================
   REVIEW SCREEN
   ========================================================== */

.checkout-review-container {
  max-width: 820px;
}

.review-section {
  width: 100%;

  margin-bottom: 16px;
  padding: 20px;

  box-sizing: border-box;

  background: #ffffff;

  border: 1px solid #e0e5ec;
  border-radius: 17px;

  box-shadow: 0 3px 12px rgba(7, 26, 54, 0.035);
}

.review-section h3 {
  margin: 0 0 13px;

  color: #0b1f3a;

  font-size: 18px;
  font-weight: 900;
}

/* ==========================================================
   REVIEW CUSTOMER DATA
   ========================================================== */

.review-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 20px;

  padding: 12px 0;

  border-bottom: 1px solid #edf0f4;
}

.review-row:last-child {
  border-bottom: none;
}

.review-row span {
  flex-shrink: 0;

  color: #64748b;

  font-size: 13px;
  font-weight: 700;
}

.review-row strong {
  color: #071a36;

  font-size: 14px;
  font-weight: 800;

  text-align: left;

  word-break: break-word;
}

.review-address {
  align-items: flex-start;
}

.review-address strong {
  max-width: 72%;
  line-height: 1.8;
}

/* ==========================================================
   REVIEW PRODUCTS
   ========================================================== */

.review-product-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;

  align-items: center;

  gap: 15px;

  padding: 14px 0;

  border-bottom: 1px solid #edf0f4;
}

.review-product-row:last-child {
  border-bottom: none;
}

.review-product-row > div {
  min-width: 0;
}

.review-product-row strong {
  display: block;

  color: #071a36;

  font-size: 14px;
  font-weight: 800;

  line-height: 1.6;
}

.review-product-row small {
  display: block;

  margin-top: 5px;

  color: #64748b;

  font-size: 12px;
  line-height: 1.6;
}

.review-product-row > span {
  color: #475569;

  font-size: 14px;
  font-weight: 800;

  white-space: nowrap;
}

.review-product-row > strong:last-child {
  color: #0b1f3a;

  font-size: 15px;

  white-space: nowrap;
}

/* ==========================================================
   REVIEW TOTAL
   ========================================================== */

.review-total-box {
  width: 100%;

  margin-bottom: 20px;
  padding: 20px;

  box-sizing: border-box;

  border: 1px solid #d4af37;
  border-radius: 17px;

  background:
    linear-gradient(
      135deg,
      #0b1f3a 0%,
      #071a36 100%
    );

  color: #ffffff;

  box-shadow: 0 8px 22px rgba(7, 26, 54, 0.14);
}

.review-total-box > div {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 15px;

  padding: 9px 0;
}

.review-total-box span {
  color: #ffffff;

  font-size: 14px;
  font-weight: 700;
}

.review-total-box strong {
  color: #d4af37;

  font-size: 16px;
  font-weight: 900;

  white-space: nowrap;
}

.review-final-total {
  margin-top: 9px;
  padding-top: 16px !important;

  border-top: 1px solid rgba(212, 175, 55, 0.75);
}

.review-final-total span {
  color: #ffffff;

  font-size: 18px;
  font-weight: 900;
}

.review-final-total strong {
  color: #f4d06f;

  font-size: 24px;
}

/* ==========================================================
   REVIEW ACTIONS
   ========================================================== */

.checkout-review-actions {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 12px;
}

.review-edit-btn,
.review-cancel-btn,
.review-confirm-btn {
  min-height: 53px;

  padding: 13px 16px;

  border-radius: 12px;

  font-family: inherit;
  font-size: 15px;
  font-weight: 900;

  cursor: pointer;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    opacity 0.2s ease;
}

.review-edit-btn {
  border: 1px solid #0b1f3a;
  background: #ffffff;
  color: #0b1f3a;
}

.review-cancel-btn {
  border: 1px solid #dc2626;
  background: #ffffff;
  color: #b91c1c;
}

.review-confirm-btn {
  grid-column: 1 / -1;

  border: 1px solid #d4af37;

  background: #0b1f3a;
  color: #f4d06f;
}

.review-edit-btn:hover:not(:disabled),
.review-cancel-btn:hover:not(:disabled),
.review-confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.review-edit-btn:hover:not(:disabled) {
  background: #f8fafc;

  box-shadow:
    0 6px 15px rgba(7, 26, 54, 0.10);
}

.review-cancel-btn:hover:not(:disabled) {
  background: #fef2f2;

  box-shadow:
    0 6px 15px rgba(220, 38, 38, 0.10);
}

.review-confirm-btn:hover:not(:disabled) {
  background: #071a36;

  box-shadow:
    0 8px 20px rgba(7, 26, 54, 0.20);
}

.review-edit-btn:disabled,
.review-cancel-btn:disabled,
.review-confirm-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ==========================================================
   TABLET
   ========================================================== */

@media (max-width: 700px) {

  .checkout-container {
    width: calc(100% - 24px);

    margin: 18px auto;
    padding: 20px 15px;

    border-radius: 17px;
  }

  .checkout-container h2 {
    font-size: 23px;
  }

  .checkout-subtitle {
    margin-bottom: 22px;
    font-size: 13px;
  }

  .checkout-navigation {
    grid-template-columns: 1fr;
    gap: 9px;

    margin-bottom: 22px;
  }

  .checkout-nav-btn {
    width: 100%;
  }

  .checkout-form {
    gap: 16px;
  }

  .payment-method-section,
  .coupon-section,
  .order-products-preview,
  .review-section {
    padding: 16px;
  }

  .payment-methods {
    grid-template-columns: 1fr;
  }

  .payment-method-card {
    padding: 14px;
  }

  .coupon-input-row {
    flex-direction: column;
  }

  .coupon-input-row input,
  .save-btn,
  .cancel-btn {
    width: 100%;
    min-width: 0;
  }

  .checkout-product-row {
    grid-template-columns: 1fr auto;
    gap: 7px 12px;
  }

  .checkout-product-row > div {
    grid-column: 1 / -1;
  }

  .checkout-product-row > span {
    grid-column: 1;
    grid-row: 2;
  }

  .checkout-product-row > strong:last-child {
    grid-column: 2;
    grid-row: 2;

    text-align: left;
  }

  .order-summary-box {
    padding: 17px 14px;
  }

  .order-summary-box h4 {
    font-size: 14px;
  }

  .order-summary-box h4 span {
    font-size: 16px;
  }

  .order-summary-box h4:last-child {
    font-size: 17px;
  }

  .order-summary-box h4:last-child span {
    font-size: 21px;
  }

  .submit-order-btn,
  .whatsapp-submit-btn {
    font-size: 16px;
  }

  /* REVIEW */

  .review-row {
    flex-direction: column;
    align-items: flex-start;

    gap: 5px;
  }

  .review-row strong {
    width: 100%;

    text-align: right;
  }

  .review-address strong {
    max-width: 100%;
  }

  .review-product-row {
    grid-template-columns: 1fr auto;

    gap: 7px 12px;
  }

  .review-product-row > div {
    grid-column: 1 / -1;
  }

  .review-product-row > span {
    grid-column: 1;
    grid-row: 2;
  }

  .review-product-row > strong:last-child {
    grid-column: 2;
    grid-row: 2;

    text-align: left;
  }

  .checkout-review-actions {
    grid-template-columns: 1fr;
  }

  .review-confirm-btn {
    grid-column: auto;
    order: -1;
  }

  .review-final-total {
    flex-direction: column;
    align-items: center !important;

    gap: 6px !important;

    text-align: center;
  }
}

/* ==========================================================
   SMALL MOBILE
   ========================================================== */

@media (max-width: 400px) {

  .checkout-container {
    width: calc(100% - 16px);

    margin: 10px auto;
    padding: 15px 11px;

    border-radius: 15px;
  }

  .checkout-container h2 {
    font-size: 21px;
  }

  .checkout-subtitle {
    font-size: 12px;
  }

  .form-group label {
    font-size: 13px;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    font-size: 14px;
  }

  .payment-method-section,
  .coupon-section,
  .order-products-preview,
  .review-section {
    padding: 13px;
    border-radius: 14px;
  }

  .payment-method-section h3,
  .coupon-section h3,
  .order-products-preview h3,
  .review-section h3 {
    font-size: 16px;
  }

  .payment-method-title strong {
    font-size: 14px;
  }

  .payment-method-content p {
    font-size: 11px;
  }

  .payment-number strong {
    font-size: 13px;
  }

  .checkout-product-row,
  .review-product-row {
    font-size: 13px;
  }

  .checkout-product-row > strong:last-child,
  .review-product-row > strong:last-child {
    font-size: 13px;
  }

  .order-summary-box {
    padding: 15px 12px;
  }

  .order-summary-box h4 {
    font-size: 13px;
  }

  .order-summary-box h4 span {
    font-size: 15px;
  }

  .order-summary-box h4:last-child {
    font-size: 16px;
  }

  .order-summary-box h4:last-child span {
    font-size: 20px;
  }

  .submit-order-btn {
    min-height: 52px;
    font-size: 15px;
  }

  .checkout-cancel-main-btn {
    font-size: 14px;
  }

  .review-total-box {
    padding: 16px 13px;
  }

  .review-total-box span {
    font-size: 13px;
  }

  .review-total-box strong {
    font-size: 14px;
  }

  .review-final-total span {
    font-size: 16px;
  }

  .review-final-total strong {
    font-size: 21px;
  }
}
```
