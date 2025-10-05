import * as turf from "@turf/turf";


export const createSectorPolygon = (
  centerLatLng,
  azimuth,
  coverageAngle,
  coverageLength
) => {
  const numPoints = 50;
  const angleStep = coverageAngle / numPoints;
  const startAngle = azimuth - coverageAngle / 2;

  const points = [[centerLatLng[1] , centerLatLng[0]]];

  for (let i = 0; i <= numPoints; i++) {
    const angle = startAngle + i * angleStep;
    const point = turf.destination(
      turf.point([centerLatLng[0], centerLatLng[1]]),
      coverageLength / 1000,
      angle,
      { units: "kilometers" }
    ).geometry.coordinates;
    
    points.push([point[1], point[0]]);
  }

  points.push([centerLatLng[1] , centerLatLng[0]]);
  return points;
};