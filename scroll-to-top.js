(function initScrollToTopButton() {
  if (document.getElementById("scrollToTopBtn")) return;

  const scrollToTopBtn = document.createElement("button");
  scrollToTopBtn.id = "scrollToTopBtn";
  scrollToTopBtn.type = "button";
  scrollToTopBtn.textContent = "▲";
  scrollToTopBtn.setAttribute("aria-label", "回到頁面頂端");
  scrollToTopBtn.style.display = "none";

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const updateVisibility = () => {
    scrollToTopBtn.style.display = window.scrollY > 220 ? "block" : "none";
  };

  document.body.appendChild(scrollToTopBtn);
  window.addEventListener("scroll", updateVisibility, { passive: true });
  updateVisibility();
})();
