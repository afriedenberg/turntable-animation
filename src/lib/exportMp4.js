import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import {
  applyTurntableRotation,
  getTurntableAngle,
} from './turntable'

let ffmpegInstance = null

async function getFFmpeg() {
  if (ffmpegInstance) {
    return ffmpegInstance
  }

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
  const ffmpeg = new FFmpeg()
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })
  ffmpegInstance = ffmpeg
  return ffmpeg
}

function renderFrameToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to capture frame from canvas.'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}

export async function exportTurntableMp4({
  renderer,
  scene,
  camera,
  modelPivot,
  frameCount,
  fps,
  lapCount,
  rotationAxis,
  direction,
  resolutionWidth,
  resolutionHeight,
  onProgress,
}) {
  const ffmpeg = await getFFmpeg()
  const canvas = renderer.domElement
  const directionSign = direction === 'counterclockwise' ? -1 : 1
  const totalDegrees = lapCount * 360 * directionSign
  const perFrameDegrees = totalDegrees / frameCount
  const originalWidth = canvas.width
  const originalHeight = canvas.height
  const originalAspect = camera.aspect
  const savedCanvasStyle = canvas.style.cssText

  renderer.setSize(resolutionWidth, resolutionHeight, false)
  camera.aspect = resolutionWidth / resolutionHeight
  camera.updateProjectionMatrix()

  // Keep the on-screen preview from stretching: bitmap is export size, layout fills the viewport with uniform scale.
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.display = 'block'
  canvas.style.objectFit = 'contain'

  try {
    for (let frame = 0; frame < frameCount; frame += 1) {
      const angle = getTurntableAngle(frame, perFrameDegrees)
      applyTurntableRotation(modelPivot.rotation, rotationAxis, angle)
      renderer.render(scene, camera)

      const frameBlob = await renderFrameToBlob(canvas)
      const frameBytes = await fetchFile(frameBlob)
      const frameName = `frame-${String(frame).padStart(4, '0')}.png`
      await ffmpeg.writeFile(frameName, frameBytes)

      if (onProgress) {
        onProgress(`Captured frame ${frame + 1}/${frameCount}...`)
      }
    }

    if (onProgress) {
      onProgress('Encoding MP4 with ffmpeg...')
    }

    await ffmpeg.exec([
      '-framerate',
      String(fps),
      '-i',
      'frame-%04d.png',
      '-vf',
      'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p',
      '-c:v',
      'libx264',
      '-r',
      String(fps),
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      'output.mp4',
    ])

    const outputData = await ffmpeg.readFile('output.mp4')
    const videoBlob = new Blob([outputData], { type: 'video/mp4' })

    await ffmpeg.deleteFile('output.mp4')
    for (let frame = 0; frame < frameCount; frame += 1) {
      const frameName = `frame-${String(frame).padStart(4, '0')}.png`
      await ffmpeg.deleteFile(frameName)
    }

    return videoBlob
  } finally {
    renderer.setSize(originalWidth, originalHeight, false)
    camera.aspect = originalAspect
    camera.updateProjectionMatrix()
    canvas.style.cssText = savedCanvasStyle
    renderer.render(scene, camera)
  }
}
