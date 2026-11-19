import { EventConfig, FrameTemplate } from '../types';

export interface ComposeOptions {
  videoOrImage: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement;
  frame: FrameTemplate;
  config: EventConfig;
  mirrored?: boolean;
}

/**
 * Load image from url as HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Draw a decorative golden filigree corner
 */
function drawFloralCorner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scaleX = 1,
  scaleY = 1
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);

  ctx.strokeStyle = '#d4af37';
  ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
  ctx.lineWidth = 2.5;

  // Main flourish curve
  ctx.beginPath();
  ctx.moveTo(10, 80);
  ctx.bezierCurveTo(20, 30, 30, 20, 80, 10);
  ctx.stroke();

  // Corner angle lines
  ctx.beginPath();
  ctx.moveTo(15, 60);
  ctx.lineTo(15, 15);
  ctx.lineTo(60, 15);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Little decorative leaves
  ctx.beginPath();
  ctx.ellipse(32, 32, 12, 6, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Diamond dot
  ctx.beginPath();
  ctx.moveTo(15, 15);
  ctx.lineTo(20, 20);
  ctx.lineTo(15, 25);
  ctx.lineTo(10, 20);
  ctx.closePath();
  ctx.fillStyle = '#fef08a';
  ctx.fill();

  ctx.restore();
}

/**
 * Composite photo with chosen frame and event details into a high-res PNG
 */
