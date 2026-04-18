import { useMemo, useRef, useState } from 'react'
import ControlPanel from './components/ControlPanel'
import ViewportCanvas from './components/ViewportCanvas'

const DEFAULT_SETTINGS = {
  backgroundPreset: 'white',
  fps: 30,
  lapCount: 1,
  rotationSpeed: 50.0,
  rotationAxis: 'z',
  direction: 'clockwise',
  resolutionWidth: 1080,
  resolutionHeight: 1080,
  brightness: 100,
  reflection: 0.3,
}

function App() {
  const viewportRef = useRef(null)
  const fileInputRef = useRef(null)
  const [modelFile, setModelFile] = useState(null)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [status, setStatus] = useState('')

  const calculatedFrameCount = useMemo(() => {
    if (settings.rotationSpeed <= 0 || settings.lapCount <= 0 || settings.fps <= 0) {
      return 0
    }
    const seconds = (settings.lapCount * 360) / settings.rotationSpeed
    return Math.ceil(seconds * settings.fps)
  }, [settings.rotationSpeed, settings.lapCount, settings.fps])

  const canExport = useMemo(() => {
    const isResolutionValid =
      settings.resolutionWidth >= 64 &&
      settings.resolutionWidth <= 3840 &&
      settings.resolutionHeight >= 64 &&
      settings.resolutionHeight <= 3840
    return modelLoaded && !isExporting && calculatedFrameCount > 0 && isResolutionValid
  }, [
    modelLoaded,
    isExporting,
    calculatedFrameCount,
    settings.resolutionWidth,
    settings.resolutionHeight,
  ])

  const handleExport = async () => {
    const isResolutionValid =
      settings.resolutionWidth >= 64 &&
      settings.resolutionWidth <= 3840 &&
      settings.resolutionHeight >= 64 &&
      settings.resolutionHeight <= 3840

    if (!isResolutionValid) {
      setStatus('Resolution must be between 64 and 3840 for both width and height.')
      return
    }

    if (!viewportRef.current || !canExport) {
      return
    }

    try {
      setIsExporting(true)
      setStatus('Preparing MP4 export...')
      await viewportRef.current.exportMp4({
        frameCount: calculatedFrameCount,
        fps: settings.fps,
        lapCount: settings.lapCount,
        rotationAxis: settings.rotationAxis,
        direction: settings.direction,
        resolutionWidth: settings.resolutionWidth,
        resolutionHeight: settings.resolutionHeight,
        brightness: settings.brightness,
        onProgress: (progressMessage) => setStatus(progressMessage),
      })
      setStatus('MP4 export finished. Your download should start automatically.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Export failed unexpectedly.')
    } finally {
      setIsExporting(false)
    }
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  return (
    <main className={`app-shell ${settings.backgroundPreset === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <section className="viewport-column">
        <ViewportCanvas
          ref={viewportRef}
          modelFile={modelFile}
          modelLoaded={modelLoaded}
          canExport={canExport}
          isExporting={isExporting}
          backgroundPreset={settings.backgroundPreset}
          rotationSpeed={settings.rotationSpeed}
          rotationAxis={settings.rotationAxis}
          direction={settings.direction}
          brightness={settings.brightness}
          reflection={settings.reflection}
          onOpenFilePicker={openFilePicker}
          onExport={handleExport}
          onStatus={setStatus}
          onModelLoadedChange={setModelLoaded}
        />
      </section>
      <section className="panel-column">
        <h1>3D Turntable Exporter</h1>
        <p className="intro">
          Import OBJ/FBX/GLB geometry, preview the animation, and export the video. Easy as that!
        </p>
        <input
          ref={fileInputRef}
          className="hidden-file-input"
          type="file"
          accept=".obj,.fbx,.glb"
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null
            setModelFile(selected)
          }}
        />
        <ControlPanel
          settings={settings}
          calculatedFrameCount={calculatedFrameCount}
          isResolutionValid={
            settings.resolutionWidth >= 64 &&
            settings.resolutionWidth <= 3840 &&
            settings.resolutionHeight >= 64 &&
            settings.resolutionHeight <= 3840
          }
          isExporting={isExporting}
          onSettingsChange={setSettings}
        />
        {status ? <p className="status">{status}</p> : null}
      </section>
    </main>
  )
}

export default App
