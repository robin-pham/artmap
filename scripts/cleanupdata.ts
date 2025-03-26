import geojson from "../src/assets/CivicArtCollection_20250315.json";
import * as fs from "fs";
// import dotenv from "dotenv";
// dotenv.config();

type GeoJSONFeature = (typeof geojson.features)[0];

const features = geojson.features;

// A simple mapping from zip codes to estimated [latitude, longitude] values.
// (Note: In a real-world scenario, you might use a geocoding API for better accuracy.)
const zipCodeMapping: { [zip: string]: [number, number] } = {
  "94133": [37.784, -122.406],
  "94128": [37.615, -122.392],
  "94102": [37.781, -122.411],
  "94107": [37.77, -122.394],
  // add more mappings as needed
};

// Attempt to extract latitude and longitude from the feature's properties.
// Returns a tuple [lat, lng] if successful, otherwise null.
function getLatLngFromProperties(
  feature: GeoJSONFeature
): [number, number] | null {
  const lat = feature.properties.latitude;
  const lng = feature.properties.longitude;
  if (lat != null && lng != null) {
    const parsedLat = typeof lat === "string" ? parseFloat(lat) : lat;
    const parsedLng = typeof lng === "string" ? parseFloat(lng) : lng;
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      return [parsedLat, parsedLng];
    }
  }
  return null;
}

// If latitude/longitude aren't available from properties, try estimating using the zip code.
function getLatLngFromZip(feature: GeoJSONFeature): [number, number] | null {
  const zip = feature.properties.zip_code;
  if (zip && zipCodeMapping[zip]) {
    return zipCodeMapping[zip];
  }
  return null;
}

// This function processes a single feature:
// 1. If geometry exists, it leaves it unchanged.
// 2. If geometry is null, it tries to set it from properties or the zip code.
// The function returns the feature along with the method used (if any) to populate the geometry.
function sanitizeFeature(feature: GeoJSONFeature): {
  feature: GeoJSONFeature;
  method: string | null;
} {
  // If geometry exists and is valid, no need to change anything.
  if (
    feature.geometry &&
    feature.geometry.coordinates &&
    feature.geometry.coordinates.length === 2
  ) {
    return { feature, method: "existing" };
  }

  // Attempt to fix using latitude/longitude properties
  const fromProperties = getLatLngFromProperties(feature);
  if (fromProperties) {
    feature.geometry = {
      type: "Point",
      // GeoJSON coordinate order is [longitude, latitude]
      coordinates: [fromProperties[1], fromProperties[0]],
    };
    return { feature, method: "properties" };
  }

  // Attempt to fix using zip code mapping
  const fromZip = getLatLngFromZip(feature);
  if (fromZip) {
    feature.geometry = {
      type: "Point",
      coordinates: [fromZip[1], fromZip[0]],
    };
    return { feature, method: "zipCode" };
  }

  // Other methods (e.g., geocoding street address) could be added here.

  // Unable to fix this feature.
  return { feature, method: null };
}

// Add this near the top of the file with other constants
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY; // We'll need to set this

