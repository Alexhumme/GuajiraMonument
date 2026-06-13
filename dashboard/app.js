/******************************************************************
 * IMPORTS
 ******************************************************************/

import { db } from "./firebase.js";

import {
  collection,
  query,
  where,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

/******************************************************************
 * ESTADO GLOBAL
 ******************************************************************/

let rawDataGlobal = [];
let isInitialSnapshot = true;

let currentFilterField = null;
let currentFilterValue = null;

let chartProcedenciaInstance = null;
let chartEdadInstance = null;
let chartComparisonInstance = null;

const SIDEBAR_COLLAPSED_KEY = "dashboardSidebarCollapsed";

/******************************************************************
 * CONSTANTES
 ******************************************************************/

const MONUMENTO_ID = "francisco_el_hombre";

const CATEGORIAS_EDAD = [
  "Menor de 18",
  "18-25",
  "26-35",
  "36-45",
  "46-60",
  "Mayor de 60",
];

const CATEGORIAS_PROCEDENCIA = [
  "Riohacha",
  "Otro municipio de La Guajira",
  "Otro departamento de Colombia",
  "Extranjero",
];

const CATEGORIAS_VISITANTE = [
  "Turista",
  "Residente",
  "Estudiante",
  "Investigador",
  "Otro",
];

const VARIABLE_MAP = {
  edad: {
    label: "Rango de Edad",
    categories: CATEGORIAS_EDAD,
  },
  procedencia: {
    label: "Procedencia",
    categories: CATEGORIAS_PROCEDENCIA,
  },
  tipoVisitante: {
    label: "Tipo de Visitante",
    categories: CATEGORIAS_VISITANTE,
  },
};

const COMPARISON_COLORS = [
  "#8B5E34",
  "#BF8754",
  "#D4A373",
  "#E6C79C",
  "#F3E6D0",
  "#C9943A",
];

/******************************************************************
 * FIRESTORE
 ******************************************************************/

function initFirestoreListener() {
  const consultasRef = collection(db, "consultas");

  const q = query(consultasRef, where("monumentoId", "==", MONUMENTO_ID));

  onSnapshot(q, (snapshot) => {
    if (!isInitialSnapshot) {
      const addedDocs = snapshot.docChanges().filter((change) => change.type === "added");
      if (addedDocs.length > 0) {
        const text = addedDocs.length === 1
          ? "Se agregó un nuevo registro."
          : `${addedDocs.length} registros nuevos agregados.`;
        showToast("Registro actualizado", text);
      }
    }

    rawDataGlobal = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        ...data,

        timestampRaw: data.timestamp, // Guardar timestamp original para ordenar
        timestamp: data.timestamp ? formatTimestamp(data.timestamp) : "—",
      };
    });

    processAndRender();
    isInitialSnapshot = false;
  });
}

