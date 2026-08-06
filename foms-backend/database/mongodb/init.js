// MongoDB Initialization for FOMS Trends Database

db = db.getSiblingDB('foms_trends_db');

// Create time-series collection for financial trends
db.createCollection("finance_trends", {
  timeseries: {
    timeField: "recordedAt",
    metaField: "metadata",
    granularity: "hours" // Snapshot recorded weekly, so hours is a suitable resolution
  }
});

// Create indexes to optimize queries
db.finance_trends.createIndex({ "metadata.trendType": 1, "recordedAt": -1 });
db.finance_trends.createIndex({ "metadata.clientId": 1, "recordedAt": -1 });



print("MongoDB foms_trends_db initialized successfully.");
