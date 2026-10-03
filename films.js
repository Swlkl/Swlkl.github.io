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

// Rangées affichées sur l'accueil (dans l'ordre). Tu peux en retirer, en ajouter ou les réordonner.
// Genres : 28 Action, 12 Aventure, 27 Horreur, 35 Comédie, 878 Science-fiction, 16 Animation,
//          53 Thriller, 10749 Romance, 18 Drame, 14 Fantastique, 80 Crime, 99 Documentaire, 10751 Famille.
// Plateformes (watch provider) : 8 Netflix, 119 Prime Video, 337 Disney+, 381 Canal+, 350 Apple TV+.
const GENRE_PARAMS = { sort_by: 'popularity.desc', 'vote_count.gte': 200 };
const PLATEFORME_PARAMS = { sort_by: 'popularity.desc', watch_region: 'FR', with_watch_monetization_types: 'flatrate' };
const RANGEES_ACCUEIL = [
  { titre: 'Tendances cette semaine',     chemin: '/trending/movie/week' },
  { titre: 'À l\'affiche au cinéma',      chemin: '/movie/now_playing', params: { region: 'FR' } },
  { titre: 'Action',                      chemin: '/discover/movie', params: { ...GENRE_PARAMS, with_genres: 28 } },
  { titre: 'Horreur',                     chemin: '/discover/movie', params: { ...GENRE_PARAMS, with_genres: 27 } },
  { titre: 'Aventure',                    chemin: '/discover/movie', params: { ...GENRE_PARAMS, with_genres: 12 } },
  { titre: 'Comédie',                     chemin: '/discover/movie', params: { ...GENRE_PARAMS, with_genres: 35 } },
  { titre: 'Science-fiction',             chemin: '/discover/movie', params: { ...GENRE_PARAMS, with_genres: 878 } },
  { titre: 'Animation',                   chemin: '/discover/movie', params: { ...GENRE_PARAMS, with_genres: 16 } },
  { titre: 'Thriller',                    chemin: '/discover/movie', params: { ...GENRE_PARAMS, with_genres: 53 } },
  { titre: 'Disponibles sur Netflix',     chemin: '/discover/movie', params: { ...PLATEFORME_PARAMS, with_watch_providers: 8 } },
  { titre: 'Disponibles sur Prime Video', chemin: '/discover/movie', params: { ...PLATEFORME_PARAMS, with_watch_providers: 119 } },
  { titre: 'Disponibles sur Disney+',     chemin: '/discover/movie', params: { ...PLATEFORME_PARAMS, with_watch_providers: 337 } },
  { titre: 'Les mieux notés',             chemin: '/movie/top_rated' }
];

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

const cacheTmdb = new Map();
const DUREE_CACHE_TMDB = 30 * 60 * 1000;

