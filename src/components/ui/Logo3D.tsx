/**
 * Logo 3D del sitio: un pequeño grafo de nodos y aristas en WebGL (three.js)
 * con perspectiva real de cámara — nada de cubos.
 *
 * Los nodos se distribuyen en una nube 3D (esfera de Fibonacci + ruido) y se
 * conectan con sus vecinos más cercanos; un nodo "hub" esmeralda pulsa como
 * una señal en vivo. La cámara tiene perspectiva, así que los nodos lejanos
 * se ven más pequeños: profundidad real.
 *
 * El grafo flota girando suavemente, los colores (cian/esmeralda de la marca)
 * se adaptan al tema claro/oscuro observando la clase `.dark` del <html>, y
 * se respeta `prefers-reduced-motion` congelando la animación.
 *
 * three.js vanilla dentro de un useEffect (sin @react-three/fiber) para no
 * sumar dependencias extra; la escena se libera al desmontar.
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/** Cantidad de nodos y de vecinos conectados por cada uno. */
const NODE_COUNT = 18
const NEIGHBORS = 3
const SPREAD = 1.5

interface Palette {
  node: number
  nodeOpacity: number
  edge: number
  edgeOpacity: number
  hub: number
}

const DARK: Palette = {
  node: 0x22d3ee,
  nodeOpacity: 0.95,
  edge: 0x38bdf8,
  edgeOpacity: 0.34,
  hub: 0xa3e635,
}

const LIGHT: Palette = {
  node: 0x0891b2,
  nodeOpacity: 1,
  edge: 0x0e7490,
  edgeOpacity: 0.45,
  hub: 0x65a30d,
}

export function Logo3D() {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth || 36
    const height = mount.clientHeight || 36

    /* ── Escena + cámara con perspectiva real ─────────────────── */
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 40)
    camera.position.set(0, 0, 6.2)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.style.pointerEvents = 'none'
    mount.appendChild(renderer.domElement)

    /* ── Nodos: nube 3D (esfera de Fibonacci + ruido) ─────────── */
    const positions: THREE.Vector3[] = []
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < NODE_COUNT; i++) {
      const y = 1 - (i / (NODE_COUNT - 1)) * 2
      const rad = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = golden * i
      const r = SPREAD * (0.6 + Math.random() * 0.6)
      positions.push(
        new THREE.Vector3(
          Math.cos(theta) * rad * r,
          y * r,
          Math.sin(theta) * rad * r * 0.65, // aplanado en Z → más profundidad
        ),
      )
    }
    const hubPos = new THREE.Vector3(0, 0, 0)

    /* ── Aristas: vecinos más cercanos + conexiones al hub ────── */
    const edgePts: number[] = []
    const seen = new Set<string>()
    const addEdge = (a: THREE.Vector3, b: THREE.Vector3) => {
      edgePts.push(a.x, a.y, a.z, b.x, b.y, b.z)
    }
    for (let i = 0; i < NODE_COUNT; i++) {
      const near = positions
        .map((p, j) => ({ p, j, d: positions[i].distanceTo(p) }))
        .filter((x) => x.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, NEIGHBORS)
      for (const { j } of near) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`
        if (seen.has(key)) continue
        seen.add(key)
        addEdge(positions[i], positions[j])
      }
    }
    // Hub central conectado a los nodos más cercanos para darle foco.
    const hubLinks = positions
      .map((p, j) => ({ p, j, d: p.distanceTo(hubPos) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 5)
    for (const { p } of hubLinks) addEdge(hubPos, p)

    /* ── Geometrías / materiales (compartidos → tema fácil) ───── */
    const nodeGeo = new THREE.SphereGeometry(0.11, 12, 12)
    const nodeMat = new THREE.MeshBasicMaterial({
      color: DARK.node,
      transparent: true,
      opacity: DARK.nodeOpacity,
    })
    const edgeGeo = new THREE.BufferGeometry()
    edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePts, 3))
    const edgeMat = new THREE.LineBasicMaterial({
      color: DARK.edge,
      transparent: true,
      opacity: DARK.edgeOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const hubGeo = new THREE.SphereGeometry(0.17, 16, 16)
    const hubMat = new THREE.MeshBasicMaterial({ color: DARK.hub })

    const graph = new THREE.Group()
    for (const p of positions) {
      const mesh = new THREE.Mesh(nodeGeo, nodeMat)
      mesh.position.copy(p)
      graph.add(mesh)
    }
    graph.add(new THREE.LineSegments(edgeGeo, edgeMat))

    const hub = new THREE.Mesh(hubGeo, hubMat)
    hub.position.copy(hubPos)
    graph.add(hub)
    scene.add(graph)

    /* ── Tema claro/oscuro: observa la clase `.dark` del <html> ── */
    const applyTheme = () => {
      const dark = document.documentElement.classList.contains('dark')
      const c = dark ? DARK : LIGHT
      nodeMat.color.setHex(c.node)
      nodeMat.opacity = c.nodeOpacity
      nodeMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending
      edgeMat.color.setHex(c.edge)
      edgeMat.opacity = c.edgeOpacity
      edgeMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending
      hubMat.color.setHex(c.hub)
    }
    applyTheme()
    const observer = new MutationObserver(applyTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    /* ── Animación (respetando prefers-reduced-motion) ────────── */
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let t = 0
    const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      t += dt
      const speed = reduceMotion ? 0 : 1
      graph.rotation.y += dt * 0.4 * speed
      graph.rotation.x = Math.sin(t * 0.45) * 0.28 * speed
      camera.position.z = 6.2 + Math.sin(t * 0.5) * 0.35 * speed
      camera.lookAt(0, 0, 0)
      hub.scale.setScalar(1 + Math.sin(t * 3.2) * 0.2 * speed)
      renderer.render(scene, camera)
    }
    animate()

    /* ── Resize (robustez ante cambios de contenedor) ─────────── */
    const resize = () => {
      const w = mount.clientWidth || 36
      const h = mount.clientHeight || 36
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    /* ── Cleanup ──────────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      observer.disconnect()
      nodeGeo.dispose()
      hubGeo.dispose()
      nodeMat.dispose()
      hubMat.dispose()
      edgeGeo.dispose()
      edgeMat.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div className="logo3d" aria-hidden="true">
      <span className="logo3d-halo" />
      <div ref={mountRef} className="logo3d-canvas" />
    </div>
  )
}