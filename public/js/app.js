'use strict';

const SHIELD_EXT = { chr: 'gif' };
function shieldSrc(key) {
  return `assets/escudos/${key}.${SHIELD_EXT[key] || 'png'}`;
}

let DATA = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadData();
  buildSidebar();
  buildContent();
  buildBottomNav();
  setupMobileMenu();
  setupScrollSpy();
  setInterval(refreshData, 30000);
}

/* ===================== DATA ===================== */
async function loadData() {
  try {
    const res = await fetch(`data.json?v=${Date.now()}`);
    DATA = await res.json();
  } catch (e) {
    document.getElementById('main-content').innerHTML =
      '<div class="loading-state"><p>Error carregant les dades. Refresca la pàgina.</p></div>';
  }
}

async function refreshData() {
  await loadData();
  if (!DATA) return;
  document.getElementById('main-content').querySelectorAll('.section').forEach(s => {
    const id = s.id;
    const fresh = buildSectionById(id);
    if (fresh) s.replaceWith(fresh);
  });
  updateBar();
}

/* ===================== SIDEBAR ===================== */
function buildSidebar() {
  const nav = document.getElementById('sidebar-nav');

  const items = [
    {
      type: 'group', label: 'Informació del Torneig', icon: '📋', id: 'sec-info',
      children: [
        { label: 'Benvinguda', id: 'sec-info', anchor: 'info-welcome' },
        { label: 'Regles i Format', id: 'sec-info', anchor: 'info-rules' },
        { label: 'Horaris', id: 'sec-info', anchor: 'info-schedule' },
        { label: 'Ubicació i Contactes', id: 'sec-info', anchor: 'info-location' },
      ]
    },
    { type: 'separator' },
    {
      type: 'group', label: 'Categories', icon: '🏒',
      children: [
        {
          label: 'Prebenjamí',
          children: [
            { label: '🥇 Or', id: 'sec-prebe-or' },
            { label: '🥈 Plata', id: 'sec-prebe-plata' },
            { label: '⭐ Iniciació', id: 'sec-prebe-iniciacio' },
          ]
        },
        {
          label: 'Benjamí',
          children: [
            { label: '🥇 Or', id: 'sec-benjami-or' },
            { label: '🥈 Plata', id: 'sec-benjami-plata' },
          ]
        },
      ]
    },
    { type: 'separator' },
    {
      type: 'group', label: 'Instagram', icon: '📸', id: 'sec-campus',
      children: [
        { label: '@ch_ripollet', id: 'sec-campus', anchor: 'ig-chr' },
        { label: 'OK Campus Sergi Miras', id: 'sec-campus', anchor: 'ig-campus' },
      ]
    },
    { type: 'direct', label: 'Resultats Temporada', icon: '📊', id: 'sec-temporada' },
    { type: 'separator' },
    { type: 'link', label: 'Administrador', icon: '🔧', href: 'admin.html' },
  ];

  nav.innerHTML = items.map(renderNavItem).join('');

  // Expand top-level groups
  nav.querySelectorAll('.nav-group-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const children = btn.nextElementSibling;
      btn.classList.toggle('open');
      children.classList.toggle('open');
    });
    btn.classList.add('open');
    btn.nextElementSibling.classList.add('open');
  });

  // Expand subgroups
  nav.querySelectorAll('.nav-subgroup-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const children = btn.nextElementSibling;
      btn.classList.toggle('open');
      children.classList.toggle('open');
    });
    btn.classList.add('open');
    btn.nextElementSibling.classList.add('open');
  });

  // Nav item clicks
  nav.querySelectorAll('[data-section]').forEach(el => {
    el.addEventListener('click', () => {
      const sec = document.getElementById(el.dataset.section);
      if (sec) {
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (el.dataset.anchor) {
          const anchor = document.getElementById(el.dataset.anchor);
          if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      closeSidebar();
    });
  });
}

/* ===================== BOTTOM NAV (MOBILE) ===================== */
function buildBottomNav() {
  const nav = document.getElementById('bottom-nav');
  const sheet = document.getElementById('bottom-sheet');
  const sheetItems = document.getElementById('bottom-sheet-items');
  const overlay = document.getElementById('bottom-sheet-overlay');
  if (!nav || !sheet) return;

  const tabs = [
    {
      icon: '📋', label: 'Info', id: 'sec-info',
      children: [
        { icon: '👋', label: 'Benvinguda',       id: 'sec-info', anchor: 'info-welcome' },
        { icon: '📜', label: 'Regles',            id: 'sec-info', anchor: 'info-rules' },
        { icon: '🕐', label: 'Horaris',           id: 'sec-info', anchor: 'info-schedule' },
        { icon: '📍', label: 'Ubicació',          id: 'sec-info', anchor: 'info-location' },
      ]
    },
    {
      icon: '🏒', label: 'Categories', id: null,
      children: [
        { isHeader: true, label: 'Prebenjamí' },
        { icon: '🥇', label: 'Or',         id: 'sec-prebe-or' },
        { icon: '🥈', label: 'Plata',      id: 'sec-prebe-plata' },
        { icon: '⭐', label: 'Iniciació',  id: 'sec-prebe-iniciacio' },
        { isHeader: true, label: 'Benjamí' },
        { icon: '🥇', label: 'Or',         id: 'sec-benjami-or' },
        { icon: '🥈', label: 'Plata',      id: 'sec-benjami-plata' },
      ]
    },
    {
      icon: '📸', label: 'Instagram', id: 'sec-campus',
      children: [
        { icon: '🔵', label: '@ch_ripollet',       id: 'sec-campus', anchor: 'ig-chr' },
        { icon: '🎽', label: 'OK Campus Sergi Miras', id: 'sec-campus', anchor: 'ig-campus' },
      ]
    },
    { icon: '📊', label: 'Temporada', id: 'sec-temporada' },
    { icon: '⚙️', label: 'Admin', id: null, href: 'admin.html',
      children: [
        { icon: '🔧', label: 'Panell d\'administrador', href: 'admin.html' },
      ]
    },
  ];

  // Build tab buttons
  nav.innerHTML = tabs.map((t, i) => `
    <button class="bn-tab" data-idx="${i}" aria-label="${t.label}">
      <span class="bn-icon">${t.icon}</span>
      <span>${t.label}</span>
    </button>
  `).join('');

  let activeIdx = -1;

  function openSheet(tab, idx) {
    sheetItems.innerHTML = tab.children.map(c => {
      if (c.isHeader) {
        return `<div class="bs-header">${c.label}</div>`;
      }
      if (c.href) {
        return `<a class="bs-item" href="${c.href}">
          <span class="bs-item-icon">${c.icon}</span>${c.label}</a>`;
      }
      return `<button class="bs-item"
        data-section="${c.id}"
        ${c.anchor ? `data-anchor="${c.anchor}"` : ''}>
        <span class="bs-item-icon">${c.icon}</span>${c.label}
      </button>`;
    }).join('');
    sheet.classList.add('open');
    overlay.classList.add('open');

    sheetItems.querySelectorAll('.bs-item[data-section]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigate(btn.dataset.section, btn.dataset.anchor);
        closeSheet();
        setActive(idx);
      });
    });
  }

  function closeSheet() {
    sheet.classList.remove('open');
    overlay.classList.remove('open');
  }

  function setActive(idx) {
    activeIdx = idx;
    nav.querySelectorAll('.bn-tab').forEach((b, i) => b.classList.toggle('active', i === idx));
  }

  function navigate(sectionId, anchor) {
    const sec = document.getElementById(sectionId);
    if (!sec) return;
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (anchor) {
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 320);
    }
  }

  nav.querySelectorAll('.bn-tab').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const tab = tabs[i];
      if (tab.children) {
        if (sheet.classList.contains('open') && activeIdx === i) {
          closeSheet(); return;
        }
        openSheet(tab, i);
        setActive(i);
      } else {
        closeSheet();
        navigate(tab.id);
        setActive(i);
      }
    });
  });

  overlay.addEventListener('click', closeSheet);
}

