const fs = require('fs-extra');

async function copyStaticAssets() {
  try {
    await fs.copy('src/manifest.json', 'dist/manifest.json');
    await fs.copy('src/options.html', 'dist/options.html');
    await fs.copy('src/options.css', 'dist/options.css');
    await fs.copy('src/icons', 'dist/icons');
    console.log('Static assets copied successfully.');
  } catch (err) {
    console.error('Error copying static assets:', err);
  }
}

copyStaticAssets();
