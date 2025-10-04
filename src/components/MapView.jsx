// src/components/MapView.js
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import proj4 from "proj4";
// import { createSectorPolygon } from "../utils/coverageUtils";

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
        console.log(data);

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
        const [x, y] = tower.geometry.coordinates; // UTM coords
        const [lng, lat] = proj4(utm39, wgs84, [x, y]);
        return (
          <Marker position={[lat, lng]} icon={towerIcon}>
            <Popup>Hello, this is a tower</Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default MapView;
