# 3D Character Model Placement & Posing in React Three Fiber (R3F)

## Core Guidelines

### 1. Seated Humanoid Characters Behind Occluding Props (Tables, Desks)
- **Local Origin Awareness**: Humanoid GLB models almost universally have their coordinate origin `(0, 0, 0)` at the soles of their feet (ground level).
- **Calculate Vertical Offset to Match Sightlines**:
  - Do not attempt manual, ad-hoc bone-level Euler rotations on standing skeletal rigs unless a dedicated seated animation clip is baked into the model.
  - Position the model root below the floor/table level (`position.y = target_eye_height - model_head_height`) so the waist rests at seat level and the chest, shoulders, and head emerge at the camera eye level.
  - The table/desk will naturally occlude the lower body.

### 2. Scene Cloning & SkinnedMesh Safety
- Standard `scene.clone(true)` is safe for mesh hierarchies and parent `<group>` transforms.
- Avoid introducing `SkeletonUtils.clone` on third-party (e.g. Sketchfab) multi-mesh assets unless joint hierarchies have been strictly validated, as unmapped joints can result in `undefined` bone matrix lookups and crash the Three.js Canvas render loop.

### 3. Parent Group Micro-Animations
- Apply procedural breathing, head tracking, recoil, and sway to the parent `<group ref={group}>` via `useFrame` rather than mutating individual joint quaternions directly, ensuring stability across all GLB models.
