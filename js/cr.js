/* CR HSE — Observations HSE · CDES — page V2 (05/10/2026)
   Découpée : index.html · css/cr.css · js/cr.js · js/rapport.js · js/demarrage.js.
   Ni adresse de serveur, ni mot de passe, ni nom de personne dans ce dépôt public :
   l'appareil est « branché » par le lien distribué par l'intranet HSE. */
    // ========================================================
    // SERVEUR — branchement de l'appareil (V2)
    // ========================================================
    // Aucune adresse ni mot de passe dans ce fichier public. L'appareil est « branché »
    // une fois, en ouvrant le CR depuis la tuile de l'intranet HSE (lien …#config=…) :
    // l'adresse du serveur et le mot de passe sont alors gardés sur CET appareil.
    // Un seul serveur reçoit l'envoi au PA et l'IA du mode vocal.
    const CLE_CONF = 'crhse_conf_v2', CLE_CONDUCTEURS = 'crhse_conducteurs_v2', CLE_VISITEUR = 'crhse_visiteur_v2';
    function lireConf() { try { return JSON.parse(localStorage.getItem(CLE_CONF) || '{}'); } catch (e) { return {}; } }
    function ecrireConf(c) { try { localStorage.setItem(CLE_CONF, JSON.stringify(c)); } catch (e) {} }
    let CONF = lireConf();
    function estBranche() { return !!(CONF.webhook && CONF.secret); }

    async function appelServeur(charge) {
      if (!estBranche()) { const e = new Error('appareil non branché'); e.refus = true; majBandeau(); throw e; }
      charge.secret = CONF.secret;
      const r = await fetch(CONF.webhook, { method: 'POST', body: JSON.stringify(charge), redirect: 'follow' });
      const t = await r.text();
      if (/^\s*</.test(t)) throw new Error('le serveur a renvoyé une page web');
      let j;
      try { j = JSON.parse(t); } catch (e) { throw new Error('réponse illisible du serveur'); }
      if (j && j.refus) { const e = new Error(j.message || 'accès refusé'); e.refus = true; majBandeau(true); throw e; }
      return j;
    }

    // Lien de branchement : …/#config=<adresse + mot de passe encodés>. Lu UNE fois,
    // mémorisé sur l'appareil, puis retiré de la barre d'adresse.
    function appliquerLienBranchement() {
      const m = /[#&]config=([A-Za-z0-9_-]+)/.exec(location.hash || '');
      if (!m) return false;
      try {
        let b = m[1].replace(/-/g, '+').replace(/_/g, '/');
        b += '='.repeat((4 - b.length % 4) % 4);
        const c = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b), ch => ch.charCodeAt(0))));
        if (c && /\/exec$/.test(c.u || '') && c.s) {
          CONF = { webhook: c.u, secret: c.s }; ecrireConf(CONF);
          history.replaceState(null, '', location.pathname + location.search);
          setTimeout(() => toast('Appareil branché au serveur CDES ✓', 'success'), 400);
          return true;
        }
      } catch (e) { /* lien abîmé */ }
      setTimeout(() => toast('Lien de branchement illisible : rouvre le CR depuis l\'intranet', 'error'), 400);
      return false;
    }

    function majBandeau(refus) {
      const b = document.getElementById('etat-branchement');
      if (!b) return;
      if (refus) b.innerHTML = '<div class="bandeau ko">⛔ <b>Accès refusé par le serveur.</b> Rouvre le CR HSE depuis la tuile de l\'intranet HSE pour rebrancher cet appareil.</div>';
      else if (!estBranche()) b.innerHTML = '<div class="bandeau">🔌 <b>Appareil non branché.</b> Ouvre le CR HSE depuis la tuile de l\'intranet HSE. En attendant, tu peux remplir le CR, l\'exporter en PDF ou en Excel ; l\'envoi au PA et le mode vocal marcheront une fois branché.</div>';
      else b.innerHTML = '';
    }

    // Conducteurs et visiteur HSE : envoyés par le serveur (Référentiel CDES), seulement à un appareil branché.
    function optionConducteur(sel, nom) {
      if (!nom || Array.from(sel.options).some(o => o.value === nom)) return;
      const o = document.createElement('option'); o.textContent = nom; sel.appendChild(o);
    }
    function afficherConducteurs() {
      const sel = document.getElementById('conducteur');
      if (!sel) return;
      const garde = sel.value;
      let l = [];
      try { l = JSON.parse(localStorage.getItem(CLE_CONDUCTEURS) || '[]'); } catch (e) {}
      sel.innerHTML = '<option value="">— Sélectionner —</option>';
      l.forEach(n => optionConducteur(sel, n));
      optionConducteur(sel, garde);   // un CR en brouillon garde son conducteur
      sel.value = garde;
    }
    function visiteurHse() { try { return localStorage.getItem(CLE_VISITEUR) || ''; } catch (e) { return ''; } }
    async function pingServeur() {
      if (!estBranche()) return;
      try {
        const j = await appelServeur({ action: 'ping' });
        if (j && j.ok) {
          try {
            if (Array.isArray(j.conducteurs)) localStorage.setItem(CLE_CONDUCTEURS, JSON.stringify(j.conducteurs));
            if (typeof j.visiteur === 'string') localStorage.setItem(CLE_VISITEUR, j.visiteur);
          } catch (e) {}
          afficherConducteurs();
          const v = document.getElementById('visiteur'); if (v) v.value = visiteurHse();
        }
      } catch (e) { /* hors réseau : la dernière liste reçue sert */ }
    }
    appliquerLienBranchement();

    // ========================================================
    // NUMÉROTATION AUTOMATIQUE
    // ========================================================
    function genererNumeroCR() {
      const year = new Date().getFullYear();
      const key = 'cr_counter_' + year;
      let n = parseInt(localStorage.getItem(key) || '0') + 1;
      localStorage.setItem(key, n);
      return 'OBS-' + year + '-' + String(n).padStart(3, '0');
    }

    // ========================================================
    // TOAST
    // ========================================================
    function toast(msg, type = '') {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast show ' + type;
      setTimeout(() => { t.className = 'toast'; }, 3000);
    }

    // ========================================================
    // COMPTEURS
    // ========================================================
    function majCompteurs() {
      const rows = document.querySelectorAll('#obs-tbody tr');
      let c = { PP: 0, PA: 0, CD: 0, AD: 0 };
      rows.forEach(tr => {
        const v = tr.querySelector('.sel-type').value;
        if (c[v] !== undefined) c[v]++;
      });
      ['PP','PA','CD','AD'].forEach(t => {
        document.getElementById('count-' + t).textContent = c[t];
      });
    }

    // ========================================================
    // GESTION LIGNE PP (désactiver champs action)
    // ========================================================
    function majLigneType(tr) {
      const type = tr.querySelector('.sel-type').value;
      const toDisable = tr.querySelectorAll('.can-disable');
      if (type === 'PP') {
        toDisable.forEach(el => { el.disabled = true; el.value = ''; });
        tr.className = 'PP';
      } else {
        toDisable.forEach(el => { el.disabled = false; });
        tr.className = type;
      }
      majCompteurs();
    }

    // ========================================================
    // AJOUTER UNE OBSERVATION
    // ========================================================
    let obsCount = 0;

    // Échappement HTML : tout texte venant d'un brouillon ou de l'IA passe par là
    // avant d'être injecté dans le tableau (anti-XSS).
    function escHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

    /* ---------- Photos persistantes (IndexedDB) ----------
       Les photos ne tenaient pas dans le brouillon localStorage : elles sont
       désormais conservées dans IndexedDB (grande capacité), par CR, et
       restaurées au chargement. Compression préalable pour rester léger. */
    function idbOuvrir() {
      return new Promise((res, rej) => {
        const rq = indexedDB.open('crhse_photos', 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore('photos');
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
      });
    }
    async function idbEcrire(id, val) {
      try { const db = await idbOuvrir(); await new Promise((res, rej) => { const t = db.transaction('photos', 'readwrite'); t.objectStore('photos').put(val, id); t.oncomplete = res; t.onerror = () => rej(t.error); }); } catch (e) {}
    }
    async function idbLire(id) {
      try { const db = await idbOuvrir(); return await new Promise((res, rej) => { const t = db.transaction('photos', 'readonly'); const rq = t.objectStore('photos').get(id); rq.onsuccess = () => res(rq.result || null); rq.onerror = () => rej(rq.error); }); } catch (e) { return null; }
    }
    async function idbSupprimer(id) {
      try { const db = await idbOuvrir(); await new Promise((res, rej) => { const t = db.transaction('photos', 'readwrite'); t.objectStore('photos').delete(id); t.oncomplete = res; t.onerror = () => rej(t.error); }); } catch (e) {}
    }
    // Compresse une image (max 1400 px, JPEG qualité 0.82) avant stockage/affichage
    function compresserImage(dataUrl) {
      return new Promise(res => {
        const img = new Image();
        img.onload = () => {
          const max = 1400;
          let w = img.width, h = img.height;
          if (w > max || h > max) { const r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r); }
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          try { res(c.toDataURL('image/jpeg', 0.82)); } catch (e) { res(dataUrl); }
        };
        img.onerror = () => res(dataUrl);
        img.src = dataUrl;
      });
    }
    // Photographie l'état des photos affichées → IndexedDB (appelé par flushBrouillon)
    function photosDepuisDom() {
      const obs = {};
      document.querySelectorAll('#obs-tbody tr').forEach((tr, i) => {
        const img = tr.querySelector('.photo-preview-container img');
        if (img && /^data:image\//.test(img.src)) obs[i] = img.src;
      });
      const chantier = Array.from(document.querySelectorAll('#photos-chantier-preview .photo-thumb img'))
        .map(im => im.src).filter(s => /^data:image\//.test(s));
      return { obs: obs, chantier: chantier };
    }
    async function photosRestaurer(brId) {
      const p = await idbLire(brId);
      if (!p || brId !== brCourantId) return; // le CR affiché a changé entre-temps
      const lignes = document.querySelectorAll('#obs-tbody tr');
      Object.keys(p.obs || {}).forEach(i => {
        const tr = lignes[i];
        if (tr) attacherPhotoData(tr.querySelector('.obs-photo-cell'), p.obs[i]);
      });
      (p.chantier || []).forEach(d => afficherPhotoChantier(d));
    }

    function ajouterObs(data = {}, focus = true) {
      obsCount++;
      const tbody = document.getElementById('obs-tbody');
      const tr = document.createElement('tr');
      tr.className = data.type || 'PP';
      if (data.envoyee) { tr.dataset.envoyee = '1'; tr.classList.add('obs-envoyee'); }

      tr.innerHTML = `
        <td class="col-move no-print">
          <span class="obs-poignee" title="Glisser pour déplacer la ligne">⠿</span><span class="obs-badge-pa" title="Déjà sauvegardée au PA — ne sera pas renvoyée">✓</span>
        </td>
        <td class="col-type">
          <select class="sel-type" onchange="majLigneType(this.closest('tr'))">
            <option value="PP" ${(data.type||'PP')==='PP'?'selected':''}>PP 👍</option>
            <option value="PA" ${data.type==='PA'?'selected':''}>PA 📋</option>
            <option value="CD" ${data.type==='CD'?'selected':''}>CD ⚠️</option>
            <option value="AD" ${data.type==='AD'?'selected':''}>AD 🚫</option>
          </select>
        </td>
        <td class="col-desc">
          <textarea class="inp-desc" placeholder="Description de l'observation..." oninput="autoH(this)">${escHtml(data.desc)}</textarea>
        </td>
        <td class="col-action">
          <textarea class="can-disable inp-action" placeholder="Action à mener..." oninput="autoH(this)">${escHtml(data.action)}</textarea>
        </td>
        <td class="col-domaine">
          <select class="can-disable inp-domaine">
            <option value="">—</option>
            <option ${data.domaine==='Sécurité'?'selected':''}>Sécurité</option>
            <option ${data.domaine==='Santé'?'selected':''}>Santé</option>
            <option ${data.domaine==='Environnement'?'selected':''}>Environnement</option>
            <option ${data.domaine==='Réglementaire'?'selected':''}>Réglementaire</option>
          </select>
        </td>
        <td class="col-impact">
          <select class="can-disable inp-impact">
            <option value="">—</option>
            <option ${data.impact==='Critique'?'selected':''}>Critique</option>
            <option ${data.impact==='Fort'?'selected':''}>Fort</option>
            <option ${data.impact==='Moyen'?'selected':''}>Moyen</option>
            <option ${data.impact==='Faible'?'selected':''}>Faible</option>
          </select>
        </td>
        <td class="col-transv">
          <select class="can-disable inp-transv">
            <option value="">—</option>
            <option ${data.transv==='Oui'?'selected':''}>Oui</option>
            <option ${data.transv==='Non'?'selected':''}>Non</option>
          </select>
        </td>
        <td class="col-echeance">
          <input type="date" class="can-disable inp-echeance" value="${escHtml(data.echeance)}">
        </td>
        <td class="col-statut">
          <select class="can-disable inp-statut">
            <option value="">—</option>
            <option ${data.statut==='A planifier'?'selected':''}>A planifier</option>
            <option ${data.statut==='En cours'?'selected':''}>En cours</option>
            <option ${data.statut==='Clôturée'?'selected':''}>Clôturée</option>
          </select>
        </td>
        <td class="col-photo">
          <div class="obs-photo-cell">
            <input type="file" accept="image/*" capture="environment" class="inp-photo" style="display:none" onchange="ajouterPhotoObs(this)">
            <button class="obs-photo-btn no-print" onclick="this.previousElementSibling.click()">📷 Photo</button>
            <div class="photo-preview-container"></div>
          </div>
        </td>
        <td class="col-del no-print">
          <button class="btn-del-obs" onclick="supprimerObs(this)" title="Supprimer">✕</button>
        </td>
      `;

      tbody.appendChild(tr);
      majLigneType(tr);

      // Focus sur la description (pas en mode vocal : éviter le clavier)
      if (focus) tr.querySelector('.inp-desc').focus();
      sauverBrouillon();
    }

    function supprimerObs(btn) {
      btn.closest('tr').remove();
      majCompteurs();
      sauverBrouillon();
    }

    // Affiche une photo (déjà en dataURL) dans la cellule d'une observation
    function attacherPhotoData(cell, dataUrl) {
      const container = cell.querySelector('.photo-preview-container');
      const btn = cell.querySelector('.obs-photo-btn');
      const input = cell.querySelector('.inp-photo');

      container.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'obs-photo-preview';

      const img = document.createElement('img');
      img.src = dataUrl;
      img.title = 'Cliquer pour voir';
      img.onclick = () => voirPhoto(dataUrl);

      const del = document.createElement('button');
      del.className = 'photo-del-btn no-print';
      del.textContent = '✕';
      del.onclick = (ev) => {
        ev.stopPropagation();
        container.innerHTML = '';
        btn.style.display = 'inline-block';
        if (input) input.value = '';
        sauverBrouillon(); // la suppression est retenue dans le brouillon photos
      };

      wrap.appendChild(img);
      wrap.appendChild(del);
      container.appendChild(wrap);

      btn.style.display = 'none';
    }

    // Attacher une photo à une observation (clic OU glisser-déposer)
    function attacherPhotoObs(cell, file) {
      if (!file) return;
      if (file.type && file.type.indexOf('image/') !== 0) return; // on ignore les non-images

      const reader = new FileReader();
      reader.onload = function(e) {
        compresserImage(e.target.result).then(d => { attacherPhotoData(cell, d); sauverBrouillon(); });
      };
      reader.readAsDataURL(file);
    }

    function ajouterPhotoObs(input) {
      attacherPhotoObs(input.closest('.obs-photo-cell'), input.files[0]);
    }

    function autoH(el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }

    // ========================================================
    // COLLECTER LES DONNÉES DU FORMULAIRE
    // ========================================================
    function collecterDonnees() {
      const crNum = document.getElementById('cr-numero').textContent;
      const date = document.getElementById('date-visite').value;
      const chantier = document.getElementById('chantier').value;
      const activite = document.getElementById('activite').value;
      const conducteur = document.getElementById('conducteur').value;
      const agence = document.getElementById('agence').value;
      const visiteur = document.getElementById('visiteur').value;

      const observations = [];
      document.querySelectorAll('#obs-tbody tr').forEach((tr, i) => {
        observations.push({
          nCR: crNum,
          dateVisite: date,
          chantier: chantier,
          activite: activite,
          conducteur: conducteur,
          agence: agence,
          visiteur: visiteur,
          nObs: i + 1,
          type: tr.querySelector('.sel-type').value,
          description: tr.querySelector('.inp-desc').value,
          action: tr.querySelector('.inp-action').value,
          domaine: tr.querySelector('.inp-domaine').value,
          impact: tr.querySelector('.inp-impact').value,
          transversal: tr.querySelector('.inp-transv').value,
          echeance: tr.querySelector('.inp-echeance').value,
          statut: tr.querySelector('.inp-statut').value,
        });
      });

      return { crNum, date, chantier, activite, conducteur, agence, visiteur, observations };
    }

    // ========================================================
    // ENVOI VERS SHAREPOINT
    // ========================================================
    async function envoyerSharePoint() {
      const data = collecterDonnees();

      if (!data.chantier.trim()) {
        toast('Veuillez renseigner le nom du chantier', 'error');
        return;
      }

      if (!data.agence) {
        toast("Veuillez sélectionner l'agence (IDF, NA ou BPL)", 'error');
        document.getElementById('agence').focus();
        return;
      }

      if (data.observations.length === 0) {
        toast('Ajoutez au moins une observation', 'error');
        return;
      }

      const btn = document.querySelector('.btn-success');
      btn.innerHTML = '⏳ Envoi en cours...';
      btn.disabled = true;

      // Chaque LIGNE se souvient d'avoir été envoyée (badge ✓) : un nouvel appui
      // n'envoie QUE les lignes manquantes → plus jamais de doublons dans le PA.
      const lignesDom = Array.from(document.querySelectorAll('#obs-tbody tr'));
      let errors = 0, success = 0, deja = 0;

      for (let i = 0; i < data.observations.length; i++) {
        const obs = data.observations[i];
        const tr = lignesDom[i];
        if (tr && tr.dataset.envoyee === '1') { deja++; continue; }
        btn.innerHTML = '⏳ Envoi ' + (success + errors + deja + 1) + ' / ' + data.observations.length + '…';
        try {
          const payload = {
            nCR: data.crNum,
            dateVisite: data.date,
            chantier: data.chantier,
            activite: data.activite,
            conducteur: data.conducteur,
            agence: data.agence,
            visiteur: data.visiteur,
            type: obs.type,
            description: obs.description,
            action: obs.action,
            domaine: obs.domaine,
            impact: obs.impact,
            transversal: obs.transversal,
            echeance: obs.echeance,
            statut: obs.statut,
            ref: brCourantId + '-' + i // référence unique : permettra une déduplication côté Sheet
          };

          // V2 : mot de passe joint ; la réponse JSON est lue (refus ou erreur = échec)
          const rep = await appelServeur(payload);
          if (rep && rep.success === true) {
            success++;
            if (tr) { tr.dataset.envoyee = '1'; tr.classList.add('obs-envoyee'); }
          } else {
            errors++;
            console.error('Erreur obs', obs.nObs, rep && rep.error);
          }

        } catch (e) {
          errors++;
          console.error('Erreur réseau', e);
          if (e.refus) break;   // appareil non branché / refusé : inutile d'insister
        }
      }

      flushBrouillon(); // les marques ✓ par ligne sont retenues dans le brouillon

      if (errors === 0) {
        toast('✅ ' + success + ' observation(s) sauvegardée(s) au PA ✓' + (deja ? ' (' + deja + ' déjà au PA, non renvoyée' + (deja > 1 ? 's' : '') + ')' : ''), 'success');
        // marquer ce CR comme envoyé (✓ dans le sélecteur) — il reste consultable/imprimable
        const l = brListe();
        const b = l.find(x => x.id === brCourantId);
        if (b) { b.envoye = true; b.majLe = new Date().toISOString(); brEcrireListe(l); majCrSelect(); }
      } else if (success > 0 || deja > 0) {
        toast('⚠️ ' + success + ' envoyée(s), ' + errors + ' en échec — re-clique : SEULES les manquantes partiront (pas de doublon)', 'error');
      } else {
        toast('❌ Erreur d\'envoi. Vérifiez votre connexion puis re-cliquez : rien ne partira en double.', 'error');
      }

      btn.innerHTML = '☁️ Sauvegarder les données (PA)';
      btn.disabled = false;
    }

    // ========================================================
    // EXPORT EXCEL
    // ========================================================
    function exportExcel() {
      const data = collecterDonnees();
      const rows = [['N° CR', 'Date', 'Chantier', 'Agence', 'Activité', 'Conducteur', 'N° Obs', 'Type', 'Description', 'Action corrective', 'Domaine', 'Impact HSE', 'Transversal', 'Échéance', 'Statut']];
      data.observations.forEach(o => {
        rows.push([o.nCR, o.dateVisite, o.chantier, o.agence, o.activite, o.conducteur, o.nObs, o.type, o.description, o.action, o.domaine, o.impact, o.transversal, o.echeance, o.statut]);
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [14,12,22,8,18,20,6,6,45,45,14,12,10,12,12].map(w => ({wch:w}));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Observations');
      XLSX.writeFile(wb, titreDocument() + '.xlsx');
    }

    // ========================================================
    // NOUVEAU CR
    // ========================================================
    function nouveauCR() {
      if (!confirm('Ouvrir un nouveau CR ?\n\nLe CR affiché reste sauvegardé en brouillon — tu pourras y revenir à tout moment via le sélecteur « 📂 CR en cours ».')) return;
      const b = nouveauBrouillon();
      toast('📝 Nouveau CR ouvert : ' + b.crNum, 'success');
    }

    // ========================================================
    // PHOTOS CHANTIER
    // ========================================================
    function voirPhoto(src) {
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:pointer';
      const bigImg = document.createElement('img');
      bigImg.src = src;
      bigImg.style.cssText = 'max-width:95%;max-height:95%;border-radius:8px';
      modal.appendChild(bigImg);
      modal.onclick = () => modal.remove();
      document.body.appendChild(modal);
    }

    // Affiche une photo de chantier (déjà en dataURL) dans la galerie
    function afficherPhotoChantier(dataUrl) {
      const preview = document.getElementById('photos-chantier-preview');
      const wrap = document.createElement('div');
      wrap.className = 'photo-thumb';
      const img = document.createElement('img');
      img.src = dataUrl;
      img.title = 'Cliquer pour agrandir';
      img.onclick = ev => { ev.preventDefault(); voirPhoto(dataUrl); };
      const btn = document.createElement('button');
      btn.className = 'del-photo no-print';
      btn.textContent = '✕';
      btn.onclick = ev => { ev.preventDefault(); wrap.remove(); sauverBrouillon(); };
      wrap.appendChild(img);
      wrap.appendChild(btn);
      preview.appendChild(wrap);
    }

    function ajouterPhotosChantier(files) {
      Array.from(files).forEach(file => {
        if (file.type && file.type.indexOf('image/') !== 0) return; // on ignore les non-images déposées
        const reader = new FileReader();
        reader.onload = e => {
          compresserImage(e.target.result).then(d => { afficherPhotoChantier(d); sauverBrouillon(); });
        };
        reader.readAsDataURL(file);
      });
    }

    document.getElementById('photos-chantier-input').addEventListener('change', function() {
      ajouterPhotosChantier(this.files);
      this.value = '';
    });

    // Glisser-déposer sur la zone photos
    (function() {
      const zone = document.querySelector('.photo-zone');
      ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => {
        e.preventDefault(); e.stopPropagation();
        zone.classList.add('dragover');
      }));
      ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => {
        e.preventDefault(); e.stopPropagation();
        zone.classList.remove('dragover');
      }));
      zone.addEventListener('drop', e => {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
          ajouterPhotosChantier(e.dataTransfer.files);
        }
      });
    })();

    // Filet global : un fichier lâché à côté d'une zone ne doit pas ouvrir l'image dans l'onglet
    ['dragover', 'drop'].forEach(ev => window.addEventListener(ev, e => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') >= 0) e.preventDefault();
    }));

    // ========================================================
    // GLISSER-DÉPOSER SUR LE TABLEAU D'OBSERVATIONS
    //  - une image lâchée sur la cellule 📷 d'une ligne s'y attache
    //  - la poignée ⠿ permet de réordonner les lignes
    // ========================================================
    (function() {
      const tbody = document.getElementById('obs-tbody');
      let ligneDeplacee = null;

      const estFichier = e => e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') >= 0;
      const nettoyerReperes = () => tbody.querySelectorAll('tr').forEach(t => t.classList.remove('drag-dessus', 'drag-dessous'));

      // --- photos sur les lignes ---
      ['dragenter', 'dragover'].forEach(ev => tbody.addEventListener(ev, e => {
        if (!estFichier(e)) return;
        const td = e.target.closest('td.col-photo');
        tbody.querySelectorAll('.obs-photo-cell').forEach(c => c.classList.remove('photo-drop-hover'));
        if (!td) return;
        e.preventDefault(); e.stopPropagation();
        td.querySelector('.obs-photo-cell').classList.add('photo-drop-hover');
      }));
      tbody.addEventListener('drop', e => {
        if (!estFichier(e)) return;
        const td = e.target.closest('td.col-photo');
        tbody.querySelectorAll('.obs-photo-cell').forEach(c => c.classList.remove('photo-drop-hover'));
        if (!td) return;
        e.preventDefault(); e.stopPropagation();
        attacherPhotoObs(td.querySelector('.obs-photo-cell'), e.dataTransfer.files[0]);
      });
      tbody.addEventListener('dragleave', e => {
        if (!estFichier(e)) return;
        if (!e.target.closest('td.col-photo')) tbody.querySelectorAll('.obs-photo-cell').forEach(c => c.classList.remove('photo-drop-hover'));
      });

      // --- réordonner les lignes via la poignée ⠿ ---
      tbody.addEventListener('mousedown', e => {
        const p = e.target.closest('.obs-poignee');
        if (p) p.closest('tr').draggable = true;
      });
      tbody.addEventListener('dragstart', e => {
        const tr = e.target.closest('tr');
        if (!tr || !tr.draggable) return;
        ligneDeplacee = tr;
        tr.classList.add('en-deplacement');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'obs');
      });
      tbody.addEventListener('dragover', e => {
        if (!ligneDeplacee || estFichier(e)) return;
        e.preventDefault();
        const tr = e.target.closest('tr');
        nettoyerReperes();
        if (!tr || tr === ligneDeplacee) return;
        const r = tr.getBoundingClientRect();
        tr.classList.add(e.clientY < r.top + r.height / 2 ? 'drag-dessus' : 'drag-dessous');
      });
      tbody.addEventListener('drop', e => {
        if (!ligneDeplacee || estFichier(e)) return;
        e.preventDefault();
        const tr = e.target.closest('tr');
        if (tr && tr !== ligneDeplacee) {
          const r = tr.getBoundingClientRect();
          if (e.clientY < r.top + r.height / 2) tbody.insertBefore(ligneDeplacee, tr);
          else tbody.insertBefore(ligneDeplacee, tr.nextSibling);
        }
      });
      tbody.addEventListener('dragend', () => {
        nettoyerReperes();
        if (ligneDeplacee) { ligneDeplacee.classList.remove('en-deplacement'); ligneDeplacee.draggable = false; }
        ligneDeplacee = null;
        sauverBrouillon();
      });
    })();

    // ========================================================
    // FERMER MODAL EN CLIQUANT DEHORS
    // ========================================================
    document.getElementById('modal-aide').addEventListener('click', function(e) {
      if (e.target === this) this.classList.remove('open');
    });

    // ========================================================
    // BROUILLONS MULTI-CR — plusieurs CR en parallèle (voiture → bureau),
    // rien ne part au PA sans le bouton Sauvegarder
    // ========================================================
    const BR_LISTE_KEY = 'crhse_brouillons_v2';
    const BR_COURANT_KEY = 'crhse_brouillon_courant';
    let brTimer = null, brPret = false, brCourantId = null;

    function brListe() { try { return JSON.parse(localStorage.getItem(BR_LISTE_KEY)) || []; } catch (e) { return []; } }
    function brEcrireListe(l) {
      try { localStorage.setItem(BR_LISTE_KEY, JSON.stringify(l)); return true; }
      catch (e) {
        // mémoire du navigateur pleine : on le DIT au lieu d'afficher « enregistré »
        const info = document.getElementById('brouillon-info');
        if (info) info.textContent = '⚠ Mémoire du navigateur pleine — les dernières modifications ne sont PAS enregistrées en brouillon';
        toast('⚠ Brouillon non enregistré : mémoire pleine. Envoie ou supprime un ancien CR.', 'error');
        return false;
      }
    }
    function brUid() { return 'cr' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
    function dateISO() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

    function lireLignes() {
      return Array.from(document.querySelectorAll('#obs-tbody tr')).map(tr => ({
        type: tr.querySelector('.sel-type').value,
        desc: tr.querySelector('.inp-desc').value,
        action: tr.querySelector('.inp-action').value,
        domaine: tr.querySelector('.inp-domaine').value,
        impact: tr.querySelector('.inp-impact').value,
        transv: tr.querySelector('.inp-transv').value,
        echeance: tr.querySelector('.inp-echeance').value,
        statut: tr.querySelector('.inp-statut').value,
        envoyee: tr.dataset.envoyee === '1'
      }));
    }

    function formVersBrouillon(existant) {
      return {
        id: brCourantId,
        crNum: document.getElementById('cr-numero').textContent,
        date: document.getElementById('date-visite').value,
        chantier: document.getElementById('chantier').value,
        activite: document.getElementById('activite').value,
        conducteur: document.getElementById('conducteur').value,
        agence: document.getElementById('agence').value,
        observations: lireLignes(),
        envoye: existant ? !!existant.envoye : false,
        majLe: new Date().toISOString()
      };
    }

    function flushBrouillon() {
      if (!brPret || !brCourantId) return;
      clearTimeout(brTimer); brTimer = null;
      const l = brListe();
      const i = l.findIndex(x => x.id === brCourantId);
      const b = formVersBrouillon(i >= 0 ? l[i] : null);
      if (i >= 0) l[i] = b; else l.push(b);
      const okEcrit = brEcrireListe(l);
      try { localStorage.setItem(BR_COURANT_KEY, brCourantId); } catch (e) {}
      idbEcrire(brCourantId, photosDepuisDom()); // photos → IndexedDB (grande capacité)
      majCrSelect();
      if (okEcrit) {
        const h = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('brouillon-info').textContent =
          '💾 ' + l.length + ' CR en brouillon (photos comprises) · enregistré à ' + h + ' — rien ne part au PA sans « Sauvegarder les données »';
      }
    }

    function sauverBrouillon() {
      if (!brPret || !brCourantId) return;
      clearTimeout(brTimer);
      brTimer = setTimeout(flushBrouillon, 600);
    }

    function remplirFormulaire(b) {
      brPret = false;
      brCourantId = b.id;
      document.getElementById('cr-numero').textContent = b.crNum || genererNumeroCR();
      document.getElementById('date-visite').value = b.date || dateISO();
      document.getElementById('chantier').value = b.chantier || '';
      document.getElementById('activite').value = b.activite || '';
      optionConducteur(document.getElementById('conducteur'), b.conducteur || '');
      document.getElementById('conducteur').value = b.conducteur || '';
      document.getElementById('agence').value = b.agence || '';
      document.getElementById('visiteur').value = visiteurHse();
      document.getElementById('obs-tbody').innerHTML = '';
      document.getElementById('photos-chantier-preview').innerHTML = '';
      (b.observations || []).forEach(o => ajouterObs(o, false));
      if (!(b.observations || []).length) ajouterObs({}, false);
      majCompteurs();
      try { localStorage.setItem(BR_COURANT_KEY, brCourantId); } catch (e) {}
      photosRestaurer(b.id); // les photos du CR reviennent depuis IndexedDB
      brPret = true;
      majCrSelect();
    }

    function majCrSelect() {
      const sel = document.getElementById('cr-select');
      const l = brListe().slice().sort((a, b) => (b.majLe || '').localeCompare(a.majLe || ''));
      sel.innerHTML = l.map(b => {
        const nb = (b.observations || []).filter(o => (o.desc || '').trim()).length;
        return '<option value="' + escHtml(b.id) + '"' + (b.id === brCourantId ? ' selected' : '') + '>' +
          (b.envoye ? '✓ ' : '') + escHtml(b.crNum || '?') + ' · ' + escHtml(b.chantier || 'sans chantier') + ' (' + nb + ' obs)</option>';
      }).join('');
    }

    function chargerBrouillonId(id) {
      if (id === brCourantId) return;
      flushBrouillon(); // le CR affiché est mis de côté proprement
      const b = brListe().find(x => x.id === id);
      if (b) {
        remplirFormulaire(b);
        toast('📂 ' + (b.crNum || 'CR') + (b.chantier ? ' — ' + b.chantier : '') + ' chargé, photos comprises', 'success');
      }
    }

    function nouveauBrouillon(chantier) {
      flushBrouillon();
      const b = {
        id: brUid(), crNum: genererNumeroCR(), date: dateISO(),
        chantier: chantier || '', activite: '', conducteur: '', agence: '',
        observations: [], envoye: false, majLe: new Date().toISOString()
      };
      const l = brListe();
      l.push(b);
      brEcrireListe(l);
      remplirFormulaire(b);
      return b;
    }

    function supprimerCRCourant() {
      const l = brListe();
      const b = l.find(x => x.id === brCourantId);
      if (!confirm('Supprimer ce CR du brouillon ?\n\n' + (b ? (b.crNum + (b.chantier ? ' — ' + b.chantier : '')) : '') +
        (b && b.envoye ? '\n(déjà sauvegardé au PA ✓)' : '\n⚠ Il n\'a PAS été sauvegardé au PA.'))) return;
      const reste = l.filter(x => x.id !== brCourantId);
      brEcrireListe(reste);
      idbSupprimer(brCourantId); // ses photos partent avec lui
      brCourantId = null;
      if (reste.length) remplirFormulaire(reste.sort((a, c) => (c.majLe || '').localeCompare(a.majLe || ''))[0]);
      else nouveauBrouillon();
      toast('🗑 CR retiré du brouillon');
    }

    // toute frappe ou changement dans la page alimente le brouillon
    document.querySelector('main').addEventListener('input', sauverBrouillon);
    document.querySelector('main').addEventListener('change', sauverBrouillon);
    // filet : si on quitte l'appli pendant les 600 ms d'attente, le brouillon part quand même
    window.addEventListener('pagehide', () => { if (brTimer) flushBrouillon(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && brTimer) flushBrouillon(); });

    // ========================================================
    // MODE VOITURE — dictée mains libres (même moteur que le Planning HSE)
    // IA : serveur du CR (même serveur que l'envoi au PA) — reformulation + rangement
    // ========================================================
    // V2 : l'IA vocale passe par le même serveur que l'envoi au PA (appelServeur, mot de passe joint)
    const CRO_NEW = /\bnouveau\s+(cr|c\.r\.|compte[- ]?rendu)\b/i;
    // Fin de dictée : un segment court prononcé SEUL (« Terminé », « C'est tout », « Trie »…)
    const CRO_FIN = /^\s*(c'?est\s+(terminé|fini|tout|bon)|terminé|termine|fini|j'?ai\s+(fini|terminé)|trie(\s+(les|ça|tout))?|analyse|envoie)\s*[.!?]*\s*$/i;
    const TYPE_LIBELLE = { PP: 'point positif', PA: 'point d\'amélioration', CD: 'condition dangereuse', AD: 'acte dangereux' };

    let voRec = null, voBusy = false, voContinu = false, voPause = false, voWakeLock = null;
    /* Anti-bip : Chrome joue un son à chaque démarrage du micro. Sans parole, la
       reconnaissance s'arrête d'elle-même (« no-speech ») ; on espace donc les
       redémarrages, et après VO_SILENCES_MAX tours muets on passe en veille
       (le micro se rouvre d'un appui) au lieu de biper sans fin. */
    let voSilences = 0;
    const VO_SILENCES_MAX = 6;
    function voDelaiReprise() { return Math.min(400 * Math.pow(2, voSilences), 5000); }
    let voNotes = ''; // carnet : tout ce qui a été dicté et pas encore trié

    function speechDispo() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
    // Voix de Jarvis : française MASCULINE (les voix se chargent en asynchrone)
    let voixJarvis = null;
    const VOIX_MASC_FR = ['thomas', 'paul', 'nicolas', 'henri', 'guillaume', 'daniel', 'yannick', 'mathieu', 'google français'];
    function choisirVoixJarvis() {
      try {
        const voix = speechSynthesis.getVoices();
        if (!voix || !voix.length) return;
        const fr = voix.filter(v => /fr(-|_)?/i.test(v.lang));
        voixJarvis =
          fr.find(v => VOIX_MASC_FR.some(n => v.name.toLowerCase().includes(n))) ||
          fr.find(v => /(^|[^e])homme|male|masculin/i.test(v.name)) ||
          fr.find(v => !/(f[ée]minin|female|amelie|amélie|audrey|marie|virginie|julie|chantal)/i.test(v.name)) ||
          fr[0] || null;
      } catch (e) {}
    }
    try { choisirVoixJarvis(); speechSynthesis.onvoiceschanged = choisirVoixJarvis; } catch (e) {}

    function parler(txt, onDone) {
      try {
        speechSynthesis.cancel();
        if (!voixJarvis) choisirVoixJarvis();
        const u = new SpeechSynthesisUtterance(txt);
        u.lang = 'fr-FR';
        if (voixJarvis) u.voice = voixJarvis;
        u.pitch = 0.9;  // timbre légèrement grave = humanoïde masculin sympa
        u.rate = 1.02;
        if (onDone) { u.onend = onDone; u.onerror = onDone; }
        speechSynthesis.speak(u);
      } catch (e) { if (onDone) onDone(); }
    }
    async function voWakeLockOn() { try { if ('wakeLock' in navigator) voWakeLock = await navigator.wakeLock.request('screen'); } catch (e) {} }
    function voWakeLockOff() { try { if (voWakeLock) { voWakeLock.release(); voWakeLock = null; } } catch (e) {} }
    function voSet(s, t) {
      if (s !== null) document.getElementById('vo-status').textContent = s;
      if (t !== null) document.getElementById('vo-transcript').textContent = t;
    }

    function voOpen() {
      document.getElementById('vo-overlay').classList.add('open');
      document.getElementById('vo-result').classList.add('hidden');
      if (!speechDispo()) { voSet('⚠ Dictée non disponible dans ce navigateur (essaie Chrome ou Safari)', ''); return; }
      voContinu = true; voPause = false; voSilences = 0;
      voWakeLockOn();
      voSet('👋 Je suis Jarvis, votre chatbot', voNotes.trim());
      parler('Je suis Jarvisse, votre chatbot.', () => setTimeout(voEcouter, 200));
      // filet : si la synthèse vocale est bloquée par le navigateur, on écoute quand même
      setTimeout(() => { if (voContinu && !voRec && !voBusy) voEcouter(); }, 2500);
    }
    function voClose() {
      if (voNotes.trim() && !voBusy) {
        if (confirm('Des observations dictées ne sont pas encore triées.\n\nOK : je les trie et je les ajoute avant de fermer.\nAnnuler : je les abandonne.')) {
          voTrierMaintenant(true);
          return;
        }
        voNotes = '';
        voMajTrierBtn();
      }
      voContinu = false; voPause = false;
      if (voRec) { try { voRec.stop(); } catch (e) {} voRec = null; }
      try { speechSynthesis.cancel(); } catch (e) {}
      voWakeLockOff();
      document.getElementById('vo-mic').classList.remove('ecoute');
      document.getElementById('vo-overlay').classList.remove('open');
    }

    /* ---- Mot d'appel « Jarvis » : RETIRÉ (2026-07-30) ----------------------
       L'écoute de fond permanente obligeait à redémarrer le micro en boucle, et
       Chrome joue un bip à CHAQUE démarrage → bip toutes les secondes. Aucune API
       ne permet de couper ce bip. Le micro ne s'ouvre donc plus que sur action :
       bouton 🚗 Mode voiture.
       On purge l'ancien réglage pour stopper l'écoute chez ceux qui l'avaient activée. */
    try { localStorage.removeItem('crhse_jarvis'); } catch (e) {}

    function voMajTrierBtn(pendantSession) {
      const plein = !!((voNotes + ' ' + (pendantSession || '')).trim());
      document.getElementById('vo-trier').classList.toggle('hidden', !plein);
    }
    function voMicTap() {
      if (voBusy) return;
      if (!speechDispo()) { voSet('⚠ Dictée non disponible dans ce navigateur', ''); return; }
      voSilences = 0; // toute action de l'utilisateur relance la cadence normale
      if (!voContinu) { voContinu = true; voPause = false; voEcouter(); return; }
      voPause = !voPause;
      if (voPause) {
        if (voRec) { try { voRec.stop(); } catch (e) {} }
        voSet('⏸ En pause — appuie sur le micro pour reprendre', '');
      } else {
        document.getElementById('vo-result').classList.add('hidden');
        voEcouter();
      }
    }

    function voEcouter() {
      if (!voContinu || voPause || voBusy || voRec) return;
      if (!document.getElementById('vo-overlay').classList.contains('open')) return;
      try { if (speechSynthesis.speaking) { setTimeout(voEcouter, 800); return; } } catch (e) {}
      const mic = document.getElementById('vo-mic');
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      let rec;
      try { rec = new SR(); } catch (e) { return; }
      rec.lang = 'fr-FR'; rec.interimResults = true; rec.continuous = true; rec.maxAlternatives = 1;
      voRec = rec;
      voSet(voNotes.trim() ? '🎙 Je continue de noter — dis « Terminé » pour trier' : '🎙 Je t\'écoute — dicte librement, dis « Terminé » à la fin', voNotes.trim());
      voMajTrierBtn();
      mic.classList.add('ecoute');
      let sessionFinals = '', done = false;

      // Les acquis de cette session d'écoute rejoignent le carnet
      const commettre = () => {
        if (sessionFinals.trim()) voNotes = (voNotes + ' ' + sessionFinals).replace(/\s+/g, ' ').trimStart();
        sessionFinals = '';
        voMajTrierBtn();
      };

      rec.onresult = e => {
        let finals = '', interim = '', dernierFinal = '';
        for (let i = 0; i < e.results.length; i++) {
          const seg = e.results[i][0].transcript;
          if (e.results[i].isFinal) { finals += seg + ' '; dernierFinal = seg; }
          else interim += seg;
        }
        sessionFinals = finals;
        const df = dernierFinal.trim();

        // « Terminé » prononcé seul → on trie tout le carnet
        if (df && CRO_FIN.test(df)) {
          done = true;
          sessionFinals = finals.slice(0, finals.length - (dernierFinal.length + 1)); // sans le mot de fin
          commettre();
          try { rec.stop(); } catch (err) {}
          if (voNotes.trim()) voTrierMaintenant();
          else { voSet('Rien à trier — je t\'écoute', ''); setTimeout(voEcouter, 400); }
          return;
        }

        // « Nouveau CR [chantier X] » → local ; le carnet en cours est trié d'abord
        const exN = df ? CRO_NEW.exec(df) : null;
        if (exN) {
          done = true;
          sessionFinals = finals.slice(0, finals.length - (dernierFinal.length + 1));
          commettre();
          try { rec.stop(); } catch (err) {}
          const reste = df.slice(exN.index + exN[0].length);
          if (voNotes.trim()) voTrierMaintenant(false, () => voNouveauCR(reste));
          else voNouveauCR(reste);
          return;
        }

        if (finals.trim() || interim.trim()) voSilences = 0; // on parle : cadence normale
        const affiche = (voNotes + ' ' + finals + interim).replace(/\s+/g, ' ').trim();
        if (affiche) voSet('📝 Je note… (dis « Terminé » quand tu as tout dicté)', affiche);
        voMajTrierBtn(finals);
      };
      rec.onerror = ev => {
        // erreurs définitives : on arrête la boucle plutôt que de biper en boucle
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed' || ev.error === 'audio-capture') {
          voContinu = false;
          mic.classList.remove('ecoute');
          voSet('⚠ Micro indisponible — autorise-le puis appuie sur le micro', '');
          return;
        }
        if (ev.error === 'no-speech' || ev.error === 'network') voSilences++;
      };
      rec.onend = () => {
        voRec = null;
        mic.classList.remove('ecoute');
        if (!done) {
          const eutParole = !!sessionFinals.trim();
          commettre(); // un blanc ne perd RIEN : le carnet est conservé
          if (eutParole) voSilences = 0; else voSilences++;
          if (!voContinu || voPause || voBusy) return;
          if (voSilences >= VO_SILENCES_MAX) { // silence prolongé : veille, plus aucun bip
            voPause = true;
            voSet('⏸ En veille (aucune parole détectée) — appuie sur le micro pour reprendre', voNotes.trim());
            return;
          }
          setTimeout(voEcouter, voDelaiReprise());
        }
      };
      try { rec.start(); } catch (e) { voRec = null; mic.classList.remove('ecoute'); }
    }

    /* Envoi du carnet au tri IA (bouton vert ou « Terminé ») */
    function voTrierMaintenant(fermerApres, ensuite) {
      if (voBusy) return;
      if (voRec) { try { voRec.stop(); } catch (e) {} voRec = null; }
      const texte = voNotes.trim();
      if (!texte) { if (ensuite) ensuite(); return; }
      voTraiterLot(texte, fermerApres, ensuite);
    }

    /* « Nouveau CR » dicté : bascule sur un CR vierge, l'actuel reste en brouillon.
       On peut préciser le chantier : « nouveau CR chantier Canal de la Sambre ». */
    function voNouveauCR(reste) {
      const mic = document.getElementById('vo-mic');
      mic.classList.remove('ecoute');
      voRec = null;
      let chantier = String(reste || '').replace(/^[\s:,.!?]+/, '').replace(/^(pour|sur|au|à|chantier)\s+/i, '').trim();
      const b = nouveauBrouillon(chantier);
      const resu = document.getElementById('vo-result');
      resu.innerHTML = '📝 <b>Nouveau CR ouvert</b> : ' + b.crNum + (chantier ? ' — ' + chantier : '') + '<br>Le précédent reste en brouillon.';
      resu.classList.remove('hidden');
      voSet('Nouveau CR prêt ! Je t\'écoute…', '');
      parler('Nouveau CR ouvert' + (chantier ? ' pour ' + chantier : '') + '. Je t\'écoute.', () => setTimeout(voEcouter, 250));
    }

    async function voTraiterLot(texte, fermerApres, ensuite) {
      const mic = document.getElementById('vo-mic');
      mic.classList.remove('ecoute');
      voBusy = true; mic.disabled = true;
      document.getElementById('vo-trier').classList.add('hidden');
      voSet('🤖 Je trie tes observations…', '« ' + texte + ' »');
      try {
        const j = await appelServeur({
          action: 'ia', mode: 'crobs_lot', texte: texte,
          observations: lireLignes().map((o, i) => ({ i: i, type: o.type, desc: o.desc }))
        });
        if (!j || !j.ok) throw new Error((j && j.error) || 'réponse invalide');
        const res = j.resultat || {};
        const liste = Array.isArray(res.observations) ? res.observations : [];

        // 1) Suppressions d'abord (les index se réfèrent au tableau AVANT ajouts), de bas en haut
        const rows = document.querySelectorAll('#obs-tbody tr');
        const supprimees = [];
        liste.filter(o => o.op === 'supprimer' && o.index != null)
          .sort((a, b) => b.index - a.index)
          .forEach(o => {
            const tr = rows[o.index];
            if (tr) {
              supprimees.push(tr.querySelector('.inp-desc').value || 'ligne ' + (o.index + 1));
              tr.remove();
            }
          });
        if (supprimees.length) { majCompteurs(); sauverBrouillon(); }

        // 2) Ajouts
        const nb = { PP: 0, PA: 0, CD: 0, AD: 0 };
        let aVerifier = 0;
        const details = [];
        liste.filter(o => (o.op || 'ajouter') === 'ajouter' && o.description).forEach(o => {
          const type = ['PP', 'PA', 'CD', 'AD'].indexOf(o.type) >= 0 ? o.type : 'PA';
          nb[type]++;
          const conf = Math.round(o.confiance || 0);
          if (conf && conf < 95) aVerifier++;
          ajouterObs({
            type: type,
            desc: o.description,
            action: type === 'PP' ? '' : (o.action || ''),
            domaine: o.domaine || '',
            impact: o.impact || '',
            statut: (type !== 'PP' && (o.action || '')) ? 'A planifier' : ''
          }, false);
          details.push('<b>' + type + '</b> — ' + echapper(o.description) + (conf && conf < 95 ? ' <i>(à vérifier)</i>' : ''));
        });

        const total = nb.PP + nb.PA + nb.CD + nb.AD;
        const resu = document.getElementById('vo-result');
        resu.innerHTML =
          (total ? '✅ <b>' + total + ' observation' + (total > 1 ? 's' : '') + ' ajoutée' + (total > 1 ? 's' : '') + '</b><br>' + details.join('<br>') : '') +
          (supprimees.length ? (total ? '<br>' : '') + '🗑 Supprimé : ' + supprimees.map(echapper).join(' · ') : '') +
          (!total && !supprimees.length ? '🤔 ' + echapper(res.reponse || 'Je n\'ai pas reconnu d\'observation — redis-les') : '');
        resu.classList.remove('hidden');

        voNotes = ''; // le carnet est traité
        voMajTrierBtn();

        const parts = [];
        if (nb.PP) parts.push(nb.PP + ' point' + (nb.PP > 1 ? 's' : '') + ' positif' + (nb.PP > 1 ? 's' : ''));
        if (nb.PA) parts.push(nb.PA + ' point' + (nb.PA > 1 ? 's' : '') + ' d\'amélioration');
        if (nb.CD) parts.push(nb.CD + ' condition' + (nb.CD > 1 ? 's' : '') + ' dangereuse' + (nb.CD > 1 ? 's' : ''));
        if (nb.AD) parts.push(nb.AD + ' acte' + (nb.AD > 1 ? 's' : '') + ' dangereux');
        let phrase = total ? total + ' observation' + (total > 1 ? 's' : '') + ' ajoutée' + (total > 1 ? 's' : '') + ' : ' + parts.join(', ') : '';
        if (supprimees.length) phrase += (phrase ? '. ' : '') + supprimees.length + ' ligne' + (supprimees.length > 1 ? 's' : '') + ' supprimée' + (supprimees.length > 1 ? 's' : '');
        if (aVerifier) phrase += '. ' + aVerifier + ' à vérifier au bureau';
        if (!phrase) phrase = res.reponse || 'Je n\'ai pas reconnu d\'observation, tu peux les redire ?';

        voSet(total || supprimees.length ? 'C\'est trié ! Je t\'écoute pour la suite…' : 'Je t\'écoute…', '');
        parler(phrase, () => {
          if (fermerApres) { voClose(); return; }
          if (ensuite) { ensuite(); return; }
          setTimeout(voEcouter, 250);
        });
      } catch (e) {
        // le carnet N'EST PAS perdu : voNotes est conservé tel quel
        voSet('⚠ IA injoignable — tes notes sont conservées, redis « Terminé » pour réessayer', voNotes);
        voMajTrierBtn();
        parler('Erreur, je n\'ai pas pu joindre l\'IA. Tes notes sont conservées.', () => setTimeout(voEcouter, 250));
      } finally {
        voBusy = false; mic.disabled = false;
        setTimeout(voEcouter, 8000); // filet de sécurité
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && document.getElementById('vo-overlay').classList.contains('open') && voContinu && !voPause) {
        voWakeLockOn();
        voEcouter();
      }
    });

    // ========================================================
    // INITIALISATION (multi-brouillons + migration de l'ancien brouillon)
    // ========================================================
    afficherConducteurs();
    majBandeau();
    (function initBrouillons() {
      try {
        const ancien = localStorage.getItem('crhse_brouillon_v1');
        if (ancien && !brListe().length) {
          const v1 = JSON.parse(ancien);
          v1.id = brUid(); v1.envoye = false; v1.majLe = new Date().toISOString();
          brEcrireListe([v1]);
          localStorage.removeItem('crhse_brouillon_v1');
        }
      } catch (e) {}
      const l = brListe();
      if (l.length) {
        const cid = localStorage.getItem(BR_COURANT_KEY);
        const b = l.find(x => x.id === cid) || l.slice().sort((a, c) => (c.majLe || '').localeCompare(a.majLe || ''))[0];
        remplirFormulaire(b);
        if (l.length > 1) toast('📂 ' + l.length + ' CR en brouillon — navigue avec le sélecteur en haut', 'success');
      } else {
        nouveauBrouillon();
      }
    })();
    pingServeur();
