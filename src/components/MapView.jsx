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
import ReactModal from "react-modal";
import { Dialog } from "@headlessui/react";

ReactModal.setAppElement("#root");

const centerTehran = [35.6892, 51.389];

function MapView() {
  const [towers, setTowers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [coverageResults, setCoverageResults] = useState(null);
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

  const MapEventHandler = () => {
    const map = useMapEvents({
      "draw:created": (e) => handleDrawCreated(e),
    });
    return null;
  };

  const handleDrawCreated = (e) => {
    const layer = e.layer;
    const latlngs = layer.getLatLngs()[0];

    const coords = latlngs.map((p) => [p.lng, p.lat]);

    if (
      coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1]
    ) {
      coords.push(coords[0]);
    }

    const drawnPolygon = turf.polygon([coords]);
    // const drawnPolygon = turf.geometry("Polygon", [coords]);
    const results = {};

    towers.forEach((tower) => {
      const [x, y] = tower.geometry.coordinates;
      const [lng, lat] = proj4(utm39, wgs84, [x, y]);

      tower.properties.cells.forEach((cell) => {
        const sectorCoords = createSectorPolygon(
          [lng, lat],
          cell.azimuth,
          cell.coverage_angle,
          cell.coverage_length
        );

        if (
          sectorCoords[0][0] !== sectorCoords[sectorCoords.length - 1][0] ||
          sectorCoords[0][1] !== sectorCoords[sectorCoords.length - 1][1]
        ) {
          sectorCoords.push(sectorCoords[0]);
        }

        const sectorPolygon = turf.polygon([
          sectorCoords.map(([lat, lng]) => [lng, lat]),
        ]);

        // const sectorPolygon = turf.geometry("Polygon", [
        //   sectorCoords.map(([lat, lng]) => [lng, lat]),
        // ]);

        try {
          const drawnValid = turf.booleanValid(drawnPolygon);
          const sectorValid = turf.booleanValid(sectorPolygon);

          if (!drawnValid || !sectorValid) {
            return;
          }

          const intersects = turf.booleanIntersects(
            drawnPolygon,
            sectorPolygon
          );

          if (intersects) {
            console.log(cell.cell_id + " intersects");

            try {
              console.log(drawnPolygon);
              console.log(sectorPolygon);

              const intersection = turf.intersect(turf.featureCollection([drawnPolygon, sectorPolygon]) );
              if (intersection) {
                const intersectionArea = turf.area(intersection);
                results[cell.network_type] =
                  (results[cell.network_type] || 0) + intersectionArea;
              }
            } catch (err) {
              console.warn(
                `Intersection calculation failed for cell ${cell.cell_id}:`,
                err
              );
            }
          }
        } catch (err) {
          console.warn("Intersection calculation failed:", err);
        }
      });
    });

    setCoverageResults(results);
    setShowModal(true);

    const map = featureGroupRef.current._map;
    map.removeLayer(e.layer);
  };

  return (
    <>
      <MapContainer
        center={centerTehran}
        zoom={12}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: "16px",
          zIndex: 1,
        }}
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

        <MapEventHandler />
      </MapContainer>

      {coverageResults && (
        <Dialog
          open={showModal}
          onClose={() => setShowModal(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white rounded-lg p-6 max-w-sm mx-auto">
              <Dialog.Title className="text-lg font-bold mb-2">
                Intersection Results
              </Dialog.Title>
              <ul>
                {Object.entries(coverageResults).map(([type, area]) => (
                  <li key={type}>
                    {type}: {area.toFixed(2)} m²
                  </li>
                ))}
              </ul>
              <button
                className="mt-4 bg-blue-500 text-white px-3 py-1 rounded"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </>
  );
}

export default MapView;
