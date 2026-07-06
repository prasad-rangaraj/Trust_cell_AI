export function requireApiKey(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing API Key' });
  }
  
  const token = authHeader.split(' ')[1];
  const validKey = process.env.API_KEY || 'cat-edge-bms-2026';
  
  if (token !== validKey) {
    return res.status(403).json({ success: false, error: 'Forbidden: Invalid API Key' });
  }
  
  next();
}
