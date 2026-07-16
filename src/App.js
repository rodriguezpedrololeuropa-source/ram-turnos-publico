import { useState, useEffect } from "react";

const API = "https://script.google.com/macros/s/AKfycbywS7zkLkU7MhQfGrHCROofJoObrMSM8Wj9cQ2VuTejYyb6J5v2_Nu-N0h8aMG50JDk/exec";

const SVCS = [
  { id: "corte", label: "Corte", duration: 45, price: 14000 },
  { id: "corte_barba", label: "Corte + Barba", duration: 55, price: 18000 },
  { id: "corte_cejas", label: "Corte + Cejas", duration: 45, price: 15000 },
  { id: "corte_full", label: "Corte FULL", duration: 70, price: 20000 },
];

const DIAS = ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"];
const fmtP = n => "$" + Number(n).toLocaleString("es-AR");
const fmtFecha = str => {
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("es-AR", { weekday:"long", day:"numeric", month:"long" });
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@300;400;500&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#000;color:#fff;font-family:'Inter',sans-serif;}
  .cinzel{font-family:'Cinzel',serif;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes glow{0%,100%{text-shadow:0 0 20px rgba(255,255,255,.1)}50%{text-shadow:0 0 40px rgba(255,255,255,.3)}}
  .fade-up{animation:fadeUp .5s cubic-bezier(.4,0,.2,1) both;}
  .hero{min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;padding:40px 20px;background:#000;}
  .btn-reservar{font-family:'Cinzel',serif;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;background:#fff;color:#000;border:none;padding:14px;cursor:pointer;transition:all .3s;width:100%;}
  .btn-reservar:hover{background:#e0e0e0;}
  .nav{background:#000;border-bottom:1px solid #111;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
  .btn-back{background:transparent;border:none;color:#555;cursor:pointer;font-family:'Cinzel',serif;font-size:9px;letter-spacing:.1em;text-transform:uppercase;}
  .panel{max-width:560px;margin:0 auto;padding:24px 20px 60px;}
  .step-hdr{margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid #1a1a1a;}
  .step-num{font-family:'Cinzel',serif;font-size:9px;color:#555;letter-spacing:.1em;margin-bottom:4px;}
  .step-title{font-family:'Cinzel',serif;font-size:18px;color:#fff;letter-spacing:2px;}
  .svc-list{display:flex;flex-direction:column;gap:8px;margin-bottom:20px;}
  .svc-item{border:1px solid #1a1a1a;padding:14px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:all .3s;}
  .svc-item:hover{border-color:#444;background:#0a0a0a;}
  .svc-item.active{border-color:#fff;background:#0f0f0f;}
  .svc-name{font-family:'Cinzel',serif;font-size:13px;color:#fff;margin-bottom:3px;}
  .svc-dur{font-size:10px;color:#888;}
  .svc-price{font-family:'Cinzel',serif;font-size:17px;color:#fff;}
  .fecha-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:16px;}
  .fd{border:1px solid #1a1a1a;padding:8px 2px;text-align:center;cursor:pointer;transition:all .2s;}
  .fd:hover{border-color:#444;}
  .fd.active{border-color:#fff;background:#111;}
  .fd-name{font-size:8px;color:#888;font-family:'Cinzel',serif;text-transform:uppercase;margin-bottom:2px;}
  .fd-num{font-size:13px;color:#fff;font-family:'Cinzel',serif;}
  .hora-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:20px;}
  .hora-slot{border:1px solid #1a1a1a;padding:9px 3px;text-align:center;cursor:pointer;transition:all .2s;}
  .hora-slot:hover{border-color:#444;}
  .hora-slot.active{border-color:#fff;background:#111;}
  .hora-slot.ocupado{opacity:.2;cursor:default;}
  .hora-txt{font-family:'Cinzel',serif;font-size:12px;color:#fff;}
  .hora-st{font-size:8px;color:#555;margin-top:1px;}
  .field-lbl{font-size:9px;letter-spacing:.12em;color:#fff;text-transform:uppercase;display:block;margin-bottom:6px;font-family:'Cinzel',serif;opacity:.6;}
  .field{width:100%;background:transparent;border:none;border-bottom:1px solid #2a2a2a;color:#fff;font-size:15px;padding:9px 0;outline:none;font-family:'Inter',sans-serif;display:block;box-sizing:border-box;margin-bottom:18px;transition:border-color .3s;}
  .field:focus{border-bottom-color:#fff;}
  .field::placeholder{color:#333;}
  .btn-full{width:100%;padding:13px;background:#fff;color:#000;font-family:'Cinzel',serif;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;border:none;cursor:pointer;margin-top:6px;transition:all .3s;}
  .btn-full:hover{background:#e0e0e0;}
  .btn-full.dim{opacity:.3;cursor:default;}
  .btn-outline{width:100%;padding:11px;background:transparent;color:#fff;font-family:'Cinzel',serif;font-size:10px;letter-spacing:.15em;text-transform:uppercase;border:1px solid #2a2a2a;cursor:pointer;margin-top:8px;transition:all .3s;}
  .btn-outline:hover{border-color:#fff;}
  .cf-row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #111;font-size:12px;}
  .ck{color:#555;font-family:'Cinzel',serif;font-size:9px;letter-spacing:.08em;text-transform:uppercase;}
  .success{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center;background:#000;}
  .loading{text-align:center;padding:40px 20px;font-family:'Cinzel',serif;font-size:11px;color:#555;letter-spacing:.1em;}
  @media(max-width:480px){.hora-grid{grid-template-columns:repeat(3,1fr);}}
`;

function injectCSS() {
  if (document.getElementById("turnos-css")) return;
  const s = document.createElement("style"); s.id = "turnos-css"; s.textContent = css; document.head.appendChild(s);
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@300;400;500&display=swap"; document.head.appendChild(l);
}

const LogoSVG = () => (
  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", zIndex:0 }}>
    <svg viewBox="0 0 800 700" style={{ width:"min(600px,95vw)", opacity:.28 }} xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(60,120)">
        <path d="M80,0 C110,-10 140,20 145,60 C150,100 130,140 100,155 C70,170 40,155 25,125 C10,95 15,50 40,25 C55,10 65,5 80,0 Z" fill="none" stroke="#fff" strokeWidth="1.8"/>
        <path d="M80,15 C100,10 120,30 122,60 C124,90 108,118 88,128 C68,138 48,125 38,105 C28,85 35,55 55,38 C65,28 72,18 80,15 Z" fill="none" stroke="#fff" strokeWidth="1.4"/>
        <path d="M80,160 C76,200 70,240 65,290 C62,320 60,350 58,380" fill="none" stroke="#fff" strokeWidth="2"/>
        <path d="M68,240 C45,228 28,235 22,255 C16,275 28,295 50,295 C62,295 72,285 68,265 Z" fill="none" stroke="#fff" strokeWidth="1.3"/>
        <path d="M63,310 C85,298 102,305 106,325 C110,345 96,362 74,360 C62,359 54,348 58,330 Z" fill="none" stroke="#fff" strokeWidth="1.3"/>
      </g>
      <g transform="translate(550,120)">
        <path d="M80,0 C110,-10 140,20 145,60 C150,100 130,140 100,155 C70,170 40,155 25,125 C10,95 15,50 40,25 C55,10 65,5 80,0 Z" fill="none" stroke="#fff" strokeWidth="1.8"/>
        <path d="M80,15 C100,10 120,30 122,60 C124,90 108,118 88,128 C68,138 48,125 38,105 C28,85 35,55 55,38 C65,28 72,18 80,15 Z" fill="none" stroke="#fff" strokeWidth="1.4"/>
        <path d="M80,160 C84,200 90,240 95,290 C98,320 100,350 102,380" fill="none" stroke="#fff" strokeWidth="2"/>
        <path d="M92,240 C115,228 132,235 138,255 C144,275 132,295 110,295 C98,295 88,285 92,265 Z" fill="none" stroke="#fff" strokeWidth="1.3"/>
        <path d="M97,310 C75,298 58,305 54,325 C50,345 64,362 86,360 C98,359 106,348 102,330 Z" fill="none" stroke="#fff" strokeWidth="1.3"/>
      </g>
      <text x="400" y="260" textAnchor="middle" fontFamily="Georgia,serif" fontSize="180" fontWeight="900" fill="#fff" letterSpacing="20">RAM</text>
      <text x="400" y="320" textAnchor="middle" fontFamily="Georgia,serif" fontSize="30" fill="#fff" letterSpacing="20">HAIR STUDIO</text>
      <line x1="200" y1="342" x2="365" y2="342" stroke="#fff" strokeWidth="1"/>
      <line x1="435" y1="342" x2="600" y2="342" stroke="#fff" strokeWidth="1"/>
      <circle cx="400" cy="342" r="5" fill="#fff"/>
      <circle cx="385" cy="342" r="3" fill="#fff"/>
      <circle cx="415" cy="342" r="3" fill="#fff"/>
    </svg>
  </div>
);

export default function App() {
  useEffect(() => { injectCSS(); }, []);

  const [screen, setScreen] = useState("hero");
  const [step, setStep] = useState(1);
  const [selSvc, setSelSvc] = useState(null);
  const [selFecha, setSelFecha] = useState(null);
  const [selHora, setSelHora] = useState(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const svc = SVCS.find(s => s.id === selSvc);

  function getDates() {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() !== 0) dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  }

  async function loadSlots(fecha, duracion) {
    setLoadingSlots(true);
    setSlots([]);
    setSelHora(null);
    try {
      const res = await fetch(`${API}?action=getSlots&fecha=${fecha}&duracion=${duracion}`);
      const data = await res.json();
      if (data.slots) setSlots(data.slots);
    } catch(e) { console.error(e); }
    setLoadingSlots(false);
  }

  async function confirmarTurno() {
    if (!selSvc || !selFecha || !selHora || !nombre.trim() || !telefono.trim()) return;
    setSubmitting(true);
    try {
      await fetch(API, {
        method: "POST",
        body: JSON.stringify({
          action: "addTurnoPublico",
          cliente_nombre: nombre.trim(),
          cliente_tel: telefono.trim(),
          service: selSvc,
          fecha: selFecha,
          hora: selHora,
        }),
      });
      setScreen("success");
    } catch(e) { console.error(e); }
    setSubmitting(false);
  }

  if (screen === "success") return (
    <div className="success">
      <div className="cinzel" style={{ fontSize:56, color:"#fff", marginBottom:16, animation:"glow 2s infinite" }}>✦</div>
      <div className="cinzel" style={{ fontSize:24, color:"#fff", letterSpacing:4, marginBottom:6 }}>Turno confirmado</div>
      <div className="cinzel" style={{ fontSize:10, color:"#555", letterSpacing:".12em", marginBottom:32 }}>Te esperamos</div>
      <div style={{ border:"1px solid #1a1a1a", padding:"18px 24px", width:"100%", maxWidth:320, marginBottom:28 }}>
        {[["Servicio",svc?.label],["Duracion",svc?.duration+" minutos"],["Fecha",selFecha?fmtFecha(selFecha):""],["Hora",selHora],["Nombre",nombre],["Telefono",telefono]].map(([k,v])=>(
          <div key={k} className="cf-row"><span className="ck">{k}</span><span style={{ color:"#fff", fontWeight:500 }}>{v}</span></div>
        ))}
      </div>
      <button className="btn-outline" style={{ maxWidth:280 }} onClick={()=>{setScreen("hero");setStep(1);setSelSvc(null);setSelFecha(null);setSelHora(null);setNombre("");setTelefono("");}}>
        Reservar otro turno
      </button>
    </div>
  );

  if (screen === "hero") return (
    <div className="hero">
      <LogoSVG/>
      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:340, background:"rgba(0,0,0,0.78)", backdropFilter:"blur(12px)", border:"1px solid #1a1a1a", padding:"32px 26px" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div className="cinzel" style={{ fontSize:26, color:"#fff", letterSpacing:8, marginBottom:4 }}>RAM</div>
          <div className="cinzel" style={{ fontSize:9, letterSpacing:10, color:"#555" }}>Hair Studio</div>
          <div style={{ width:28, height:1, background:"#1a1a1a", margin:"10px auto 0" }}/>
        </div>
        <div className="cinzel" style={{ fontSize:9, color:"#555", letterSpacing:".1em", textAlign:"center", marginBottom:18, textTransform:"uppercase" }}>Reserva tu turno online</div>
        <div style={{ marginBottom:22 }}>
          {SVCS.map(sv=>(
            <div key={sv.id} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #111" }}>
              <span className="cinzel" style={{ fontSize:11, color:"#fff" }}>{sv.label}</span>
              <span className="cinzel" style={{ fontSize:10, color:"#555" }}>{sv.duration} min</span>
            </div>
          ))}
        </div>
        <button className="btn-reservar" onClick={()=>setScreen("booking")}>Reservar turno</button>
      </div>
    </div>
  );

  return (
    <div style={{ background:"#000", minHeight:"100vh" }}>
      <div className="nav">
        <button className="btn-back" onClick={()=>step>1?setStep(step-1):setScreen("hero")}>← Volver</button>
        <div className="cinzel" style={{ fontSize:14, color:"#fff", letterSpacing:4 }}>RAM</div>
        <div style={{ display:"flex", gap:5 }}>
          {[1,2,3,4,5].map(i=><div key={i} style={{ width:6, height:6, borderRadius:"50%", background:i<=step?"#fff":"#1a1a1a", transition:"all .3s" }}/>)}
        </div>
      </div>

      <div className="panel">

        {step===1 && (
          <div className="fade-up">
            <div className="step-hdr"><div className="step-num">Paso 1 de 5</div><div className="step-title">Selecciona tu servicio</div></div>
            <div className="svc-list">
              {SVCS.map(sv=>(
                <div key={sv.id} className={`svc-item${selSvc===sv.id?" active":""}`} onClick={()=>setSelSvc(sv.id)}>
                  <div><div className="svc-name">{sv.label}</div><div className="svc-dur">{sv.duration} minutos</div></div>
                  <div className="svc-price">{fmtP(sv.price)}</div>
                </div>
              ))}
            </div>
            <button className={`btn-full${selSvc?"":" dim"}`} onClick={()=>selSvc&&setStep(2)}>Continuar</button>
          </div>
        )}

        {step===2 && (
          <div className="fade-up">
            <div className="step-hdr"><div className="step-num">Paso 2 de 5</div><div className="step-title">Elegí la fecha</div></div>
            <div className="fecha-grid">
              {getDates().map(date=>{
                const d=new Date(date+"T12:00:00");
                return(
                  <div key={date} className={`fd${selFecha===date?" active":""}`} onClick={()=>{setSelFecha(date);loadSlots(date,svc.duration);}}>
                    <div className="fd-name">{DIAS[d.getDay()]}</div>
                    <div className="fd-num">{d.getDate()}</div>
                  </div>
                );
              })}
            </div>
            {selFecha && <div className="cinzel" style={{ fontSize:10, color:"#555", marginBottom:14, textTransform:"capitalize" }}>{fmtFecha(selFecha)}</div>}
            <button className={`btn-full${selFecha?"":" dim"}`} onClick={()=>selFecha&&setStep(3)}>Continuar</button>
          </div>
        )}

        {step===3 && (
          <div className="fade-up">
            <div className="step-hdr"><div className="step-num">Paso 3 de 5</div><div className="step-title">Elegí el horario</div></div>
            <div className="cinzel" style={{ fontSize:10, color:"#555", marginBottom:14 }}>{svc?.label} · {svc?.duration} min · {selFecha?fmtFecha(selFecha):""}</div>
            {loadingSlots ? (
              <div className="loading">Cargando horarios...</div>
            ) : (
              <div className="hora-grid">
                {slots.map(sl=>(
                  <div key={sl.hora} className={`hora-slot${selHora===sl.hora?" active":""}${!sl.libre?" ocupado":""}`} onClick={()=>sl.libre&&setSelHora(sl.hora)}>
                    <div className="hora-txt">{sl.hora}</div>
                    <div className="hora-st">{sl.libre?"libre":"ocupado"}</div>
                  </div>
                ))}
              </div>
            )}
            <button className={`btn-full${selHora?"":" dim"}`} onClick={()=>selHora&&setStep(4)}>Continuar</button>
          </div>
        )}

        {step===4 && (
          <div className="fade-up">
            <div className="step-hdr"><div className="step-num">Paso 4 de 5</div><div className="step-title">Tus datos</div></div>
            <span className="field-lbl">Nombre completo</span>
            <input className="field" type="text" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Carlos Lopez..."/>
            <span className="field-lbl">Telefono</span>
            <input className="field" type="tel" value={telefono} onChange={e=>setTelefono(e.target.value)} placeholder="+54 9 ..."/>
            <button className={`btn-full${nombre.trim()&&telefono.trim()?"":" dim"}`} onClick={()=>nombre.trim()&&telefono.trim()&&setStep(5)}>Continuar</button>
          </div>
        )}

        {step===5 && (
          <div className="fade-up">
            <div className="step-hdr"><div className="step-num">Paso 5 de 5</div><div className="step-title">Confirma tu turno</div></div>
            {[["Servicio",svc?.label],["Duracion",svc?.duration+" minutos"],["Precio",fmtP(svc?.price)],["Fecha",selFecha?fmtFecha(selFecha):""],["Hora",selHora],["Nombre",nombre],["Telefono",telefono]].map(([k,v])=>(
              <div key={k} className="cf-row"><span className="ck">{k}</span><span style={{ color:"#fff", fontWeight:500 }}>{v}</span></div>
            ))}
            <button className="btn-full" style={{ marginTop:20 }} onClick={confirmarTurno} disabled={submitting}>
              {submitting?"Confirmando...":"✦ Confirmar turno"}
            </button>
            <button className="btn-outline" onClick={()=>setStep(4)}>Volver</button>
          </div>
        )}

      </div>
    </div>
  );
}
