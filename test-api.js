const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000/api/listings';

const tests = [
  {
    name: 'No filters',
    params: {},
  },
  {
    name: 'City filter',
    params: { city: 'santa cruz' },
  },
  {
    name: 'State filter',
    params: { state: 'ca' },
  },
  {
    name: 'Price filter (min-max)',
    params: { price: '1000-2000' },
  },
  {
    name: 'Property filter',
    params: { property: 'Apartment' },
  },
  {
    name: 'Bedrooms filter',
    params: { bedrooms: '2' },
  },
  {
    name: 'Bedrooms filter (6+)',
    params: { bedrooms: '6' },
  },
  {
    name: 'Amenities filter (WiFi)',
    params: { amenities: 'WiFi' },
  },
  {
    name: 'Amenities filter (WiFi,Air Conditioning)',
    params: { amenities: 'WiFi,Air Conditioning' },
  },
  {
    name: 'Duration filter',
    params: { duration: '2025-07-01-2025-08-01' },
  },
  {
    name: 'City + State + Price',
    params: { city: 'santa cruz', state: 'ca', price: '1000-2000' },
  },
  {
    name: 'All filters',
    params: {
      city: 'santa cruz',
      state: 'ca',
      price: '1000-2000',
      property: 'Apartment',
      bedrooms: '2',
      amenities: 'WiFi,Air Conditioning',
      duration: '2025-07-01-2025-08-01',
    },
  },
];

function toQuery(params) {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

async function runTests() {
  for (const test of tests) {
    const url = toQuery(test.params)
      ? `${BASE_URL}?${toQuery(test.params)}`
      : BASE_URL;
    console.log(`\n=== Test: ${test.name} ===`);
    console.log(`Request: ${url}`);
    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log(`Status: ${res.status}`);
      try {
        const json = JSON.parse(text);
        console.log('Listings found:', json.listings ? json.listings.length : 'N/A');
        if (json.listings) {
          console.log('Sample listing:', JSON.stringify(json.listings[0], null, 2));
        } else {
          console.log('Response:', json);
        }
      } catch {
        console.log('Non-JSON response:', text.slice(0, 500));
      }
    } catch (e) {
      console.error('Request failed:', e);
    }
  }
}

runTests();