export async function composePhotoboothImage({
  videoOrImage,
  frame,
  config,
  mirrored = false,
}: ComposeOptions): Promise<string> {
  const canvas = document.createElement('canvas');
  // High-res canvas (1200 x 1500 for 4:5 ratio)
  const width = 1200;
  const height = 1500;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Define photo viewport window inside frame
  let photoX = 0;
  let photoY = 0;
  let photoW = width;
  let photoH = height;

  if (frame.theme === 'polaroid') {
    photoX = 70;
    photoY = 70;
    photoW = width - 140;
    photoH = height - 320;
  } else if (frame.theme === 'floral') {
    photoX = 55;
    photoY = 120;
    photoW = width - 110;
    photoH = height - 360;
  } else if (frame.theme === 'celebration') {
    photoX = 65;
    photoY = 110;
    photoW = width - 130;
    photoH = height - 350;
  } else {
    // Custom overlay default
    photoX = 40;
    photoY = 40;
    photoW = width - 80;
    photoH = height - 180;
  }

  // Draw background behind photo area
  if (frame.theme === 'polaroid') {
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, width, height);
  } else if (frame.theme === 'celebration') {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = '#0d1322';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw the camera photo into photo cutout
  ctx.save();
  ctx.beginPath();
  ctx.rect(photoX, photoY, photoW, photoH);
  ctx.clip();

  // Calculate object-fit: cover
  let sourceW = 0;
  let sourceH = 0;
  if (videoOrImage instanceof HTMLVideoElement) {
    sourceW = videoOrImage.videoWidth || 1280;
    sourceH = videoOrImage.videoHeight || 720;
  } else {
    sourceW = (videoOrImage as HTMLImageElement).naturalWidth || videoOrImage.width;
    sourceH = (videoOrImage as HTMLImageElement).naturalHeight || videoOrImage.height;
  }

  const sourceAspect = sourceW / sourceH;
  const targetAspect = photoW / photoH;

  let drawW = photoW;
  let drawH = photoH;
  let drawX = photoX;
  let drawY = photoY;

  if (sourceAspect > targetAspect) {
    drawH = photoH;
    drawW = photoH * sourceAspect;
    drawX = photoX - (drawW - photoW) / 2;
  } else {
    drawW = photoW;
    drawH = photoW / sourceAspect;
    drawY = photoY - (drawH - photoH) / 2;
  }

  if (mirrored) {
    ctx.translate(photoX + photoW / 2, photoY + photoH / 2);
    ctx.scale(-1, 1);
    ctx.translate(-(photoX + photoW / 2), -(photoY + photoH / 2));
  }

  ctx.drawImage(videoOrImage, drawX, drawY, drawW, drawH);
  ctx.restore();

  // If custom overlay exists, render it
  if (frame.customOverlayUrl) {
    try {
      const customImg = await loadImage(frame.customOverlayUrl);
      ctx.drawImage(customImg, 0, 0, width, height);
    } catch (e) {
      console.error('Failed to draw custom overlay', e);
    }
  }

  // Render Theme Overlays
  if (frame.theme === 'floral') {
    // Outer border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Inner thin border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Photo frame border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.strokeRect(photoX, photoY, photoW, photoH);

    // Draw floral corner flourishes
    drawFloralCorner(ctx, 45, 45, 1, 1);
    drawFloralCorner(ctx, width - 45, 45, -1, 1);
    drawFloralCorner(ctx, 45, height - 45, 1, -1);
    drawFloralCorner(ctx, width - 45, height - 45, -1, -1);

    // Top Header Badge
    ctx.fillStyle = 'rgba(13, 19, 34, 0.92)';
    ctx.fillRect(width / 2 - 250, 45, 500, 60);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(width / 2 - 250, 45, 500, 60);

    // Header category text
    ctx.fillStyle = '#fef08a';
    ctx.font = '600 22px "Cinzel", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '4px';
    ctx.fillText(config.category.toUpperCase(), width / 2, 83);

    // Bottom Card Panel
    const cardY = photoY + photoH + 20;
    const cardH = height - cardY - 45;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(photoX, cardY, photoW, cardH);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(photoX, cardY, photoW, cardH);

    // Couple / Event Title
    const titleGrad = ctx.createLinearGradient(width / 2 - 200, 0, width / 2 + 200, 0);
    titleGrad.addColorStop(0, '#fef08a');
    titleGrad.addColorStop(0.5, '#d4af37');
    titleGrad.addColorStop(1, '#fde047');

    ctx.fillStyle = titleGrad;
    ctx.font = 'bold 52px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.title, width / 2, cardY + 70);

    // Divider with little diamond
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 150, cardY + 95);
    ctx.lineTo(width / 2 + 150, cardY + 95);
    ctx.stroke();

    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(width / 2, cardY + 95, 4, 0, Math.PI * 2);
    ctx.fill();

    // Date
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(config.date.toUpperCase(), width / 2, cardY + 135);

    // Vendor branding
    ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Virtual Photobooth by ${config.vendorName}`, width / 2, cardY + 175);
  } else if (frame.theme === 'polaroid') {
    // Polaroid Inner photo drop shadow line
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(photoX, photoY, photoW, photoH);

    // Polaroid Bottom Content
    const bottomY = photoY + photoH + 50;

    // Couple / Title in chic script/serif
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 54px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.title, width / 2, bottomY + 50);

    // Subtitle / Date
    ctx.fillStyle = '#64748b';
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${config.category}  •  ${config.date}`, width / 2, bottomY + 105);

    // Romantic Quote (truncated if long)
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 20px "Playfair Display", serif';
    const quoteWords = config.quote.split(' ');
    const shortQuote =
      quoteWords.length > 12 ? quoteWords.slice(0, 12).join(' ') + '...' : config.quote;
    ctx.fillText(`“${shortQuote}”`, width / 2, bottomY + 155);

    // Vendor stamp
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`VIRTUAL PHOTOBOOTH BY ${config.vendorName.toUpperCase()}`, width / 2, bottomY + 205);
  } else if (frame.theme === 'celebration') {
    // Dark luxury with gold sparkles
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 5;
    ctx.strokeRect(35, 35, width - 70, height - 70);

    // Geometric corner brackets
    const bLen = 60;
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#fef08a';

    // Top Left
    ctx.beginPath();
    ctx.moveTo(35, 35 + bLen);
    ctx.lineTo(35, 35);
    ctx.lineTo(35 + bLen, 35);
    ctx.stroke();

    // Top Right
    ctx.beginPath();
    ctx.moveTo(width - 35 - bLen, 35);
    ctx.lineTo(width - 35, 35);
    ctx.lineTo(width - 35, 35 + bLen);
    ctx.stroke();

    // Bottom Left
    ctx.beginPath();
    ctx.moveTo(35, height - 35 - bLen);
    ctx.lineTo(35, height - 35);
    ctx.lineTo(35 + bLen, height - 35);
    ctx.stroke();

    // Bottom Right
    ctx.beginPath();
    ctx.moveTo(width - 35 - bLen, height - 35);
    ctx.lineTo(width - 35, height - 35);
    ctx.lineTo(width - 35, height - 35 - bLen);
    ctx.stroke();

    // Sparkles along top and bottom
    const sparklePoints = [
      [150, 70],
      [width - 150, 70],
      [220, height - 80],
      [width - 220, height - 80],
      [width / 2, 70],
    ];
    sparklePoints.forEach(([sx, sy]) => {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top Ribbon
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 24px "Cinzel", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`★  ${config.category.toUpperCase()}  ★`, width / 2, 80);

    // Bottom Plaque
    const plaqueY = photoY + photoH + 25;
    const plaqueH = height - plaqueY - 50;

    const plaqueGrad = ctx.createLinearGradient(0, plaqueY, 0, plaqueY + plaqueH);
    plaqueGrad.addColorStop(0, '#1c1917');
    plaqueGrad.addColorStop(1, '#0c0a09');

    ctx.fillStyle = plaqueGrad;
    ctx.fillRect(photoX, plaqueY, photoW, plaqueH);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.strokeRect(photoX, plaqueY, photoW, plaqueH);

    // Event title
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 50px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.title, width / 2, plaqueY + 70);

    // Date
    ctx.fillStyle = '#fcd34d';
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(config.date.toUpperCase(), width / 2, plaqueY + 125);

    // Vendor badge
    ctx.fillStyle = '#a8a29e';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Celebration Photobooth • ${config.vendorName}`, width / 2, plaqueY + 168);
  }

  // Draw Logo if provided
  if (config.logoUrl) {
    try {
      const logoImg = await loadImage(config.logoUrl);
      const maxLogoH = 46;
      const logoAspect = logoImg.naturalWidth / (logoImg.naturalHeight || 1);
      const logoW = Math.min(160, maxLogoH * logoAspect);
      const logoH = logoW / logoAspect;
      // Position neatly in the bottom right corner of bottom card
      ctx.drawImage(logoImg, width - photoX - logoW - 10, height - 75, logoW, logoH);
    } catch (e) {
      console.debug('Failed to render logo on composite image', e);
    }
  }

  return canvas.toDataURL('image/png', 0.95);
}
