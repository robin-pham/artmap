export const ArtworkCategories = [
  "Painting",
  "Sculpture",
  "Mosaic",
  "Fresco",
  "Glasswork",
  "Photography",
  "Mixed Media",
  "Textile",
  "Printmaking",
  "Digital Art",
  "Ceramics",
  "Relief / Wall Art",
  "Uncategorized",
] as const;

export type ArtworkCategory = (typeof ArtworkCategories)[number];
