import { useState, useEffect } from "react";
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";
import { CivicArtType } from "./type";
import artGeoJson from "./assets/CivicArtCollection_categorized.json";
import { Drawer } from "vaul";
import { ArtworkContent } from "./components/ArtworkContent";
import { CategoryFilter } from "./components/CategoryFilter";
import { ArtworkCategory } from "./types/categories";

function App() {
  const [artData, setArtData] = useState<{
    features: {
      geometry: { coordinates: number[] };
      properties: CivicArtType;
    }[];
  } | null>(null);
  const [selectedArt, setSelectedArt] = useState<CivicArtType | null>(null);
  const [popupCoordinates, setPopupCoordinates] = useState<
    [number, number] | null
  >(null);
  const [isMobile, setIsMobile] = useState(false);
  const [snap, setSnap] = useState<number | string | null>("250px"); // Smaller initial height
  const [selectedCategories, setSelectedCategories] = useState<
    ArtworkCategory[]
  >([]);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Load GeoJSON data
  useEffect(() => {
    setArtData(artGeoJson);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const deselectArt = () => {
    setSelectedArt(null);
    setPopupCoordinates(null);
  };

  const handleMapClick = () => {
    deselectArt();
    setIsFilterExpanded(false);
  };

  // Filter features based on selected categories
  const filteredFeatures = artData?.features.filter(
    (feature) =>
      selectedCategories.length === 0 ||
      selectedCategories.includes(
        feature.properties.category as ArtworkCategory
      )
  );

  return (
    <div className="app-container">
      <div className="map-container">
        <Map
          initialViewState={{
            longitude: -122.4194, // Default to San Francisco coordinates
            latitude: 37.7749,
            zoom: 12,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          onClick={handleMapClick}
        >
          <NavigationControl position="top-right" />

          <CategoryFilter
            selectedCategories={selectedCategories}
            onCategoryChange={setSelectedCategories}
            filteredCount={filteredFeatures?.length || 0}
            totalCount={artData?.features.length || 0}
            isExpanded={isFilterExpanded}
            onExpandChange={(expanded) => {
              setIsFilterExpanded(expanded);
              if (expanded) {
                deselectArt(); // Close popup when opening filter
              }
            }}
          />

          {filteredFeatures?.map((feature, index) => {
            const properties = feature.properties;
            const potentialCoordinates = {
              longitude: 0,
              latitude: 0,
            };

            if (!feature.geometry.coordinates) {
              console.log("missing coordinates");
            } else {
              potentialCoordinates.longitude = feature.geometry.coordinates[0];
              potentialCoordinates.latitude = feature.geometry.coordinates[1];
            }

            if (
              potentialCoordinates.longitude === 0 ||
              potentialCoordinates.latitude === 0
            ) {
              console.log("missing both");
            }

            return (
              <Marker
                key={`marker-${index}`}
                longitude={parseFloat(potentialCoordinates.longitude)}
                latitude={parseFloat(potentialCoordinates.latitude)}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedArt(properties);
                  setPopupCoordinates([
                    parseFloat(potentialCoordinates.longitude),
                    parseFloat(potentialCoordinates.latitude),
                  ]);
                }}
              >
                <div className="marker-pin" />
              </Marker>
            );
          })}

          {selectedArt && (
            <>
              {!isMobile ? (
                <Popup
                  longitude={popupCoordinates![0]}
                  latitude={popupCoordinates![1]}
                  anchor="bottom"
                  onClose={() => {
                    setSelectedArt(null);
                    setPopupCoordinates(null);
                  }}
                  className="art-popup"
                >
                  <div className="popup-content">
                    <ArtworkContent selectedArt={selectedArt} />
                  </div>
                </Popup>
              ) : (
                <Drawer.Root
                  open={selectedArt !== null}
                  onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      setSelectedArt(null);
                      setPopupCoordinates(null);
                    }
                  }}
                  activeSnapPoint={snap}
                  setActiveSnapPoint={setSnap}
                  modal={false}
                >
                  <Drawer.Portal>
                    <Drawer.Content className="drawer-content">
                      <Drawer.Title className="visually-hidden">
                        {selectedArt.display_title}
                      </Drawer.Title>
                      <Drawer.Handle className="drawer-handle" />
                      <div className="drawer-inner">
                        <ArtworkContent selectedArt={selectedArt} />
                      </div>
                    </Drawer.Content>
                  </Drawer.Portal>
                </Drawer.Root>
              )}
            </>
          )}
        </Map>
      </div>
    </div>
  );
}

export default App;
