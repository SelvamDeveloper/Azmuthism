const PORTAL_NAV = {
  admin: [
    { panel: "overview", icon: "📊", label: "Overview" },
    { panel: "pending", icon: "⏳", label: "Pending Approvals" },
    { panel: "all", icon: "📚", label: "All Courses" },
    { panel: "trainers", icon: "🎓", label: "Trainers" },
    { panel: "applications", icon: "📝", label: "Trainer Applications" },
    { panel: "create-trainer", icon: "➕", label: "Create Trainer" },
    { panel: "live", icon: "📡", label: "Live Sessions" },
    { panel: "settings", icon: "⚙️", label: "Settings" },
  ],
  trainer: [
    { panel: "courses", icon: "📚", label: "My Courses" },
    { panel: "add", icon: "✏️", label: "Submit Course" },
    { panel: "live", icon: "📡", label: "Live Classes" },
    { panel: "analytics", icon: "📈", label: "Analytics" },
  ],
  student: [
    { panel: "live", icon: "🔴", label: "Live Now" },
    { panel: "upcoming", icon: "📅", label: "Upcoming" },
    { panel: "courses", icon: "📖", label: "My Courses" },
    { href: "courses.html", icon: "🛒", label: "Browse Courses" },
    { href: "checkout.html", icon: "💳", label: "Checkout" },
    { href: "payments.html", icon: "🧾", label: "Payment History" },
  ],
};

function renderPortalSidebar(role, activePanel) {
  const sidebar = document.getElementById("portal-sidebar");
  if (!sidebar) return;

  const items = PORTAL_NAV[role] || PORTAL_NAV.student;
  const user = getUser();
  const portalTitle =
    role === "admin" ? "Admin Portal" : role === "trainer" ? "Trainer Portal" : "Student Portal";

  sidebar.innerHTML = `
    <div class="portal-sidebar-inner">
      <a href="index.html" class="portal-sidebar-logo" aria-label="Asmuthism Home">
        <img src="assets/logo-icon.png" alt="Asmuthism" class="portal-logo-img">
        <span class="logo-name">Asmuthism</span>
      </a>
      <p class="portal-sidebar-label">${portalTitle}</p>
      ${user ? `<p class="portal-sidebar-user">${user.name.split(" ")[0]}</p>` : ""}
      <nav class="portal-sidebar-nav">
        ${items
          .map((item) => {
            if (item.href) {
              const isActive = window.location.pathname.endsWith(item.href.replace(/^\//, ""));
              return `<a href="${item.href}" class="portal-nav-item${isActive ? " active" : ""}"><span>${item.icon}</span>${item.label}</a>`;
            }
            const isActive = activePanel === item.panel;
            return `<button type="button" class="portal-nav-item${isActive ? " active" : ""}" data-portal-panel="${item.panel}"><span>${item.icon}</span>${item.label}</button>`;
          })
          .join("")}
      </nav>
      <div class="portal-sidebar-footer">
        <a href="index.html" class="portal-nav-item"><span>🏠</span>Back to Site</a>
        <button type="button" class="portal-nav-item portal-nav-logout" onclick="logout()"><span>🚪</span>Log Out</button>
      </div>
    </div>
    <button type="button" class="portal-sidebar-toggle" aria-label="Toggle menu">☰</button>`;

  sidebar.querySelector(".portal-sidebar-toggle")?.addEventListener("click", () => {
    document.body.classList.toggle("portal-sidebar-open");
  });

  sidebar.querySelectorAll("[data-portal-panel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.dataset.portalPanel;
      document.body.classList.remove("portal-sidebar-open");

      if (role === "admin" && typeof switchAdminPanel === "function") {
        switchAdminPanel(panel);
        sidebar.querySelectorAll("[data-portal-panel]").forEach((b) => b.classList.toggle("active", b.dataset.portalPanel === panel));
        return;
      }

      if (role === "trainer") {
        document.querySelector(`.trainer-main-tabs [data-trainer-panel="${panel}"]`)?.click();
      } else if (role === "student") {
        document.querySelector(`.dash-tabs [data-tab="${panel}"]`)?.click();
      }

      sidebar.querySelectorAll("[data-portal-panel]").forEach((b) => b.classList.toggle("active", b.dataset.portalPanel === panel));
    });
  });
}

function initPortalLayout(role, activePanel = null) {
  renderPortalSidebar(role, activePanel);
  document.body.classList.add("has-portal-sidebar");
}
