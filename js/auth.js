function initLogin() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  if (params.get("demo") === "1") {
    loginAsDemo();
    return;
  }
  if (params.get("demo") === "trainer") {
    loginAsDemoTrainer();
    return;
  }
  if (params.get("demo") === "admin") {
    loginAsDemoAdmin();
    return;
  }

  document.getElementById("demo-login-btn")?.addEventListener("click", () => loginAsDemo());
  document.getElementById("demo-trainer-btn")?.addEventListener("click", () => loginAsDemoTrainer());
  document.getElementById("demo-admin-btn")?.addEventListener("click", () => loginAsDemoAdmin());
  document.getElementById("demo-fill-btn")?.addEventListener("click", () => {
    fillDemoCredentials("student");
    showAlert(form, "Student demo credentials filled.", "success");
  });
  document.getElementById("demo-fill-trainer-btn")?.addEventListener("click", () => {
    fillDemoCredentials("trainer");
    showAlert(form, "Trainer demo credentials filled.", "success");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;

    if (!email || !password) {
      showAlert(form, "Please fill in all fields.");
      return;
    }

    if (email === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
      loginAsDemo();
      return;
    }
    if ((email === "demo@learnaway.com" || email === "demo@asmuthism.com") && password === "demo123") {
      loginAsDemo();
      return;
    }
    if (email === DEMO_TRAINER.email && password === DEMO_TRAINER.password) {
      loginAsDemoTrainer();
      return;
    }
    if (email === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
      loginAsDemoAdmin();
      return;
    }

    const users = JSON.parse(localStorage.getItem("learnaway_users") || "[]");
    const user = users.find((u) => u.email === email && u.password === password);

    if (!user) {
      showAlert(form, "Invalid email or password. Try a demo account below.");
      return;
    }

    setUser({ name: user.name, email: user.email, role: user.role || "student" });
    redirectAfterLogin();
  });
}

function initRegister() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirm = form.confirm.value;

    if (!name || !email || !password) {
      showAlert(form, "Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      showAlert(form, "Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      showAlert(form, "Passwords do not match.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("learnaway_users") || "[]");
    if (users.some((u) => u.email === email)) {
      showAlert(form, "An account with this email already exists.");
      return;
    }

    users.push({ name, email, password, role: "student" });
    localStorage.setItem("learnaway_users", JSON.stringify(users));
    setUser({ name, email, role: "student" });
    window.location.href = "dashboard.html";
  });
}

function initDashboardPage() {
  if (!document.getElementById("dashboard-root")) return;
  if (!requireAuth()) return;

  const user = getUser();
  if (user.role === "admin") {
    window.location.href = "admin.html";
    return;
  }

  const roleBadge = document.getElementById("role-badge");
  if (roleBadge) {
    roleBadge.textContent = user.role === "trainer" ? "🎓 Trainer" : "👤 Student";
    roleBadge.classList.remove("hidden");
    roleBadge.classList.add(user.role === "trainer" ? "role-badge--trainer" : "role-badge--student");
  }

  const headerTitle = document.getElementById("portal-header-title");
  if (headerTitle) {
    headerTitle.textContent = user.role === "trainer" ? "Trainer Portal" : "Student Portal";
  }

  initLiveDashboard();
}

function setCheckoutStep(step) {
  document.querySelectorAll(".checkout-step").forEach((el) => {
    el.classList.toggle("active", parseInt(el.dataset.step, 10) === step);
    el.classList.toggle("done", parseInt(el.dataset.step, 10) < step);
  });
  document.querySelectorAll(".checkout-step-panel").forEach((panel) => panel.classList.remove("active"));
  const panels = ["checkout-step-review", "checkout-step-payment", "checkout-step-confirm"];
  document.getElementById(panels[step - 1])?.classList.add("active");
}

function initCheckout() {
  if (!document.getElementById("checkout-items")) return;
  if (!requireAuth()) return;

  const user = getUser();
  if (user.role !== "student") {
    window.location.href = user.role === "admin" ? "admin.html" : "dashboard.html";
    return;
  }

  const cart = getCart();
  const checkoutItems = document.getElementById("checkout-items");
  const orderSummary = document.getElementById("order-summary");
  const checkoutForm = document.getElementById("checkout-form");
  const summaryItems = document.getElementById("order-summary-items");

  if (cart.length === 0) {
    checkoutItems.innerHTML = `
      <div class="empty-state">
        <h3>Your cart is empty</h3>
        <p>Add courses to your cart before checkout.</p>
        <a href="courses.html" class="btn btn-lime" style="margin-top:16px">Browse Courses</a>
      </div>`;
    if (orderSummary) orderSummary.classList.add("hidden");
    document.getElementById("checkout-next-payment")?.classList.add("hidden");
    return;
  }

  const courses = cart.map(getCourseById).filter((c) => c && c.status === "approved" && canEnrollInCourse(c.id, user.email));
  let total = 0;

  const itemHtml = courses
    .map((c) => {
      total += c.price;
      return `
      <div class="order-item">
        <img src="${c.image}" alt="${c.title}">
        <div style="flex:1">
          <h4 style="margin-bottom:4px">${c.title}</h4>
          <p style="color:var(--gray-500);font-size:0.875rem">${c.instructor}</p>
          ${renderSeatsBadge(c)}
        </div>
        <div>
          <p style="font-weight:700">${formatPrice(c.price)}</p>
          <button onclick="removeFromCart('${c.id}');location.reload()" style="background:none;border:none;color:var(--gray-400);cursor:pointer;font-size:0.8rem;margin-top:4px">Remove</button>
        </div>
      </div>`;
    })
    .join("");

  checkoutItems.innerHTML = itemHtml;
  if (summaryItems) summaryItems.innerHTML = itemHtml;
  document.getElementById("order-total").textContent = formatPrice(total);

  document.getElementById("checkout-next-payment")?.addEventListener("click", () => setCheckoutStep(2));
  document.getElementById("checkout-back-review")?.addEventListener("click", () => setCheckoutStep(1));

  checkoutForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const error = validatePaymentForm(checkoutForm);
    if (error) {
      showAlert(checkoutForm, error);
      return;
    }

    const cardNumber = checkoutForm.cardNumber.value.replace(/\D/g, "");
    const result = processPayment(user, courses, {
      method: "card",
      cardLast4: cardNumber.slice(-4),
    });

    if (result.error) {
      showAlert(checkoutForm, result.error);
      return;
    }

    setCheckoutStep(3);
    document.getElementById("checkout-confirmation").innerHTML = `
      <div class="checkout-success portal-fade-in">
        <div class="dash-empty-icon">✅</div>
        <h1>Payment Successful!</h1>
        <p>Order <strong>${result.order.id}</strong> confirmed.</p>
        <p>You now have access to ${result.order.courseTitles.length} course(s).</p>
        <div class="checkout-success-actions">
          <a href="dashboard.html" class="btn btn-lime btn-lg">Go to Dashboard</a>
          <a href="payments.html" class="btn btn-outline btn-lg">View Receipt</a>
        </div>
      </div>`;
    if (orderSummary) orderSummary.classList.add("hidden");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLogin();
  initRegister();
  initDashboardPage();
  initCheckout();
});
