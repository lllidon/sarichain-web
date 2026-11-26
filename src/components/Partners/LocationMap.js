'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

export default function LocationMap({ point, onPick }) {
  const host = useRef(null);
  const marker = useRef(null);
  const [instance, setInstance] = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  const latitude = point.latitude === '' ? NaN : Number(point.latitude);
  const longitude = point.longitude === '' ? NaN : Number(point.longitude);

  useEffect(() => {
    let map;
    let disposed = false;
    import('leaflet').then(({ default: L }) => {
      if (disposed) return;
      map = L.map(host.current, { scrollWheelZoom: false, maxBounds: [[-85, -180], [85, 180]] }).setView([32.5, 53.5], 5);
      const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, noWrap: true,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      tiles.on('tileerror', () => setUnavailable(true));
      tiles.on('tileload', () => setUnavailable(false));
      map.on('click', ({ latlng }) => onPick({ latitude: latlng.lat.toFixed(6), longitude: latlng.lng.toFixed(6) }));
      setInstance({ L, map });
    }).catch(() => { if (!disposed) setUnavailable(true); });
    return () => { disposed = true; map?.remove(); marker.current = null; };
  }, [onPick]);

  useEffect(() => {
    if (!instance) return;
    const { L, map } = instance;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    const position = L.latLng(latitude, longitude);
    if (marker.current) marker.current.setLatLng(position);
    else marker.current = L.circleMarker(position, { radius: 8, color: '#fff', weight: 3, fillColor: '#064399', fillOpacity: 1 }).addTo(map);
    if (!map.getBounds().contains(position)) map.panTo(position);
  }, [instance, latitude, longitude]);

  function pickCenter() {
    const center = instance.map.getCenter();
    onPick({ latitude: center.lat.toFixed(6), longitude: center.lng.toFixed(6) });
  }

  return <div className="partner-map-picker">
    <div ref={host} className="partner-location-map" dir="ltr" aria-label="نقشهٔ انتخاب موقعیت" />
    <div className="partner-map-caption">
      <p role="status">{unavailable ? 'نقشه در دسترس نیست. مختصات را می‌توانید دستی وارد کنید.' : 'روی نقشه بزنید تا نقطهٔ موقعیت مشخص شود.'}</p>
      {instance && !unavailable && <button type="button" className="partner-secondary" onClick={pickCenter}>انتخاب مرکز نقشه</button>}
    </div>
  </div>;
}
