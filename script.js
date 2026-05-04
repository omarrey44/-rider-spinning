/* ============================================================
   RIDEON SPINNING STUDIO — Mockup interactions
   ============================================================ */

// ===== 1. NAVBAR sticky con blur al hacer scroll =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 30) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ===== 2. CONTADORES ANIMADOS (countUp al entrar en viewport) =====
const counters = document.querySelectorAll('[data-counter]');
const animateCounter = (el) => {
  const target = parseInt(el.dataset.counter, 10);
  const duration = 1800;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString('es-MX');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
};

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

counters.forEach((c) => counterObserver.observe(c));

// ===== 3. TABS DE HORARIOS POR DÍA =====
// Los días Lun–Vie comparten el mismo panel ("lun"). Sáb tiene panel propio ("sab").
const dayTabs = document.querySelectorAll('.day-tab');
const dayPanels = document.querySelectorAll('.day-panel');

dayTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    dayTabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    const day = tab.dataset.day;
    // Lun-Vie usan el mismo panel "lun". Sáb usa panel "sab".
    const targetPanel = day === 'sab' ? 'sab' : 'lun';
    dayPanels.forEach((p) => {
      p.classList.toggle('active', p.dataset.panel === targetPanel);
    });
  });
});

// ===== 4. SELECTOR DE BICICLETAS =====
// Configuración: 4 filas × 6 columnas = 24 bikes
// taken: ya ocupadas, popular: bikes "favoritas" (centradas, fila 2)
const bikeConfig = {
  rows: 4,
  cols: 6,
  taken: [3, 5, 9, 14, 17, 22],          // índices ocupados
  popular: [7, 8, 9, 10],                 // bikes populares (fila 2 centro)
};

const bikeGrid = document.getElementById('bikeGrid');
const bikeSummary = document.getElementById('bikeSummary');
let selectedBike = null;

function buildBikeGrid() {
  const total = bikeConfig.rows * bikeConfig.cols;
  for (let i = 1; i <= total; i++) {
    const cell = document.createElement('button');
    cell.className = 'bike-cell';
    cell.textContent = i;
    cell.dataset.bike = i;
    cell.setAttribute('aria-label', `Bicicleta ${i}`);

    if (bikeConfig.taken.includes(i)) {
      cell.classList.add('taken');
      cell.disabled = true;
    } else if (bikeConfig.popular.includes(i)) {
      cell.classList.add('popular');
    }

    cell.addEventListener('click', () => selectBike(i, cell));
    bikeGrid.appendChild(cell);
  }
}

function selectBike(num, cell) {
  // Limpia selección previa
  document.querySelectorAll('.bike-cell.selected').forEach((c) => {
    c.classList.remove('selected');
    if (bikeConfig.popular.includes(parseInt(c.dataset.bike, 10))) {
      c.classList.add('popular');
    }
  });

  cell.classList.add('selected');
  cell.classList.remove('popular');
  selectedBike = num;
  updateSummary(num);
}

function updateSummary(num) {
  const row = Math.ceil(num / bikeConfig.cols);
  const isPopular = bikeConfig.popular.includes(num);

  bikeSummary.innerHTML = `
    <div class="summary-detail">
      <div>
        <h4>Bike #${String(num).padStart(2, '0')}</h4>
        <p>Fila ${row} ${isPopular ? '· <span style="color:var(--red-primary)">Posición popular</span>' : ''}</p>
      </div>
      <div style="text-align:right">
        <strong style="font-family:var(--font-display);font-size:24px">$220</strong>
        <a href="#" class="btn btn-primary" style="margin-top:8px;display:inline-flex">Continuar</a>
      </div>
    </div>
  `;
}

buildBikeGrid();

// ===== 5. NAV TOGGLE móvil (placeholder) =====
const navToggle = document.getElementById('navToggle');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    alert('Menú móvil — implementar drawer aquí');
  });
}

// ===== 6. SMOOTH SCROLL con offset para navbar =====
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
