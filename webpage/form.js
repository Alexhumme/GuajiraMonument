import { db } from './firebase.js';
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

export var sel = { edad: null, procedencia: null, tipo: null };

export function selOpt(btn) {
  var g = btn.getAttribute("data-group");
  var btns = document.querySelectorAll('[data-group="' + g + '"]');
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove("sel");
  btn.classList.add("sel");
  sel[g] = btn.getAttribute("data-val");
  var alert = document.getElementById("form-alert");
  if (alert) alert.style.display = "none";
  updateSteps();
}

export function updateSteps() {
  var groups = [
    { key: "edad", node: "sn1", conn: "sc1", next: "sn2" },
    { key: "procedencia", node: "sn2", conn: "sc2", next: "sn3" },
    { key: "tipo", node: "sn3", conn: null, next: null },
  ];
  for (var i = 0; i < groups.length; i++) {
    var g = groups[i];
    var node = document.getElementById(g.node);
    if (sel[g.key]) {
      node.className = "step-node done";
      node.textContent = "✓";
      if (g.conn) document.getElementById(g.conn).classList.add("done");
      if (g.next) {
        var nextNode = document.getElementById(g.next);
        if (!nextNode.classList.contains("done"))
          nextNode.className = "step-node current";
      }
    }
  }
}

export async function submitForm() {
  if (!sel.edad || !sel.procedencia || !sel.tipo) {
    var alert = document.getElementById("form-alert");
    if (alert) alert.style.display = "block";
    var groups = ["edad", "procedencia", "tipo"];
    for (var i = 0; i < groups.length; i++) {
      if (!sel[groups[i]]) {
        var c = document.getElementById("grp-" + groups[i]);
        c.style.outline = "1px solid rgba(200,60,60,0.4)";
        c.style.borderRadius = "12px";
        c.style.padding = "6px";
        c.style.background = "rgba(200,60,60,0.05)";
        (function (el) {
          setTimeout(function () {
            el.style.outline = "";
            el.style.padding = "";
            el.style.background = "";
          }, 1600);
        })(c);
      }
    }
    return;
  }

  // Mostrar barra de progreso
  var submitBtn = document.getElementById("form-submit-btn");
  var progressWrapper = document.getElementById("progress-wrapper");
  submitBtn.style.display = "none";
  progressWrapper.style.display = "block";
  submitBtn.disabled = true;

  var now = new Date();
  var consulta = {
    edad: sel.edad,
    procedencia: sel.procedencia,
    tipoVisitante: sel.tipo,
    fechaConsulta: now.toISOString().split("T")[0],
    horaConsulta: now.toTimeString().split(" ")[0],
    monumentoId: "francisco_el_hombre",
    monumentoNombre: "Monumento Francisco El Hombre",
    timestamp: now.toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "consultas"), consulta);
    console.log("Consulta guardada en Firestore con ID:", docRef.id);
  } catch (error) {
    console.error("Error al guardar consulta:", error);
    // Ocultar barra y mostrar botón de nuevo si hay error
    progressWrapper.style.display = "none";
    submitBtn.style.display = "block";
    submitBtn.disabled = false;
    alert("Error al guardar los datos. Por favor, intenta de nuevo.");
    return;
  }

  document.getElementById("screen-form").classList.remove("active");
  document.getElementById("screen-mon").classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function goBack() {
  document.getElementById("screen-mon").classList.remove("active");
  document.getElementById("screen-form").classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
