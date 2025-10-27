const fs = require('fs');
const path = require('path');

// Get current timestamp
const buildTime = Date.now();

console.log(`Build time: ${buildTime} (${new Date(buildTime).toISOString()})`);

// Files to update
const filesToUpdate = [
  'index.html',
  'home/index.html'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Inject build time as a script tag
    const buildScript = `
    <script>
      window.BUILD_TIME = ${buildTime};
      window.VERCEL_BUILD_TIME = ${buildTime};
    </script>`;
    
    // Insert before the closing </head> tag
    content = content.replace('</head>', `${buildScript}\n</head>`);
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file} with build time: ${buildTime}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('Build completed successfully!');
