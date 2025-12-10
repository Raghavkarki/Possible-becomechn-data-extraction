const express = require("express");
const router = express.Router();
const { getFilteredReports, buildCsv, COUCHDB_VIEWS } = require("../services/reportService");

router.get("/", async (req, res) => {
  try {
    const defaultType = "become";
    const reports = await getFilteredReports(defaultType);
    res.render("index", {
      totalReports: reports.length,
      reports,
    });
  } catch (error) {
    res.status(500).send("Failed to load reports");
  }
});

router.get("/data/:type", async (req, res) => {
  const { type } = req.params;
  const { startDate, endDate } = req.query;

  if (!COUCHDB_VIEWS[type]) {
    return res.status(400).send("Invalid report type.");
  }

  try {
    const reports = await getFilteredReports(type, startDate, endDate);
    res.json({ total: reports.length, reports });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Failed to fetch reports");
  }
});

router.get("/download/:type", async (req, res) => {
  const { type } = req.params;
  const { startDate, endDate } = req.query;

  if (!COUCHDB_VIEWS[type]) {
    return res.status(400).send("Invalid report type.");
  }

  try {
    const reports = await getFilteredReports(type, startDate, endDate);
    if (!reports || reports.length === 0) {
      return res.status(500).send("No reports available for download.");
    }

    const csvData = buildCsv(reports);
    res.header("Content-Type", "text/csv; charset=utf-8");
    res.attachment(`${type}_reports.csv`);
    res.send(Buffer.from("\uFEFF" + csvData, "utf-8"));
  } catch (error) {
    console.error("Error generating CSV:", error.message);
    res.status(500).send("An error occurred while generating the CSV file.");
  }
});

module.exports = router;

