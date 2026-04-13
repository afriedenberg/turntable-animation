function ControlPanel({
  settings,
  calculatedFrameCount,
  isExporting,
  modelLoaded,
  onOpenFilePicker,
  onSettingsChange,
  onExport,
}) {
  const handleNumericChange = (key, value, min, max) => {
    const parsed = Number(value)
    if (Number.isNaN(parsed)) {
      return
    }
    const clamped = Math.max(min, Math.min(max, parsed))
    onSettingsChange((prev) => ({ ...prev, [key]: clamped }))
  }

  return (
    <div className="control-panel">
      <label>
        Model
        <button
          type="button"
          disabled={isExporting}
          onClick={onOpenFilePicker}
        >
          Upload OBJ/FBX
        </button>
      </label>

      <label>
        Background
        <select
          value={settings.backgroundPreset}
          disabled={isExporting}
          onChange={(event) =>
            onSettingsChange((prev) => ({ ...prev, backgroundPreset: event.target.value }))
          }
        >
          <option value="white">White Studio</option>
          <option value="dark">Dark Studio</option>
        </select>
      </label>

      <label>
        Frames/Second
        <select
          value={settings.fps}
          disabled={isExporting}
          onChange={(event) => handleNumericChange('fps', event.target.value, 24, 60)}
        >
          <option value={24}>24</option>
          <option value={30}>30</option>
          <option value={60}>60</option>
        </select>
      </label>

      <label>
        Rotation Lap Count
        <input
          type="number"
          min={1}
          max={100}
          step={1}
          value={settings.lapCount}
          disabled={isExporting}
          onChange={(event) => handleNumericChange('lapCount', event.target.value, 1, 100)}
        />
      </label>

      <label>
        Rotation Speed (degrees/second)
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={settings.rotationSpeed}
          disabled={isExporting}
          onChange={(event) => handleNumericChange('rotationSpeed', event.target.value, 0, 100)}
        />
        <span className="slider-value">{settings.rotationSpeed.toFixed(1)}</span>
      </label>
      <div className="slider-value">Calculated Frames: {calculatedFrameCount}</div>

      <label>
        Rotation Axis
        <select
          value={settings.rotationAxis}
          disabled={isExporting}
          onChange={(event) =>
            onSettingsChange((prev) => ({ ...prev, rotationAxis: event.target.value }))
          }
        >
          <option value="x">X</option>
          <option value="y">Y</option>
          <option value="z">Z</option>
        </select>
      </label>

      <label>
        Direction
        <select
          value={settings.direction}
          disabled={isExporting}
          onChange={(event) =>
            onSettingsChange((prev) => ({ ...prev, direction: event.target.value }))
          }
        >
          <option value="clockwise">Clockwise</option>
          <option value="counterclockwise">Counterclockwise</option>
        </select>
      </label>

      <label>
        Resolution Width (px)
        <input
          type="number"
          min={240}
          max={4096}
          value={settings.resolutionWidth}
          disabled={isExporting}
          onChange={(event) => handleNumericChange('resolutionWidth', event.target.value, 240, 4096)}
        />
      </label>

      <label>
        Resolution Height (px)
        <input
          type="number"
          min={240}
          max={4096}
          value={settings.resolutionHeight}
          disabled={isExporting}
          onChange={(event) =>
            handleNumericChange('resolutionHeight', event.target.value, 240, 4096)
          }
        />
      </label>

      <label>
        Brightness Multiplier
        <input
          type="range"
          min={0}
          max={1000}
          step={1}
          value={settings.brightness}
          disabled={isExporting}
          onChange={(event) => handleNumericChange('brightness', event.target.value, 0, 1000)}
        />
        <span className="slider-value">{settings.brightness}</span>
      </label>

      <label>
        Reflection (metalness)
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={settings.reflection}
          disabled={isExporting}
          onChange={(event) => handleNumericChange('reflection', event.target.value, 0, 1)}
        />
        <span className="slider-value">{settings.reflection.toFixed(2)}</span>
      </label>

      <button
        type="button"
        className="export-button"
        disabled={!modelLoaded || isExporting}
        onClick={onExport}
      >
        {isExporting ? 'Exporting...' : 'Export MP4'}
      </button>
    </div>
  )
}

export default ControlPanel
