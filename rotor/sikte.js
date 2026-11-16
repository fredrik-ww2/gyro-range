// Siktet ritas i skärmen, inte som en projicerad världspunkt.
// yaw och pitch är radianer från getAimOffset. bore är sikteslinjen i vila.

export function siktePaSkarm({ yaw = 0, pitch = 0, bore = 0, maxYaw = 1, maxPitch = 1, width = 390, height = 844, margin = 10 } = {}) {
  const nx = clamp((yaw || 0) / (maxYaw || 1));
  const ny = clamp(((pitch || 0) - (bore || 0)) / (maxPitch || 1));
  const x = clamp(width * 0.5 + nx * width * 0.28, margin, width - margin);
  const y = clamp(height * 0.4 - ny * height * 0.18, margin, height - margin);
  return { x, y, nx, ny };
}

function clamp(v, a = -1, b = 1) {
  return Math.max(a, Math.min(b, v));
}
