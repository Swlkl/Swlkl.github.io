// ==========================================================================
// FILMS : catalogue TMDB, « Je veux le voir », films vus, notes & commentaires
// (chargé APRÈS script.js : utilise ses variables globales listeFilms, maListe,
//  mesVus, sauvegarderDonneesCloud, ouvrirPanneauDetails, escapeHtml, etc.)
// ==========================================================================

// 1) Crée un compte gratuit sur https://www.themoviedb.org, puis colle ici ta
//    « Clé API (v3) » : Paramètres > API.
const TMDB_API_KEY = '998217006d3ad42387ae8b25dcaa8f6e';

const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/';
const AFFICHE_VIDE = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="100%" height="100%" fill="#2a2a2a"/><text x="50%" y="50%" fill="#777" font-family="Arial" font-size="20" text-anchor="middle">Pas d\'affiche</text></svg>'
);

const TMDB_GENRES = {
  28: 'Action', 12: 'Aventure', 16: 'Animation', 35: 'Comédie', 80: 'Crime', 99: 'Documentaire',
  18: 'Drame', 10751: 'Famille', 14: 'Fantastique', 36: 'Histoire', 27: 'Horreur', 10402: 'Musique',
  9648: 'Mystère', 10749: 'Romance', 878: 'Science-fiction', 10770: 'Téléfilm', 53: 'Thriller',
  10752: 'Guerre', 37: 'Western'
};

