function initCoursesPage() {
  const grid = document.getElementById("courses-grid");
  const searchInput = document.getElementById("search-input");
  const chipsContainer = document.getElementById("filter-chips");
  if (!grid) return;

  let activeCategory = new URLSearchParams(window.location.search).get("category") || "all";
  let searchQuery = "";

  COURSE_CATEGORIES.forEach((cat) => {
    const chip = document.createElement("button");
    chip.className = `chip${cat.id === activeCategory ? " active" : ""}`;
    chip.textContent = `${cat.icon} ${cat.name}`;
    chip.addEventListener("click", () => {
      activeCategory = cat.id;
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      renderCourses();
    });
    chipsContainer.appendChild(chip);
  });

  function filterCourses() {
    return getApprovedCourses().filter((course) => {
      const matchCategory = activeCategory === "all" || course.category === activeCategory;
      const matchSearch =
        !searchQuery ||
        course.title.toLowerCase().includes(searchQuery) ||
        course.description.toLowerCase().includes(searchQuery) ||
        course.category.toLowerCase().includes(searchQuery);
      return matchCategory && matchSearch;
    });
  }

  function renderCourses() {
    const filtered = filterCourses();
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1">
          <h3>No courses found</h3>
          <p>Try adjusting your search or filter.</p>
        </div>`;
      return;
    }
    grid.innerHTML = filtered
      .map((course, i) => {
        const card = renderCourseCard(course);
        return card.replace(
          'class="course-card"',
          `class="course-card reveal" style="transition-delay:${(i % 6) * 0.08}s"`
        );
      })
      .join("");

    requestAnimationFrame(() => {
      grid.querySelectorAll(".reveal").forEach((el) => el.classList.add("revealed"));
    });
  }

  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderCourses();
  });

  renderCourses();
}

function initCourseDetail() {
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get("id");
  const user = getUser();
  let course = getApprovedCourseById(courseId);

  if (!course && user) {
    const raw = getCourseById(courseId);
    if (raw && (user.role === "admin" || raw.submittedBy === user.email)) {
      course = raw;
    }
  }

  if (!course) {
    document.getElementById("detail-content").innerHTML = `
      <div class="empty-state">
        <h3>Course not found</h3>
        <p><a href="courses.html">Browse all courses</a></p>
      </div>`;
    return;
  }

  document.title = `${course.title} | Asmuthism`;
  const enrolled = isEnrolled(course.id);
  const inCart = getCart().includes(course.id);
  const full = isCourseFull(course.id);
  const seatsBadge = course.status === "approved" ? renderSeatsBadge(course) : "";
  const pendingNotice =
    course.status !== "approved"
      ? `<div class="alert alert-error" style="margin-bottom:24px">This course is ${course.status} and not visible to students yet.</div>`
      : "";

  document.getElementById("detail-content").innerHTML = `
    ${pendingNotice}
    <div class="detail-grid">
      <div class="detail-main">
        <span class="section-tag">${course.category.replace("-", " ").toUpperCase()}</span>
        <h1>${course.title}</h1>
        <div class="detail-meta">
          <span>★ ${course.rating} rating</span>
          <span>👥 ${course.students.toLocaleString()} students</span>
          <span>⏱ ${course.duration}</span>
          <span>📊 ${course.level}</span>
        </div>
        <p class="detail-desc">${course.description}</p>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px">
          <img src="${course.instructorImage}" alt="${course.instructor}" style="width:48px;height:48px;border-radius:50%;object-fit:cover">
          <div>
            <strong>${course.instructor}</strong>
            <p style="color:var(--gray-500);font-size:0.875rem">${course.instructorRole}</p>
          </div>
        </div>
        <div class="curriculum">
          <h2>Course Curriculum</h2>
          ${course.modules
            .map(
              (mod, i) => `
            <div class="module">
              <div class="module-header">
                <span>Module ${i + 1}: ${mod.title}</span>
                <span>${mod.lessons.length} lessons</span>
              </div>
              <ul class="lesson-list">
                ${mod.lessons.map((l) => `<li>${l}</li>`).join("")}
              </ul>
            </div>`
            )
            .join("")}
        </div>
      </div>
      <aside class="purchase-card">
        <img src="${course.image}" alt="${course.title}">
        <div class="purchase-body">
          <div class="purchase-price">${formatPrice(course.price)}</div>
          <p style="color:var(--gray-500);font-size:0.875rem">One-time payment • Lifetime access</p>
          ${seatsBadge}
          ${
            enrolled
              ? `<a href="dashboard.html" class="btn btn-dark btn-lg">Go to Course</a>`
              : course.status === "approved"
                ? full
                  ? `<button class="btn btn-outline btn-lg" disabled>Course Full</button>`
                  : `<button id="enroll-btn" class="btn btn-lime btn-lg">${inCart ? "Proceed to Checkout" : "Buy Now"}</button>
                 <button id="cart-btn" class="btn btn-outline" style="margin-top:12px">${inCart ? "Remove from Cart" : "Add to Cart"}</button>`
                : `<p class="alert alert-error">This course is not available for enrollment yet.</p>`
          }
          <ul class="purchase-features">
            <li>${course.duration} on-demand video</li>
            <li>Downloadable resources</li>
            <li>Certificate of completion</li>
            <li>Full lifetime access</li>
            <li>Mobile and desktop access</li>
          </ul>
        </div>
      </aside>
    </div>`;

  if (!enrolled && course.status === "approved") {
    document.getElementById("enroll-btn")?.addEventListener("click", () => {
      if (!getUser()) {
        window.location.href = `login.html?redirect=course-detail.html?id=${course.id}`;
        return;
      }
      if (inCart) {
        window.location.href = "checkout.html";
      } else {
        const result = addToCart(course.id);
        if (result?.error) {
          alert(result.error);
          return;
        }
        window.location.href = "checkout.html";
      }
    });

    document.getElementById("cart-btn")?.addEventListener("click", () => {
      if (getCart().includes(course.id)) {
        removeFromCart(course.id);
      } else {
        const result = addToCart(course.id);
        if (result?.error) alert(result.error);
      }
      initCourseDetail();
    });
  }
}

function initHomeCategories() {
  const grid = document.getElementById("home-categories");
  if (!grid) return;

  const displayCategories = COURSE_CATEGORIES.filter((c) => c.id !== "all");
  grid.innerHTML = displayCategories
    .map((cat) => {
      const count = getApprovedCourses().filter((c) => c.category === cat.id).length;
      return `
      <a href="courses.html?category=${cat.id}" class="category-card">
        <div class="category-icon">${cat.icon}</div>
        <h4>${cat.name}</h4>
        <p>${count} Courses</p>
      </a>`;
    })
    .join("");
}

function initHomeCourses() {
  const grid = document.getElementById("featured-courses");
  if (!grid) return;
  grid.innerHTML = getApprovedCourses().slice(0, 3).map(renderCourseCard).join("");
}

function initHomeTeam() {
  const grid = document.getElementById("team-grid");
  if (!grid) return;
  grid.innerHTML = INSTRUCTORS.map(
    (m) => `
    <div class="team-member">
      <img src="${m.image}" alt="${m.name}" loading="lazy">
      <h4>${m.name}</h4>
      <p>${m.role}</p>
    </div>`
  ).join("");
}

function initNewsletter() {
  const form = document.getElementById("newsletter-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.querySelector("input").value;
    if (email) {
      localStorage.setItem(STORAGE_KEYS.newsletter, email);
      showAlert(form.parentElement, "Successfully subscribed! Thank you.", "success");
      form.reset();
    }
  });
}

function initHowTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  const stepsContainer = document.getElementById("steps-grid");
  if (!tabs.length || !stepsContainer) return;

  const studentSteps = [
    { num: 1, title: "Sign Up, It's Free!", desc: "Create your account and enroll in courses across all categories." },
    { num: 2, title: "Join Live Classes", desc: "Attend scheduled group sessions with expert trainers via class links." },
    { num: 3, title: "Learn & Get Certified", desc: "Study at your pace, join live sessions, and earn your certificate." },
  ];

  const businessSteps = [
    { num: 1, title: "Register as Trainer", desc: "Sign up with a trainer account to schedule and host live group classes." },
    { num: 2, title: "Schedule Live Sessions", desc: "Set date, time, course, and share your meeting link with students." },
    { num: 3, title: "Teach Your Group", desc: "Start live classes and track how many students join each session." },
  ];

  function renderSteps(steps) {
    stepsContainer.innerHTML = steps
      .map(
        (s) => `
      <div class="step-card">
        <div class="step-num">${s.num}</div>
        <h4>${s.title}</h4>
        <p>${s.desc}</p>
      </div>`
      )
      .join("");
  }

  renderSteps(studentSteps);

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      renderSteps(tab.dataset.tab === "business" ? businessSteps : studentSteps);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initHomeCategories();
  initHomeCourses();
  initHomeTeam();
  initNewsletter();
  initHowTabs();
  initCoursesPage();
  initCourseDetail();
});
