import * as THREE from 'three'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { exportTurntableMp4 } from '../lib/exportMp4'
import { loadMeshFile } from '../lib/loaders'
import { applyTurntableRotation, getSignedRotationSpeed, getTurntableAngle } from '../lib/turntable'

const BACKGROUND_PRESETS = {
  white: '#f8f8f8',
  dark: '#000000',
}

const ViewportCanvas = forwardRef(function ViewportCanvas(
  {
    modelFile,
    modelLoaded,
    backgroundPreset,
    rotationSpeed,
    rotationAxis,
    direction,
    brightness,
    reflection,
    onOpenFilePicker,
    onStatus,
    onModelLoadedChange,
  },
  ref,
) {
  const mountRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const modelPivotRef = useRef(new THREE.Group())
  const previewAngleRef = useRef(0)
  const animationIdRef = useRef(null)
  const controlsRef = useRef(null)
  const previewSpeedRef = useRef(rotationSpeed)
  const previewAxisRef = useRef(rotationAxis)
  const directionRef = useRef(direction)
  const brightnessRef = useRef(brightness)
  const reflectionRef = useRef(reflection)
  const mainLightRef = useRef(null)
  const ringLightsRef = useRef([])
  const modelMaterialsRef = useRef([])
  const clockRef = useRef(new THREE.Clock())

  const convertToReflectiveMaterial = (material) => {
    if (material && 'metalness' in material) {
      return material
    }
    const standardMaterial = new THREE.MeshStandardMaterial({
      color: material?.color ? material.color.clone() : new THREE.Color('#c0c0c0'),
      map: material?.map ?? null,
      transparent: material?.transparent ?? false,
      opacity: material?.opacity ?? 1,
      side: material?.side ?? THREE.FrontSide,
      flatShading: material?.flatShading ?? false,
      roughness: 0.45,
    })
    if (standardMaterial.map) {
      standardMaterial.map.needsUpdate = true
    }
    return standardMaterial
  }

  const applyReflection = (reflectionValue) => {
    modelMaterialsRef.current.forEach((material) => {
      if ('metalness' in material) {
        material.metalness = reflectionValue
        if ('roughness' in material) {
          material.roughness = 1 - reflectionValue * 0.8
        }
        material.needsUpdate = true
      }
    })
  }

  useEffect(() => {
    previewSpeedRef.current = rotationSpeed
  }, [rotationSpeed])

  useEffect(() => {
    previewAxisRef.current = rotationAxis
  }, [rotationAxis])

  useEffect(() => {
    directionRef.current = direction
  }, [direction])

  useEffect(() => {
    brightnessRef.current = brightness
    if (mainLightRef.current) {
      mainLightRef.current.intensity = 1.2 * (brightness / 100)
    }
    ringLightsRef.current.forEach((light) => {
      light.intensity = 0.2 * (brightness / 100)
    })
  }, [brightness])

  useEffect(() => {
    reflectionRef.current = reflection
    applyReflection(reflection)
  }, [reflection])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) {
      return undefined
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)
    const suppressContextMenu = (event) => event.preventDefault()
    renderer.domElement.addEventListener('contextmenu', suppressContextMenu)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(BACKGROUND_PRESETS.white)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(4, 2.5, 4)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE
    controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
    controlsRef.current = controls

    const mainLight = new THREE.DirectionalLight('#ffffff', 1.2 * (brightnessRef.current / 100))
    mainLight.position.set(2.5, 3.2, 2.8)
    mainLightRef.current = mainLight
    scene.add(mainLight)

    const ringLights = []
    const ringRadius = 3
    const ringHeight = 1.2
    const ringCount = 8
    for (let index = 0; index < ringCount; index += 1) {
      const theta = (index / ringCount) * Math.PI * 2
      const ringLight = new THREE.PointLight('#ffffff', 0.2 * (brightnessRef.current / 100), 30)
      ringLight.position.set(Math.cos(theta) * ringRadius, ringHeight, Math.sin(theta) * ringRadius)
      scene.add(ringLight)
      ringLights.push(ringLight)
    }
    ringLightsRef.current = ringLights

    modelPivotRef.current = new THREE.Group()
    scene.add(modelPivotRef.current)

    const handleResize = () => {
      if (!mount || !rendererRef.current || !cameraRef.current) {
        return
      }
      const { clientWidth, clientHeight } = mount
      rendererRef.current.setSize(clientWidth, clientHeight)
      cameraRef.current.aspect = clientWidth / clientHeight
      cameraRef.current.updateProjectionMatrix()
    }

    const observer = new ResizeObserver(handleResize)
    observer.observe(mount)

    const animate = () => {
      controls.update()
      const signedSpeed = getSignedRotationSpeed(previewSpeedRef.current, directionRef.current)
      const deltaSeconds = clockRef.current.getDelta()
      previewAngleRef.current += getTurntableAngle(deltaSeconds, signedSpeed)
      applyTurntableRotation(modelPivotRef.current.rotation, previewAxisRef.current, previewAngleRef.current)
      renderer.render(scene, camera)
      animationIdRef.current = window.requestAnimationFrame(animate)
    }
    animate()

    return () => {
      observer.disconnect()
      if (animationIdRef.current) {
        window.cancelAnimationFrame(animationIdRef.current)
      }
      controls.dispose()
      renderer.domElement.removeEventListener('contextmenu', suppressContextMenu)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) {
      return
    }
    scene.background = new THREE.Color(BACKGROUND_PRESETS[backgroundPreset] ?? BACKGROUND_PRESETS.white)
  }, [backgroundPreset])

  useEffect(() => {
    let mounted = true

    const loadModel = async () => {
      if (!modelFile || !modelPivotRef.current) {
        onModelLoadedChange(false)
        modelMaterialsRef.current = []
        return
      }

      try {
        onStatus(`Loading ${modelFile.name}...`)
        const loadedMesh = await loadMeshFile(modelFile)
        if (!mounted) {
          return
        }

        modelPivotRef.current.clear()
        modelPivotRef.current.add(loadedMesh)
        const materialSet = new Set()
        loadedMesh.traverse((node) => {
          if (!node.isMesh || !node.material) {
            return
          }
          if (Array.isArray(node.material)) {
            node.material = node.material.map((material) => convertToReflectiveMaterial(material))
            node.material.forEach((material) => materialSet.add(material))
          } else {
            node.material = convertToReflectiveMaterial(node.material)
            materialSet.add(node.material)
          }
        })
        modelMaterialsRef.current = Array.from(materialSet)
        applyReflection(reflectionRef.current)
        onModelLoadedChange(true)
        onStatus(`Loaded ${modelFile.name}. Ready to export.`)
      } catch (error) {
        if (!mounted) {
          return
        }
        onModelLoadedChange(false)
        onStatus(error instanceof Error ? error.message : 'Failed to load model.')
      }
    }

    loadModel()
    return () => {
      mounted = false
    }
  }, [modelFile, onModelLoadedChange, onStatus])

  useImperativeHandle(ref, () => ({
    async exportMp4({
      frameCount,
      fps,
      lapCount,
      rotationAxis: axis,
      direction: exportDirection,
      resolutionWidth,
      resolutionHeight,
      onProgress,
    }) {
      const renderer = rendererRef.current
      const scene = sceneRef.current
      const camera = cameraRef.current
      const modelPivot = modelPivotRef.current
      const controls = controlsRef.current

      if (!renderer || !scene || !camera || modelPivot.children.length === 0) {
        throw new Error('Load a mesh before exporting an MP4.')
      }

      if (controls) {
        controls.enabled = false
      }

      let mp4Blob
      try {
        mp4Blob = await exportTurntableMp4({
          renderer,
          scene,
          camera,
          modelPivot,
          frameCount,
          fps,
          lapCount,
          rotationAxis: axis,
          direction: exportDirection,
          resolutionWidth,
          resolutionHeight,
          onProgress,
        })
      } finally {
        if (controls) {
          controls.enabled = true
        }
      }

      const outputName = `turntable-${Date.now()}.mp4`
      const downloadUrl = URL.createObjectURL(mp4Blob)
      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = outputName
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
    },
  }))

  return (
    <div className="viewport-wrap">
      <div className="viewport" ref={mountRef} />
      {!modelLoaded && (
        <button type="button" className="center-upload-button" onClick={onOpenFilePicker}>
          Upload OBJ/FBX
        </button>
      )}
    </div>
  )
})

export default ViewportCanvas
