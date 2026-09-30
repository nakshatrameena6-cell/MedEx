/**
 * Centralized Copy Constants
 * Plain-language labels for the MEDEx platform
 */

export const COPY = {
  // Navigation & Page Titles
  nav: {
    districtMap: 'District Map',
    phcCapture: 'Stock Capture',
    riskQueue: 'Risk Queue',
    forecast: 'Demand Forecast',
    transfers: 'Transfers',
    federationConsole: 'Federation Console',
    scenarioSimulator: 'What-if Planner',
    alerts: 'Alerts',
    auditTrail: 'Activity Log',
  },

  // Key Metric Labels (Plain Language)
  metrics: {
    chanceOfRunningOut: 'Chance of running out',
    daysLeft: 'Days left',
    modelAccuracy: 'Model accuracy',
    resilienceScore: 'District Resilience',
    criticalCount: 'Critical Stockouts',
    warningCount: 'Low Stock Watch',
    healthyCount: 'Sufficient Cover',
    participatingNodes: 'State Nodes',
    sparseDataGain: 'Sparse Node Accuracy Boost',
    totalRecords: 'Total Records',
    activeTransfers: 'Active Transfers',
  },

  // Status Labels
  status: {
    critical: 'Critical',
    watch: 'Watch',
    stable: 'Stable',
    active: 'Active',
    inactive: 'Inactive',
    validated: 'Validated',
    unvalidated: 'Unvalidated',
    open: 'Open',
    approved: 'Approved',
    rejected: 'Rejected',
    escalated: 'Escalated',
    closed: 'Closed',
  },

  // Action Labels
  actions: {
    filters: 'Filters',
    reset: 'Reset',
    refresh: 'Refresh',
    runPlanner: 'Run Simulation',
    startRound: 'Start Round',
    recordVoice: 'Record Update',
    takePhoto: 'Scan Photo',
    confirm: 'Confirm Update',
    approve: 'Approve Transfer',
    reject: 'Reject Transfer',
    modify: 'Modify Transfer',
    cancel: 'Cancel',
    viewOnMap: 'View on Map',
    viewForecast: 'View Forecast',
    openTransfers: 'Open Transfers',
  },

  // Headers & Subtitles
  headers: {
    districtMapTitle: 'District Healthcare Map',
    districtMapSubtitle: 'Real-time stock status across facilities and active supply transfers.',
    phcCaptureTitle: 'Stock Entry Workflow',
    phcCaptureSubtitle: 'Frontline inventory reporting via voice message or register scan.',
    riskQueueTitle: 'Stock-Out Risk Queue',
    riskQueueSubtitle: 'Facilities ordered by risk priority, lead time, and population exposure.',
    forecastTitle: 'Demand Forecast',
    forecastSubtitle: 'Medicine demand projections with upper and lower uncertainty corridors.',
    transfersTitle: 'Stock Transfers & Redistribution',
    transfersSubtitle: 'Recommended stock transfer routes to prevent stockouts.',
    federationTitle: 'Federation Console',
    federationSubtitle: 'Collaborative model training across state nodes without raw data sharing.',
    scenarioTitle: 'What-if Emergency Planner',
    scenarioSubtitle: 'Model outbreak surges and stock burn-down without affecting live data.',
    alertsTitle: 'Multilingual Alerts',
    alertsSubtitle: 'Operational alerts with voice note playback.',
    auditTitle: 'Activity Log',
    auditSubtitle: 'Immutable log of stock updates, transfer decisions, and system events.',
  },
};
