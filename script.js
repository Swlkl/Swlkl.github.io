// ==========================================================================
// 1. BASE DE DONNÉES LOCALE & SYSTEME DE NOTIFICATIONS
// ==========================================================================
const videosInitiales = [
  {
    id: 1,
    titre: "Interstellar",
    auteur: "Christopher Nolan",
    type: "film",
    duree: 169,
    pegi: "12+",
    genre: "Science-Fiction",
    affiche: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800",
    fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    description: "Une équipe d'explorateurs voyage à travers un trou de ver dans l'espace pour sauver l'humanité.",
    dateSortie: "2014"
  },
  {
    id: 2,
    titre: "Inception",
    auteur: "Christopher Nolan",
    type: "film",
    duree: 148,
    pegi: "12+",
    genre: "Action",
    affiche: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
    fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    description: "Un voleur qui s'infiltre dans les rêves des autres se voit offrir une chance de récupérer sa vie passée.",
    dateSortie: "2010"
  },
  {
    id: 3,
    titre: "The Dark Knight",
    auteur: "Christopher Nolan",
    type: "film",
    duree: 152,
    pegi: "12+",
    genre: "Action",
    affiche: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800",
    fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    description: "Batman affronte le Joker, un criminel sadique qui plonge Gotham City dans le chaos.",
    dateSortie: "2008"
  },
  {
    id: 4,
    titre: "Avatar",
    auteur: "James Cameron",
    type: "film",
    duree: 162,
    pegi: "12+",
    genre: "Aventure",
    affiche: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
    fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    description: "Un marine paraplégique est envoyé sur la lune Pandora pour une mission unique.",
    dateSortie: "2009"
  },
  {
    id: 5,
    titre: "Rick et Morty",
    auteur: "Justin Roiland",
    type: "film",
    saisons: "8",
    pegi: "16+",
    genre: "Animation",
    affiche: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800",
    fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    description: "Dans cette série d'animation impertinente, un scientifique et son petit-fils voyagent dans d'autres dimensions.",
    dateSortie: "2023"
  },
  {
    id: 6,
    titre: "See You Again",
    auteur: "Tyler, The Creator",
    type: "musique",
    musicSource: "file",
    affiche: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=500",
    youtubeId: "",
    fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    description: "Titre à succès extrait de l'album Flower Boy.",
    dateSortie: "2017",
    duree: 4
  }
];

let listeFilms    = JSON.parse(localStorage.getItem('mesVideosNetflix')) || videosInitiales;
let mesPlaylists  = JSON.parse(localStorage.getItem('mesPlaylistsMusic'))  || [];
let maListe       = JSON.parse(localStorage.getItem('maListeNetflix'))   || [];
let notifications = JSON.parse(localStorage.getItem('mesNotifications')) || [];

let filmSelectionneDetails = null;
let playlistMusiqueEnCours = [];
let indexMusiqueActive = -1;
let heroTimer = null;
let heroItemsSelection = [];
let heroCurrentIndex = 0;

let typesYoutube = ['video', 'jeux-video', 'culture', 'programmation'];

const sousCategoriesLibelles = {
  'video': 'Général',
  'jeux-video': 'Gaming & Jeux vidéo',
  'culture': 'Culture & Savoirs',
  'programmation': 'Programmation & Tech'
};

// Synchronisation au démarrage
listeFilms.forEach(item => {
  if (item.type !== 'film' && item.type !== 'musique' && !typesYoutube.includes(item.type)) {
    typesYoutube.push(item.type);
    sousCategoriesLibelles[item.type] = item.type;
  }
});

let filtreGenreActif = 'tous';
let filtreTriActif = 'recent';

// ==========================================================================
// 2. SÉLECTION DES ÉLÉMENTS HTML
// ==========================================================================
const catalog    = document.getElementById('catalog');
const pageTitle  = document.getElementById('pageTitle');
const searchBar  = document.getElementById('searchBar');

const notificationBtn   = document.getElementById('notificationBtn');
const notificationBadge = document.getElementById('notificationBadge');

const detailsPanelContainer = document.getElementById('detailsPanelContainer');
const detailsPanel          = document.getElementById('detailsPanel');
const closeDetailsBtn       = document.getElementById('closeDetailsBtn');
const detailsTitle          = document.getElementById('detailsTitle');
const detailsType           = document.getElementById('detailsType');
const detailsAuthor         = document.getElementById('detailsAuthor'); 
const detailsDate           = document.getElementById('detailsDate');
const detailsDuration       = document.getElementById('detailsDuration');
const detailsDescription    = document.getElementById('detailsDescription');

const btnAccueil  = document.getElementById('btnAccueil');
const btnFilms    = document.getElementById('btnFilms');
const btnVideos   = document.getElementById('btnVideos');
const btnMusiques = document.getElementById('btnMusiques');
const btnMaListe  = document.getElementById('btnMaListe');

// Lecteurs multimédias
const playerModal         = document.getElementById('playerModal');
const localVideoPlayer    = document.getElementById('localVideoPlayer');
const youtubeVideoPlayer  = document.getElementById('youtubeVideoPlayer');

const persistentAudioPlayer = document.getElementById('persistentAudioPlayer');
const closeAudioBar         = document.getElementById('closeAudioBar');
const localAudioPlayer      = document.getElementById('localAudioPlayer');
const audioPlayerCover      = document.getElementById('audioPlayerCover');
const audioPlayerTitle      = document.getElementById('audioPlayerTitle');
const audioPlayerArtist     = document.getElementById('audioPlayerArtist');
const audioBtnPlayPause     = document.getElementById('audioBtnPlayPause');
const audioBtnPrev          = document.getElementById('audioBtnPrev');
const audioBtnNext          = document.getElementById('audioBtnNext');
const audioCurrentTime      = document.getElementById('audioCurrentTime');
const audioDuration         = document.getElementById('audioDuration');
const progressContainer     = document.getElementById('progressContainer');
const progressBar           = document.getElementById('progressBar');
const volumeContainer       = document.getElementById('volumeContainer');
const volumeBar            = document.getElementById('volumeBar');

// Modale d'ajout
const btnOuvrirAjout   = document.getElementById('btnOuvrirAjout');
const addVideoModal    = document.getElementById('addVideoModal');
const closeAjoutBtn    = document.getElementById('closeAjoutBtn');
const formAjoutVideo   = document.getElementById('formAjoutVideo');

const selectVideoType  = document.getElementById('videoType');
const groupYoutubeUrl  = document.getElementById('groupYoutubeUrl');
const groupFileUrl     = document.getElementById('groupFileUrl');
const groupSubCategory = document.getElementById('groupSubCategory');
const btnSystemPicker  = document.getElementById('btnSystemPicker');
const systemFilePicker = document.getElementById('systemFilePicker');
const videoFileUrl     = document.getElementById('videoFileUrl');

