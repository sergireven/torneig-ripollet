export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { password } = req.body;
    const adminPwd = process.env.ADMIN_PASSWORD || 'cambiar123';

    if (password === adminPwd) {
      return res.status(200).json({ success: true, authenticated: true });
    }

    return res.status(401).json({ success: false, authenticated: false, error: 'Invalid password' });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
