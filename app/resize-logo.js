// Resize and optimize RTG logo for PDF embedding
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

async function resizeLogo() {
  try {
    const logoPath = path.join(__dirname, 'public', 'rtg-logo.png');
    const image = await loadImage(logoPath);
    
    // Create a smaller canvas (reduce to 120x60 pixels - small enough for PDF)
    const canvas = createCanvas(120, 60);
    const ctx = canvas.getContext('2d');
    
    // Draw resized image
    ctx.drawImage(image, 0, 0, 120, 60);
    
    // Convert to base64
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    const dataUri = `data:image/png;base64,${base64}`;
    
    console.log('Resized Logo Base64:');
    console.log('==========================================');
    console.log(dataUri);
    console.log('==========================================');
    console.log(`\nOriginal size: ${image.width}x${image.height}`);
    console.log(`New size: 120x60`);
    console.log(`Base64 length: ${dataUri.length} characters`);
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nCanvas module not installed. Using alternative method...');
    
    // Fallback: Just read and encode the original (jsPDF should handle it)
    const logoPath = path.join(__dirname, 'public', 'rtg-logo.png');
    const imageBuffer = fs.readFileSync(logoPath);
    const base64Image = imageBuffer.toString('base64');
    const dataUri = `data:image/png;base64,${base64Image}`;
    
    console.log('\nUsing original logo (will be resized in PDF):');
    console.log(`Base64 length: ${dataUri.length} characters`);
  }
}

resizeLogo();
