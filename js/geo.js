/* =====================================================================
   ADDRESS SEARCH + SERVICE AREA CHECK
   ---------------------------------------------------------------------
   The form talks to one "provider" object with three functions:
     suggest(text)        -> list of suggestions while typing
     details(suggestion)  -> full address + lat/lng for a picked suggestion
     reverse(lat, lng)    -> address for a pin the customer dragged

   DEMO: uses OpenStreetMap (Photon) so it runs without an API key.
   PRODUCTION: the same three functions are backed by Google Places
   Autocomplete (New) + Place Details + Geocoding, with session tokens.
   Nothing else in the form changes when the provider is swapped.
   ===================================================================== */

(function () {
  var CFG = window.BOOKING_CONFIG;

  /* Indonesia bounding box (lng/lat) to keep results in-country. */
  var ID_BBOX = "95,-11,141,6";

  function normalise(p, lat, lng) {
    // One address shape for the whole app, whatever the provider.
    // OpenStreetMap quirks (demo only): "RW 01" in place of the kelurahan,
    // and the island ("Jawa") in place of the province for Jakarta.
    if (/^R[TW]\s*\d+/i.test(p.locality || "")) p = Object.assign({}, p, { locality: "" });
    if (/jakarta/i.test(p.city || "") && !/jakarta/i.test(p.state || "")) p = Object.assign({}, p, { state: "DKI Jakarta" });
    var street = [p.street, p.housenumber].filter(Boolean).join(" ");
    var line1 = p.name && p.name !== p.street ? p.name : street;
    var parts = [line1, line1 === street ? "" : street, p.locality, p.district, p.city, p.state]
      .filter(function (x, i, a) { return x && a.indexOf(x) === i; });
    return {
      formatted: parts.join(", "),
      street: street || p.name || "",
      village: p.locality || "",          // kelurahan
      district: p.district || "",         // kecamatan
      city: p.city || p.county || "",     // kota / kabupaten
      province: p.state || "",
      postcode: (p.postcode || "").replace(/\D/g, "").slice(0, 5),
      country: p.country || "Indonesia",
      countryCode: (p.countrycode || "").toUpperCase(),
      lat: lat, lng: lng
    };
  }

  var photon = {
    suggest: function (text, lang) {
      var url = "https://photon.komoot.io/api/?limit=6&bbox=" + ID_BBOX +
        "&lat=" + CFG.MAP_START.center[0] + "&lon=" + CFG.MAP_START.center[1] +
        "&q=" + encodeURIComponent(text);
      return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
        var seen = {};
        return (j.features || [])
          .filter(function (f) { return (f.properties.countrycode || "").toUpperCase() === CFG.COUNTRY; })
          .map(function (f) {
            var c = f.geometry.coordinates;
            var a = normalise(f.properties, c[1], c[0]);
            var main = f.properties.name || a.street;
            return { main: main, secondary: a.formatted.replace(main + ", ", ""), address: a };
          })
          .filter(function (r) {   // the same street is often split into several pieces
            var k = r.main + "|" + r.secondary;
            return seen[k] ? false : (seen[k] = true);
          });
      });
    },
    details: function (s) { return Promise.resolve(s.address); },
    reverse: function (lat, lng) {
      var url = "https://photon.komoot.io/reverse?lat=" + lat + "&lon=" + lng;
      return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
        var f = (j.features || [])[0];
        return f ? normalise(f.properties, lat, lng) : null;
      });
    }
  };

  /* ---------------- service area ---------------- */

  function insidePolygon(lat, lng, pts) {
    // Ray casting: count how many polygon edges a line from the point crosses.
    var inside = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var yi = pts[i][0], xi = pts[i][1], yj = pts[j][0], xj = pts[j][1];
      if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function distanceKm(a, b) {
    var R = 6371, toRad = Math.PI / 180;
    var dLat = (b[0] - a[0]) * toRad, dLng = (b[1] - a[1]) * toRad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a[0] * toRad) * Math.cos(b[0] * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /* Returns the matching zone, or null if the address is outside all zones.
     The production server runs this same check again before saving. */
  function findZone(addr) {
    var zones = CFG.ZONES.filter(function (z) { return z.active; });
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      if (z.type === "polygon" && insidePolygon(addr.lat, addr.lng, z.points)) return z;
      if (z.type === "radius" && distanceKm([addr.lat, addr.lng], z.center) <= z.km) return z;
      if (z.type === "cities") {
        var city = (addr.city || "").toLowerCase();
        if (z.cities.some(function (c) { return c.toLowerCase() === city; })) return z;
      }
    }
    return null;
  }

  /* ---------------- field validation ---------------- */

  var validate = {
    name: function (v) { return v.trim().length >= 3 && /[a-zA-Z]/.test(v); },
    // Indonesian mobile: 08xx / 628xx / +628xx, 10-13 digits after the 0.
    phone: function (v) { return /^(\+62|62|0)8[1-9]\d{6,11}$/.test(v.replace(/[\s.-]/g, "")); },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
    postcode: function (v) { return /^\d{5}$/.test(v.trim()); },
    detail: function (v) { return v.trim().length >= 3; }
  };

  function normalisePhone(v) {
    var d = v.replace(/[^\d]/g, "");
    if (d.indexOf("0") === 0) d = "62" + d.slice(1);
    return "+" + d;
  }

  window.Geo = {
    provider: photon,
    findZone: findZone,
    validate: validate,
    normalisePhone: normalisePhone
  };
})();