function renderNavItem(item) {
  if (item.type === 'separator') return '<div class="nav-separator"></div>';
  if (item.type === 'direct') {
    return `<button class="nav-direct" data-section="${item.id}">
      <span class="nav-icon">${item.icon}</span>
      ${item.label}
    </button>`;
  }
  if (item.type === 'link') {
    return `<a class="nav-direct nav-link-item" href="${item.href}">
      <span class="nav-icon">${item.icon}</span>
      ${item.label}
    </a>`;
  }
  if (item.type === 'group') {
    const children = item.children.map(c => {
      if (c.children) {
        const subItems = c.children.map(sc =>
          `<button class="nav-item nav-item-deep" data-section="${sc.id}" ${sc.anchor ? `data-anchor="${sc.anchor}"` : ''}>
            ${sc.label}
          </button>`
        ).join('');
        return `<div class="nav-subgroup">
          <button class="nav-subgroup-btn">
            ${c.label}
            <span class="nav-arrow">▶</span>
          </button>
          <div class="nav-subgroup-children">${subItems}</div>
        </div>`;
      }
      return `<button class="nav-item" data-section="${c.id}" ${c.anchor ? `data-anchor="${c.anchor}"` : ''}>
        ${c.label}
      </button>`;
    }).join('');
    return `<div class="nav-group">
      <button class="nav-group-btn">
        <span class="nav-icon">${item.icon}</span>
        ${item.label}
        <span class="nav-arrow">▶</span>
      </button>
      <div class="nav-children">${children}</div>
    </div>`;
  }
  return '';
}

