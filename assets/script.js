/*
 * Авиола.NET — скрипты сайта
 * 1. Тема (системная + ручной переключатель)
 * 2. Мобильное меню
 * 3. Эффекты шапки, появление блоков, подсветка карточек
 * 4. Анимированная сетка узлов на фоне всей страницы
 */

const THEME_KEY = 'aviola-theme';
const THEME_COLORS = { light: '#fbfdff', dark: '#131d31' };

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMenu();
  initHeaderEffects();
  initReveal();
  initCardSpotlight();
  initNetworkBackground();
});


/* ---------- 1. Тема ---------- */

function initTheme() {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const metaColor = document.querySelector('meta[name="theme-color"]');
  const button = createThemeButton();

  // Если человек ещё не выбирал тему сам, берём системную
  const getTheme = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');

  function render() {
    const theme = getTheme();
    const label = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';

    button.dataset.current = theme;
    button.setAttribute('aria-label', label);
    button.title = label;
    if (metaColor) metaColor.content = THEME_COLORS[theme];

    window.dispatchEvent(new Event('themechange'));
  }

  button.addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';

    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (error) {
      // Хранилище может быть недоступно (например, в приватном режиме) — не страшно
    }
    render();
  });

  systemDark.addEventListener('change', render);
  render();
}

function createThemeButton() {
  const button = document.createElement('button');
  button.className = 'theme-toggle';
  button.type = 'button';
  button.innerHTML = `
    <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
    </svg>
    <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
    </svg>`;
  document.body.append(button);
  return button;
}


/* ---------- 2. Мобильное меню ---------- */

function initMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;

  function setOpen(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    toggle.textContent = open ? '×' : '☰';
  }

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));

  // Закрываем меню после перехода по ссылке, по Escape и при расширении окна
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
  window.matchMedia('(min-width: 1161px)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}


/* ---------- 3. Эффекты ---------- */

// Тень шапки после прокрутки и полоса прогресса чтения
function initHeaderEffects() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let waiting = false;

  function update() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    header.style.setProperty('--progress', progress.toFixed(4));
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    waiting = false;
  }

  window.addEventListener('scroll', () => {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}

// Блоки с атрибутом data-reveal плавно появляются, когда попадают в окно
function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  function show(item) {
    item.classList.add('is-visible');
    // Когда анимация закончилась, возвращаем элементу его обычные стили (например, hover у карточек)
    setTimeout(() => {
      item.removeAttribute('data-reveal');
      item.classList.remove('is-visible');
      item.style.transitionDelay = '';
    }, 1200);
  }

  if (!('IntersectionObserver' in window)) {
    items.forEach(show);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      show(entry.target);
    });
  }, { threshold: 0.12 });

  items.forEach((item) => {
    // Небольшая задержка по порядку внутри ряда, чтобы карточки появлялись волной
    const index = Array.from(item.parentElement.children).indexOf(item);
    item.style.transitionDelay = `${Math.min(index, 5) * 70}ms`;
    observer.observe(item);
  });
}

// Световое пятно под курсором на карточках (только там, где есть мышь)
function initCardSpotlight() {
  if (!window.matchMedia('(hover: hover)').matches) return;

  document.querySelectorAll('.card, .info-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  });
}


/* ---------- 4. Сетка узлов на фоне ---------- */

function initNetworkBackground() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const canvas = document.createElement('canvas');
  canvas.className = 'net-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let scale = 1;
  const pointer = { x: -9999, y: -9999 }; // положение мыши (за пределами окна, пока её нет)
  let width = 0;
  let height = 0;
  let nodes = [];
  let color = '23, 105, 210';
  let frameId = 0;
  let lastTime = 0;

  function readSettings() {
    const style = getComputedStyle(document.documentElement);
    const value = style.getPropertyValue('--net-rgb').trim();
    if (value) color = value;
    scale = parseFloat(style.fontSize) / 16 || 1;
  }

  function makeNode() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: 1.2 + Math.random() * 1.4,
    };
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    readSettings();

    // Количество узлов зависит от площади окна, чтобы на телефоне было не тесно
    const target = Math.round(Math.min(Math.max((width * height) / 14000, 26), 110));
    while (nodes.length < target) nodes.push(makeNode());
    nodes.length = target;

    draw();
  }

  function step(delta) {
    for (const node of nodes) {
      node.x += node.vx * delta;
      node.y += node.vy * delta;
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;

      // Узлы рядом с курсором слегка расступаются
      const dx = node.x - pointer.x;
      const dy = node.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const reach = 110 * scale;
      if (distance < reach && distance > 0) {
        const push = (1 - distance / reach) * 1.2 * delta;
        node.x += (dx / distance) * push;
        node.y += (dy / distance) * push;
      }
    }
  }

  function draw() {
    const linkDistance = 150 * scale; // на каком расстоянии узлы соединяются линией
    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (distance > linkDistance) continue;

        const alpha = (1 - distance / linkDistance) * 0.24;
        ctx.strokeStyle = `rgba(${color}, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }

    // Линии от курсора к ближайшим узлам
    const reachLine = 180 * scale;
    for (const node of nodes) {
      const distance = Math.hypot(node.x - pointer.x, node.y - pointer.y);
      if (distance > reachLine) continue;
      ctx.strokeStyle = `rgba(${color}, ${(1 - distance / reachLine) * 0.45})`;
      ctx.beginPath();
      ctx.moveTo(pointer.x, pointer.y);
      ctx.lineTo(node.x, node.y);
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(${color}, 0.5)`;
    for (const node of nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(time) {
    // delta == 1 при 60 кадрах в секунду, чтобы скорость не зависела от частоты экрана
    const delta = Math.min((time - lastTime) / 16.67, 3);
    lastTime = time;
    step(delta);
    draw();
    frameId = requestAnimationFrame(frame);
  }

  // Анимация идёт, только пока вкладка активна и не включено «уменьшить движение»
  function updateLoop() {
    const shouldRun = !document.hidden && !reduceMotion.matches;
    if (shouldRun && !frameId) {
      lastTime = performance.now();
      frameId = requestAnimationFrame(frame);
    } else if (!shouldRun && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  }

  resize();
  updateLoop();

  window.addEventListener('resize', resize);
  // Только для мыши: на телефоне палец не должен «разгонять» узлы
  window.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
  document.documentElement.addEventListener('pointerleave', () => {
    pointer.x = pointer.y = -9999;
  });
  document.addEventListener('visibilitychange', updateLoop);
  reduceMotion.addEventListener('change', updateLoop);
  window.addEventListener('themechange', () => {
    readSettings();
    draw();
  });
}