// Notification dropdown
const notifContainer = document.querySelector('.notification-container');
const notifDropdown = document.createElement('div');
notifDropdown.className = 'notification-dropdown';
notifDropdown.id = 'notifDropdown';
if (notifContainer) {
  notifContainer.appendChild(notifDropdown);
}

// ==========================================================================
// 3. FONCTIONS UTILITAIRES & NOTIFICATIONS
// ==========================================================================
function formaterTemps(secondes) {
  if (isNaN(secondes) || secondes === null) return "0:00";
  const mins = Math.floor(secondes / 60);
  const secs = Math.floor(secondes % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function formaterDuree(minutes) {
  if (!minutes) return "0min";
  const heures = Math.floor(minutes / 60);
  const minsRestantes = minutes % 60;
  if (heures > 0) return `${heures}h ${minsRestantes}min`;
  return `${minsRestantes}min`;
}

function traduireType(type) {
  if (sousCategoriesLibelles[type]) return sousCategoriesLibelles[type];
  switch (type) {
    case 'film': return 'Film';
    case 'video': return 'Vidéo';
    case 'jeux-video': return 'Gaming';
    case 'culture': return 'Culture';
    case 'programmation': return 'Tech';
    case 'musique': return 'Musique';
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

function mettreAJourNotificationsUI() {
  if (!notificationBadge || !notifDropdown) return;
  
  const nonLues = notifications.filter(n => !n.lue).length;
  
  if (nonLues > 0) {
    notificationBadge.textContent = nonLues > 99 ? '99+' : nonLues;
    notificationBadge.style.display = 'flex';
  } else {
    notificationBadge.style.display = 'none';
  }

  if (notifications.length === 0) {
    notifDropdown.innerHTML = '<div class="notif-empty">Aucune nouveauté pour le moment</div>';
  } else {
    let html = '<div class="notif-header"><span>Nouveautés</span><button id="btnMarquerToutLu">Tout marquer comme lu</button></div>';
    html += '<div class="notif-list">';
    
    notifications.forEach(n => {
      html += `
        <div class="notif-item ${n.lue ? 'read' : 'unread'}" data-id="${n.id}">
          <img src="${n.affiche}" alt="${n.titre}" class="notif-thumb">
          <div class="notif-details">
            <span class="notif-type">${traduireType(n.type)}</span>
            <span class="notif-title">${n.titre}</span>
            <span class="notif-date">${n.date}</span>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    notifDropdown.innerHTML = html;

    const btnClear = document.getElementById('btnMarquerToutLu');
    if (btnClear) {
      btnClear.addEventListener('click', (e) => {
        e.stopPropagation();
        notifications.forEach(n => n.lue = true);
        sauvegarderNotifications();
      });
    }

    notifDropdown.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(item.dataset.id);
        const targetNotif = notifications.find(n => n.id === id);
        if (targetNotif) {
          targetNotif.lue = true;
          sauvegarderNotifications();
          
          const itemMedia = listeFilms.find(f => f.id === targetNotif.mediaId);
          if (itemMedia) {
            ouvrirPanneauDetails(itemMedia);
            notifDropdown.classList.remove('active');
          }
        }
      });
    });
  }
}

function sauvegarderNotifications() {
  localStorage.setItem('mesNotifications', JSON.stringify(notifications));
  mettreAJourNotificationsUI();
}

function afficherNotification(titre, type, affiche = '', mediaId = null) {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  toast.innerHTML = `
    <span class="toast-title">Nouveau contenu ajouté !</span>
    <span class="toast-message"><strong>${traduireType(type)}</strong> : ${titre}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);

  const nouvelleNotif = {
    id: Date.now(),
    mediaId: mediaId,
    titre: titre,
    type: type,
    affiche: affiche || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800',
    date: 'À l\'instant',
    lue: false
  };

  notifications.unshift(nouvelleNotif);
  sauvegarderNotifications();
}

function chargerContenuHero(index) {
  if (!heroItemsSelection[index]) return;

  const item = heroItemsSelection[index];
  heroCurrentIndex = index;

  const heroPoster = document.getElementById('heroPoster');
  const heroVideo  = document.getElementById('heroVideo');
  const heroCategoryBadge = document.getElementById('heroCategoryBadge');

  if (heroTimer) clearTimeout(heroTimer);

  if (heroVideo) {
    heroVideo.pause();
    heroVideo.style.display = 'none';
  }
  if (heroPoster) heroPoster.style.display = 'block';

  if (heroCategoryBadge) {
    heroCategoryBadge.textContent = (item.genre || traduireType(item.type)).toUpperCase();
  }

  if (heroPoster) heroPoster.src = item.affiche;
  document.getElementById('heroTitle').textContent = item.titre;
  document.getElementById('heroDescription').textContent = item.description || "Aucune description disponible.";

  const metaContainer = document.getElementById('heroMeta');
  const details = [];

  details.push(item.genre || traduireType(item.type));
  if (item.auteur && item.auteur !== item.genre) details.push(item.auteur);
  details.push(item.dateSortie || new Date().getFullYear().toString());
  
  if (item.saisons) details.push(`${item.saisons} Saisons`);
  else if (item.duree) details.push(formaterDuree(item.duree));

  let metaHTML = details.join(' <span class="bullet">•</span> ');
  if (item.pegi) {
    metaHTML += ` <span class="bullet">•</span> <span class="age-badge">${item.pegi}</span>`;
  }

  metaContainer.innerHTML = metaHTML;

  const btnPlay = document.getElementById('heroPlayBtn');
  const btnInfo = document.getElementById('heroInfoBtn');

  if (btnPlay) btnPlay.onclick = () => openPlayer(item, listeFilms);
  if (btnInfo) btnInfo.onclick = () => ouvrirPanneauDetails(item);

  const dots = document.querySelectorAll('.hero-dot');
  dots.forEach((dot, idx) => {
    if (idx === index) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });

  if (heroVideo && item.fileUrl) {
    heroTimer = setTimeout(() => {
      heroVideo.src = item.fileUrl;
      heroVideo.muted = true;
      heroVideo.style.display = 'block';
      if (heroPoster) heroPoster.style.display = 'none';

      heroVideo.play().catch(() => {
        if (heroPoster) heroPoster.style.display = 'block';
        heroVideo.style.display = 'none';
      });
    }, 1500);
  }
}

function mettreAJourHeroBanner() {
  const heroBanner = document.getElementById('heroBanner');
  const dotsContainer = document.getElementById('heroDotsContainer');

  if (!heroBanner) return;

  const eligiblesHero = listeFilms.filter(item => item.type === 'film' || typesYoutube.includes(item.type));

  if (eligiblesHero.length === 0) {
    heroBanner.style.display = 'none';
    return;
  }

  const melange = [...eligiblesHero].sort(() => 0.5 - Math.random());
  heroItemsSelection = melange.slice(0, 5);

  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    heroItemsSelection.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = `hero-dot ${index === 0 ? 'active' : ''}`;
      dot.title = `Choix ${index + 1}`;
      dot.addEventListener('click', () => chargerContenuHero(index));
      dotsContainer.appendChild(dot);
    });
  }

  heroBanner.style.display = 'flex';
  chargerContenuHero(0);
}

function obtenirOngletActif() {
  const activeBtn = document.querySelector('.nav-item.active');
  if (!activeBtn) return 'accueil';
  switch (activeBtn.id) {
    case 'btnFilms': return 'film';
    case 'btnVideos': return 'video';
    case 'btnMusiques': return 'musique';
    case 'btnMaListe': return 'maliste';
    default: return 'accueil';
  }
}

// ==========================================================================
// 4. MOTEUR DE RECHERCHE, FILTRES & TRI
// ==========================================================================
function filtrerEtTrier(liste) {
  let resultat = [...liste];

  if (filtreGenreActif !== 'tous') {
    resultat = resultat.filter(item => item.auteur === filtreGenreActif || item.genre === filtreGenreActif);
  }

  if (filtreTriActif === 'recent') {
    resultat.sort((a, b) => (b.id || 0) - (a.id || 0));
  } else if (filtreTriActif === 'alpha') {
    resultat.sort((a, b) => a.titre.localeCompare(b.titre));
  } else if (filtreTriActif === 'duree') {
    resultat.sort((a, b) => (b.duree || 0) - (a.duree || 0));
  }

  return resultat;
}

function injecterBarreFiltres(container, genresDisponibles) {
  const filterBarWrapper = document.createElement('div');
  filterBarWrapper.className = 'filter-bar-wrapper';

  const filterText = document.createElement('div');
  filterText.className = 'filter-bar-text';

  let htmlPills = `<span class="filter-label">Autres titres à découvrir :</span>`;
  htmlPills += `<button class="filter-link ${filtreGenreActif === 'tous' ? 'active' : ''}" data-genre="tous">Tous</button>`;

  genresDisponibles.forEach(g => {
    if (g) {
      htmlPills += `<span class="filter-separator">|</span>`;
      htmlPills += `<button class="filter-link ${filtreGenreActif === g ? 'active' : ''}" data-genre="${g}">${g}</button>`;
    }
  });

  filterText.innerHTML = htmlPills;

  const filterSort = document.createElement('div');
  filterSort.className = 'filter-sort-wrapper';
  filterSort.innerHTML = `
    <select id="sortSelect">
      <option value="recent" ${filtreTriActif === 'recent' ? 'selected' : ''}>Plus récents</option>
      <option value="alpha" ${filtreTriActif === 'alpha' ? 'selected' : ''}>A - Z</option>
      <option value="duree" ${filtreTriActif === 'duree' ? 'selected' : ''}>Durée</option>
    </select>
  `;

  filterBarWrapper.appendChild(filterText);
  filterBarWrapper.appendChild(filterSort);
  container.appendChild(filterBarWrapper);

  filterText.querySelectorAll('.filter-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      filtreGenreActif = e.target.dataset.genre;
      genererCatalogue(obtenirOngletActif());
    });
  });

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      filtreTriActif = e.target.value;
      genererCatalogue(obtenirOngletActif());
    });
  }
}

