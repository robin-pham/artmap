import { ArtworkCategory } from "./types/categories";

export interface CivicArtType {
  zip_code: string;
  number_of_districts: string;
  latitude: string;
  cultural_districts: null;
  analysis_neighborhood: string;
  medium: null;
  data_loaded_at: Date;
  longitude: string;
  credit_line: null;
  creation_date: string;
  accession_number: string;
  media_support: null;
  display_dimensions: null;
  artist: string;
  location_description: string;
  display_title: string;
  current_location: string;
  supervisor_district: string;
  facility: null;
  data_as_of: Date;
  street_address_or_intersection: string;
  category: ArtworkCategory;
}