function showToast(title, message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <div>
      <strong>${title}</strong>
      <small>${message}</small>
    </div>
    <button class="toast-close" aria-label="Cerrar notificación">×</button>
  `;

  const closeBtn = toast.querySelector(".toast-close");
  closeBtn.addEventListener("click", () => dismissToast(toast));

  container.appendChild(toast);

  const timeoutId = setTimeout(() => dismissToast(toast), 4500);
  toast.dataset.timeoutId = timeoutId;
}

function dismissToast(toast) {
  if (!toast) return;
  const timeoutId = toast.dataset.timeoutId;
  if (timeoutId) {
    clearTimeout(Number(timeoutId));
  }

  toast.style.animation = "toast-out 0.28s ease forwards";
  toast.addEventListener("animationend", () => {
    toast.remove();
  });
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);

  return date.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/******************************************************************
 * FILTROS
 ******************************************************************/

window.setInteractiveFilter = function (field, value) {
  currentFilterField = field;
  currentFilterValue = value;

  document.getElementById("filter-current-value").innerText = value;

  document.getElementById("active-filter-tag").style.display = "flex";

  processAndRender();
};

window.clearCurrentFilter = function () {
  currentFilterField = null;
  currentFilterValue = null;

  document.getElementById("active-filter-tag").style.display = "none";

  processAndRender();
};

/******************************************************************
 * PIPELINE PRINCIPAL
 ******************************************************************/

function processAndRender() {
  let filteredData = [...rawDataGlobal];

  if (currentFilterField && currentFilterValue) {
    filteredData = filteredData.filter(
      (item) => item[currentFilterField] === currentFilterValue,
    );
  }

  renderKPIs(filteredData);
  renderCharts(filteredData);
  renderComparisonChart(filteredData);
  renderTables(filteredData);
  renderHistoryTable(filteredData);
}

/******************************************************************
 * KPI
 ******************************************************************/

function renderKPIs(data) {
  const n = data.length;

  document.getElementById("kpi-n").innerText = n;

  if (n === 0) {
    document.getElementById("kpi-moda-edad").innerText = "—";
    document.getElementById("kpi-moda-procedencia").innerText = "—";
    document.getElementById("kpi-moda-visitante").innerText = "—";
    return;
  }

  document.getElementById("kpi-moda-edad").innerText = calcularModa(
    data,
    "edad",
  );

  document.getElementById("kpi-moda-procedencia").innerText = calcularModa(
    data,
    "procedencia",
  );

  document.getElementById("kpi-moda-visitante").innerText = calcularModa(
    data,
    "tipoVisitante",
  );
}

function calcularModa(data, field) {
  const frecs = {};

  let maxVal = 0;
  let moda = "—";

  data.forEach((item) => {
    const val = item[field];

    if (!val) return;

    frecs[val] = (frecs[val] || 0) + 1;

    if (frecs[val] > maxVal) {
      maxVal = frecs[val];
      moda = val;
    }
  });

  return moda;
}

/******************************************************************
 * TABLAS DE FRECUENCIA
 ******************************************************************/

function renderTables(data) {
  buildSingleTable("edad", CATEGORIAS_EDAD, data, "tbody-frec-edad");

  buildSingleTable(
    "procedencia",
    CATEGORIAS_PROCEDENCIA,
    data,
    "tbody-frec-procedencia",
  );

  buildSingleTable(
    "tipoVisitante",
    CATEGORIAS_VISITANTE,
    data,
    "tbody-frec-visitante",
  );
}

function buildSingleTable(field, categorias, data, tbodyId) {
  const n = data.length;

  const counts = {};

  categorias.forEach((cat) => {
    counts[cat] = 0;
  });

  data.forEach((item) => {
    if (counts[item[field]] !== undefined) {
      counts[item[field]]++;
    }
  });

  const tbody = document.getElementById(tbodyId);

  tbody.innerHTML = "";

  categorias.forEach((cat) => {
    const fi = counts[cat];
    const hi = n > 0 ? fi / n : 0;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><strong>${cat}</strong></td>
      <td>${fi}</td>
      <td>${hi.toFixed(3)}</td>
      <td>${(hi * 100).toFixed(1)}%</td>
      <td>
        <button
          class="filter-action-btn"
          onclick="setInteractiveFilter('${field}','${cat}')"
        >
          Aislar clase
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/******************************************************************
 * GRÁFICAS
 ******************************************************************/

function renderCharts(data) {
  const countsProc = {};
  CATEGORIAS_PROCEDENCIA.forEach((c) => (countsProc[c] = 0));

  data.forEach((item) => {
    if (countsProc[item.procedencia] !== undefined) {
      countsProc[item.procedencia]++;
    }
  });

  const countsEdad = {};
  CATEGORIAS_EDAD.forEach((c) => (countsEdad[c] = 0));

  data.forEach((item) => {
    if (countsEdad[item.edad] !== undefined) {
      countsEdad[item.edad]++;
    }
  });

  if (chartProcedenciaInstance) {
    chartProcedenciaInstance.destroy();
  }

  chartProcedenciaInstance = new Chart(
    document.getElementById("chart-procedencia").getContext("2d"),
    {
      type: "bar",
      data: {
        labels: CATEGORIAS_PROCEDENCIA,
        datasets: [
          {
            label: "Frecuencia",
            data: CATEGORIAS_PROCEDENCIA.map((c) => countsProc[c]),
            backgroundColor: "#C9943A",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    },
  );

  if (chartEdadInstance) {
    chartEdadInstance.destroy();
  }

  chartEdadInstance = new Chart(
    document.getElementById("chart-edad").getContext("2d"),
    {
      type: "doughnut",
      data: {
        labels: CATEGORIAS_EDAD,
        datasets: [
          {
            data: CATEGORIAS_EDAD.map((c) => countsEdad[c]),

            backgroundColor: [
              "#8B5E34", // nogal oscuro
              "#A66A3F", // madera
              "#BF8754", // cuero
              "#D4A373", // arena
              "#E6C79C", // pergamino
              "#F3E6D0", // marfil
            ],

            borderWidth: 2,
            borderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            position: "right",

            labels: {
              boxWidth: 12,
              font: {
                family: "DM Sans",
              },
            },
          },
        },
      },
    },
  );
}

/******************************************************************
 * COMPARACIÓN DE VARIABLES
 ******************************************************************/

window.onCompareChange = function () {
  renderComparisonChart(rawDataGlobal);
};

function renderComparisonChart(data) {
  const xField = document.getElementById("compare-x").value;
  const yField = document.getElementById("compare-y").value;

  const xMeta = VARIABLE_MAP[xField];
  const yMeta = VARIABLE_MAP[yField];
  const counts = {};

  xMeta.categories.forEach((xValue) => {
    counts[xValue] = {};
    yMeta.categories.forEach((yValue) => {
      counts[xValue][yValue] = 0;
    });
  });

  let filtered = [...data];

  if (currentFilterField && currentFilterValue) {
    filtered = filtered.filter(
      (item) => item[currentFilterField] === currentFilterValue,
    );
  }

  filtered.forEach((item) => {
    const xValue = item[xField];
    const yValue = item[yField];

    if (counts[xValue] && counts[xValue][yValue] !== undefined) {
      counts[xValue][yValue]++;
    }
  });

  const datasets = yMeta.categories.map((yValue, index) => ({
    label: yValue,
    data: xMeta.categories.map((xValue) => counts[xValue][yValue]),
    backgroundColor: COMPARISON_COLORS[index % COMPARISON_COLORS.length],
    borderRadius: 4,
  }));

  if (chartComparisonInstance) {
    chartComparisonInstance.destroy();
  }

  chartComparisonInstance = new Chart(
    document.getElementById("chart-comparison").getContext("2d"),
    {
      type: "bar",
      data: {
        labels: xMeta.categories,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 12,
            },
          },
          title: {
            display: true,
            text: `${xMeta.label} vs ${yMeta.label}`,
            font: {
              family: "Playfair Display",
              size: 16,
            },
          },
        },
        scales: {
          x: {
            stacked: false,
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    },
  );
}

/******************************************************************
 * HISTORIAL DE CONSULTAS
 ******************************************************************/

function renderHistoryTable(data) {
  const tbody = document.getElementById("consultas-tbody");

  const emptyState = document.getElementById("consultas-empty");

  if (data.length === 0) {
    tbody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  tbody.innerHTML = "";

  // Ordenar datos por timestampRaw descendente (más recientes primero)
  const sortedData = [...data].sort((a, b) => {
    const timestampA = new Date(a.timestampRaw);
    const timestampB = new Date(b.timestampRaw);
    return timestampB - timestampA;
  });

  sortedData.forEach((item) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.timestamp}</td>
      <td>${item.edad}</td>
      <td>${item.procedencia}</td>
      <td>${item.tipoVisitante}</td>
    `;

    tbody.appendChild(tr);
  });
}

