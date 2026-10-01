/**
 * Centralized Copy Constants
 * Plain-language labels for the MEDEx platform
 */

export const COPY = {
  // Navigation & Page Titles
  nav: {
    districtMap: 'District Map',
    phcCapture: 'Record Stock',
    riskQueue: 'Low Stock Alerts',
    forecast: 'Demand Forecast',
    transfers: 'Stock Transfers',
    federationConsole: 'Network Learning',
    scenarioSimulator: 'What-If Planner',
    alerts: 'Alerts',
    auditTrail: 'Activity History',
  },

  // Key Metric Labels (Plain Language)
  metrics: {
    chanceOfRunningOut: 'Chance of running out',
    daysLeft: 'Days of stock left',
    modelAccuracy: 'Forecast accuracy',
    resilienceScore: 'District supply health',
    criticalCount: 'Critical stockouts',
    warningCount: 'Low stock watch',
    healthyCount: 'Sufficient stock',
    participatingNodes: 'Connected states',
    sparseDataGain: 'Rural accuracy boost',
    totalRecords: 'Total entries',
    activeTransfers: 'Active transfers',
  },

  // Status Labels
  status: {
    critical: 'Critical',
    watch: 'Low Stock',
    stable: 'Stable',
    active: 'Active',
    inactive: 'Inactive',
    validated: 'Confirmed',
    unvalidated: 'Pending Check',
    open: 'Open',
    approved: 'Approved',
    rejected: 'Declined',
    escalated: 'Escalated',
    closed: 'Completed',
  },

  // Action Labels
  actions: {
    filters: 'Filter',
    reset: 'Reset',
    refresh: 'Refresh',
    runPlanner: 'Run Simulation',
    startRound: 'Update Model',
    recordVoice: 'Record Voice Note',
    takePhoto: 'Scan Register',
    confirm: 'Save Changes',
    approve: 'Approve',
    reject: 'Decline',
    modify: 'Edit Amount',
    cancel: 'Cancel',
    viewOnMap: 'View on Map',
    viewForecast: 'View Forecast',
    openTransfers: 'Open Transfers',
  },

  // Headers & Subtitles
  headers: {
    districtMapTitle: 'District Map',
    districtMapSubtitle: 'Current medicine stock and active deliveries across all health centres.',
    phcCaptureTitle: 'Record Medicine Stock',
    phcCaptureSubtitle: 'Update your medicine counts by voice message or by scanning your register.',
    riskQueueTitle: 'Low Stock Alerts',
    riskQueueSubtitle: 'Health centres that are running out of medicines soonest.',
    forecastTitle: 'Medicine Demand Forecast',
    forecastSubtitle: 'Expected medicine usage over the next 4 weeks based on weather and illnesses.',
    transfersTitle: 'Stock Transfers',
    transfersSubtitle: 'Move extra medicine from well-stocked centres to centres that are running low.',
    federationTitle: 'Network Learning',
    federationSubtitle: 'Improves forecast accuracy across state health centres while keeping patient data private.',
    scenarioTitle: 'What-If Emergency Planner',
    scenarioSubtitle: 'Test how disease outbreaks or delivery delays affect medicine stock, without changing real data.',
    alertsTitle: 'Alerts & Messages',
    alertsSubtitle: 'Important notifications about low medicine stock and urgent deliveries.',
    auditTitle: 'Activity History',
    auditSubtitle: 'A record of all stock updates, approved transfers, and system actions.',
  },
};
