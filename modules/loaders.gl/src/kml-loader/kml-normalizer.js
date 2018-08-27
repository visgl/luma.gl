export default function normalizeKML(kml) {
  // Convert coordinates to [lng, lat, z] format
  for (const key in kml) {
    for (const item of kml[key]) {
      normalizeKMLItem(item, key);
    }
  }
  return kml;
}

// Normalizes coordinates to lng/lat format
function normalizeKMLItem(item) {
  if (item.coordinates && item.coordinates.length) {
    if (Array.isArray(item.coordinates[0])) {
      item.coordinates = item.coordinates.map(([lat, lng, z = 0]) => [lng, lat, z]);
    } else {
      // Marker coordinates are just a single coord (not an array of coords)
      const [lat, lng, z = 0] = item.coordinates;
      item.coordinates = [lng, lat, z];
    }
  }
}
