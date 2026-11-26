'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export default function TransportStopsMap({ stops = [], routes = [] }) {
  const host = useRef(null);

  useEffect(() => {
    let map;
    let disposed = false;
    import('leaflet').then(({ default: L }) => {
      if (disposed || !host.current) return;
      map = L.map(host.current, { scrollWheelZoom: false, maxBounds: [[-85, -180], [85, 180]] });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18, noWrap: true,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const valid = stops.filter(point => Number.isFinite(Number(point.latitude)) && Number.isFinite(Number(point.longitude)));
      const bounds = [];
      const routeColors = ['#167d59', '#3869bd', '#a36a22', '#8056a8', '#b34e56'];
      routes.forEach((route, routeIndex) => {
        const coordinates = route.filter(point => Number.isFinite(Number(point.latitude)) && Number.isFinite(Number(point.longitude)))
          .map(point => [Number(point.latitude), Number(point.longitude)]);
        if (coordinates.length > 1) L.polyline(coordinates, { color: routeColors[routeIndex % routeColors.length], weight: 3, opacity: .7 }).addTo(map);
      });
      valid.forEach((point, index) => {
        const position = [Number(point.latitude), Number(point.longitude)];
        bounds.push(position);
        const pickup = point.kind === 'pickup';
        const popup = document.createElement('div');
        popup.textContent = (pickup ? 'مبدأ ' : 'مقصد ') + (index + 1) + ': ' + point.label + ' · ' + point.city + '، ' + point.province;
        L.circleMarker(position, {
          radius: 8, color: '#fff', weight: 2,
          fillColor: pickup ? '#16845d' : '#3869bd', fillOpacity: 1,
        }).addTo(map).bindPopup(popup);
      });
      if (bounds.length) map.fitBounds(L.latLngBounds(bounds), { padding: [24, 24], maxZoom: 12 });
      else map.setView([36.5633, 53.0601], 11);
    }).catch(() => {});
    return () => { disposed = true; map?.remove(); };
  }, [stops, routes]);

  return <div className="transport-demo-map" ref={host} dir="ltr" aria-label="نقشه نقاط بارگیری و تخلیه" />;
}