/* ===================== CONTENT ===================== */
function buildContent() {
  if (!DATA) return;
  const main = document.getElementById('main-content');
  main.innerHTML = '';

  // Update bar
  main.appendChild(buildUpdateBar());

  // Info section
  main.appendChild(buildInfoSection());

  // Categories
  DATA.categories.forEach(cat => {
    cat.divisions.forEach(div => {
      main.appendChild(buildDivisionSection(cat, div));
    });
  });

  // Campus / Instagram
  main.appendChild(buildInstagramSection());

  // okCat360
  main.appendChild(buildOkCat360Section());
}

function buildSectionById(id) {
  if (!DATA) return null;
  if (id === 'sec-info') return buildInfoSection();
  if (id === 'sec-campus') return buildInstagramSection();
  if (id === 'sec-temporada') return buildOkCat360Section();

  for (const cat of DATA.categories) {
    for (const div of cat.divisions) {
      if (`sec-${div.id}` === id) return buildDivisionSection(cat, div);
    }
  }
  return null;
}

function buildUpdateBar() {
  const bar = document.createElement('div');
  bar.className = 'update-bar';
  bar.id = 'update-bar';
  bar.innerHTML = updateBarHTML();
  return bar;
}

function updateBarHTML() {
  if (!DATA) return '';
  const d = new Date(DATA.tournament.updatedAt);
  const time = d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
  return `<div class="update-dot"></div><span>Última actualització: ${time}</span>`;
}

function updateBar() {
  const bar = document.getElementById('update-bar');
  if (bar) bar.innerHTML = updateBarHTML();
}