async function tmdb(chemin, params = {}) {
  if (!TMDB_API_KEY) throw new Error('NO_KEY');
  const url = new URL(TMDB_API + chemin);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'fr-FR');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const cle = url.toString();
  const enCache = cacheTmdb.get(cle);
  if (enCache && Date.now() - enCache.t < DUREE_CACHE_TMDB) return enCache.data;
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error('TMDB ' + reponse.status);
  const data = await reponse.json();
  cacheTmdb.set(cle, { t: Date.now(), data });
  return data;
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
    fond: m.backdrop_path ? TMDB_IMG + 'w1280' + m.backdrop_path : '',   // image 16:9 pour le hero et les cartes
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
// Retourne la clé YouTube de la bande-annonce (français d'abord, puis anglais)
async function trouverCleBandeAnnonce(film) {
  if (film.trailerKey) return film.trailerKey;
  const trouver = (data) => (data.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer')
    || (data.results || []).find(v => v.site === 'YouTube');
  let video = trouver(await tmdb(`/movie/${film.tmdbId}/videos`));
  if (!video) video = trouver(await tmdb(`/movie/${film.tmdbId}/videos`, { language: 'en-US' }));
  if (video) film.trailerKey = video.key;       // mémorisé pour éviter de refaire la requête
  return video ? video.key : null;
}

async function ouvrirBandeAnnonce(film) {
  try {
    const cle = await trouverCleBandeAnnonce(film);
    if (!cle) { afficherToast('Aucune bande-annonce disponible'); return; }
    playerModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (localVideoPlayer) localVideoPlayer.style.display = 'none';
    youtubeVideoPlayer.style.display = 'block';
    const origine = window.location.origin !== 'null' ? window.location.origin : '*';
    youtubeVideoPlayer.src = `https://www.youtube.com/embed/${cle}?autoplay=1&origin=${encodeURIComponent(origine)}`;
  } catch (e) {
    afficherToast(e.message === 'NO_KEY' ? 'Clé TMDB manquante (voir films.js)' : 'Bande-annonce indisponible');
  }
}

// ---- Bande-annonce muette en arrière-plan de la bannière « hero »
function ajusterTrailerHero() {
  const frame = document.getElementById('heroTrailer');
  const zone = frame && frame.parentElement;
  if (!frame || !zone || !zone.clientWidth) return;
  const w = zone.clientWidth, h = zone.clientHeight, ratio = 16 / 9;
  // La vidéo 16:9 doit recouvrir toute la bannière (comme object-fit: cover)
  if (w / h >= ratio) { frame.style.width = w + 'px'; frame.style.height = (w / ratio) + 'px'; }
  else { frame.style.height = h + 'px'; frame.style.width = (h * ratio) + 'px'; }
}
window.addEventListener('resize', ajusterTrailerHero);

function arreterBandeAnnonceHero() {
  const frame = document.getElementById('heroTrailer');
  if (!frame) return;
  frame.style.display = 'none';
  frame.removeAttribute('src');
}

async function lancerBandeAnnonceHero(film, index) {
  const frame = document.getElementById('heroTrailer');
  const poster = document.getElementById('heroPoster');
  if (!frame || !TMDB_API_KEY) return;
  try {
    const cle = await trouverCleBandeAnnonce(film);
    if (!cle || index !== heroCurrentIndex) return;   // l'utilisateur a changé de slide entre-temps
    if (document.getElementById('heroBanner').style.display === 'none') return;
    ajusterTrailerHero();
    frame.src = `https://www.youtube.com/embed/${cle}?autoplay=1&mute=1&controls=0&loop=1&playlist=${cle}`
      + '&modestbranding=1&rel=0&playsinline=1&disablekb=1&iv_load_policy=3';
    frame.onload = () => {
      if (index !== heroCurrentIndex) return;
      frame.style.display = 'block';
      if (poster) poster.style.display = 'none';
    };
  } catch (e) { /* on garde simplement l'image */ }
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
      <select class="tmdb-genre" aria-label="Genre">
        <option value="">Tous les genres</option>
        ${Object.entries(TMDB_GENRES).map(([id, nom]) => `<option value="${id}">${nom}</option>`).join('')}
      </select>
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
  const selectGenre = section.querySelector('.tmdb-genre');
  let mode = 'popular', requete = '', genre = '', page = 1, totalPages = 1, jeton = 0;

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
        : genre
          ? await tmdb('/discover/movie', { ...GENRE_PARAMS, with_genres: genre, page })
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
    mode = chip.dataset.mode; requete = ''; genre = ''; champ.value = ''; selectGenre.value = '';
    charger(true);
  }));

  let minuterie = null;
  champ.addEventListener('input', () => {
    clearTimeout(minuterie);
    minuterie = setTimeout(() => {
      requete = champ.value.trim();
      if (requete) { genre = ''; selectGenre.value = ''; }
      chips.forEach(c => c.classList.toggle('active', !requete && !genre && c.dataset.mode === mode));
      charger(true);
    }, 400);
  });

  selectGenre.addEventListener('change', () => {
    genre = selectGenre.value; requete = ''; champ.value = '';
    chips.forEach(c => c.classList.toggle('active', !genre && c.dataset.mode === mode));
    charger(true);
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


// ==========================================================================
// ACCUEIL : rangées TMDB (genres, plateformes...) chargées au fil du défilement
// ==========================================================================
let observateurRangees = null;

function injecterRangeesTMDB(conteneur) {
  if (observateurRangees) observateurRangees.disconnect();
  if (!TMDB_API_KEY) {
    const info = document.createElement('p');
    info.className = 'empty-msg';
    info.innerHTML = 'Ajoute ta clé TMDB dans <code>films.js</code> pour voir les rangées Action, Horreur, Aventure, Netflix…';
    conteneur.appendChild(info);
    return;
  }
  observateurRangees = new IntersectionObserver((entrees) => {
    entrees.forEach(e => {
      if (!e.isIntersecting) return;
      observateurRangees.unobserve(e.target);
      chargerRangeeTMDB(e.target);
    });
  }, { rootMargin: '400px 0px' });

  RANGEES_ACCUEIL.forEach(def => {
    const { section } = creerRangeeCarousel(def.titre);
    section.classList.add('tmdb-row', 'loading');
    section._def = def;
    conteneur.appendChild(section);
    observateurRangees.observe(section);
  });
}

async function chargerRangeeTMDB(section) {
  const def = section._def;
  try {
    const data = await tmdb(def.chemin, def.params || {});
    if (!section.isConnected) return;                    // l'utilisateur a changé d'onglet
    const films = (data.results || [])
      .filter(m => m.backdrop_path && m.poster_path)
      .map(m => { const f = tmdbVersFilm(m); return filmDeBibliotheque(f) || f; });
    if (!films.length) { section.remove(); return; }
    creerCartesHTMLInContainer(films, section.querySelector('.category-flex-container'));
    section.classList.remove('loading');
  } catch (e) {
    section.remove();
  }
}

// ==========================================================================
// CONTINUER DE VOIR : suivi de la progression (fichiers locaux + vidéos YouTube)
// ==========================================================================
let suiviActif = null;          // { film, mesurer() -> {pos, dur} }
let minuterieSuivi = null;
let jetonSuivi = 0;
let progresModifie = false;
let ticsSuivi = 0;

function positionReprise(filmId) {
  const p = mesProgres.find(x => x.id === filmId);
  return p ? Math.max(0, Math.floor(p.pos) - 2) : 0;   // on recule de 2 s pour se remettre dans le bain
}

function enregistrerProgres(film, pos, dur, flush) {
  if (!isFinite(pos) || !isFinite(dur) || dur <= 0) return;
  const i = mesProgres.findIndex(p => p.id === film.id);
  if (pos / dur >= 0.95) {                              // terminé : il sort de « Continuer de voir »
    if (i > -1) mesProgres.splice(i, 1); else return;
  } else if (pos >= 10) {                               // moins de 10 s : on ne retient pas
    const entree = { id: film.id, pos: Math.floor(pos), dur: Math.floor(dur), date: new Date().toISOString() };
    if (i > -1) mesProgres[i] = entree; else mesProgres.push(entree);
  } else return;
  progresModifie = true;
  if (flush) envoyerProgres();
}

async function envoyerProgres() {
  if (!progresModifie) return;
  progresModifie = false;
  try { await sauvegarderDonneesCloud(); } catch (e) { progresModifie = true; }
}

function demarrerSuivi(film, mesurer) {
  arreterSuiviLecture();
  suiviActif = { film, mesurer };
  const monJeton = ++jetonSuivi;
  ticsSuivi = 0;
  minuterieSuivi = setInterval(() => {
    if (!suiviActif || monJeton !== jetonSuivi) return;
    const m = mesurer();
    if (m) enregistrerProgres(film, m.pos, m.dur, false);
    if (++ticsSuivi % 6 === 0) envoyerProgres();         // envoi au cloud toutes les ~30 s
  }, 5000);
  return monJeton;
}

function arreterSuiviLecture() {
  clearInterval(minuterieSuivi);
  if (!suiviActif) return;
  const { film, mesurer } = suiviActif;
  suiviActif = null;
  jetonSuivi++;
  try { const m = mesurer(); if (m) enregistrerProgres(film, m.pos, m.dur, false); } catch (e) { /* lecteur déjà fermé */ }
  envoyerProgres();
}

// Fichier local (.mp4)
function suivreLectureLocale(film) {
  const reprise = positionReprise(film.id);
  localVideoPlayer.addEventListener('loadedmetadata', () => {
    if (reprise > 0 && reprise < localVideoPlayer.duration - 5) localVideoPlayer.currentTime = reprise;
  }, { once: true });
  demarrerSuivi(film, () => ({ pos: localVideoPlayer.currentTime, dur: localVideoPlayer.duration }));
  localVideoPlayer.onpause = () => {
    if (!suiviActif || localVideoPlayer.ended) return;
    enregistrerProgres(film, localVideoPlayer.currentTime, localVideoPlayer.duration, true);
  };
}

// Vidéo YouTube (API IFrame du lecteur)
let apiYoutubePrete = null;
function chargerApiYoutube() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (!apiYoutubePrete) {
    apiYoutubePrete = new Promise(resolve => {
      const precedent = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (precedent) precedent(); resolve(); };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    });
  }
  return apiYoutubePrete;
}

