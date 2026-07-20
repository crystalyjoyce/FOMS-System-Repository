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

// Seed sample data for testing trends if needed
db.finance_trends.insertMany([
  {
    "recordedAt": new Date("2026-07-06T00:00:00Z"),
    "metadata": {
      "trendType": "weekly_collection",
      "clientId": "ALL_CLIENTS"
    },
    "totalOutstanding": 520000.00,
    "overdueInvoiceCount": 12,
    "collectedAmount": 150000.00,
    "averageCollectionDays": 38
  },
  {
    "recordedAt": new Date("2026-07-13T00:00:00Z"),
    "metadata": {
      "trendType": "weekly_collection",
      "clientId": "ALL_CLIENTS"
    },
    "totalOutstanding": 480000.00,
    "overdueInvoiceCount": 10,
    "collectedAmount": 180000.00,
    "averageCollectionDays": 36
  },
  {
    "recordedAt": new Date("2026-07-20T00:00:00Z"),
    "metadata": {
      "trendType": "weekly_collection",
      "clientId": "ALL_CLIENTS"
    },
    "totalOutstanding": 435000.00,
    "overdueInvoiceCount": 8,
    "collectedAmount": 210000.00,
    "averageCollectionDays": 34
  }
]);

print("MongoDB foms_trends_db initialized successfully.");
