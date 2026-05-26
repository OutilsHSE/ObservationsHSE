// =============================================
// OBSERVATIONS HSE — index.js (version améliorée)
// =============================================

// --- COMPTEURS (bug PA corrigé) ---
function updateCounters() {
  const rows = document.querySelectorAll('#obs-table tbody tr');
  let cPP = 0, cPA = 0, cCD = 0, cAD = 0;
  rows.forEach(r => {
    const type = r.querySelector('.type-select').value;
    if (type === 'PP') cPP++;
    if (type === 'PA') cPA++;
    if (type === 'CD') cCD++;
    if (type === 'AD') cAD++;
  });
  document.getElementById('count-PP').textContent = cPP;
  document.getElementById('count-PA').textContent = cPA;
  document.getElementById('count-CD').textContent = cCD;
  document.getElementById('count-AD').textContent = cAD;
}

// --- AJOUT DE LIGNE ---
function addRow() {
  const tbody = document.querySelector('#obs-table tbody');
  const tr = document.createElement('tr');
  tr.setAttribute('draggable', 'true');
  tr.innerHTML = `
    <td class="medium-row">
      <select class="type-select" onchange="applyColor(this); updateCounters(); sortTableByType()">
        <option value="PP">PP 👍</option>
        <option value="PA">PA 👍</option>
        <option value="CD">CD ⚠️</option>
        <option value="AD">AD 🚫</option>
      </select>
    </td>
    <td class="large-row">
      <textarea class="description" oninput="autoResize(this)"></textarea>
    </td>
    <td class="large-row">
      <textarea class="can-disable action-text" oninput="autoResize(this)"></textarea>
    </td>
    <td class="medium-row">
      <input type="text" class="can-disable echeance-input" placeholder="JJ/MM/AAAA">
    </td>
    <td class="medium-row">
      <select class="can-disable statut-select">
        <option>À planifier</option>
        <option>En cours</option>
        <option>Clôturée</option>
      </select>
    </td>
    <td class="small-row no-print">
      <button class="remove-row" onclick="removeRow(this)">✖</button>
    </td>
  `;
  tbody.appendChild(tr);
  applyColor(tr.querySelector('.type-select'));
  updateCounters();
  sortTableByType();
}

// --- AUTO RESIZE TEXTAREA ---
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

// --- SUPPRESSION DE LIGNE ---
function removeRow(btn) {
  btn.closest('tr').remove();
  updateCounters();
}

// --- ACTIVER/DÉSACTIVER CHAMPS SELON TYPE ---
function toggleInputs(selectElement) {
  const tr = selectElement.closest('tr');
  const inputs = tr.querySelectorAll('.can-disable');
  if (selectElement.value === 'PP') {
    inputs.forEach(input => input.setAttribute('disabled', 'disabled'));
  } else {
    inputs.forEach(input => input.removeAttribute('disabled'));
  }
}

// --- TRI PAR TYPE ---
function sortTableByType() {
  const tbody = document.querySelector('#obs-table tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const order = { 'PP': 0, 'PA': 1, 'CD': 2, 'AD': 3 };
  rows.sort((a, b) => {
    const typeA = a.querySelector('.type-select').value;
    const typeB = b.querySelector('.type-select').value;
    return (order[typeA] || 0) - (order[typeB] || 0);
  });
  rows.forEach(row => tbody.appendChild(row));
}

// --- COULEUR DE LIGNE ---
function applyColor(selectElement) {
  const tr = selectElement.closest('tr');
  const colors = {
    'PP': '#d4edda',
    'PA': '#81bcec',
    'CD': '#fff3cd',
    'AD': '#f8d7da'
  };
  tr.style.backgroundColor = colors[selectElement.value] || '';
  toggleInputs(selectElement);
}

// --- MODALES ---
function openModal() {
  document.getElementById('imageModal').style.display = 'block';
}
function closeModal() {
  document.getElementById('imageModal').style.display = 'none';
}
function openModalFho() {
  document.getElementById('imageFhoModal').style.display = 'block';
}
function closeFhoModal() {
  document.getElementById('imageFhoModal').style.display = 'none';
}

document.getElementById('openModalBtn').onclick = openModal;
document.getElementById('openModalFhoBtn').onclick = openModalFho;
document.getElementsByClassName('close')[0].onclick = closeModal;
document.getElementsByClassName('close-fho')[0].onclick = closeFhoModal;

window.onclick = function(event) {
  if (event.target === document.getElementById('imageModal')) closeModal();
  if (event.target === document.getElementById('imageFhoModal')) closeFhoModal();
};

// =============================================
// NUMÉROTATION AUTOMATIQUE DES CR
// =============================================
function generateCRNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const key = 'cr-counter-' + year;
  let counter = parseInt(localStorage.getItem(key) || '0') + 1;
  localStorage.setItem(key, counter.toString());
  return 'OBS-' + year + '-' + String(counter).padStart(3, '0');
}