// ---------------------------------------------------------------- utilitaires
function afficherToast(message) {
  let conteneur = document.querySelector('.toast-container');
  if (!conteneur) {
    conteneur = document.createElement('div');
    conteneur.className = 'toast-container';
    document.body.appendChild(conteneur);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-message">${escapeHtml(message)}</span>`;
  conteneur.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function tmdb(chemin, params = {}) {
  if (!TMDB_API_KEY) throw new Error('NO_KEY');
  const url = new URL(TMDB_API + chemin);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'fr-FR');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error('TMDB ' + reponse.status);
  return reponse.json();
}

// Convertit un résultat TMDB en objet "film" compatible avec le reste du site
function tmdbVersFilm(m) {
  return {
    id: -m.id,                       // id temporaire (négatif) tant qu'il n'est pas dans la bibliothèque
    tmdbId: m.id,
    titre: m.title || m.original_title || 'Sans titre',
    auteur: (m.genre_ids && TMDB_GENRES[m.genre_ids[0]]) || (m.genres && m.genres[0] && m.genres[0].name) || 'Film',
    type: 'film',
    duree: m.runtime || 0,
    description: m.overview || '',
    affiche: m.poster_path ? TMDB_IMG + 'w500' + m.poster_path : AFFICHE_VIDE,
    fileUrl: '',
    dateSortie: (m.release_date || '').slice(0, 4),
    source: 'tmdb',
    noteTmdb: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null
  };
}

// ------------------------------------------------------------- bibliothèque
function filmDeBibliotheque(film) {
  return listeFilms.find(f => f.id === film.id)
    || (film.tmdbId ? listeFilms.find(f => f.tmdbId === film.tmdbId) : null)
    || null;
}

async function ajouterALaBibliotheque(film) {
  let existant = filmDeBibliotheque(film);
  if (existant) return existant;
  const copie = { ...film, id: Date.now() };
  try {
    const d = await tmdb('/movie/' + film.tmdbId);
    copie.duree = d.runtime || 0;
    if (d.genres && d.genres[0]) copie.auteur = d.genres[0].name;
  } catch (e) { /* durée facultative */ }
  existant = filmDeBibliotheque(film);        // évite un doublon si double clic
  if (existant) return existant;
  listeFilms.push(copie);
  return copie;
}

// Ajoute / retire un film de « Ma liste » (= « Je veux le voir »)
async function basculerMaListe(film) {
  let reel = filmDeBibliotheque(film);
  if (!reel) reel = await ajouterALaBibliotheque(film);
  const i = maListe.indexOf(reel.id);
  if (i > -1) maListe.splice(i, 1); else maListe.push(reel.id);

  // Un film TMDB retiré de la liste, jamais vu et sans fichier, ne reste pas dans la bibliothèque
  if (i > -1 && reel.source === 'tmdb' && !reel.fileUrl && !estVu(reel.id)) {
    listeFilms = listeFilms.filter(f => f.id !== reel.id);
  }
  await sauvegarderDonneesCloud();
  return { film: reel, dansListe: maListe.includes(reel.id) };
}

// ------------------------------------------------------------------ films vus
function avisDe(filmId) { return mesVus.find(v => v.filmId === filmId) || null; }
function estVu(filmId) { return !!avisDe(filmId); }

function marquerVu(film, extra = {}) {
  let avis = avisDe(film.id);
  if (!avis) {
    avis = { filmId: film.id, date: new Date().toISOString(), note: 0, commentaire: '' };
    mesVus.push(avis);
  }
  Object.assign(avis, extra);
  return avis;
}

function retirerVu(filmId) {
  mesVus = mesVus.filter(v => v.filmId !== filmId);
}

function etoilesTexte(note) {
  return '★'.repeat(note) + '☆'.repeat(5 - note);
}

// -------------------------------------------------- bloc « Mon avis » (détails)
function majBlocAvis(film) {
  const box = document.getElementById('reviewBox');
  if (!box) return;
  const fournisseurs = document.getElementById('detailsProviders');
  const btnAjout = document.getElementById('detailsAddBtn');
  const btnSuppr = document.getElementById('detailsDeleteBtn');
  const btnLecture = document.getElementById('detailsPlayBtn');
  if (fournisseurs) fournisseurs.innerHTML = '';

  if (film.type !== 'film') { box.style.display = 'none'; return; }
  box.style.display = 'block';

  const reelInitial = filmDeBibliotheque(film);
  if (btnSuppr) btnSuppr.style.display = reelInitial ? '' : 'none';

  // --- « Je veux le voir »
  const majBoutonListe = () => {
    const r = filmDeBibliotheque(film);
    if (btnAjout) btnAjout.textContent = (r && maListe.includes(r.id)) ? '✓ Dans ma liste' : '+ Je veux le voir';
  };
  if (btnAjout) {
    majBoutonListe();
    btnAjout.onclick = async () => {
      const res = await basculerMaListe(film);
      filmSelectionneDetails = res.film;
      majBoutonListe();
      if (btnSuppr) btnSuppr.style.display = filmDeBibliotheque(film) ? '' : 'none';
      afficherToast(res.dansListe ? 'Ajouté à ta liste' : 'Retiré de ta liste');
    };
  }

  // --- Lecture : bande-annonce si le film n'a pas de fichier
  if (btnLecture) btnLecture.textContent = '▶ Lecture';
  if (btnLecture && !film.fileUrl && film.tmdbId) {
    btnLecture.textContent = '▶ Bande-annonce';
    btnLecture.onclick = () => { fermerPanneauDetails(); ouvrirBandeAnnonce(film); };
  }

  // --- Vu / note / commentaire
  const avis = reelInitial ? avisDe(reelInitial.id) : null;
  let noteChoisie = avis ? avis.note : 0;
  const etoiles = box.querySelectorAll('#reviewStars button');
  const champ = document.getElementById('reviewComment');
  const btnVu = document.getElementById('btnToggleVu');
  const btnSave = document.getElementById('btnSaveReview');

  const peindre = (n) => etoiles.forEach(b => b.classList.toggle('on', Number(b.dataset.v) <= n));
  const majBoutonVu = () => {
    const r = filmDeBibliotheque(film);
    btnVu.textContent = (r && estVu(r.id)) ? '✓ Vu (retirer)' : '👁 Marquer comme vu';
  };

  champ.value = avis ? avis.commentaire : '';
  peindre(noteChoisie);
  majBoutonVu();

  etoiles.forEach(b => {
    b.onclick = () => {
      const v = Number(b.dataset.v);
      noteChoisie = (v === noteChoisie) ? 0 : v;   // re-cliquer sur la même note l'efface
      peindre(noteChoisie);
    };
  });

  btnVu.onclick = async () => {
    const r = filmDeBibliotheque(film) || await ajouterALaBibliotheque(film);
    if (estVu(r.id)) {
      retirerVu(r.id);
      noteChoisie = 0; champ.value = ''; peindre(0);
      afficherToast('Retiré de tes films vus');
    } else {
      marquerVu(r, { note: noteChoisie, commentaire: champ.value.trim() });
      afficherToast('Marqué comme vu');
    }
    filmSelectionneDetails = r;
    majBoutonVu();
    if (btnSuppr) btnSuppr.style.display = '';
    await sauvegarderDonneesCloud();
  };

  btnSave.onclick = async () => {
    const r = filmDeBibliotheque(film) || await ajouterALaBibliotheque(film);
    marquerVu(r, { note: noteChoisie, commentaire: champ.value.trim() });
    filmSelectionneDetails = r;
    majBoutonVu();
    if (btnSuppr) btnSuppr.style.display = '';
    await sauvegarderDonneesCloud();
    afficherToast('Ton avis est enregistré');
  };

  // --- Où le regarder légalement (si TMDB est configuré)
  const tmdbId = film.tmdbId || (reelInitial && reelInitial.tmdbId);
  if (tmdbId && TMDB_API_KEY && fournisseurs) chargerFournisseurs(tmdbId, fournisseurs);
}

async function chargerFournisseurs(tmdbId, conteneur) {
  conteneur.innerHTML = '<span class="providers-loading">Recherche des offres de streaming…</span>';
  try {
    const data = await tmdb(`/movie/${tmdbId}/watch/providers`);
    const fr = data.results && data.results.FR;
    const noms = (liste) => (liste || []).map(p => escapeHtml(p.provider_name)).join(', ');
    let html = '';
    if (fr) {
      if (fr.flatrate && fr.flatrate.length) html += `<div><strong>En streaming :</strong> ${noms(fr.flatrate)}</div>`;
      if (fr.rent && fr.rent.length) html += `<div><strong>Location :</strong> ${noms(fr.rent)}</div>`;
      if (fr.buy && fr.buy.length) html += `<div><strong>Achat :</strong> ${noms(fr.buy)}</div>`;
      if (fr.link) html += `<div><a href="${escapeHtml(fr.link)}" target="_blank" rel="noopener noreferrer">Voir toutes les offres ›</a></div>`;
    }
    if (!html) html = '<div>Aucune offre légale trouvée en France pour le moment.</div>';
    html += '<div class="providers-credit">Données JustWatch via TMDB</div>';
    // Ne pas écraser si le panneau affiche déjà un autre film
    const courant = filmSelectionneDetails;
    if (courant && courant.tmdbId === tmdbId) conteneur.innerHTML = html;
  } catch (e) {
    conteneur.innerHTML = '';
  }
}

// ------------------------------------------------------------ bande-annonce
async function ouvrirBandeAnnonce(film) {
  try {
    const trouver = (data) => (data.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer')
      || (data.results || []).find(v => v.site === 'YouTube');
    let video = trouver(await tmdb(`/movie/${film.tmdbId}/videos`));
    if (!video) video = trouver(await tmdb(`/movie/${film.tmdbId}/videos`, { language: 'en-US' }));
    if (!video) { afficherToast('Aucune bande-annonce disponible'); return; }

    playerModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (localVideoPlayer) localVideoPlayer.style.display = 'none';
    youtubeVideoPlayer.style.display = 'block';
    const origine = window.location.origin !== 'null' ? window.location.origin : '*';
    youtubeVideoPlayer.src = `https://www.youtube.com/embed/${video.key}?autoplay=1&origin=${encodeURIComponent(origine)}`;
  } catch (e) {
    afficherToast(e.message === 'NO_KEY' ? 'Clé TMDB manquante (voir films.js)' : 'Bande-annonce indisponible');
  }
}

// Fin d'un film (fichier local) : marqué comme vu + invitation à donner son avis
if (localVideoPlayer) {
  localVideoPlayer.addEventListener('ended', async () => {
    if (!filmEnCours || filmEnCours.type !== 'film') return;
    const film = filmEnCours;
    marquerVu(film);
    await sauvegarderDonneesCloud();
    const fermer = document.getElementById('closePlayerBtn');
    if (fermer) fermer.click();
    afficherToast('Film terminé : donne ton avis !');
    ouvrirPanneauDetails(film);
  });
}

// ---------------------------------------------------- section « Découvrir »
function injecterDecouverteFilms(conteneur) {
  const section = document.createElement('section');
  section.className = 'tmdb-section';

  if (!TMDB_API_KEY) {
    section.innerHTML = `
      <h2 class="category-row-title">Découvrir des films</h2>
      <p class="empty-msg">Pour afficher le catalogue de films, ajoute ta clé gratuite TMDB dans <code>films.js</code> (constante <code>TMDB_API_KEY</code>).</p>
      <h2 class="category-row-title tmdb-library-title">Ma bibliothèque</h2>`;
    conteneur.prepend(section);
    return;
  }

  section.innerHTML = `
    <div class="tmdb-head">
      <h2 class="category-row-title">Découvrir des films</h2>
      <input type="search" class="tmdb-search" placeholder="Rechercher un film..." autocomplete="off">
    </div>
    <div class="tmdb-chips">
      <button type="button" class="tmdb-chip active" data-mode="popular">Populaires</button>
      <button type="button" class="tmdb-chip" data-mode="now_playing">À l'affiche</button>
      <button type="button" class="tmdb-chip" data-mode="top_rated">Mieux notés</button>
    </div>
    <div class="tmdb-grid"></div>
    <div class="tmdb-more-wrap"><button type="button" class="btn-secondary tmdb-more" style="display:none;">Voir plus</button></div>
    <p class="tmdb-credit">Ce site utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB.</p>
    <h2 class="category-row-title tmdb-library-title">Ma bibliothèque</h2>`;
  conteneur.prepend(section);

  const grille = section.querySelector('.tmdb-grid');
  const champ = section.querySelector('.tmdb-search');
  const btnPlus = section.querySelector('.tmdb-more');
  const chips = section.querySelectorAll('.tmdb-chip');
  let mode = 'popular', requete = '', page = 1, totalPages = 1, jeton = 0;

  const creerCarte = (m) => {
    const film = tmdbVersFilm(m);
    const carte = document.createElement('div');
    carte.className = 'tmdb-card';
    const dansListe = () => { const r = filmDeBibliotheque(film); return r && maListe.includes(r.id); };
    carte.innerHTML = `
      <div class="tmdb-poster">
        <img loading="lazy" src="${film.affiche}" alt="">
        ${film.noteTmdb ? `<span class="tmdb-rating">★ ${film.noteTmdb}</span>` : ''}
      </div>
      <div class="tmdb-title"></div>
      <div class="tmdb-year">${escapeHtml(film.dateSortie)}${film.auteur && film.auteur !== 'Film' ? ' · ' + escapeHtml(film.auteur) : ''}</div>
      <button type="button" class="tmdb-add"></button>`;
    carte.querySelector('.tmdb-title').textContent = film.titre;
    carte.querySelector('img').alt = film.titre;
    const btn = carte.querySelector('.tmdb-add');
    const majBtn = () => {
      const actif = dansListe();
      btn.textContent = actif ? '✓ Dans ma liste' : '+ Je veux le voir';
      btn.classList.toggle('on', !!actif);
    };
    majBtn();
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const res = await basculerMaListe(film);
      btn.disabled = false;
      majBtn();
      afficherToast(res.dansListe ? 'Ajouté à ta liste : ' + film.titre : 'Retiré de ta liste');
    });
    carte.querySelector('.tmdb-poster').addEventListener('click', () => {
      const reel = filmDeBibliotheque(film);
      ouvrirPanneauDetails(reel || film);
    });
    return carte;
  };

  const charger = async (reinitialiser) => {
    const monJeton = ++jeton;
    if (reinitialiser) { page = 1; grille.innerHTML = '<p class="empty-msg">Chargement…</p>'; btnPlus.style.display = 'none'; }
    try {
      const data = requete
        ? await tmdb('/search/movie', { query: requete, page, include_adult: 'false' })
        : await tmdb('/movie/' + mode, { page, region: 'FR' });
      if (monJeton !== jeton) return;                 // une requête plus récente a pris le relais
      if (reinitialiser) grille.innerHTML = '';
      totalPages = data.total_pages || 1;
      (data.results || []).forEach(m => grille.appendChild(creerCarte(m)));
      if (!grille.children.length) grille.innerHTML = '<p class="empty-msg">Aucun film trouvé.</p>';
      btnPlus.style.display = page < totalPages ? '' : 'none';
    } catch (e) {
      if (monJeton !== jeton) return;
      grille.innerHTML = `<p class="empty-msg">${e.message === 'TMDB 401' ? 'Clé TMDB invalide.' : 'Impossible de charger le catalogue.'}</p>`;
    }
  };

  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    mode = chip.dataset.mode; requete = ''; champ.value = '';
    charger(true);
  }));

  let minuterie = null;
  champ.addEventListener('input', () => {
    clearTimeout(minuterie);
    minuterie = setTimeout(() => {
      requete = champ.value.trim();
      chips.forEach(c => c.classList.toggle('active', !requete && c.dataset.mode === mode));
      charger(true);
    }, 400);
  });

  btnPlus.addEventListener('click', () => { page++; charger(false); });
  charger(true);
}

