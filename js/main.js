const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");

if (toggle && links) {
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  links.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}
