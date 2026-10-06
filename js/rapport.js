    // ========================================================
    // EXPORT PDF — construit un vrai rapport (pas le formulaire)
    // ========================================================
    const PV_TYPES = { PP: 'Point Positif', PA: "Point d'Amélioration", CD: 'Condition Dangereuse', AD: 'Acte Dangereux' };
    const TITRE_ONGLET = document.title;

    // Nom d'enregistrement du document : 2026-07-23-CR HSE-Faucardage Saint Jean de Losne
    function titreDocument() {
      const date = document.getElementById('date-visite').value || new Date().toISOString().slice(0, 10);
      const activite = (document.getElementById('activite').value || '').trim();
      const chantier = (document.getElementById('chantier').value || '').trim();
      const fin = [activite, chantier].filter(Boolean).join(' ');
      return (date + '-CR HSE' + (fin ? '-' + fin : '')).replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function echapper(t) {
      const d = document.createElement('div');
      d.textContent = t == null ? '' : String(t);
      return d.innerHTML;
    }

    function construirePrintView() {
      const pv = document.getElementById('print-view');
      if (!pv) return;
      const d = collecterDonnees();
      const fmtDate = v => { if (!v) return '—'; const p = v.split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : v; };

      let h = '<div class="pv-entete"><div><h1>OBSERVATIONS HSE</h1><p>Compte Rendu de Visite Terrain — CDES</p></div>' +
        '<div class="pv-numcr"><div class="lib">N° CR</div><div class="val">' + echapper(d.crNum) + '</div></div></div>';

      h += '<table class="pv-infos"><tr>' +
        '<td><b>Date de visite</b>' + fmtDate(d.date) + '</td>' +
        '<td><b>Chantier</b>' + echapper(d.chantier || '—') + '</td>' +
        '<td><b>Agence</b>' + echapper(d.agence || '—') + '</td>' +
        '<td><b>Activité</b>' + echapper(d.activite || '—') + '</td>' +
        '<td><b>Conducteur de travaux</b>' + echapper(d.conducteur || '—') + '</td>' +
        '<td><b>Visiteur HSE</b>' + echapper(d.visiteur || '—') + '</td>' +
        '</tr></table>';

      // Photos du chantier : la 1re en pleine largeur (page de garde), les suivantes en grille
      const photosChantier = Array.from(document.querySelectorAll('#photos-chantier-preview .photo-thumb img')).map(i => i.src);
      if (photosChantier.length) {
        h += '<div class="pv-titre-section">Photos du chantier</div>';
        h += '<img class="pv-photo-garde" src="' + photosChantier[0] + '">';
        if (photosChantier.length > 1) {
          h += '<div class="pv-photos-grille">' + photosChantier.slice(1).map(s => '<img src="' + s + '">').join('') + '</div>';
        }
      }

      const lignes = Array.from(document.querySelectorAll('#obs-tbody tr'));
      const nb = { PP: 0, PA: 0, CD: 0, AD: 0 };
      d.observations.forEach(o => { if (nb[o.type] != null) nb[o.type]++; });

      h += '<div class="pv-titre-section">Observations HSE</div>';
      h += '<div class="pv-compteurs">' + ['PP', 'PA', 'CD', 'AD'].map(t => '<span class="' + t + '">' + t + ' : ' + nb[t] + '</span>').join('') + '</div>';

      d.observations.forEach((o, i) => {
        if (!String(o.description || '').trim() && !String(o.action || '').trim()) return; // ligne vide non imprimée
        const type = PV_TYPES[o.type] ? o.type : 'PA';
        const photo = lignes[i] ? lignes[i].querySelector('.photo-preview-container img') : null;
        const meta = [];
        if (o.domaine) meta.push('Domaine : ' + echapper(o.domaine));
        if (o.impact) meta.push('Impact HSE : ' + echapper(o.impact));
        if (o.transversal) meta.push('Transversal : ' + echapper(o.transversal));
        if (o.echeance) meta.push('Échéance : ' + fmtDate(o.echeance));
        if (o.statut) meta.push('Statut : ' + echapper(o.statut));
        h += '<div class="pv-obs ' + type + '">' +
          '<div class="pv-obs-tete"><span class="pv-badge ' + type + '">' + type + ' — ' + PV_TYPES[type] + '</span>' +
          '<span class="pv-obs-num">Obs. ' + o.nObs + '</span></div>' +
          '<div class="pv-obs-corps"><div class="pv-obs-texte">' +
          '<div class="desc">' + echapper(o.description) + '</div>' +
          (String(o.action || '').trim() ? '<div class="act"><b>Action corrective :</b> ' + echapper(o.action) + '</div>' : '') +
          (meta.length ? '<div class="pv-obs-meta">' + meta.join(' · ') + '</div>' : '') +
          '</div>' + (photo ? '<img src="' + photo.src + '">' : '') + '</div></div>';
      });

      const mnt = new Date();
      h += '<div class="pv-pied">Édité le ' + mnt.toLocaleDateString('fr-FR') + ' à ' + mnt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ' — CDES · Observations HSE</div>';

      pv.innerHTML = h;
      document.body.classList.add('mode-rapport');
      document.title = titreDocument(); // = nom de fichier proposé à l'enregistrement du PDF
    }

    // Ctrl+P / menu Imprimer du navigateur : le rapport se construit tout seul
    window.addEventListener('beforeprint', construirePrintView);
    window.addEventListener('afterprint', () => { document.title = TITRE_ONGLET; });
