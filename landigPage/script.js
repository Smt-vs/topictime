document.body.classList.add("has-js");

const currentPage = document.body.dataset.page;

document.querySelectorAll(".nav a").forEach((link) => {
  const href = link.getAttribute("href") || "";
  const name = href.replace(".html", "");

  if ((currentPage === "home" && href === "index.html") || currentPage === name) {
    link.classList.add("is-current");
    link.setAttribute("aria-current", "page");
  }
});

const timer = document.querySelector("[data-room-timer]");

if (timer) {
  const values = ["18:42", "18:03", "12:51", "07:20", "02:14"];
  let index = 0;

  window.setInterval(() => {
    index = (index + 1) % values.length;
    timer.textContent = values[index];
  }, 2200);
}

const reveals = document.querySelectorAll(".reveal");

if (reveals.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
  );

  reveals.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 40, 240)}ms`;

    if (element.getBoundingClientRect().top < window.innerHeight * 0.92) {
      element.classList.add("is-visible");
      return;
    }

    observer.observe(element);
  });
}

const themeTabs = document.querySelectorAll("[data-theme]");
const preview = document.querySelector("[data-theme-preview]");

const themeContent = {
  zen: {
    className: "theme-zen",
    room: "Stanza: Fotografia Analogica",
    message: "<strong>Utente_A:</strong> Avete mai provato una vecchia Leica?",
    button: "Invia messaggio",
  },
  sunset: {
    className: "theme-sunset",
    room: "Stanza: I Migliori Libri del 2000",
    message: "<strong>Admin:</strong> Benvenuti nel salotto letterario...",
    button: "Invia risposta",
  },
  pastel: {
    className: "theme-pastel",
    room: "Stanza: Viaggi in Solitaria",
    message: "<strong>Utente_B:</strong> Prossima meta: Tokyo o Berlino?",
    button: "Invia ora",
  },
};

if (preview && themeTabs.length > 0) {
  const roomName = preview.querySelector(".preview-room-name");
  const roomMessage = preview.querySelector(".preview-message");
  const roomButton = preview.querySelector(".preview-button");

  themeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const theme = tab.dataset.theme;
      const content = themeContent[theme];

      if (!content) {
        return;
      }

      themeTabs.forEach((button) => button.classList.remove("is-active"));
      tab.classList.add("is-active");

      preview.classList.remove("theme-zen", "theme-sunset", "theme-pastel");
      preview.classList.add(content.className);

      if (roomName) {
        roomName.textContent = content.room;
      }

      if (roomMessage) {
        roomMessage.innerHTML = content.message;
      }

      if (roomButton) {
        roomButton.textContent = content.button;
      }
    });
  });
}
