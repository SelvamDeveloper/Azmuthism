let adminInitialized = false;

function initAdminPortal() {
  const user = getUser();
  if (!user) {
    requireAuth();
    return;
  }
  if (user.role !== "admin") {
    window.location.href = "dashboard.html";
    return;
  }

  if (typeof seedDemoPendingCourse === "function") seedDemoPendingCourse();

  if (!adminInitialized) {
    bindAdminEvents();
    bindAdminSettingsForm();
    bindCreateTrainerForm();
    bindAdminEditForm();
    adminInitialized = true;
  }

  refreshAdminPortal();
  initPortalLayout("admin", "overview");
}

function refreshAdminPortal() {
  renderAdminStats();
  renderAdminOverview();
  renderPendingQueue();
  renderAllCoursesTable();
  renderTrainersList();
  renderTrainerApplications();
  renderLiveSessionsAdmin();
  loadSettingsForm();
}

function renderAdminStats() {
  const all = getAllCourses();
  const pending = getPendingCourses();
  const approved = getApprovedCourses();
  const rejected = all.filter((c) => c.status === "rejected");
  const users = JSON.parse(localStorage.getItem("learnaway_users") || "[]");
  const trainers = users.filter((u) => u.role === "trainer").length;
  const sessions = getLiveSessions?.() || [];

  animateStat("admin-stat-pending", pending.length);
  animateStat("admin-stat-approved", approved.length);
  animateStat("admin-stat-rejected", rejected.length);
  animateStat("admin-stat-total", all.length);
  animateStat("admin-stat-trainers", trainers);
  animateStat("admin-stat-sessions", sessions.length);
}

function animateStat(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("stat-pop");
  el.textContent = value;
  setTimeout(() => el.classList.remove("stat-pop"), 400);
}

function renderAdminOverview() {
  const container = document.getElementById("admin-overview");
  if (!container) return;

  const all = getAllCourses();
  const approved = getApprovedCourses();
  const pending = getPendingCourses();
  const categories = COURSE_CATEGORIES.filter((c) => c.id !== "all");
  const categoryCounts = categories.map((cat) => ({
    name: cat.name,
    icon: cat.icon,
    count: approved.filter((c) => c.category === cat.id).length,
  }));

  container.innerHTML = `
    <div class="admin-overview-grid">
      <div class="admin-chart-card reveal revealed">
        <h3>Course Status</h3>
        <div class="admin-bar-chart">
          <div class="bar-row"><span>Approved</span><div class="bar-track"><div class="bar-fill bar-fill--green" style="width:${pct(approved.length, all.length)}%"></div></div><strong>${approved.length}</strong></div>
          <div class="bar-row"><span>Pending</span><div class="bar-track"><div class="bar-fill bar-fill--yellow" style="width:${pct(pending.length, all.length)}%"></div></div><strong>${pending.length}</strong></div>
          <div class="bar-row"><span>Rejected</span><div class="bar-track"><div class="bar-fill bar-fill--red" style="width:${pct(all.filter(c=>c.status==='rejected').length, all.length)}%"></div></div><strong>${all.filter(c=>c.status==='rejected').length}</strong></div>
        </div>
      </div>
      <div class="admin-chart-card reveal revealed">
        <h3>Approved by Category</h3>
        <div class="admin-category-list">
          ${categoryCounts.map(c => `<div class="cat-row"><span>${c.icon} ${c.name}</span><strong>${c.count}</strong></div>`).join("")}
        </div>
      </div>
      <div class="admin-quick-actions reveal revealed">
        <h3>Quick Actions</h3>
        <button class="btn btn-lime btn-sm admin-goto" data-panel="pending">Review Pending (${pending.length})</button>
        <button class="btn btn-outline btn-sm admin-goto" data-panel="all">Manage All Courses</button>
        <button class="btn btn-outline btn-sm admin-goto" data-panel="settings">Platform Settings</button>
        <button class="btn btn-outline btn-sm admin-goto" data-panel="applications">Trainer Applications</button>
        <button class="btn btn-outline btn-sm admin-goto" data-panel="create-trainer">Create Trainer</button>
      </div>
    </div>`;
}

function pct(part, total) {
  if (!total) return 0;
  return Math.max(8, Math.round((part / total) * 100));
}

