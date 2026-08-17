// Real address <-> coordinates, via OpenStreetMap's free Nominatim API
// — no API key, and it matches the map tiles OrderMap.jsx already
// renders (both OSM), so there's no second mapping provider to account
// for. Two directions:
//   - geocodeAddress(): address -> coordinates, used when an order is
//     placed (replaces what used to be a random coordinate from a
//     fixed list of Kolkata landmarks regardless of the actual address).
//   - reverseGeocode(): coordinates -> address, used by the checkout
//     page's "Use my current location" button (see
//     app/api/geocode/reverse/route.ts) to prefill the address form
//     from the customer's GPS position instead of typing it by hand.
//
// Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/)
// caps the public instance at ~1 request/second and requires a
// descriptive User-Agent identifying the app — both are honored below.
// That's plenty for "geocode a handful of times per checkout," but the
// public instance isn't meant for real commercial volume; if this app
// gets busy, self-host Nominatim or switch to a paid geocoder (Google,
// Mapbox, LocationIQ) — neither function's signature would need to
// change, only the body.

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export async function geocodeAddress(
  addressLine1: string,
  city: string,
  pincode: string
): Promise<GeoPoint | null> {
  const query = `${addressLine1}, ${city}, ${pincode}, India`;
  const url = `${NOMINATIM_URL}/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      headers: {
        // Required by Nominatim's usage policy — replace with your own
        // contact if you self-host or expect real traffic.
        "User-Agent": "SarikaBeautyHub/1.0 (contact: admin@sarikabeautyhub.in)",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;

    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!results.length) return null;

    const lat = Number(results[0].lat);
    const lng = Number(results[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng };
  } catch (err) {
    console.error("[geocode] Nominatim search request failed:", err);
    return null;
  }
}

export interface ReverseGeocodeResult {
  line1: string;
  city: string;
  pincode: string;
  displayName: string;
}

/**
 * Coordinates -> a best-guess address, for the checkout page's "Use my
 * current location" button (src/pages/customer/Checkout.jsx). Nominatim
 * returns a structured `address` breakdown; the fields it actually
 * populates vary a lot by location (dense cities give a house number +
 * road, rural areas might only give a village/suburb), so this pulls
 * together whatever's available rather than expecting a fixed shape —
 * the customer can still edit every field afterward, this is a
 * convenience fill, not a guarantee of accuracy.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const url = `${NOMINATIM_URL}/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "SarikaBeautyHub/1.0 (contact: admin@sarikabeautyhub.in)",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;

    const result = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    const addr = result.address;
    if (!addr) return null;

    const houseNumber = addr.house_number;
    const road = addr.road || addr.pedestrian || addr.suburb;
    const line1 = [houseNumber, road].filter(Boolean).join(", ") || addr.suburb || addr.neighbourhood || "";
    const city = addr.city || addr.town || addr.village || addr.state_district || addr.county || "";
    const pincode = addr.postcode || "";

    if (!line1 && !city && !pincode) return null;

    return { line1, city, pincode, displayName: result.display_name || "" };
  } catch (err) {
    console.error("[geocode] Nominatim reverse request failed:", err);
    return null;
  }
}
