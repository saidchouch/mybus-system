function setLanguage(lang) {
  localStorage.setItem("language", lang);
  applyLanguage(lang);
}

function applyLanguage(lang) {

  if (lang === "ar") {
    document.body.setAttribute("dir", "rtl");

  } else {
    document.body.setAttribute("dir", "ltr");

  }

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang][key]) {
      el.innerText = translations[lang][key];
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("language") || "en";
  applyLanguage(savedLang);
});
