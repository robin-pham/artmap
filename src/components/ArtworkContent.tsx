import { CivicArtType } from "../type";
import { useEffect, useRef } from "react";
import { ArtImage } from "./ArtImage";

interface ArtworkContentProps {
  selectedArt: CivicArtType;
}

export const ArtworkContent = ({ selectedArt }: ArtworkContentProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to top when the component mounts
    if (contentRef.current) {
      // Find the closest scrollable parent (either the content div itself or its parent container)
      const scrollToTop = () => {
        let parent = contentRef.current?.parentElement;
        while (parent) {
          if (parent.scrollHeight > parent.clientHeight) {
            parent.scrollTop = 0;
            break;
          }
          parent = parent.parentElement;
        }
      };

      // Small timeout to ensure the DOM is fully rendered
      setTimeout(scrollToTop, 10);
    }
  }, [selectedArt]);

  const getGoogleStreetViewUrl = (lat: string, lng: string) => {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  };

  return (
    <div ref={contentRef}>
      <h3>{selectedArt.display_title}</h3>

      {/* Artwork Image */}
      <div className="popup-section artwork-image-section">
        <ArtImage accessionNumber={selectedArt.accession_number} />
      </div>

      {/* Artwork Details */}
      <div className="popup-section">
        <h4>Artwork Details</h4>
        <div className="info-grid">
          <div className="info-item">
            <strong>Artist</strong>
            <span>{selectedArt.artist || "Unknown"}</span>
          </div>
          <div className="info-item">
            <strong>Created</strong>
            <span>{selectedArt.creation_date || "Unknown"}</span>
          </div>
          <div className="info-item">
            <strong>Medium</strong>
            <span>{selectedArt.medium || "N/A"}</span>
          </div>
          <div className="info-item">
            <strong>Media Support</strong>
            <span>{selectedArt.media_support || "N/A"}</span>
          </div>
          <div className="info-item">
            <strong>Dimensions</strong>
            <span>{selectedArt.display_dimensions || "N/A"}</span>
          </div>
          <div className="info-item">
            <strong>Accession Number</strong>
            <span>{selectedArt.accession_number || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="popup-section">
        <h4>Location Information</h4>
        <div className="info-grid">
          <div className="info-item">
            <strong>Location</strong>
            <span>{selectedArt.location_description || "N/A"}</span>
          </div>
          <div className="info-item">
            <strong>Facility</strong>
            <span>{selectedArt.facility || "N/A"}</span>
          </div>
          <div className="info-item">
            <strong>Address</strong>
            <span>{selectedArt.street_address_or_intersection || "N/A"}</span>
          </div>
          <div className="info-item">
            <strong>Neighborhood</strong>
            <span>{selectedArt.analysis_neighborhood || "N/A"}</span>
          </div>
          <div className="info-item">
            <strong>Cultural District</strong>
            <span>{selectedArt.cultural_districts || "N/A"}</span>
          </div>
          <div className="info-item">
            <strong>Supervisor District</strong>
            <span>{selectedArt.supervisor_district || "N/A"}</span>
          </div>
          <div className="info-item">
            <strong>ZIP Code</strong>
            <span>{selectedArt.zip_code || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Credit Line */}
      <div className="popup-section">
        <div className="info-item" style={{ gridColumn: "1 / -1" }}>
          <strong>Credit Line</strong>
          <span>{selectedArt.credit_line || "N/A"}</span>
        </div>
      </div>

      {/* Data Information */}
      <div className="popup-section">
        <h4>Data Information</h4>
        <div className="info-grid">
          <div className="info-item">
            <strong>Data as of</strong>
            <span>{new Date(selectedArt.data_as_of).toLocaleDateString()}</span>
          </div>
          <div className="info-item">
            <strong>Data loaded</strong>
            <span>
              {new Date(selectedArt.data_loaded_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <a
        href={getGoogleStreetViewUrl(
          selectedArt.latitude,
          selectedArt.longitude
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="street-view-link"
      >
        View on Google Street View
      </a>
    </div>
  );
};