async function suivreYoutube(film) {
  let lecteur = null;
  const monJeton = demarrerSuivi(film, () => {
    if (!lecteur || typeof lecteur.getCurrentTime !== 'function') return null;
    return { pos: lecteur.getCurrentTime(), dur: lecteur.getDuration() };
  });
  try {
    await chargerApiYoutube();
    if (monJeton !== jetonSuivi) return;                  // lecteur fermé entre-temps
    lecteur = new YT.Player('youtubeVideoPlayer', {
      events: {
        onStateChange: (e) => {
          if (monJeton !== jetonSuivi) return;
          if (e.data === 2) enregistrerProgres(film, lecteur.getCurrentTime(), lecteur.getDuration(), true);   // pause
          if (e.data === 0) enregistrerProgres(film, lecteur.getDuration(), lecteur.getDuration(), true);      // fin
        }
      }
    });
  } catch (e) { /* sans l'API, la vidéo se lit quand même (sans suivi) */ }
}

// On enregistre aussi quand l'onglet est fermé ou mis en arrière-plan
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'hidden' || !suiviActif) return;
  const m = suiviActif.mesurer();
  if (m) enregistrerProgres(suiviActif.film, m.pos, m.dur, true);
});

// ---- Rangée « Continuer de voir »
function rangeeContinuerDeVoir(conteneur) {
  const elements = mesProgres
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(p => ({ p, film: listeFilms.find(f => f.id === p.id) }))
    .filter(x => x.film);
  if (!elements.length) return;

  const { section, flex } = creerRangeeCarousel('Continuer de voir', elements.map(x => x.film));
  section.classList.add('resume-row');

  Array.from(flex.children).forEach((carte, i) => {
    const { p, film } = elements[i];
    const pourcent = Math.min(100, Math.max(3, Math.round((p.pos / p.dur) * 100)));
    const reste = Math.max(1, Math.round((p.dur - p.pos) / 60));

    const poster = carte.querySelector('.movie-poster-wrapper');
    poster.insertAdjacentHTML('beforeend',
      `<div class="resume-bar"><span style="width:${pourcent}%"></span></div>
       <button type="button" class="resume-remove" title="Retirer de « Continuer de voir »">✕</button>`);

    const auteur = carte.querySelector('.movie-card-author');
    if (auteur) auteur.textContent = `Il reste ${reste} min`;
    const btnJouer = carte.querySelector('.btn-play-trigger');
    if (btnJouer) btnJouer.textContent = '▶ Reprendre';

    poster.querySelector('.resume-remove').addEventListener('click', async (e) => {
      e.stopPropagation();
      mesProgres = mesProgres.filter(x => x.id !== film.id);
      progresModifie = true;
      carte.remove();
      if (!flex.children.length) section.remove();
      await envoyerProgres();
    });
  });

  conteneur.appendChild(section);
}
