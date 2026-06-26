const TRAINER_APPS_KEY = "learnaway_trainer_applications";

function getTrainerApplications() {
  try {
    return JSON.parse(localStorage.getItem(TRAINER_APPS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTrainerApplications(apps) {
  localStorage.setItem(TRAINER_APPS_KEY, JSON.stringify(apps));
}

function submitTrainerApplication(data) {
  const apps = getTrainerApplications();
  if (apps.some((a) => a.email === data.email && a.status === "pending")) {
    return { error: "You already have a pending application with this email." };
  }

  const users = JSON.parse(localStorage.getItem("learnaway_users") || "[]");
  if (users.some((u) => u.email === data.email)) {
    return { error: "An account with this email already exists." };
  }

  const app = {
    id: "app-" + Date.now().toString(36),
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone?.trim() || "",
    expertise: data.expertise.trim(),
    experience: data.experience?.trim() || "",
    bio: data.bio.trim(),
    linkedin: data.linkedin?.trim() || "",
    status: "pending",
    submittedAt: new Date().toISOString(),
  };

  apps.push(app);
  saveTrainerApplications(apps);
  return { success: true, application: app };
}

function updateTrainerApplicationStatus(appId, status, adminEmail) {
  const apps = getTrainerApplications();
  const app = apps.find((a) => a.id === appId);
  if (!app) return null;
  app.status = status;
  app.reviewedAt = new Date().toISOString();
  app.reviewedBy = adminEmail;
  saveTrainerApplications(apps);
  return app;
}

function createTrainerAccount({ name, email, password }) {
  const users = JSON.parse(localStorage.getItem("learnaway_users") || "[]");
  if (users.some((u) => u.email === email)) {
    return { error: "A user with this email already exists." };
  }

  users.push({ name, email, password, role: "trainer", createdBy: "admin" });
  localStorage.setItem("learnaway_users", JSON.stringify(users));
  return { success: true };
}

function renderApplicationStatusBadge(status) {
  const map = {
    pending: "status-badge status-badge--pending",
    approved: "status-badge status-badge--approved",
    rejected: "status-badge status-badge--rejected",
  };
  const labels = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
  return `<span class="${map[status] || map.pending}">${labels[status] || status}</span>`;
}