// ------------------------------------------------- « Mes films vus » (compte)
const seenModal = document.getElementById('seenModal');
const seenList = document.getElementById('seenList');
const seenSummary = document.getElementById('seenSummary');

function afficherFilmsVus() {
  if (!seenList) return;
  seenList.innerHTML = '';
  const vus = mesVus
    .map(v => ({ avis: v, film: listeFilms.find(f => f.id === v.filmId) }))
    .filter(x => x.film)
    .sort((a, b) => new Date(b.avis.date) - new Date(a.avis.date));

  const notes = vus.filter(x => x.avis.note > 0).map(x => x.avis.note);
  const moyenne = notes.length ? (notes.reduce((s, n) => s + n, 0) / notes.length).toFixed(1) : null;
  seenSummary.textContent = vus.length
    ? `${vus.length} film${vus.length > 1 ? 's' : ''} vu${vus.length > 1 ? 's' : ''}${moyenne ? ' · note moyenne ' + moyenne + '/5' : ''}`
    : '';

  if (!vus.length) {
    seenList.innerHTML = "<p class='empty-msg'>Tu n'as pas encore marqué de film comme vu. Ouvre la fiche d'un film pour donner ton avis.</p>";
    return;
  }

  vus.forEach(({ avis, film }) => {
    const ligne = document.createElement('div');
    ligne.className = 'seen-item';
    const date = new Date(avis.date).toLocaleDateString('fr-FR');
    ligne.innerHTML = `
      <img src="${film.affiche || AFFICHE_VIDE}" alt="" class="seen-poster">
      <div class="seen-info">
        <div class="seen-title"></div>
        <div class="seen-meta">${avis.note ? `<span class="seen-stars">${etoilesTexte(avis.note)}</span> · ` : ''}Vu le ${date}</div>
        ${avis.commentaire ? '<p class="seen-comment"></p>' : '<p class="seen-comment empty">Pas de commentaire</p>'}
        <div class="seen-actions">
          <button type="button" class="btn-secondary seen-edit">Modifier mon avis</button>
          <button type="button" class="btn-secondary seen-remove">Retirer</button>
        </div>
      </div>`;
    ligne.querySelector('.seen-title').textContent = film.titre + (film.dateSortie ? ` (${film.dateSortie})` : '');
    const pc = ligne.querySelector('.seen-comment:not(.empty)');
    if (pc) pc.textContent = avis.commentaire;
    ligne.querySelector('.seen-edit').addEventListener('click', () => {
      seenModal.style.display = 'none';
      ouvrirPanneauDetails(film);
    });
    ligne.querySelector('.seen-remove').addEventListener('click', async () => {
      retirerVu(film.id);
      await sauvegarderDonneesCloud();
      afficherFilmsVus();
    });
    seenList.appendChild(ligne);
  });
}

const btnOpenSeenModal = document.getElementById('btnOpenSeenModal');
if (btnOpenSeenModal) {
  btnOpenSeenModal.addEventListener('click', () => {
    const menu = document.getElementById('userDropdownMenu');
    if (menu) menu.classList.remove('active');
    afficherFilmsVus();
    seenModal.style.display = 'flex';
  });
}
const closeSeenBtn = document.getElementById('closeSeenBtn');
if (closeSeenBtn) closeSeenBtn.addEventListener('click', () => { seenModal.style.display = 'none'; });
if (seenModal) seenModal.addEventListener('click', (e) => { if (e.target === seenModal) seenModal.style.display = 'none'; });
