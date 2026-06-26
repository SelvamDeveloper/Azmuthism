const DEMO_ACCOUNT = {
  name: "Demo User",
  email: "demo@asmuthism.com",
  password: "demo123",
  role: "student",
};

const DEMO_TRAINER = {
  name: "Alex Rivera",
  email: "trainer@asmuthism.com",
  password: "demo123",
  role: "trainer",
};

const DEMO_ADMIN = {
  name: "Admin User",
  email: "admin@asmuthism.com",
  password: "demo123",
  role: "admin",
};

const DEMO_ENROLLMENTS = [
  { courseId: "fullstack-development", progress: 42 },
  { courseId: "business-strategy", progress: 68 },
  { courseId: "investment-fundamentals", progress: 15 },
];

function seedDemoAccount() {
  const users = JSON.parse(localStorage.getItem("learnaway_users") || "[]");
  const legacy = [
    { email: "demo@learnaway.com", map: DEMO_ACCOUNT },
    { email: "trainer@learnaway.com", map: DEMO_TRAINER },
  ];

  legacy.forEach(({ email, map }) => {
    const idx = users.findIndex((u) => u.email === email);
    if (idx >= 0) users[idx] = { ...map, password: users[idx].password || map.password };
  });

  [DEMO_ACCOUNT, DEMO_TRAINER, DEMO_ADMIN].forEach((account) => {
    if (!users.some((u) => u.email === account.email)) {
      users.push({ ...account });
    }
  });

  localStorage.setItem("learnaway_users", JSON.stringify(users));

  if (!localStorage.getItem("learnaway_demo_seeded")) {
    localStorage.setItem(
      STORAGE_KEYS.enrollments,
      JSON.stringify(
        DEMO_ENROLLMENTS.map((e) => ({
          ...e,
          enrolledAt: new Date().toISOString(),
        }))
      )
    );
    localStorage.setItem("learnaway_demo_seeded", "true");
  }

  seedDemoPendingCourse();
}

function seedDemoPendingCourse() {
  initCourseStore();
  const courses = getAllCourses();
  if (courses.some((c) => c.id === "trainer-demo-pending-course")) return;

  courses.push({
    id: "trainer-demo-pending-course",
    title: "AI for Business Leaders — Live Cohort",
    category: "business",
    price: 249,
    rating: 4.8,
    students: 0,
    duration: "14 hours",
    level: "Intermediate",
    instructor: DEMO_TRAINER.name,
    instructorRole: "Business & AI Strategist",
    instructorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    badge: "New",
    description: "Learn how to integrate AI tools into business workflows, automate decisions, and lead digital transformation in your organization.",
    modules: [
      { title: "AI Foundations for Leaders", lessons: ["AI Landscape", "Use Cases", "Ethics"] },
      { title: "Implementation", lessons: ["Tool Selection", "Team Training", "ROI Tracking"] },
    ],
    status: "pending",
    submittedBy: DEMO_TRAINER.email,
    submittedAt: new Date().toISOString(),
    approvedAt: null,
    approvedBy: null,
    rejectionReason: null,
  });

  saveAllCourses(courses);
}

function loginAsDemo() {
  seedDemoAccount();

  const enrollments = getEnrollments();
  if (enrollments.length === 0) {
    setEnrollments(
      DEMO_ENROLLMENTS.map((e) => ({
        ...e,
        enrolledAt: new Date().toISOString(),
      }))
    );
  }

  setUser({
    name: DEMO_ACCOUNT.name,
    email: DEMO_ACCOUNT.email,
    role: "student",
    isDemo: true,
  });

  redirectAfterLogin();
}

function loginAsDemoTrainer() {
  seedDemoAccount();

  setUser({
    name: DEMO_TRAINER.name,
    email: DEMO_TRAINER.email,
    role: "trainer",
    isDemo: true,
  });

  redirectAfterLogin();
}

function loginAsDemoAdmin() {
  seedDemoAccount();

  setUser({
    name: DEMO_ADMIN.name,
    email: DEMO_ADMIN.email,
    role: "admin",
    isDemo: true,
  });

  redirectAfterLogin();
}

function redirectAfterLogin() {
  const user = getUser();
  let redirect = new URLSearchParams(window.location.search).get("redirect");

  if (!redirect || redirect.startsWith("login.html") || redirect.startsWith("register.html")) {
    redirect = user?.role === "admin" ? "admin.html" : "dashboard.html";
  }

  window.location.href = redirect;
}

function fillDemoCredentials(type = "student") {
  const form = document.getElementById("login-form");
  if (!form) return;
  const account =
    type === "trainer" ? DEMO_TRAINER : type === "admin" ? DEMO_ADMIN : DEMO_ACCOUNT;
  form.email.value = account.email;
  form.password.value = account.password;
}

document.addEventListener("DOMContentLoaded", seedDemoAccount);
