/**
 * Starfield Animation
 * Creates a twinkling star background with a moon
 */
document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return; // Canvas should exist in the HTML

  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Create stars
  const stars = [];

  // Generate random stars
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }
  
  // Add a few larger stars
  for (let i = 0; i < 20; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1.5,
      opacity: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.03 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }

  // Add moon
  const drawMoon = () => {
    const moonX = 60;
    const moonY = 60;
    const moonRadius = 30;
    
    // Moon glow
    const gradient = ctx.createRadialGradient(
      moonX, moonY, moonRadius * 0.9,
      moonX, moonY, moonRadius * 2.5
    );
    gradient.addColorStop(0, 'rgba(180, 180, 220, 0.5)');
    gradient.addColorStop(1, 'rgba(180, 180, 220, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius * 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Moon body
    ctx.fillStyle = 'rgba(220, 220, 240, 1)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();
  };

  // Animation loop
  const animate = () => {
    // Use pure black background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000'; // Pure black background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw moon
    drawMoon();

    stars.forEach(star => {
      // Update twinkle phase
      star.twinklePhase += star.twinkleSpeed;
      
      // Calculate opacity with sine wave for smooth twinkling
      const twinkleOpacity = (Math.sin(star.twinklePhase) + 1) * 0.5;
      const finalOpacity = star.opacity * (0.3 + twinkleOpacity * 0.7);

      // Draw star
      ctx.fillStyle = `rgba(180, 180, 220, ${finalOpacity})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add twinkle effect for larger stars
      if (star.size > 1.5) {
        // Draw cross shape for twinkle effect
        const glowSize = star.size * (0.5 + twinkleOpacity);
        ctx.fillStyle = `rgba(180, 180, 220, ${finalOpacity * 0.5})`;
        
        // Horizontal line
        ctx.fillRect(star.x - glowSize * 2, star.y - glowSize * 0.5, glowSize * 4, glowSize);
        
        // Vertical line
        ctx.fillRect(star.x - glowSize * 0.5, star.y - glowSize * 2, glowSize, glowSize * 4);
      }
    });

    requestAnimationFrame(animate);
  };

  animate();
});