/* ===================== INFO SECTION ===================== */
function buildInfoSection() {
  const sec = document.createElement('div');
  sec.className = 'section';
  sec.id = 'sec-info';

  const info = DATA.info;
  const t = DATA.tournament;

  sec.innerHTML = `
    <div class="section-header">
      <span class="section-icon">📋</span>
      <h2>Informació del Torneig</h2>
    </div>

    <!-- Welcome -->
    <div class="card" id="info-welcome">
      <div class="card-title">Benvinguda</div>
      <p class="info-welcome">${info.welcome}</p>
    </div>

    <!-- Rules -->
    <div class="card" id="info-rules">
      <div class="card-title">Regles i Format de Joc</div>
      <div class="info-tree">
        ${info.rules.map(r => `
          <div class="info-tree-item">
            <span class="info-tree-icon">⚙️</span>
            <span class="info-tree-key">${r.key}</span>
            <span class="info-tree-value">${r.value}</span>
          </div>
        `).join('')}
        <div class="info-tree-item">
          <span class="info-tree-icon">💰</span>
          <span class="info-tree-key">Inscripció</span>
          <span class="info-tree-value">${info.registration}</span>
        </div>
        <div class="info-tree-item">
          <span class="info-tree-icon">⚕️</span>
          <span class="info-tree-key">Primers Auxilis</span>
          <span class="info-tree-value">${info.firstAid}</span>
        </div>
      </div>
    </div>

    <!-- Schedule -->
    <div class="card" id="info-schedule">
      <div class="card-title">Horaris del Dia</div>
      ${buildScheduleHTML(info)}
    </div>

    <!-- Location -->
    <div class="card" id="info-location">
      <div class="card-title">Ubicació i Contactes</div>
      <div class="info-tree">
        <div class="info-tree-item">
          <span class="info-tree-icon">📍</span>
          <span class="info-tree-key">Pavelló</span>
          <span class="info-tree-value">
            <a href="https://www.google.com/maps/search/?api=1&query=Pavell%C3%B3+Municipal+d'Esports+Joan+Creus+Ripollet" target="_blank" rel="noopener" class="maps-link">
              <strong>${t.location.name}</strong>
            </a><br>
            ${t.location.address}, ${t.location.city}
          </span>
        </div>
        ${info.contacts.map(c => `
          <div class="info-tree-item">
            <span class="info-tree-icon">📞</span>
            <span class="info-tree-key">${c.name}</span>
            <span class="info-tree-value"><a href="tel:${c.phone.replace(/\s/g,'')}">${c.phone}</a></span>
          </div>
        `).join('')}
      </div>
      <div class="maps-embed-wrap">
        <iframe
          title="Pavelló Municipal Joan Creus — Ripollet"
          src="https://maps.google.com/maps?q=Pavell%C3%B3+Municipal+d%27Esports+Joan+Creus+Ripollet&t=&z=17&output=embed&hl=ca"
          allowfullscreen
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </div>
    </div>
  `;

  return sec;
}

function buildScheduleHTML(info) {
  const allMatches = [];

  DATA.categories.forEach(cat => {
    cat.divisions.forEach(div => {
      div.matches.forEach(m => {
        allMatches.push({ time: m.time, cat: cat.name, div: div.name, home: m.home, away: m.away });
      });
    });
    allMatches.push({ time: cat.awardTime, special: `🏅 Entrega de Medalles — ${cat.name}` });
  });

  allMatches.sort((a, b) => a.time.localeCompare(b.time));

  let html = '<div class="schedule-grid">';
  allMatches.forEach(m => {
    if (m.special) {
      html += `<div class="schedule-medals" style="grid-column:1/-1">${m.time} — ${m.special}</div>`;
    } else {
      html += `
        <div class="schedule-time">${m.time}</div>
        <div><span class="schedule-cat" style="background:${m.cat === 'Prebenjamí' ? '#0033a0' : '#5a1a8a'};padding:3px 8px;border-radius:3px;font-size:11px;color:white;font-weight:700">${m.cat} ${m.div}</span></div>
        <div class="schedule-teams">${m.home} vs ${m.away}</div>
      `;
    }
  });
  html += '</div>';
  return html;
}

/* ===================== DIVISION SECTION ===================== */
function buildDivisionSection(cat, div) {
  const sectionId = `sec-${div.id}`;

  const sec = document.createElement('div');
  sec.className = 'section';
  sec.id = sectionId;

  const catIcon = cat.id === 'prebenjami' ? '🏒' : '🏒';
  const badgeClass = div.name === 'Or' ? 'badge-or' : div.name === 'Plata' ? 'badge-plata' : 'badge-iniciacio';

  sec.innerHTML = `
    <div class="section-header">
      <span class="section-icon">${catIcon}</span>
      <h2>${cat.name} · <span class="division-badge ${badgeClass}">${div.name}</span></h2>
    </div>
    <div id="${sectionId}-body"></div>
  `;

  const body = sec.querySelector(`#${sectionId}-body`);

  if (div.format === 'triangular') {
    const standings = calculateStandings(div);
    body.innerHTML = buildStandingsHTML(standings) + buildMatchesHTML(div.matches);
  } else {
    body.innerHTML = buildSingleMatchHTML(div.matches[0]);
  }

  return sec;
}

