/**
 * Shard membership for the per-city and nationwide slices of a country.
 * A store is in a city shard when it names that city, and in the nationwide shard
 * when it does not restrict its own-country delivery to named cities.
 */

function ownEntries(manifest) {
  return (manifest.fulfillment?.ships_to || []).filter((entry) => entry.country === manifest.country);
}

/** City ids a store names: its home city and the cities on its own-country ships_to entries. */
export function storeCities(manifest) {
  const cities = new Set(manifest.city ? [manifest.city] : []);
  for (const entry of ownEntries(manifest)) for (const city of entry.cities || []) cities.add(city);
  return cities;
}

/** True unless every own-country ships_to entry lists cities. */
export function isNationwide(manifest) {
  const entries = ownEntries(manifest);
  return entries.length === 0 || entries.some((entry) => !entry.cities);
}
