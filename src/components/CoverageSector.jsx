import React from "react";
import { Polygon } from "react-leaflet";
import * as turf from "@turf/turf";
import proj4 from "proj4";

const utm39 = "+proj=utm +zone=39 +datum=WGS84 +units=m +no_defs";
const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";
const utmToLatLng = (x, y) => proj4(utm39, wgs84, [x, y]);

const createSectorPolygon = (
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

const CoverageSector = ({ tower, cell }) => {
  const [x, y] = tower.geometry.coordinates;
  const center = utmToLatLng(x, y);

  const sectorPoints = createSectorPolygon(
    center,
    cell.azimuth,
    cell.coverage_angle,
    cell.coverage_length
  );

  const color =
    cell.network_type === "4G"
      ? "blue"
      : cell.network_type === "3G"
      ? "green"
      : "red";

  return (
    <Polygon positions={sectorPoints} pathOptions={{ color, fillOpacity: .2 }} />
  );
};

export default CoverageSector;