/* ===================== STANDINGS ===================== */
function calculateStandings(division) {
  const teams = {};

  for (const m of division.matches) {
    if (!teams[m.home]) teams[m.home] = { name: m.home, key: m.homeKey, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
    if (!teams[m.away]) teams[m.away] = { name: m.away, key: m.awayKey, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
  }

  for (const m of division.matches) {
    if (!m.played) continue;
    const home = teams[m.home];
    const away = teams[m.away];

    home.pj++; away.pj++;
    home.gf += m.homeScore; home.gc += m.awayScore;
    away.gf += m.awayScore; away.gc += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.pts += 3; home.pg++;
      away.pp++;
    } else if (m.awayScore > m.homeScore) {
      away.pts += 3; away.pg++;
      home.pp++;
    } else {
      // Draw — check penalty (directa)
      if (m.penaltyWinner === 'home') {
        home.pts += 2; home.pg++;   // wins the directa
        away.pts += 1; away.pe++;   // loses directa (still 1pt)
      } else if (m.penaltyWinner === 'away') {
        away.pts += 2; away.pg++;
        home.pts += 1; home.pe++;
      } else {
        home.pts += 1; home.pe++;
        away.pts += 1; away.pe++;
      }
    }
  }

  return Object.values(teams).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if ((b.gf - b.gc) !== (a.gf - a.gc)) return (b.gf - b.gc) - (a.gf - a.gc);
    return b.gf - a.gf;
  });
}

function buildStandingsHTML(standings) {
  const rows = standings.map((team, i) => {
    const rank = i + 1;
    const gd = team.gf - team.gc;
    const trophy = rank === 1 && team.pj > 0 ? '🏆' : '';
    return `
      <tr class="rank-${rank}">
        <td>
          <div class="team-cell">
            <div class="rank-badge">${rank}</div>
            <img src="${shieldSrc(team.key)}" alt="${team.name}" class="team-shield-sm"
                 onerror="this.style.opacity=0.3">
            <span class="team-name">${team.name} ${trophy}</span>
          </div>
        </td>
        <td>${team.pj}</td>
        <td>${team.pg}</td>
        <td>${team.pe}</td>
        <td>${team.pp}</td>
        <td>${team.gf}</td>
        <td>${team.gc}</td>
        <td>${gd >= 0 ? '+' : ''}${gd}</td>
        <td class="pts-cell">${team.pts}</td>
      </tr>
    `;
  }).join('');

  return `
    <table class="standings-table">
      <thead>
        <tr>
          <th>Equip</th>
          <th>PJ</th>
          <th>PG</th>
          <th>PE</th>
          <th>PP</th>
          <th>GF</th>
          <th>GC</th>
          <th>GD</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:11px;color:var(--text-muted);margin-bottom:14px;padding-left:4px;">
      PG = guanyats · PE = empat/directa perduda (1pt) · PP = perduts · GD = diferència de gols
    </p>
  `;
}

/* ===================== MATCH CARDS ===================== */
function buildMatchesHTML(matches) {
  return `<div class="matches-list">${matches.map(buildMatchCardHTML).join('')}</div>`;
}

function buildMatchCardHTML(m) {
  const homeWin = m.played && m.homeScore > m.awayScore;
  const awayWin = m.played && m.awayScore > m.homeScore;
  const draw = m.played && m.homeScore === m.awayScore;

  let scoreHTML;
  if (!m.played) {
    scoreHTML = `<span class="match-score pending">-:-</span>`;
  } else {
    let penLabel = '';
    if (draw && m.penaltyWinner) {
      const ps = (m.penaltyHomeScore !== null && m.penaltyAwayScore !== null)
        ? ` ${m.penaltyHomeScore}-${m.penaltyAwayScore}` : '';
      penLabel = `<span class="match-penalty-label">Dir${ps}</span>`;
    }
    scoreHTML = `<span class="match-score">${m.homeScore} - ${m.awayScore}</span>${penLabel}`;
  }

  const homeWinner = homeWin || (draw && m.penaltyWinner === 'home');
  const awayWinner = awayWin || (draw && m.penaltyWinner === 'away');

  const classes = ['match-card'];
  if (m.played) classes.push('match-played');
  if (homeWinner) classes.push('match-winner-home');
  if (awayWinner) classes.push('match-winner-away');

  return `
    <div class="${classes.join(' ')}">
      <div class="match-time-col">${m.time}</div>

      <div class="match-team home">
        <span class="match-team-name ${homeWinner ? 'is-winner' : ''}">
          ${homeWinner ? '<span class="winner-indicator">🏆 </span>' : ''}${m.home}
        </span>
        <img src="${shieldSrc(m.homeKey)}" alt="${m.home}" class="match-shield-md"
             onerror="this.style.opacity=0.3">
      </div>

      <div class="match-score-col">${scoreHTML}</div>

      <div class="match-team away">
        <img src="${shieldSrc(m.awayKey)}" alt="${m.away}" class="match-shield-md"
             onerror="this.style.opacity=0.3">
        <span class="match-team-name ${awayWinner ? 'is-winner' : ''}">
          ${m.away}${awayWinner ? ' <span class="winner-indicator">🏆</span>' : ''}
        </span>
      </div>

      <div class="match-time-col" style="opacity:0"></div>
    </div>
  `;
}