// Update the geocodeAddress function to use Google Maps API
async function geocodeAddress(
  address: string
): Promise<[number, number] | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("[GEOCODE] No Google Maps API key provided");
    return null;
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;

  console.log(
    `[GEOCODE] Making request to Google Maps API for address: ${address}`
  );

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `[GEOCODE] API error: ${response.status} - ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();
    console.log(`[GEOCODE] Raw API response:`, JSON.stringify(data, null, 2));

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log(
        `[GEOCODE] Found coordinates: [${location.lat}, ${location.lng}]`
      );
      return [location.lat, location.lng];
    } else {
      console.log(`[GEOCODE] No results found. Status: ${data.status}`);
      if (data.error_message) {
        console.error(`[GEOCODE] Error message: ${data.error_message}`);
      }
    }
  } catch (error) {
    console.error(`[GEOCODE] Error fetching geocode data:`, error);
  }
  return null;
}

// Add this near the top of the file
const verbose = true; // Toggle detailed logging

// Update the geocodeFeature function to include logging
async function geocodeFeature(
  feature: GeoJSONFeature
): Promise<[number, number] | null> {
  const address = buildFullAddress(feature);
  if (!address) {
    console.log(
      `[GEOCODE] No address could be built for ${feature.properties.accession_number}`
    );
    return null;
  }

  console.log(
    `[GEOCODE] Attempting to geocode: ${address} (ID: ${feature.properties.accession_number})`
  );
  const result = await geocodeWithRetry(address);

  if (result) {
    console.log(
      `[GEOCODE] Success: Found coordinates [${result[0]}, ${result[1]}] for ${address}`
    );
  } else {
    console.log(`[GEOCODE] Failed: Could not find coordinates for ${address}`);
  }

  return result;
}

// Add this mapping function near the top of the file
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

// Updated sanitize function that uses the geocoding function as an additional method.
async function sanitizeFeatureAsync(
  feature: GeoJSONFeature
): Promise<{ feature: GeoJSONFeature; method: string | null }> {
  const id = feature.properties.accession_number || "unknown";

  if (verbose) console.log(`\n[PROCESS] Processing feature ID: ${id}`);

  // Add category to properties
  feature.properties.category = categorizeArtwork(feature);

  // Check existing geometry
  if (
    feature.geometry &&
    feature.geometry.coordinates &&
    feature.geometry.coordinates.length === 2
  ) {
    if (verbose)
      console.log(`[PROCESS] Feature ${id} already has valid geometry`);
    return { feature, method: "existing" };
  }

  // Try coordinates from properties
  const fromProperties = getLatLngFromProperties(feature);
  if (fromProperties) {
    if (verbose)
      console.log(
        `[PROCESS] Found coordinates in properties: [${fromProperties[0]}, ${fromProperties[1]}]`
      );
    feature.geometry = {
      type: "Point",
      coordinates: [fromProperties[1], fromProperties[0]],
    };
    return { feature, method: "properties" };
  }

  // Try geocoding
  if (verbose) console.log(`[PROCESS] Attempting geocoding - ID: ${id}`);
  const geocoded = await geocodeFeature(feature);
  if (geocoded) {
    if (verbose) console.log(`[PROCESS] Geocoding successful - ID: ${id}`);
    feature.geometry = {
      type: "Point",
      coordinates: [geocoded[1], geocoded[0]],
    };
    return { feature, method: "geocodingAPI" };
  }

  if (verbose) console.log(`[PROCESS] All methods failed for ID: ${id}`);
  return { feature, method: null };
}

// Add statistics tracking interface
interface CleanupStats {
  total: number;
  methods: {
    existing: number;
    properties: number;
    geocodingAPI: number;
    failed: number;
  };
  categories: {
    [key: string]: number;
  };
  failedFeatures: Array<{
    id: string;
    reason: string;
    properties: Record<string, string | number | null>;
  }>;
}

// Add rate limiting helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Improve address composition
function buildFullAddress(feature: GeoJSONFeature): string {
  const parts: string[] = [];
  const props = feature.properties;

  if (props.street_address_or_intersection) {
    parts.push(props.street_address_or_intersection);
  } else if (props.current_location) {
    parts.push(props.current_location);
  }

  // Add San Francisco context
  parts.push("San Francisco");
  parts.push("CA");

  if (props.zip_code) {
    parts.push(props.zip_code);
  }

  return parts.join(", ");
}

// Improve geocoding with retries
async function geocodeWithRetry(
  address: string,
  retries = 3
): Promise<[number, number] | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await geocodeAddress(address);
      if (result) return result;

      // Wait longer between each retry
      await delay(1000 * (i + 1));
    } catch (error) {
      console.error(`Geocoding attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await delay(1000 * (i + 1));
    }
  }
  return null;
}

