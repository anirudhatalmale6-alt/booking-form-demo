# Address-validated booking form (demo)

- `index.html` – booking form (address search, map pin, service-area check, date/time, confirmation)
- `admin.html` – admin dashboard (demo password: admin123)
- `js/config.js` – the ONLY file to edit for service areas, time slots, contact options and all text (EN/ID)

Demo notes: address search uses OpenStreetMap (no API key needed). The production build uses
Google Places Autocomplete + Geocoding, a server-side re-check of every booking, and a real
database + login for the admin.
