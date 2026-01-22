// postlio_frontend/scripts/generate-icons.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
    { name: 'favicon-16.png', size: 16 },
    { name: 'favicon-32.png', size: 32 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
];

const inputSvg = path.join(__dirname, '../public/icon.svg');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
    console.log('🎨 Generating PWA icons from icon.svg...\n');

    // Sprawdź czy plik SVG istnieje
    if (!fs.existsSync(inputSvg)) {
        console.error('❌ Error: public/icon.svg not found!');
        console.log('Please create an SVG icon first.');
        process.exit(1);
    }

    for (const { name, size } of sizes) {
        try {
            await sharp(inputSvg)
                .resize(size, size)
                .png()
                .toFile(path.join(outputDir, name));

            console.log(`✅ Generated: ${name} (${size}x${size})`);
        } catch (error) {
            console.error(`❌ Error generating ${name}:`, error.message);
        }
    }

    // Generuj favicon.ico (kopia 32x32)
    try {
        await sharp(inputSvg)
            .resize(32, 32)
            .toFile(path.join(outputDir, 'favicon.ico'));
        console.log('✅ Generated: favicon.ico (32x32)');
    } catch (error) {
        console.error('❌ Error generating favicon.ico:', error.message);
    }

    // Generuj maskable icon (z padding dla Android)
    try {
        const maskableSize = 512;
        const iconSize = Math.floor(maskableSize * 0.8); // 80% of total size
        const padding = Math.floor((maskableSize - iconSize) / 2);

        await sharp({
            create: {
                width: maskableSize,
                height: maskableSize,
                channels: 4,
                background: { r: 37, g: 99, b: 235, alpha: 1 } // #2563EB - Primary Blue
            }
        })
            .composite([{
                input: await sharp(inputSvg)
                    .resize(iconSize, iconSize)
                    .toBuffer(),
                top: padding,
                left: padding
            }])
            .png()
            .toFile(path.join(outputDir, 'icon-maskable-512.png'));

        console.log('✅ Generated: icon-maskable-512.png (512x512 maskable)');
    } catch (error) {
        console.error('❌ Error generating maskable icon:', error.message);
    }

    console.log('\n🎉 All icons generated successfully!');
    console.log('📁 Output directory:', outputDir);
}

generateIcons();