import { DynamicTexture, RawTexture, Scene, Texture, Color3 } from "@babylonjs/core";

export class ProceduralTextureGenerator {
  /**
   * Generates a seamless procedural normal map for stone/rock/marble surfaces.
   */
  public static createStoneNormalMap(name: string, scene: Scene, size: number = 512, intensity: number = 1.0): Texture {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return new DynamicTexture(name, size, scene, false);
    }

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    // Generate height map using perlin-like multi-scale noise
    const heights = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let val = 0;
        let scale = 0.02;
        let weight = 1.0;
        for (let o = 0; o < 4; o++) {
          const nx = x * scale;
          const ny = y * scale;
          val += (Math.sin(nx) * Math.cos(ny) + Math.sin(nx * 1.7 + ny * 0.9) * 0.5) * weight;
          scale *= 2.2;
          weight *= 0.5;
        }
        heights[y * size + x] = val;
      }
    }

    // Convert height map to Normal Map (RGB -> Normal vector X, Y, Z)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const xLeft = heights[y * size + ((x - 1 + size) % size)];
        const xRight = heights[y * size + ((x + 1) % size)];
        const yUp = heights[((y - 1 + size) % size) * size + x];
        const yDown = heights[((y + 1) % size) * size + x];

        const dx = (xRight - xLeft) * intensity * 2.0;
        const dy = (yDown - yUp) * intensity * 2.0;
        const dz = 1.0;

        // Normalize
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const nx = (dx / len) * 0.5 + 0.5;
        const ny = (dy / len) * 0.5 + 0.5;
        const nz = (dz / len) * 0.5 + 0.5;

        const idx = (y * size + x) * 4;
        data[idx] = Math.floor(nx * 255);
        data[idx + 1] = Math.floor(ny * 255);
        data[idx + 2] = Math.floor(nz * 255);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const dynTexture = new DynamicTexture(name, canvas, scene, true);
    dynTexture.hasAlpha = false;
    return dynTexture;
  }

  /**
   * Generates a procedural marble vein texture.
   */
  public static createMarbleTexture(name: string, scene: Scene, size: number = 512): Texture {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return new DynamicTexture(name, size, scene, false);
    }

    ctx.fillStyle = "#f0eae1";
    ctx.fillRect(0, 0, size, size);

    // Draw veins
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(70, 65, 60, 0.25)";

    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      let x = Math.random() * size;
      let y = 0;
      ctx.moveTo(x, y);

      while (y < size) {
        x += (Math.random() - 0.5) * 35;
        y += Math.random() * 25 + 10;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Overlay soft noise
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 15;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    return new DynamicTexture(name, canvas, scene, true);
  }

  /**
   * Generates a procedural moss/weathering roughness map.
   */
  public static createMossRoughnessMap(name: string, scene: Scene, size: number = 256): Texture {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return new DynamicTexture(name, size, scene, false);
    }

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const val = Math.floor(180 + Math.random() * 75);
        const idx = (y * size + x) * 4;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    return new DynamicTexture(name, canvas, scene, true);
  }
}
