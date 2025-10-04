// src/components/MapView.js
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
// import { createSectorPolygon } from "../utils/coverageUtils";

const centerTehran = [35.6892, 51.3890];

function MapView() {
  const [towers, setTowers] = useState([]);

  useEffect(() => {
    fetch("/data/towers.geojson")
      .then((res) => res.json())
      .then((data) => setTowers(data.features));
  }, []);

  return (
    <MapContainer
      center={centerTehran}
      zoom={12}
      style={{ height: "100%", width: "100%" , borderRadius:"16px"}}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {towers.map((tower, i) => {
        // const [x, y] = tower.geometry.coordinates; // UTM? -> should convert to lat/lng if needed
        // const latlng = [y, x]; // assuming GeoJSON in lon/lat

        // return (
        //   <React.Fragment key={i}>
        //     <Marker position={latlng}>
        //       <Popup>
        //         <strong>Tower:</strong> {tower.properties.name || "No ID"}
        //       </Popup>
        //     </Marker>

        //     {tower.properties.cells &&
        //       tower.properties.cells.map((cell, idx) => {
        //         const sector = createSectorPolygon(latlng, cell);
        //         return (
        //           <Polygon
        //             key={idx}
        //             positions={sector}
        //             pathOptions={{
        //               color:
        //                 cell.network_type === "4G"
        //                   ? "blue"
        //                   : cell.network_type === "5G"
        //                   ? "red"
        //                   : "green",
        //               fillOpacity: 0.2,
        //             }}
        //           />
        //         );
        //       })}
        //   </React.Fragment>
        // );
      })}
    </MapContainer>
  );
}

export default MapView;
