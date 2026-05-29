/* ===== CURSOR PERSONALIZADO ===== */
const dot  = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');

let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  dot.style.left  = mouseX + 'px';
  dot.style.top   = mouseY + 'px';
});

(function animateRing() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  ring.style.left = ringX + 'px';
  ring.style.top  = ringY + 'px';
  requestAnimationFrame(animateRing);
})();

const hoverEls = 'a, button, .evento-card, .galeria-item, .filtro-btn, .dep-btn, .dep-dot, .whatsapp-float';
document.querySelectorAll(hoverEls).forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

/* ===== NAVBAR: SCROLL + HAMBURGER ===== */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
  updateActiveLink();
});

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('.nav-link, .nav-cta').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
  });
});

document.addEventListener('click', e => {
  if (!navbar.contains(e.target)) {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
  }
});

/* ===== ACTIVE NAV LINK ===== */
const sections    = document.querySelectorAll('section[id]');
const navLinkEls  = document.querySelectorAll('.nav-link');

function updateActiveLink() {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  navLinkEls.forEach(link => {
    link.classList.toggle('active-link', link.getAttribute('href') === `#${current}`);
  });
}

/* ===== SMOOTH SCROLL ===== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ===== SCROLL REVEAL ===== */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ===== PARALLAX HERO ===== */
const heroBg = document.getElementById('heroBg');
window.addEventListener('scroll', () => {
  if (heroBg) heroBg.style.transform = `translateY(${window.scrollY * 0.35}px)`;
}, { passive: true });

/* ===== CONTADORES ANIMADOS ===== */
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el     = entry.target;
    const target = parseInt(el.dataset.target, 10);
    const dur    = 1800;
    const start  = performance.now();
    const tick   = now => {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(ease * target);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.5 });

document.querySelectorAll('.numero-valor').forEach(el => counterObserver.observe(el));

/* ===== BADGE CONTADOR ===== */
const badge = document.querySelector('.badge-number');
if (badge) {
  let done = false;
  const badgeObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !done) {
      done = true;
      let c = 0;
      const t = setInterval(() => { c = Math.min(c + 9, 500); badge.textContent = `+${c}`; if (c >= 500) clearInterval(t); }, 20);
    }
  }, { threshold: 0.5 });
  badgeObs.observe(badge);
}

/* ===== 3D TILT NOS CARDS DE EVENTO ===== */
document.querySelectorAll('.evento-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect   = card.getBoundingClientRect();
    const x      = e.clientX - rect.left;
    const y      = e.clientY - rect.top;
    const cx     = rect.width  / 2;
    const cy     = rect.height / 2;
    const rotX   = ((y - cy) / cy) * -5;
    const rotY   = ((x - cx) / cx) *  5;
    card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ===== FILTRO DE GALERIA + VER MAIS ===== */
const filtroBtns    = document.querySelectorAll('.filtro-btn');
const galeriaItems  = document.querySelectorAll('.galeria-item');
const verMaisWrap   = document.getElementById('galeriaVerMaisWrap');
const verMaisBtn    = document.getElementById('galeriaVerMais');
const INICIAL_LIMIT = 16;

function applyFilter(filter) {
  let shown = 0;
  galeriaItems.forEach(item => {
    const match = filter === 'all' || item.dataset.category === filter;
    if (!match) {
      item.classList.add('hidden');
      item.classList.remove('collapsed');
      return;
    }
    item.classList.remove('hidden');
    if (filter === 'all' && shown >= INICIAL_LIMIT) {
      item.classList.add('collapsed');
    } else {
      item.classList.remove('collapsed');
      void item.offsetWidth;
      item.classList.add('fade-in');
      setTimeout(() => item.classList.remove('fade-in'), 500);
    }
    shown++;
  });

  const hasCollapsed = document.querySelector('.galeria-item.collapsed');
  verMaisWrap.style.display = (filter === 'all' && hasCollapsed) ? 'block' : 'none';
}

applyFilter('all');

filtroBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filtroBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilter(btn.dataset.filter);
  });
});

