/**
 * This script creates basic icon images for the navigation bar
 * Run it with Node.js to generate the icon files
 */

const fs = require('fs');
const { createCanvas } = require('canvas');

// Define icons to create
const icons = [
  { name: 'home', color: '#0000FF', symbol: '⌂' },
  { name: 'about', color: '#0000FF', symbol: 'i' },
  { name: 'art', color: '#0000FF', symbol: '✎' },
  { name: 'writing', color: '#0000FF', symbol: '✓' },
  { name: 'journal', color: '#0000FF', symbol: '✧' },
  { name: 'other', color: '#0000FF', symbol: '⚙' },
  { name: 'basement', color: '#0000FF', symbol: '▼' },
  { name: 'random', color: '#0000FF', symbol: '?' },
  { name: 'fight', color: '#FF00FF', symbol: '⚔' },
];

// Create directory if it doesn't exist
const dir = '../images';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

// Create each icon
icons.forEach(icon => {
  // Create canvas
  const canvas = createCanvas(16, 16);
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.fillStyle = '#CCCCCC';
  ctx.fillRect(0, 0, 16, 16);
  
  // Draw border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, 15, 15);
  
  // Draw symbol
  ctx.fillStyle = icon.color;
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon.symbol, 8, 8);
  
  // Save as GIF (simulated - actually PNG)
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`${dir}/${icon.name}.gif`, buffer);
  
  console.log(`Created ${icon.name}.gif`);
});

// Create placeholder GIFs for other images
const placeholders = [
  { name: 'stop-making-sense', width: 400, height: 100, color: '#FF0000' },
  { name: 'frog', width: 88, height: 31, color: '#00FF00' },
  { name: 'chappell', width: 88, height: 31, color: '#FF00FF' },
  { name: 'same-as-ever', width: 88, height: 31, color: '#0000FF' },
  { name: 'computer', width: 100, height: 100, color: '#999999' },
];

placeholders.forEach(placeholder => {
  // Create canvas
  const canvas = createCanvas(placeholder.width, placeholder.height);
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.fillStyle = placeholder.color;
  ctx.fillRect(0, 0, placeholder.width, placeholder.height);
  
  // Draw text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(placeholder.name, placeholder.width / 2, placeholder.height / 2);
  
  // Save as GIF (simulated - actually PNG)
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`${dir}/${placeholder.name}.gif`, buffer);
  
  console.log(`Created ${placeholder.name}.gif`);
});

console.log('All icons created successfully!');