// Main processing function
async function processFeatures(
  features: GeoJSONFeature[]
): Promise<{ features: GeoJSONFeature[]; stats: CleanupStats }> {
  const stats: CleanupStats = {
    total: features.length,
    methods: {
      existing: 0,
      properties: 0,
      geocodingAPI: 0,
      failed: 0,
    },
    categories: {},
    failedFeatures: [],
  };

  const batchSize = 10; // Process 10 at a time
  const processedFeatures: GeoJSONFeature[] = [];

  for (let i = 0; i < features.length; i += batchSize) {
    const batch = features.slice(i, i + batchSize);
    const batchPromises = batch.map(async (feature) => {
      try {
        const result = await sanitizeFeatureAsync(feature);
        stats.methods[result.method as keyof typeof stats.methods]++;

        if (!result.method) {
          stats.methods.failed++;
          stats.failedFeatures.push({
            id: feature.properties.accession_number || "unknown",
            reason: "No valid location data found",
            properties: feature.properties,
          });
        }

        return result.feature;
      } catch (error) {
        console.error(`Error processing feature:`, error);
        stats.methods.failed++;
        stats.failedFeatures.push({
          id: feature.properties.accession_number || "unknown",
          reason: String(error),
          properties: feature.properties,
        });
        return feature;
      }
    });

    const processedBatch = await Promise.all(batchPromises);
    processedFeatures.push(...processedBatch);

    // Track categories
    processedBatch.forEach((feature) => {
      const category = feature.properties.category || "Uncategorized";
      stats.categories[category] = (stats.categories[category] || 0) + 1;
    });

    // Rate limiting delay between batches
    await delay(1000);
  }

  return { features: processedFeatures, stats };
}

// Update the test function to use the result
async function testGeocoding() {
  console.log("Testing specific address geocoding...");
  const testAddress =
    "Stern Grove Entry Road & Wawona Street, San Francisco, CA, 94132";
  const result = await geocodeAddress(testAddress);

  if (result) {
    console.log(
      `[TEST] Successfully geocoded address to: [${result[0]}, ${result[1]}]`
    );
  } else {
    console.log("[TEST] Failed to geocode test address");
  }
  console.log("Geocoding test complete.");
}

// Update the main() function to run both test and full processing
async function main() {
  try {
    // Run test first
    console.log("\n=== Testing Single Address Geocoding ===");
    await testGeocoding();

    // Run full processing
    console.log("\n=== Starting Full Feature Processing ===");
    const { features: cleanedFeatures, stats } = await processFeatures(
      features
    );

    // Output statistics
    console.log("\n===================");
    console.log("Cleanup Statistics:");
    console.log("===================");
    console.log(`Total Features: ${stats.total}`);
    console.log("\nMethods Used:");
    Object.entries(stats.methods).forEach(([method, count]) => {
      const percentage = ((count / stats.total) * 100).toFixed(2);
      console.log(`${method}: ${count} (${percentage}%)`);
    });

    console.log("\nFailed Features Summary:");
    console.log("=======================");
    stats.failedFeatures.forEach((failure) => {
      console.log(`\nID: ${failure.id}`);
      console.log(`Reason: ${failure.reason}`);
      console.log(
        `Address: ${failure.properties.street_address_or_intersection}`
      );
      console.log(`Current Location: ${failure.properties.current_location}`);
      console.log(`Zip Code: ${failure.properties.zip_code}`);
    });

    console.log("\nArtwork Categories:");
    console.log("=================");
    Object.entries(stats.categories).forEach(([category, count]) => {
      const percentage = ((count / stats.total) * 100).toFixed(2);
      console.log(`${category}: ${count} (${percentage}%)`);
    });

    // Write the cleaned data to a new file
    const outputGeojson = {
      ...geojson,
      features: cleanedFeatures,
    };

    const outputPath = "../src/assets/CivicArtCollection_cleaned.json";
    fs.writeFileSync(outputPath, JSON.stringify(outputGeojson, null, 2));

    console.log(`\nProcessing complete. Output saved to ${outputPath}`);
  } catch (error) {
    console.error("Failed to process features:", error);
  }
}

// Execute the script
main().catch(console.error);
