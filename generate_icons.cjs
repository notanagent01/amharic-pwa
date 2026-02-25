const sharp = require('sharp');
const fs = require('fs');

async function generateIcon(size) {
    const svg = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${size}" height="${size}" fill="#0f0f1a" rx="${size / 2}" ry="${size / 2}"/>
            <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - size * 0.05}" fill="none" stroke="#e94560" stroke-width="${size * 0.05}"/>
            <text x="${size / 2}" y="${size / 2 + size * 0.15}" font-family="Noto Sans Ethiopic, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">ቋ</text>
        </svg>
    `;

    try {
        await sharp(Buffer.from(svg))
            .png()
            .toFile(`./public/icon-${size}.png`);
        console.log(`Generated icon-${size}.png`);
    } catch (err) {
        console.error(`Failed to generate icon-${size}.png:`, err);
    }
}

async function main() {
    await generateIcon(192);
    await generateIcon(512);
}

main();