function renderPendingQueue() {
  const container = document.getElementById("pending-queue");
  if (!container) return;

  const pending = getPendingCourses().sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
  );

  if (!pending.length) {
    container.innerHTML = `
      <div class="dash-empty admin-empty-animate">
        <div class="dash-empty-icon">✅</div>
        <h3>No pending courses</h3>
        <p>All submitted courses have been reviewed.</p>
      </div>`;
    return;
  }

  container.innerHTML = pending
    .map(
      (course, i) => `
    <article class="admin-review-card portal-card-animate" style="animation-delay:${i * 0.06}s">
      <div class="admin-review-top">
        <img src="${course.image}" alt="" loading="lazy">
        <div>
          <div class="admin-review-badges">
            ${renderStatusBadge(course.status)}
            <span class="admin-tag">${course.category.replace("-", " ")}</span>
          </div>
          <h3>${course.title}</h3>
          <p>${course.description}</p>
          <div class="admin-review-meta">
            <span>Trainer: ${course.instructor}</span>
            <span>Price: ${formatPrice(course.price)}</span>
            <span>Submitted: ${new Date(course.submittedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div class="admin-module-preview">
        <strong>Curriculum</strong>
        ${course.modules.map((m) => `<div><span>${m.title}</span> — ${m.lessons.length} lessons</div>`).join("")}
      </div>
      <div class="admin-review-actions">
        <button class="btn btn-lime btn-sm approve-btn" data-id="${course.id}">✓ Approve</button>
        <button class="btn btn-outline btn-sm reject-btn" data-id="${course.id}">✕ Reject</button>
        <a href="course-detail.html?id=${course.id}" class="btn btn-outline btn-sm" target="_blank">Preview</a>
      </div>
    </article>`
    )
    .join("");
}

function renderAllCoursesTable() {
  const tbody = document.getElementById("admin-courses-body");
  if (!tbody) return;

  const search = (document.getElementById("admin-course-search")?.value || "").toLowerCase();
  let courses = getAllCourses().sort((a, b) => {
    const order = { pending: 0, rejected: 1, approved: 2 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  if (search) {
    courses = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(search) ||
        c.instructor.toLowerCase().includes(search) ||
        c.category.includes(search)
    );
  }

  tbody.innerHTML = courses.length
    ? courses
        .map(
          (course) => `
    <tr class="portal-row-animate">
      <td>
        <div class="admin-table-course">
          <img src="${course.image}" alt="" loading="lazy">
          <div>
            <strong>${course.title}</strong>
            <span>${course.instructor}</span>
          </div>
        </div>
      </td>
      <td>${renderStatusBadge(course.status)}</td>
      <td><span class="enrollment-count">${getEnrollmentCount(course.id)}</span> / ${course.studentLimit ?? "∞"}</td>
      <td>${formatPrice(course.price)}</td>
      <td>${course.submittedBy.replace("@asmuthism.com", "")}</td>
      <td class="admin-table-actions">
        <button class="btn btn-outline btn-sm edit-course-btn" data-id="${course.id}">Edit</button>
        ${course.status === "pending" ? `<button class="btn btn-lime btn-sm approve-btn" data-id="${course.id}">Approve</button><button class="btn btn-outline btn-sm reject-btn" data-id="${course.id}">Reject</button>` : course.status === "approved" ? `<button class="btn btn-outline btn-sm reject-btn" data-id="${course.id}">Revoke</button>` : `<button class="btn btn-lime btn-sm approve-btn" data-id="${course.id}">Approve</button>`}
        <button class="btn btn-outline btn-sm delete-btn" data-id="${course.id}">Delete</button>
      </td>
    </tr>`
        )
        .join("")
    : `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray-500)">No courses match your search.</td></tr>`;
}

function renderTrainerApplications() {
  const container = document.getElementById("admin-applications-list");
  if (!container) return;

  const apps = getTrainerApplications().sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
  );

  if (!apps.length) {
    container.innerHTML = `<div class="dash-empty"><p>No trainer applications yet.</p></div>`;
    return;
  }

  container.innerHTML = apps
    .map(
      (app) => `
    <article class="admin-review-card portal-card-animate">
      <div class="admin-review-badges">${renderApplicationStatusBadge(app.status)}</div>
      <h3>${app.name}</h3>
      <p>${app.email}${app.phone ? " · " + app.phone : ""}</p>
      <p><strong>Expertise:</strong> ${app.expertise}</p>
      <p>${app.bio}</p>
      <p class="admin-review-meta"><span>Submitted: ${new Date(app.submittedAt).toLocaleString()}</span></p>
      ${
        app.status === "pending"
          ? `<div class="admin-review-actions">
              <button class="btn btn-lime btn-sm approve-app-btn" data-id="${app.id}">Mark Approved</button>
              <button class="btn btn-outline btn-sm reject-app-btn" data-id="${app.id}">Reject</button>
              <button class="btn btn-outline btn-sm admin-goto" data-panel="create-trainer">Create Account</button>
            </div>`
          : ""
      }
    </article>`
    )
    .join("");
}

function openEditCourseModal(courseId) {
  const course = getCourseById(courseId);
  if (!course) return;

  const modal = document.getElementById("admin-edit-modal");
  const form = document.getElementById("admin-edit-form");
  const categorySelect = document.getElementById("admin-edit-category");

  categorySelect.innerHTML = COURSE_CATEGORIES.filter((c) => c.id !== "all")
    .map((c) => `<option value="${c.id}"${c.id === course.category ? " selected" : ""}>${c.name}</option>`)
    .join("");

  form.courseId.value = course.id;
  form.title.value = course.title;
  form.category.value = course.category;
  form.status.value = course.status;
  form.price.value = course.price;
  form.studentLimit.value = course.studentLimit ?? "";
  form.duration.value = course.duration;
  form.level.value = course.level;
  form.description.value = course.description;
  form.image.value = course.image || "";
  form.modulesText.value = course.modules
    .map((m) => `${m.title} | ${m.lessons.join(", ")}`)
    .join("\n");

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeEditCourseModal() {
  const modal = document.getElementById("admin-edit-modal");
  modal?.classList.add("hidden");
  modal?.setAttribute("aria-hidden", "true");
}

function bindCreateTrainerForm() {
  document.getElementById("create-trainer-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const result = createTrainerAccount({
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value,
    });
    if (result.error) {
      showDashToast(result.error);
      return;
    }
    form.reset();
    showDashToast("Trainer account created successfully.");
    refreshAdminPortal();
  });
}

