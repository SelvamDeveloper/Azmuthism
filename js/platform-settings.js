const PLATFORM_SETTINGS_KEY = "asmuthism_platform_settings";

const DEFAULT_PLATFORM_SETTINGS = {
  siteName: "Asmuthism",
  tagline: "Master the Growth Journey",
  heroTitle: "Find Your Next Skill Here<br>Our Open Courses",
  heroSubtitle:
    "Explore expert-led courses in 3D printing, business, development, investment, and more. Master the growth journey with live group classes.",
  contactEmail: "hello@asmuthism.com",
  announcement: "",
  maintenanceMode: false,
};

function getPlatformSettings() {
  try {
    return { ...DEFAULT_PLATFORM_SETTINGS, ...JSON.parse(localStorage.getItem(PLATFORM_SETTINGS_KEY)) };
  } catch {
    return { ...DEFAULT_PLATFORM_SETTINGS };
  }
}

function savePlatformSettings(settings) {
  localStorage.setItem(PLATFORM_SETTINGS_KEY, JSON.stringify(settings));
}

function applyPlatformSettingsToPage() {
  const settings = getPlatformSettings();
  document.querySelectorAll("[data-setting='siteName']").forEach((el) => {
    el.textContent = settings.siteName;
  });
  document.querySelectorAll("[data-setting='tagline']").forEach((el) => {
    el.textContent = settings.tagline;
  });
  const heroTitle = document.querySelector("[data-setting='heroTitle']");
  if (heroTitle) heroTitle.innerHTML = settings.heroTitle.replace(/\n/g, "<br>");
  const heroSub = document.querySelector("[data-setting='heroSubtitle']");
  if (heroSub) heroSub.textContent = settings.heroSubtitle;

  if (settings.announcement) {
    const bar = document.getElementById("announcement-bar");
    if (bar) {
      bar.textContent = settings.announcement;
      bar.classList.remove("hidden");
    }
  }
}

document.addEventListener("DOMContentLoaded", applyPlatformSettingsToPage);
