import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import html2canvas from 'npm:html2canvas@1.4.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { health_score, score_label, biomarkers } = payload;

    if (health_score === undefined) {
      return Response.json({ error: 'Missing health_score' }, { status: 400 });
    }

    // Calculate ring color based on score
    const getScoreColor = (score) => {
      if (score >= 80) return '#10b981';
      if (score >= 60) return '#f59e0b';
      return '#ef4444';
    };

    const scoreColor = getScoreColor(health_score);
    const currentDate = new Date();
    const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // HTML template for the score card
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: white;
            padding: 0;
            margin: 0;
          }
          .card {
            width: 1080px;
            height: 1080px;
            background: linear-gradient(135deg, #f3f0ff 0%, #faf5ff 100%);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 60px;
            position: relative;
            overflow: hidden;
          }
          .card::before {
            content: '';
            position: absolute;
            width: 400px;
            height: 400px;
            background: rgba(168, 85, 247, 0.1);
            border-radius: 50%;
            top: -100px;
            right: -100px;
          }
          .card::after {
            content: '';
            position: absolute;
            width: 300px;
            height: 300px;
            background: rgba(79, 70, 229, 0.08);
            border-radius: 50%;
            bottom: -80px;
            left: -80px;
          }
          .header {
            display: flex;
            align-items: center;
            gap: 15px;
            position: relative;
            z-index: 1;
          }
          .logo-img {
            width: 50px;
            height: 50px;
            border-radius: 8px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #4f46e5;
            font-size: 28px;
          }
          .brand {
            display: flex;
            flex-direction: column;
          }
          .brand-name {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            letter-spacing: -0.5px;
          }
          .brand-tagline {
            font-size: 12px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .score-section {
            text-align: center;
            position: relative;
            z-index: 1;
          }
          .user-name {
            font-size: 28px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 30px;
          }
          .score-ring {
            width: 280px;
            height: 280px;
            margin: 0 auto 30px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .score-ring-bg {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: white;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
            position: absolute;
            top: 0;
            left: 0;
          }
          .score-ring-progress {
            width: 260px;
            height: 260px;
            border-radius: 50%;
            background: conic-gradient(${scoreColor} 0deg ${health_score * 3.6}deg, #e5e7eb ${health_score * 3.6}deg);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 2;
          }
          .score-inner {
            width: 240px;
            height: 240px;
            border-radius: 50%;
            background: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .score-number {
            font-size: 72px;
            font-weight: 700;
            color: ${scoreColor};
            line-height: 1;
          }
          .score-max {
            font-size: 20px;
            color: #9ca3af;
            margin-top: 5px;
          }
          .score-label {
            font-size: 18px;
            font-weight: 600;
            color: ${scoreColor};
            margin-top: 15px;
            letter-spacing: 0.5px;
          }
          .biomarkers {
            display: flex;
            flex-direction: column;
            gap: 12px;
            position: relative;
            z-index: 1;
            margin: 30px 0;
          }
          .biomarker {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: white;
            border-radius: 8px;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          }
          .biomarker-icon {
            font-size: 18px;
            min-width: 20px;
          }
          .biomarker-text {
            color: #374151;
            font-weight: 500;
          }
          .footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            z-index: 1;
          }
          .footer-left {
            display: flex;
            flex-direction: column;
          }
          .tagline {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
          }
          .date {
            font-size: 12px;
            color: #9ca3af;
          }
          .qr-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }
          .qr-code {
            width: 100px;
            height: 100px;
            background: white;
            border-radius: 8px;
            padding: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #9ca3af;
            text-align: center;
            font-weight: 500;
          }
          .url-text {
            font-size: 11px;
            color: #6b7280;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo-img">VP</div>
            <div class="brand">
              <div class="brand-name">VitaPlate</div>
              <div class="brand-tagline">Health Score</div>
            </div>
          </div>

          <div class="score-section">
            <div class="user-name">${user.full_name.split(' ')[0]}'s Health Score</div>
            
            <div class="score-ring">
              <div class="score-ring-bg"></div>
              <div class="score-ring-progress">
                <div class="score-inner">
                  <div class="score-number">${health_score}</div>
                  <div class="score-max">/100</div>
                </div>
              </div>
            </div>

            <div class="score-label">${score_label || 'Great Health'}</div>

            <div class="biomarkers">
              ${biomarkers.map(b => {
                const icons = {
                  'optimal': '✅',
                  'good': '✅',
                  'warning': '⚠️',
                  'low': '❌'
                };
                return `
                  <div class="biomarker">
                    <div class="biomarker-icon">${icons[b.status] || '●'}</div>
                    <div class="biomarker-text">${b.name}: ${b.status === 'optimal' ? 'Optimal' : b.status === 'good' ? 'Good' : b.status === 'warning' ? 'Warning' : 'Low'}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="footer">
            <div class="footer-left">
              <div class="tagline">Eating smarter with VitaPlate</div>
              <div class="date">${monthYear}</div>
            </div>
            <div class="qr-section">
              <div class="qr-code">vitaplate.app</div>
              <div class="url-text">Join VitaPlate</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create canvas from HTML
    const canvas = await html2canvas(htmlContent, {
      width: 1080,
      height: 1080,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });

    // Convert canvas to PNG buffer
    const imageData = canvas.toDataURL('image/png');

    return Response.json({
      success: true,
      image: imageData
    });
  } catch (error) {
    console.error('Error generating score image:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});