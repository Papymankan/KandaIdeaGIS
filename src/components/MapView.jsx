// src/components/MapView.js
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import proj4 from "proj4";
import CoverageSector from "./CoverageSector";

const centerTehran = [35.6892, 51.389];

function MapView() {
  const [towers, setTowers] = useState([]);

  const towerIcon = L.icon({
    iconUrl: "public/icons8-tower-48.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  useEffect(() => {
    fetch("/Data/CellTowersInTehran.geojson")
      .then((res) => res.json())
      .then((data) => {

        setTowers(data.features);
      });
  }, []);

  const utm39 = "+proj=utm +zone=39 +datum=WGS84 +units=m +no_defs";
  const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";

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

      {towers.map((tower, i) => {
        const [x, y] = tower.geometry.coordinates;
        const [lng, lat] = proj4(utm39, wgs84, [x, y]);

        return (
          <React.Fragment key={tower.properties.tower_id}>
            {/* Marker */}
            <Marker position={[lat, lng]} icon={towerIcon}>
              <Popup>Tower ID: {tower.properties.tower_id}</Popup>
            </Marker>

            {/* Coverage sectors */}
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
    </MapContainer>
  );
}

export default MapView;
