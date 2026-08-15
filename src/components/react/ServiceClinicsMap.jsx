import { useEffect, useMemo, useState } from 'react';

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clinicLabel(clinic) {
  if (clinic.servicePrice?.price) return `${Number(clinic.servicePrice.price).toFixed(0)} euro`;
  if (clinic.hasExactDeclaredService) return 'Prestazione dichiarata';
  if (clinic.hasRelatedDeclaredService) return 'Servizio correlato: chiedi conferma';
  if (clinic.hasInferredService) return 'Servizio affine: chiedi conferma';
  return 'Chiedi disponibilita';
}

function openStreetMapEmbedUrl(lat, lng, zoom = 13) {
  const delta = zoom >= 13 ? 0.018 : 0.08;
  const west = lng - delta;
  const south = lat - delta;
  const east = lng + delta;
  const north = lat + delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export default function ServiceClinicsMap({ clinics = [], locationLabel = '', serviceName = '' }) {
  const [leaflet, setLeaflet] = useState(null);
  const points = useMemo(
    () => clinics
      .map((clinic) => ({ ...clinic, lat: asNumber(clinic.lat), lng: asNumber(clinic.lng) }))
      .filter((clinic) => clinic.lat !== null && clinic.lng !== null)
      .slice(0, 10),
    [clinics]
  );
  const center = useMemo(() => {
    if (points.length === 0) return [41.9027835, 12.4963655];
    const sum = points.reduce((acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng,
    }), { lat: 0, lng: 0 });
    return [sum.lat / points.length, sum.lng / points.length];
  }, [points]);
  const zoom = points.length > 1 ? 12 : 13;
  const mapKey = `${Number(center[0]).toFixed(4)}-${Number(center[1]).toFixed(4)}-${points.length}`;

  useEffect(() => {
    let mounted = true;
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([reactLeaflet, leafletModule]) => {
      if (!mounted) return;
      setLeaflet({ ...reactLeaflet, L: leafletModule.default || leafletModule });
    }).catch(() => setLeaflet(null));
    return () => {
      mounted = false;
    };
  }, []);

  if (points.length === 0) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg bg-slate-100 p-6 text-center text-sm text-slate-600">
        Le cliniche in questa pagina non hanno ancora coordinate disponibili. Usa le card sotto per aprire dettagli, telefono o indicazioni.
      </div>
    );
  }

  if (!leaflet) {
    const [lat, lng] = center;
    return (
      <iframe
        title={`Mappa cliniche ${serviceName}${locationLabel ? ` a ${locationLabel}` : ''}`}
        src={openStreetMapEmbedUrl(lat, lng, zoom)}
        className="h-full min-h-[300px] w-full rounded-lg border-0"
        loading="lazy"
      />
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, L } = leaflet;
  const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  const greenIcon = new L.Icon({
    iconUrl: '/map/marker-icon-dark-green.svg',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <MapContainer key={mapKey} center={center} zoom={zoom} scrollWheelZoom={false} className="h-full min-h-[300px] w-full rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((clinic, index) => (
        <Marker key={clinic.id} position={[clinic.lat, clinic.lng]} icon={clinic.hasExactDeclaredService ? greenIcon : blueIcon}>
          <Popup>
            <strong>{index + 1}. {clinic.name}</strong>
            {clinic.address && <div>{clinic.address}</div>}
            <div>{clinicLabel(clinic)}</div>
            {clinic.slug && <a href={`/veterinari/${clinic.slug}`} className="text-blue-600">Vedi scheda</a>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
