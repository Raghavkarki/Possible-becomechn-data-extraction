const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const path = require("path");
const { parse } = require("json2csv");

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Function to encode credentials
const encodeCredentials = (username, password) => {
  return Buffer.from(`${username}:${password}`).toString("base64");
};

// Function to create headers
const createHeader = (credentials) => ({
  Accept: "application/json",
  Authorization: `Basic ${credentials}`,
});

// Function to fetch reports from a given URL
const fetchReportsFromUrl = async (credentials, couchdbUrl) => {
  try {
    const response = await axios.get(couchdbUrl, {
      headers: createHeader(credentials),
      httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false }),
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

// Flatten function
const flatten = (obj, parent = "", res = {}, allFields = new Set()) => {
  for (const key in obj) {
    const propName = parent ? `${parent}_${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null) {
      flatten(obj[key], propName, res, allFields);
    } else {
      res[propName] = obj[key];
      allFields.add(propName); // Track unique field
    }
  }
  return allFields;
};

// CouchDB URLs
const COUCHDB_VIEWS = {
  contact: "https://chnbecome.sambhavpossible.org/medic/_design/medic-forms/_view/contact?include_docs=true",
  become: "https://chnbecome.sambhavpossible.org/medic/_design/medic-forms/_view/become?include_docs=true",
  become_condition: "https://chnbecome.sambhavpossible.org/medic/_design/medic-forms/_view/become_condition?include_docs=true",
};

// Route to render main page
app.get("/", async (req, res) => {
  const username = "medic";
  const password = "consul-boilers-hold-lapping-Sargon-diffusing-rarefy";
  const credentials = encodeCredentials(username, password);

  // For display, you can just fetch one type (e.g., become)
  const reports = await fetchReportsFromUrl(credentials, COUCHDB_VIEWS.become);

  res.render("index", {
    totalReports: reports.length,
    reports,
  });
});

// Route to handle data download from any view
app.get("/download/:type", async (req, res) => {
  const { type } = req.params;

  if (!COUCHDB_VIEWS[type]) {
    return res.status(400).send("Invalid report type.");
  }

  const username = "medic";
  const password = "consul-boilers-hold-lapping-Sargon-diffusing-rarefy";
  const credentials = encodeCredentials(username, password);

  const reports = await fetchReportsFromUrl(credentials, COUCHDB_VIEWS[type]);

  if (!reports || reports.length === 0) {
    return res.status(500).send("No reports available for download.");
  }

  try {
    let allFields = new Set();
    const flattenedReports = reports.map((report) => {
      let flattenedReport = {};
      allFields = flatten(report, "", flattenedReport, allFields);
      return flattenedReport;
    });

    const csvFields = Array.from(allFields);
    const csvOptions = { fields: csvFields };
    const csvData = parse(flattenedReports, csvOptions);

    res.header("Content-Type", "text/csv; charset=utf-8");
    res.attachment(`${type}_reports.csv`);
    res.send(Buffer.from("\uFEFF" + csvData, "utf-8")); // BOM for Excel
  } catch (error) {
    console.error("Error generating CSV:", error.message);
    res.status(500).send("An error occurred while generating the CSV file.");
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