// ==========================================================================
// 5. RENDU DU CATALOGUE
// ==========================================================================
function genererCatalogue(onglet) {
  if (!catalog) return;
  catalog.innerHTML = "";
  fermerPanneauDetails();
  catalog.className = ""; 

  const heroBanner = document.getElementById('heroBanner');
  const termeRecherche = searchBar ? searchBar.value.trim().toLowerCase() : '';
  const rechercheEnCours = termeRecherche !== '';

  if (rechercheEnCours && heroBanner) {
    heroBanner.style.display = 'none';
  }

  const genresDisponibles = [...new Set(listeFilms.map(i => i.auteur).concat(listeFilms.map(i => i.genre)).filter(Boolean))];

  if (rechercheEnCours) {
    if (pageTitle) pageTitle.textContent = "Résultats de recherche";
    catalog.classList.add('grid-mode');

    const resultatsRecherche = listeFilms.filter(item => {
      const estVideoOuFilm = item.type === 'film' || typesYoutube.includes(item.type);
      if (!estVideoOuFilm) return false;

      const correspondanceTitre = item.titre ? item.titre.toLowerCase().includes(termeRecherche) : false;
      const correspondanceAuteur = item.auteur ? item.auteur.toLowerCase().includes(termeRecherche) : false;

      return correspondanceTitre || correspondanceAuteur;
    });

    const listesFiltrees = filtrerEtTrier(resultatsRecherche);

    if (listesFiltrees.length === 0) {
      catalog.innerHTML = "<p class='empty-msg'>Aucun film ou vidéo ne correspond à votre recherche.</p>";
      return;
    }

    creerCartesHTMLInContainer(listesFiltrees, catalog);
    return;
  }

  if (onglet === 'accueil') {
    if (pageTitle) pageTitle.textContent = "Accueil";
    mettreAJourHeroBanner();

    const films = listeFilms.filter(f => f.type === 'film');

    const categories = [
      { titre: "Films", liste: films }
    ];

    typesYoutube.forEach(typeKey => {
      const contenuFiltrer = listeFilms.filter(f => f.type === typeKey);
      const labelTitre = sousCategoriesLibelles[typeKey] || typeKey.charAt(0).toUpperCase() + typeKey.slice(1);
      categories.push({ titre: labelTitre, liste: contenuFiltrer });
    });

    const totalElements = categories.reduce((sum, cat) => sum + cat.liste.length, 0);
    if (totalElements === 0) {
      catalog.innerHTML = "<p class='empty-msg'>Aucun contenu disponible pour le moment.</p>";
      return;
    }

    categories.forEach(cat => {
      if (cat.liste.length > 0) {
        const section = document.createElement('section');
        section.className = 'category-row';
        section.innerHTML = `<h2 class="category-row-title">${cat.titre}</h2>`;
        
        const flexContainer = document.createElement('div');
        flexContainer.className = 'category-flex-container';
        
        creerCartesHTMLInContainer(cat.liste, flexContainer);
        section.appendChild(flexContainer);

        const btnLeft = document.createElement('button');
        btnLeft.className = 'carousel-arrow left';
        btnLeft.innerHTML = '‹';
        btnLeft.onclick = () => {
          flexContainer.scrollBy({ left: -flexContainer.clientWidth * 0.75, behavior: 'smooth' });
        };

        const btnRight = document.createElement('button');
        btnRight.className = 'carousel-arrow right';
        btnRight.innerHTML = '›';
        btnRight.onclick = () => {
          flexContainer.scrollBy({ left: flexContainer.clientWidth * 0.75, behavior: 'smooth' });
        };

        section.appendChild(btnLeft);
        section.appendChild(btnRight);

        catalog.appendChild(section);
      }
    });

    return;
  }

  if (heroBanner) heroBanner.style.display = 'none';
  if (heroTimer) clearTimeout(heroTimer);

  injecterBarreFiltres(catalog, genresDisponibles);

  if (onglet === 'film') {
    if (pageTitle) pageTitle.textContent = "Films (.mp4)";
    
    const filmsFiltres = filtrerEtTrier(listeFilms.filter(f => f.type === 'film'));

    if (filmsFiltres.length === 0) {
      catalog.innerHTML += "<p class='empty-msg'>Aucun film correspondant.</p>";
      return;
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-film-mode';
    creerCartesHTMLInContainer(filmsFiltres, gridContainer);
    catalog.appendChild(gridContainer);
    return;
  } 

  if (onglet === 'video') {
    if (pageTitle) pageTitle.textContent = "Vidéos YouTube";
    
    const youtubeFiltres = filtrerEtTrier(listeFilms.filter(f => typesYoutube.includes(f.type)));

    if (youtubeFiltres.length === 0) {
      catalog.innerHTML += "<p class='empty-msg'>Aucune vidéo YouTube correspondante.</p>";
      return;
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-mode';
    creerCartesHTMLInContainer(youtubeFiltres, gridContainer);
    catalog.appendChild(gridContainer);
    return;
  } 

  if (onglet === 'musique') {
    if (pageTitle) pageTitle.textContent = "Musiques & Playlists";
    const musiquesFiltrees = filtrerEtTrier(listeFilms.filter(f => f.type === 'musique'));

    const plSection = document.createElement('div');
    plSection.innerHTML = `
      <div class="playlists-header">
        <h3>Mes Playlists</h3>
        <button class="btn-create-playlist" id="btnCreerPlaylist">+ Créer une playlist</button>
      </div>
      <div class="playlists-grid" id="playlistsContainer"></div>
      <h3 style="margin-bottom: 15px; font-size: 1.2rem;">Titres ajoutés</h3>
      <div class="playlist-mode" id="musicListContainer"></div>
    `;
    catalog.appendChild(plSection);

    const plContainer = document.getElementById('playlistsContainer');
    if (mesPlaylists.length === 0) {
      plContainer.innerHTML = "<p class='empty-msg' style='grid-column: 1/-1;'>Aucune playlist créée.</p>";
    } else {
      mesPlaylists.forEach((pl, index) => {
        const div = document.createElement('div');
        div.className = "playlist-card-top";
        div.innerHTML = `
          <img src="${pl.affiche || 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=200'}" alt="${pl.titre}">
          <span class="pl-title" style="flex: 1;">${pl.titre} (${pl.titresIds ? pl.titresIds.length : 0})</span>
          <button class="btn-play-pl" title="Lancer la playlist" style="background: transparent; border: none; color: #1ed760; font-size: 1.2rem; cursor: pointer; margin-right: 8px;">▶</button>
          <button class="btn-delete-pl" title="Supprimer la playlist" style="background: transparent; border: none; color: #e50914; font-size: 1rem; cursor: pointer;">🗑</button>
        `;

        div.querySelector('.btn-play-pl').addEventListener('click', (e) => {
          e.stopPropagation();
          jouerPlaylist(pl);
        });

        div.querySelector('.btn-delete-pl').addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`Voulez-vous vraiment supprimer la playlist "${pl.titre}" ?`)) {
            mesPlaylists.splice(index, 1);
            localStorage.setItem('mesPlaylistsMusic', JSON.stringify(mesPlaylists));
            genererCatalogue('musique');
          }
        });

        plContainer.appendChild(div);
      });
    }

    const btnCreerPl = document.getElementById('btnCreerPlaylist');
    if (btnCreerPl) btnCreerPl.addEventListener('click', creerNouvellePlaylist);

    const container = document.getElementById('musicListContainer');
    if (musiquesFiltrees.length === 0) {
      container.innerHTML = "<p class='empty-msg'>Aucune musique disponible.</p>";
      return;
    }
    creerListeMusiqueHTMLInContainer(musiquesFiltrees, container);
    return;
  } 

  if (onglet === 'maliste') {
    const baseListe = listeFilms.filter(f => maListe.includes(f.id));
    const listesFiltrees = filtrerEtTrier(baseListe);

    if (pageTitle) pageTitle.textContent = "Ma liste";
    if (listesFiltrees.length === 0) {
      catalog.innerHTML += "<p class='empty-msg'>Aucun contenu trouvé dans votre liste.</p>";
      return;
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-mode';
    creerCartesHTMLInContainer(listesFiltrees, gridContainer);
    catalog.appendChild(gridContainer);
    return;
  }
}

