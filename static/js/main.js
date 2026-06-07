let priceChart = null;
let volumeChart = null;

const form = document.getElementById("stock-form");
const symbolInput = document.getElementById("symbol");
const periodSelect = document.getElementById("period");
const submitBtn = document.getElementById("submit-btn");
const errorMsg = document.getElementById("error-msg");
const spinner = document.getElementById("spinner");
const chartsWrapper = document.getElementById("charts-wrapper");
const chartTitle = document.getElementById("chart-title");
const chartMeta = document.getElementById("chart-meta");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const symbol = symbolInput.value.trim().toUpperCase();
  const period = periodSelect.value;
  if (!symbol) return;
  await fetchAndRender(symbol, period);
});

async function fetchAndRender(symbol, period) {
  setLoading(true);
  hideError();
  hideCharts();

  try {
    const res = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}&period=${encodeURIComponent(period)}`);
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || "An unknown error occurred.");
      return;
    }

    renderCharts(data);
  } catch {
    showError("Network error — could not reach the server.");
  } finally {
    setLoading(false);
  }
}

function renderCharts(data) {
  const { symbol, currency, labels, close, volume } = data;

  chartTitle.textContent = symbol;
  chartMeta.textContent = `${currency} · ${labels.length} data points`;

  destroyCharts();

  const priceCtx = document.getElementById("price-chart").getContext("2d");
  priceChart = new Chart(priceCtx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `Close (${currency})`,
        data: close,
        borderColor: "#4f8ef7",
        backgroundColor: "rgba(79, 142, 247, 0.08)",
        borderWidth: 1.5,
        pointRadius: labels.length > 100 ? 0 : 2,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.2,
      }],
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1a1d27",
          borderColor: "#2e3350",
          borderWidth: 1,
          titleColor: "#7f8ea3",
          bodyColor: "#e2e8f0",
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y.toFixed(2)} ${currency}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#7f8ea3",
            maxTicksLimit: 10,
            maxRotation: 0,
          },
          grid: { color: "#2e3350" },
        },
        y: {
          ticks: {
            color: "#7f8ea3",
            callback: (v) => `${v.toFixed(2)}`,
          },
          grid: { color: "#2e3350" },
        },
      },
    },
  });

  const volCtx = document.getElementById("volume-chart").getContext("2d");
  volumeChart = new Chart(volCtx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Volume",
        data: volume,
        backgroundColor: "rgba(79, 142, 247, 0.35)",
        borderColor: "rgba(79, 142, 247, 0.6)",
        borderWidth: 1,
        borderRadius: 2,
      }],
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1a1d27",
          borderColor: "#2e3350",
          borderWidth: 1,
          titleColor: "#7f8ea3",
          bodyColor: "#e2e8f0",
          callbacks: {
            label: (ctx) => ` Vol: ${ctx.parsed.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#7f8ea3",
            maxTicksLimit: 10,
            maxRotation: 0,
          },
          grid: { color: "#2e3350" },
        },
        y: {
          ticks: {
            color: "#7f8ea3",
            callback: (v) => formatVolume(v),
          },
          grid: { color: "#2e3350" },
        },
      },
    },
  });

  chartsWrapper.classList.remove("hidden");
}

function formatVolume(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(0) + "K";
  return v;
}

function destroyCharts() {
  if (priceChart) { priceChart.destroy(); priceChart = null; }
  if (volumeChart) { volumeChart.destroy(); volumeChart = null; }
}

function setLoading(on) {
  submitBtn.disabled = on;
  spinner.classList.toggle("hidden", !on);
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

function hideError() {
  errorMsg.classList.add("hidden");
}

function hideCharts() {
  chartsWrapper.classList.add("hidden");
}
