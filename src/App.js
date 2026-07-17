const SHEET_ID = "1Xis_Hno_r10O7EhTg100WxTUlzLmGX0A-8Cv-YB-0y8";

function getSheet(name) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
}

function initHeaders() {
  const headers = {
    "SERVICIOS": ["ID","Fecha","Hora","Servicio","Precio","Metodo Pago","Cliente","Telefono","Nota"],
    "CLIENTES": ["ID","Nombre","Telefono","Visitas","Ultima Visita","Desde"],
    "TURNOS": ["ID","Fecha","Hora","Cliente","Telefono","Servicio","Origen"],
    "GASTOS": ["ID","Fecha","Descripcion","Monto"],
    "TURNOS_PUBLICOS": ["ID","Fecha","Hora","Cliente","Telefono","Servicio","Estado"],
  };
  const ss = SpreadsheetApp.openById(SHEET_ID);
  Object.entries(headers).forEach(([name, cols]) => {
    const sheet = ss.getSheetByName(name);
    if (sheet && sheet.getLastRow() === 0) sheet.appendRow(cols);
  });
}

const SVC_MAP = {
  corte: "Corte",
  corte_barba: "Corte + Barba",
  corte_cejas: "Corte + Cejas",
  corte_full: "Corte FULL"
};

const SVC_DUR = { corte: 45, corte_barba: 55, corte_cejas: 45, corte_full: 70 };

// ---------- Normalizadores ----------
// Devuelve siempre la fecha como "yyyy-MM-dd", venga como Date,
// "dd/mm/yyyy" o "yyyy-mm-dd". Así las comparaciones nunca fallan.
function normFecha(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    return m[3] + "-" + String(m[2]).padStart(2, "0") + "-" + String(m[1]).padStart(2, "0");
  }
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    return m[1] + "-" + String(m[2]).padStart(2, "0") + "-" + String(m[3]).padStart(2, "0");
  }
  return s;
}

// Devuelve siempre la hora como "HH:mm"
function normHora(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "HH:mm");
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) return String(m[1]).padStart(2, "0") + ":" + m[2];
  return s;
}

// Invierte el mapa de servicios para poder buscar la duración
// aunque en la hoja esté guardado el nombre "lindo" (ej: "Corte + Barba")
function svcKey(name) {
  const s = String(name).trim().toLowerCase();
  for (const [key, label] of Object.entries(SVC_MAP)) {
    if (key === s || label.toLowerCase() === s) return key;
  }
  return null;
}