// =============================================
// HISTORIQUE LOCAL (localStorage)
// =============================================
function getHistorique() {
  try {
    return JSON.parse(localStorage.getItem('historique-cr') || '[]');
  } catch (e) {
    return [];
  }
}

function saveHistorique(data) {
  localStorage.setItem('historique-cr', JSON.stringify(data));
}

// --- SAUVEGARDER LE CR ACTUEL ---
function saveCR() {
  const crNum = document.getElementById('cr-number').textContent;
  const date = document.getElementById('visite-date').value;
  const chantier = document.getElementById('chantier').value;
  const activite = document.getElementById('activite').value;
  const conducteur = document.getElementById('conducteur').value;

  if (!chantier.trim()) {
    alert('Veuillez renseigner le nom du chantier avant de sauvegarder.');
    return;
  }

  // Collecter les observations
  const observations = [];
  document.querySelectorAll('#obs-table tbody tr').forEach(tr => {
    const type = tr.querySelector('.type-select').value;
    const desc = tr.querySelector('.description').value;
    const action = tr.querySelector('.action-text') ? tr.querySelector('.action-text').value : '';
    const echeance = tr.querySelector('.echeance-input') ? tr.querySelector('.echeance-input').value : '';
    const statut = tr.querySelector('.statut-select') ? tr.querySelector('.statut-select').value : '';
    observations.push({ type, desc, action, echeance, statut });
  });

  const cr = {
    id: crNum,
    date: date,
    chantier: chantier,
    activite: activite,
    conducteur: conducteur,
    observations: observations,
    savedAt: new Date().toISOString()
  };

  // Sauvegarder dans l'historique
  const historique = getHistorique();
  // Remplacer si même ID existe déjà
  const existIndex = historique.findIndex(h => h.id === crNum);
  if (existIndex >= 0) {
    historique[existIndex] = cr;
  } else {
    historique.unshift(cr);
  }
  saveHistorique(historique);

  // Sauvegarder les chantiers/conducteurs/activités pour autocomplétion
  saveAutocompletionValue('chantiers', chantier);
  saveAutocompletionValue('conducteurs', conducteur);
  saveAutocompletionValue('activites', activite);
  loadAutocompletion();

  showToast('CR ' + crNum + ' sauvegardé ✓');
}

// --- TOAST NOTIFICATION ---
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('visible');
  setTimeout(() => {
    toast.classList.remove('visible');
    toast.classList.add('hidden');
  }, 2500);
}

// --- PANNEAU HISTORIQUE ---
function toggleHistorique() {
  const panel = document.getElementById('historique-panel');
  const overlay = document.getElementById('overlay');
  const isHidden = panel.classList.contains('hidden');
  if (isHidden) {
    renderHistorique();
    panel.classList.remove('hidden');
    overlay.classList.remove('hidden');
  } else {
    panel.classList.add('hidden');
    overlay.classList.add('hidden');
  }
}

