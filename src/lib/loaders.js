import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

const objLoader = new OBJLoader()
const fbxLoader = new FBXLoader()
const gltfLoader = new GLTFLoader()

function normalizeModel(object3D) {
  const box = new THREE.Box3().setFromObject(object3D)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDimension = Math.max(size.x, size.y, size.z) || 1
  const scale = 2.5 / maxDimension

  object3D.position.sub(center)
  object3D.scale.setScalar(scale)
  object3D.updateMatrixWorld(true)

  return object3D
}

export async function loadMeshFile(file) {
  if (!file) {
    throw new Error('Please select an OBJ, FBX, or GLB file first.')
  }

  const ext = file.name.toLowerCase().split('.').pop()

  if (ext === 'obj') {
    const text = await file.text()
    const parsed = objLoader.parse(text)
    return normalizeModel(parsed)
  }

  if (ext === 'fbx') {
    const buffer = await file.arrayBuffer()
    const parsed = fbxLoader.parse(buffer, '')
    return normalizeModel(parsed)
  }

  if (ext === 'glb') {
    const buffer = await file.arrayBuffer()
    const gltf = await gltfLoader.parseAsync(buffer, '')
    return normalizeModel(gltf.scene)
  }

  throw new Error('Unsupported format. Please upload a .obj, .fbx, or .glb file.')
}
