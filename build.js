const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'www');

// 1. Tạo thư mục www nếu chưa có
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 2. Danh sách các file cần sao chép
const filesToCopy = [
  'index.html',
  'style.css',
  'app.js',
  'db.js',
  'sw.js',
  'manifest.json'
];

filesToCopy.forEach((file) => {
  const src = path.join(__dirname, file);
  const dest = path.join(targetDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied: ${file} -> www/${file}`);
  } else {
    console.warn(`! Missing file: ${file}`);
  }
});

// 3. Sao chép thư mục icons
const iconsSrc = path.join(__dirname, 'icons');
const iconsDest = path.join(targetDir, 'icons');
if (fs.existsSync(iconsSrc)) {
  if (!fs.existsSync(iconsDest)) {
    fs.mkdirSync(iconsDest, { recursive: true });
  }
  const icons = fs.readdirSync(iconsSrc);
  icons.forEach((icon) => {
    fs.copyFileSync(path.join(iconsSrc, icon), path.join(iconsDest, icon));
  });
  console.log(`✓ Copied ${icons.length} icons into www/icons/`);
}

console.log('✨ Build web assets to www/ completed successfully!');
