import { Scene, Effect, ShaderMaterial, Color3, Vector3, StandardMaterial, Material } from "@babylonjs/core";

export class CustomShaderManager {
  private static isWaterShaderRegistered = false;
  private static isAuraShaderRegistered = false;

  /**
   * Creates a custom ancient ocean water material with fallback to StandardMaterial if shaders fail.
   */
  public static createAncientWaterMaterial(scene: Scene): Material {
    try {
      this.registerWaterShader();

      const waterMaterial = new ShaderMaterial(
        "ancientWaterMat",
        scene,
        {
          vertex: "ancientWater",
          fragment: "ancientWater",
        },
        {
          attributes: ["position", "normal", "uv"],
          uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "time", "waveSpeed", "waterColor", "foamColor"],
        }
      );

      let time = 0;
      waterMaterial.setColor3("waterColor", new Color3(0.04, 0.12, 0.18));
      waterMaterial.setColor3("foamColor", new Color3(0.5, 0.7, 0.8));
      waterMaterial.setFloat("waveSpeed", 1.2);

      scene.registerBeforeRender(() => {
        time += scene.getEngine().getDeltaTime() * 0.001;
        waterMaterial.setFloat("time", time);
      });

      return waterMaterial;
    } catch (e) {
      console.warn("Water shader failed to initialize, falling back to standard material:", e);
      const fallback = new StandardMaterial("waterFallback", scene);
      fallback.diffuseColor = new Color3(0.05, 0.15, 0.22);
      fallback.specularColor = new Color3(0.3, 0.5, 0.6);
      fallback.alpha = 0.85;
      return fallback;
    }
  }

  /**
   * Creates a custom Gorgon Medusa supernatural aura material with fallback.
   */
  public static createMedusaAuraMaterial(scene: Scene): Material {
    try {
      this.registerAuraShader();

      const auraMaterial = new ShaderMaterial(
        "medusaAuraMat",
        scene,
        {
          vertex: "medusaAura",
          fragment: "medusaAura",
        },
        {
          attributes: ["position", "normal", "uv"],
          uniforms: ["world", "worldViewProjection", "time", "auraColor"],
        }
      );

      let time = 0;
      auraMaterial.setColor3("auraColor", new Color3(0.1, 0.9, 0.3));

      scene.registerBeforeRender(() => {
        time += scene.getEngine().getDeltaTime() * 0.0015;
        auraMaterial.setFloat("time", time);
      });

      return auraMaterial;
    } catch (e) {
      console.warn("Aura shader failed to initialize, falling back to standard material:", e);
      const fallback = new StandardMaterial("auraFallback", scene);
      fallback.emissiveColor = new Color3(0.1, 0.8, 0.3);
      fallback.alpha = 0.7;
      return fallback;
    }
  }

  private static registerWaterShader(): void {
    if (this.isWaterShaderRegistered) return;

    Effect.ShadersStore["ancientWaterVertexShader"] = `
      precision highp float;
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;

      uniform mat4 worldViewProjection;
      uniform mat4 world;
      uniform float time;
      uniform float waveSpeed;

      varying vec2 vUV;
      varying vec3 vPositionW;
      varying vec3 vNormalW;
      varying float vWaveHeight;

      void main(void) {
        vUV = uv;
        vec3 p = position;

        // Wave calculation
        float wave1 = sin(p.x * 0.4 + time * waveSpeed * 1.5) * 0.25;
        float wave2 = cos(p.z * 0.5 + time * waveSpeed * 1.2) * 0.25;
        float wave3 = sin((p.x + p.z) * 0.3 + time * waveSpeed) * 0.15;

        p.y += wave1 + wave2 + wave3;
        vWaveHeight = wave1 + wave2 + wave3;

        vPositionW = vec3(world * vec4(p, 1.0));
        vNormalW = normalize(vec3(world * vec4(normal, 0.0)));

        gl_Position = worldViewProjection * vec4(p, 1.0);
      }
    `;

    Effect.ShadersStore["ancientWaterFragmentShader"] = `
      precision highp float;
      varying vec2 vUV;
      varying vec3 vPositionW;
      varying vec3 vNormalW;
      varying float vWaveHeight;

      uniform vec3 waterColor;
      uniform vec3 foamColor;

      void main(void) {
        vec3 color = waterColor;

        // Foam on wave crests
        if (vWaveHeight > 0.2) {
          float foamFactor = smoothstep(0.2, 0.4, vWaveHeight);
          color = mix(color, foamColor, foamFactor * 0.6);
        }

        gl_FragColor = vec4(color, 0.85);
      }
    `;

    this.isWaterShaderRegistered = true;
  }

  private static registerAuraShader(): void {
    if (this.isAuraShaderRegistered) return;

    Effect.ShadersStore["medusaAuraVertexShader"] = `
      precision highp float;
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;

      uniform mat4 worldViewProjection;
      uniform float time;

      varying vec2 vUV;
      varying vec3 vNormal;

      void main(void) {
        vUV = uv;
        vNormal = normal;

        vec3 p = position;
        p += normal * (sin(p.y * 5.0 + time * 4.0) * 0.06);

        gl_Position = worldViewProjection * vec4(p, 1.0);
      }
    `;

    Effect.ShadersStore["medusaAuraFragmentShader"] = `
      precision highp float;
      varying vec2 vUV;
      varying vec3 vNormal;

      uniform vec3 auraColor;
      uniform float time;

      void main(void) {
        float pulse = sin(time * 3.0) * 0.2 + 0.8;
        vec3 finalColor = auraColor * pulse;
        float alpha = 0.6 + sin(vUV.y * 10.0 + time * 2.0) * 0.2;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    this.isAuraShaderRegistered = true;
  }
}
