/* Admin panel — CH Ripollet Torneig 2026 */

let tournamentData = null;
let authToken = null;
let sbMatchId = null;
let sbHome = 0;
let sbAway = 0;
let sbPenaltyHome = null;
let sbPenaltyAway = null;

// ─── Init ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupLoginForm();
  setupLogout();
  setupSbListeners();
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
  populateCategorySelect('sb-category');
  renderMatchesStatus();
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

function setupAdminNav() {
  const nav = document.getElementById('admin-nav');
  if (!nav) return;
  nav.innerHTML = `
    <button class="admin-nav-item active" onclick="scrollToSection('admin-match-section', this)">
      🎮 Actualitzar Resultats
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

// ─── Selects ──────────────────────────────────────────────────────────────────

function populateCategorySelect(id) {
  const sel = document.getElementById(id);
  if (!sel || !tournamentData) return;
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

// ─── Scoreboard select listeners ─────────────────────────────────────────────

function setupSbListeners() {
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

// ─── Scoreboard ───────────────────────────────────────────────────────────────

function renderScoreboard(match) {
  sbMatchId = match.id;
  sbHome = match.homeScore;
  sbAway = match.awayScore;
  sbPenaltyHome = match.penaltyHomeScore ?? null;
  sbPenaltyAway = match.penaltyAwayScore ?? null;

  const isDraw = match.homeScore === match.awayScore;
  const container = document.getElementById('scoreboard-display');
  container.innerHTML = `
    <div class="sb-teams">
      <div class="sb-team" id="sb-team-home">
        <div class="sb-winner-crown" id="sb-crown-home">👑</div>
        <img src="assets/escudos/${match.homeKey}.svg" alt="${match.home}" onerror="this.remove()">
        <div class="sb-team-name">${match.home}</div>
        <div class="sb-score-area">
          <div class="sb-score-btns">
            <button class="sb-score-btn" data-side="home" data-delta="-1">−</button>
            <div class="sb-score-val" id="sb-val-home">${match.homeScore}</div>
            <button class="sb-score-btn" data-side="home" data-delta="1">+</button>
          </div>
        </div>
      </div>
      <div><div class="sb-vs">VS</div></div>
      <div class="sb-team" id="sb-team-away">
        <div class="sb-winner-crown" id="sb-crown-away">👑</div>
        <img src="assets/escudos/${match.awayKey}.svg" alt="${match.away}" onerror="this.remove()">
        <div class="sb-team-name">${match.away}</div>
        <div class="sb-score-area">
          <div class="sb-score-btns">
            <button class="sb-score-btn" data-side="away" data-delta="-1">−</button>
            <div class="sb-score-val" id="sb-val-away">${match.awayScore}</div>
            <button class="sb-score-btn" data-side="away" data-delta="1">+</button>
          </div>
        </div>
      </div>
    </div>

    <div id="sb-penalty-area" class="sb-penalty" style="display:${isDraw ? 'block' : 'none'}">
      <div class="sb-penalty-label">⚡ Empat — Resultat directes</div>
      <div class="form-row" style="margin-top:0.5rem">
        <div class="form-group">
          <label style="font-size:0.72rem;color:rgba(255,255,255,0.5);text-transform:uppercase">
            ${match.home}
          </label>
          <input type="number" id="sb-pen-home" min="0" value="${match.penaltyHomeScore ?? 0}"
            style="text-align:center;font-size:1.4rem;font-weight:900;padding:0.5rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;width:100%;font-family:inherit">
        </div>
        <div class="form-group">
          <label style="font-size:0.72rem;color:rgba(255,255,255,0.5);text-transform:uppercase">
            ${match.away}
          </label>
          <input type="number" id="sb-pen-away" min="0" value="${match.penaltyAwayScore ?? 0}"
            style="text-align:center;font-size:1.4rem;font-weight:900;padding:0.5rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;width:100%;font-family:inherit">
        </div>
      </div>
      <label class="checkbox-label" style="margin-top:0.6rem">
        <input type="checkbox" id="sb-no-penalty" ${!match.penaltyWinner && isDraw && match.played ? 'checked' : ''}>
        Sense directes (empat definitiu)
      </label>
    </div>

    <div class="sb-footer">
      <div id="sb-status-badge">${sbStatusBadgeHtml(match)}</div>
      <button class="sb-save-btn" id="sb-save-btn">💾 Guardar Resultat</button>
      <button type="button" id="sb-reset-btn" class="btn-reset" style="display:${match.played ? 'block' : 'none'}">
        🗑️ Esborrar resultat
      </button>
    </div>
  `;

  // Wire up score buttons
  container.querySelectorAll('.sb-score-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const side = btn.dataset.side;
      const delta = +btn.dataset.delta;
      if (side === 'home') {
        sbHome = Math.max(0, sbHome + delta);
        document.getElementById('sb-val-home').textContent = sbHome;
      } else {
        sbAway = Math.max(0, sbAway + delta);
        document.getElementById('sb-val-away').textContent = sbAway;
      }
      updateSbPenaltyVisibility();
      updateWinnerHighlight();
    });
  });

  document.getElementById('sb-pen-home')?.addEventListener('input', e => {
    sbPenaltyHome = +e.target.value;
    updateWinnerHighlight();
  });
  document.getElementById('sb-pen-away')?.addEventListener('input', e => {
    sbPenaltyAway = +e.target.value;
    updateWinnerHighlight();
  });
  document.getElementById('sb-no-penalty')?.addEventListener('change', e => {
    if (e.target.checked) { sbPenaltyHome = null; sbPenaltyAway = null; }
    updateWinnerHighlight();
  });
  document.getElementById('sb-save-btn')?.addEventListener('click', sbSave);
  document.getElementById('sb-reset-btn')?.addEventListener('click', sbReset);

  updateWinnerHighlight();
}

function sbStatusBadgeHtml(match) {
  if (!match.played) return `<span class="match-status-badge pending">⏳ Pendent (no jugat)</span>`;
  const pen = match.penaltyWinner
    ? ` · D: ${match.penaltyWinner === 'home' ? match.home : match.away}`
    : '';
  return `<span class="match-status-badge played">✅ Jugat · ${match.homeScore}–${match.awayScore}${pen}</span>`;
}

function getWinner() {
  if (sbHome > sbAway) return 'home';
  if (sbAway > sbHome) return 'away';
  // draw — check penalty
  if (sbPenaltyHome !== null && sbPenaltyAway !== null) {
    const noPen = document.getElementById('sb-no-penalty')?.checked;
    if (!noPen) {
      if (sbPenaltyHome > sbPenaltyAway) return 'home';
      if (sbPenaltyAway > sbPenaltyHome) return 'away';
    }
  }
  return null;
}

function updateWinnerHighlight() {
  const winner = getWinner();
  const homeEl = document.getElementById('sb-team-home');
  const awayEl = document.getElementById('sb-team-away');
  const crownHome = document.getElementById('sb-crown-home');
  const crownAway = document.getElementById('sb-crown-away');
  if (!homeEl || !awayEl) return;

  homeEl.classList.toggle('sb-winner', winner === 'home');
  awayEl.classList.toggle('sb-winner', winner === 'away');
  homeEl.classList.toggle('sb-loser', winner === 'away');
  awayEl.classList.toggle('sb-loser', winner === 'home');

  if (crownHome) crownHome.style.visibility = winner === 'home' ? 'visible' : 'hidden';
  if (crownAway) crownAway.style.visibility = winner === 'away' ? 'visible' : 'hidden';
}

function updateSbPenaltyVisibility() {
  const area = document.getElementById('sb-penalty-area');
  if (!area) return;
  area.style.display = sbHome === sbAway ? 'block' : 'none';
  if (sbHome !== sbAway) {
    sbPenaltyHome = null;
    sbPenaltyAway = null;
  }
}

async function sbSave() {
  if (!sbMatchId) return;
  const noPen = document.getElementById('sb-no-penalty')?.checked;
  const penaltyHomeScore = (sbHome === sbAway && !noPen) ? (sbPenaltyHome ?? 0) : null;
  const penaltyAwayScore = (sbHome === sbAway && !noPen) ? (sbPenaltyAway ?? 0) : null;
  await saveMatch({
    matchId: sbMatchId,
    homeScore: sbHome,
    awayScore: sbAway,
    played: true,
    penaltyHomeScore,
    penaltyAwayScore
  }, 'sb-msg');
}

async function sbReset() {
  if (!sbMatchId) return;
  if (!confirm('Segur que vols esborrar el resultat? Tornarà a aparèixer com a pendent.')) return;
  await saveMatch({
    matchId: sbMatchId,
    homeScore: 0,
    awayScore: 0,
    played: false,
    penaltyHomeScore: null,
    penaltyAwayScore: null
  }, 'sb-msg');
}

function resetScoreboard() {
  sbMatchId = null;
  sbHome = 0; sbAway = 0; sbPenaltyHome = null; sbPenaltyAway = null;
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
      showMsg(msgId, 'success', '✓ Resultat guardat! La web s\'actualitzarà en ~1-2 minuts.');
      const notice = document.getElementById('save-notice');
      notice.style.display = 'block';
      setTimeout(() => { notice.style.display = 'none'; }, 10000);

      await loadData();
      renderMatchesStatus();

      // Refresh scoreboard to show updated status badge + reset button
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
