export interface USGSGeoJSONFeature {
  id: string;
  type: "Feature";
  properties: {
    mag: number | null;
    place: string | null;
    time: number; // epoch ms
    updated: number | null;
    tz: number | null;
    url: string | null;
    detail: string | null;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: string | null;
    status: string | null;
    tsunami: number | null;
    sig: number | null;
    net: string | null;
    code: string | null;
    ids: string | null;
    sources: string | null;
    types: string | null;
    nst: number | null;
    dmin: number | null;
    rms: number | null;
    gap: number | null;
    magType: string | null;
    type: string | null;
    title: string | null;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number, number]; // [longitude, latitude, depthKm]
  };
}

export interface USGSGeoJSONResponse {
  type: "FeatureCollection";
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: USGSGeoJSONFeature[];
  bbox?: number[];
}