verMaisBtn.addEventListener('click', () => {
  document.querySelectorAll('.galeria-item.collapsed').forEach(item => {
    item.classList.remove('collapsed');
    void item.offsetWidth;
    item.classList.add('fade-in');
    setTimeout(() => item.classList.remove('fade-in'), 500);
  });
  verMaisWrap.style.display = 'none';
});

/* ===== LIGHTBOX ===== */
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev  = document.getElementById('lightboxPrev');
const lightboxNext  = document.getElementById('lightboxNext');

let galleryImages = [];
let currentIndex  = 0;

function openLightbox(index) {
  currentIndex       = index;
  lightboxImg.src    = galleryImages[index].src;
  lightboxImg.alt    = galleryImages[index].alt;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

function showPrev() {
  currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
  lightboxImg.style.opacity = '0';
  setTimeout(() => {
    lightboxImg.src = galleryImages[currentIndex].src;
    lightboxImg.style.opacity = '1';
  }, 150);
}

function showNext() {
  currentIndex = (currentIndex + 1) % galleryImages.length;
  lightboxImg.style.opacity = '0';
  setTimeout(() => {
    lightboxImg.src = galleryImages[currentIndex].src;
    lightboxImg.style.opacity = '1';
  }, 150);
}

lightboxImg.style.transition = 'opacity .15s ease';

// Monta lista de imagens visíveis ao clicar
document.querySelectorAll('.galeria-item').forEach(item => {
  item.addEventListener('click', () => {
    const visibleItems = Array.from(document.querySelectorAll('.galeria-item:not(.hidden)'));
    galleryImages = visibleItems.map(i => i.querySelector('img'));
    const idx = visibleItems.indexOf(item);
    openLightbox(idx);
  });
});

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', showPrev);
lightboxNext.addEventListener('click', showNext);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   showPrev();
  if (e.key === 'ArrowRight')  showNext();
});

/* ===== CARROSSEL DE DEPOIMENTOS ===== */
const track   = document.getElementById('depoimentosTrack');
const prevBtn = document.getElementById('depPrev');
const nextBtn = document.getElementById('depNext');
const dotsEl  = document.getElementById('depDots');

if (track) {
  const cards = track.querySelectorAll('.depoimento-card');
  let current = 0;
  let autoplay;

  const getVisible = () => window.innerWidth <= 768 ? 1 : 3;
  const totalSlides = () => Math.ceil(cards.length / getVisible());

  const buildDots = () => {
    dotsEl.innerHTML = '';
    for (let i = 0; i < totalSlides(); i++) {
      const d = document.createElement('button');
      d.className = `dep-dot${i === current ? ' active' : ''}`;
      d.addEventListener('click', () => { goTo(i); resetAutoplay(); });
      dotsEl.appendChild(d);
    }
  };

  const updateDots = () => {
    dotsEl.querySelectorAll('.dep-dot').forEach((d, i) => d.classList.toggle('active', i === current));
  };

  const goTo = idx => {
    current = Math.max(0, Math.min(idx, totalSlides() - 1));
    const w = cards[0].offsetWidth + 24;
    track.style.transform = `translateX(-${current * getVisible() * w}px)`;
    updateDots();
  };

  prevBtn.addEventListener('click', () => { goTo(current - 1 < 0 ? totalSlides() - 1 : current - 1); resetAutoplay(); });
  nextBtn.addEventListener('click', () => { goTo(current + 1 >= totalSlides() ? 0 : current + 1); resetAutoplay(); });

  const startAutoplay = () => { autoplay = setInterval(() => goTo(current + 1 >= totalSlides() ? 0 : current + 1), 5000); };
  const resetAutoplay = () => { clearInterval(autoplay); startAutoplay(); };

  buildDots();
  startAutoplay();
  window.addEventListener('resize', () => { buildDots(); goTo(0); });
}
