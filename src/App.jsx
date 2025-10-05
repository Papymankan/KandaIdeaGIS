import MapView from "./components/MapView";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet/dist/leaflet.css";


function App() {
  return (
    <>
      <div className="flex justify-center h-dvh w-full py-20">
        <div className="mx-40 rounded-2xl border-2 w-full">
          <MapView />
        </div>
      </div>
    </>
  );
}

export default App;
