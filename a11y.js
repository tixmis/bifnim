/* ============================================================
   BIFNIM — панель настроек доступности (נגישות)
   Самодостаточный виджет без внешних зависимостей.
   Подключение: <script src="/a11y.js" defer></script>
   Настройки хранятся в localStorage ('bifnim-a11y') и
   применяются классами на <html> + переопределением
   существующих CSS-токенов дизайн-системы сайта.
   ВАЖНО: панель — инструмент пользовательских предпочтений,
   она дополняет, а не заменяет семантическую доступность
   страниц и не гарантирует соответствие WCAG сама по себе.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'bifnim-a11y';
  var state = { contrast:false, invert:false, gray:false, fs:0, underline:false, noanim:false };

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    for (var k in state) if (k in saved) state[k] = saved[k];
  } catch (e) { /* приватный режим и т.п. — работаем без сохранения */ }

  function save(){ try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){} }

  /* ---------- Применение настроек ---------- */
  var root = document.documentElement;
  function applyAll(){
    root.classList.toggle('a11y-contrast',  state.contrast);
    root.classList.toggle('a11y-invert',    state.invert);
    root.classList.toggle('a11y-gray',      state.gray);
    root.classList.toggle('a11y-underline', state.underline);
    root.classList.toggle('a11y-noanim',    state.noanim);
    /* масштаб текста: zoom на body — надёжно масштабирует
       px-типографику; содержимое кросс-доменных iframe
       (плеер Matterport, карта) не затрагивается — честное
       ограничение, управление размером там у самих виджетов */
    document.body.style.zoom = state.fs === 0 ? '' : String(1 + state.fs * 0.1);
    syncButtons();
  }

  /* ---------- Стили виджета: токены сайта + переопределения ---------- */
  var css = ''
  + '.a11y-trigger{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:30;'
  + 'display:flex;align-items:center;justify-content:center;width:46px;height:46px;'
  + 'background:rgba(19,26,34,.94);border:1px solid rgba(246,244,239,.14);border-left:0;'
  + 'border-radius:0 12px 12px 0;cursor:pointer;padding:0;'
  + 'box-shadow:0 4px 16px rgba(0,0,0,.35)}'
  + '.a11y-trigger svg{width:26px;height:26px;fill:#C7A175}'
  + '.a11y-trigger:hover{background:rgba(29,39,51,.97)}'
  + '.a11y-trigger:focus-visible{outline:2px solid #C7A175;outline-offset:2px}'
  + '.a11y-drawer{position:fixed;left:0;top:0;bottom:0;z-index:60;width:min(320px,88vw);'
  + 'background:#131A22;color:#F6F4EF;border-inline-end:1px solid rgba(246,244,239,.14);'
  + 'box-shadow:8px 0 40px rgba(0,0,0,.5);padding:18px 16px calc(18px + env(safe-area-inset-bottom));'
  + 'overflow-y:auto;font-family:Rubik,system-ui,sans-serif;'
  + 'transform:translateX(-105%);transition:transform .25s ease;direction:rtl;text-align:right}'
  + '.a11y-drawer.open{transform:none}'
  + '.a11y-drawer h2{font-size:17px;font-weight:500;margin:0 0 4px;color:#F6F4EF}'
  + '.a11y-drawer .a11y-note{font-size:12px;color:#8E9AA6;margin:0 0 14px;line-height:1.5}'
  + '.a11y-close{position:absolute;inset-inline-end:10px;top:10px;background:none;border:0;'
  + 'color:#8E9AA6;font-size:24px;line-height:1;cursor:pointer;padding:4px 8px;border-radius:8px}'
  + '.a11y-close:hover{color:#F6F4EF}'
  + '.a11y-close:focus-visible{outline:2px solid #C7A175}'
  + '.a11y-opt{display:flex;align-items:center;gap:10px;width:100%;text-align:right;'
  + 'background:rgba(246,244,239,.05);color:#F6F4EF;border:1px solid rgba(246,244,239,.14);'
  + 'border-radius:12px;padding:11px 14px;margin:0 0 8px;font-size:14px;font-family:inherit;'
  + 'cursor:pointer;justify-content:space-between}'
  + '.a11y-opt:hover{background:rgba(246,244,239,.09)}'
  + '.a11y-opt:focus-visible{outline:2px solid #C7A175;outline-offset:2px}'
  + '.a11y-opt[aria-pressed="true"]{border-color:#C7A175;background:rgba(199,161,117,.14)}'
  + '.a11y-opt .a11y-mark{font-size:12px;color:#C7A175;visibility:hidden}'
  + '.a11y-opt[aria-pressed="true"] .a11y-mark{visibility:visible}'
  + '.a11y-row{display:flex;gap:8px}'
  + '.a11y-row .a11y-opt{justify-content:center}'
  + '.a11y-reset{margin-top:10px;background:none;border-color:rgba(246,244,239,.25)}'
  + '.a11y-stmt{display:block;margin-top:14px;font-size:13px;color:#C7A175;text-decoration:underline}'
  + '.a11y-stmt:focus-visible{outline:2px solid #C7A175;outline-offset:2px}'
  /* --- эффекты предпочтений --- */
  + 'html.a11y-contrast{--paper:#FFFFFF;--mist:#DDE4EB;--sand:#FFD9A0;'
  + '--line:rgba(255,255,255,.45);--ink:#000A14;--ink-soft:#0A1520}'
  + 'html.a11y-invert{filter:invert(1) hue-rotate(180deg)}'
  + 'html.a11y-gray{filter:grayscale(1)}'
  + 'html.a11y-invert.a11y-gray{filter:invert(1) hue-rotate(180deg) grayscale(1)}'
  + 'html.a11y-underline a{text-decoration:underline !important}'
  + 'html.a11y-noanim *,html.a11y-noanim *::before,html.a11y-noanim *::after{'
  + 'transition:none !important;animation:none !important;scroll-behavior:auto !important}'
  + '@media (prefers-reduced-motion:reduce){.a11y-drawer{transition:none}}'
  + '@media (max-height:460px){.a11y-trigger{top:auto;bottom:12px;transform:none}}';

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- Разметка ---------- */
  var trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'a11y-trigger';
  trigger.setAttribute('aria-label', 'פתיחת אפשרויות נגישות');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'a11yDrawer');
  trigger.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm9 5.5c.3 0 .5.2.5.5s-.2.5-.5.5c-2.3.3-4.6.6-6.5.7v3.3l2.4 7.6c.1.4-.1.8-.5.9-.4.1-.8-.1-.9-.5L12.3 14h-.6l-3.2 6.5c-.1.4-.5.6-.9.5-.4-.1-.6-.5-.5-.9l2.4-7.6V9.2c-1.9-.1-4.2-.4-6.5-.7-.3 0-.5-.2-.5-.5s.2-.5.5-.5c3 .4 6 .7 8.5.7s5.5-.3 8.5-.7z"/></svg>';

  var drawer = document.createElement('div');
  drawer.id = 'a11yDrawer';
  drawer.className = 'a11y-drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-labelledby', 'a11yTitle');
  drawer.innerHTML = ''
    + '<button type="button" class="a11y-close" aria-label="סגירה">×</button>'
    + '<h2 id="a11yTitle">אפשרויות נגישות</h2>'
    + '<p class="a11y-note">ההגדרות נשמרות בדפדפן שלך. הפאנל משלים את נגישות האתר ואינו מחליף אותה.</p>'
    + '<button type="button" class="a11y-opt" data-t="contrast">ניגודיות גבוהה<span class="a11y-mark">✓</span></button>'
    + '<button type="button" class="a11y-opt" data-t="invert">ניגודיות הפוכה<span class="a11y-mark">✓</span></button>'
    + '<button type="button" class="a11y-opt" data-t="gray">גווני אפור<span class="a11y-mark">✓</span></button>'
    + '<div class="a11y-row">'
    + '<button type="button" class="a11y-opt" data-fs="1" aria-label="הגדלת טקסט">א+ הגדלת טקסט</button>'
    + '<button type="button" class="a11y-opt" data-fs="-1" aria-label="הקטנת טקסט">א− הקטנת טקסט</button>'
    + '</div>'
    + '<button type="button" class="a11y-opt" data-t="underline">קו תחתון לקישורים<span class="a11y-mark">✓</span></button>'
    + '<button type="button" class="a11y-opt" data-t="noanim">עצירת אנימציות<span class="a11y-mark">✓</span></button>'
    + '<button type="button" class="a11y-opt a11y-reset" data-reset>איפוס הגדרות נגישות</button>'
    + '<a class="a11y-stmt" href="/accessibility.html">הצהרת נגישות</a>';

  document.body.appendChild(trigger);
  document.body.appendChild(drawer);

  var toggles = drawer.querySelectorAll('[data-t]');
  function syncButtons(){
    toggles.forEach(function(b){
      b.setAttribute('aria-pressed', String(!!state[b.getAttribute('data-t')]));
    });
  }

  /* ---------- Открытие/закрытие + фокус ---------- */
  var lastFocus = null;
  function open(){
    lastFocus = document.activeElement;
    drawer.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    drawer.querySelector('.a11y-close').focus();
  }
  function close(){
    drawer.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    (lastFocus || trigger).focus();
  }
  trigger.addEventListener('click', function(){
    drawer.classList.contains('open') ? close() : open();
  });
  drawer.querySelector('.a11y-close').addEventListener('click', close);

  document.addEventListener('keydown', function(e){
    if (!drawer.classList.contains('open')) return;
    if (e.key === 'Escape'){ close(); return; }
    if (e.key === 'Tab'){
      var f = drawer.querySelectorAll('button, a[href]');
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });
  /* клик мимо панели закрывает её */
  document.addEventListener('click', function(e){
    if (drawer.classList.contains('open')
        && !drawer.contains(e.target) && !trigger.contains(e.target)) close();
  });

  /* ---------- Действия ---------- */
  drawer.addEventListener('click', function(e){
    var b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-t')){
      var k = b.getAttribute('data-t');
      state[k] = !state[k];
      if (k === 'invert' && state.invert) state.contrast = false;
      if (k === 'contrast' && state.contrast) state.invert = false;
    } else if (b.hasAttribute('data-fs')){
      state.fs = Math.max(-1, Math.min(3, state.fs + parseInt(b.getAttribute('data-fs'), 10)));
    } else if (b.hasAttribute('data-reset')){
      state = { contrast:false, invert:false, gray:false, fs:0, underline:false, noanim:false };
    } else {
      return; /* кнопка закрытия обрабатывается отдельно */
    }
    save(); applyAll();
  });

  applyAll();
})();
