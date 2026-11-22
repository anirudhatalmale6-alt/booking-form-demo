/* =====================================================================
   BOOKING FORM LOGIC
   Step 1: contact + address (autocomplete, map pin, zone check)
   Step 2: date + time window
   Step 3: confirmation
   Settings and text live in js/config.js, not here.
   ===================================================================== */

(function () {
  var CFG = window.BOOKING_CONFIG, Geo = window.Geo, Store = window.Store;
  var form = document.getElementById("bookingForm");
  var lang = CFG.DEFAULT_LANG;
  try { lang = localStorage.getItem("bf_lang") || lang; } catch (e) {}
  var state = { address: null, zone: null, date: null, slot: null };
  var map, marker, zoneLayer;

  function T(k) { return (CFG.TEXT[lang] || CFG.TEXT.en)[k] || k; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---------------- language ---------------- */
  function applyText() {
    document.documentElement.lang = lang;
    $$("[data-t]").forEach(function (el) { el.textContent = T(el.getAttribute("data-t")); });
    $$("[data-ph]").forEach(function (el) { el.placeholder = T(el.getAttribute("data-ph")); });
    $("#addrInput").placeholder = T("addressPh");
    $$("[data-company]").forEach(function (el) { el.textContent = CFG.COMPANY_NAME; });
    $$("[data-lang]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-lang") === lang); });
    if (state.address) showZoneResult();
    renderDates();
  }
  $$("[data-lang]").forEach(function (b) {
    b.addEventListener("click", function () {
      lang = b.getAttribute("data-lang");
      try { localStorage.setItem("bf_lang", lang); } catch (e) {}
      applyText();
    });
  });

  /* ---------------- errors ---------------- */
  function setErr(field, key) {
    var el = $('[data-err="' + field + '"]');
    if (el) el.textContent = key ? T(key) : "";
    var input = form.elements[field] || (field === "address" ? $("#addrInput") : null);
    if (input && input.classList) input.classList.toggle("bad", !!key);
  }

  ["name", "phone", "email", "detail", "postcode"].forEach(function (f) {
    var input = form.elements[f];
    input.addEventListener("blur", function () { if (input.value) checkField(f); });
    input.addEventListener("input", function () { if (input.classList.contains("bad")) checkField(f); });
  });
  form.elements.postcode.addEventListener("input", function (e) { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 5); });

  var errKey = { name: "errName", phone: "errPhone", email: "errEmail", detail: "errDetail", postcode: "errPostcode" };
  function checkField(f) {
    var ok = Geo.validate[f](form.elements[f].value || "");
    setErr(f, ok ? null : errKey[f]);
    return ok;
  }

  /* ---------------- autocomplete ---------------- */
  var input = $("#addrInput"), list = $("#acList"), spin = $(".spin"), timer, results = [], active = -1, reqNo = 0;

  input.addEventListener("input", function () {
    // Typing again means the previously picked address is no longer valid.
    if (state.address) clearAddress();
    clearTimeout(timer);
    var q = input.value.trim();
    if (q.length < 3) { closeList(); return; }
    timer = setTimeout(function () { search(q); }, 300);
  });

  function search(q) {
    var my = ++reqNo;
    spin.hidden = false;
    Geo.provider.suggest(q, lang).then(function (r) {
      if (my !== reqNo) return;               // ignore out-of-order replies
      results = r; active = -1; renderList();
    }).catch(function () { results = []; renderList(); })
      .then(function () { if (my === reqNo) spin.hidden = true; });
  }

  function renderList() {
    if (!results.length) {
      list.innerHTML = '<li class="none">' + esc(T("noResults")) + "</li>";
    } else {
      list.innerHTML = results.map(function (r, i) {
        return '<li role="option" id="ac' + i + '" data-i="' + i + '"' + (i === active ? ' aria-selected="true"' : "") +
          '><b>' + esc(r.main) + "</b><span>" + esc(r.secondary) + "</span></li>";
      }).join("");
    }
    list.hidden = false; input.setAttribute("aria-expanded", "true");
  }
  function closeList() { list.hidden = true; input.setAttribute("aria-expanded", "false"); }

  list.addEventListener("mousedown", function (e) {
    var li = e.target.closest("li[data-i]");
    if (li) { e.preventDefault(); pick(+li.getAttribute("data-i")); }
  });
  input.addEventListener("keydown", function (e) {
    if (list.hidden || !results.length) return;
    if (e.key === "ArrowDown") { active = (active + 1) % results.length; renderList(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { active = (active - 1 + results.length) % results.length; renderList(); e.preventDefault(); }
    else if (e.key === "Enter" && active >= 0) { pick(active); e.preventDefault(); }
    else if (e.key === "Escape") closeList();
  });
  input.addEventListener("blur", function () { setTimeout(closeList, 150); });

  function pick(i) {
    var s = results[i];
    closeList();
    input.value = s.main + (s.secondary ? ", " + s.secondary : "");
    Geo.provider.details(s).then(setAddress);
  }

  function clearAddress() {
    state.address = null; state.zone = null;
    $("#addrFields").hidden = true; $("#outZone").hidden = true; $("#mapWrap").hidden = true;
    $("#toStep2").disabled = false;
  }

  /* ---------------- map + zone ---------------- */
  function ensureMap() {
    if (map) return;
    map = L.map("map", { scrollWheelZoom: false }).setView(CFG.MAP_START.center, CFG.MAP_START.zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
    zoneLayer = L.layerGroup().addTo(map);
    CFG.ZONES.filter(function (z) { return z.active; }).forEach(function (z) {
      var style = { color: "#0f766e", weight: 2, fillColor: "#14b8a6", fillOpacity: 0.08, dashArray: "6 5" };
      if (z.type === "polygon") L.polygon(z.points, style).addTo(zoneLayer);
      if (z.type === "radius") L.circle(z.center, Object.assign({ radius: z.km * 1000 }, style)).addTo(zoneLayer);
    });
    marker = L.marker(CFG.MAP_START.center, { draggable: true, keyboard: true });
    marker.on("dragend", function () {
      var p = marker.getLatLng();
      Geo.provider.reverse(p.lat, p.lng).then(function (a) {
        // Keep the customer's exact pin position even if the street name changes.
        a = a || Object.assign({}, state.address);
        a.lat = p.lat; a.lng = p.lng;
        setAddress(a, true);
      });
    });
  }

  function setAddress(a, fromPin) {
    state.address = a;
    $("#mapWrap").hidden = false;
    ensureMap();
    setTimeout(function () { map.invalidateSize(); }, 50);
    marker.setLatLng([a.lat, a.lng]).addTo(map);
    if (!fromPin) map.setView([a.lat, a.lng], 16);
    else input.value = a.formatted;

    form.elements.village.value = a.village;
    form.elements.district.value = a.district;
    form.elements.city.value = a.city;
    form.elements.province.value = a.province;
    // Google/OSM often have no postcode for Indonesian streets: then the customer types it.
    if (a.postcode || !fromPin) form.elements.postcode.value = a.postcode || "";
    $("#coords").textContent = "Lat " + a.lat.toFixed(6) + ", Lng " + a.lng.toFixed(6) + (fromPin ? " · " + T("pinMoved") : "");
    setErr("address", null);
    showZoneResult();
  }

  function showZoneResult() {
    var a = state.address;
    state.zone = Geo.findZone(a);
    var msg = $("#zoneMsg");
    if (state.zone) {
      msg.className = "zone-msg ok"; msg.textContent = T("inZone");
      $("#addrFields").hidden = false; $("#outZone").hidden = true; $("#toStep2").disabled = false;
    } else {
      msg.className = "zone-msg no"; msg.textContent = T("outZoneTitle");
      $("#addrFields").hidden = true; $("#outZone").hidden = false; $("#toStep2").disabled = true;
      var text = (lang === "id" ? "Halo, saya ingin memesan layanan di: " : "Hi, I'd like to book a visit at: ") + a.formatted;
      $("#waLink").href = "https://wa.me/" + CFG.CONTACT.whatsapp + "?text=" + encodeURIComponent(text);
      $("#notifyBtn").hidden = false; $("#notifyDone").hidden = true;
    }
  }

  $("#notifyBtn").addEventListener("click", function () {
    var okN = checkField("name"), okP = checkField("phone"), okE = checkField("email");
    if (!(okN && okP && okE)) return;
    Store.addWaitlist({ name: form.elements.name.value.trim(), phone: Geo.normalisePhone(form.elements.phone.value),
      email: form.elements.email.value.trim(), address: state.address });
    $("#notifyBtn").hidden = true; $("#notifyDone").hidden = false;
  });

  /* ---------------- step 1 -> 2 ---------------- */
  function validateStep1() {
    var ok = ["name", "phone", "email"].map(checkField).every(Boolean);
    if (!state.address) { setErr("address", "errAddress"); ok = false; }
    else if (!state.zone) ok = false;
    else ok = ["detail", "postcode"].map(checkField).every(Boolean) && ok;
    return ok;
  }

  $("#toStep2").addEventListener("click", function () {
    if (!validateStep1()) {
      var bad = $(".bad, .err:not(:empty)");
      if (bad) bad.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    $("#addrSummary").innerHTML = summaryHtml(false);
    go(2);
  });
  $("#back1").addEventListener("click", function () { go(1); });

  function go(n) {
    $$("[data-panel]").forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== String(n); });
    $$("[data-step]").forEach(function (s) {
      var k = +s.getAttribute("data-step");
      s.classList.toggle("on", k === n); s.classList.toggle("past", k < n);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (n === 1 && map) setTimeout(function () { map.invalidateSize(); }, 50);
  }

  /* ---------------- step 2: dates + slots ---------------- */
  function renderDates() {
    var box = $("#dates"); if (!box) return;
    var b = CFG.BOOKING, out = [], d = new Date();
    d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + b.minDaysAhead);
    var locale = lang === "id" ? "id-ID" : "en-GB";
    for (var i = 0; out.length < 14 && i <= b.maxDaysAhead; i++, d.setDate(d.getDate() + 1)) {
      if (b.days.indexOf(d.getDay()) === -1) continue;
      var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      out.push('<button type="button" role="radio" aria-checked="' + (state.date === iso) + '" data-date="' + iso + '">' +
        "<small>" + d.toLocaleDateString(locale, { weekday: "short" }) + "</small><b>" + d.getDate() + "</b><small>" +
        d.toLocaleDateString(locale, { month: "short" }) + "</small></button>");
    }
    box.innerHTML = out.join("");
    $("#slots").innerHTML = b.slots.map(function (s) {
      return '<button type="button" role="radio" aria-checked="' + (state.slot === s) + '" data-slot="' + s + '">' + s + "</button>";
    }).join("");
  }
  document.addEventListener("click", function (e) {
    var d = e.target.closest("[data-date]"), s = e.target.closest("[data-slot]");
    if (d) { state.date = d.getAttribute("data-date"); setErr("date", null); renderDates(); }
    if (s) { state.slot = s.getAttribute("data-slot"); setErr("slot", null); renderDates(); }
  });

  function summaryHtml(full) {
    var a = state.address, f = form.elements;
    var rows = [
      [T("name"), f.name.value.trim()], [T("phone"), Geo.normalisePhone(f.phone.value)], [T("email"), f.email.value.trim()],
      [T("address"), a.formatted], [T("detail"), f.detail.value.trim()], [T("postcode"), f.postcode.value]
    ];
    if (full) rows.push([T("date"), state.date], [T("slot"), state.slot]);
    return "<h4>" + esc(T("summary")) + "</h4><dl>" + rows.map(function (r) {
      return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>";
    }).join("") + "</dl>";
  }

  /* ---------------- submit ---------------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    if (!state.date) { setErr("date", "errDate"); ok = false; }
    if (!state.slot) { setErr("slot", "errSlot"); ok = false; }
    if (!ok || !validateStep1()) return;
    var f = form.elements, a = Object.assign({}, state.address, {
      village: f.village.value.trim(), district: f.district.value.trim(), postcode: f.postcode.value.trim()
    });
    var saved = Store.add({
      name: f.name.value.trim(), phone: Geo.normalisePhone(f.phone.value), email: f.email.value.trim(),
      address: a, detail: f.detail.value.trim(), date: state.date, slot: state.slot,
      notes: f.notes.value.trim(), zone: state.zone.name
    });
    $("#refNo").textContent = saved.id;
    $("#finalSummary").innerHTML = summaryHtml(true);
    go(3);
  });

  $("#again").addEventListener("click", function () {
    form.reset(); input.value = ""; state = { address: null, zone: null, date: null, slot: null };
    clearAddress(); renderDates(); go(1);
  });

  applyText();
  go(1);
})();
