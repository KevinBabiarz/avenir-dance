/* ===========================================================================
 * adc-frontend.js — Hydratation du site vitrine depuis l'API Avenir Crazy Dance
 * ---------------------------------------------------------------------------
 * Ce fichier récupère les données publiées (cours, professeurs, évènements,
 * articles, galerie) via l'API REST et les injecte dans le DOM du site.
 *
 * Utilisation : ajoutez simplement, avant la fermeture de <body>,
 *   <script src="./adc-frontend.js" defer></script>
 *
 * Configuration de l'URL de l'API (optionnel) : définissez la variable AVANT
 * d'inclure ce script.
 *   <script>window.ADC_API = 'https://api.mon-domaine.be';</script>
 *
 * Conteneurs attendus dans la page (id) :
 *   #filter-tabs   #courses-grid   #teachers-grid
 *   #events-list   #posts-grid     #gallery-grid
 * ======================================================================== */
(function () {
  'use strict';

  /* ---------- Configuration ---------- */
  // Priorité : window.ADC_API explicite > même origine (production) > localhost (dev hors-serveur)
  var API_BASE;
  if (typeof window.ADC_API === 'string' && window.ADC_API) {
    API_BASE = window.ADC_API.replace(/\/+$/, '');
  } else if (window.location && window.location.protocol.indexOf('http') === 0) {
    API_BASE = window.location.origin.replace(/\/+$/, '');
  } else {
    // Ouverture via file:// → on retombe sur le serveur local de développement
    API_BASE = 'http://localhost:4000';
  }

  /* ---------- État local ---------- */
  var state = {
    filter: 'tous',
    courses: [],
    teachers: [],
    events: [],
    posts: [],
    gallery: [],
  };

  var filters = [
    { id: 'tous', label: 'Tous' },
    { id: 'hip-hop', label: 'Hip-Hop' },
    { id: 'contemporain', label: 'Contemporain' },
    { id: 'latino', label: 'Latino' },
    { id: 'jazz', label: 'Jazz' },
    { id: 'breakdance', label: 'Breakdance' },
  ];

  /* ---------- Helpers ---------- */
  function $(id) { return document.getElementById(id); }

  function fetchJSON(path) {
    return fetch(API_BASE + '/api' + path, { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  // Échappe le texte pour éviter toute injection HTML.
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Échappe une valeur destinée à un attribut url() / href.
  function escAttr(s) { return esc(s).replace(/\(/g, '%28').replace(/\)/g, '%29'); }

  // "2026-06-02..." -> "02 Juin 2026"
  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var s = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    return s.replace(/(^|\s)([a-zàâäéèêëîïôöùûüç])/g, function (m, p1, p2) {
      return p1 + p2.toUpperCase();
    });
  }

  /* ---------- Icônes placeholder ---------- */
  var ICON_PHOTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5L5 20"/></svg>';
  var ICON_USER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/></svg>';
  var ICON_NOTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';

  // Génère une « slot » image (image réelle si fournie, sinon placeholder).
  function slot(icon, dark, image, extraStyle) {
    var cover = image ? ' cover' : '';
    var bg = image ? "background-image:url('" + escAttr(image) + "');" : '';
    return '<div class="slot' + (dark ? ' dark' : '') + cover + '" style="' + bg + (extraStyle || '') + '">' +
      '<span class="glyph">' + icon + '</span></div>';
  }

  /* ---------- Animation « reveal » ---------- */
  var io = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' })
    : null;

  function observeNew(scope) {
    var els = (scope || document).querySelectorAll('[data-reveal]:not(.is-in)');
    Array.prototype.forEach.call(els, function (el) {
      if (!io) { el.classList.add('is-in'); return; }
      el.style.transitionDelay = (el.getAttribute('data-reveal-delay') || '0') + 'ms';
      io.observe(el);
    });
  }

  /* ---------- Rendu : onglets de filtre + cours ---------- */
  function renderTabs() {
    var el = $('filter-tabs');
    if (!el) return;
    el.innerHTML = filters.map(function (f) {
      var active = f.id === state.filter ? ' active' : '';
      return '<button class="tab' + active + '" data-id="' + esc(f.id) + '">' + esc(f.label) + '</button>';
    }).join('');
    Array.prototype.forEach.call(el.querySelectorAll('.tab'), function (btn) {
      btn.addEventListener('click', function () {
        state.filter = btn.getAttribute('data-id');
        renderTabs();
        renderCourses();
      });
    });
  }

  function renderCourses() {
    var grid = $('courses-grid');
    if (!grid) return;
    var list = state.filter === 'tous'
      ? state.courses
      : state.courses.filter(function (c) { return c.cat === state.filter; });

    if (!list.length) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#9aa1a8;font:500 16px/1.5 \'Barlow\'">Aucun cours pour le moment.</p>';
      return;
    }

    grid.innerHTML = list.map(function (c) {
      return '' +
        '<div class="card" data-reveal style="background:#fff;border:1px solid #ebedf0;border-radius:5px;overflow:hidden">' +
          '<div style="position:relative">' +
            '<div style="width:100%;height:228px">' + slot(ICON_PHOTO, false, c.image, 'border-radius:0') + '</div>' +
            '<span style="position:absolute;top:14px;left:14px;background:#FD504F;color:#fff;font:700 11.5px/1 \'Barlow\';letter-spacing:.09em;text-transform:uppercase;padding:8px 12px;border-radius:3px">' + esc(c.tag) + '</span>' +
          '</div>' +
          '<div style="padding:22px 22px 24px">' +
            '<h3 style="font-family:\'Barlow Condensed\';font-weight:700;font-size:25px;text-transform:uppercase;letter-spacing:-.01em;margin:0;color:#14171a">' + esc(c.title) + '</h3>' +
            (c.level || c.schedule
              ? '<div style="display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:10px;font:500 14px/1.3 \'Barlow\';color:#69727a">' +
                  (c.level ? '<span>' + esc(c.level) + '</span>' : '') +
                  (c.schedule ? '<span>' + esc(c.schedule) + '</span>' : '') +
                '</div>'
              : '') +
          '</div>' +
        '</div>';
    }).join('');
    observeNew(grid);
  }

  /* ---------- Rendu : professeurs ---------- */
  function socialBadge(label, url) {
    var common = 'width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;color:#14171a;font:700 13px/1 \'Barlow\';text-decoration:none';
    if (url) return '<a href="' + escAttr(url) + '" target="_blank" rel="noopener" style="' + common + '">' + label + '</a>';
    return '<span style="' + common + '">' + label + '</span>';
  }

  function renderTeachers() {
    var grid = $('teachers-grid');
    if (!grid) return;
    if (!state.teachers.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = state.teachers.map(function (t) {
      return '' +
        '<div class="teacher-card" data-reveal style="text-align:left">' +
          '<div style="position:relative;border-radius:6px;overflow:hidden">' +
            '<div style="width:100%;height:300px">' + slot(ICON_USER, false, t.image, 'border-radius:0') + '</div>' +
            '<div style="position:absolute;left:0;right:0;bottom:0;display:flex;gap:8px;padding:14px;background:linear-gradient(180deg,transparent,rgba(20,23,26,.55))">' +
              socialBadge('IG', t.instagram) + socialBadge('FB', t.facebook) +
            '</div>' +
          '</div>' +
          '<h3 style="font-family:\'Barlow Condensed\';font-weight:700;font-size:24px;text-transform:uppercase;letter-spacing:-.01em;margin:16px 0 0;color:#14171a">' + esc(t.name) + '</h3>' +
          '<div style="font:600 13px/1 \'Barlow\';letter-spacing:.06em;text-transform:uppercase;color:#e23c3b;margin-top:5px">' + esc(t.role) + '</div>' +
        '</div>';
    }).join('');
    observeNew(grid);
  }

  /* ---------- Rendu : évènements ---------- */
  function renderEvents() {
    var listEl = $('events-list');
    if (!listEl) return;
    if (!state.events.length) { listEl.innerHTML = ''; return; }
    listEl.innerHTML = state.events.map(function (ev) {
      return '' +
        '<div class="event-row" data-reveal data-r="eventrow" style="display:flex;align-items:center;gap:26px;background:#fff;border:1px solid #ebedf0;border-radius:6px;padding:22px 26px">' +
          '<div data-r="eventdate" style="flex:0 0 88px;width:88px;height:88px;background:#FD504F;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff">' +
            '<span style="font-family:\'Barlow Condensed\';font-weight:700;font-size:38px;line-height:.9">' + esc(ev.day) + '</span>' +
            '<span style="font:700 12px/1 \'Barlow\';letter-spacing:.12em;text-transform:uppercase;margin-top:4px">' + esc(ev.month) + '</span>' +
          '</div>' +
          '<div data-r="eventbody" style="flex:1 1 auto;min-width:0">' +
            (ev.tag ? '<span style="display:inline-block;background:#ffeceb;color:#e23c3b;font:700 10.5px/1 \'Barlow\';letter-spacing:.1em;text-transform:uppercase;padding:6px 10px;border-radius:3px">' + esc(ev.tag) + '</span>' : '') +
            '<h3 style="font-family:\'Barlow Condensed\';font-weight:700;font-size:27px;text-transform:uppercase;letter-spacing:-.01em;margin:11px 0 0;color:#14171a">' + esc(ev.title) + '</h3>' +
            '<div data-r="eventmeta" style="display:flex;flex-wrap:wrap;gap:8px 22px;margin-top:9px">' +
              (ev.time ? '<span style="display:inline-flex;align-items:center;gap:8px;font:500 14.5px/1.3 \'Barlow\';color:#69727a"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FD504F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>' + esc(ev.time) + '</span>' : '') +
              (ev.place ? '<span style="display:inline-flex;align-items:center;gap:8px;font:500 14.5px/1.3 \'Barlow\';color:#69727a"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FD504F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' + esc(ev.place) + '</span>' : '') +
            '</div>' +
          '</div>' +
          '<a href="#contact" class="event-cta" data-r="eventcta">Infos<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>' +
        '</div>';
    }).join('');
    observeNew(listEl);
  }

  /* ---------- Rendu : articles ---------- */
  function renderPosts() {
    var grid = $('posts-grid');
    if (!grid) return;
    if (!state.posts.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = state.posts.map(function (p) {
      return '' +
        '<a href="#blog" class="post-card" data-reveal>' +
          '<div style="position:relative">' +
            '<div style="width:100%;height:210px">' + slot(ICON_NOTE, false, p.image, 'border-radius:0') + '</div>' +
            (p.cat ? '<span style="position:absolute;top:14px;left:14px;background:#FD504F;color:#fff;font:700 11px/1 \'Barlow\';letter-spacing:.09em;text-transform:uppercase;padding:7px 11px;border-radius:3px">' + esc(p.cat) + '</span>' : '') +
          '</div>' +
          '<div style="padding:22px 22px 26px">' +
            '<div style="font:600 12.5px/1 \'Barlow\';letter-spacing:.08em;text-transform:uppercase;color:#9aa1a8">' + esc(p.date) + '</div>' +
            '<h3 style="font-family:\'Barlow Condensed\';font-weight:700;font-size:24px;text-transform:uppercase;letter-spacing:-.01em;margin:12px 0 0;color:#14171a">' + esc(p.title) + '</h3>' +
            '<p style="margin:12px 0 0;font:400 15px/1.6 \'Barlow\';color:#69727a">' + esc(p.excerpt) + '</p>' +
            '<span style="display:inline-flex;align-items:center;gap:7px;margin-top:18px;font:700 13px/1 \'Barlow\';letter-spacing:.05em;text-transform:uppercase;color:#e23c3b">Lire la suite<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>' +
          '</div>' +
        '</a>';
    }).join('');
    observeNew(grid);
  }

  /* ---------- Rendu : galerie ---------- */
  function galleryTileStyle(size) {
    if (size === 'large') return 'grid-column:span 2;grid-row:span 2;';
    if (size === 'wide') return 'grid-column:span 2;';
    return '';
  }

  function renderGallery() {
    var grid = $('gallery-grid');
    if (!grid) return;
    if (!state.gallery.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = state.gallery.map(function (g) {
      var label = g.label
        ? '<span style="position:absolute;left:18px;bottom:16px;background:rgba(20,23,26,.74);backdrop-filter:blur(4px);color:#fff;font:700 12px/1 \'Barlow\';letter-spacing:.08em;text-transform:uppercase;padding:9px 14px;border-radius:3px">' + esc(g.label) + '</span>'
        : '';
      return '<div class="gallery-tile' + (g.size === 'small' ? ' small' : '') + '" style="' + galleryTileStyle(g.size) + 'position:relative;border-radius:6px;overflow:hidden">' +
        slot(ICON_PHOTO, false, g.image, 'border-radius:6px') + label + '</div>';
    }).join('');
  }

  /* ---------- Chargement depuis l'API ---------- */
  function loadCourses() {
    return fetchJSON('/courses').then(function (d) {
      if (!d || !d.length) return;
      state.courses = d.map(function (c) {
        return { cat: c.category, tag: c.tag || c.category, title: c.title, level: c.level, schedule: c.schedule, image: c.image };
      });
      renderTabs();
      renderCourses();
    });
  }
  function loadTeachers() {
    return fetchJSON('/teachers').then(function (d) {
      if (!d || !d.length) return;
      state.teachers = d.map(function (t) {
        return { name: t.name, role: t.role, image: t.image, instagram: t.instagram, facebook: t.facebook };
      });
      renderTeachers();
    });
  }
  function loadEvents() {
    return fetchJSON('/events').then(function (d) {
      if (!d || !d.length) return;
      state.events = d.map(function (e) {
        return { day: e.day, month: e.month, tag: e.tag, title: e.title, time: e.time, place: e.place };
      });
      renderEvents();
    });
  }
  function loadPosts() {
    return fetchJSON('/posts').then(function (d) {
      if (!d || !d.length) return;
      state.posts = d.map(function (p) {
        return { cat: p.category, date: formatDate(p.date), title: p.title, excerpt: p.excerpt, image: p.image };
      });
      renderPosts();
    });
  }
  function loadGallery() {
    return fetchJSON('/gallery').then(function (d) {
      if (!d || !d.length) return;
      state.gallery = d.map(function (g) {
        return { label: g.label, size: g.size, image: g.image };
      });
      renderGallery();
    });
  }

  function loadAll() {
    return Promise.all([loadCourses(), loadTeachers(), loadEvents(), loadPosts(), loadGallery()]);
  }

  /* ---------- Démarrage ---------- */
  function init() {
    renderTabs();      // affiche les onglets de filtre immédiatement
    observeNew();      // active l'animation sur le contenu déjà présent
    loadAll();         // récupère et injecte les données de l'API
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose une petite API pour recharger manuellement si besoin
  window.ADC = window.ADC || {};
  window.ADC.reload = loadAll;
})();

