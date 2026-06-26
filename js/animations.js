const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initScrollReveal() {
  if (prefersReducedMotion) {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function initParallax() {
  if (prefersReducedMotion) return;

  const layers = document.querySelectorAll("[data-parallax]");
  const hero = document.querySelector(".hero");
  const dualCta = document.querySelector(".dual-cta");
  const newsletter = document.querySelector(".newsletter-section");

  function onScroll() {
    const scrollY = window.scrollY;

    layers.forEach((layer) => {
      const speed = parseFloat(layer.dataset.parallax) || 0.2;
      layer.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
    });

    if (hero) {
      const heroContent = hero.querySelector(".hero-content");
      if (heroContent && scrollY < hero.offsetHeight) {
        heroContent.style.transform = `translate3d(0, ${scrollY * 0.25}px, 0)`;
        heroContent.style.opacity = String(1 - scrollY / (hero.offsetHeight * 0.9));
      }
    }

    if (dualCta) {
      const rect = dualCta.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const offset = (window.innerHeight - rect.top) * 0.08;
        dualCta.style.backgroundPosition = `center ${50 + offset * 0.05}%`;
      }
    }

    if (newsletter) {
      const rect = newsletter.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const offset = (window.innerHeight - rect.top) * 0.06;
        newsletter.style.backgroundPosition = `center calc(50% + ${offset}px)`;
      }
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function initStatCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target = el.dataset.count;
    const duration = 1400;
    const start = performance.now();

    const match = target.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
    if (!match) return;

    const [, prefix, numStr, suffix] = match;
    const numeric = parseFloat(numStr);
    el.textContent = `${prefix}0${suffix}`;

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(numeric * eased);
      el.textContent = `${prefix}${value}${suffix}`;

      if (progress >= 1) el.textContent = target;
    }

    requestAnimationFrame(frame);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((c) => observer.observe(c));
}

function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 24);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function initSmoothSections() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const id = anchor.getAttribute("href");
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      document.querySelector(".nav-links")?.classList.remove("open");
      document.querySelector(".mobile-backdrop")?.classList.remove("visible");
    });
  });
}

function initMagneticButtons() {
  if (prefersReducedMotion || window.innerWidth < 768) return;

  document.querySelectorAll(".hero-actions .btn-lime, .hero-actions .btn-white").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initScrollReveal();
  initParallax();
  initStatCounters();
  initHeaderScroll();
  initSmoothSections();
  initMagneticButtons();
});
