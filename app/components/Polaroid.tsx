"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Environment, useGLTF, useTexture } from "@react-three/drei";
import { EffectComposer, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import {
  Box3,
  ClampToEdgeWrapping,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector3,
  type Group,
  type Material,
  type Texture,
} from "three";
import { site } from "@/lib/site";

const MODEL_URL = site.model.src;
const PHOTO_TEXTURE_URL = site.model.photoTexture;

useGLTF.preload(MODEL_URL);

type CursorTarget = { x: number; y: number; engaged: boolean };

// How smoothly the model eases toward the cursor target.
// Lower = smoother / more lag. Higher = snappier.
const FOLLOW_LERP = 0.02;

// Cursor → rotation gain. Cursor edge-to-edge maps to ±MAX_YAW around Y
// and ±MAX_PITCH around X.
//   MAX_YAW = Math.PI    → full flip (back of polaroid visible)
//   MAX_YAW = Math.PI/2  → 90° each way (edge-on)
const MAX_YAW = Math.PI / 2;
const MAX_PITCH = 0.2; // ≈ 11.5°

// Default rest pose for the animated wrapper (X = pitch, Z = roll).
const REST_PITCH = 0;
const REST_ROLL = 0;
// Idle Y-axis spin (radians / second). 0.1 ≈ one turn per minute.
const IDLE_SPIN_SPEED = 0.1;

// Model-intrinsic rotation correction. The GLB itself ships with a baked
// tilt — these counter-rotations stand the polaroid perfectly upright.
// Applied to the inner <primitive>, NOT the animated wrapper, so cursor
// rotation / idle spin stay clean.
//   - X negative → tip the top of the polaroid AWAY from the camera.
//   - X positive → tip the top TOWARD the camera.
// Tweak in tiny steps (0.05 ≈ 3°). 0 means no correction.
const MODEL_OFFSET_X = 0.6;
const MODEL_OFFSET_Y = 0.3;
const MODEL_OFFSET_Z = 0;

const TARGET_SIZE = 3.24;

/**
 * Walks the loaded scene and replaces ONLY the front photo's color map.
 *
 * Strategy:
 *  1. Collect every material that already has a color map.
 *  2. Score each by a "photo-likeness" heuristic:
 *     - Texture image filename / URL contains "photo" / "image" / "picture" / "girl".
 *     - Otherwise prefer near-square aspect-ratio textures (the photo is 1:1).
 *     - As a last tiebreaker, the largest texture wins.
 *  3. Swap ONLY that one material's map.
 *
 * Crucially, we copy the original texture's UV transform (offset, repeat,
 * rotation, wrapping, flipY) onto the new texture so the image lands in
 * exactly the same UV region as the original photo — no squashing, no
 * shifting, full 1:1 display matching what the model intended.
 */
/**
 * Given a mesh, return the [min,max] UV bounds it actually samples.
 * Polaroid photo meshes typically map to a sub-rectangle of the texture
 * (e.g. 0.05..0.95). We need this so we can stretch our replacement image
 * to exactly fill that sub-region — otherwise it appears zoomed/cropped.
 */
function getMeshUvBounds(mesh: Mesh): {
  min: { x: number; y: number };
  max: { x: number; y: number };
} | null {
  const uvAttr = mesh.geometry.getAttribute("uv");
  if (!uvAttr) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < uvAttr.count; i++) {
    const x = uvAttr.getX(i);
    const y = uvAttr.getY(i);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}

function applyPhotoTexture(scene: Group, texture: Texture) {
  type Cand = {
    mesh: Mesh;
    material: MeshStandardMaterial;
    score: number;
    original: Texture;
  };

  const candidates: Cand[] = [];

  scene.traverse((obj) => {
    if (!(obj instanceof Mesh)) return;
    const materials: Material[] = Array.isArray(obj.material)
      ? obj.material
      : [obj.material];

    for (const mat of materials) {
      if (!(mat instanceof MeshStandardMaterial) || !mat.map) continue;

      const original = mat.map;
      const img = original.image as
        | { width?: number; height?: number; src?: string; currentSrc?: string }
        | undefined;
      const w = img?.width ?? 0;
      const h = img?.height ?? 0;
      const area = w * h;
      const aspect = w && h ? Math.min(w, h) / Math.max(w, h) : 0;
      const src = (img?.src ?? img?.currentSrc ?? "").toLowerCase();
      const nameHit =
        /photo|image|picture|girl|portrait|scene/.test(src) ||
        /photo|image|picture|girl|portrait|scene/.test(
          (original.name ?? "").toLowerCase()
        ) ||
        /photo|image|picture|girl|portrait|scene/.test(
          (mat.name ?? "").toLowerCase()
        );

      let score = 0;
      if (nameHit) score += 1_000_000_000;
      score += aspect * 100_000;
      score += area / 1_000_000;
      candidates.push({ mesh: obj, material: mat, score, original });
    }
  });

  if (candidates.length === 0) return;

  candidates.sort((a, b) => b.score - a.score);
  const { mesh, material, original } = candidates[0];

  // Inherit orientation / color from the original. Force ClampToEdge so
  // the image never tiles — required when offset/repeat go outside 0..1.
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.flipY = original.flipY;
  texture.colorSpace = original.colorSpace || SRGBColorSpace;
  texture.rotation = 0;
  texture.center.set(0, 0);

  // Map the mesh's UV sub-rectangle (e.g. 0.05..0.95) to the texture's
  // full 0..1 range. Flip horizontally only (mirror across vertical axis)
  // by negating repeat.x and offsetting by max.x.
  //
  //   sample(uv) = uv * repeat + offset
  const bounds = getMeshUvBounds(mesh);
  if (bounds) {
    const w = bounds.max.x - bounds.min.x || 1;
    const h = bounds.max.y - bounds.min.y || 1;
    // X positive (no left/right swap), Y negative (flip vertically so the
    // image isn't upside down on the polaroid front).
    texture.repeat.set(1 / w, -1 / h);
    texture.offset.set(-bounds.min.x / w, bounds.max.y / h);
  } else {
    texture.repeat.set(1, -1);
    texture.offset.set(0, 1);
  }
  texture.needsUpdate = true;

  material.map = texture;
  material.needsUpdate = true;
}

function CursorRotator({ targetRef }: { targetRef: RefObject<CursorTarget> }) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);
  const photoTexture = useTexture(PHOTO_TEXTURE_URL);

  // Apply the texture swap once whenever scene or texture changes.
  useEffect(() => {
    applyPhotoTexture(scene as unknown as Group, photoTexture);
  }, [scene, photoTexture]);

  // Compute uniform fit-scale ONCE so rotation never changes apparent size.
  const fitScale = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return TARGET_SIZE / maxDim;
  }, [scene]);

  // Continuously-advancing baseline yaw — gives the polaroid a gentle
  // perpetual spin around Y. Cursor follow is added ON TOP via a separate
  // offset, so the model is always slowly turning AND responsive to the cursor.
  const spinPhase = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const { x, y, engaged } = targetRef.current;

    // Clamp delta. When the tab regains focus after being hidden, browsers
    // can deliver a single frame whose delta covers the entire away time
    // (seconds or minutes). Without clamping, the polaroid would jump
    // ahead by hundreds of rotations in one frame and then visibly "catch
    // up" via lerp — looks like a frantic spin. ~33ms = one frame at 30fps.
    const dt = Math.min(delta, 1 / 30);

    spinPhase.current += IDLE_SPIN_SPEED * dt;

    // Roll always eases back to rest — no sideways lean.
    groupRef.current.rotation.z +=
      (REST_ROLL - groupRef.current.rotation.z) * FOLLOW_LERP;

    // Y = perpetual auto-spin + cursor-driven offset (clamped to ±MAX_YAW).
    const cursorYaw = engaged ? x * MAX_YAW : 0;
    const desiredY = spinPhase.current + cursorYaw;
    groupRef.current.rotation.y +=
      (desiredY - groupRef.current.rotation.y) * FOLLOW_LERP;

    // X (pitch) follows cursor Y, clamped to ±MAX_PITCH so it just nods.
    const desiredX = REST_PITCH + (engaged ? y * MAX_PITCH : 0);
    groupRef.current.rotation.x +=
      (desiredX - groupRef.current.rotation.x) * FOLLOW_LERP;
  });

  return (
    <group
      ref={groupRef}
      scale={fitScale}
      rotation={[REST_PITCH, 0, REST_ROLL]}
    >
      <Center>
        {/* Inner counter-rotation cancels the GLB's baked tilt so the
            polaroid stands straight regardless of how it was authored. */}
        <group rotation={[MODEL_OFFSET_X, MODEL_OFFSET_Y, MODEL_OFFSET_Z]}>
          <primitive object={scene} />
        </group>
      </Center>
    </group>
  );
}

