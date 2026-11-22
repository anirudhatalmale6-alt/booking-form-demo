/* =====================================================================
   ADMIN DASHBOARD
   DEMO: password check happens in the browser and bookings come from
   this browser's storage. PRODUCTION: login is checked on the server
   (hashed password, session cookie) and data comes from the API.
   ===================================================================== */

(function () {
  var CFG = window.BOOKING_CONFIG, Store = window.Store;
  var DEMO_PASSWORD = "admin123";
  var STATUS = { new: "New", confirmed: "Confirmed", done: "Completed", cancelled: "Cancelled" };
  var amap, dmap;

  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function fmtDate(iso) { return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); }

  $$("[data-company]").forEach(function (el) { el.textContent = CFG.COMPANY_NAME; });

  /* ---------------- login ---------------- */
  function signedIn() { try { return sessionStorage.getItem("bf_admin") === "1"; } catch (e) { return false; } }
  function show() { $("#login").hidden = signedIn(); $("#app").hidden = !signedIn(); if (signedIn()) render(); }
  $("#loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("#pw").value === DEMO_PASSWORD) { try { sessionStorage.setItem("bf_admin", "1"); } catch (x) {} show(); }
    else $("#pwErr").textContent = "Wrong password.";
  });
  $("#logout").addEventListener("click", function () { try { sessionStorage.removeItem("bf_admin"); } catch (x) {} show(); });

  /* ---------------- tabs ---------------- */
  $$("[data-tab]").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.getAttribute("data-tab");
      $$("[data-tab]").forEach(function (x) { x.classList.toggle("on", x === b); });
      $$("[data-view]").forEach(function (v) { v.hidden = v.getAttribute("data-view") !== t; });
      if (t === "map") drawMap();
    });
  });

  /* ---------------- list ---------------- */
  function filtered() {
    var q = $("#q").value.trim().toLowerCase(), st = $("#fStatus").value, wh = $("#fWhen").value, t = today();
    return Store.all().filter(function (b) {
      if (st && b.status !== st) return false;
      if (wh === "today" && b.date !== t) return false;
      if (wh === "upcoming" && b.date < t) return false;
      if (wh === "past" && b.date >= t) return false;
      if (q) {
        var hay = [b.id, b.name, b.phone, b.email, b.address.formatted, b.address.postcode, b.detail].join(" ").toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort(function (a, b) { return (a.date + a.slot).localeCompare(b.date + b.slot); });
  }

  function render() {
    var all = Store.all(), t = today();
    var tiles = [
      ["Total bookings", all.length],
      ["New (to confirm)", all.filter(function (b) { return b.status === "new"; }).length],
      ["Visits today", all.filter(function (b) { return b.date === t && b.status !== "cancelled"; }).length],
      ["Upcoming", all.filter(function (b) { return b.date >= t && b.status !== "cancelled"; }).length]
    ];
    $("#stats").innerHTML = tiles.map(function (s) { return '<div class="stat"><small>' + s[0] + "</small><b>" + s[1] + "</b></div>"; }).join("");

    var rows = filtered();
    $("#rows").innerHTML = rows.map(function (b) {
      return "<tr>" +
        '<td class="ref-cell">' + esc(b.id) + "</td>" +
        "<td>" + esc(b.name) + "<small>" + esc(b.phone) + "</small></td>" +
        "<td>" + esc(b.address.district || b.address.village) + "<small>" + esc(b.address.city) + " " + esc(b.address.postcode) + "</small></td>" +
        "<td>" + esc(fmtDate(b.date)) + "<small>" + esc(b.slot) + "</small></td>" +
        '<td><span class="pill ' + b.status + '">' + STATUS[b.status] + "</span></td>" +
        '<td><button class="link" data-open="' + esc(b.id) + '">View</button></td></tr>';
    }).join("");
    $("#empty").hidden = rows.length > 0;

    var w = Store.waitlist();
    $("#wrows").innerHTML = w.map(function (x) {
      return "<tr><td>" + esc(new Date(x.createdAt).toLocaleDateString("en-GB")) + "</td><td>" + esc(x.name) + "<small>" + esc(x.phone) +
        "</small></td><td>" + esc(x.address.formatted) + "</td></tr>";
    }).join("");
    $("#wempty").hidden = w.length > 0;
  }
  ["#q", "#fStatus", "#fWhen"].forEach(function (s) { $(s).addEventListener("input", render); });

  /* ---------------- detail drawer ---------------- */
  document.addEventListener("click", function (e) {
    var o = e.target.closest("[data-open]");
    if (o) openDrawer(o.getAttribute("data-open"));
    var s = e.target.closest("[data-set]");
    if (s) { Store.update(s.getAttribute("data-id"), { status: s.getAttribute("data-set") }); render(); openDrawer(s.getAttribute("data-id")); }
  });
  $("#closeDrawer").addEventListener("click", function () { $("#drawer").hidden = true; });
  $("#drawer").addEventListener("click", function (e) { if (e.target.id === "drawer") $("#drawer").hidden = true; });

  function openDrawer(id) {
    var b = Store.all().filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    var a = b.address, wa = b.phone.replace(/\D/g, "");
    var rows = [
      ["Status", '<span class="pill ' + b.status + '">' + STATUS[b.status] + "</span>"],
      ["Visit", esc(fmtDate(b.date) + ", " + b.slot)], ["Phone", esc(b.phone)], ["Email", esc(b.email)],
      ["Address", esc(a.formatted)], ["Details", esc(b.detail)], ["Kelurahan", esc(a.village)], ["Kecamatan", esc(a.district)],
      ["City", esc(a.city)], ["Province", esc(a.province)], ["Postal code", esc(a.postcode)],
      ["Coordinates", esc(a.lat.toFixed(6) + ", " + a.lng.toFixed(6))], ["Zone", esc(b.zone)],
      ["Notes", esc(b.notes || "-")], ["Booked on", esc(new Date(b.createdAt).toLocaleString("en-GB"))]
    ];
    $("#drawerBody").innerHTML = "<h2>" + esc(b.name) + '</h2><p class="muted">' + esc(b.id) + "</p>" +
      '<div id="dmap"></div><dl>' + rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("") + "</dl>" +
      '<div class="d-actions">' +
      '<a class="btn wa sm" target="_blank" rel="noopener" href="https://wa.me/' + wa + '">WhatsApp</a>' +
      '<a class="btn ghost sm" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' + a.lat + "," + a.lng + '">Directions</a>' +
      Object.keys(STATUS).filter(function (k) { return k !== b.status; }).map(function (k) {
        return '<button class="btn ghost sm" data-set="' + k + '" data-id="' + esc(b.id) + '">Mark ' + STATUS[k].toLowerCase() + "</button>";
      }).join("") + "</div>";
    $("#drawer").hidden = false;
    if (dmap) { dmap.remove(); dmap = null; }
    dmap = L.map("dmap", { zoomControl: false, attributionControl: false }).setView([a.lat, a.lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(dmap);
    L.marker([a.lat, a.lng]).addTo(dmap);
  }

  /* ---------------- map of all bookings ---------------- */
  function drawMap() {
    if (!amap) {
      amap = L.map("amap").setView(CFG.MAP_START.center, CFG.MAP_START.zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(amap);
      CFG.ZONES.filter(function (z) { return z.active && z.type === "polygon"; }).forEach(function (z) {
        L.polygon(z.points, { color: "#0f766e", weight: 2, fillOpacity: .06, dashArray: "6 5" }).addTo(amap);
      });
      amap.markers = L.layerGroup().addTo(amap);
    }
    setTimeout(function () { amap.invalidateSize(); }, 50);
    amap.markers.clearLayers();
    Store.all().forEach(function (b) {
      L.marker([b.address.lat, b.address.lng]).bindPopup("<b>" + esc(b.name) + "</b><br>" + esc(fmtDate(b.date) + ", " + b.slot) +
        "<br>" + STATUS[b.status]).addTo(amap.markers);
    });
  }

  /* ---------------- CSV ---------------- */
  $("#csv").addEventListener("click", function () {
    var head = ["Ref", "Status", "Name", "Phone", "Email", "Date", "Slot", "Address", "Details", "Kelurahan", "Kecamatan", "City", "Province", "Postal code", "Lat", "Lng", "Notes"];
    var lines = filtered().map(function (b) {
      var a = b.address;
      return [b.id, STATUS[b.status], b.name, b.phone, b.email, b.date, b.slot, a.formatted, b.detail, a.village, a.district, a.city, a.province, a.postcode, a.lat, a.lng, b.notes]
        .map(function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }).join(",");
    });
    var blob = new Blob(["﻿" + [head.join(",")].concat(lines).join("\n")], { type: "text/csv" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob); link.download = "bookings-" + today() + ".csv"; link.click();
  });

  show();
})();
