/* Admin panel — CH Ripollet Torneig 2026 */

let tournamentData = null;
let authToken = null;
let sbMatchId = null;
let sbHome = 0;
let sbAway = 0;
let sbPenalty = '';

// ─── Init ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupLoginForm();
  setupLogout();
  setupTabs();
  setupFormListeners();
  setupAdminNav();
});

// ─── Data ─────────────────────────────────────────────────────────────────────

async function loadData() {
  try {
    const res = await fetch(`data.json?v=${Date.now()}`);
    tournamentData = await res.json();
  } catch (e) {
    console.error('Error loading data:', e);
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function setupLoginForm() {
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const pwd = document.getElementById('pwd-input').value.trim();
    if (!pwd) return;

    const errEl = document.getElementById('login-error');
    errEl.textContent = '';

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      const data = await res.json();

      if (data.authenticated) {
        authToken = pwd;
        enterAdminPanel();
      } else {
        errEl.textContent = 'Contrasenya incorrecta';
      }
    } catch {
      errEl.textContent = 'Error de connexió';
    }
  });
}

function setupLogout() {
  document.getElementById('logout-btn').addEventListener('click', () => {
    authToken = null;
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('pwd-input').value = '';
  });
}

function enterAdminPanel() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'flex';
  populateAllSelects();
  renderMatchesStatus();
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

function setupAdminNav() {
  const nav = document.getElementById('admin-nav');
  if (!nav) return;
  nav.innerHTML = `
    <button class="admin-nav-item active" onclick="scrollToSection('admin-match-section', this)">
      📝 Actualitzar Resultats
    </button>
    <button class="admin-nav-item" onclick="scrollToSection('matches-status-section', this)">
      📋 Estat dels Partits
    </button>
  `;
}

function scrollToSection(id, btn) {
  document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function setupTabs() {
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab)?.classList.add('active');
    });
  });
}

// ─── Selects population ───────────────────────────────────────────────────────

function populateAllSelects() {
  if (!tournamentData) return;
  populateCategorySelect('f-category');
  populateCategorySelect('sb-category');
}

function populateCategorySelect(id) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecciona…</option>';
  tournamentData.categories.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.name;
    sel.appendChild(o);
  });
}

function populateDivisionSelect(catId, selId) {
  const sel = document.getElementById(selId);
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecciona…</option>';
  if (!catId || !tournamentData) return;
  const cat = tournamentData.categories.find(c => c.id === catId);
  if (!cat) return;
  cat.divisions.forEach(d => {
    const o = document.createElement('option');
    o.value = d.id;
    o.textContent = d.name;
    sel.appendChild(o);
  });
}

function populateMatchSelect(catId, divId, selId) {
  const sel = document.getElementById(selId);
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecciona…</option>';
  if (!catId || !divId || !tournamentData) return;
  const cat = tournamentData.categories.find(c => c.id === catId);
  const div = cat?.divisions.find(d => d.id === divId);
  if (!div) return;
  div.matches.forEach(m => {
    const o = document.createElement('option');
    o.value = m.id;
    o.textContent = `${m.time} · ${m.home} vs ${m.away}`;
    sel.appendChild(o);
  });
}

// ─── Form tab listeners ───────────────────────────────────────────────────────

function setupFormListeners() {
  // Form selects cascade
  document.getElementById('f-category').addEventListener('change', e => {
    populateDivisionSelect(e.target.value, 'f-division');
    document.getElementById('f-match').innerHTML = '<option value="">Selecciona…</option>';
    hideFormPreview();
  });

  document.getElementById('f-division').addEventListener('change', e => {
    const catId = document.getElementById('f-category').value;
    populateMatchSelect(catId, e.target.value, 'f-match');
    hideFormPreview();
  });

  document.getElementById('f-match').addEventListener('change', e => {
    const match = findMatchById(e.target.value);
    if (match) {
      showFormPreview(match);
      setFormScores(match);
    } else {
      hideFormPreview();
    }
  });

  // Score inputs → show/hide penalty
  document.getElementById('f-home-score').addEventListener('input', checkPenaltyVisibility);
  document.getElementById('f-away-score').addEventListener('input', checkPenaltyVisibility);

  // Form submit
  document.getElementById('update-form').addEventListener('submit', async e => {
    e.preventDefault();
    await submitFormUpdate();
  });

  // Scoreboard selects cascade
  document.getElementById('sb-category').addEventListener('change', e => {
    populateDivisionSelect(e.target.value, 'sb-division');
    document.getElementById('sb-match').innerHTML = '<option value="">Selecciona…</option>';
    resetScoreboard();
  });

  document.getElementById('sb-division').addEventListener('change', e => {
    const catId = document.getElementById('sb-category').value;
    populateMatchSelect(catId, e.target.value, 'sb-match');
    resetScoreboard();
  });

  document.getElementById('sb-match').addEventListener('change', e => {
    const match = findMatchById(e.target.value);
    if (match) renderScoreboard(match);
    else resetScoreboard();
  });
}