function creerCartesHTMLInContainer(films, container) {
  films.forEach(film => {
    const card = document.createElement('div');
    card.className = "movie-card";

    card.innerHTML = `
      <div class="movie-poster-wrapper">
        <img src="${film.affiche}" alt="${film.titre}" class="movie-poster">
      </div>
      <div class="movie-card-info">
        <div class="movie-card-title">${film.titre}</div>
        <div class="movie-card-author">${film.auteur || ''}</div>
      </div>

      <div class="hover-card">
        <div class="hover-media-wrapper">
          <img src="${film.affiche}" alt="${film.titre}" class="hover-poster">
          ${film.fileUrl ? `<video class="hover-video" src="${film.fileUrl}" muted loop playsinline style="display:none;"></video>` : ''}
        </div>
        <div class="hover-body">
          <div class="hover-actions">
            <div class="hover-actions-left">
              <button class="btn-hover-play btn-play-trigger">▶ Jouer</button>
              <button class="btn-hover-circle btn-like-trigger" title="J'aime">👍</button>
            </div>
            <button class="btn-hover-circle btn-info-trigger" title="Plus d'infos">▼</button>
          </div>
          <div class="hover-tags">
            <span class="hover-badge">${film.pegi || 'TOUS PUBLICS'}</span>
            <span style="color:#46d369; font-weight:bold;">98% match</span>
          </div>
          <div class="hover-meta-row">
            <span>${film.titre}</span>
            <span class="hover-bullet">•</span>
            <span>${film.auteur || 'Artiste'}</span>
          </div>
        </div>
      </div>
    `;

    const hoverVideo = card.querySelector('.hover-video');
    const hoverPoster = card.querySelector('.hover-poster');
    let localHoverTimer = null;

    card.addEventListener('mouseenter', () => {
      if (hoverVideo) {
        localHoverTimer = setTimeout(() => {
          hoverVideo.style.display = 'block';
          if (hoverPoster) hoverPoster.style.display = 'none';
          hoverVideo.play().catch(() => {});
        }, 400);
      }
    });

    card.addEventListener('mouseleave', () => {
      if (localHoverTimer) clearTimeout(localHoverTimer);
      if (hoverVideo) {
        hoverVideo.pause();
        hoverVideo.currentTime = 0;
        hoverVideo.style.display = 'none';
        if (hoverPoster) hoverPoster.style.display = 'block';
      }
    });

    const btnPlay = card.querySelector('.btn-play-trigger');
    const btnInfo = card.querySelector('.btn-info-trigger');

    if (btnPlay) {
      btnPlay.addEventListener('click', (e) => {
        e.stopPropagation();
        openPlayer(film, films);
      });
    }

    if (btnInfo) {
      btnInfo.addEventListener('click', (e) => {
        e.stopPropagation();
        ouvrirPanneauDetails(film);
      });
    }

    card.addEventListener('click', () => openPlayer(film, films));
    container.appendChild(card);
  });
}

