let tournamentData = null;
let isAuthenticated = false;

// On page load
document.addEventListener('DOMContentLoaded', async () => {
  // Check if password is in URL
  const params = new URLSearchParams(window.location.search);
  const pwd = params.get('pwd');

  if (pwd) {
    await authenticateWithPassword(pwd);
  }

  setupEventListeners();
  await loadData();

  if (!isAuthenticated) {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
  } else {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'flex';
    populateSelects();
    renderMatchesList();
  }
});

// Setup event listeners
function setupEventListeners() {
  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pwd = document.getElementById('password-input').value;
    await authenticateWithPassword(pwd);
  });

  // Logout button
  document.getElementById('logout-btn').addEventListener('click', () => {
    isAuthenticated = false;
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('password-input').value = '';
  });

  // Admin tabs
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(tabName + '-view').classList.add('active');
    });
  });

  // Form submission
  document.getElementById('update-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitFormUpdate();
  });

  // Form selects
  document.getElementById('form-category').addEventListener('change', updateFormDivisions);
  document.getElementById('form-division').addEventListener('change', updateFormMatches);

  // Visual selects
  document.getElementById('visual-category').addEventListener('change', updateVisualDivisions);
  document.getElementById('visual-division').addEventListener('change', updateVisualMatches);
  document.getElementById('visual-match').addEventListener('change', updateScoreboard);
}

// Authenticate with password
async function authenticateWithPassword(pwd) {
  try {
    const response = await fetch('api/auth.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd })
    });

    const data = await response.json();

    if (data.authenticated) {
      isAuthenticated = true;
      document.getElementById('admin-panel').style.display = 'flex';
      document.getElementById('login-screen').style.display = 'none';
      populateSelects();
      renderMatchesList();
    } else {
      showLoginError('Contrasenya incorrecta');
    }
  } catch (error) {
    // Try local validation (for development)
    const adminPwd = 'cambiar123'; // Default password
    if (pwd === adminPwd) {
      isAuthenticated = true;
      document.getElementById('admin-panel').style.display = 'flex';
      document.getElementById('login-screen').style.display = 'none';
      populateSelects();
      renderMatchesList();
    } else {
      showLoginError('Contrasenya incorrecta');
    }
  }
}

function showLoginError(message) {
  document.getElementById('login-error').textContent = message;
  setTimeout(() => {
    document.getElementById('login-error').textContent = '';
  }, 4000);
}

