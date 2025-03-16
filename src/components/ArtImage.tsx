import { useState, useEffect } from "react";

interface ArtImageProps {
  accessionNumber: string;
}

export const ArtImage = ({ accessionNumber }: ArtImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!accessionNumber) return;

    // Reset states when accession number changes
    setImageLoaded(false);
    setImageError(false);

    // Construct the image URL using the accession number
    const url = `https://kiosk.sfartscommission.org/Media/images/${accessionNumber}/${accessionNumber}_overall.jpg`;
    setImageUrl(url);
  }, [accessionNumber]);

  return (
    <div className="art-image-container">
      {!imageLoaded && !imageError && (
        <div className="image-loading">
          <p>Loading image...</p>
        </div>
      )}

      {imageError && (
        <div className="image-fallback">
          <p>No image available</p>
        </div>
      )}

      {imageUrl && (
        <img
          src={imageUrl}
          alt="Artwork"
          className={`art-image ${imageLoaded ? "loaded" : "loading"}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          style={{ display: imageLoaded && !imageError ? "block" : "none" }}
        />
      )}
    </div>
  );
};