// ─── Form preview & penalty ───────────────────────────────────────────────────

function showFormPreview(match) {
  const el = document.getElementById('f-match-preview');
  el.style.display = 'flex';
  el.innerHTML = `
    <div class="mp-team">
      <img src="assets/escudos/${match.homeKey}.svg" alt="${match.home}" onerror="this.remove()">
      <span>${match.home}</span>
    </div>
    <span class="mp-vs">vs</span>
    <div class="mp-team">
      <img src="assets/escudos/${match.awayKey}.svg" alt="${match.away}" onerror="this.remove()">
      <span>${match.away}</span>
    </div>
  `;

  // Update penalty team labels
  document.getElementById('f-penalty-home').textContent = match.home;
  document.getElementById('f-penalty-away').textContent = match.away;
}

function hideFormPreview() {
  document.getElementById('f-match-preview').style.display = 'none';
  document.getElementById('f-penalty-section').style.display = 'none';
  document.querySelector('input[name="penalty"][value=""]').checked = true;
}

function setFormScores(match) {
  document.getElementById('f-home-score').value = match.homeScore;
  document.getElementById('f-away-score').value = match.awayScore;
  document.getElementById('f-played').checked = match.played;

  // Set penalty radio
  const pw = match.penaltyWinner || '';
  const radio = document.querySelector(`input[name="penalty"][value="${pw}"]`);
  if (radio) radio.checked = true;

  checkPenaltyVisibility();
}

function checkPenaltyVisibility() {
  const h = parseInt(document.getElementById('f-home-score').value) || 0;
  const a = parseInt(document.getElementById('f-away-score').value) || 0;
  const section = document.getElementById('f-penalty-section');

  if (h === a) {
    section.style.display = 'block';
  } else {
    section.style.display = 'none';
    document.querySelector('input[name="penalty"][value=""]').checked = true;
  }
}

// ─── Form submit ──────────────────────────────────────────────────────────────

async function submitFormUpdate() {
  const matchId = document.getElementById('f-match').value;
  if (!matchId) {
    showMsg('form-msg', 'error', 'Selecciona un partit');
    return;
  }

  const homeScore = parseInt(document.getElementById('f-home-score').value) || 0;
  const awayScore = parseInt(document.getElementById('f-away-score').value) || 0;
  const played = document.getElementById('f-played').checked;

  let penaltyWinner = null;
  if (homeScore === awayScore) {
    const radio = document.querySelector('input[name="penalty"]:checked');
    penaltyWinner = radio?.value || null;
    if (penaltyWinner === '') penaltyWinner = null;
  }

  await saveMatch({ matchId, homeScore, awayScore, played, penaltyWinner }, 'form-msg');
}

// ─── Scoreboard ───────────────────────────────────────────────────────────────

function renderScoreboard(match) {
  sbMatchId = match.id;
  sbHome = match.homeScore;
  sbAway = match.awayScore;
  sbPenalty = match.penaltyWinner || '';

  const container = document.getElementById('scoreboard-display');
  container.innerHTML = `
    <div class="sb-teams">
      <div class="sb-team">
        <img src="assets/escudos/${match.homeKey}.svg" alt="${match.home}" onerror="this.remove()">
        <div class="sb-team-name">${match.home}</div>
        <div class="sb-score-area">
          <div class="sb-score-btns">
            <button class="sb-score-btn" onclick="sbAdjust('home',-1)">−</button>
            <div class="sb-score-val" id="sb-val-home">${match.homeScore}</div>
            <button class="sb-score-btn" onclick="sbAdjust('home',+1)">+</button>
          </div>
        </div>
      </div>

      <div>
        <div class="sb-vs">VS</div>
      </div>

      <div class="sb-team">
        <img src="assets/escudos/${match.awayKey}.svg" alt="${match.away}" onerror="this.remove()">
        <div class="sb-team-name">${match.away}</div>
        <div class="sb-score-area">
          <div class="sb-score-btns">
            <button class="sb-score-btn" onclick="sbAdjust('away',-1)">−</button>
            <div class="sb-score-val" id="sb-val-away">${match.awayScore}</div>
            <button class="sb-score-btn" onclick="sbAdjust('away',+1)">+</button>
          </div>
        </div>
      </div>
    </div>

    <div id="sb-penalty-area" class="sb-penalty" style="display:${match.homeScore === match.awayScore ? 'block' : 'none'}">
      <div class="sb-penalty-label">⚡ Empat — qui guanya la directa?</div>
      <div class="sb-penalty-btns">
        <button class="sb-penalty-btn ${match.penaltyWinner === 'home' ? 'active' : ''}"
          onclick="sbSetPenalty('home','${match.home}')">${match.home}</button>
        <button class="sb-penalty-btn ${!match.penaltyWinner ? 'active' : ''}"
          onclick="sbSetPenalty('','')">Empat definitiu</button>
        <button class="sb-penalty-btn ${match.penaltyWinner === 'away' ? 'active' : ''}"
          onclick="sbSetPenalty('away','${match.away}')">${match.away}</button>
      </div>
    </div>

    <button class="sb-save-btn" onclick="sbSave()">💾 Guardar Resultat</button>
  `;
}

