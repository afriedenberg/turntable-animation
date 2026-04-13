const DEG_TO_RAD = Math.PI / 180

export function getTurntableAngle(frameIndex, rotationSpeedDegreesPerFrame) {
  return frameIndex * rotationSpeedDegreesPerFrame * DEG_TO_RAD
}

export function getSignedRotationSpeed(rotationSpeedDegreesPerFrame, direction) {
  return direction === 'counterclockwise'
    ? -rotationSpeedDegreesPerFrame
    : rotationSpeedDegreesPerFrame
}

export function applyTurntableRotation(rotationTarget, axis, angle) {
  rotationTarget.x = axis === 'x' ? angle : 0
  rotationTarget.y = axis === 'y' ? angle : 0
  rotationTarget.z = axis === 'z' ? angle : 0
}
