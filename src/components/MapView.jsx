import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  FeatureGroup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import proj4 from "proj4";
import CoverageSector from "./CoverageSector";
import { EditControl } from "react-leaflet-draw";
import * as turf from "@turf/turf";
import { createSectorPolygon } from "../utils";

const centerTehran = [35.6892, 51.389];

function MapView() {
  const [towers, setTowers] = useState([]);
  const featureGroupRef = useRef(null);

  const towerIcon = L.icon({
    iconUrl: "public/icons8-tower-48.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  useEffect(() => {
    fetch("/Data/CellTowersInTehran.geojson")
      .then((res) => res.json())
      .then((data) => setTowers(data.features));
  }, []);

  const utm39 = "+proj=utm +zone=39 +datum=WGS84 +units=m +no_defs";
  const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";

  // 🧠 Attach Leaflet draw:created event manually
  const MapEventHandler = () => {
    const map = useMapEvents({
      "draw:created": (e) => handleDrawCreated(e),
    });
    return null;
  };

  const handleDrawCreated = (e) => {
    const layer = e.layer;
    const latlngs = layer.getLatLngs()[0];
    const coords = latlngs.map((p) => [p.lat, p.lng]);

    // Ensure polygon is closed
    if (
      coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1]
    ) {
      coords.push(coords[0]);
    }

    // Create drawn polygon
    const drawnPolygon = turf.polygon([coords]);
    const results = {};

    towers.forEach((tower) => {
      const [x, y] = tower.geometry.coordinates;
      const [lng, lat] = proj4(utm39, wgs84, [x, y]);

      tower.properties.cells.forEach((cell) => {
        const sectorCoords = createSectorPolygon(
          [lat, lng],
          cell.azimuth,
          cell.coverage_angle,
          cell.coverage_length
        );

        // Ensure sector polygon is closed
        if (
          sectorCoords[0][0] !== sectorCoords[sectorCoords.length - 1][0] ||
          sectorCoords[0][1] !== sectorCoords[sectorCoords.length - 1][1]
        ) {
          sectorCoords.push(sectorCoords[0]);
        }

        const sectorPolygon = turf.polygon([
          sectorCoords.map(([lat, lng]) => [lng, lat]),
        ]);

        try {
          // Validate polygons
          const drawnValid = turf.booleanValid(drawnPolygon);
          const sectorValid = turf.booleanValid(sectorPolygon);

          if (!drawnValid || !sectorValid) {
            return;
          }

          // Check for intersection
          const intersects = turf.booleanIntersects(
            drawnPolygon,
            sectorPolygon
          );

          if (intersects) {
            // Get bounding boxes
            const drawnBbox = turf.bbox(drawnPolygon);
            const sectorBbox = turf.bbox(sectorPolygon);

            // Calculate intersection bbox
            const intersectBbox = [
              Math.max(drawnBbox[0], sectorBbox[0]),
              Math.max(drawnBbox[1], sectorBbox[1]),
              Math.min(drawnBbox[2], sectorBbox[2]),
              Math.min(drawnBbox[3], sectorBbox[3]),
            ];

            // Clip polygons to intersection bbox and calculate area
            const clippedDrawn = turf.bboxClip(drawnPolygon, intersectBbox);
            const clippedSector = turf.bboxClip(sectorPolygon, intersectBbox);

            if (
              turf.booleanValid(clippedDrawn) &&
              turf.booleanValid(clippedSector)
            ) {
              const intersectionArea = Math.min(
                turf.area(clippedDrawn),
                turf.area(clippedSector)
              );
              if (intersectionArea > 0) {
                results[cell.network_type] =
                  (results[cell.network_type] || 0) + intersectionArea;
              }
            }
          }
        } catch (err) {
          console.warn("Intersection calculation failed:", err);
        }
      });
    });

    console.log("Coverage results:", results);
  };


  return (
    <MapContainer
      center={centerTehran}
      zoom={12}
      style={{ height: "100%", width: "100%", borderRadius: "16px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {towers.map((tower) => {
        const [x, y] = tower.geometry.coordinates;
        const [lng, lat] = proj4(utm39, wgs84, [x, y]);

        return (
          <React.Fragment key={tower.properties.tower_id}>
            <Marker position={[lat, lng]} icon={towerIcon}>
              <Popup>Tower ID: {tower.properties.tower_id}</Popup>
            </Marker>

            {tower.properties.cells.map((cell, idx) => (
              <CoverageSector
                key={tower.properties.tower_id + "-" + idx}
                tower={tower}
                cell={cell}
              />
            ))}
          </React.Fragment>
        );
      })}

      <FeatureGroup ref={featureGroupRef}>
        <EditControl
          position="topright"
          draw={{
            rectangle: false,
            circle: false,
            marker: false,
            polyline: false,
            polygon: true,
          }}
        />
      </FeatureGroup>

      {/* 👇 This hooks the native Leaflet draw:created event */}
      <MapEventHandler />
    </MapContainer>
  );
}

export default MapView;
