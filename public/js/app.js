let tournamentData = null;

// Load data on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupTabs();
  renderAllViews();
});

// Load tournament data
async function loadData() {
  try {
    const response = await fetch('data.json');
    tournamentData = await response.json();
    updateLastUpdate();
  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById('categories-container').innerHTML = '<p class="error">Error loading tournament data</p>';
  }
}

// Update last update time
function updateLastUpdate() {
  if (!tournamentData) return;
  const lastUpdate = new Date(tournamentData.tournament.updatedAt);
  const timeStr = lastUpdate.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('last-update').textContent = timeStr;
}

// Setup tab switching
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;

      // Remove active class from all tabs
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Add active class to clicked tab
      btn.classList.add('active');
      document.getElementById(tabName + '-view').classList.add('active');
    });
  });
}

// Render all views
function renderAllViews() {
  renderTableView();
  renderBracketView();
  renderSponsors();
  renderLinks();
}

// RENDER TABLE VIEW
function renderTableView() {
  const container = document.getElementById('categories-container');
  if (!tournamentData) {
    container.innerHTML = '<p>No data available</p>';
    return;
  }

  container.innerHTML = '';

  tournamentData.categories.forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category-section';

    let html = `<h2 class="category-title">${category.name}</h2>`;

    category.divisions.forEach(division => {
      html += `
        <div class="division">
          <h3 class="division-title">${division.name}</h3>
          <table class="matches-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Local</th>
                <th>Visitant</th>
                <th>Resultat</th>
              </tr>
            </thead>
            <tbody>
      `;

      division.matches.forEach(match => {
        const localImg = `<img src="${match.homeShield}" alt="${match.home}" class="match-shield" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22%3E%3Crect fill=%22%23e2e8f0%22 width=%2224%22 height=%2224%22/%3E%3C/svg%3E'">`;
        const visitorImg = `<img src="${match.awayShield}" alt="${match.away}" class="match-shield" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22%3E%3Crect fill=%22%23e2e8f0%22 width=%2224%22 height=%2224%22/%3E%3C/svg%3E'">`;

        let scoreHtml = '';
        if (match.played) {
          scoreHtml = `<span class="match-score">${match.homeScore} - ${match.awayScore}</span>`;
        } else {
          scoreHtml = `<span class="match-score no-play score-pending">-:-</span>`;
        }

        html += `
          <tr class="match-row">
            <td class="match-time">${match.time}</td>
            <td class="match-teams">
              ${localImg}
              <span>${match.home}</span>
            </td>
            <td class="match-teams">
              ${visitorImg}
              <span>${match.away}</span>
            </td>
            <td>${scoreHtml}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    });

    categoryDiv.innerHTML = html;
    container.appendChild(categoryDiv);
  });
}

// RENDER BRACKET VIEW
function renderBracketView() {
  const container = document.getElementById('bracket-container');
  if (!tournamentData) {
    container.innerHTML = '<p>No data available</p>';
    return;
  }

  container.innerHTML = '';

  tournamentData.categories.forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'bracket-category';

    let html = `<h2 class="bracket-title">${category.name}</h2>`;

    category.divisions.forEach(division => {
      html += `
        <div class="bracket-division">
          <div class="bracket-division-title">${division.name}</div>
          <div class="bracket-matches">
      `;

      division.matches.forEach(match => {
        const localImg = `<img src="${match.homeShield}" alt="${match.home}" class="match-shield" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22%3E%3Crect fill=%22%23e2e8f0%22 width=%2224%22 height=%2224%22/%3E%3C/svg%3E'">`;
        const visitorImg = `<img src="${match.awayShield}" alt="${match.away}" class="match-shield" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22%3E%3Crect fill=%22%23e2e8f0%22 width=%2224%22 height=%2224%22/%3E%3C/svg%3E'">`;

        const scoreHome = match.played ? match.homeScore : '-';
        const scoreAway = match.played ? match.awayScore : '-';

        html += `
          <div class="bracket-match">
            <div class="bracket-match-team">
              <span>${localImg} ${match.home}</span>
              <span class="bracket-match-score">${scoreHome}</span>
            </div>
            <div class="bracket-match-team">
              <span>${visitorImg} ${match.away}</span>
              <span class="bracket-match-score">${scoreAway}</span>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    categoryDiv.innerHTML = html;
    container.appendChild(categoryDiv);
  });
}

// RENDER SPONSORS
function renderSponsors() {
  const container = document.getElementById('sponsors-grid');
  if (!tournamentData || !tournamentData.sponsors) {
    container.innerHTML = '<p>No sponsors available</p>';
    return;
  }

  container.innerHTML = '';

  tournamentData.sponsors.forEach(sponsor => {
    const card = document.createElement('div');
    card.className = 'sponsor-card';
    card.innerHTML = `
      <img src="${sponsor.logo}" alt="${sponsor.name}" class="sponsor-logo" onerror="this.style.display='none'">
      <div class="sponsor-name">${sponsor.name}</div>
    `;
    container.appendChild(card);
  });
}

// RENDER LINKS
function renderLinks() {
  const container = document.getElementById('links-container');
  if (!tournamentData || !tournamentData.links) {
    container.innerHTML = '<p>No links available</p>';
    return;
  }

  const links = tournamentData.links;

  container.innerHTML = `
    <a href="${links.clubWeb}" target="_blank" class="link-card">
      <h3>🏒 Web del Club</h3>
      <p>Visita la web oficial del Club Hoquei Ripollet</p>
    </a>
    <a href="${links.instagramCampus}" target="_blank" class="link-card">
      <h3>📸 Instagram Campus</h3>
      <p>Segueix les últimes publicacions del campus Sergi Miras</p>
    </a>
    <a href="${links.okCat360}" target="_blank" class="link-card">
      <h3>📊 Resultats Temporada</h3>
      <p>Veure resultats i estadístiques de la temporada completa</p>
    </a>
  `;
}

// Reload data every 30 seconds (auto-refresh)
setInterval(async () => {
  await loadData();
  renderAllViews();
}, 30000);
