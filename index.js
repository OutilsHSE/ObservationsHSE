
    function updateCounters() {
      const rows = document.querySelectorAll('#obs-table tbody tr');
      let cPP = 0, cPA = 0, cCD = 0, cAD = 0;
      rows.forEach(r => {
        const type = r.querySelector('.type-select').value;
        if (type === 'PP') cPP++;
        if (type === 'PA') cPP++;
        if (type === 'CD') cCD++;
        if (type === 'AD') cAD++;
      });
      document.getElementById('count-PP').textContent = cPP;
      document.getElementById('count-PA').textContent = cPA;
      document.getElementById('count-CD').textContent = cCD;
      document.getElementById('count-AD').textContent = cAD;
    }
    function addRow() {
      const tbody = document.querySelector('#obs-table tbody');
      const tr = document.createElement('tr');
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
          <textarea class="description"></textarea>
        </td>
        <td class="large-row">
          <textarea class="can-disable"></textarea>
        </td>
        <td class="medium-row">
          <input type="text" class="can-disable">
        </td>
        <td class="medium-row">
          <select class="can-disable">
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
      function autoResizeAndSync() {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        printDiv.textContent = textarea.value;
      }

      textarea.addEventListener('input', autoResizeAndSync);
      autoResizeAndSync(); // appel initial si valeur présente
      sortTableByType();
    }
    function removeRow(btn) {
      btn.closest('tr').remove();
      updateCounters();
    }
    function toggleInputs(selectElement) {
      const tr = selectElement.closest('tr');
      const inputs = tr.querySelectorAll('.can-disable');
      if (selectElement.value === 'PP') {
        inputs.forEach(input => input.setAttribute('disabled', 'disabled'));
      } else {
        inputs.forEach(input => input.removeAttribute('disabled'));
      }
    }
    document.addEventListener('DOMContentLoaded', function () {
      const selectElement = document.getElementById('mySelect');
      if (selectElement) {
        selectElement.addEventListener('change', function () {
          toggleInputs(this);
        });

        // Appel initial pour définir l'état des inputs en fonction de la valeur par défaut
        toggleInputs(selectElement);
      }
    });

    function sortTableByType() {
      const tbody = document.querySelector('#obs-table tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));

      rows.sort((a, b) => {
        const typeA = a.querySelector('.type-select').value;
        const typeB = b.querySelector('.type-select').value;
        return typeA.localeCompare(typeB);
      });

      // Réinsérer les lignes triées dans le tbody
      rows.forEach(row => tbody.appendChild(row));
    }

    function applyColor(selectElement) {
      const tr = selectElement.closest('tr');
      if (selectElement.value === 'PP') {
        tr.style.backgroundColor = '#d4edda'; // Couleur pour PP
      } else if (selectElement.value === 'CD') {
        tr.style.backgroundColor = '#fff3cd'; // Couleur pour CD
      } else if (selectElement.value === 'AD') {
        tr.style.backgroundColor = '#f8d7da'; // Couleur pour AD
      } else if (selectElement.value === 'PA') {
        tr.style.backgroundColor = '#81bcec'; // Couleur pour AD  
      } else {
        tr.style.backgroundColor = ''; // Réinitialiser la couleur
      }
      toggleInputs(tr.querySelector('.type-select'));
    }


    // Fonction pour ouvrir la modale
    function openModal(imageUrl) {
      const modal = document.getElementById('imageModal');
      const modalImg = document.getElementById('modalImage');
      modal.style.display = 'block';
    }

    // Fonction pour fermer la modale
    function closeModal() {
      const modal = document.getElementById('imageModal');
      modal.style.display = 'none';
    }

    // Écouteur d'événement pour le bouton d'ouverture
    document.getElementById('openModalBtn').onclick = function () {
      openModal('regles.png');
    };

    // Écouteur d'événement pour le bouton de fermeture
    document.getElementsByClassName('close')[0].onclick = function () {
      closeModal();
    };

    // Fermer la modale si l'utilisateur clique en dehors de l'image
    window.onclick = function (event) {
      const modal = document.getElementById('imageModal');
      if (event.target == modal) {
        closeModal();
      }
    };

    window.onload = function () {
          // Efface tout le localStorage
      localStorage.clear();

      // Efface tout le sessionStorage
      sessionStorage.clear();

      window.addEventListener("load", () => {

        // Si tu veux aussi vider tous les inputs et textarea
        document.querySelectorAll("input, textarea").forEach(el => {
          el.value = "";
        });
      });
      addRow();
      document.getElementById('visite-date').valueAsDate = new Date();
    }

    const photoInputChantier = document.getElementById('photo-input-chantier');
    const photoContainerChantier = document.getElementById('photo-container-chantier');

    photoInputChantier.addEventListener('change', function () {

      Array.from(this.files).forEach((file, index) => {
        const reader = new FileReader();

        reader.onload = function (e) {
          // Crée un conteneur pour chaque image + bouton
          const imageWrapper = document.createElement('div');
          imageWrapper.style.position = 'relative';
          imageWrapper.style.display = 'inline-block';

          // Image preview
          const img = document.createElement('img');
          img.src = e.target.result;
          img.style.width = '300px';
          img.style.height = 'auto';
          img.style.border = '1px solid #ccc';
          img.style.borderRadius = '8px';

          // Bouton de suppression
          const btn = document.createElement('button');
          btn.textContent = '✕';
          btn.style.position = 'absolute';
          btn.style.top = '0';
          btn.style.right = '0';
          btn.style.background = 'rgba(0,0,0,0.6)';
          btn.style.color = 'white';
          btn.style.border = 'none';
          btn.style.borderRadius = '0 8px 0 8px';
          btn.style.cursor = 'pointer';

          btn.addEventListener('click', () => {
            imageWrapper.remove();
          });

          // Ajout au DOM
          imageWrapper.appendChild(img);
          imageWrapper.appendChild(btn);
          photoContainerChantier.appendChild(imageWrapper);
        };
        reader.readAsDataURL(file);
      });
    });

    const photoInput = document.getElementById('photo-input');
    const photoContainer = document.getElementById('photo-container');

// Met à jour les numéros de chaque photo
function updatePhotoLabels() {
  const wrappers = photoContainer.querySelectorAll('.photo-wrapper');
  wrappers.forEach((wrapper, i) => {
    const label = wrapper.querySelector('label');
    if (label) {
      label.textContent = 'Photo ' + (i + 1);
    }
  });
}

photoInput.addEventListener('change', function () {
  Array.from(this.files).forEach((file) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      const imageWrapper = document.createElement('div');
      imageWrapper.classList.add('photo-wrapper'); // ← important !
      imageWrapper.style.position = 'relative';
      imageWrapper.style.display = 'inline-block';
      imageWrapper.style.margin = '10px';

      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.width = '300px';
      img.style.height = 'auto';
      img.style.border = '1px solid #ccc';
      img.style.borderRadius = '8px';

      const btn = document.createElement('button');
      btn.textContent = '✕';
      btn.style.position = 'absolute';
      btn.style.top = '0';
      btn.style.right = '0';
      btn.style.background = 'rgba(0,0,0,0.6)';
      btn.style.color = 'white';
      btn.style.border = 'none';
      btn.style.borderRadius = '0 8px 0 8px';
      btn.style.cursor = 'pointer';

      btn.addEventListener('click', () => {
        imageWrapper.remove();
        updatePhotoLabels(); // Mise à jour après suppression
      });

      const label = document.createElement('label');
      label.textContent = 'Photo '; // sera mis à jour juste après
      label.style.display = 'block'; // ← indispensable
      label.style.marginTop = '5px';
      label.style.fontWeight = 'bold';

      imageWrapper.appendChild(img);
      imageWrapper.appendChild(btn);
      imageWrapper.appendChild(label);
      photoContainer.appendChild(imageWrapper);

      updatePhotoLabels(); // Mise à jour après ajout
    };

    reader.readAsDataURL(file);
  });

  this.value = ''; // pour permettre un nouveau chargement des mêmes fichiers

    });