function creerListeMusiqueHTMLInContainer(musiques, container) {
  musiques.forEach((musique, index) => {
    const row = document.createElement('div');
    row.className = "track-row";
    row.innerHTML = `
      <div class="track-index">${index + 1}</div>
      <img src="${musique.affiche}" alt="Pochette" class="track-cover">
      <div class="track-infos">
        <div class="track-title">${musique.titre}</div>
        <div class="track-artist">${musique.auteur || "Artiste Inconnu"}</div>
      </div>
      <div class="track-actions">
        <button class="track-play-btn">Écouter</button>
        <button class="track-info-btn" title="Plus d'infos">ℹ</button>
      </div>
    `;
    row.querySelector('.track-play-btn').addEventListener('click', (e) => { e.stopPropagation(); openPlayer(musique, musiques); });
    row.querySelector('.track-info-btn').addEventListener('click', (e) => { e.stopPropagation(); ouvrirPanneauDetails(musique); });
    row.addEventListener('click', () => openPlayer(musique, musiques));
    container.appendChild(row);
  });
}

// ==========================================================================
// 6. GESTION DES PLAYLISTS ET DU LECTEUR
// ==========================================================================
function creerNouvellePlaylist() {
  const nom = prompt("Nom de la nouvelle playlist :");
  if (nom && nom.trim() !== "") {
    const nouvellePlaylist = {
      id: Date.now(),
      titre: nom.trim(),
      titresIds: [],
      affiche: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=200"
    };
    mesPlaylists.push(nouvellePlaylist);
    localStorage.setItem('mesPlaylistsMusic', JSON.stringify(mesPlaylists));
    genererCatalogue('musique');
  }
}

function jouerPlaylist(playlist) {
  if (!playlist.titresIds || playlist.titresIds.length === 0) {
    alert("Cette playlist est vide !");
    return;
  }
  const musiquesDeLaPlaylist = listeFilms.filter(item => playlist.titresIds.includes(item.id));
  if (musiquesDeLaPlaylist.length > 0) {
    openPlayer(musiquesDeLaPlaylist[0], musiquesDeLaPlaylist);
  }
}

function openPlayer(film, contexteListe = []) {
  if (typesYoutube.includes(film.type)) {
    if (playerModal && youtubeVideoPlayer) {
      playerModal.style.display = 'flex';
      document.body.style.overflow = "hidden";
      if (localVideoPlayer) localVideoPlayer.style.display = 'none';
      youtubeVideoPlayer.style.display = 'block';
      
      const currentOrigin = window.location.origin !== 'null' ? window.location.origin : '*';
      youtubeVideoPlayer.src = `https://www.youtube.com/embed/${film.youtubeId}?autoplay=1&origin=${encodeURIComponent(currentOrigin)}`;
    }
    return;
  }

  if (film.type === 'musique') {
    playlistMusiqueEnCours = contexteListe.filter(f => f.type === 'musique');
    indexMusiqueActive = playlistMusiqueEnCours.findIndex(m => m.id === film.id);
    if (localVideoPlayer) localVideoPlayer.pause();
    chargerEtJouerMusique(film);
    return;
  }

  if (film.type === 'film') {
    if (localAudioPlayer) { localAudioPlayer.pause(); if (audioBtnPlayPause) audioBtnPlayPause.textContent = "▶"; }
    if (playerModal && localVideoPlayer) {
      playerModal.style.display = 'flex';
      document.body.style.overflow = "hidden";
      if (youtubeVideoPlayer) youtubeVideoPlayer.style.display = 'none';
      localVideoPlayer.style.display = 'block';
      localVideoPlayer.src = film.fileUrl;
      localVideoPlayer.load();
      localVideoPlayer.play().catch(() => {});
    }
  }
}

function chargerEtJouerMusique(musique) {
  if (!musique || !localAudioPlayer) return;
  localAudioPlayer.src = musique.fileUrl;
  
  if (audioPlayerCover) audioPlayerCover.src = musique.affiche;
  if (audioPlayerTitle) audioPlayerTitle.textContent = musique.titre;
  if (audioPlayerArtist) audioPlayerArtist.textContent = musique.auteur || "Artiste Inconnu";

  afficherEtRemplirPanneauDroit(musique);

  if (persistentAudioPlayer) persistentAudioPlayer.style.display = 'flex';
  localAudioPlayer.load();
  localAudioPlayer.play()
    .then(() => { if (audioBtnPlayPause) audioBtnPlayPause.textContent = "⏸"; })
    .catch(() => { if (audioBtnPlayPause) audioBtnPlayPause.textContent = "▶"; });
}

function afficherEtRemplirPanneauDroit(musique) {
  const rightPanel = document.getElementById('rightMusicPanel');
  if (rightPanel) {
    rightPanel.style.display = 'flex';
    document.body.classList.add('music-playing');

    const rightCover = document.getElementById('rightPanelCover');
    const rightTitle = document.getElementById('rightPanelTitle');
    const rightArtist = document.getElementById('rightPanelArtist');
    const rightArtistName = document.getElementById('rightPanelArtistName');
    const rightArtistPhoto = document.getElementById('rightPanelArtistPhoto');

    if (rightCover) rightCover.src = musique.affiche;
    if (rightTitle) rightTitle.textContent = musique.titre;
    if (rightArtist) rightArtist.textContent = musique.auteur || "Artiste Inconnu";
    if (rightArtistName) rightArtistName.textContent = musique.auteur || "Artiste Inconnu";
    if (rightArtistPhoto) rightArtistPhoto.src = musique.affiche;
  }
}

