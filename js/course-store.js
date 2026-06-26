const COURSE_STORE_KEY = "asmuthism_courses";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function initCourseStore() {
  if (!localStorage.getItem(COURSE_STORE_KEY)) {
    const seeded = COURSES.map((course) => ({
      ...course,
      status: "approved",
      submittedBy: "system@asmuthism.com",
      submittedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: "system@asmuthism.com",
      studentLimit: 100,
    }));
    localStorage.setItem(COURSE_STORE_KEY, JSON.stringify(seeded));
  } else {
    migrateCourseStore();
  }
}

function migrateCourseStore() {
  const courses = JSON.parse(localStorage.getItem(COURSE_STORE_KEY) || "[]");
  let changed = false;
  courses.forEach((c) => {
    if (c.studentLimit === undefined) {
      c.studentLimit = 100;
      changed = true;
    }
  });
  if (changed) localStorage.setItem(COURSE_STORE_KEY, JSON.stringify(courses));
}

function getAllCourses() {
  initCourseStore();
  try {
    const courses = JSON.parse(localStorage.getItem(COURSE_STORE_KEY)) || [];
    return courses.map((c) => ({ studentLimit: c.studentLimit ?? null, ...c }));
  } catch {
    return [];
  }
}

function saveAllCourses(courses) {
  localStorage.setItem(COURSE_STORE_KEY, JSON.stringify(courses));
}

function getApprovedCourses() {
  return getAllCourses().filter((c) => c.status === "approved");
}

function getPendingCourses() {
  return getAllCourses().filter((c) => c.status === "pending");
}

function getCoursesByTrainer(email) {
  return getAllCourses().filter((c) => c.submittedBy === email);
}

function getTrainerScheduleCourses(email) {
  return getAllCourses().filter(
    (c) => c.submittedBy === email && (c.status === "approved" || c.status === "pending")
  );
}

function getCourseById(id) {
  return getAllCourses().find((c) => c.id === id) || null;
}

function getApprovedCourseById(id) {
  const course = getCourseById(id);
  return course && course.status === "approved" ? course : null;
}

function parseModulesFromText(text) {
  if (!text.trim()) {
    return [{ title: "Module 1", lessons: ["Introduction"] }];
  }

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [title, lessonsPart] = line.split("|");
      const lessons = lessonsPart
        ? lessonsPart.split(",").map((l) => l.trim()).filter(Boolean)
        : ["Lesson 1", "Lesson 2"];
      return {
        title: title.trim() || `Module ${index + 1}`,
        lessons,
      };
    });
}

function buildCoursePayload(formData, trainer) {
  const title = formData.title.trim();
  const id = formData.id || `${slugify(title)}-${Date.now().toString(36)}`;

  return {
    id,
    title,
    category: formData.category,
    price: parseFloat(formData.price) || 0,
    rating: parseFloat(formData.rating) || 4.5,
    students: parseInt(formData.students, 10) || 0,
    duration: formData.duration.trim() || "10 hours",
    level: formData.level || "Beginner",
    instructor: trainer.name,
    instructorRole: formData.instructorRole?.trim() || "Course Instructor",
    instructorImage:
      formData.instructorImage?.trim() ||
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    image:
      formData.image?.trim() ||
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
    badge: formData.badge?.trim() || null,
    description: formData.description.trim(),
    modules: parseModulesFromText(formData.modulesText || ""),
    status: "pending",
    submittedBy: trainer.email,
    submittedAt: new Date().toISOString(),
    approvedAt: null,
    approvedBy: null,
    rejectionReason: null,
  };
}

function submitCourse(formData, trainer) {
  const courses = getAllCourses();
  const payload = buildCoursePayload(formData, trainer);

  if (courses.some((c) => c.id === payload.id && c.submittedBy !== trainer.email)) {
    payload.id = `${payload.id}-${Date.now().toString(36)}`;
  }

  const existingIndex = formData.editId
    ? courses.findIndex((c) => c.id === formData.editId && c.submittedBy === trainer.email)
    : -1;

  if (existingIndex >= 0) {
    const existing = courses[existingIndex];
    courses[existingIndex] = {
      ...existing,
      ...payload,
      id: existing.id,
      status: "pending",
      submittedAt: new Date().toISOString(),
      approvedAt: null,
      approvedBy: null,
      rejectionReason: null,
    };
  } else {
    courses.push(payload);
  }

  saveAllCourses(courses);
  return courses[existingIndex >= 0 ? existingIndex : courses.length - 1];
}

function approveCourse(courseId, adminEmail) {
  const courses = getAllCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return null;

  course.status = "approved";
  course.approvedAt = new Date().toISOString();
  course.approvedBy = adminEmail;
  course.rejectionReason = null;
  saveAllCourses(courses);
  return course;
}

function rejectCourse(courseId, adminEmail, reason) {
  const courses = getAllCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return null;

  course.status = "rejected";
  course.approvedAt = null;
  course.approvedBy = adminEmail;
  course.rejectionReason = reason || "Course needs revisions before approval.";
  saveAllCourses(courses);
  return course;
}

function deleteCourse(courseId) {
  saveAllCourses(getAllCourses().filter((c) => c.id !== courseId));
}

function getEnrollmentCount(courseId) {
  return getEnrollments().filter((e) => e.courseId === courseId).length;
}

function getSeatsRemaining(course) {
  if (!course || course.studentLimit == null) return null;
  return Math.max(0, course.studentLimit - getEnrollmentCount(course.id));
}

function isCourseFull(courseId) {
  const course = getCourseById(courseId);
  if (!course || course.studentLimit == null) return false;
  return getEnrollmentCount(courseId) >= course.studentLimit;
}

function canEnrollInCourse(courseId, userEmail) {
  const course = getApprovedCourseById(courseId);
  if (!course) return false;
  if (isEnrolled(courseId)) return false;
  if (isCourseFull(courseId)) return false;
  return true;
}

function adminUpdateCourse(courseId, updates) {
  const courses = getAllCourses();
  const index = courses.findIndex((c) => c.id === courseId);
  if (index < 0) return null;

  const course = courses[index];
  const allowed = [
    "title", "category", "price", "duration", "level", "description",
    "image", "badge", "instructor", "instructorRole", "status", "studentLimit",
  ];

  allowed.forEach((key) => {
    if (updates[key] !== undefined) course[key] = updates[key];
  });

  if (updates.modulesText) {
    course.modules = parseModulesFromText(updates.modulesText);
  }

  if (updates.studentLimit !== undefined) {
    const limit = updates.studentLimit === "" || updates.studentLimit === null
      ? null
      : parseInt(updates.studentLimit, 10);
    course.studentLimit = Number.isFinite(limit) && limit > 0 ? limit : null;
  }

  course.updatedAt = new Date().toISOString();
  courses[index] = course;
  saveAllCourses(courses);
  return course;
}

function renderSeatsBadge(course) {
  if (course.studentLimit == null) return "";
  const remaining = getSeatsRemaining(course);
  const full = remaining === 0;
  return `<span class="seats-badge${full ? " seats-badge--full" : ""}">${full ? "Full" : `${remaining} seats left`}</span>`;
}

function renderStatusBadge(status) {
  const map = {
    approved: { label: "Approved", className: "status-badge status-badge--approved" },
    pending: { label: "Pending Review", className: "status-badge status-badge--pending" },
    rejected: { label: "Rejected", className: "status-badge status-badge--rejected" },
  };
  const item = map[status] || map.pending;
  return `<span class="${item.className}">${item.label}</span>`;
}

document.addEventListener("DOMContentLoaded", initCourseStore);