// Load tournament data
async function loadData() {
  try {
    const response = await fetch('data.json');
    tournamentData = await response.json();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Populate category selects
function populateSelects() {
  if (!tournamentData) return;

  const formCategory = document.getElementById('form-category');
  const visualCategory = document.getElementById('visual-category');

  formCategory.innerHTML = '<option value="">Selecciona categoria...</option>';
  visualCategory.innerHTML = '<option value="">Selecciona categoria...</option>';

  tournamentData.categories.forEach(category => {
    const opt1 = document.createElement('option');
    opt1.value = category.id;
    opt1.textContent = category.name;
    formCategory.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = category.id;
    opt2.textContent = category.name;
    visualCategory.appendChild(opt2);
  });
}

// Update division selects based on category
function updateFormDivisions() {
  const categoryId = document.getElementById('form-category').value;
  const divisionSelect = document.getElementById('form-division');

  divisionSelect.innerHTML = '<option value="">Selecciona divisió...</option>';

  if (!categoryId || !tournamentData) return;

  const category = tournamentData.categories.find(c => c.id === categoryId);
  if (!category) return;

  category.divisions.forEach(division => {
    const opt = document.createElement('option');
    opt.value = division.id;
    opt.textContent = division.name;
    divisionSelect.appendChild(opt);
  });
}

function updateVisualDivisions() {
  const categoryId = document.getElementById('visual-category').value;
  const divisionSelect = document.getElementById('visual-division');

  divisionSelect.innerHTML = '<option value="">Selecciona divisió...</option>';

  if (!categoryId || !tournamentData) return;

  const category = tournamentData.categories.find(c => c.id === categoryId);
  if (!category) return;

  category.divisions.forEach(division => {
    const opt = document.createElement('option');
    opt.value = division.id;
    opt.textContent = division.name;
    divisionSelect.appendChild(opt);
  });
}

// Update match selects based on division
function updateFormMatches() {
  const categoryId = document.getElementById('form-category').value;
  const divisionId = document.getElementById('form-division').value;
  const matchSelect = document.getElementById('form-match');

  matchSelect.innerHTML = '<option value="">Selecciona partit...</option>';

  if (!categoryId || !divisionId || !tournamentData) return;

  const category = tournamentData.categories.find(c => c.id === categoryId);
  const division = category?.divisions.find(d => d.id === divisionId);

  if (!division) return;

  division.matches.forEach(match => {
    const opt = document.createElement('option');
    opt.value = match.id;
    opt.textContent = `${match.time} - ${match.home} vs ${match.away}`;
    matchSelect.appendChild(opt);
  });
}

function updateVisualMatches() {
  const categoryId = document.getElementById('visual-category').value;
  const divisionId = document.getElementById('visual-division').value;
  const matchSelect = document.getElementById('visual-match');

  matchSelect.innerHTML = '<option value="">Selecciona partit...</option>';

  if (!categoryId || !divisionId || !tournamentData) return;

  const category = tournamentData.categories.find(c => c.id === categoryId);
  const division = category?.divisions.find(d => d.id === divisionId);

  if (!division) return;

  division.matches.forEach(match => {
    const opt = document.createElement('option');
    opt.value = match.id;
    opt.textContent = `${match.time} - ${match.home} vs ${match.away}`;
    matchSelect.appendChild(opt);
  });
}

// Submit form update
async function submitFormUpdate() {
  const matchId = document.getElementById('form-match').value;
  const homeScore = parseInt(document.getElementById('form-home-score').value);
  const awayScore = parseInt(document.getElementById('form-away-score').value);
  const played = document.getElementById('form-played').checked;

  if (!matchId) {
    showMessage('form-message', 'error', 'Selecciona un partit');
    return;
  }

  try {
    const response = await fetch('api/matches.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'cambiar123',
        matchId,
        homeScore,
        awayScore,
        played
      })
    });

    const data = await response.json();

    if (data.success) {
      showMessage('form-message', 'success', 'Resultat actualitzat!');
      await loadData();
      populateSelects();
      renderMatchesList();
      setTimeout(() => {
        document.getElementById('update-form').reset();
      }, 1000);
    } else {
      showMessage('form-message', 'error', data.error || 'Error actualitzant resultat');
    }
  } catch (error) {
    showMessage('form-message', 'error', 'Error: No es pot connectar amb el servidor');
  }
}

// Update scoreboard
function updateScoreboard() {
  const matchId = document.getElementById('visual-match').value;
  const container = document.getElementById('scoreboard');

  if (!matchId) {
    container.innerHTML = '<p>Selecciona un partit per editar</p>';
    return;
  }

  const match = findMatchById(matchId);
  if (!match) {
    container.innerHTML = '<p>Partit no trobat</p>';
    return;
  }

  const homeImg = `<img src="${match.homeShield}" alt="${match.home}" class="scoreboard-team-shield" onerror="this.style.display='none'">`;
  const awayImg = `<img src="${match.awayShield}" alt="${match.away}" class="scoreboard-team-shield" onerror="this.style.display='none'">`;

  container.innerHTML = `
    <div class="scoreboard-match">
      <div class="scoreboard-team">
        ${homeImg}
        <div class="scoreboard-team-name">${match.home}</div>
      </div>

      <div class="scoreboard-score">
        <div class="scoreboard-score-display" id="visual-score">${match.homeScore} - ${match.awayScore}</div>
        <div class="scoreboard-controls">
          <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center;">
            <button class="btn-increment" onclick="incrementHome('${matchId}')">+1 Local</button>
            <span style="text-align: center; font-size: 18px; font-weight: bold;">vs</span>
            <button class="btn-increment" onclick="incrementAway('${matchId}')">+1 Visit.</button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center;">
            <button class="btn-decrement" onclick="decrementHome('${matchId}')">-1 Local</button>
            <span></span>
            <button class="btn-decrement" onclick="decrementAway('${matchId}')">-1 Visit.</button>
          </div>
          <button class="btn-save" onclick="saveVisualUpdate('${matchId}')">💾 Guardar</button>
        </div>
      </div>

      <div class="scoreboard-team">
        ${awayImg}
        <div class="scoreboard-team-name">${match.away}</div>
      </div>
    </div>
  `;
}

