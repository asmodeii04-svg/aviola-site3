/*
 * Авиола.NET — скрипты сайта
 * 1. Тема (системная + ручной переключатель)
 * 2. Мобильное меню
 * 3. Анимированная сетка узлов на фоне всей страницы
 */

const THEME_KEY = 'aviola-theme';
const THEME_COLORS = { light: '#fbfdff', dark: '#131d31' };

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMenu();
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
  window.matchMedia('(min-width: 1101px)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}


/* ---------- 3. Сетка узлов на фоне ---------- */

function initNetworkBackground() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const canvas = document.createElement('canvas');
  canvas.className = 'net-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let scale = 1; // растёт вместе с размером шрифта на больших мониторах
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
  document.addEventListener('visibilitychange', updateLoop);
  reduceMotion.addEventListener('change', updateLoop);
  window.addEventListener('themechange', () => {
    readSettings();
    draw();
  });
}