function fermerPanneauDetails() {
  if (detailsPanelContainer) detailsPanelContainer.style.display = "none";
  filmSelectionneDetails = null;
  document.body.style.overflow = "";
}

function ouvrirPanneauDetails(film) {
  filmSelectionneDetails = film;
  if (detailsTitle) detailsTitle.textContent = film.titre;
  if (detailsType) detailsType.textContent = traduireType(film.type);
  if (detailsAuthor) detailsAuthor.textContent = film.auteur || "";
  if (detailsDate) detailsDate.textContent = film.dateSortie || new Date().getFullYear().toString();
  if (detailsDuration) detailsDuration.textContent = formaterDuree(film.duree);
  if (detailsDescription) detailsDescription.textContent = film.description || "Aucune description disponible.";
  
  if (detailsPanel && film.affiche) {
    detailsPanel.style.backgroundImage = `url('${film.affiche}')`;
  } else if (detailsPanel) {
    detailsPanel.style.backgroundImage = 'none';
  }

  const detailsPlayBtn   = document.getElementById('detailsPlayBtn');
  const detailsAddBtn    = document.getElementById('detailsAddBtn');
  const detailsDeleteBtn = document.getElementById('detailsDeleteBtn');

  if (detailsAddBtn) {
    const estDansMaListe = maListe.includes(film.id);
    detailsAddBtn.textContent = estDansMaListe ? "✓ Dans ma liste" : "+ Ma Liste";

    detailsAddBtn.onclick = () => {
      const idx = maListe.indexOf(film.id);
      if (idx > -1) {
        maListe.splice(idx, 1);
        detailsAddBtn.textContent = "+ Ma Liste";
      } else {
        maListe.push(film.id);
        detailsAddBtn.textContent = "✓ Dans ma liste";
      }
      localStorage.setItem('maListeNetflix', JSON.stringify(maListe));
    };
  }

  if (detailsPlayBtn) {
    detailsPlayBtn.onclick = () => {
      fermerPanneauDetails();
      openPlayer(film, listeFilms);
    };
  }

  if (detailsDeleteBtn) {
    detailsDeleteBtn.onclick = () => {
      if (confirm(`Voulez-vous vraiment supprimer "${film.titre}" ?`)) {
        listeFilms = listeFilms.filter(item => item.id !== film.id);
        localStorage.setItem('mesVideosNetflix', JSON.stringify(listeFilms));
        
        maListe = maListe.filter(id => id !== film.id);
        localStorage.setItem('maListeNetflix', JSON.stringify(maListe));

        fermerPanneauDetails();
        genererCatalogue(obtenirOngletActif());
      }
    };
  }

  if (detailsPanelContainer) detailsPanelContainer.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function changerOngletActif(boutonClique) {
  [btnAccueil, btnFilms, btnVideos, btnMusiques, btnMaListe].forEach(b => {
    if (b) b.classList.remove('active');
  });
  if (boutonClique) boutonClique.classList.add('active');
  filtreGenreActif = 'tous';
  if (searchBar) searchBar.value = ""; 
}

// ==========================================================================
// 7. ÉVÉNEMENTS GÉNÉRAUX & LECTEUR VIDÉO / AUDIO
// ==========================================================================
if (btnAccueil)  btnAccueil.addEventListener('click',  () => { changerOngletActif(btnAccueil);  genererCatalogue('accueil'); });
if (btnFilms)    btnFilms.addEventListener('click',    () => { changerOngletActif(btnFilms);    genererCatalogue('film'); });
if (btnVideos)   btnVideos.addEventListener('click',   () => { changerOngletActif(btnVideos);   genererCatalogue('video'); });
if (btnMusiques) btnMusiques.addEventListener('click', () => { changerOngletActif(btnMusiques); genererCatalogue('musique'); });
if (btnMaListe)  btnMaListe.addEventListener('click',  () => { changerOngletActif(btnMaListe);  genererCatalogue('maliste'); });

if (notificationBtn) {
  notificationBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (notifDropdown) notifDropdown.classList.toggle('active');
  });
}

document.addEventListener('click', (e) => {
  if (notifDropdown && !notifDropdown.contains(e.target) && notificationBtn && !notificationBtn.contains(e.target)) {
    notifDropdown.classList.remove('active');
  }
});

if (searchBar) {
  searchBar.addEventListener('input', () => {
    genererCatalogue(obtenirOngletActif());
  });
}

if (audioBtnPlayPause) {
  audioBtnPlayPause.addEventListener('click', () => {
    if (!localAudioPlayer || !localAudioPlayer.src) return;
    if (localAudioPlayer.paused) { 
      localAudioPlayer.play(); 
      audioBtnPlayPause.textContent = "⏸"; 
    } else { 
      localAudioPlayer.pause(); 
      audioBtnPlayPause.textContent = "▶"; 
    }
  });
}

if (audioBtnNext) {
  audioBtnNext.addEventListener('click', () => {
    if (playlistMusiqueEnCours.length > 0 && indexMusiqueActive < playlistMusiqueEnCours.length - 1) {
      indexMusiqueActive++;
      chargerEtJouerMusique(playlistMusiqueEnCours[indexMusiqueActive]);
    }
  });
}

if (audioBtnPrev) {
  audioBtnPrev.addEventListener('click', () => {
    if (playlistMusiqueEnCours.length > 0 && indexMusiqueActive > 0) {
      indexMusiqueActive--;
      chargerEtJouerMusique(playlistMusiqueEnCours[indexMusiqueActive]);
    }
  });
}

if (localAudioPlayer) {
  localAudioPlayer.addEventListener('timeupdate', () => {
    const cur = localAudioPlayer.currentTime;
    const dur = localAudioPlayer.duration;
    if (audioCurrentTime) audioCurrentTime.textContent = formaterTemps(cur);
    if (audioDuration && !isNaN(dur)) audioDuration.textContent = formaterTemps(dur);
    if (progressBar && dur) progressBar.style.width = `${(cur / dur) * 100}%`;
  });

  localAudioPlayer.addEventListener('ended', () => {
    if (playlistMusiqueEnCours.length > 0 && indexMusiqueActive < playlistMusiqueEnCours.length - 1) {
      indexMusiqueActive++;
      chargerEtJouerMusique(playlistMusiqueEnCours[indexMusiqueActive]);
    } else {
      if (audioBtnPlayPause) audioBtnPlayPause.textContent = "▶";
    }
  });
}

if (progressContainer) {
  progressContainer.addEventListener('click', (e) => {
    if (!localAudioPlayer || !localAudioPlayer.duration) return;
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    localAudioPlayer.currentTime = pos * localAudioPlayer.duration;
  });
}

