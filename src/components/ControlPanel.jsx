function ControlPanel({
  settings,
  calculatedFrameCount,
  isResolutionValid,
  isExporting,
  onSettingsChange,
}) {
  const handleNumericChange = (key, value, min, max) => {
    const parsed = Number(value)
    if (Number.isNaN(parsed)) {
      return
    }
    const clamped = Math.max(min, Math.min(max, parsed))
    onSettingsChange((prev) => ({ ...prev, [key]: clamped }))
  }

  const getSliderPercent = (value, min, max) => {
    if (max <= min) {
      return 0
    }
    return ((value - min) / (max - min)) * 100
  }

  const sliderBubbleStyle = (value, min, max) => ({
    left: `${getSliderPercent(value, min, max)}%`,
  })

  const handleUnboundedNumericChange = (key, value) => {
    const parsed = Number(value)
    if (Number.isNaN(parsed)) {
      return
    }
    onSettingsChange((prev) => ({ ...prev, [key]: parsed }))
  }

  return (
    <div className="control-panel">
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
        Revolutions
        <div className="slider-control">
          <span className="slider-bubble" style={sliderBubbleStyle(settings.lapCount, 0, 20)}>
            {settings.lapCount.toFixed(1)}
          </span>
          <input
            type="range"
            min={0}
            max={20}
            step={0.1}
            value={settings.lapCount}
            disabled={isExporting}
            onChange={(event) => handleNumericChange('lapCount', event.target.value, 0, 20)}
          />
        </div>
      </label>

      <label>
        Rotation Speed (degrees/second)
        <div className="slider-control">
          <span className="slider-bubble" style={sliderBubbleStyle(settings.rotationSpeed, 0, 200)}>
            {settings.rotationSpeed.toFixed(1)}
          </span>
          <input
            type="range"
            min={0}
            max={200}
            step={0.1}
            value={settings.rotationSpeed}
            disabled={isExporting}
            onChange={(event) => handleNumericChange('rotationSpeed', event.target.value, 0, 200)}
          />
        </div>
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
          className="resolution-input"
          value={settings.resolutionWidth}
          disabled={isExporting}
          onChange={(event) => handleUnboundedNumericChange('resolutionWidth', event.target.value)}
        />
      </label>

      <label>
        Resolution Height (px)
        <input
          type="number"
          className="resolution-input"
          value={settings.resolutionHeight}
          disabled={isExporting}
          onChange={(event) => handleUnboundedNumericChange('resolutionHeight', event.target.value)}
        />
      </label>
      {!isResolutionValid ? (
        <div className="slider-value">Resolution must be between 64 and 3840.</div>
      ) : null}

      <label>
        Brightness Multiplier
        <div className="slider-control">
          <span className="slider-bubble" style={sliderBubbleStyle(settings.brightness, 0, 1000)}>
            {settings.brightness}
          </span>
          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={settings.brightness}
            disabled={isExporting}
            onChange={(event) => handleNumericChange('brightness', event.target.value, 0, 1000)}
          />
        </div>
      </label>

      <label>
        Reflection (metalness)
        <div className="slider-control">
          <span className="slider-bubble" style={sliderBubbleStyle(settings.reflection, 0, 1)}>
            {settings.reflection.toFixed(2)}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.reflection}
            disabled={isExporting}
            onChange={(event) => handleNumericChange('reflection', event.target.value, 0, 1)}
          />
        </div>
      </label>

    </div>
  )
}

export default ControlPanel
