/* ИП Кутанов М.С.: панель меню, фильтр работ, проверка габаритов, заявка */

var BED_X = 1250, BED_Y = 1000;
var WA_BASE = 'https://wa.me/375257162101';

document.addEventListener('DOMContentLoaded', function () {
  initDrawer();
  initWorks();
  initFit();
  initForm();
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});

/* Панель меню: fixed-слой, блокировка прокрутки, ловушка фокуса */
function initDrawer() {
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  if (!burger || !drawer) return;
  var lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
    var btn = document.getElementById('drawer-close');
    if (btn) btn.focus({ preventScroll: true });
  }

  function close() {
    drawer.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  burger.addEventListener('click', function () {
    if (drawer.hidden) open(); else close();
  });

  var closeBtn = document.getElementById('drawer-close');
  if (closeBtn) closeBtn.addEventListener('click', close);

  drawer.addEventListener('click', function (e) {
    if (e.target.closest('a')) { close(); return; }
    if (!e.target.closest('.drawer__inner')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (drawer.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    var items = drawer.querySelectorAll('a, button');
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1180 && !drawer.hidden) close();
  });
}

/* Фильтр работ */
function initWorks() {
  var chips = document.getElementById('chips');
  if (!chips) return;
  var works = [].slice.call(document.querySelectorAll('.work'));
  chips.addEventListener('click', function (e) {
    var btn = e.target.closest('.chip');
    if (!btn) return;
    var cat = btn.getAttribute('data-cat');
    [].forEach.call(chips.querySelectorAll('.chip'), function (c) {
      c.classList.toggle('is-on', c === btn);
      c.setAttribute('aria-selected', String(c === btn));
    });
    var shown = 0;
    works.forEach(function (w) {
      var hit = cat === 'all' || w.getAttribute('data-cat') === cat;
      w.classList.toggle('is-hidden', !hit);
      if (hit) shown++;
    });
    var lead = document.querySelector('.phead__lead');
    if (lead && !lead.dataset.base) lead.dataset.base = lead.textContent;
    if (lead) lead.textContent = cat === 'all'
      ? lead.dataset.base
      : 'Показано ' + shown + ' из ' + works.length + ': ' + btn.textContent.trim().toLowerCase() + '.';
  });
}

/* Проверка габаритов: пересчёт схемы поля 1250 × 1000 */
function initFit() {
  var svg = document.getElementById('fit-svg');
  if (!svg) return;
  var part = document.getElementById('plot-part');
  var label = document.getElementById('plot-label');
  var verdict = document.getElementById('fit-verdict');
  var inX = document.getElementById('fit-x');
  var inY = document.getElementById('fit-y');
  var grid = document.getElementById('plot-grid');

  /* поле на схеме: 40..600 по X (560 px) и 40..488 по Y (448 px) */
  var S = 560 / BED_X;
  var OX = 40, OY = 40;

  (function buildGrid() {
    var i, l;
    for (i = 250; i < BED_X; i += 250) {
      l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', OX + i * S); l.setAttribute('y1', OY);
      l.setAttribute('x2', OX + i * S); l.setAttribute('y2', OY + BED_Y * S);
      grid.appendChild(l);
    }
    for (i = 250; i < BED_Y; i += 250) {
      l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', OX); l.setAttribute('y1', OY + i * S);
      l.setAttribute('x2', OX + BED_X * S); l.setAttribute('y2', OY + i * S);
      grid.appendChild(l);
    }
  })();

  function render() {
    var x = Math.max(1, Math.min(5000, parseInt(inX.value, 10) || 1));
    var y = Math.max(1, Math.min(5000, parseInt(inY.value, 10) || 1));
    var fits = x <= BED_X && y <= BED_Y;

    var w = Math.min(x, BED_X) * S;
    var h = Math.min(y, BED_Y) * S;
    /* при выходе за поле рисуем деталь от левого верхнего угла с обрезкой по краю */
    part.setAttribute('x', OX + (fits ? (BED_X * S - w) / 2 : 0));
    part.setAttribute('y', OY + (fits ? (BED_Y * S - h) / 2 : 0));
    part.setAttribute('width', w);
    part.setAttribute('height', h);
    part.classList.toggle('is-out', !fits);

    label.textContent = 'ДЕТАЛЬ ' + x + ' × ' + y + ' ММ';

    var text;
    if (fits) {
      var gapX = BED_X - x, gapY = BED_Y - y;
      text = '<b>Помещается.</b> Запас по полю: ' + gapX + ' мм по длине и ' + gapY + ' мм по ширине. ' +
        'Можно ставить деталь и кратно — уточним раскладку по вашему файлу.';
    } else {
      text = '<b>Не помещается целиком.</b> Максимум — 1250 × 1000 мм. Варианты: разложить по диагонали, ' +
        'разбить на части со стыком или обработать за два установа. Напишите — предложим решение.';
    }
    verdict.innerHTML = text;
    verdict.classList.toggle('is-bad', !fits);
  }

  [inX, inY].forEach(function (el) {
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });

  var presets = document.getElementById('fit-presets');
  if (presets) {
    presets.addEventListener('click', function (e) {
      var b = e.target.closest('.preset');
      if (!b) return;
      inX.value = b.getAttribute('data-x');
      inY.value = b.getAttribute('data-y');
      render();
    });
  }

  /* подхват размеров из ссылки вида index.html#proverka и kontakty.html?x=&y= */
  var params = new URLSearchParams(location.search);
  if (params.get('x')) inX.value = params.get('x');
  if (params.get('y')) inY.value = params.get('y');

  render();
}

/* Заявка */
function initForm() {
  var form = document.getElementById('lead-form');
  if (!form) return;
  var ok = document.getElementById('form-ok');
  var out = document.getElementById('order-text');
  var send = document.getElementById('order-send');
  var copy = document.getElementById('order-copy');

  var params = new URLSearchParams(location.search);
  var fx = document.getElementById('f-x');
  var fy = document.getElementById('f-y');
  if (fx && params.get('x')) fx.value = params.get('x');
  if (fy && params.get('y')) fy.value = params.get('y');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('f-name');
    var contact = document.getElementById('f-contact');
    var what = document.getElementById('f-what');
    var note = document.getElementById('f-note');
    var bad = false;
    [name, contact].forEach(function (el) {
      if (!el.value.trim()) { el.style.borderColor = '#CE0066'; bad = true; }
      else el.style.borderColor = '';
    });
    if (bad) return;

    var size = (fx.value && fy.value) ? fx.value + ' × ' + fy.value + ' мм' : '';
    var text = 'Заявка с сайта: фрезеровка ЧПУ\n' +
      'Имя: ' + name.value.trim() + '\n' +
      'Контакт: ' + contact.value.trim() + '\n' +
      'Задача: ' + what.value + '\n' +
      (size ? 'Габариты детали: ' + size + '\n' : '') +
      (note.value.trim() ? 'Материал и детали: ' + note.value.trim() + '\n' : '') +
      'Файл приложу в чате.';
    out.textContent = text;
    send.href = WA_BASE + '?text=' + encodeURIComponent(text);
    if (ok.hidden) {
      ok.hidden = false;
      form.querySelectorAll('input, select, textarea, .form__btn').forEach(function (el) { el.disabled = true; });
    }
    ok.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  if (copy) {
    copy.addEventListener('click', function () {
      var text = out.textContent || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      }
      copy.textContent = 'Скопировано';
      setTimeout(function () { copy.textContent = 'Скопировать текст'; }, 1800);
    });
  }
}
