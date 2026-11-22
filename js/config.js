/* =====================================================================
   BOOKING FORM SETTINGS
   ---------------------------------------------------------------------
   This is the only file your team needs to edit to change:
     - the service area (ZONES)
     - booking days / time slots (BOOKING)
     - the contact options shown to out-of-area customers (CONTACT)
     - every piece of text on the form, in English and Indonesian (TEXT)
   ===================================================================== */

window.BOOKING_CONFIG = {

  /* Company name shown in the header and confirmation. */
  COMPANY_NAME: "Your Company",

  /* Country the address search is limited to (ISO code). */
  COUNTRY: "ID",

  /* Default map view before an address is chosen. [lat, lng], zoom */
  MAP_START: { center: [-6.2088, 106.8456], zoom: 11 },

  /* -------------------------------------------------------------------
     SERVICE AREA
     An address is accepted if it falls inside ANY of the zones below.
     Three zone types are supported:

     1. "polygon" : a drawn area. points = list of [lat, lng] corners.
        Tip: draw it on https://geojson.io and copy the corners here.
     2. "radius"  : a circle. center = [lat, lng], km = radius in km.
     3. "cities"  : a list of city/kabupaten names (not case-sensitive),
        matched against the city returned by the address search.

     Set active: false to switch a zone off without deleting it.
     ------------------------------------------------------------------- */
  ZONES: [
    {
      name: "Jakarta (sample zone)",
      type: "polygon",
      active: true,
      points: [
        [-6.100, 106.690], [-6.090, 106.740], [-6.100, 106.800],
        [-6.090, 106.870], [-6.090, 106.970], [-6.170, 106.970],
        [-6.250, 106.930], [-6.330, 106.920], [-6.370, 106.860],
        [-6.360, 106.790], [-6.300, 106.740], [-6.230, 106.710],
        [-6.160, 106.690]
      ]
    },
    {
      name: "Example radius zone (switched off)",
      type: "radius",
      active: false,
      center: [-6.595, 106.816],   // Bogor
      km: 8
    },
    {
      name: "Example city list (switched off)",
      type: "cities",
      active: false,
      cities: ["Depok", "Kota Depok"]
    }
  ],

  /* -------------------------------------------------------------------
     BOOKING SLOTS
     days: 0 = Sunday ... 6 = Saturday. Only these weekdays can be booked.
     slots: time windows offered each day.
     minDaysAhead / maxDaysAhead: how far in advance customers can book.
     ------------------------------------------------------------------- */
  BOOKING: {
    days: [1, 2, 3, 4, 5, 6],
    slots: ["08:00 - 10:00", "10:00 - 12:00", "13:00 - 15:00", "15:00 - 17:00"],
    minDaysAhead: 1,
    maxDaysAhead: 30
  },

  /* Alternative contact for customers outside the service area. */
  CONTACT: {
    whatsapp: "6281200000000",      // international format, no + or spaces
    phoneDisplay: "+62 812-0000-0000"
  },

  /* Default language: "en" or "id". Customers can switch on the page. */
  DEFAULT_LANG: "en",

  /* -------------------------------------------------------------------
     TEXT
     Every label and message on the form. Edit freely; keep the keys.
     ------------------------------------------------------------------- */
  TEXT: {
    en: {
      title: "Book a visit",
      subtitle: "Tell us where you are and we'll check that we cover your area.",
      step1: "Your details", step2: "Choose a time", step3: "Confirmed",
      name: "Full name", phone: "Phone (WhatsApp)", email: "Email",
      address: "Address", addressPh: "Start typing your street, building or area...",
      addressHelp: "Pick your address from the list, then drag the pin to your exact location.",
      detail: "House no. / Blok / RT-RW / landmark", detailPh: "e.g. Blok C2 No. 15, RT 03/RW 05, near the mosque",
      postcode: "Postal code", city: "City / Kabupaten", province: "Province", district: "Kecamatan", village: "Kelurahan",
      checking: "Checking your area...",
      inZone: "Great news, we serve your area.",
      outZoneTitle: "Sorry, we don't cover this location yet",
      outZoneBody: "Your address is outside our current service area, so we can't book a visit online. Please message us and we'll see what we can do.",
      waBtn: "Message us on WhatsApp", notifyBtn: "Notify me when you cover my area",
      notifyDone: "Thanks! We'll let you know when we reach your area.",
      next: "Continue", back: "Back", submit: "Confirm booking",
      date: "Date", slot: "Time window", notes: "Notes for our team (optional)",
      doneTitle: "Your booking is confirmed",
      doneBody: "We've received your booking. Our team will contact you on WhatsApp to confirm.",
      ref: "Booking reference", newBooking: "Make another booking",
      errName: "Please enter your full name.",
      errPhone: "Please enter a valid Indonesian mobile number, e.g. 0812 3456 7890.",
      errEmail: "Please enter a valid email address.",
      errAddress: "Please choose your address from the suggestions.",
      errDetail: "Please add your house number, blok or a landmark.",
      errPostcode: "Postal code must be 5 digits.",
      errDate: "Please pick a date.", errSlot: "Please pick a time window.",
      noResults: "No matching address. Try a street name, building or area.",
      pinMoved: "Pin moved, address updated.",
      summary: "Booking summary"
    },
    id: {
      title: "Pesan kunjungan",
      subtitle: "Masukkan alamat Anda, kami cek apakah area Anda terjangkau.",
      step1: "Data Anda", step2: "Pilih waktu", step3: "Terkonfirmasi",
      name: "Nama lengkap", phone: "No. HP (WhatsApp)", email: "Email",
      address: "Alamat", addressPh: "Ketik nama jalan, gedung, atau area...",
      addressHelp: "Pilih alamat dari daftar, lalu geser pin ke lokasi tepat Anda.",
      detail: "No. rumah / Blok / RT-RW / patokan", detailPh: "mis. Blok C2 No. 15, RT 03/RW 05, dekat masjid",
      postcode: "Kode pos", city: "Kota / Kabupaten", province: "Provinsi", district: "Kecamatan", village: "Kelurahan",
      checking: "Mengecek area Anda...",
      inZone: "Kabar baik, area Anda kami layani.",
      outZoneTitle: "Maaf, lokasi ini belum terjangkau",
      outZoneBody: "Alamat Anda berada di luar area layanan kami, jadi belum bisa dipesan online. Silakan hubungi kami, kami akan bantu sebisa mungkin.",
      waBtn: "Chat kami via WhatsApp", notifyBtn: "Kabari saya jika area saya terjangkau",
      notifyDone: "Terima kasih! Kami akan mengabari Anda.",
      next: "Lanjut", back: "Kembali", submit: "Konfirmasi pesanan",
      date: "Tanggal", slot: "Jam", notes: "Catatan untuk tim kami (opsional)",
      doneTitle: "Pesanan Anda terkonfirmasi",
      doneBody: "Pesanan sudah kami terima. Tim kami akan menghubungi Anda via WhatsApp.",
      ref: "Nomor pesanan", newBooking: "Buat pesanan lain",
      errName: "Mohon isi nama lengkap.",
      errPhone: "Mohon isi nomor HP Indonesia yang valid, mis. 0812 3456 7890.",
      errEmail: "Mohon isi email yang valid.",
      errAddress: "Mohon pilih alamat dari daftar saran.",
      errDetail: "Mohon isi no. rumah, blok, atau patokan.",
      errPostcode: "Kode pos harus 5 angka.",
      errDate: "Mohon pilih tanggal.", errSlot: "Mohon pilih jam.",
      noResults: "Alamat tidak ditemukan. Coba nama jalan, gedung, atau area.",
      pinMoved: "Pin dipindah, alamat diperbarui.",
      summary: "Ringkasan pesanan"
    }
  }
};
