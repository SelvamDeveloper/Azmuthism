const LIVE_STORAGE_KEY = "learnaway_live_sessions";

function getLiveSessions() {
  try {
    return JSON.parse(localStorage.getItem(LIVE_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function setLiveSessions(sessions) {
  localStorage.setItem(LIVE_STORAGE_KEY, JSON.stringify(sessions));
}

function generateId() {
  return "live-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function parseSessionTime(session) {
  return new Date(session.scheduledAt).getTime();
}

function getSessionEndTime(session) {
  return parseSessionTime(session) + (session.durationMinutes || 60) * 60000;
}

function getSessionStatus(session) {
  const now = Date.now();
  const start = parseSessionTime(session);
  const end = getSessionEndTime(session);
  if (now >= start && now <= end) return "live";
  if (now < start) return "upcoming";
  return "past";
}

function formatSessionDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatSessionTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatCountdown(iso) {
  const diff = parseSessionTime({ scheduledAt: iso }) - Date.now();
  if (diff <= 0) return "Starting now";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `In ${Math.floor(hours / 24)} days`;
  if (hours > 0) return `In ${hours}h ${mins}m`;
  return `In ${mins}m`;
}

function getSessionsForStudent(userEmail) {
  const enrolledIds = getEnrollments().map((e) => e.courseId);
  return getLiveSessions()
    .filter((s) => enrolledIds.includes(s.courseId))
    .sort((a, b) => parseSessionTime(a) - parseSessionTime(b));
}

function getSessionsForTrainer(trainerEmail) {
  return getLiveSessions()
    .filter((s) => s.trainerEmail === trainerEmail)
    .sort((a, b) => parseSessionTime(a) - parseSessionTime(b));
}

function joinLiveSession(sessionId, userEmail) {
  const sessions = getLiveSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  if (!session.attendees.includes(userEmail)) {
    session.attendees.push(userEmail);
    setLiveSessions(sessions);
  }

  return session.meetingLink;
}

function createLiveSession(data) {
  const sessions = getLiveSessions();
  const session = {
    id: generateId(),
    courseId: data.courseId,
    title: data.title,
    trainerEmail: data.trainerEmail,
    trainerName: data.trainerName,
    scheduledAt: data.scheduledAt,
    durationMinutes: parseInt(data.durationMinutes, 10) || 60,
    meetingLink: data.meetingLink,
    attendees: [],
    createdAt: new Date().toISOString(),
  };
  sessions.push(session);
  setLiveSessions(sessions);
  return session;
}

function deleteLiveSession(sessionId, trainerEmail) {
  const sessions = getLiveSessions().filter(
    (s) => !(s.id === sessionId && s.trainerEmail === trainerEmail)
  );
  setLiveSessions(sessions);
}

function seedLiveSessions() {
  if (localStorage.getItem("learnaway_live_seeded")) return;

  const now = Date.now();
  const sessions = [
    {
      id: "live-demo-1",
      courseId: "fullstack-development",
      title: "React Hooks & State Management Live Lab",
      trainerEmail: "trainer@asmuthism.com",
      trainerName: "Alex Rivera",
      scheduledAt: new Date(now - 20 * 60000).toISOString(),
      durationMinutes: 90,
      meetingLink: "https://meet.google.com/learnaway-fullstack-live",
      attendees: ["demo@asmuthism.com"],
      createdAt: new Date().toISOString(),
    },
    {
      id: "live-demo-2",
      courseId: "business-strategy",
      title: "Leadership Workshop: Team Building Live",
      trainerEmail: "trainer@asmuthism.com",
      trainerName: "James Mitchell",
      scheduledAt: new Date(now + 2 * 3600000).toISOString(),
      durationMinutes: 60,
      meetingLink: "https://meet.google.com/learnaway-business-live",
      attendees: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "live-demo-3",
      courseId: "investment-fundamentals",
      title: "Portfolio Analysis Live Session",
      trainerEmail: "trainer@asmuthism.com",
      trainerName: "Emily Watson",
      scheduledAt: new Date(now + 26 * 3600000).toISOString(),
      durationMinutes: 75,
      meetingLink: "https://meet.google.com/learnaway-investment-live",
      attendees: ["demo@asmuthism.com"],
      createdAt: new Date().toISOString(),
    },
    {
      id: "live-demo-4",
      courseId: "fullstack-development",
      title: "Node.js API Building — Group Practice",
      trainerEmail: "trainer@asmuthism.com",
      trainerName: "Alex Rivera",
      scheduledAt: new Date(now + 48 * 3600000).toISOString(),
      durationMinutes: 90,
      meetingLink: "https://meet.google.com/learnaway-nodejs-live",
      attendees: [],
      createdAt: new Date().toISOString(),
    },
  ];

  setLiveSessions(sessions);
  localStorage.setItem("learnaway_live_seeded", "true");
}

function renderLiveBadge(status) {
  if (status === "live") {
    return `<span class="live-badge live-badge--active"><span class="live-pulse"></span> LIVE NOW</span>`;
  }
  if (status === "upcoming") {
    return `<span class="live-badge live-badge--upcoming">Upcoming</span>`;
  }
  return `<span class="live-badge live-badge--past">Completed</span>`;
}

function renderSessionCard(session, { isTrainer = false, userEmail = "" } = {}) {
  const course = getCourseById(session.courseId);
  const status = getSessionStatus(session);
  const attendeeCount = session.attendees.length;
  const isJoined = session.attendees.includes(userEmail);

  return `
    <article class="live-card live-card--${status}" data-id="${session.id}">
      <div class="live-card-top">
        ${renderLiveBadge(status)}
        <span class="live-card-time">${formatSessionDate(session.scheduledAt)} · ${formatSessionTime(session.scheduledAt)}</span>
      </div>
      <h3 class="live-card-title">${session.title}</h3>
      <p class="live-card-course">${course ? course.title : "Course"}</p>
      <div class="live-card-meta">
        <span>👤 ${session.trainerName}</span>
        <span>⏱ ${session.durationMinutes} min</span>
        <span>👥 ${attendeeCount} student${attendeeCount !== 1 ? "s" : ""} joined</span>
      </div>
      ${
        status === "live" || status === "upcoming"
          ? `<div class="live-card-link">
              <span class="link-label">Class link</span>
              <code>${session.meetingLink.replace("https://", "")}</code>
            </div>`
          : ""
      }
      <div class="live-card-actions">
        ${
          isTrainer
            ? `
          <button type="button" class="btn btn-outline btn-sm" onclick="copyClassLink('${session.id}')">Copy Link</button>
          <button type="button" class="btn btn-outline btn-sm live-delete-btn" data-id="${session.id}">Delete</button>
          ${
            status === "live" || status === "upcoming"
              ? `<a href="${session.meetingLink}" target="_blank" rel="noopener" class="btn btn-lime btn-sm">Start Class</a>`
              : ""
          }`
            : status === "live"
              ? `<a href="#" class="btn btn-lime btn-sm join-live-btn" data-id="${session.id}">${isJoined ? "Rejoin Live" : "Join Live Class"}</a>`
              : status === "upcoming"
                ? `<button type="button" class="btn btn-outline btn-sm join-live-btn" data-id="${session.id}" disabled title="Available when live">Notify Me</button>
                   <span class="live-countdown">${formatCountdown(session.scheduledAt)}</span>`
                : `<span class="live-completed-tag">✓ Attended</span>`
        }
      </div>
    </article>`;
}

function initLiveDashboard() {
  if (!requireAuth()) return;

  seedLiveSessions();

  const user = getUser();
  if (user.role === "admin") {
    window.location.href = "admin.html";
    return;
  }

  const isTrainer = user.role === "trainer";
  const root = document.getElementById("dashboard-root");
  if (!root) return;

  if (isTrainer) {
    renderTrainerDashboard(root, user);
  } else {
    renderStudentDashboard(root, user);
  }

  initPortalLayout(isTrainer ? "trainer" : "student", isTrainer ? "courses" : "live");
  bindLiveEvents(user, isTrainer);
}

function renderStudentDashboard(root, user) {
  const sessions = getSessionsForStudent(user.email);
  const liveSessions = sessions.filter((s) => getSessionStatus(s) === "live");
  const upcomingSessions = sessions.filter((s) => getSessionStatus(s) === "upcoming");
  const enrollments = getEnrollments();
  const nextSession = liveSessions[0] || upcomingSessions[0];

  root.innerHTML = `
    <div class="dash-hero ${liveSessions.length ? "dash-hero--live" : ""} portal-fade-in">
      <div class="dash-hero-content">
        <p class="dash-hero-label">${liveSessions.length ? "🔴 Live class in progress" : "📅 Your next live session"}</p>
        <h1>${liveSessions.length ? "Join your group class now!" : nextSession ? nextSession.title : "No live classes scheduled"}</h1>
        <p class="dash-hero-sub">${nextSession ? `${formatSessionDate(nextSession.scheduledAt)} at ${formatSessionTime(nextSession.scheduledAt)} · ${nextSession.trainerName}` : "Enroll in a course to access live group sessions with trainers."}</p>
        ${
          liveSessions.length
            ? `<a href="#" class="btn btn-lime btn-lg join-live-btn" data-id="${liveSessions[0].id}">Join Live Class →</a>`
            : nextSession
              ? `<span class="dash-countdown">${formatCountdown(nextSession.scheduledAt)}</span>`
              : `<a href="courses.html" class="btn btn-white btn-lg">Browse Courses</a>`
        }
      </div>
      <div class="dash-hero-stats">
        <div class="dash-hero-stat"><strong>${liveSessions.length}</strong><span>Live Now</span></div>
        <div class="dash-hero-stat"><strong>${upcomingSessions.length}</strong><span>Upcoming</span></div>
        <div class="dash-hero-stat"><strong>${enrollments.length}</strong><span>My Courses</span></div>
      </div>
    </div>

    <div class="dash-tabs" role="tablist">
      <button class="dash-tab active" data-tab="live">Live Now ${liveSessions.length ? `(${liveSessions.length})` : ""}</button>
      <button class="dash-tab" data-tab="upcoming">Upcoming</button>
      <button class="dash-tab" data-tab="courses">My Courses</button>
    </div>

    <div class="dash-panel active" data-panel="live">
      <div class="live-grid" id="student-live-grid">
        ${liveSessions.length ? liveSessions.map((s) => renderSessionCard(s, { userEmail: user.email })).join("") : `<div class="dash-empty"><div class="dash-empty-icon">📡</div><h3>No live classes right now</h3><p>Check upcoming sessions or browse courses to join group classes.</p></div>`}
      </div>
    </div>
    <div class="dash-panel" data-panel="upcoming">
      <div class="live-grid" id="student-upcoming-grid">
        ${upcomingSessions.length ? upcomingSessions.map((s) => renderSessionCard(s, { userEmail: user.email })).join("") : `<div class="dash-empty"><div class="dash-empty-icon">📅</div><h3>No upcoming sessions</h3><p>Your trainer will schedule new live classes soon.</p></div>`}
      </div>
    </div>
    <div class="dash-panel" data-panel="courses">
      <div class="course-progress-grid" id="student-courses-grid"></div>
    </div>
  `;

  renderStudentCourses(user);
}

function renderStudentCourses(user) {
  const grid = document.getElementById("student-courses-grid");
  if (!grid) return;
  const enrollments = getEnrollments();

  if (!enrollments.length) {
    grid.innerHTML = `<div class="dash-empty"><div class="dash-empty-icon">📚</div><h3>No enrolled courses</h3><a href="courses.html" class="btn btn-lime">Browse Courses</a></div>`;
    return;
  }

  grid.innerHTML = enrollments
    .map((e) => {
      const course = getCourseById(e.courseId);
      if (!course) return "";
      const courseSessions = getSessionsForStudent(user.email).filter((s) => s.courseId === course.id);
      const nextLive = courseSessions.find((s) => getSessionStatus(s) !== "past");
      return `
      <div class="course-progress-card">
        <img src="${course.image}" alt="">
        <div class="course-progress-body">
          <h4>${course.title}</h4>
          <p>${course.instructor}</p>
          <div class="progress-bar"><div class="progress-fill" style="width:${e.progress}%"></div></div>
          <div class="course-progress-footer">
            <span>${e.progress}% complete</span>
            ${nextLive ? `<span class="next-live-tag">${getSessionStatus(nextLive) === "live" ? "🔴 Live" : "📅 " + formatCountdown(nextLive.scheduledAt)}</span>` : ""}
          </div>
        </div>
        <a href="course-detail.html?id=${course.id}" class="btn btn-outline btn-sm">Open</a>
      </div>`;
    })
    .join("");
}

function renderTrainerDashboard(root, user) {
  const sessions = getSessionsForTrainer(user.email);
  const myCourses = getCoursesByTrainer(user.email);
  const liveCount = sessions.filter((s) => getSessionStatus(s) === "live").length;
  const upcomingCount = sessions.filter((s) => getSessionStatus(s) === "upcoming").length;
  const pendingCourses = myCourses.filter((c) => c.status === "pending").length;
  const scheduleCourses = getTrainerScheduleCourses(user.email);

  root.innerHTML = `
    <div class="dash-hero dash-hero--trainer portal-fade-in">
      <div class="dash-hero-content">
        <p class="dash-hero-label">🎓 Trainer Portal</p>
        <h1>Welcome, ${user.name.split(" ")[0]}!</h1>
        <p class="dash-hero-sub">Submit courses for admin approval, schedule live group classes, and share meeting links.</p>
      </div>
      <div class="dash-hero-stats">
        <div class="dash-hero-stat"><strong>${myCourses.length}</strong><span>My Courses</span></div>
        <div class="dash-hero-stat"><strong>${pendingCourses}</strong><span>Pending</span></div>
        <div class="dash-hero-stat"><strong>${liveCount}</strong><span>Live Now</span></div>
        <div class="dash-hero-stat"><strong>${upcomingCount}</strong><span>Scheduled</span></div>
      </div>
    </div>

    <div class="dash-tabs trainer-main-tabs">
      <button class="dash-tab active" data-trainer-panel="courses">My Courses</button>
      <button class="dash-tab" data-trainer-panel="add">Add / Update</button>
      <button class="dash-tab" data-trainer-panel="live">Live Classes</button>
      <button class="dash-tab" data-trainer-panel="analytics">Analytics</button>
    </div>

    <section class="dash-panel active" data-trainer-panel="courses">
      <div id="trainer-courses-list" class="trainer-course-list"></div>
    </section>

    <section class="dash-panel" data-trainer-panel="add">
      <div class="trainer-layout trainer-layout--single">
        <aside class="schedule-panel">
          <h2>📝 Submit Course for Approval</h2>
          <p style="color:var(--gray-500);font-size:0.875rem;margin-bottom:20px">Courses appear to students only after admin approval.</p>
          <form id="course-form" class="schedule-form">
            <input type="hidden" name="editId" id="course-edit-id">
            <div class="form-group">
              <label>Course Title</label>
              <input type="text" name="title" placeholder="e.g. Advanced 3D Printing Workshop" required>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>Category</label>
                <select name="category" required>
                  ${COURSE_CATEGORIES.filter((c) => c.id !== "all").map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}
                </select>
              </div>
              <div class="form-group">
                <label>Level</label>
                <select name="level">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>All Levels</option>
                </select>
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>Price ($)</label>
                <input type="number" name="price" min="0" step="1" value="99" required>
              </div>
              <div class="form-group">
                <label>Duration</label>
                <input type="text" name="duration" placeholder="12 hours" required>
              </div>
            </div>
            <div class="form-group">
              <label>Cover Image URL</label>
              <input type="url" name="image" placeholder="https://images.unsplash.com/...">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea name="description" rows="3" placeholder="What students will learn..." required></textarea>
            </div>
            <div class="form-group">
              <label>Curriculum (one module per line, use | for lessons)</label>
              <textarea name="modulesText" rows="4" placeholder="Module 1: Intro | Lesson A, Lesson B&#10;Module 2: Advanced | Lesson C, Lesson D"></textarea>
            </div>
            <button type="submit" class="btn btn-lime btn-lg" style="width:100%">Submit for Admin Approval</button>
          </form>
        </aside>
      </div>
    </section>

    <section class="dash-panel" data-trainer-panel="live">
      <div class="trainer-layout">
        <aside class="schedule-panel">
          <h2>📅 Schedule Live Class</h2>
          <form id="schedule-form" class="schedule-form">
            <div class="form-group">
              <label>Course</label>
              <select name="courseId" required>
                ${
                  scheduleCourses.length
                    ? scheduleCourses.map((c) => `<option value="${c.id}">${c.title} (${c.status})</option>`).join("")
                    : `<option value="">Add a course first</option>`
                }
              </select>
            </div>
            <div class="form-group">
              <label>Class Title</label>
              <input type="text" name="title" placeholder="e.g. Live Q&A Session" required>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>Date</label>
                <input type="date" name="date" required>
              </div>
              <div class="form-group">
                <label>Time</label>
                <input type="time" name="time" required>
              </div>
            </div>
            <div class="form-group">
              <label>Duration (minutes)</label>
              <input type="number" name="durationMinutes" value="60" min="15" max="180">
            </div>
            <div class="form-group">
              <label>Class / Meeting Link</label>
              <input type="url" name="meetingLink" placeholder="https://meet.google.com/your-class-link" required>
            </div>
            <button type="submit" class="btn btn-lime btn-lg" style="width:100%">Schedule Class</button>
          </form>
        </aside>
        <main class="trainer-sessions">
          <div class="trainer-sessions-header">
            <h2>Your Live Sessions</h2>
            <div class="dash-tabs dash-tabs--inline">
              <button class="dash-tab active" data-trainer-tab="all">All</button>
              <button class="dash-tab" data-trainer-tab="live">Live</button>
              <button class="dash-tab" data-trainer-tab="upcoming">Upcoming</button>
            </div>
          </div>
          <div class="live-grid" id="trainer-sessions-grid"></div>
        </main>
      </div>
    </section>

    <section class="dash-panel" data-trainer-panel="analytics">
      <div id="trainer-analytics" class="trainer-analytics-grid"></div>
    </section>
  `;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  root.querySelector('input[name="date"]')?.setAttribute("value", tomorrow.toISOString().split("T")[0]);
  root.querySelector('input[name="time"]')?.setAttribute("value", "10:00");

  renderTrainerCourses(user);
  renderTrainerSessions(user, "all");
  renderTrainerAnalytics(user);
}

function renderTrainerAnalytics(user) {
  const container = document.getElementById("trainer-analytics");
  if (!container) return;

  const allCourses = getCoursesByTrainer(user.email);
  const approved = allCourses.filter((c) => c.status === "approved");
  const pending = allCourses.filter((c) => c.status === "pending");
  const rejected = allCourses.filter((c) => c.status === "rejected");
  const enrollments = getEnrollments();
  const sessions = getSessionsForTrainer(user.email);

  let totalStudents = 0;
  let revenue = 0;
  approved.forEach((c) => {
    const count = enrollments.filter((e) => e.courseId === c.id).length;
    totalStudents += count;
    revenue += count * c.price;
  });

  const liveNow = sessions.filter((s) => getSessionStatus(s) === "live").length;
  const approvalRate = allCourses.length
    ? Math.round((approved.length / allCourses.length) * 100)
    : 0;

  container.innerHTML = `
    <div class="analytics-card portal-card-animate">
      <span class="analytics-icon">👥</span>
      <strong>${totalStudents}</strong>
      <span>Enrolled students</span>
    </div>
    <div class="analytics-card portal-card-animate" style="animation-delay:0.05s">
      <span class="analytics-icon">✅</span>
      <strong>${approved.length}</strong>
      <span>Approved courses</span>
    </div>
    <div class="analytics-card portal-card-animate" style="animation-delay:0.1s">
      <span class="analytics-icon">⏳</span>
      <strong>${pending.length}</strong>
      <span>Pending review</span>
    </div>
    <div class="analytics-card portal-card-animate" style="animation-delay:0.15s">
      <span class="analytics-icon">📡</span>
      <strong>${liveNow}</strong>
      <span>Live now</span>
    </div>
    <div class="analytics-card portal-card-animate" style="animation-delay:0.2s">
      <span class="analytics-icon">💰</span>
      <strong>${formatPrice(revenue)}</strong>
      <span>Est. revenue</span>
    </div>
    <div class="analytics-card portal-card-animate" style="animation-delay:0.25s">
      <span class="analytics-icon">📊</span>
      <strong>${approvalRate}%</strong>
      <span>Approval rate</span>
    </div>
    <div class="analytics-wide portal-card-animate" style="animation-delay:0.3s">
      <h3>Course performance</h3>
      ${
        approved.length
          ? approved
              .map((c) => {
                const count = enrollments.filter((e) => e.courseId === c.id).length;
                const pct = totalStudents ? Math.round((count / totalStudents) * 100) : 0;
                return `<div class="bar-row"><span>${c.title}</span><div class="bar-track"><div class="bar-fill bar-fill--green" style="width:${Math.max(pct, 8)}%"></div></div><strong>${count}</strong></div>`;
              })
              .join("")
          : `<p class="analytics-empty">No approved courses yet. Submit a course and wait for admin approval.</p>`
      }
      ${
        rejected.length
          ? `<p class="rejection-note" style="margin-top:16px">${rejected.length} rejected course(s) — edit and resubmit from My Courses.</p>`
          : ""
      }
    </div>`;
}

function renderTrainerCourses(user) {
  const list = document.getElementById("trainer-courses-list");
  if (!list) return;

  const courses = getCoursesByTrainer(user.email);

  if (!courses.length) {
    list.innerHTML = `<div class="dash-empty"><div class="dash-empty-icon">📚</div><h3>No courses yet</h3><p>Go to <strong>Add / Update</strong> to submit your first course for admin approval.</p></div>`;
    return;
  }

  list.innerHTML = courses
    .map(
      (course) => `
    <article class="trainer-course-card portal-card-animate">
      <img src="${course.image}" alt="">
      <div class="trainer-course-body">
        <div class="trainer-course-top">
          ${renderStatusBadge(course.status)}
          <span class="admin-tag">${course.category.replace("-", " ")}</span>
        </div>
        <h3>${course.title}</h3>
        <p>${course.description.slice(0, 120)}${course.description.length > 120 ? "..." : ""}</p>
        <div class="trainer-course-meta">
          <span>${formatPrice(course.price)}</span>
          <span>${course.duration}</span>
          <span>${course.level}</span>
        </div>
        ${
          course.status === "rejected" && course.rejectionReason
            ? `<p class="rejection-note">Admin note: ${course.rejectionReason}</p>`
            : ""
        }
        ${
          course.status === "approved"
            ? `<p class="approved-note">✓ Visible to all students</p>`
            : `<p class="pending-note">⏳ Waiting for admin approval</p>`
        }
      </div>
      <div class="trainer-course-actions">
        ${
          course.status !== "pending"
            ? `<button class="btn btn-outline btn-sm edit-course-btn" data-id="${course.id}">Edit & Resubmit</button>`
            : `<button class="btn btn-outline btn-sm edit-course-btn" data-id="${course.id}">Edit</button>`
        }
        <a href="course-detail.html?id=${course.id}" class="btn btn-outline btn-sm">Preview</a>
      </div>
    </article>`
    )
    .join("");
}

function renderTrainerSessions(user, filter) {
  const grid = document.getElementById("trainer-sessions-grid");
  if (!grid) return;

  let sessions = getSessionsForTrainer(user.email);
  if (filter === "live") sessions = sessions.filter((s) => getSessionStatus(s) === "live");
  if (filter === "upcoming") sessions = sessions.filter((s) => getSessionStatus(s) === "upcoming");

  grid.innerHTML = sessions.length
    ? sessions.map((s) => renderSessionCard(s, { isTrainer: true, userEmail: user.email })).join("")
    : `<div class="dash-empty"><div class="dash-empty-icon">📅</div><h3>No sessions yet</h3><p>Use the form to schedule your first live group class.</p></div>`;
}

function bindLiveEvents(user, isTrainer) {
  document.querySelectorAll(".dash-tab:not([data-trainer-tab])").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".dash-tab:not([data-trainer-tab])").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      document.querySelectorAll(".dash-panel").forEach((p) => {
        p.classList.toggle("active", p.dataset.panel === target);
      });
    });
  });

  document.querySelectorAll("[data-trainer-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("[data-trainer-tab]").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      renderTrainerSessions(user, tab.dataset.trainerTab);
    });
  });

  document.querySelectorAll(".trainer-main-tabs [data-trainer-panel]").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".trainer-main-tabs .dash-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll("[data-trainer-panel]").forEach((panel) => {
        if (panel.tagName === "SECTION") {
          panel.classList.toggle("active", panel.dataset.trainerPanel === tab.dataset.trainerPanel);
        }
      });
    });
  });

  document.getElementById("course-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    submitCourse(
      {
        editId: form.editId.value,
        title: form.title.value,
        category: form.category.value,
        level: form.level.value,
        price: form.price.value,
        duration: form.duration.value,
        image: form.image.value,
        description: form.description.value,
        modulesText: form.modulesText.value,
      },
      user
    );
    form.reset();
    form.editId.value = "";
    showDashToast("Course submitted! Admin will review before it goes live.");
    renderTrainerCourses(user);
    renderTrainerAnalytics(user);
    document.querySelector('[data-trainer-panel="courses"]')?.click();
  });

  document.getElementById("schedule-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const scheduledAt = new Date(`${form.date.value}T${form.time.value}`).toISOString();

    createLiveSession({
      courseId: form.courseId.value,
      title: form.title.value.trim(),
      trainerEmail: user.email,
      trainerName: user.name,
      scheduledAt,
      durationMinutes: form.durationMinutes.value,
      meetingLink: form.meetingLink.value.trim(),
    });

    form.title.value = "";
    form.meetingLink.value = "";
    renderTrainerSessions(user, "all");
    showDashToast("Live class scheduled successfully!");
  });

  document.getElementById("dashboard-root")?.addEventListener("click", (e) => {
    const joinBtn = e.target.closest(".join-live-btn");
    if (joinBtn && !joinBtn.disabled) {
      e.preventDefault();
      const link = joinLiveSession(joinBtn.dataset.id, user.email);
      if (link) {
        showDashToast("Joining live class...");
        setTimeout(() => window.open(link, "_blank"), 400);
        if (!isTrainer) initLiveDashboard();
      }
    }

    const deleteBtn = e.target.closest(".live-delete-btn");
    if (deleteBtn) {
      deleteLiveSession(deleteBtn.dataset.id, user.email);
      renderTrainerSessions(user, "all");
      showDashToast("Session removed.");
      return;
    }

    const editCourseBtn = e.target.closest(".edit-course-btn");
    if (editCourseBtn) {
      const course = getCourseById(editCourseBtn.dataset.id);
      if (!course) return;
      document.querySelector('.trainer-main-tabs [data-trainer-panel="add"]')?.click();
      const form = document.getElementById("course-form");
      if (!form) return;
      form.editId.value = course.id;
      form.title.value = course.title;
      form.category.value = course.category;
      form.level.value = course.level;
      form.price.value = course.price;
      form.duration.value = course.duration;
      form.image.value = course.image;
      form.description.value = course.description;
      form.modulesText.value = course.modules
        .map((m) => `${m.title} | ${m.lessons.join(", ")}`)
        .join("\n");
      showDashToast("Course loaded for editing.");
    }
  });
}

function copyClassLink(sessionId) {
  const session = getLiveSessions().find((s) => s.id === sessionId);
  if (!session) return;
  navigator.clipboard?.writeText(session.meetingLink);
  showDashToast("Class link copied!");
}

function showDashToast(msg) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

document.addEventListener("DOMContentLoaded", seedLiveSessions);
