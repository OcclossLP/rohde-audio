(function () {
  try {
    const match = document.cookie.match(/(?:^|; )cookie_consent=([^;]*)/);
    const consent = match ? decodeURIComponent(match[1]) : null;
    const stored = consent && consent !== "declined" ? localStorage.getItem("theme") : null;
    const theme = stored || "dark";
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    console.error("theme-init error", e);
  }
})();
