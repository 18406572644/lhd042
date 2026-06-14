import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [
  { name: '32x32.svg', size: 32 },
  { name: '128x128.svg', size: 128 },
  { name: '256x256.svg', size: 256 },
  { name: '512x512.svg', size: 512 }
];

const iconDir = path.join(__dirname, '..', 'src-tauri', 'icons');

if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

const generateIcon = (size) => {
  const r = size * 0.15;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FAF8F3"/>
      <stop offset="100%" style="stop-color:#F5F0E6"/>
    </linearGradient>
    <linearGradient id="leaf" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#8FA978"/>
      <stop offset="100%" style="stop-color:#6B8E5A"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
  <path d="M${size/2} ${size*0.12} C${size*0.3} ${size*0.25} ${size*0.22} ${size*0.47} ${size/2} ${size*0.8} C${size*0.78} ${size*0.47} ${size*0.7} ${size*0.25} ${size/2} ${size*0.12}Z" fill="url(#leaf)"/>
  <path d="M${size/2} ${size*0.22} L${size/2} ${size*0.7}" stroke="#8B7355" stroke-width="${size*0.02}" stroke-linecap="round" fill="none"/>
  <ellipse cx="${size*0.34}" cy="${size*0.4}" rx="${size*0.11}" ry="${size*0.055}" fill="#A9C094" transform="rotate(-25 ${size*0.34} ${size*0.4})"/>
  <ellipse cx="${size*0.66}" cy="${size*0.46}" rx="${size*0.11}" ry="${size*0.055}" fill="#A9C094" transform="rotate(25 ${size*0.66} ${size*0.46})"/>
  <ellipse cx="${size*0.38}" cy="${size*0.55}" rx="${size*0.08}" ry="${size*0.04}" fill="#A9C094" transform="rotate(-20 ${size*0.38} ${size*0.55})"/>
  <circle cx="${size*0.32}" cy="${size*0.22}" r="${size*0.03}" fill="#E8B4B8"/>
  <circle cx="${size*0.68}" cy="${size*0.26}" r="${size*0.025}" fill="#F4D03F"/>
  <circle cx="${size/2}" cy="${size*0.17}" r="${size*0.03}" fill="#E8B4B8"/>
</svg>`;
};

sizes.forEach(item => {
  const filePath = path.join(iconDir, item.name);
  const svgContent = generateIcon(item.size);
  fs.writeFileSync(filePath, svgContent);
  console.log(`✓ 生成: ${item.name} (${item.size}x${item.size})`);
});

console.log('\n✅ SVG 图标生成完成！');
console.log('\n📌 如需生成 PNG/ICO 格式图标用于 Tauri 构建，请使用以下方法：');
console.log('   方法 1: 使用 Tauri 官方工具');
console.log('           npm install -g @tauri-apps/cli');
console.log('           npm run tauri icon src-tauri/icons/512x512.svg');
console.log('');
console.log('   方法 2: 使用 sharp 库自动生成');
console.log('           npm install sharp -D');
console.log('           然后运行 node scripts/generate-png-icons.js');
console.log('');
console.log('   方法 3: 使用在线转换工具 (如 convertio.co) 将 SVG 转为 PNG/ICO');
