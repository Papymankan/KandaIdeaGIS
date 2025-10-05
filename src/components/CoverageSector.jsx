import React from "react";
import { Polygon } from "react-leaflet";
import * as turf from "@turf/turf";
import proj4 from "proj4";
import { createSectorPolygon } from "../utils";

const utm39 = "+proj=utm +zone=39 +datum=WGS84 +units=m +no_defs";
const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";
const utmToLatLng = (x, y) => proj4(utm39, wgs84, [x, y]);



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
