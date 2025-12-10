const axios = require("axios");
const https = require("https");
const { parse } = require("json2csv");
const { COUCHDB_VIEWS, COUCHDB_AUTH } = require("../config");

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const encodeCredentials = (username, password) =>
  Buffer.from(`${username}:${password}`).toString("base64");

const createHeader = (credentials) => ({
  Accept: "application/json",
  Authorization: `Basic ${credentials}`,
});

const parseDateRange = (startDate, endDate) => {
  const startMs = startDate ? new Date(startDate).getTime() : null;
  const endMs = endDate
    ? new Date(`${endDate}T23:59:59.999Z`).getTime()
    : null;
  return {
    startMs: Number.isFinite(startMs) ? startMs : null,
    endMs: Number.isFinite(endMs) ? endMs : null,
  };
};

const filterByReportedDate = (reports, startMs, endMs) =>
  reports.filter((report) => {
    const value = Number(report?.reported_date);
    if (!Number.isFinite(value)) return false;
    if (startMs !== null && value < startMs) return false;
    if (endMs !== null && value > endMs) return false;
    return true;
  });

const fetchReportsFromUrl = async (credentials, couchdbUrl) => {
  try {
    const response = await axios.get(couchdbUrl, {
      headers: createHeader(credentials),
      httpsAgent,
    });
    if (response.status === 200) {
      return response.data.rows.map((row) => row.doc);
    }
    return [];
  } catch (error) {
    console.error(`Error fetching reports: ${error.message}`);
    return [];
  }
};

const flatten = (obj, parent = "", res = {}, allFields = new Set()) => {
  for (const key in obj) {
    const propName = parent ? `${parent}_${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null) {
      flatten(obj[key], propName, res, allFields);
    } else {
      res[propName] = obj[key];
      allFields.add(propName);
    }
  }
  return allFields;
};

const getFilteredReports = async (type, startDate, endDate) => {
  const couchUrl = COUCHDB_VIEWS[type];
  if (!couchUrl) throw new Error("Invalid report type");

  const credentials = encodeCredentials(
    COUCHDB_AUTH.username,
    COUCHDB_AUTH.password
  );

  let reports = await fetchReportsFromUrl(credentials, couchUrl);
  const { startMs, endMs } = parseDateRange(startDate, endDate);
  if (startMs !== null || endMs !== null) {
    reports = filterByReportedDate(reports, startMs, endMs);
  }
  return reports;
};

const buildCsv = (reports) => {
  let allFields = new Set();
  const flattenedReports = reports.map((report) => {
    let flattenedReport = {};
    allFields = flatten(report, "", flattenedReport, allFields);
    return flattenedReport;
  });

  const csvFields = Array.from(allFields);
  const csvOptions = { fields: csvFields };
  const csvData = parse(flattenedReports, csvOptions);
  return csvData;
};

module.exports = {
  getFilteredReports,
  buildCsv,
  COUCHDB_VIEWS,
};

