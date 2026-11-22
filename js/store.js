/* =====================================================================
   BOOKING STORAGE
   ---------------------------------------------------------------------
   DEMO: bookings are kept in this browser (localStorage) so the demo
   works without a server. Bookings you make on the form show up in the
   admin dashboard in the same browser.
   PRODUCTION: these functions call the server API instead
   (POST /api/bookings, GET /api/bookings, PATCH /api/bookings/:id),
   where the address and zone are checked again before saving.
   ===================================================================== */

(function () {
  var KEY = "bf_demo_bookings_v1", WKEY = "bf_demo_waitlist_v1";

  function read(k) { try { return JSON.parse(localStorage.getItem(k)) || null; } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function dayOffset(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

  function seed() {
    var now = Date.now();
    var mk = function (i, name, phone, street, village, district, city, pc, lat, lng, date, slot, status) {
      return {
        id: "BK-" + (240100 + i), createdAt: new Date(now - i * 5.3e6).toISOString(), status: status,
        name: name, phone: phone, email: name.split(" ")[0].toLowerCase() + "@example.com",
        address: { formatted: [street, village, district, city, "DKI Jakarta"].join(", "), street: street, village: village,
          district: district, city: city, province: "DKI Jakarta", postcode: pc, country: "Indonesia", lat: lat, lng: lng },
        detail: "No. " + (10 + i) + ", RT 0" + (i % 5 + 1) + "/RW 0" + (i % 3 + 2), date: date, slot: slot, notes: "",
        zone: "Jakarta (sample zone)"
      };
    };
    return [
      mk(1, "Budi Santoso", "+6281234500001", "Jalan Kemang Raya", "Bangka", "Mampang Prapatan", "Jakarta Selatan", "12730", -6.2615, 106.8137, dayOffset(1), "08:00 - 10:00", "new"),
      mk(2, "Siti Rahma", "+6281234500002", "Jalan Cikini Raya", "Cikini", "Menteng", "Jakarta Pusat", "10330", -6.1925, 106.8394, dayOffset(1), "13:00 - 15:00", "confirmed"),
      mk(3, "Andi Wijaya", "+6281234500003", "Jalan Pluit Karang", "Pluit", "Penjaringan", "Jakarta Utara", "14450", -6.1180, 106.7900, dayOffset(2), "10:00 - 12:00", "new"),
      mk(4, "Dewi Lestari", "+6281234500004", "Jalan Kalimalang", "Pondok Kelapa", "Duren Sawit", "Jakarta Timur", "13450", -6.2390, 106.9180, dayOffset(3), "15:00 - 17:00", "confirmed"),
      mk(5, "Rizky Pratama", "+6281234500005", "Jalan Kebon Jeruk Raya", "Kebon Jeruk", "Kebon Jeruk", "Jakarta Barat", "11530", -6.1935, 106.7690, dayOffset(-1), "08:00 - 10:00", "done")
    ];
  }

  window.Store = {
    all: function () { var b = read(KEY); if (!b) { b = seed(); write(KEY, b); } return b; },
    add: function (booking) {
      var b = this.all();
      var last = b.reduce(function (m, x) { return Math.max(m, +x.id.slice(3) || 0); }, 240100);
      booking.id = "BK-" + (last + 1);
      booking.createdAt = new Date().toISOString();
      booking.status = "new";
      b.unshift(booking); write(KEY, b); return booking;
    },
    update: function (id, fields) {
      var b = this.all();
      b.forEach(function (x) { if (x.id === id) Object.assign(x, fields); });
      write(KEY, b);
    },
    waitlist: function () { return read(WKEY) || []; },
    addWaitlist: function (entry) { var w = this.waitlist(); entry.createdAt = new Date().toISOString(); w.unshift(entry); write(WKEY, w); },
    reset: function () { try { localStorage.removeItem(KEY); localStorage.removeItem(WKEY); } catch (e) {} }
  };
})();
