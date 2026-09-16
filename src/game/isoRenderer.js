// src/game/isoRenderer.js

/**
 * 3D Isometric Character Renderer for Menu Previews and Carousel
 */
export function drawIsoBlock(ctx, x, y, size = 60, angle = 0, skinId = 'cyan_cube') {
  ctx.save();
  ctx.translate(x, y);

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Isometric projection constants
  const isoX = size * 0.8;
  const isoY = size * 0.45;
  const height = size * 0.7;

  // Shadow on ground
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, height * 0.65, isoX * 1.1, isoY * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Pick skin colors and features
  let topColor = '#00e5ff';
  let leftColor = '#00b4d8';
  let rightColor = '#0077b6';

  if (skinId === 'cake') {
    topColor = '#ffb6c1';
    leftColor = '#ff9aa2';
    rightColor = '#e07a82';
  } else if (skinId === 'mouse') {
    topColor = '#e2e8f0';
    leftColor = '#cbd5e1';
    rightColor = '#94a3b8';
  } else if (skinId === 'rhino') {
    topColor = '#94a3b8';
    leftColor = '#64748b';
    rightColor = '#475569';
  } else if (skinId === 'gold') {
    topColor = '#fde047';
    leftColor = '#eab308';
    rightColor = '#ca8a04';
  } else if (skinId === 'red_box') {
    topColor = '#ff6b6b';
    leftColor = '#ee5253';
    rightColor = '#d63031';
  }

  // Draw 3D Box Faces
  // Left Face
  ctx.fillStyle = leftColor;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-isoX, -isoY * 0.5);
  ctx.lineTo(-isoX, height - isoY * 0.5);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Right Face
  ctx.fillStyle = rightColor;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(isoX, -isoY * 0.5);
  ctx.lineTo(isoX, height - isoY * 0.5);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Top Face
  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(0, -isoY);
  ctx.lineTo(isoX, -isoY * 0.5);
  ctx.lineTo(0, 0);
  ctx.lineTo(-isoX, -isoY * 0.5);
  ctx.closePath();
  ctx.fill();

  // Specific Skin Decorative Features
  if (skinId === 'cyan_cube' || skinId === 'starter') {
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.beginPath();
    ctx.moveTo(-isoX * 0.48, -isoY * 0.62);
    ctx.lineTo(isoX * 0.18, -isoY * 0.78);
    ctx.lineTo(isoX * 0.42, -isoY * 0.62);
    ctx.lineTo(-isoX * 0.22, -isoY * 0.46);
    ctx.closePath();
    ctx.fill();
  } else if (skinId === 'cake') {
    // Sprinkles on top
    const sprinkles = [
      { x: -14, y: -isoY * 0.6, c: '#00f0ff' },
      { x: 12, y: -isoY * 0.5, c: '#fde047' },
      { x: -4, y: -isoY * 0.3, c: '#22c55e' },
      { x: 8, y: -isoY * 0.8, c: '#ffffff' }
    ];
    sprinkles.forEach(s => {
      ctx.fillStyle = s.c;
      ctx.fillRect(s.x, s.y, 4, 3);
    });
  } else if (skinId === 'mouse') {
    // Pink inner ears
    ctx.fillStyle = '#ffccd5';
    ctx.beginPath();
    ctx.ellipse(-isoX * 0.7, -isoY - 10, 8, 14, -0.3, 0, Math.PI * 2);
    ctx.ellipse(isoX * 0.7, -isoY - 10, 8, 14, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Pink nose
    ctx.fillStyle = '#ff758f';
    ctx.beginPath();
    ctx.arc(0, height * 0.4, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
