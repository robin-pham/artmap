import geojson from "../src/assets/CivicArtCollection_cleaned.json";
import * as fs from "fs";

type GeoJSONFeature = (typeof geojson.features)[0];

function categorizeArtwork(feature: GeoJSONFeature): string {
  const medium = (feature.properties.medium || "").toLowerCase();
  const mediaSupport = (feature.properties.media_support || "").toLowerCase();
  const combinedMedium = `${medium} ${mediaSupport}`;

  if (combinedMedium.includes("oil") || combinedMedium.includes("acrylic")) {
    return "Painting";
  }
  if (
    combinedMedium.includes("bronze") ||
    combinedMedium.includes("sculpture") ||
    combinedMedium.includes("granite") ||
    combinedMedium.includes("stone") ||
    combinedMedium.includes("cast concrete") ||
    combinedMedium.includes("steel")
  ) {
    return "Sculpture";
  }
  if (combinedMedium.includes("mosaic") || combinedMedium.includes("tile")) {
    return "Mosaic";
  }
  if (combinedMedium.includes("fresco")) {
    return "Fresco";
  }
  if (combinedMedium.includes("glass") && !combinedMedium.includes("mosaic")) {
    return "Glasswork";
  }
  if (
    combinedMedium.includes("photo") ||
    combinedMedium.includes("gelatin print") ||
    combinedMedium.includes("pigment print")
  ) {
    return "Photography";
  }
  if (combinedMedium.includes("mixed media")) {
    return "Mixed Media";
  }
  if (
    combinedMedium.includes("textile") ||
    combinedMedium.includes("fabric") ||
    combinedMedium.includes("tapestry") ||
    combinedMedium.includes("cotton thread")
  ) {
    return "Textile";
  }
  if (
    combinedMedium.includes("print") &&
    !combinedMedium.includes("pigment print")
  ) {
    return "Printmaking";
  }
  if (combinedMedium.includes("digital")) {
    return "Digital Art";
  }
  if (
    combinedMedium.includes("ceramic") &&
    !combinedMedium.includes("mosaic")
  ) {
    return "Ceramics";
  }
  if (combinedMedium.includes("installation")) {
    return "Installation";
  }
  if (combinedMedium.includes("relief") || combinedMedium.includes("wall")) {
    return "Relief / Wall Art";
  }

  return "Uncategorized";
}

function processFeatures(): void {
  const categories: { [key: string]: number } = {};
  const total = geojson.features.length;

  // Add categories to features
  const categorizedFeatures = geojson.features.map((feature) => {
    const category = categorizeArtwork(feature);
    categories[category] = (categories[category] || 0) + 1;

    return {
      ...feature,
      properties: {
        ...feature.properties,
        category,
      },
    };
  });

  // Output statistics
  console.log("\nArtwork Categories:");
  console.log("=================");
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      const percentage = ((count / total) * 100).toFixed(2);
      console.log(`${category}: ${count} (${percentage}%)`);
    });

  // Create new GeoJSON with categorized features
  const outputGeojson = {
    ...geojson,
    features: categorizedFeatures,
  };

  // Write to new file
  const outputPath = "../src/assets/CivicArtCollection_categorized.json";
  fs.writeFileSync(outputPath, JSON.stringify(outputGeojson, null, 2));
  console.log(`\nProcessing complete. Output saved to ${outputPath}`);
}

// Execute the script
processFeatures();
