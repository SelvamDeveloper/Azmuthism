const PAYMENTS_KEY = "learnaway_payments";

function getPayments() {
  try {
    return JSON.parse(localStorage.getItem(PAYMENTS_KEY)) || [];
  } catch {
    return [];
  }
}

function savePayments(payments) {
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

function getPaymentsForUser(email) {
  return getPayments()
    .filter((p) => p.userEmail === email)
    .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
}

function generateOrderId() {
  return "ORD-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function maskCardNumber(num) {
  const digits = num.replace(/\D/g, "");
  return "•••• •••• •••• " + (digits.slice(-4) || "4242");
}

function validatePaymentForm(form) {
  const name = form.cardName.value.trim();
  const number = form.cardNumber.value.replace(/\D/g, "");
  const expiry = form.cardExpiry.value.trim();
  const cvv = form.cardCvv.value.replace(/\D/g, "");

  if (!name) return "Enter cardholder name.";
  if (number.length < 15) return "Enter a valid card number.";
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return "Expiry must be MM/YY.";
  if (cvv.length < 3) return "Enter a valid CVV.";
  return null;
}

function processPayment(user, courses, paymentDetails) {
  const unavailable = courses.filter((c) => !canEnrollInCourse(c.id, user.email));
  if (unavailable.length) {
    const names = unavailable.map((c) => c.title).join(", ");
    return { error: `Cannot purchase: ${names} (full or already enrolled).` };
  }

  const total = courses.reduce((sum, c) => sum + c.price, 0);
  const order = {
    id: generateOrderId(),
    userEmail: user.email,
    userName: user.name,
    courseIds: courses.map((c) => c.id),
    courseTitles: courses.map((c) => c.title),
    total,
    method: paymentDetails.method || "card",
    cardLast4: paymentDetails.cardLast4 || "4242",
    status: "completed",
    paidAt: new Date().toISOString(),
  };

  courses.forEach((c) => enrollCourse(c.id));
  setCart([]);

  const payments = getPayments();
  payments.push(order);
  savePayments(payments);

  return { success: true, order };
}

function initPaymentHistoryPage() {
  if (!document.getElementById("payments-root")) return;
  if (!requireAuth()) return;

  const user = getUser();
  if (user.role === "admin") {
    window.location.href = "admin.html";
    return;
  }

  initPortalLayout(user.role === "trainer" ? "trainer" : "student");

  const payments = getPaymentsForUser(user.email);
  const root = document.getElementById("payments-root");

  root.innerHTML = `
    <div class="portal-page-header portal-fade-in">
      <h1>Payment History</h1>
      <p>Your course purchase receipts and order details.</p>
    </div>
    <div class="payments-list">
      ${
        payments.length
          ? payments
              .map(
                (p) => `
        <article class="payment-card portal-card-animate">
          <div class="payment-card-top">
            <div>
              <strong>${p.id}</strong>
              <p>${new Date(p.paidAt).toLocaleString()}</p>
            </div>
            <span class="payment-status payment-status--done">Paid</span>
          </div>
          <ul class="payment-courses">${p.courseTitles.map((t) => `<li>${t}</li>`).join("")}</ul>
          <div class="payment-card-footer">
            <span>${p.method === "card" ? "Card" : p.method} ${p.cardLast4 ? "•••• " + p.cardLast4 : ""}</span>
            <strong>${formatPrice(p.total)}</strong>
          </div>
        </article>`
              )
              .join("")
          : `<div class="dash-empty"><div class="dash-empty-icon">🧾</div><h3>No payments yet</h3><p>Purchase a course to see receipts here.</p><a href="courses.html" class="btn btn-lime">Browse Courses</a></div>`
      }
    </div>`;
}

document.addEventListener("DOMContentLoaded", initPaymentHistoryPage);
