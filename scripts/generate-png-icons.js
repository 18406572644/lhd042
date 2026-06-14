import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconDir = path.join(__dirname, '..', 'src-tauri', 'icons');
const sourceSvg = path.join(iconDir, '512x512.svg');

const svgSizes = [
  { name: '32x32.png', size: 32 },
  { name: '128x128.png', size: 128 },
  { name: '256x256.png', size: 256 },
  { name: '512x512.png', size: 512 }
];

async function generateIco(pngPaths, outputPath) {
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);
  icoHeader.writeUInt16LE(1, 2);
  icoHeader.writeUInt16LE(pngPaths.length, 4);

  const entries = [];
  let dataOffset = 6 + 16 * pngPaths.length;

  const imageBuffers = [];
  for (const pngPath of pngPaths) {
    const buf = fs.readFileSync(pngPath);
    imageBuffers.push(buf);
  }

  for (let i = 0; i < pngPaths.length; i++) {
    const size = [32, 128, 256, 512][i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(imageBuffers[i].length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    entries.push(entry);
    dataOffset += imageBuffers[i].length;
  }

  const icoBuffer = Buffer.concat([icoHeader, ...entries, ...imageBuffers]);
  fs.writeFileSync(outputPath, icoBuffer);
}

async function main() {
  try {
    const svgBuffer = fs.readFileSync(sourceSvg);

    const generatedPngs = [];
    for (const { name, size } of svgSizes) {
      const outputPath = path.join(iconDir, name);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✓ 生成: ${name} (${size}x${size})`);
      generatedPngs.push(outputPath);
    }

    const icoOutput = path.join(iconDir, 'icon.ico');
    await generateIco(generatedPngs, icoOutput);
    console.log(`✓ 生成: icon.ico`);

    try {
      const largestPng = fs.readFileSync(generatedPngs[3]);
      fs.writeFileSync(path.join(iconDir, 'icon.icns'), largestPng);
      console.log(`✓ 生成: icon.icns (placeholder)`);
    } catch (e) {
      console.log(`⚠ 跳过 icon.icns 生成: ${e.message}`);
    }

    console.log('\n✅ 所有图标生成完成！');
  } catch (error) {
    console.error('❌ 生成图标失败:', error);
    process.exit(1);
  }
}

main();