function buildSingleMatchHTML(m) {
  const homeWin = m.played && m.homeScore > m.awayScore;
  const awayWin = m.played && m.awayScore > m.homeScore;
  const draw = m.played && m.homeScore === m.awayScore;

  const homeWinner = homeWin || (draw && m.penaltyWinner === 'home');
  const awayWinner = awayWin || (draw && m.penaltyWinner === 'away');

  const scoreDisplay = m.played
    ? `<div class="single-score-display">${m.homeScore}&nbsp;-&nbsp;${m.awayScore}</div>`
    : `<div class="single-score-display pending">-&nbsp;vs&nbsp;-</div>`;

  let penLabel = '';
  if (draw && m.penaltyWinner) {
    const winner = m.penaltyWinner === 'home' ? m.home : m.away;
    const ps = (m.penaltyHomeScore !== null && m.penaltyAwayScore !== null)
      ? ` ${m.penaltyHomeScore}-${m.penaltyAwayScore}` : '';
    penLabel = `<div class="single-score-penalty">Directes${ps} · ${winner}</div>`;
  }

  return `
    <div class="single-match-result">
      <div class="single-match-header">
        <span class="single-match-header-time">${m.time}h</span>
        <span class="single-match-header-status ${m.played ? 'status-played' : 'status-pending'}">
          ${m.played ? '✓ Jugat' : '⏳ Pendent'}
        </span>
      </div>
      <div class="single-match-body">
        <div class="single-team">
          <img src="${shieldSrc(m.homeKey)}" alt="${m.home}" class="single-team-shield"
               onerror="this.style.opacity=0.3">
          <div class="single-team-name">${m.home}</div>
          <div class="single-team-winner-badge ${homeWinner ? 'visible' : ''}">🏆 Guanyador</div>
        </div>

        <div class="single-score">
          ${scoreDisplay}
          ${penLabel}
        </div>

        <div class="single-team">
          <img src="${shieldSrc(m.awayKey)}" alt="${m.away}" class="single-team-shield"
               onerror="this.style.opacity=0.3">
          <div class="single-team-name">${m.away}</div>
          <div class="single-team-winner-badge ${awayWinner ? 'visible' : ''}">🏆 Guanyador</div>
        </div>
      </div>
    </div>
  `;
}

/* ===================== INSTAGRAM SECTION ===================== */
function igLoadingHTML() {
  return `<div class="ig-loading">
    <div class="ig-spin"></div>
    <span>Carregant Instagram…</span>
  </div>`;
}

