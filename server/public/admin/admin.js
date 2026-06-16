/* ===========================================================================
 * Interface d'administration — Avenir Crazy Dance
 * SPA vanilla : connexion JWT, navigation, CRUD et upload d'images.
 * ======================================================================== */

const API = '/api';
let token = localStorage.getItem('adc_token') || '';

/* ---------- Configuration déclarative des sections ---------- */
const COURSE_CATEGORIES = ['hip-hop', 'contemporain', 'latino', 'jazz', 'breakdance'];
const GALLERY_SIZES = [
  { value: 'small', label: 'Petite' },
  { value: 'wide', label: 'Large (2 colonnes)' },
  { value: 'large', label: 'Grande (2x2)' },
];

const SECTIONS = {
  courses: {
    title: 'Cours',
    endpoint: 'courses',
    desc: 'Gérez les cours par style, leurs horaires, niveaux et visuels.',
    singular: 'cours',
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'category', label: 'Catégorie', type: 'select', options: COURSE_CATEGORIES.map((c) => ({ value: c, label: c })), required: true },
      { name: 'tag', label: 'Badge (tag)', type: 'text', placeholder: 'Hip-Hop' },
      { name: 'level', label: 'Niveau', type: 'text', placeholder: 'Débutant' },
      { name: 'schedule', label: 'Horaire', type: 'text', placeholder: 'Lun & Mer · 18h00' },
      { name: 'order', label: 'Ordre', type: 'number' },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      { name: 'image', label: 'Image du cours', type: 'image', full: true },
      { name: 'published', label: 'Publié', type: 'checkbox' },
    ],
    card: (it) => ({
      title: it.title,
      meta: [pill(it.tag || it.category), it.level, it.schedule].filter(Boolean),
    }),
  },
  teachers: {
    title: 'Professeurs',
    endpoint: 'teachers',
    desc: "Gérez l'équipe : portraits, spécialités et réseaux sociaux.",
    singular: 'professeur',
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'role', label: 'Spécialité', type: 'text', placeholder: 'Hip-Hop & Breaking' },
      { name: 'instagram', label: 'Instagram (URL)', type: 'text' },
      { name: 'facebook', label: 'Facebook (URL)', type: 'text' },
      { name: 'order', label: 'Ordre', type: 'number' },
      { name: 'bio', label: 'Biographie', type: 'textarea', full: true },
      { name: 'image', label: 'Portrait', type: 'image', full: true },
      { name: 'published', label: 'Publié', type: 'checkbox' },
    ],
    card: (it) => ({ title: it.name, meta: [pill(it.role)].filter(Boolean) }),
  },
  posts: {
    title: 'Blog',
    endpoint: 'posts',
    desc: 'Rédigez et gérez les articles et actualités du studio.',
    singular: 'article',
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'category', label: 'Catégorie', type: 'text', placeholder: 'Conseils' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'order', label: 'Ordre', type: 'number' },
      { name: 'excerpt', label: 'Extrait', type: 'textarea', full: true },
      { name: 'content', label: 'Contenu', type: 'textarea', full: true },
      { name: 'image', label: "Image de l'article", type: 'image', full: true },
      { name: 'published', label: 'Publié', type: 'checkbox' },
    ],
    card: (it) => ({ title: it.title, meta: [pill(it.category), fmtDate(it.date)].filter(Boolean) }),
  },
  events: {
    title: 'Évènements',
    endpoint: 'events',
    desc: "Galas, stages, battles et portes ouvertes : gérez l'agenda du club.",
    singular: 'évènement',
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'tag', label: 'Type', type: 'text', placeholder: 'Spectacle' },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'time', label: 'Heure', type: 'text', placeholder: '19h00' },
      { name: 'place', label: 'Lieu', type: 'text', placeholder: 'Studio principal' },
      { name: 'order', label: 'Ordre', type: 'number' },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      { name: 'image', label: "Image de l'évènement", type: 'image', full: true },
      { name: 'published', label: 'Publié', type: 'checkbox' },
    ],
    card: (it) => ({ title: it.title, meta: [pill(it.tag), fmtDate(it.date), it.time, it.place].filter(Boolean) }),
  },
  gallery: {
    title: 'Galerie',
    endpoint: 'gallery',
    desc: 'Ajoutez les photos de la mosaïque (performances, battles, répétitions).',
    singular: 'photo',
    fields: [
      { name: 'image', label: 'Photo', type: 'image', required: true, full: true },
      { name: 'label', label: 'Légende', type: 'text', placeholder: 'Showcase annuel' },
      { name: 'category', label: 'Catégorie', type: 'text', placeholder: 'Hip-Hop' },
      { name: 'size', label: 'Taille de la tuile', type: 'select', options: GALLERY_SIZES },
      { name: 'order', label: 'Ordre', type: 'number' },
      { name: 'published', label: 'Publié', type: 'checkbox' },
    ],
    card: (it) => ({ title: it.label || '(sans légende)', meta: [pill(it.category), sizeLabel(it.size)].filter(Boolean) }),
  },
};

