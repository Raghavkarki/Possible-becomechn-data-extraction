const pageSize = 10;
let currentPage = 1;
let reports = [];

const els = {
  total: document.getElementById("total-count"),
  status: document.getElementById("status"),
  tbody: document.getElementById("table-body"),
  pagination: document.getElementById("pagination"),
  reportType: document.getElementById("reportType"),
  startDate: document.getElementById("startDate"),
  endDate: document.getElementById("endDate"),
};

const formatDate = (ms) => {
  if (!ms) return "";
  const num = Number(ms);
  if (!Number.isFinite(num)) return "";
  return new Date(num).toLocaleString();
};

const getFilterQuery = () => {
  const params = new URLSearchParams();
  if (els.startDate.value) params.append("startDate", els.startDate.value);
  if (els.endDate.value) params.append("endDate", els.endDate.value);
  const query = params.toString();
  return query ? `?${query}` : "";
};

async function loadReports() {
  const type = els.reportType.value;
  els.status.innerHTML = `<span class="spinner"></span>Loading data...`;
  els.tbody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;
  try {
    const query = getFilterQuery();
    const res = await axios.get(`/data/${type}${query}`);
    reports = res.data.reports || [];
    els.total.textContent = res.data.total || 0;
    currentPage = 1;
    renderPage();
    els.status.textContent = `Showing ${reports.length ? `${startIndex() + 1}-${endIndex()} of ${reports.length}` : "0 results"}`;
  } catch (err) {
    console.error(err);
    els.tbody.innerHTML = `<tr><td colspan="5">Error loading data</td></tr>`;
    els.total.textContent = 0;
    els.status.textContent = "Error loading data";
  }
}

const startIndex = () => (currentPage - 1) * pageSize;
const endIndex = () => Math.min(startIndex() + pageSize, reports.length);

function renderPage() {
  const pageData = reports.slice(startIndex(), endIndex());
  if (!pageData.length) {
    els.tbody.innerHTML = `<tr><td colspan="5">No data</td></tr>`;
    els.pagination.innerHTML = "";
    return;
  }

  els.tbody.innerHTML = pageData
    .map((r) => {
      const id = r._id || "";
      const form = r.form || "";
      const reported = formatDate(r.reported_date);
      const name = (r.contact && r.contact.name) || r.name || "";
      const facility =
        (r.contact && r.contact.parent && r.contact.parent.name) || r.facility || "";
      return `<tr>
        <td>${id}</td>
        <td>${form}</td>
        <td>${reported}</td>
        <td>${name}</td>
        <td>${facility}</td>
      </tr>`;
    })
    .join("");

  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(reports.length / pageSize);
  els.pagination.innerHTML = "";
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "active" : "";
    btn.onclick = () => {
      currentPage = i;
      renderPage();
      els.status.textContent = `Showing ${startIndex() + 1}-${endIndex()} of ${reports.length}`;
    };
    els.pagination.appendChild(btn);
  }
}

function downloadReports(type) {
  const query = getFilterQuery();
  window.location.href = `/download/${type}${query}`;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("reportType").addEventListener("change", loadReports);
  document.getElementById("startDate").addEventListener("change", loadReports);
  document.getElementById("endDate").addEventListener("change", loadReports);
  loadReports();
});

window.loadReports = loadReports;
window.downloadReports = downloadReports;