if (volumeContainer) {
  volumeContainer.addEventListener('click', (e) => {
    if (!localAudioPlayer) return;
    const rect = volumeContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const volume = Math.max(0, Math.min(1, pos));
    localAudioPlayer.volume = volume;
    if (volumeBar) volumeBar.style.width = `${volume * 100}%`;
  });
}

if (closeAudioBar) {
  closeAudioBar.addEventListener('click', () => {
    if (localAudioPlayer) localAudioPlayer.pause();
    if (persistentAudioPlayer) persistentAudioPlayer.style.display = 'none';
    const rightPanel = document.getElementById('rightMusicPanel');
    if (rightPanel) rightPanel.style.display = 'none';
    document.body.classList.remove('music-playing');
  });
}

const closePlayerBtn = document.getElementById('closePlayerBtn');
if (closePlayerBtn) {
  closePlayerBtn.addEventListener('click', () => {
    if (localVideoPlayer) { localVideoPlayer.pause(); localVideoPlayer.src = ""; }
    if (youtubeVideoPlayer) { youtubeVideoPlayer.src = ""; }
    if (playerModal) playerModal.style.display = 'none';
    document.body.style.overflow = "";
  });
}

if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', fermerPanneauDetails);

if (detailsPanelContainer) {
  detailsPanelContainer.addEventListener('click', (e) => {
    if (e.target === detailsPanelContainer) fermerPanneauDetails();
  });
}

// ==========================================================================
// 8. LOGIQUE D'AJOUT DE CONTENU DYNAMIQUE & FORMULAIRE
// ==========================================================================
if (btnOuvrirAjout) btnOuvrirAjout.onclick = () => { if (addVideoModal) addVideoModal.style.display = 'flex'; };
if (closeAjoutBtn) closeAjoutBtn.onclick = () => { if (addVideoModal) addVideoModal.style.display = 'none'; };

if (selectVideoType) {
  selectVideoType.addEventListener('change', (e) => {
    const val = e.target.value;
    const groupAffiche = document.getElementById('groupAffiche');
    const groupMusicSource = document.getElementById('groupMusicSource');
    const musicSourceType = document.getElementById('musicSourceType');
    const customCategoryContainer = document.getElementById('customCategoryContainer');

    if (customCategoryContainer) customCategoryContainer.style.display = 'none';

    if (val === 'film') {
      if (groupYoutubeUrl) groupYoutubeUrl.style.display = 'none';
      if (groupFileUrl) groupFileUrl.style.display = 'flex';
      if (groupSubCategory) groupSubCategory.style.display = 'none';
      if (groupMusicSource) groupMusicSource.style.display = 'none';
      if (groupAffiche) groupAffiche.style.display = 'block';
      const lblFile = document.getElementById('labelFileUrl');
      if (lblFile) lblFile.textContent = "Lien du fichier vidéo (.mp4) :";
    } else if (val === 'video') {
      if (groupYoutubeUrl) groupYoutubeUrl.style.display = 'flex';
      if (groupFileUrl) groupFileUrl.style.display = 'none';
      if (groupSubCategory) groupSubCategory.style.display = 'block';
      if (groupMusicSource) groupMusicSource.style.display = 'none';
      if (groupAffiche) groupAffiche.style.display = 'block';
    } else if (val === 'musique') {
      if (groupSubCategory) groupSubCategory.style.display = 'none';
      if (groupMusicSource) groupMusicSource.style.display = 'flex';
      if (groupAffiche) groupAffiche.style.display = 'block';

      const sourceVal = musicSourceType ? musicSourceType.value : 'file';
      if (sourceVal === 'youtube') {
        if (groupYoutubeUrl) groupYoutubeUrl.style.display = 'flex';
        if (groupFileUrl) groupFileUrl.style.display = 'none';
      } else {
        if (groupYoutubeUrl) groupYoutubeUrl.style.display = 'none';
        if (groupFileUrl) groupFileUrl.style.display = 'flex';
        const lblFile = document.getElementById('labelFileUrl');
        if (lblFile) lblFile.textContent = "Fichier MP3 / Lien direct :";
      }
    }
  });
}

const musicSourceType = document.getElementById('musicSourceType');
if (musicSourceType) {
  musicSourceType.addEventListener('change', (e) => {
    if (selectVideoType && selectVideoType.value === 'musique') {
      if (e.target.value === 'youtube') {
        if (groupYoutubeUrl) groupYoutubeUrl.style.display = 'flex';
        if (groupFileUrl) groupFileUrl.style.display = 'none';
      } else {
        if (groupYoutubeUrl) groupYoutubeUrl.style.display = 'none';
        if (groupFileUrl) groupFileUrl.style.display = 'flex';
        const lblFile = document.getElementById('labelFileUrl');
        if (lblFile) lblFile.textContent = "Fichier MP3 / Lien direct :";
      }
    }
  });
}

const btnAjouterCategorie = document.getElementById('btnAjouterCategorie');
const btnValiderCategorie = document.getElementById('btnValiderCategorie');
const customCategoryContainer = document.getElementById('customCategoryContainer');
const newCategoryInput = document.getElementById('newCategoryInput');
const videoSubCategorySelect = document.getElementById('videoSubCategory');

if (btnAjouterCategorie && customCategoryContainer) {
  btnAjouterCategorie.addEventListener('click', () => {
    const isHidden = customCategoryContainer.style.display === 'none';
    customCategoryContainer.style.display = isHidden ? 'flex' : 'none';
    if (isHidden && newCategoryInput) newCategoryInput.focus();
  });
}

if (btnValiderCategorie) {
  btnValiderCategorie.addEventListener('click', () => {
    if (!newCategoryInput) return;
    const val = newCategoryInput.value.trim();
    if (val !== "") {
      const slug = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (!typesYoutube.includes(slug)) {
        typesYoutube.push(slug);
        sousCategoriesLibelles[slug] = val;

        if (videoSubCategorySelect) {
          const newOption = document.createElement('option');
          newOption.value = slug;
          newOption.textContent = val;
          videoSubCategorySelect.appendChild(newOption);
          videoSubCategorySelect.value = slug;
        }
      }
      newCategoryInput.value = "";
      if (customCategoryContainer) customCategoryContainer.style.display = 'none';
    }
  });
}

if (btnSystemPicker && systemFilePicker) {
  btnSystemPicker.onclick = () => systemFilePicker.click();
  systemFilePicker.onchange = (e) => {
    const file = e.target.files[0];
    if (file && videoFileUrl) videoFileUrl.value = URL.createObjectURL(file);
  };
}

