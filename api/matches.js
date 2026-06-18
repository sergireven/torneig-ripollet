/**
 * POST /api/matches — update a match result
 *
 * Uses the GitHub Contents API to read + update public/data.json directly in
 * the repo so the change persists across Vercel deployments.
 *
 * Required env vars (set in Vercel dashboard → Settings → Environment Variables):
 *   ADMIN_PASSWORD   — the admin panel password
 *   GITHUB_TOKEN     — a fine-grained PAT with "Contents: Read and write" on this repo
 *   GITHUB_REPO      — owner/repo, e.g. "sergireven/torneig-ripollet"
 *   GITHUB_BRANCH    — branch to write to (default: "main")
 */

const GITHUB_API = 'https://api.github.com';
const FILE_PATH = 'public/data.json';

async function ghGet(repo, branch, token) {
  const url = `${GITHUB_API}/repos/${repo}/contents/${FILE_PATH}?ref=${branch}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
  return res.json(); // { content, sha, ... }
}

async function ghPut(repo, branch, token, sha, content, message) {
  const url = `${GITHUB_API}/repos/${repo}/contents/${FILE_PATH}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
      branch,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub PUT failed: ${res.status} — ${err.message || ''}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const GITHUB_TOKEN   = process.env.GITHUB_TOKEN;
  const GITHUB_REPO    = process.env.GITHUB_REPO;
  const GITHUB_BRANCH  = process.env.GITHUB_BRANCH || 'main';

  // Guard: missing env vars
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.error('Missing GITHUB_TOKEN or GITHUB_REPO env vars');
    return res.status(500).json({ error: 'Server not configured (missing env vars)' });
  }

  const { password, matchId, homeScore, awayScore, played, penaltyHomeScore, penaltyAwayScore } = req.body || {};

  // Auth
  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Contrasenya incorrecta' });
  }

  if (!matchId) {
    return res.status(400).json({ error: 'matchId required' });
  }

  try {
    // 1. Read current file from GitHub
    const file = await ghGet(GITHUB_REPO, GITHUB_BRANCH, GITHUB_TOKEN);
    const raw = Buffer.from(file.content, 'base64').toString('utf-8');
    const data = JSON.parse(raw);

    // 2. Find and update the match
    let found = false;
    for (const cat of data.categories) {
      for (const div of cat.divisions) {
        for (const m of div.matches) {
          if (m.id === matchId) {
            m.homeScore = typeof homeScore === 'number' ? homeScore : parseInt(homeScore, 10) || 0;
            m.awayScore = typeof awayScore === 'number' ? awayScore : parseInt(awayScore, 10) || 0;
            m.played    = played !== undefined ? Boolean(played) : true;

            const isDraw = m.homeScore === m.awayScore;
            m.penaltyHomeScore = isDraw && penaltyHomeScore !== null && penaltyHomeScore !== undefined
              ? (typeof penaltyHomeScore === 'number' ? penaltyHomeScore : parseInt(penaltyHomeScore, 10) || 0)
              : null;
            m.penaltyAwayScore = isDraw && penaltyAwayScore !== null && penaltyAwayScore !== undefined
              ? (typeof penaltyAwayScore === 'number' ? penaltyAwayScore : parseInt(penaltyAwayScore, 10) || 0)
              : null;
            // derive penaltyWinner from scores
            m.penaltyWinner = (!isDraw || m.penaltyHomeScore === null) ? null
              : m.penaltyHomeScore > m.penaltyAwayScore ? 'home'
              : m.penaltyAwayScore > m.penaltyHomeScore ? 'away'
              : null;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }

    if (!found) {
      return res.status(404).json({ error: `Partit "${matchId}" no trobat` });
    }

    data.tournament.updatedAt = new Date().toISOString();

    // 3. Write back to GitHub
    const newContent = JSON.stringify(data, null, 2);
    await ghPut(
      GITHUB_REPO,
      GITHUB_BRANCH,
      GITHUB_TOKEN,
      file.sha,
      newContent,
      `feat: update match ${matchId} result [skip ci]`
    );

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('matches handler error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
