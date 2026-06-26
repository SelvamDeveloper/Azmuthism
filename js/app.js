const STORAGE_KEYS = {
  user: "learnaway_user",
  cart: "learnaway_cart",
  enrollments: "learnaway_enrollments",
  newsletter: "learnaway_newsletter",
};

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.user));
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

function logout() {
  localStorage.removeItem(STORAGE_KEYS.user);
  window.location.href = "index.html";
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.cart)) || [];
  } catch {
    return [];
  }
}

function setCart(cart) {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(courseId) {
  if (!canEnrollInCourse(courseId, getUser()?.email)) {
    return { error: isCourseFull(courseId) ? "This course is full." : "Cannot add this course to cart." };
  }
  const cart = getCart();
  if (!cart.includes(courseId)) {
    cart.push(courseId);
    setCart(cart);
  }
  return { success: true };
}

function removeFromCart(courseId) {
  setCart(getCart().filter((id) => id !== courseId));
}

function getEnrollments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.enrollments)) || [];
  } catch {
    return [];
  }
}

function setEnrollments(enrollments) {
  localStorage.setItem(STORAGE_KEYS.enrollments, JSON.stringify(enrollments));
}

function isEnrolled(courseId) {
  return getEnrollments().some((e) => e.courseId === courseId);
}

function enrollCourse(courseId) {
  if (!canEnrollInCourse(courseId, getUser()?.email)) return false;

  const enrollments = getEnrollments();
  if (!enrollments.some((e) => e.courseId === courseId)) {
    enrollments.push({
      courseId,
      enrolledAt: new Date().toISOString(),
      progress: Math.floor(Math.random() * 30) + 5,
    });
    setEnrollments(enrollments);
  }
  removeFromCart(courseId);
  return true;
}

function formatPrice(price) {
  return `$${price.toFixed(0)}`;
}

function requireAuth(redirectTo = "login.html") {
  if (getUser()) return true;

  const page = window.location.pathname.split("/").pop() || "index.html";
  const authPages = ["login.html", "register.html"];

  if (authPages.includes(page)) return false;

  let redirectTarget = page + window.location.search;

  const existingRedirect = new URLSearchParams(window.location.search).get("redirect");
  if (existingRedirect && !authPages.some((p) => existingRedirect.startsWith(p))) {
    redirectTarget = existingRedirect;
  }

  if (authPages.some((p) => redirectTarget.startsWith(p))) {
    redirectTarget = "dashboard.html";
  }

  window.location.href = `${redirectTo}?redirect=${encodeURIComponent(redirectTarget)}`;
  return false;
}

function updateCartBadge() {
  const badge = document.querySelector(".cart-count");
  if (!badge) return;
  const count = getCart().length;
  badge.textContent = count;
  badge.classList.toggle("hidden", count === 0);
}

function updateAuthUI() {
  const user = getUser();
  const loginBtn = document.querySelector(".login-link");
  const getStartedBtn = document.querySelector(".get-started-btn");
  const dashNav = document.querySelector(".nav-dashboard");
  const adminNav = document.querySelector(".nav-admin");

  if (user && loginBtn) {
    loginBtn.textContent = user.name.split(" ")[0];
    loginBtn.href = user.role === "admin" ? "admin.html" : "dashboard.html";
    loginBtn.classList.remove("btn-outline");
    loginBtn.classList.add("btn-dark");
    loginBtn.title = user.role === "admin" ? "Go to admin portal" : "Go to dashboard";
  }

  if (user && getStartedBtn) {
    getStartedBtn.textContent = user.role === "admin" ? "Admin Portal" : "My Dashboard";
    getStartedBtn.href = user.role === "admin" ? "admin.html" : "dashboard.html";
  }

  if (dashNav) {
    dashNav.classList.toggle("hidden", !user || user.role === "admin");
    if (user && user.role !== "admin") {
      dashNav.textContent = user.role === "trainer" ? "Trainer Portal" : "Dashboard";
    }
  }

  if (adminNav) {
    adminNav.classList.toggle("hidden", !user || user.role !== "admin");
  }

  if (user) {
    document.body.classList.add("is-logged-in");
    document.body.dataset.userRole = user.role;
  } else {
    document.body.classList.remove("is-logged-in");
    delete document.body.dataset.userRole;
  }
}

function closeMobileMenu() {
  document.querySelector(".nav-links")?.classList.remove("open");
  document.querySelector(".mobile-backdrop")?.classList.remove("visible");
  document.querySelector(".mobile-toggle")?.setAttribute("aria-expanded", "false");
}

function initHeader() {
  const toggle = document.querySelector(".mobile-toggle");
  const nav = document.querySelector(".nav-links");
  const backdrop = document.querySelector(".mobile-backdrop");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      backdrop?.classList.toggle("visible", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggle.textContent = isOpen ? "✕" : "☰";
    });
  }

  backdrop?.addEventListener("click", closeMobileMenu);

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) closeMobileMenu();
    });
  });

  const scrollTop = document.querySelector(".scroll-top");
  if (scrollTop) {
    window.addEventListener("scroll", () => {
      scrollTop.classList.toggle("visible", window.scrollY > 400);
    });
    scrollTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  updateCartBadge();
  updateAuthUI();

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const isHome = currentPage === "index.html" || currentPage === "";

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.remove("active");
    const href = link.getAttribute("href") || "";

    if (href === currentPage) {
      link.classList.add("active");
    } else if (isHome && href === "index.html") {
      link.classList.add("active");
    }
  });
}

function renderCourseCard(course) {
  return `
    <article class="course-card" onclick="window.location.href='course-detail.html?id=${course.id}'">
      <div class="course-thumb">
        <img src="${course.image}" alt="${course.title}" loading="lazy">
        ${course.badge ? `<span class="course-badge">${course.badge}</span>` : ""}
      </div>
      <div class="course-body">
        <div class="course-meta">
          <span>${course.duration}</span>
          <span>•</span>
          <span>${course.level}</span>
        </div>
        <h3>${course.title}</h3>
        <p>${course.description}</p>
        <div class="course-footer">
          <span class="course-price">${formatPrice(course.price)}</span>
          <span class="course-rating">★ ${course.rating} (${course.students.toLocaleString()})</span>
        </div>
      </div>
    </article>
  `;
}

function showAlert(container, message, type = "error") {
  const existing = container.querySelector(".alert");
  if (existing) existing.remove();
  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  container.prepend(alert);
}

document.addEventListener("DOMContentLoaded", initHeader);