// ---------- Entradas HTTP ----------
function doGet(e) {
  const action = e.parameter.action;
  const sheet_name = e.parameter.sheet;

  // Acciones de escritura por GET -> mismo handler que doPost
  if (action === "addServicio" || action === "addCliente" || action === "addTurno" ||
      action === "addTurnoPublico" || action === "addGasto" || action === "deleteRow" ||
      action === "updateCliente") {
    const payload = Object.assign({}, e.parameter);
    return handleAction(payload);
  }

  if (action === "get") {
    const sheet = getSheet(sheet_name);
    if (!sheet) return jsonResponse({ error: "Sheet not found" });
    // getDisplayValues: devuelve strings tal como se ven en la hoja,
    // evita que las fechas salgan como "2026-07-17T03:00:00.000Z"
    const data = sheet.getDataRange().getDisplayValues();
    const headers = data[0];
    const rows = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
    return jsonResponse({ data: rows });
  }

  if (action === "getSlots") {
    const fecha = normFecha(e.parameter.fecha);
    const duracion = parseInt(e.parameter.duracion, 10);
    const sheet = getSheet("TURNOS");
    const sheet2 = getSheet("TURNOS_PUBLICOS");
    const ocupados = [];

    [sheet, sheet2].forEach(s => {
      if (!s) return;
      const rows = s.getDataRange().getValues().slice(1);
      rows.forEach(r => {
        if (normFecha(r[1]) === fecha) {
          ocupados.push({ hora: normHora(r[2]), service: r[5] });
        }
      });
    });

    const slots = generateSlots(fecha, duracion, ocupados);
    return jsonResponse({ slots });
  }

  return jsonResponse({ error: "Unknown action" });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    return handleAction(payload);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ---------- Handler unificado (GET y POST) ----------
function handleAction(payload) {
  try {
    initHeaders();
    const action = payload.action;

    if (action === "addServicio") {
      const sheet = getSheet("SERVICIOS");
      const id = Date.now();
      const d = new Date();
      sheet.appendRow([
        id,
        normFecha(d),
        Utilities.formatDate(d, Session.getScriptTimeZone(), "HH:mm"),
        SVC_MAP[payload.service] || payload.service,
        payload.price,
        payload.pago,
        payload.cliente_nombre || "—",
        payload.cliente_tel || "—",
        payload.note || "—"
      ]);

      if (payload.cliente_nombre && payload.cliente_nombre !== "—") {
        upsertCliente(payload.cliente_nombre, payload.cliente_tel || "");
      }

      return jsonResponse({ ok: true, id });
    }

    if (action === "addCliente") {
      upsertCliente(payload.nombre, payload.tel || "");
      return jsonResponse({ ok: true });
    }

    if (action === "addTurno") {
      const sheet = getSheet("TURNOS");
      const id = Date.now();
      sheet.appendRow([
        id,
        normFecha(payload.fecha),
        normHora(payload.hora),
        payload.cliente_nombre,
        payload.cliente_tel || "—",
        SVC_MAP[payload.service] || payload.service,
        payload.origen || "privado"
      ]);
      return jsonResponse({ ok: true, id });
    }

    if (action === "addTurnoPublico") {
      const sheet = getSheet("TURNOS_PUBLICOS");
      const sheet2 = getSheet("TURNOS");
      const id = Date.now();
      const fecha = normFecha(payload.fecha);
      const hora = normHora(payload.hora);
      const servicio = SVC_MAP[payload.service] || payload.service;

      sheet.appendRow([
        id, fecha, hora,
        payload.cliente_nombre,
        payload.cliente_tel || "—",
        servicio,
        "pendiente"
      ]);
      sheet2.appendRow([
        id, fecha, hora,
        payload.cliente_nombre,
        payload.cliente_tel || "—",
        servicio,
        "publico"
      ]);

      upsertCliente(payload.cliente_nombre, payload.cliente_tel || "");

      return jsonResponse({ ok: true, id });
    }

    if (action === "addGasto") {
      const sheet = getSheet("GASTOS");
      const id = Date.now();
      const d = new Date();
      sheet.appendRow([
        id,
        normFecha(d),
        payload.descripcion,
        payload.monto
      ]);
      return jsonResponse({ ok: true, id });
    }

    if (action === "deleteRow") {
      const sheet = getSheet(payload.sheet);
      if (!sheet) return jsonResponse({ error: "Sheet not found" });
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(payload.id)) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ ok: true });
        }
      }
      return jsonResponse({ error: "Row not found" });
    }

    if (action === "updateCliente") {
      const sheet = getSheet("CLIENTES");
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(payload.id)) {
          sheet.getRange(i + 1, 2).setValue(payload.nombre);
          sheet.getRange(i + 1, 3).setValue(payload.tel || "—");
          return jsonResponse({ ok: true });
        }
      }
      return jsonResponse({ error: "Cliente not found" });
    }

    return jsonResponse({ error: "Unknown action" });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function upsertCliente(nombre, tel) {
  if (!nombre) return;
  const sheet = getSheet("CLIENTES");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === String(nombre).toLowerCase()) {
      sheet.getRange(i + 1, 4).setValue(Number(data[i][3]) + 1);
      sheet.getRange(i + 1, 5).setValue(normFecha(new Date()));
      if (tel) sheet.getRange(i + 1, 3).setValue(tel);
      return;
    }
  }
  sheet.appendRow([
    Date.now(),
    nombre,
    tel || "—",
    1,
    normFecha(new Date()),
    normFecha(new Date())
  ]);
}

function generateSlots(fecha, duracion, ocupados) {
  const slots = [];
  const franjas = [
    { from: "10:00", to: "14:00" },
    { from: "15:00", to: "22:00" }
  ];

  franjas.forEach(({ from, to }) => {
    let [h, m] = from.split(":").map(Number);
    const [eh, em] = to.split(":").map(Number);
    while (h * 60 + m + duracion <= eh * 60 + em) {
      const slot = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
      const sMin = h * 60 + m;
      const sEnd = sMin + duracion;
      const ocupado = ocupados.some(o => {
        const [oh, om2] = String(o.hora).split(":").map(Number);
        const oStart = oh * 60 + om2;
        const key = svcKey(o.service);
        const oDur = key ? SVC_DUR[key] : 45;
        const oEnd = oStart + oDur;
        return sMin < oEnd && sEnd > oStart;
      });
      slots.push({ hora: slot, libre: !ocupado });
      m += 10;
      if (m >= 60) { h++; m -= 60; }
    }
  });
  return slots;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
