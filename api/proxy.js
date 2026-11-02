// Vercel Serverless Function: Horizon Sovereign Web Proxy
// Strips iframe restrictions (X-Frame-Options & CSP) to render live web content
// Supports dual-engine emulation (WebKit Safari vs Chromium Blink)

export default async function handler(req, res) {
  // CORS Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, engine = 'webkit' } = req.query;

  if (!url) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Horizon Proxy Error</title></head>
        <body style="font-family: -apple-system, system-ui; padding: 40px; text-align: center; color: #1d1d1f; background: #f5f5f7;">
          <h2>No URL Specified</h2>
          <p style="color: #6e6e73;">Usage: /api/proxy?url=https://example.com&engine=webkit</p>
        </body>
      </html>
    `);
  }

  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    const isWebKit = engine.toLowerCase() === 'webkit';
    const userAgent = isWebKit
      ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15 Toccata/1.0'
      : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Toccata/1.0';

    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      redirect: 'follow'
    });

    const contentType = upstream.headers.get('content-type') || 'text/html';

    // Strip frame-blocking and security headers
    res.setHeader('Content-Type', contentType);
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('Content-Security-Policy-Report-Only');
    res.removeHeader('Cross-Origin-Resource-Policy');
    res.removeHeader('Cross-Origin-Opener-Policy');
    res.setHeader('X-Horizon-Engine', isWebKit ? 'WebKit-605.1.15' : 'Chromium-131.0');

    if (contentType.includes('text/html')) {
      let html = await upstream.text();

      // Inject <base> tag so relative CSS/JS/images resolve to original host
      const baseTag = `<base href="${targetUrl}">`;
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}`);
      } else if (html.includes('<HEAD>')) {
        html = html.replace('<HEAD>', `<HEAD>${baseTag}`);
      } else {
        html = baseTag + html;
      }

      // Inject minimal sovereign status badge at the top
      const engineBadge = `
        <div id="toccata-engine-banner" style="position: sticky; top: 0; left: 0; right: 0; z-index: 2147483647; background: ${isWebKit ? '#007aff' : '#5856d6'}; color: #ffffff; padding: 6px 14px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.18);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #34c759;"></span>
            <span>Horizon Sovereign Engine: <strong>${isWebKit ? 'Apple WebKit 605.1.15 (Safari)' : 'Chromium 131 (Blink Turbo)'}</strong></span>
            <span style="opacity: 0.8; font-weight: 400;">&bull; Zero Telemetry Active</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <a href="${targetUrl}" target="_blank" style="color: #ffffff; text-decoration: underline; opacity: 0.9;">Open Direct &rarr;</a>
            <span onclick="document.getElementById('toccata-engine-banner').style.display='none'" style="cursor: pointer; opacity: 0.8; font-size: 14px; padding: 0 4px;" title="Dismiss">&times;</span>
          </div>
        </div>
      `;

      if (html.includes('<body')) {
        html = html.replace(/<body[^>]*>/i, (match) => `${match}${engineBadge}`);
      } else {
        html = engineBadge + html;
      }

      return res.status(upstream.status).send(html);
    } else {
      // Non-HTML media/assets: buffer and stream
      const buffer = await upstream.arrayBuffer();
      return res.status(upstream.status).send(Buffer.from(buffer));
    }
  } catch (err) {
    return res.status(502).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Horizon Gateway Error</title></head>
        <body style="font-family: -apple-system, system-ui; padding: 50px 20px; text-align: center; color: #1d1d1f; background: #f5f5f7;">
          <div style="max-width: 480px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 18px; box-shadow: 0 8px 30px rgba(0,0,0,0.08);">
            <div style="width: 48px; height: 48px; margin: 0 auto 16px; border-radius: 50%; background: rgba(255, 59, 48, 0.12); color: #ff3b30; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold;">!</div>
            <h3 style="margin: 0 0 8px;">Failed to Load Destination</h3>
            <p style="color: #6e6e73; font-size: 13px; line-height: 1.5; margin: 0 0 20px;">Horizon could not connect to <code>${targetUrl}</code> (${err.message}). The remote host may be offline or unreachable.</p>
            <a href="${targetUrl}" target="_blank" style="display: inline-block; background: #007aff; color: #ffffff; padding: 8px 18px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 600;">Open in External Tab</a>
          </div>
        </body>
      </html>
    `);
  }
}