export default function Polaroid() {
  const targetRef = useRef<CursorTarget>({ x: 0, y: 0, engaged: false });
  const [tabVisible, setTabVisible] = useState(true);

  // Track the cursor across the entire viewport so the polaroid follows
  // even when the user is hovering over text, the right panel, etc.
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      targetRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      targetRef.current.engaged = true;
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  // Pause the render loop entirely when the tab is hidden. R3F's `frameloop`
  // prop is reactive, so flipping it between "always" and "never" stops/resumes
  // the canvas without a remount. Combined with the delta clamp inside
  // CursorRotator, this guarantees no spin "catch-up" on tab return.
  useEffect(() => {
    const sync = () => setTabVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    <div className="h-full w-full">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        frameloop={tabVisible ? "always" : "never"}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} />
        <directionalLight position={[-3, -2, -2]} intensity={0.3} />

        <Suspense fallback={null}>
          <CursorRotator targetRef={targetRef} />
          <Environment preset="city" />
        </Suspense>

        {/* Film grain — applied as a post-process on the whole canvas.
            Because the canvas is transparent, only the polaroid pixels
            receive visible grain; the surrounding paper background stays
            clean. Multiply blend keeps highlights + shadows intact. */}
        <EffectComposer>
          <Noise opacity={0.35} blendFunction={BlendFunction.MULTIPLY} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