// Helper functions for scoreboard
let tempScores = {};

window.incrementHome = function(matchId) {
  const match = findMatchById(matchId);
  if (!match) return;
  const key = matchId + '_home';
  tempScores[key] = (tempScores[key] ?? match.homeScore) + 1;
  updateScoreDisplay(matchId);
};

window.incrementAway = function(matchId) {
  const match = findMatchById(matchId);
  if (!match) return;
  const key = matchId + '_away';
  tempScores[key] = (tempScores[key] ?? match.awayScore) + 1;
  updateScoreDisplay(matchId);
};

window.decrementHome = function(matchId) {
  const match = findMatchById(matchId);
  if (!match) return;
  const key = matchId + '_home';
  const current = tempScores[key] ?? match.homeScore;
  tempScores[key] = Math.max(0, current - 1);
  updateScoreDisplay(matchId);
};

window.decrementAway = function(matchId) {
  const match = findMatchById(matchId);
  if (!match) return;
  const key = matchId + '_away';
  const current = tempScores[key] ?? match.awayScore;
  tempScores[key] = Math.max(0, current - 1);
  updateScoreDisplay(matchId);
};

function updateScoreDisplay(matchId) {
  const match = findMatchById(matchId);
  if (!match) return;
  const home = tempScores[matchId + '_home'] ?? match.homeScore;
  const away = tempScores[matchId + '_away'] ?? match.awayScore;
  document.getElementById('visual-score').textContent = `${home} - ${away}`;
}

window.saveVisualUpdate = async function(matchId) {
  const match = findMatchById(matchId);
  if (!match) return;

  const homeScore = tempScores[matchId + '_home'] ?? match.homeScore;
  const awayScore = tempScores[matchId + '_away'] ?? match.awayScore;

  try {
    const response = await fetch('api/matches.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'cambiar123',
        matchId,
        homeScore,
        awayScore,
        played: true
      })
    });

    const data = await response.json();

    if (data.success) {
      showMessage('visual-message', 'success', 'Resultat actualitzat!');
      await loadData();
      tempScores = {};
      updateScoreboard();
      renderMatchesList();
    } else {
      showMessage('visual-message', 'error', data.error || 'Error actualitzant resultat');
    }
  } catch (error) {
    showMessage('visual-message', 'error', 'Error: No es pot connectar');
  }
};

// Find match by ID
function findMatchById(matchId) {
  if (!tournamentData) return null;

  for (const category of tournamentData.categories) {
    for (const division of category.divisions) {
      for (const match of division.matches) {
        if (match.id === matchId) {
          return match;
        }
      }
    }
  }
  return null;
}

// Render matches list
function renderMatchesList() {
  const container = document.getElementById('matches-list');
  if (!tournamentData) return;

  container.innerHTML = '';

  tournamentData.categories.forEach(category => {
    category.divisions.forEach(division => {
      division.matches.forEach(match => {
        const card = document.createElement('div');
        card.className = 'match-card';

        const statusClass = match.played ? 'played' : 'pending';
        const statusText = match.played ? '✓ Jugat' : '⏳ Pendent';

        card.innerHTML = `
          <div class="match-card-info">
            <div class="match-card-time">${match.time}</div>
            <div class="match-card-teams">${match.home} vs ${match.away}</div>
            <div class="match-card-result">${match.homeScore} - ${match.awayScore}</div>
          </div>
          <div class="match-card-status ${statusClass}">${statusText}</div>
        `;

        container.appendChild(card);
      });
    });
  });
}

// Show message
function showMessage(elementId, type, text) {
  const el = document.getElementById(elementId);
  el.textContent = text;
  el.className = `message ${type}`;

  setTimeout(() => {
    el.className = 'message';
    el.textContent = '';
  }, 4000);
}
