// Wraps navigator.geolocation.watchPosition with throttled pushes to
// the backend — watchPosition can fire far more often than a delivery
// map needs (sometimes every couple seconds), so updates are only sent
// at most once every MIN_INTERVAL_MS regardless of how often the
// browser reports a new fix.

const MIN_INTERVAL_MS = 15000

/**
 * Starts sharing live location. Calls onUpdate(lat, lng) at most once
 * every 15s. Returns a stop() function — always call it (component
 * unmount, toggled off, order no longer out for delivery) or the
 * browser keeps the GPS active in the background.
 */
export function startSharingLocation({ onUpdate, onError }) {
  if (!('geolocation' in navigator)) {
    onError?.(new Error('Location sharing is not supported on this device.'))
    return () => {}
  }

  let lastSentAt = 0

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const now = Date.now()
      if (now - lastSentAt < MIN_INTERVAL_MS) return
      lastSentAt = now
      onUpdate({ lat: position.coords.latitude, lng: position.coords.longitude })
    },
    (err) => {
      const message =
        err.code === err.PERMISSION_DENIED
          ? 'Location permission was denied. Enable it in your browser/device settings to share live location.'
          : 'Could not get your location. Please check your device settings.'
      onError?.(new Error(message))
    },
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
  )

  return () => navigator.geolocation.clearWatch(watchId)
}
