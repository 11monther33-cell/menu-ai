/**
 * DishViewer3D.tsx — VISIONO Premium 3D Dish Viewer
 *
 * ✅ دوران تلقائي سلس بدون تقطيع
 * ✅ لا يحتاج تحريك بالإصبع — يدور وحده
 * ✅ كاميرا سلسة مع intro animation
 * ✅ إضاءة سينمائية 5 نقاط
 * ✅ يدعم GLB مع DRACO compression
 */

import { useRef, useEffect, useState } from 'react'

interface DishViewer3DProps {
  modelUrl    ?: string
  primaryColor : string
  height       ?: number
}

export default function DishViewer3D({
  modelUrl,
  primaryColor = '#C9A84C',
  height = 300,
}: DishViewer3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const cleanRef = useRef<(() => void) | null>(null)
  const [status, setStatus] = useState<'idle'|'loading'|'ready'|'error'>('idle')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!mountRef.current) return

    let destroyed = false
    setStatus('loading')
    setProgress(10)

    Promise.all([
      import('three'),
      import('three/examples/jsm/controls/OrbitControls.js'),
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/loaders/DRACOLoader.js'),
    ]).then(([THREE, { OrbitControls }, { GLTFLoader }, { DRACOLoader }]) => {

      if (destroyed) return
      const el = mountRef.current!
      const W  = el.clientWidth  || 400
      const H  = height

      // ── Renderer ─────────────────────────────────────────────
      const renderer = new THREE.WebGLRenderer({
        antialias          : true,
        alpha              : false,
        powerPreference    : 'high-performance',
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(W, H)
      renderer.setClearColor(0x0a0a0e)
      renderer.outputColorSpace  = THREE.SRGBColorSpace
      renderer.toneMapping       = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type    = THREE.PCFSoftShadowMap
      el.appendChild(renderer.domElement)

      // ── Scene ────────────────────────────────────────────────
      const scene  = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 100)
      camera.position.set(0, 1.2, 3.5)

      // ── 5-point Cinematic Lighting ───────────────────────────
      const pc = new THREE.Color(primaryColor)
      scene.add(new THREE.AmbientLight(0xffeedd, 0.5))

      const key = new THREE.DirectionalLight(0xfff5e0, 2.0)
      key.position.set(4, 8, 5)
      key.castShadow = true
      key.shadow.mapSize.setScalar(2048)
      key.shadow.camera.near = 0.1
      key.shadow.camera.far  = 50
      key.shadow.camera.left  = key.shadow.camera.bottom = -3
      key.shadow.camera.right = key.shadow.camera.top    =  3
      key.shadow.bias = -0.001
      scene.add(key)

      scene.add(Object.assign(new THREE.DirectionalLight(0x88aaff, 0.6), {
        position: new THREE.Vector3(-5, 3, -3),
      }))

      const rim = new THREE.PointLight(pc, 0.9, 12)
      rim.position.set(0, 0.5, -3.5)
      scene.add(rim)

      scene.add(new THREE.HemisphereLight(0x443322, 0x0a0a0e, 0.35))

      // Ground (shadow receiver)
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(3, 64),
        new THREE.ShadowMaterial({ opacity: 0.3, transparent: true })
      )
      ground.rotation.x   = -Math.PI / 2
      ground.position.y   = -1
      ground.receiveShadow = true
      scene.add(ground)

      // ── Controls — سلس بدون تقطيع ───────────────────────────
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping  = true
      controls.dampingFactor  = 0.08
      controls.enablePan      = false
      controls.minDistance    = 1.0
      controls.maxDistance    = 6
      controls.minPolarAngle  = Math.PI * 0.15
      controls.maxPolarAngle  = Math.PI * 0.75
      controls.target.set(0, 0.3, 0)

      // ✅ الدوران التلقائي المدمج في OrbitControls — أسلس بكثير
      controls.autoRotate      = true
      controls.autoRotateSpeed = 2.5  // دورة كاملة كل ~24 ثانية

      // إيقاف مؤقت عند اللمس — ثم استئناف تلقائي
      let resumeTimer: ReturnType<typeof setTimeout>
      controls.addEventListener('start', () => {
        controls.autoRotate = false
        clearTimeout(resumeTimer)
      })
      controls.addEventListener('end', () => {
        resumeTimer = setTimeout(() => {
          controls.autoRotate = true
        }, 2500)
      })

      // ── Load 3D Model ────────────────────────────────────────
      const group = new THREE.Group()
      scene.add(group)

      if (modelUrl) {
        setProgress(30)

        const draco = new DRACOLoader()
        draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')

        const loader = new GLTFLoader()
        loader.setDRACOLoader(draco)

        loader.load(
          modelUrl,
          (gltf) => {
            if (destroyed) return
            setProgress(90)

            const model = gltf.scene

            // Normalize size
            const box    = new THREE.Box3().setFromObject(model)
            const center = box.getCenter(new THREE.Vector3())
            const size   = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z)
            const scale  = 2.0 / maxDim

            model.position.sub(center)
            model.position.y += size.y * scale * 0.5
            model.scale.setScalar(scale)

            model.traverse(child => {
              if (!(child instanceof THREE.Mesh)) return
              child.castShadow    = true
              child.receiveShadow = true
              const mats = Array.isArray(child.material) ? child.material : [child.material]
              mats.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.envMapIntensity = 1.4
                  if (mat.map) mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy()
                  mat.needsUpdate = true
                }
              })
            })

            group.add(model)

            // ✅ Smooth camera intro — يقرّب الكاميرا بسلاسة
            const fov  = camera.fov * (Math.PI / 180)
            const fovH = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect)
            const dV   = (size.y * scale) / (2 * Math.tan(fov / 2))
            const dH   = (size.x * scale) / (2 * Math.tan(fovH / 2))
            const targetZ = Math.max(dV, dH) * 1.45

            // ✅ Animate camera from far to perfect distance
            const startZ = camera.position.z
            const startY = camera.position.y
            const targetY = 0.8
            let introProgress = 0
            const introAnim = () => {
              introProgress += 0.02
              const t = Math.min(introProgress, 1)
              // Smooth easeOutCubic
              const ease = 1 - Math.pow(1 - t, 3)
              camera.position.z = startZ + (targetZ - startZ) * ease
              camera.position.y = startY + (targetY - startY) * ease
              if (t < 1) requestAnimationFrame(introAnim)
            }
            introAnim()

            controls.update()
            setProgress(100)
            setStatus('ready')
          },
          (evt) => {
            if (evt.total > 0) {
              setProgress(30 + Math.round((evt.loaded / evt.total) * 60))
            }
          },
          (err) => {
            console.error('[VISIONO 3D] Load error:', err)
            setStatus('error')
          }
        )
      } else {
        // No model — show placeholder dish
        buildPlaceholderDish(THREE, group, pc)
        setStatus('ready')
        setProgress(100)
      }

      // ── Render Loop — سلس بالكامل ────────────────────────────
      let clock = new THREE.Clock()
      let frameId: number
      const animate = () => {
        frameId = requestAnimationFrame(animate)
        const delta = clock.getDelta()

        // ✅ Gentle floating — يعطي حياة بدون تقطيع
        const elapsed = clock.getElapsedTime()
        group.position.y = Math.sin(elapsed * 0.8) * 0.015

        controls.update()
        renderer.render(scene, camera)
      }
      animate()

      // ── Resize ───────────────────────────────────────────────
      const onResize = () => {
        if (!el) return
        const nW = el.clientWidth || 400
        camera.aspect = nW / H
        camera.updateProjectionMatrix()
        renderer.setSize(nW, H)
      }
      window.addEventListener('resize', onResize)

      // ── Cleanup ──────────────────────────────────────────────
      cleanRef.current = () => {
        cancelAnimationFrame(frameId)
        clearTimeout(resumeTimer)
        window.removeEventListener('resize', onResize)
        controls.dispose()
        renderer.dispose()
        scene.clear()
        if (el.contains(renderer.domElement)) {
          el.removeChild(renderer.domElement)
        }
      }
    }).catch(err => {
      console.error('[VISIONO 3D] Import error:', err)
      setStatus('error')
    })

    return () => {
      destroyed = true
      cleanRef.current?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl, primaryColor])

  const pc = primaryColor

  return (
    <div
      style={{
        position : 'relative',
        width    : '100%',
        height   : `${height}px`,
        background: '#0a0a0e',
        borderRadius: 12,
        overflow : 'hidden',
      }}
    >
      {/* Three.js mount — touch-action:none for mobile */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />

      {/* Loading overlay */}
      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4"/>
            <circle
              cx="28" cy="28" r="22" fill="none"
              stroke={pc} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - progress / 100)}`}
              style={{ transition: 'stroke-dashoffset .3s ease' }}
            />
          </svg>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            {progress}%
          </span>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', padding: 24,
        }}>
          <span style={{ fontSize: 28 }}>⚠</span>
          <span>تعذّر تحميل النموذج</span>
          <span style={{ fontSize: 11 }}>تأكد من صيغة GLB وأن الرابط صحيح</span>
        </div>
      )}

      {/* ✅ Subtle badge — no finger instruction */}
      {status === 'ready' && (
        <div style={{
          position: 'absolute', bottom: 10, left: 0, right: 0,
          textAlign: 'center', color: 'rgba(255,255,255,0.18)',
          fontSize: 10, pointerEvents: 'none',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          ◉ 3D
        </div>
      )}
    </div>
  )
}

// ── Placeholder dish when no GLB uploaded yet ─────────────────────
function buildPlaceholderDish(THREE: any, group: any, color: any) {
  const plateMat = new THREE.MeshStandardMaterial({ color: 0xe8d5b0, roughness: 0.4, metalness: 0.1 })
  const plate    = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.95, 0.08, 64), plateMat)
  plate.position.y  = -0.5
  plate.castShadow  = true
  plate.receiveShadow = true
  group.add(plate)

  const topMat  = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5, metalness: 0.05 })
  const top     = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), topMat)
  top.position.y   = 0.25
  top.castShadow   = true
  group.add(top)

  const baseMat = new THREE.MeshStandardMaterial({ color: 0xd4843a, roughness: 0.7 })
  const base    = new THREE.Mesh(new THREE.SphereGeometry(0.56, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45), baseMat)
  base.rotation.x = Math.PI
  base.position.y = -0.12
  base.castShadow = true
  group.add(base)
}