function buildInstagramSection() {
  const sec = document.createElement('div');
  sec.className = 'section';
  sec.id = 'sec-campus';

  const urlCampus = DATA.links.instagram;
  const urlClub   = DATA.links.instagramClub || 'https://www.instagram.com/ch_ripollet/';

  sec.innerHTML = `
    <div class="section-header">
      <span class="section-icon">📸</span>
      <h2>Instagram</h2>
    </div>

    <!-- Club CH Ripollet -->
    <div class="instagram-section" id="ig-chr" style="margin-bottom:1.5rem">
      <div class="instagram-header">
        <span class="instagram-icon">📸</span>
        <div class="instagram-header-text">
          <h3>@ch_ripollet</h3>
          <p>Perfil oficial del Club Hoquei Ripollet</p>
        </div>
      </div>
      <div class="ig-wrap" id="ig-wrap-chr">
        ${igLoadingHTML()}
        <blockquote class="instagram-media"
          data-instgrm-permalink="${urlClub}"
          data-instgrm-version="14"
          style="display:none;background:#FFF;border:0;border-radius:3px;box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15);margin:0 auto;max-width:540px;width:100%;">
        </blockquote>
      </div>
    </div>

    <!-- OK Campus Sergi Miras -->
    <div class="instagram-section" id="ig-campus">
      <div class="instagram-header">
        <span class="instagram-icon">📸</span>
        <div class="instagram-header-text">
          <h3>OK Campus Sergi Miras</h3>
          <p>Campus d'estiu de hoquei patins · Segueix les últimes publicacions</p>
        </div>
      </div>
      <div class="ig-wrap" id="ig-wrap-campus">
        ${igLoadingHTML()}
        <blockquote class="instagram-media"
          data-instgrm-permalink="${urlCampus}"
          data-instgrm-version="14"
          style="display:none;background:#FFF;border:0;border-radius:3px;box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15);margin:0 auto;max-width:540px;width:100%;">
        </blockquote>
      </div>
    </div>
  `;

  // Load Instagram embed.js
  if (!document.getElementById('ig-embed-script')) {
    const s = document.createElement('script');
    s.id = 'ig-embed-script';
    s.async = true;
    s.src = '//www.instagram.com/embed.js';
    document.body.appendChild(s);
  } else if (window.instgrm) {
    window.instgrm.Embeds.process();
  }

  setupIgLoading('ig-wrap-chr', urlClub);
  setupIgLoading('ig-wrap-campus', urlCampus);

  return sec;
}

function setupIgLoading(wrapperId, fallbackUrl) {
  const wrap = document.getElementById(wrapperId);
  if (!wrap) return;

  const loading = wrap.querySelector('.ig-loading');
  const blockquote = wrap.querySelector('.instagram-media');

  function onLoaded() {
    if (loading) loading.remove();
    if (blockquote) blockquote.style.display = '';
  }

  function onFailed() {
    if (!loading) return;
    loading.innerHTML = `
      <span class="ig-load-failed">No s'ha pogut carregar Instagram</span>
      <a href="${fallbackUrl}" target="_blank" rel="noopener" class="ig-fallback-btn">
        Obrir a Instagram →
      </a>
    `;
  }

  // Watch for the iframe that embed.js injects
  const observer = new MutationObserver(() => {
    if (wrap.querySelector('iframe')) {
      onLoaded();
      observer.disconnect();
    }
  });
  observer.observe(wrap, { childList: true, subtree: true });

  // After 10s without iframe → show fallback link
  setTimeout(() => {
    if (!wrap.querySelector('iframe')) onFailed();
  }, 10000);
}

/* ===================== OKCAT360 SECTION ===================== */
function buildOkCat360Section() {
  const sec = document.createElement('div');
  sec.className = 'section';
  sec.id = 'sec-temporada';

  const url = DATA.links.okCat360;

  sec.innerHTML = `
    <div class="section-header">
      <span class="section-icon">📊</span>
      <h2>Resultats Temporada</h2>
    </div>
    <a href="${url}" target="_blank" rel="noopener" class="okcat360-card">
      <div class="okcat360-text">
        <h3>okCat360</h3>
        <p>Classificacions, resultats i estadístiques de tots els clubs i competicions de la temporada</p>
      </div>
      <div class="okcat360-arrow">→</div>
    </a>
  `;

  return sec;
}

/* ===================== MOBILE MENU ===================== */
function setupMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const overlay = document.getElementById('sidebar-overlay');
  const sidebar = document.getElementById('sidebar');

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });

  overlay.addEventListener('click', closeSidebar);
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

/* ===================== SCROLL SPY ===================== */
function setupScrollSpy() {
  const OFFSET = 100; // px from top where section counts as active

  function update() {
    const sections = [...document.querySelectorAll('.section')];
    const scrollY = window.scrollY;
    let activeId = sections[0]?.id;

    for (const sec of sections) {
      if (sec.offsetTop <= scrollY + OFFSET) activeId = sec.id;
      else break;
    }

    document.querySelectorAll('[data-section]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === activeId);
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}