/* ---------- Helpers ---------- */
function pill(text, muted) {
  if (!text) return null;
  return `<span class="pill ${muted ? 'pill-muted' : ''}">${escapeHtml(text)}</span>`;
}
function sizeLabel(v) {
  const f = GALLERY_SIZES.find((s) => s.value === v);
  return f ? f.label : v;
}
function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date)) return '';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function toInputDate(d) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date)) return '';
  return date.toISOString().slice(0, 10);
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

/* ---------- Appels API ---------- */
async function api(path, { method = 'GET', body, isForm } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    logout();
    throw new Error('Session expirée, reconnectez-vous.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur serveur.');
  return data;
}

/* ---------- État ---------- */
let currentSection = 'courses';
let editingId = null;

/* ---------- Connexion ---------- */
const $ = (sel) => document.querySelector(sel);

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#login-error');
  errEl.hidden = true;
  const form = e.currentTarget;
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: { email: form.email.value, password: form.password.value },
    });
    token = data.token;
    localStorage.setItem('adc_token', token);
    localStorage.setItem('adc_email', data.user.email);
    showApp(data.user.email);
  } catch (err) {
    errEl.textContent = err.message;
    errEl.hidden = false;
  }
});

function showApp(email) {
  $('#login-screen').hidden = true;
  $('#app').hidden = false;
  $('#user-email').textContent = email || localStorage.getItem('adc_email') || '';
  selectSection('courses');
}

function logout() {
  token = '';
  localStorage.removeItem('adc_token');
  localStorage.removeItem('adc_email');
  $('#app').hidden = true;
  $('#login-screen').hidden = false;
}

$('#logout').addEventListener('click', logout);

/* ---------- Navigation ---------- */
$('#nav').addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-item');
  if (!btn) return;
  selectSection(btn.dataset.section);
});

function selectSection(key) {
  currentSection = key;
  document.querySelectorAll('.nav-item').forEach((b) =>
    b.classList.toggle('active', b.dataset.section === key)
  );
  const cfg = SECTIONS[key];
  $('#section-title').textContent = cfg.title;
  $('#section-desc').textContent = cfg.desc;
  loadList();
}

/* ---------- Liste ---------- */
async function loadList() {
  const cfg = SECTIONS[currentSection];
  const list = $('#list');
  list.innerHTML = '<div class="empty">Chargement…</div>';
  try {
    const items = await api(`/${cfg.endpoint}?all=1`);
    if (!items.length) {
      list.innerHTML = `<div class="empty">Aucun ${cfg.singular} pour le moment. Cliquez sur « + Ajouter ».</div>`;
      return;
    }
    list.innerHTML = items.map((it) => renderCard(cfg, it)).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
  }
}

function renderCard(cfg, it) {
  const c = cfg.card(it);
  const thumb = it.image
    ? `<div class="card-thumb" style="background-image:url('${escapeHtml(it.image)}')"></div>`
    : `<div class="card-thumb">Aucune image</div>`;
  const unpublished = it.published === false ? pill('Brouillon', true) : '';
  return `
    <div class="card">
      ${thumb}
      <div class="card-body">
        <div class="card-title">${escapeHtml(c.title)}</div>
        <div class="card-meta">${[...c.meta, unpublished].filter(Boolean).join(' ')}</div>
      </div>
      <div class="card-actions">
        <button class="btn btn-ghost btn-sm" data-edit="${it._id}">Modifier</button>
        <button class="btn btn-danger btn-sm" data-del="${it._id}">Supprimer</button>
      </div>
    </div>`;
}

$('#list').addEventListener('click', async (e) => {
  const editBtn = e.target.closest('[data-edit]');
  const delBtn = e.target.closest('[data-del]');
  if (editBtn) openModal(editBtn.dataset.edit);
  if (delBtn) deleteItem(delBtn.dataset.del);
});

async function deleteItem(id) {
  const cfg = SECTIONS[currentSection];
  if (!confirm(`Supprimer ce ${cfg.singular} ? Cette action est irréversible.`)) return;
  try {
    await api(`/${cfg.endpoint}/${id}`, { method: 'DELETE' });
    toast('Supprimé.');
    loadList();
  } catch (err) {
    toast(err.message, true);
  }
}

/* ---------- Modale / formulaire ---------- */
$('#add-btn').addEventListener('click', () => openModal(null));
$('#modal-close').addEventListener('click', closeModal);
$('#cancel-btn').addEventListener('click', closeModal);
$('.modal-backdrop').addEventListener('click', closeModal);

async function openModal(id) {
  const cfg = SECTIONS[currentSection];
  editingId = id;
  let item = {};
  if (id) {
    try {
      item = await api(`/${cfg.endpoint}/${id}`);
    } catch (err) {
      return toast(err.message, true);
    }
  }
  $('#modal-title').textContent = (id ? 'Modifier ' : 'Ajouter ') + cfg.singular;
  $('#form-error').hidden = true;
  buildForm(cfg, item);
  $('#modal').hidden = false;
}

function closeModal() {
  $('#modal').hidden = true;
  editingId = null;
}