function bindAdminEditForm() {
  document.getElementById("admin-edit-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    adminUpdateCourse(form.courseId.value, {
      title: form.title.value.trim(),
      category: form.category.value,
      status: form.status.value,
      price: parseFloat(form.price.value) || 0,
      studentLimit: form.studentLimit.value,
      duration: form.duration.value.trim(),
      level: form.level.value.trim(),
      description: form.description.value.trim(),
      image: form.image.value.trim(),
      modulesText: form.modulesText.value,
    });
    closeEditCourseModal();
    showDashToast("Course updated.");
    refreshAdminPortal();
  });

  document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeEditCourseModal);
  });
}

function renderTrainersList() {
  const container = document.getElementById("admin-trainers-list");
  if (!container) return;

  const users = JSON.parse(localStorage.getItem("learnaway_users") || "[]").filter(
    (u) => u.role === "trainer"
  );
  const allCourses = getAllCourses();

  if (!users.length) {
    container.innerHTML = `<div class="dash-empty"><p>No trainers registered yet.</p></div>`;
    return;
  }

  container.innerHTML = users
    .map((trainer) => {
      const courses = allCourses.filter((c) => c.submittedBy === trainer.email);
      const approved = courses.filter((c) => c.status === "approved").length;
      const pending = courses.filter((c) => c.status === "pending").length;
      return `
      <div class="trainer-admin-card portal-card-animate">
        <div class="trainer-admin-avatar">${trainer.name.charAt(0)}</div>
        <div>
          <h4>${trainer.name}</h4>
          <p>${trainer.email}</p>
          <div class="trainer-admin-stats">
            <span>${courses.length} courses</span>
            <span>${approved} approved</span>
            <span>${pending} pending</span>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

function renderLiveSessionsAdmin() {
  const container = document.getElementById("admin-live-list");
  if (!container || typeof getLiveSessions !== "function") return;

  const sessions = getLiveSessions().sort(
    (a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)
  );

  if (!sessions.length) {
    container.innerHTML = `<div class="dash-empty"><p>No live sessions scheduled.</p></div>`;
    return;
  }

  container.innerHTML = sessions
    .slice(0, 12)
    .map(
      (s) => `
    <div class="admin-live-item portal-card-animate">
      <div>
        <strong>${s.title}</strong>
        <p>${s.trainerName} · ${formatSessionDate?.(s.scheduledAt) || new Date(s.scheduledAt).toLocaleDateString()} · ${s.attendees?.length || 0} joined</p>
      </div>
      ${renderLiveBadge?.(getSessionStatus?.(s) || "upcoming") || ""}
    </div>`
    )
    .join("");
}

function loadSettingsForm() {
  const form = document.getElementById("platform-settings-form");
  if (!form) return;
  const s = getPlatformSettings();
  form.siteName.value = s.siteName;
  form.tagline.value = s.tagline;
  form.heroTitle.value = s.heroTitle;
  form.heroSubtitle.value = s.heroSubtitle;
  form.contactEmail.value = s.contactEmail;
  form.announcement.value = s.announcement || "";
  form.maintenanceMode.checked = s.maintenanceMode;
}

function bindAdminSettingsForm() {
  document.getElementById("platform-settings-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    savePlatformSettings({
      siteName: form.siteName.value.trim(),
      tagline: form.tagline.value.trim(),
      heroTitle: form.heroTitle.value.trim(),
      heroSubtitle: form.heroSubtitle.value.trim(),
      contactEmail: form.contactEmail.value.trim(),
      announcement: form.announcement.value.trim(),
      maintenanceMode: form.maintenanceMode.checked,
    });
    applyPlatformSettingsToPage();
    showDashToast("Platform settings saved!");
  });

  document.getElementById("admin-course-search")?.addEventListener("input", () => {
    renderAllCoursesTable();
  });
}

function switchAdminPanel(panelId) {
  if (!panelId) return;
  document.querySelectorAll(".admin-panel").forEach((panel) => {
    const isActive = panel.dataset.panel === panelId;
    panel.classList.toggle("active", isActive);
    panel.classList.toggle("panel-enter", isActive);
  });
  document.querySelectorAll("#portal-sidebar [data-portal-panel]").forEach((b) => {
    b.classList.toggle("active", b.dataset.portalPanel === panelId);
  });
}

function bindAdminEvents() {
  const root = document.getElementById("admin-root");
  if (!root || root.dataset.bound === "true") return;
  root.dataset.bound = "true";

  root.addEventListener("click", (e) => {
    const approveBtn = e.target.closest(".approve-btn");
    if (approveBtn) {
      approveCourse(approveBtn.dataset.id, getUser().email);
      showDashToast("Course approved — now visible to students.");
      refreshAdminPortal();
      return;
    }

    const rejectBtn = e.target.closest(".reject-btn");
    if (rejectBtn) {
      const reason = prompt("Rejection reason (optional):", "Please revise course details and resubmit.");
      if (reason === null) return;
      rejectCourse(rejectBtn.dataset.id, getUser().email, reason);
      showDashToast("Course rejected.");
      refreshAdminPortal();
      return;
    }

    const deleteBtn = e.target.closest(".delete-btn");
    if (deleteBtn) {
      if (confirm("Delete this course permanently?")) {
        deleteCourse(deleteBtn.dataset.id);
        showDashToast("Course deleted.");
        refreshAdminPortal();
      }
      return;
    }

    const editBtn = e.target.closest(".edit-course-btn");
    if (editBtn) {
      openEditCourseModal(editBtn.dataset.id);
      return;
    }

    const approveAppBtn = e.target.closest(".approve-app-btn");
    if (approveAppBtn) {
      updateTrainerApplicationStatus(approveAppBtn.dataset.id, "approved", getUser().email);
      showDashToast("Application marked approved. Create trainer account in Create Trainer panel.");
      refreshAdminPortal();
      return;
    }

    const rejectAppBtn = e.target.closest(".reject-app-btn");
    if (rejectAppBtn) {
      updateTrainerApplicationStatus(rejectAppBtn.dataset.id, "rejected", getUser().email);
      showDashToast("Application rejected.");
      refreshAdminPortal();
      return;
    }

    const gotoBtn = e.target.closest(".admin-goto");
    if (gotoBtn) switchAdminPanel(gotoBtn.dataset.panel);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("admin-root")) initAdminPortal();
});
