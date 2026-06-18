(function () {
  const nav = document.getElementById('siteNav');
  const spacer = document.getElementById('navBarSpacer');
  if (!nav || !spacer) return;

  let navHeight = 0;
  let pinAt = 0;

  function measure() {
    nav.classList.remove('nav-bar--fixed');
    spacer.style.height = '0';
    navHeight = nav.offsetHeight;
    pinAt = nav.getBoundingClientRect().top + window.scrollY;
  }

  function update() {
    if (window.scrollY >= pinAt) {
      nav.classList.add('nav-bar--fixed');
      spacer.style.height = `${navHeight}px`;
    } else {
      nav.classList.remove('nav-bar--fixed');
      spacer.style.height = '0';
    }
  }

  measure();
  update();

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    update();
  });
})();
