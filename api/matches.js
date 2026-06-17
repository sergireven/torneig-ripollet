import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'public', 'data.json');

function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return null;
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing data:', error);
    return false;
  }
}

function verifyPassword(pwd) {
  const adminPwd = process.env.ADMIN_PASSWORD || 'cambiar123';
  return pwd === adminPwd;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const data = readData();
    if (!data) {
      return res.status(500).json({ error: 'Could not read data' });
    }
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { password, matchId, homeScore, awayScore, played } = req.body;

    if (!verifyPassword(password)) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const data = readData();
    if (!data) {
      return res.status(500).json({ error: 'Could not read data' });
    }

    // Find and update the match
    let found = false;
    for (const category of data.categories) {
      for (const division of category.divisions) {
        for (const match of division.matches) {
          if (match.id === matchId) {
            match.homeScore = homeScore;
            match.awayScore = awayScore;
            match.played = played !== undefined ? played : true;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }

    if (!found) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update timestamp
    data.tournament.updatedAt = new Date().toISOString();

    if (writeData(data)) {
      return res.status(200).json({ success: true, message: 'Match updated' });
    } else {
      return res.status(500).json({ error: 'Could not save data' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
