document.addEventListener('DOMContentLoaded', () => {
  // Configured Boundary Models & Rule Sets
  const BASE_PRICE = 5.99;
  const MAX_DIPS = 2;
  const MAX_QTY = 99; // Enforced quantity upper threshold limit

  // Core Functional System State Engine
  let quantity = 1;
  let calculatedSingleItemPrice = BASE_PRICE;
  let isStateValid = true;

  // Cache Dom Reference Objects 
  const form = document.getElementById('customization-form');
  const qtyDisplay = document.getElementById('qty-display');
  const qtyDecrement = document.getElementById('qty-decrement');
  const qtyIncrement = document.getElementById('qty-increment');
  const totalPriceDisplay = document.getElementById('total-price-display');
  const validationBanner = document.getElementById('validation-summary-banner');
  const btnSubmit = document.getElementById('btn-submit');
  
  const dipCheckboxes = form.querySelectorAll('input[name="dips"]');

  /**
   * Centralized Validation & State Synchronization Matrix.
   * Processes limits, pricing segments, and ui class mutations concurrently.
   */
  function validateState() {
    let toppingsSum = 0;
    let dipsSum = 0;
    let sideValue = 0;
    let beverageValue = 0;

    // 1. Group-Based Segmentation & Calculation Matrix
    const checkedToppings = form.querySelectorAll('input[name="toppings"]:checked');
    checkedToppings.forEach(el => toppingsSum += parseFloat(el.getAttribute('data-price') || 0));

    const checkedDips = form.querySelectorAll('input[name="dips"]:checked');
    checkedDips.forEach(el => dipsSum += parseFloat(el.getAttribute('data-price') || 0));

    const checkedSide = form.querySelector('input[name="side"]:checked');
    if (checkedSide) sideValue = parseFloat(checkedSide.getAttribute('data-price') || 0);

    const checkedBeverage = form.querySelector('input[name="beverage"]:checked');
    if (checkedBeverage) beverageValue = parseFloat(checkedBeverage.getAttribute('data-price') || 0);

    // 2. Structural Intercept Evaluation (Hard Limits Verification)
    if (checkedDips.length > MAX_DIPS) {
      isStateValid = false;
    } else {
      isStateValid = true;
    }

    // 3. Preventative Modifier Interface Feedback (Removes reliance on :has())
    dipCheckboxes.forEach(checkbox => {
      const parentLabel = checkbox.closest('.control-item');
      if (checkedDips.length >= MAX_DIPS && !checkbox.checked) {
        checkbox.disabled = true;
        if (parentLabel) parentLabel.classList.add('disabled');
      } else {
        checkbox.disabled = false;
        if (parentLabel) parentLabel.classList.remove('disabled');
      }
    });

    // 4. Stepper Component Visual Locks
    qtyIncrement.disabled = (quantity >= MAX_QTY);
    qtyDecrement.disabled = (quantity <= 1);

    // 5. Dynamic Global Canvas Calculations Assembly
    if (isStateValid) {
      validationBanner.hidden = true;
      btnSubmit.disabled = false;
      
      calculatedSingleItemPrice = BASE_PRICE + toppingsSum + dipsSum + sideValue + beverageValue;
      const compoundTotal = calculatedSingleItemPrice * quantity;
      totalPriceDisplay.textContent = `$${compoundTotal.toFixed(2)}`;
    } else {
      validationBanner.hidden = false;
      btnSubmit.disabled = true;
      totalPriceDisplay.textContent = '---';
    }
  }

  // --- Pre-Check Input Selection Prevention Mechanics ---
  dipCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('click', (e) => {
      const checkedCount = form.querySelectorAll('input[name="dips"]:checked').length;
      
      // If the action would violate business boundaries, intercept and abort instantly
      if (checkbox.checked && checkedCount > MAX_DIPS) {
        e.preventDefault();
        checkbox.checked = false;
        validateState();
      }
    });
  });

  // --- Stepper Quantity Modification Handlers ---
  qtyIncrement.addEventListener('click', () => {
    if (quantity < MAX_QTY) {
      quantity++;
      qtyDisplay.textContent = quantity;
      validateState();
    }
  });

  qtyDecrement.addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      qtyDisplay.textContent = quantity;
      validateState();
    }
  });

  // --- Dynamic Form Event Core Listening Layer ---
  form.addEventListener('change', () => {
    validateState();
  });

  // --- Deterministic Submit Finalization Chain ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Execute a comprehensive top-down runtime check validation run
    validateState();

    const checkedDipsCount = form.querySelectorAll('input[name="dips"]:checked').length;

    // Comprehensive Fallback Safety Checks Block Blockade
    if (!isStateValid || checkedDipsCount > MAX_DIPS || quantity > MAX_QTY || quantity < 1) {
      validationBanner.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Assembly configuration packaging payload pipeline
    const formData = new FormData(form);
    const orderPayload = {
      item: "Classic Double Cheeseburger",
      quantity: quantity,
      toppings: formData.getAll('toppings'),
      dips: formData.getAll('dips'),
      side: formData.get('side'),
      beverage: formData.get('beverage'),
      totalPaid: (calculatedSingleItemPrice * quantity).toFixed(2)
    };

    console.log('Production System Validated Payload Packaged:', orderPayload);
    alert(`Order Confirmed! Total: $${orderPayload.totalPaid}`);
  });

  // Execute initialization loop pass
  validateState();
});
