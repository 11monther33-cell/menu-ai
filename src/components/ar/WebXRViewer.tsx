import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader }  from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

interface WebXRViewerProps {
  modelUrl     : string
  dishName     : string
  price        : string
  primaryColor : string
  lang         : 'ar' | 'en'
  onClose      : () => void
}

export default function WebXRViewer({
  modelUrl, dishName, price, primaryColor, lang, onClose
}: WebXRViewerProps) {
  const overlayRef    = useRef<HTMLDivElement>(null)
  const sessionRef    = useRef<XRSession | null>(null)
  const rendererRef   = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef      = useRef<THREE.Scene | null>(null)
  const modelRef      = useRef<THREE.Group | null>(null)
  const reticleRef    = useRef<THREE.Mesh | null>(null)
  const hitSourceRef  = useRef<XRHitTestSource | null>(null)
  const placedRef     = useRef(false)
  const gestureRef    = useRef({ scale: 1, rotation: 0, lastDist: 0, lastAngle: 0 })
  const [iosFallback, setIosFallback] = useState(false)
  const isAr          = lang === 'ar'

  const startXR = useCallback(async () => {
    if (!navigator.xr) {
      // iOS Safari doesn't have navigator.xr
      setIosFallback(true)
      return
    }

    const supported = await navigator.xr.isSessionSupported('immersive-ar').catch(() => false)
    if (!supported) {
      // Fallback: iOS/Non-WebXR requires manual tap to activate AR Quick Look
      setIosFallback(true)
      return
    }

    const session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['anchors', 'light-estimation', 'dom-overlay'],
      domOverlay: overlayRef.current ? { root: overlayRef.current } : undefined,
    })

    sessionRef.current = session

    // Renderer
    const canvas = document.createElement('canvas')
    document.body.appendChild(canvas)

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.xr.enabled = true
    renderer.xr.setSession(session)
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    rendererRef.current = renderer

    // Scene + Camera
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100)
    sceneRef.current = scene

    // إضاءة احترافية
    const pc = new THREE.Color(primaryColor)
    scene.add(new THREE.AmbientLight(0xffeedd, 0.6))
    const key = new THREE.DirectionalLight(0xfff5e0, 2.0)
    key.position.set(4, 8, 5)
    key.castShadow = true
    key.shadow.mapSize.setScalar(2048)
    key.shadow.bias = -0.001
    scene.add(key)
    const rim = new THREE.PointLight(pc, 0.8, 10)
    rim.position.set(0, 1, -3)
    scene.add(rim)

    // الدائرة الاستهدافية
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.10, 0.13, 48),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(primaryColor), side: THREE.DoubleSide })
    )
    reticle.rotation.x = -Math.PI / 2
    reticle.matrixAutoUpdate = false
    reticle.visible = false
    scene.add(reticle)
    reticleRef.current = reticle

    // ظل الأرضية
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(2, 64),
      new THREE.ShadowMaterial({ opacity: 0.3, transparent: true })
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.receiveShadow = true
    shadow.visible = false
    scene.add(shadow)

    // تحميل المجسم
    const draco = new DRACOLoader()
    draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
    const loader = new GLTFLoader()
    loader.setDRACOLoader(draco)

    loader.load(modelUrl, (gltf) => {
      const model = gltf.scene

      // تطبيع الحجم إلى ~22cm
      const box    = new THREE.Box3().setFromObject(model)
      const size   = box.getSize(new THREE.Vector3())
      const scale  = 0.22 / Math.max(size.x, size.y, size.z)
      const center = box.getCenter(new THREE.Vector3())

      model.position.sub(center.multiplyScalar(scale))
      model.scale.setScalar(scale)
      model.visible = false

      model.traverse(c => {
        if ((c as THREE.Mesh).isMesh) {
          c.castShadow = true
          c.receiveShadow = true
        }
      })

      scene.add(model)
      modelRef.current = model as THREE.Group
    }, undefined, console.error)

    // Hit Test Source
    const refSpace = await session.requestReferenceSpace('viewer')
    hitSourceRef.current = await session.requestHitTestSource!({ space: refSpace })

    // إيماءات اللمس
    setupTouchGestures(overlayRef.current!)

    // وضع المجسم عند الضغط
    let lastTap = 0
    session.addEventListener('select', () => {
      const now = Date.now()
      if (now - lastTap < 300) {
        // ضغطتان: إعادة الوضع
        placedRef.current = false
        if (modelRef.current) modelRef.current.visible = false
        if (reticleRef.current) reticleRef.current.visible = true
        shadow.visible = false
      } else {
        // ضغطة واحدة: وضع المجسم
        if (!placedRef.current && reticleRef.current?.visible && modelRef.current) {
          const pos = reticleRef.current.position.clone()
          modelRef.current.position.copy(pos)
          modelRef.current.visible = true
          shadow.position.copy(pos)
          shadow.visible = true
          reticleRef.current.visible = false
          placedRef.current = true
        }
      }
      lastTap = now
    })

    // حلقة الرسم
    const xrRefSpace = await session.requestReferenceSpace('local')

    renderer.setAnimationLoop((_, xrFrame) => {
      if (!xrFrame) return

      // تحديث الدائرة الاستهدافية
      if (!placedRef.current && hitSourceRef.current) {
        const hits = xrFrame.getHitTestResults(hitSourceRef.current)
        if (hits.length > 0) {
          const pose = hits[0].getPose(xrRefSpace)
          if (pose && reticleRef.current) {
            reticleRef.current.visible = true
            reticleRef.current.matrix.fromArray(pose.transform.matrix)
            reticleRef.current.matrix.decompose(
              reticleRef.current.position,
              reticleRef.current.quaternion,
              reticleRef.current.scale
            )
          }
        } else {
          if (reticleRef.current) reticleRef.current.visible = false
        }
      }

      // تطبيق الإيماءات على المجسم الموضوع
      if (placedRef.current && modelRef.current) {
        const g = gestureRef.current
        modelRef.current.scale.setScalar(
          0.22 / Math.max(...(modelRef.current as any)._origSize || [1]) * g.scale
        )
        modelRef.current.rotation.y = g.rotation
      }

      renderer.render(scene, camera)
    })

    session.addEventListener('end', () => {
      renderer.setAnimationLoop(null)
      renderer.dispose()
      canvas.remove()
      hitSourceRef.current?.cancel()
      onClose()
    })
  }, [modelUrl, primaryColor, onClose])

  // iOS Fallback: model-viewer
  const launchModelViewer = useCallback(() => {
    // Requires synchronous user gesture on iOS
    const mv = document.createElement('model-viewer') as any
    mv.src         = modelUrl
    mv.ar          = true
    mv['ar-modes'] = 'webxr scene-viewer quick-look'
    mv.style.display = 'none'
    document.body.appendChild(mv)
    mv.activateAR?.()
    
    // Clean up after 1 second since Quick Look takes over
    setTimeout(() => {
      mv.remove()
      onClose() // Close the React overlay since we handed off to OS
    }, 1000)
  }, [modelUrl, onClose])

  // إيماءات اللمس (قرص للتكبير + تدوير بإصبعين)
  const setupTouchGestures = (el: HTMLElement) => {
    const g = gestureRef.current
    let lastDist = 0, lastAngle = 0, twoFinger = false

    el.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        twoFinger  = true
        lastDist   = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        lastAngle  = Math.atan2(
          e.touches[1].clientY - e.touches[0].clientY,
          e.touches[1].clientX - e.touches[0].clientX
        )
      }
    }, { passive: true })

    el.addEventListener('touchmove', e => {
      if (e.touches.length !== 2 || !twoFinger) return
      const dist  = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const angle = Math.atan2(
        e.touches[1].clientY - e.touches[0].clientY,
        e.touches[1].clientX - e.touches[0].clientX
      )
      g.scale   = Math.max(0.2, Math.min(5.0, g.scale * (dist / lastDist)))
      g.rotation += angle - lastAngle
      lastDist   = dist
      lastAngle  = angle
    }, { passive: true })

    el.addEventListener('touchend', () => { twoFinger = false }, { passive: true })
  }

  useEffect(() => {
    startXR()
    return () => { sessionRef.current?.end().catch(() => {}) }
  }, [startXR])

  return (
    <div ref={overlayRef} style={{
      position:'fixed', inset:0, zIndex:9999,
      pointerEvents:'none',
      direction: isAr ? 'rtl' : 'ltr',
      fontFamily: isAr ? 'Cairo, sans-serif' : 'Space Grotesk, sans-serif',
    }}>

      {iosFallback && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'auto', zIndex: 10001,
          padding: 24, textAlign: 'center'
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: `${primaryColor}20`, border: `2px solid ${primaryColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, marginBottom: 24
          }}>
            📱
          </div>
          <h2 style={{ color: 'white', fontSize: 20, marginBottom: 12 }}>
            {isAr ? 'جاهز للوضع في مساحتك' : 'Ready to place in your space'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 32 }}>
            {isAr 
              ? 'نظام جهازك يتطلب فتح كاميرا الواقع المعزز يدوياً' 
              : 'Your device requires opening the AR camera manually'}
          </p>
          <button 
            onClick={launchModelViewer}
            style={{
              padding: '16px 32px', borderRadius: 16,
              background: primaryColor, color: '#000',
              fontSize: 16, fontWeight: 'bold', border: 'none',
              cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center'
            }}
          >
            <span>◎</span>
            {isAr ? 'افتح الكاميرا وضع الطبق' : 'Open Camera & Place Dish'}
          </button>
        </div>
      )}

      {/* الهيدر */}
      <div style={{
        position:'absolute', top:0, left:0, right:0,
        padding:'12px 16px',
        background:'linear-gradient(to bottom,rgba(0,0,0,0.6),transparent)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        pointerEvents:'auto',
      }}>
        <div>
          <p style={{color:'white',fontWeight:700,fontSize:14,margin:0}}>{dishName}</p>
          <p style={{color:primaryColor,fontWeight:700,fontSize:14,margin:0}}>{price}</p>
        </div>
        <button onClick={onClose} style={{
          width:32,height:32,borderRadius:'50%',
          border:'1px solid rgba(255,255,255,0.2)',
          background:'rgba(0,0,0,0.4)',color:'white',
          cursor:'pointer',fontSize:14,
          display:'flex',alignItems:'center',justifyContent:'center',
        }}>✕</button>
      </div>

      {/* تلميح الأسفل */}
      <div style={{
        position:'absolute',bottom:0,left:0,right:0,
        padding:'16px',
        background:'linear-gradient(to top,rgba(0,0,0,0.5),transparent)',
        display:'flex',flexDirection:'column',alignItems:'center',gap:8,
        pointerEvents:'none',
      }}>
        {!placedRef.current && (
          <div style={{
            background:'rgba(0,0,0,0.65)',borderRadius:24,
            padding:'10px 20px',
            color:'white',fontSize:13,fontWeight:500,
            display:'flex',alignItems:'center',gap:8,
          }}>
            <span style={{
              width:8,height:8,borderRadius:'50%',
              background:primaryColor,
              boxShadow:`0 0 8px ${primaryColor}`,
              flexShrink:0,
            }}/>
            {isAr ? 'وجّه الكاميرا على الطاولة واضغط لوضع الطبق' : 'Point at table and tap to place dish'}
          </div>
        )}
        <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,display:'flex',gap:12}}>
          <span>{isAr ? '🤏 اقرص للتكبير' : '🤏 Pinch to scale'}</span>
          <span>{isAr ? '↺ إصبعان للتدوير' : '↺ Two fingers rotate'}</span>
          <span>{isAr ? '↩ ضغطتان لإعادة الوضع' : '↩ Double-tap to replace'}</span>
        </div>
      </div>
    </div>
  )
}