if (formAjoutVideo) {
  formAjoutVideo.addEventListener('submit', (e) => {
    e.preventDefault();

    const selectedTypeMain = selectVideoType ? selectVideoType.value : 'film';
    const isYoutube = selectedTypeMain === 'video';
    const isMusique = selectedTypeMain === 'musique';

    let finalType = selectedTypeMain;
    if (isYoutube && videoSubCategorySelect) {
      finalType = videoSubCategorySelect.value;
    }

    const titreInput       = document.getElementById('videoTitle') ? document.getElementById('videoTitle').value : '';
    const authorInput      = document.getElementById('videoAuthor') ? document.getElementById('videoAuthor').value : '';
    const durationInput    = document.getElementById('videoDuration') ? (parseInt(document.getElementById('videoDuration').value) || 0) : 0;
    const descriptionInput = document.getElementById('videoDescription') ? document.getElementById('videoDescription').value : '';
    const afficheInput     = document.getElementById('videoAffiche') ? document.getElementById('videoAffiche').value : '';
    const videoUrlInput    = document.getElementById('videoUrl') ? document.getElementById('videoUrl').value : '';
    const fileUrlInput     = videoFileUrl ? videoFileUrl.value : '';

    let youtubeId = "";
    if ((isYoutube || (isMusique && musicSourceType && musicSourceType.value === 'youtube')) && videoUrlInput) {
      const match = videoUrlInput.match(/(?:v=|\/embed\/|\/1\/|\/v\/|https:\/\/youtu\.be\/|\/e\/|watch\?v=|&v=)([^#&?]*)/);
      if (match && match[1].length === 11) youtubeId = match[1];
    }

    const nouveauContenu = {
      id: Date.now(),
      titre: titreInput,
      auteur: authorInput || (isMusique ? "Artiste Inconnu" : "Créateur Inconnu"),
      type: finalType,
      duree: durationInput,
      description: descriptionInput,
      affiche: afficheInput || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800',
      fileUrl: fileUrlInput,
      youtubeId: youtubeId,
      dateSortie: new Date().getFullYear().toString()
    };

    listeFilms.unshift(nouveauContenu);
    localStorage.setItem('mesVideosNetflix', JSON.stringify(listeFilms));

    afficherNotification(nouveauContenu.titre, nouveauContenu.type, nouveauContenu.affiche, nouveauContenu.id);

    formAjoutVideo.reset();
    if (addVideoModal) addVideoModal.style.display = 'none';

    if (customCategoryContainer) customCategoryContainer.style.display = 'none';

    genererCatalogue(obtenirOngletActif());
  });
}

// ==========================================================================
// 9. LOGIQUE DU BLOC-NOTES
// ==========================================================================
let mesNotes = JSON.parse(localStorage.getItem('mesNotesApp')) || [];
let noteEnCoursId = null;

const btnNotes           = document.getElementById('btnNotes');
const notesDrawer        = document.getElementById('notesDrawer');
const closeNotesBtn      = document.getElementById('closeNotesBtn');
const btnNewNote         = document.getElementById('btnNewNote');
const notesListContainer = document.getElementById('notesListContainer');

const noteEditor       = document.getElementById('noteEditor');
const noteTitleInput   = document.getElementById('noteTitleInput');
const noteContentInput = document.getElementById('noteContentInput');
const btnSaveNote      = document.getElementById('btnSaveNote');
const btnBackToList    = document.getElementById('btnBackToList');

if (btnNotes) {
  btnNotes.addEventListener('click', () => {
    if (notesDrawer) {
      const isVisible = notesDrawer.classList.contains('active');
      if (isVisible) {
        notesDrawer.classList.remove('active');
      } else {
        notesDrawer.classList.add('active');
        afficherNotes();
      }
    }
  });
}

if (closeNotesBtn) {
  closeNotesBtn.addEventListener('click', () => {
    if (notesDrawer) notesDrawer.classList.remove('active');
    fermerEditeurNote();
  });
}

function afficherNotes() {
  if (!notesListContainer) return;
  notesListContainer.innerHTML = '';

  if (mesNotes.length === 0) {
    notesListContainer.innerHTML = '<p class="empty-msg" style="text-align:center; padding: 20px; color: #888;">Aucun document enregistré.</p>';
    return;
  }

  mesNotes.forEach(note => {
    const item = document.createElement('div');
    item.className = 'note-item';
    item.innerHTML = `
      <div class="note-item-content">
        <div class="note-item-title">${note.titre || 'Document sans titre'}</div>
        <div class="note-item-snippet">${note.contenu || 'Document vide...'}</div>
      </div>
      <button class="btn-delete-note" title="Supprimer">🗑</button>
    `;

    item.querySelector('.note-item-content').addEventListener('click', () => ouvrirEditeurNote(note));
    item.querySelector('.btn-delete-note').addEventListener('click', (e) => {
      e.stopPropagation();
      supprimerNote(note.id);
    });

    notesListContainer.appendChild(item);
  });
}

function ouvrirEditeurNote(note = null) {
  if (!noteEditor) return;
  if (note) {
    noteEnCoursId = note.id;
    if (noteTitleInput) noteTitleInput.value = note.titre;
    if (noteContentInput) noteContentInput.value = note.contenu;
  } else {
    noteEnCoursId = null;
    if (noteTitleInput) noteTitleInput.value = '';
    if (noteContentInput) noteContentInput.value = '';
  }
  noteEditor.classList.add('active');
  if (noteTitleInput) noteTitleInput.focus();
}

function fermerEditeurNote() {
  if (noteEditor) noteEditor.classList.remove('active');
  noteEnCoursId = null;
}

function supprimerNote(id) {
  mesNotes = mesNotes.filter(n => n.id !== id);
  localStorage.setItem('mesNotesApp', JSON.stringify(mesNotes));
  afficherNotes();
}

if (btnNewNote) btnNewNote.addEventListener('click', () => ouvrirEditeurNote());
if (btnBackToList) btnBackToList.addEventListener('click', fermerEditeurNote);

if (btnSaveNote) {
  btnSaveNote.addEventListener('click', () => {
    const titre = noteTitleInput ? noteTitleInput.value.trim() : '';
    const contenu = noteContentInput ? noteContentInput.value.trim() : '';

    if (!titre && !contenu) {
      fermerEditeurNote();
      return;
    }

    if (noteEnCoursId) {
      const idx = mesNotes.findIndex(n => n.id === noteEnCoursId);
      if (idx !== -1) {
        mesNotes[idx].titre = titre || 'Document sans titre';
        mesNotes[idx].contenu = contenu;
      }
    } else {
      mesNotes.unshift({
        id: Date.now(),
        titre: titre || 'Document sans titre',
        contenu: contenu,
        date: new Date().toLocaleDateString()
      });
    }

    localStorage.setItem('mesNotesApp', JSON.stringify(mesNotes));
    fermerEditeurNote();
    afficherNotes();
  });
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
  mettreAJourNotificationsUI();
  genererCatalogue('accueil');
});