/******************************************************************
 * NAVEGACIÓN DE PANELES
 ******************************************************************/

window.showPanel = function (name, btn) {
  document
    .querySelectorAll(".panel")
    .forEach((p) => p.classList.remove("active"));

  document
    .querySelectorAll(".nav-link")
    .forEach((b) => b.classList.remove("active"));

  document.getElementById("panel-" + name).classList.add("active");

  btn.classList.add("active");
};

function initSidebarToggle() {
  const toggleButton = document.getElementById("sidebar-toggle");
  if (!toggleButton) return;

  const savedState = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
  const shouldCollapse = savedState === "true";

  setSidebarCollapsed(shouldCollapse);

  toggleButton.addEventListener("click", () => {
    const isCollapsed = document.body.classList.toggle("sidebar-collapsed");
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
    updateSidebarToggle(isCollapsed);
  });
}

function setSidebarCollapsed(isCollapsed) {
  document.body.classList.toggle("sidebar-collapsed", isCollapsed);
  updateSidebarToggle(isCollapsed);
}

function updateSidebarToggle(isCollapsed) {
  const toggleButton = document.getElementById("sidebar-toggle");
  if (!toggleButton) return;

  const label = isCollapsed ? "Expandir barra lateral" : "Comprimir barra lateral";
  toggleButton.setAttribute("aria-label", label);
  toggleButton.setAttribute("aria-expanded", String(!isCollapsed));
  toggleButton.setAttribute("title", label);
}

/******************************************************************
 * INICIO
 ******************************************************************/

window.onload = () => {
  initSidebarToggle();
  initFirestoreListener();
};
