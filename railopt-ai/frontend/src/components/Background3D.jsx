import React, { useEffect, useRef } from 'react';

/**
 * Background3D - High-Performance 3D Railway Corridor & Telemetry Canvas
 * Renders an animated 3D perspective digital twin of railway tracks,
 * overhead catenary signaling gantries, moving light pulses (train packets),
 * and depth particles with interactive mouse parallax.
 */
export default function Background3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse parallax target & current values
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // Track corridor configuration
    const fov = 380;
    const maxZ = 2400;
    const minZ = 120;
    let speed = 4.2; // Forward movement speed
    let offsetZ = 0;

    // 4 Tracks: offsets along X axis in 3D world space
    const trackOffsets = [-340, -115, 115, 340];
    const railGauge = 48; // distance between 2 rails of the same track

    // Train Pulses (Light packets traveling along tracks)
    const pulses = [
      { trackIdx: 1, z: 2200, speed: 14, color: '#00e5ff', length: 180, headRadius: 4 },
      { trackIdx: 2, z: 800, speed: -11, color: '#38bdf8', length: 160, headRadius: 3.5 },
      { trackIdx: 0, z: 1600, speed: 8, color: '#10b981', length: 140, headRadius: 3 },
      { trackIdx: 3, z: 400, speed: 12, color: '#00daf3', length: 190, headRadius: 4 },
      { trackIdx: 2, z: 2300, speed: -15, color: '#a78bfa', length: 150, headRadius: 3.5 },
    ];

    // Atmospheric 3D Depth Particles
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * 1800,
      y: -Math.random() * 500 - 40, // Floating above tracks
      z: Math.random() * maxZ + minZ,
      radius: Math.random() * 1.6 + 0.6,
      opacity: Math.random() * 0.5 + 0.2,
      driftX: (Math.random() - 0.5) * 0.4,
      driftY: (Math.random() - 0.5) * 0.3,
    }));

    // Projection helper: (x, y, z) -> screen (sx, sy, scale)
    const project = (x, y, z, vanishX, vanishY) => {
      const scale = fov / (fov + z);
      return {
        x: vanishX + x * scale,
        y: vanishY + y * scale,
        scale,
      };
    };

    let lastTime = performance.now();

    const render = (time) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Smooth mouse parallax lerp
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      const vanishX = width / 2 + (mouseX - width / 2) * 0.08;
      const vanishY = height * 0.38 + (mouseY - height / 2) * 0.05;
      const groundY = 240; // World Y level of tracks below vanishing point

      offsetZ = (offsetZ + speed * 60 * delta) % 120;

      // Clear with dark tech gradient
      ctx.clearRect(0, 0, width, height);

      // 1. Ambient Background Glow
      const bgGrad = ctx.createRadialGradient(
        vanishX,
        vanishY + 20,
        20,
        vanishX,
        vanishY + 100,
        width * 0.75
      );
      bgGrad.addColorStop(0, 'rgba(0, 229, 255, 0.06)');
      bgGrad.addColorStop(0.35, 'rgba(0, 80, 100, 0.03)');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Horizon Guide Line
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, vanishY);
      ctx.lineTo(width, vanishY);
      ctx.stroke();

      // 3. Render 3D Railway Sleepers (Cross Ties)
      const sleeperStep = 60;
      ctx.lineWidth = 1.5;
      for (let z = maxZ; z >= minZ; z -= sleeperStep) {
        const actualZ = z - offsetZ;
        if (actualZ < minZ || actualZ > maxZ) continue;

        const pLeft = project(-420, groundY, actualZ, vanishX, vanishY);
        const pRight = project(420, groundY, actualZ, vanishX, vanishY);

        const alpha = Math.min(1, Math.max(0, (maxZ - actualZ) / (maxZ * 0.7))) * 0.35;
        ctx.strokeStyle = `rgba(0, 229, 255, ${alpha.toFixed(3)})`;

        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.stroke();
      }

      // 4. Render 3D Steel Rails
      trackOffsets.forEach((cx, tIdx) => {
        const isExpress = tIdx === 1 || tIdx === 2;
        const leftX = cx - railGauge / 2;
        const rightX = cx + railGauge / 2;

        const pNearL = project(leftX, groundY, minZ, vanishX, vanishY);
        const pFarL = project(leftX, groundY, maxZ, vanishX, vanishY);
        const pNearR = project(rightX, groundY, minZ, vanishX, vanishY);
        const pFarR = project(rightX, groundY, maxZ, vanishX, vanishY);

        // Rail Lines
        ctx.strokeStyle = isExpress ? 'rgba(0, 229, 255, 0.75)' : 'rgba(0, 210, 245, 0.50)';
        ctx.lineWidth = isExpress ? 2.2 : 1.6;

        ctx.beginPath();
        ctx.moveTo(pFarL.x, pFarL.y);
        ctx.lineTo(pNearL.x, pNearL.y);
        ctx.moveTo(pFarR.x, pFarR.y);
        ctx.lineTo(pNearR.x, pNearR.y);
        ctx.stroke();

        // Ballast Bed Center Guide
        const pFarC = project(cx, groundY, maxZ, vanishX, vanishY);
        const pNearC = project(cx, groundY, minZ, vanishX, vanishY);
        ctx.setLineDash([8, 16]);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pFarC.x, pFarC.y);
        ctx.lineTo(pNearC.x, pNearC.y);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 5. Overhead 3D Catenary Gantries (Electrification Portals)
      const gantryInterval = 600;
      const gantryHeight = -160; // Above groundY
      for (let z = maxZ; z >= minZ; z -= gantryInterval) {
        const actualZ = z - (offsetZ * 2.5) % gantryInterval;
        if (actualZ < minZ || actualZ > maxZ) continue;

        const pBaseL = project(-440, groundY, actualZ, vanishX, vanishY);
        const pTopL = project(-440, groundY + gantryHeight, actualZ, vanishX, vanishY);
        const pBaseR = project(440, groundY, actualZ, vanishX, vanishY);
        const pTopR = project(440, groundY + gantryHeight, actualZ, vanishX, vanishY);

        const alpha = Math.min(1, Math.max(0, (maxZ - actualZ) / (maxZ * 0.85))) * 0.40;

        ctx.strokeStyle = `rgba(0, 229, 255, ${alpha.toFixed(3)})`;
        ctx.lineWidth = Math.max(1, pBaseL.scale * 4.5);

        // Frame: Left Pillar, Right Pillar, Top Crossbeam
        ctx.beginPath();
        ctx.moveTo(pBaseL.x, pBaseL.y);
        ctx.lineTo(pTopL.x, pTopL.y);
        ctx.lineTo(pTopR.x, pTopR.y);
        ctx.lineTo(pBaseR.x, pBaseR.y);
        ctx.stroke();

        // Signal Beacons on Crossbeam
        trackOffsets.forEach((cx, idx) => {
          const pSig = project(cx, groundY + gantryHeight + 15, actualZ, vanishX, vanishY);
          const sigRadius = Math.max(2, pSig.scale * 6);
          const sigColor = idx === 1 ? 'rgba(16, 185, 129, ' : 'rgba(0, 229, 255, ';

          ctx.fillStyle = sigColor + (alpha * 1.8).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(pSig.x, pSig.y, sigRadius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // 6. Animated Train Telemetry Light Pulses
      pulses.forEach((pulse) => {
        pulse.z += pulse.speed * 60 * delta;
        if (pulse.z < minZ) pulse.z = maxZ;
        if (pulse.z > maxZ) pulse.z = minZ;

        const cx = trackOffsets[pulse.trackIdx];
        const pHead = project(cx, groundY, pulse.z, vanishX, vanishY);
        const tailZ = pulse.z + (pulse.speed > 0 ? -pulse.length : pulse.length);
        const pTail = project(cx, groundY, tailZ, vanishX, vanishY);

        // Streak Gradient
        const grad = ctx.createLinearGradient(pTail.x, pTail.y, pHead.x, pHead.y);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, pulse.color);

        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(2.5, pHead.scale * 8.5);
        ctx.beginPath();
        ctx.moveTo(pTail.x, pTail.y);
        ctx.lineTo(pHead.x, pHead.y);
        ctx.stroke();

        // Luminous Head Point
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = pulse.color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(pHead.x, pHead.y, Math.max(2.5, pHead.scale * pulse.headRadius * 3), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 7. Atmospheric 3D Depth Dust / Data Nodes
      particles.forEach((p) => {
        p.z -= speed * 40 * delta;
        if (p.z < minZ) {
          p.z = maxZ;
          p.x = (Math.random() - 0.5) * 1800;
        }
        p.x += p.driftX;
        p.y += p.driftY;

        const proj = project(p.x, p.y, p.z, vanishX, vanishY);
        const rad = Math.max(0.8, proj.scale * p.radius * 3.5);
        const alpha = Math.min(1, Math.max(0, (maxZ - p.z) / maxZ)) * p.opacity * 1.4;

        ctx.fillStyle = `rgba(0, 229, 255, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, rad, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 3D Hardware-Accelerated Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Crystal Clear Cinematic Gradient - Allows 3D Tracks & Moving Signals to Shine Through */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050b0d]/20 via-transparent to-[#050b0d]/50 pointer-events-none"></div>
      <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none"></div>
    </div>
  );
}