window.sbAdjust = function(side, delta) {
  if (side === 'home') {
    sbHome = Math.max(0, sbHome + delta);
    document.getElementById('sb-val-home').textContent = sbHome;
  } else {
    sbAway = Math.max(0, sbAway + delta);
    document.getElementById('sb-val-away').textContent = sbAway;
  }
  updateSbPenaltyVisibility();
};

window.sbSetPenalty = function(val) {
  sbPenalty = val;
  document.querySelectorAll('.sb-penalty-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
};

function updateSbPenaltyVisibility() {
  const area = document.getElementById('sb-penalty-area');
  if (!area) return;
  if (sbHome === sbAway) {
    area.style.display = 'block';
  } else {
    area.style.display = 'none';
    sbPenalty = '';
  }
}

window.sbSave = async function() {
  if (!sbMatchId) return;
  const penaltyWinner = (sbHome === sbAway && sbPenalty) ? sbPenalty : null;
  await saveMatch({
    matchId: sbMatchId,
    homeScore: sbHome,
    awayScore: sbAway,
    played: true,
    penaltyWinner
  }, 'sb-msg');
};

function resetScoreboard() {
  sbMatchId = null;
  document.getElementById('scoreboard-display').innerHTML =
    '<p class="sb-placeholder">Selecciona un partit per editar</p>';
}

// ─── API call ─────────────────────────────────────────────────────────────────

async function saveMatch(payload, msgId) {
  try {
    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: authToken, ...payload })
    });
    const data = await res.json();

    if (data.success) {
      showMsg(msgId, 'success', '✓ Resultat guardat! S\'actualitzarà en ~30 segons.');
      const notice = document.getElementById('save-notice');
      notice.style.display = 'block';
      setTimeout(() => { notice.style.display = 'none'; }, 8000);

      await loadData();
      renderMatchesStatus();

      // Refresh the scoreboard if we're on that tab
      if (sbMatchId === payload.matchId) {
        const m = findMatchById(payload.matchId);
        if (m) renderScoreboard(m);
      }
    } else {
      showMsg(msgId, 'error', data.error || 'Error desconegut');
    }
  } catch (e) {
    showMsg(msgId, 'error', 'Error de connexió amb el servidor');
  }
}

// ─── Matches status list ──────────────────────────────────────────────────────

function renderMatchesStatus() {
  const container = document.getElementById('matches-status-list');
  if (!container || !tournamentData) return;
  container.innerHTML = '';

  tournamentData.categories.forEach(cat => {
    cat.divisions.forEach(div => {
      div.matches.forEach(m => {
        const row = document.createElement('div');
        row.className = 'status-match-row';

        const penLabel = m.penaltyWinner
          ? `<span class="status-match-penalty">[D: ${m.penaltyWinner === 'home' ? m.home : m.away}]</span>`
          : '';

        row.innerHTML = `
          <span class="status-dot ${m.played ? 'played' : 'pending'}"></span>
          <span class="status-match-time">${m.time}</span>
          <span class="status-match-teams">${m.home} vs ${m.away}</span>
          ${m.played
            ? `<span class="status-match-score">${m.homeScore}–${m.awayScore}</span>${penLabel}`
            : '<span class="status-match-score" style="color:rgba(255,255,255,0.3)">–</span>'}
        `;
        container.appendChild(row);
      });
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findMatchById(id) {
  if (!tournamentData) return null;
  for (const cat of tournamentData.categories)
    for (const div of cat.divisions)
      for (const m of div.matches)
        if (m.id === id) return m;
  return null;
}

function showMsg(id, type, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `msg ${type}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}