function buildForm(cfg, item) {
  const form = $('#entity-form');
  form.innerHTML = cfg.fields.map((f) => renderField(f, item[f.name])).join('');
  // Branche les uploaders d'image
  form.querySelectorAll('[data-uploader]').forEach(bindUploader);
}

function renderField(f, value) {
  const cls = f.full ? 'full' : '';
  if (f.type === 'image') {
    const preview = value
      ? `style="background-image:url('${escapeHtml(value)}')"`
      : '';
    return `
      <div class="${cls}">
        <label>${f.label}${f.required ? ' *' : ''}</label>
        <div class="uploader" data-uploader data-name="${f.name}">
          <div class="uploader-preview" ${preview}>${value ? '' : 'Choisir'}</div>
          <div class="uploader-info">
            <input type="hidden" name="${f.name}" value="${escapeHtml(value || '')}" />
            <input type="file" accept="image/*" />
            <button type="button" class="btn btn-ghost btn-sm" data-pick>Téléverser une image</button>
            <button type="button" class="btn btn-danger btn-sm" data-clear ${value ? '' : 'hidden'}>Retirer</button>
          </div>
        </div>
      </div>`;
  }
  if (f.type === 'textarea') {
    return `<div class="${cls}"><label>${f.label}${f.required ? ' *' : ''}
      <textarea name="${f.name}" placeholder="${f.placeholder || ''}">${escapeHtml(value || '')}</textarea></label></div>`;
  }
  if (f.type === 'select') {
    const opts = f.options
      .map((o) => `<option value="${o.value}" ${value === o.value ? 'selected' : ''}>${escapeHtml(o.label)}</option>`)
      .join('');
    return `<div class="${cls}"><label>${f.label}${f.required ? ' *' : ''}
      <select name="${f.name}">${opts}</select></label></div>`;
  }
  if (f.type === 'checkbox') {
    const checked = value === undefined ? true : !!value;
    return `<div class="${cls}"><label style="flex-direction:row;align-items:center;gap:10px;text-transform:none;letter-spacing:0">
      <input type="checkbox" name="${f.name}" ${checked ? 'checked' : ''} style="width:auto" /> ${f.label}</label></div>`;
  }
  const val = f.type === 'date' ? toInputDate(value) : escapeHtml(value ?? '');
  return `<div class="${cls}"><label>${f.label}${f.required ? ' *' : ''}
    <input type="${f.type}" name="${f.name}" value="${val}" placeholder="${f.placeholder || ''}" /></label></div>`;
}

/* ---------- Upload d'image ---------- */
function bindUploader(box) {
  const fileInput = box.querySelector('input[type=file]');
  const hidden = box.querySelector('input[type=hidden]');
  const preview = box.querySelector('.uploader-preview');
  const clearBtn = box.querySelector('[data-clear]');

  box.querySelector('[data-pick]').addEventListener('click', () => fileInput.click());
  preview.addEventListener('click', () => fileInput.click());

  clearBtn.addEventListener('click', () => {
    hidden.value = '';
    preview.style.backgroundImage = '';
    preview.textContent = 'Choisir';
    clearBtn.hidden = true;
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    preview.textContent = '…';
    const fd = new FormData();
    fd.append('image', file);
    try {
      const data = await api('/upload', { method: 'POST', body: fd, isForm: true });
      hidden.value = data.url;
      preview.style.backgroundImage = `url('${data.url}')`;
      preview.textContent = '';
      clearBtn.hidden = false;
    } catch (err) {
      preview.textContent = 'Erreur';
      toast(err.message, true);
    }
    fileInput.value = '';
  });
}

/* ---------- Enregistrement ---------- */
$('#entity-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const cfg = SECTIONS[currentSection];
  const form = e.currentTarget;
  const payload = {};
  for (const f of cfg.fields) {
    const el = form.elements[f.name];
    if (!el) continue;
    if (f.type === 'checkbox') payload[f.name] = el.checked;
    else if (f.type === 'number') payload[f.name] = el.value === '' ? 0 : Number(el.value);
    else payload[f.name] = el.value;
  }
  // Validation minimale côté client
  for (const f of cfg.fields) {
    if (f.required && !String(payload[f.name] || '').trim()) {
      return showFormError(`Le champ « ${f.label} » est obligatoire.`);
    }
  }
  try {
    if (editingId) {
      await api(`/${cfg.endpoint}/${editingId}`, { method: 'PUT', body: payload });
      toast('Modifications enregistrées.');
    } else {
      await api(`/${cfg.endpoint}`, { method: 'POST', body: payload });
      toast('Ajouté avec succès.');
    }
    closeModal();
    loadList();
  } catch (err) {
    showFormError(err.message);
  }
});

function showFormError(msg) {
  const el = $('#form-error');
  el.textContent = msg;
  el.hidden = false;
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg, isError) {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast' + (isError ? ' error' : '');
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 3000);
}

/* ---------- Démarrage : vérifie le jeton existant ---------- */
(async function boot() {
  if (!token) return;
  try {
    const data = await api('/auth/me');
    showApp(data.user.email);
  } catch {
    logout();
  }
})();

