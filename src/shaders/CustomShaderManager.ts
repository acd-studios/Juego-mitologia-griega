import {
  Scene,
  Effect,
  ShaderMaterial,
  Texture,
  Color3,
  Vector2,
  StandardMaterial
} from '@babylonjs/core';

export class CustomShaderManager {
  private static registered: boolean = false;

  public static registerShaders(): void {
    if (this.registered) return;

    // 1. Ancient Water Shader Code
    Effect.ShadersStore["ancientWaterVertexShader"] = `
      precision highp float;
      attribute vec3 position;
      attribute vec2 uv;
      attribute vec3 normal;

      uniform mat4 worldViewProjection;
      uniform mat4 world;
      uniform float time;

      varying vec2 vUV;
      varying vec3 vPositionW;
      varying vec3 vNormalW;

      void main(void) {
        vec3 p = position;
        p.y += sin(p.x * 1.5 + time * 1.2) * 0.08 + cos(p.z * 1.5 + time * 1.5) * 0.08;
        vec4 worldPos = world * vec4(p, 1.0);
        vPositionW = worldPos.xyz;
        vNormalW = normalize(mat3(world) * normal);
        vUV = uv;
        gl_Position = worldViewProjection * vec4(p, 1.0);
      }
    `;

    Effect.ShadersStore["ancientWaterFragmentShader"] = `
      precision highp float;
      varying vec2 vUV;
      varying vec3 vPositionW;
      varying vec3 vNormalW;

      uniform float time;
      uniform vec3 waterColor;
      uniform vec3 foamColor;

      void main(void) {
        vec2 uv = vUV * 4.0;
        float wave = sin(uv.x * 3.0 + time) * cos(uv.y * 3.0 + time * 0.8);
        vec3 finalColor = mix(waterColor, foamColor, clamp(wave * 0.5 + 0.2, 0.0, 1.0));
        gl_FragColor = vec4(finalColor, 0.85);
      }
    `;

    // 2. Medusa Aura & Petrifying Distortion Shader Code
    Effect.ShadersStore["medusaAuraVertexShader"] = `
      precision highp float;
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;

      uniform mat4 worldViewProjection;
      uniform mat4 world;
      uniform float time;

      varying vec3 vNormalW;
      varying vec3 vPositionW;
      varying vec2 vUV;

      void main(void) {
        vec3 p = position;
        p += normal * (sin(time * 3.0 + position.y * 5.0) * 0.05);
        vec4 worldPos = world * vec4(p, 1.0);
        vPositionW = worldPos.xyz;
        vNormalW = normalize(mat3(world) * normal);
        vUV = uv;
        gl_Position = worldViewProjection * vec4(p, 1.0);
      }
    `;

    Effect.ShadersStore["medusaAuraFragmentShader"] = `
      precision highp float;
      varying vec3 vNormalW;
      varying vec3 vPositionW;
      varying vec2 vUV;

      uniform float time;
      uniform vec3 auraColor;

      void main(void) {
        vec3 viewDir = normalize(-vPositionW);
        float fresnel = pow(1.0 - max(dot(viewDir, vNormalW), 0.0), 2.5);
        float pulse = 0.6 + 0.4 * sin(time * 4.0);
        vec3 col = auraColor * fresnel * pulse;
        gl_FragColor = vec4(col, fresnel * 0.8);
      }
    `;

    this.registered = true;
  }

  public static createAncientWaterMaterial(scene: Scene, name: string = "waterMat"): ShaderMaterial | StandardMaterial {
    this.registerShaders();
    try {
      const mat = new ShaderMaterial(name, scene, {
        vertex: "ancientWater",
        fragment: "ancientWater",
      }, {
        attributes: ["position", "normal", "uv"],
        uniforms: ["world", "worldViewProjection", "time", "waterColor", "foamColor"]
      });

      mat.setColor3("waterColor", new Color3(0.05, 0.25, 0.35));
      mat.setColor3("foamColor", new Color3(0.4, 0.7, 0.8));
      mat.setFloat("time", 0.0);
      mat.backFaceCulling = false;

      let time = 0;
      scene.onBeforeRenderObservable.add(() => {
        time += scene.getEngine().getDeltaTime() / 1000.0;
        mat.setFloat("time", time);
      });

      return mat;
    } catch (e) {
      console.warn("Shader no soportado en este dispositivo, aplicando StandardMaterial fallback.", e);
      const fallback = new StandardMaterial(name + "_fallback", scene);
      fallback.diffuseColor = new Color3(0.05, 0.25, 0.35);
      fallback.alpha = 0.85;
      return fallback;
    }
  }

  public static createMedusaAuraMaterial(scene: Scene, name: string = "medusaAuraMat"): ShaderMaterial | StandardMaterial {
    this.registerShaders();
    try {
      const mat = new ShaderMaterial(name, scene, {
        vertex: "medusaAura",
        fragment: "medusaAura",
      }, {
        attributes: ["position", "normal", "uv"],
        uniforms: ["world", "worldViewProjection", "time", "auraColor"]
      });

      mat.setColor3("auraColor", new Color3(0.1, 0.9, 0.4)); // Resplandor verde sobrenatural
      mat.setFloat("time", 0.0);
      mat.backFaceCulling = false;

      let time = 0;
      scene.onBeforeRenderObservable.add(() => {
        time += scene.getEngine().getDeltaTime() / 1000.0;
        mat.setFloat("time", time);
      });

      return mat;
    } catch (e) {
      const fallback = new StandardMaterial(name + "_fallback", scene);
      fallback.emissiveColor = new Color3(0.1, 0.8, 0.3);
      fallback.alpha = 0.5;
      return fallback;
    }
  }
}
