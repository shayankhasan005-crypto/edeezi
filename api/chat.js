/**
 * Vercel serverless endpoint: POST /api/chat
 *
 * Environment variable (Vercel → Project → Settings → Environment Variables):
 *   XAI_API_KEY = xai-...
 *
 * The key stays on the server. The browser only sends the chat messages.
 */

const { askGrok } = require('../lib/edezi-brand');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      body = null;
    }
  }

  if (!body || !Array.isArray(body.messages)) {
    res.status(400).json({ error: 'Send a JSON body with a messages array.' });
    return;
  }

  try {
    const result = await askGrok(body.messages);
    res.status(200).json(result);
  } catch (err) {
    if (err.code === 'BOT_NOT_CONFIGURED') {
      res.status(503).json({
        error: 'Edeezi Bot is not configured yet. Add XAI_API_KEY in Vercel → Settings → Environment Variables, then redeploy.'
      });
      return;
    }

    if (err.code === 'NO_MESSAGES') {
      res.status(400).json({ error: 'No valid messages were provided.' });
      return;
    }

    console.error('Edeezi Bot upstream error:', err.message);
    res.status(502).json({
      error: 'Edeezi Bot could not reach the AI service right now. Please try again or call +91 62382 70399.'
    });
  }
};