function renderHistorique() {
  const list = document.getElementById('historique-list');
  const historique = getHistorique();
  if (historique.length === 0) {
    list.innerHTML = '<p class="historique-empty">Aucun CR sauvegardé.</p>';
    return;
  }
  list.innerHTML = historique.map((cr, i) => {
    const nbObs = cr.observations ? cr.observations.length : 0;
    const nbPP = cr.observations ? cr.observations.filter(o => o.type === 'PP').length : 0;
    const nbPA = cr.observations ? cr.observations.filter(o => o.type === 'PA').length : 0;
    const nbCD = cr.observations ? cr.observations.filter(o => o.type === 'CD').length : 0;
    const nbAD = cr.observations ? cr.observations.filter(o => o.type === 'AD').length : 0;
    return `
      <div class="historique-item" data-index="${i}">
        <div class="historique-item-header">
          <strong>${cr.id}</strong>
          <span class="historique-date">${cr.date || '—'}</span>
        </div>
        <div class="historique-item-body">
          <span>📍 ${cr.chantier || '—'}</span>
          <span class="historique-obs-count">${nbObs} obs. (${nbPP} PP, ${nbPA} PA, ${nbCD} CD, ${nbAD} AD)</span>
        </div>
        <div class="historique-item-actions">
          <button onclick="loadCR(${i})" class="btn-load">📂 Charger</button>
          <button onclick="deleteCR(${i})" class="btn-delete-cr">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function filterHistorique() {
  const search = document.getElementById('historique-search').value.toLowerCase();
  const items = document.querySelectorAll('.historique-item');
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(search) ? '' : 'none';
  });
}

// --- CHARGER UN CR DEPUIS L'HISTORIQUE ---
function loadCR(index) {
  const historique = getHistorique();
  const cr = historique[index];
  if (!cr) return;

  document.getElementById('cr-number').textContent = cr.id;
  document.getElementById('visite-date').value = cr.date || '';
  document.getElementById('chantier').value = cr.chantier || '';
  document.getElementById('activite').value = cr.activite || '';
  document.getElementById('conducteur').value = cr.conducteur || '';

  // Vider le tableau
  const tbody = document.querySelector('#obs-table tbody');
  tbody.innerHTML = '';

  // Recharger les observations
  if (cr.observations) {
    cr.observations.forEach(obs => {
      addRow();
      const tr = tbody.lastElementChild;
      tr.querySelector('.type-select').value = obs.type;
      tr.querySelector('.description').value = obs.desc || '';
      if (tr.querySelector('.action-text')) tr.querySelector('.action-text').value = obs.action || '';
      if (tr.querySelector('.echeance-input')) tr.querySelector('.echeance-input').value = obs.echeance || '';
      if (tr.querySelector('.statut-select')) tr.querySelector('.statut-select').value = obs.statut || 'À planifier';
      applyColor(tr.querySelector('.type-select'));
    });
  }

  updateCounters();
  toggleHistorique();
  showToast('CR ' + cr.id + ' chargé');
}

// --- SUPPRIMER UN CR ---
function deleteCR(index) {
  if (!confirm('Supprimer ce CR de l\'historique ?')) return;
  const historique = getHistorique();
  historique.splice(index, 1);
  saveHistorique(historique);
  renderHistorique();
}

// --- TOUT SUPPRIMER ---
function clearHistorique() {
  if (!confirm('Supprimer TOUS les CR de l\'historique ? Cette action est irréversible.')) return;
  localStorage.removeItem('historique-cr');
  renderHistorique();
  showToast('Historique vidé');
}

// =============================================
// AUTOCOMPLÉTION (chantiers, conducteurs, activités)
// =============================================
function saveAutocompletionValue(key, value) {
  if (!value || !value.trim()) return;
  let values = [];
  try { values = JSON.parse(localStorage.getItem('autocomplete-' + key) || '[]'); } catch(e) { values = []; }
  const trimmed = value.trim();
  if (!values.includes(trimmed)) {
    values.push(trimmed);
    // Garder les 50 derniers max
    if (values.length > 50) values = values.slice(-50);
    localStorage.setItem('autocomplete-' + key, JSON.stringify(values));
  }
}

function loadAutocompletion() {
  ['chantiers', 'conducteurs', 'activites'].forEach(key => {
    const listId = key + '-list';
    const datalist = document.getElementById(listId);
    if (!datalist) return;
    let values = [];
    try { values = JSON.parse(localStorage.getItem('autocomplete-' + key) || '[]'); } catch(e) {}
    datalist.innerHTML = values.map(v => `<option value="${v}">`).join('');
  });
}

// =============================================
// EXPORT EXCEL
// =============================================
function exportExcel() {
  const date = document.getElementById('visite-date').value;
  const chantier = document.getElementById('chantier').value;
  const crNum = document.getElementById('cr-number').textContent;

  const data = [];
  // En-tête
  data.push(['CR', crNum, 'Date', date, 'Chantier', chantier]);
  data.push([]);
  data.push(['Type', 'Description', 'Action', 'Échéance', 'Statut']);

  document.querySelectorAll('#obs-table tbody tr').forEach(tr => {
    const type = tr.querySelector('.type-select').value;
    const desc = tr.querySelector('.description').value;
    const action = tr.querySelector('.action-text') ? tr.querySelector('.action-text').value : '';
    const echeance = tr.querySelector('.echeance-input') ? tr.querySelector('.echeance-input').value : '';
    const statut = tr.querySelector('.statut-select') ? tr.querySelector('.statut-select').value : '';
    data.push([type, desc, action, echeance, statut]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  // Largeurs de colonnes
  ws['!cols'] = [
    { wch: 8 },
    { wch: 50 },
    { wch: 50 },
    { wch: 15 },
    { wch: 15 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Observations HSE');
  const fileName = (crNum || 'OBS-HSE') + '_' + (chantier || 'export').replace(/[^a-zA-Z0-9]/g, '_') + '.xlsx';
  XLSX.writeFile(wb, fileName);
}

// --- EXPORTER TOUT L'HISTORIQUE EN EXCEL ---
function exportAllHistoriqueExcel() {
  const historique = getHistorique();
  if (historique.length === 0) {
    alert('Aucun CR dans l\'historique.');
    return;
  }
  const data = [];
  data.push(['N° CR', 'Date', 'Chantier', 'Activité', 'Conducteur', 'Type', 'Description', 'Action', 'Échéance', 'Statut']);

  historique.forEach(cr => {
    if (cr.observations && cr.observations.length > 0) {
      cr.observations.forEach(obs => {
        data.push([cr.id, cr.date, cr.chantier, cr.activite, cr.conducteur, obs.type, obs.desc, obs.action, obs.echeance, obs.statut]);
      });
    } else {
      data.push([cr.id, cr.date, cr.chantier, cr.activite, cr.conducteur, '', '', '', '', '']);
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 18 }, { wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 20 },
    { wch: 8 }, { wch: 50 }, { wch: 50 }, { wch: 15 }, { wch: 15 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Historique CR HSE');
  XLSX.writeFile(wb, 'Historique_CR_HSE.xlsx');
}

// =============================================
// NOUVEAU CR
// =============================================
function nouveauCR() {
  if (!confirm('Créer un nouveau CR ? Le CR actuel non sauvegardé sera perdu.')) return;
  document.getElementById('cr-number').textContent = generateCRNumber();
  document.getElementById('visite-date').valueAsDate = new Date();
  document.getElementById('chantier').value = '';
  document.getElementById('activite').value = '';
  document.getElementById('conducteur').value = '';
  document.querySelector('#obs-table tbody').innerHTML = '';
  // Vider les photos
  document.getElementById('photo-container-chantier').innerHTML = '';
  document.getElementById('photo-container').innerHTML = '';
  addRow();
}

// =============================================
// PHOTOS CHANTIER
// =============================================
const photoInputChantier = document.getElementById('photo-input-chantier');
const photoContainerChantier = document.getElementById('photo-container-chantier');

photoInputChantier.addEventListener('change', function() {
  Array.from(this.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const wrapper = document.createElement('div');
      wrapper.className = 'photo-wrapper';

      const img = document.createElement('img');
      img.src = e.target.result;

      const btn = document.createElement('button');
      btn.textContent = '✕';
      btn.className = 'photo-delete no-print';
      btn.addEventListener('click', () => wrapper.remove());

      wrapper.appendChild(img);
      wrapper.appendChild(btn);
      photoContainerChantier.appendChild(wrapper);
    };
    reader.readAsDataURL(file);
  });
  this.value = '';
});

// =============================================
// PHOTOS OBSERVATIONS
// =============================================
const photoInput = document.getElementById('photo-input');
const photoContainer = document.getElementById('photo-container');

function updatePhotoLabels() {
  const wrappers = photoContainer.querySelectorAll('.photo-wrapper');
  wrappers.forEach((wrapper, i) => {
    const label = wrapper.querySelector('label');
    if (label) label.textContent = 'Photo ' + (i + 1);
  });
}

photoInput.addEventListener('change', function() {
  Array.from(this.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const wrapper = document.createElement('div');
      wrapper.className = 'photo-wrapper';

      const img = document.createElement('img');
      img.src = e.target.result;

      const btn = document.createElement('button');
      btn.textContent = '✕';
      btn.className = 'photo-delete no-print';
      btn.addEventListener('click', () => {
        wrapper.remove();
        updatePhotoLabels();
      });

      const label = document.createElement('label');
      label.style.display = 'block';
      label.style.marginTop = '5px';
      label.style.fontWeight = 'bold';

      wrapper.appendChild(img);
      wrapper.appendChild(btn);
      wrapper.appendChild(label);
      photoContainer.appendChild(wrapper);
      updatePhotoLabels();
    };
    reader.readAsDataURL(file);
  });
  this.value = '';
});

// =============================================
// DRAG & DROP DES LIGNES
// =============================================
const tbodyObs = document.querySelector('#obs-table tbody');
let draggingRow = null;

tbodyObs.addEventListener('dragstart', e => {
  const tr = e.target.closest('tr');
  if (!tr) return;
  draggingRow = tr;
  tr.classList.add('dragging');
});

tbodyObs.addEventListener('dragend', () => {
  if (draggingRow) draggingRow.classList.remove('dragging');
  draggingRow = null;
  updateCounters();
});

tbodyObs.addEventListener('dragover', e => {
  e.preventDefault();
  const y = e.clientY;
  const after = getDragAfterElement(tbodyObs, y);
  if (after == null) {
    tbodyObs.appendChild(draggingRow);
  } else {
    tbodyObs.insertBefore(draggingRow, after);
  }
});

function getDragAfterElement(container, y) {
  const rows = [...container.querySelectorAll('tr:not(.dragging)')];
  return rows.reduce((closest, row) => {
    const box = row.getBoundingClientRect();
    const offset = y - (box.top + box.height / 2);
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: row };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// =============================================
// INITIALISATION
// =============================================
window.onload = function() {
  document.getElementById('cr-number').textContent = generateCRNumber();
  document.getElementById('visite-date').valueAsDate = new Date();
  loadAutocompletion();
  addRow();
};
