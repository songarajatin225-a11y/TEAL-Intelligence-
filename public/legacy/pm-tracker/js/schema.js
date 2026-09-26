/* ==========================================================================
   schema.js — controlled vocabularies + entity definitions
   Every module's fields, list columns, filters and derived-date mapping are
   declared here. Edit this file to add/rename dropdown values or fields.
   ========================================================================== */
(function (window) {
  'use strict';

  var LPM = window.LPM || (window.LPM = {});

  /* ============================ VOCABULARIES ============================ */

  var V = {
    status: ['Not Started', 'In Progress', 'Waiting for Customer', 'Waiting for Internal Team',
      'Technical Evaluation', 'Sample', 'Demo', 'Trial', 'Qualification',
      'Completed', 'On Hold', 'Cancelled', 'Blocked'],

    priority: ['Critical', 'High', 'Medium', 'Low'],

    probability: ['10', '25', '50', '75', '90', '100'],

    workstream: ['Customer Development', 'Business Development', 'Product Management',
      'Application Engineering', 'Technical Evaluation', 'R&D', 'Laser Diode Localization',
      'Supplier Development', 'Partner Development', 'Internal Coordination', 'Reporting', 'Other'],

    opportunityStage: ['Lead', 'Contacted', 'Discussion', 'Technical Evaluation', 'Sample',
      'Demo', 'Trial', 'Qualification', 'Commercial', 'Order', 'Lost'],

    opportunityType: ['New Business', 'Repeat Business', 'Localization', 'Design-in',
      'Second Source', 'Evaluation Only', 'Other'],

    applicationCategory: ['LiDAR', 'Laser Range Finder', 'Target Designation', 'EO/IR',
      'Laser Warning', 'Directed Energy', 'Optical Communication', 'Datacom', 'Telecom',
      'Fibre Laser Pump', '3D Sensing', 'Industrial Laser', 'Laser Marking', 'Laser Welding',
      'Laser Cutting', 'Semiconductor Equipment', 'Inspection', 'Metrology', 'Medical',
      'Defence Optics', 'Other'],

    industry: ['Defence', 'Aerospace', 'Telecom', 'Datacentre', 'Industrial', 'Medical',
      'Automotive', 'Semiconductor', 'Research / Academia', 'Consumer', 'Other'],

    segment: ['Strategic', 'Key Account', 'Growth', 'Emerging', 'Long Tail'],

    customerType: ['OEM', 'System Integrator', 'Defence Lab', 'PSU', 'Research Institute',
      'Distributor', 'Contract Manufacturer', 'End User', 'Other'],

    laserType: ['Laser Diode', 'Diode Bar', 'Diode Stack', 'VCSEL', 'DFB', 'DBR', 'SLED',
      'Fibre Laser', 'DPSS', 'Solid State', 'Er:Glass', 'CO2', 'Quantum Cascade',
      'Laser Module', 'Other'],

    operatingMode: ['CW', 'Pulsed', 'QCW', 'Modulated', 'CW / Pulsed'],

    package: ['TO-Can', 'TO-56', 'TO-9', 'Butterfly', 'C-Mount', 'CS-Mount', 'HHL', 'DIL',
      'Chip on Submount', 'Bare Die', 'Fibre Coupled Module', 'Custom', 'Other'],

    tec: ['TEC', 'Non-TEC', 'Both'],

    yesNo: ['Yes', 'No'],
    yesNoNa: ['Yes', 'No', 'Not Required'],

    interest: ['High', 'Medium', 'Low', 'Unknown'],
    potential: ['High', 'Medium', 'Low', 'Not Feasible'],
    fit: ['Excellent', 'Good', 'Partial', 'Poor', 'Unknown'],

    qualificationStatus: ['Not Started', 'In Progress', 'Qualified', 'Failed', 'On Hold', 'Not Required'],

    procurementStatus: ['Not Started', 'Enquiry', 'RFQ Received', 'Quotation Submitted',
      'Negotiation', 'PO Received', 'Repeat Order', 'Lost'],

    applicationStatus: ['Identified', 'Under Study', 'Technical Evaluation', 'Solution Proposed',
      'Sample', 'Demo / Trial', 'Qualification', 'Won', 'Dropped', 'On Hold'],

    productStatus: ['Proposed', 'Active', 'Under Evaluation', 'Qualified', 'Not Suitable',
      'Obsolete', 'On Hold'],

    sampleStatus: ['Requested', 'Supplier Confirmation', 'In Transit', 'Received',
      'Internal Testing', 'Customer Demo', 'Customer Trial', 'Feedback', 'Qualification', 'Closed'],

    localizationStage: ['Concept', 'Technology Evaluation', 'Supplier Identification', 'Sample',
      'Characterization', 'Prototype', 'Testing', 'Reliability', 'Qualification',
      'Localization', 'Production'],

    workStatus: ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Blocked', 'Not Required'],

    meetingType: ['Customer Visit', 'Online Meeting', 'Call', 'Technical Discussion',
      'Commercial Discussion', 'Internal Review', 'Conference / Exhibition',
      'Supplier Meeting', 'Other'],

    partnerType: ['Component Supplier', 'Module Supplier', 'Technology Partner',
      'Manufacturing Partner', 'Distributor', 'Research Partner', 'Contract Manufacturer', 'Other'],

    engagement: ['Identified', 'Initial Contact', 'Under Discussion', 'Technical Evaluation',
      'Commercial Discussion', 'Active Partner', 'On Hold', 'Discontinued'],

    ndaStatus: ['Not Required', 'Not Started', 'Under Discussion', 'Signed', 'Expired'],

    importDependency: ['Full Import', 'Partial Import', 'Indigenous', 'Unknown'],

    threatLevel: ['Critical', 'High', 'Medium', 'Low'],

    businessPotential: ['High', 'Medium', 'Low'],

    currency: ['USD', 'EUR', 'GBP', 'INR', 'JPY']
  };

  /* Badge colour mapping — used everywhere a status/priority is shown. */
  var TONE = {
    // statuses
    'Not Started': 'neutral', 'In Progress': 'info', 'Waiting for Customer': 'warning',
    'Waiting for Internal Team': 'warning', 'Technical Evaluation': 'purple', 'Sample': 'purple',
    'Demo': 'purple', 'Trial': 'purple', 'Qualification': 'accent', 'Completed': 'success',
    'On Hold': 'neutral', 'Cancelled': 'neutral', 'Blocked': 'danger',
    // priorities
    'Critical': 'danger', 'High': 'warning', 'Medium': 'info', 'Low': 'neutral',
    // stages
    'Lead': 'neutral', 'Contacted': 'neutral', 'Discussion': 'info', 'Commercial': 'accent',
    'Order': 'success', 'Lost': 'danger', 'Won': 'success', 'Dropped': 'danger',
    // generic
    'Yes': 'success', 'No': 'neutral', 'Not Required': 'neutral',
    'Qualified': 'success', 'Failed': 'danger',
    'Active': 'success', 'Active Partner': 'success', 'Proposed': 'info',
    'Under Evaluation': 'purple', 'Not Suitable': 'danger', 'Obsolete': 'neutral',
    'Excellent': 'success', 'Good': 'success', 'Partial': 'warning', 'Poor': 'danger',
    'Unknown': 'neutral', 'Not Feasible': 'danger',
    'Requested': 'neutral', 'Supplier Confirmation': 'info', 'In Transit': 'info',
    'Received': 'accent', 'Internal Testing': 'purple', 'Customer Demo': 'purple',
    'Customer Trial': 'purple', 'Feedback': 'warning', 'Closed': 'success',
    'PO Received': 'success', 'Repeat Order': 'success', 'Negotiation': 'warning',
    'Production': 'success', 'Localization': 'success', 'Concept': 'neutral',
    'Signed': 'success', 'Expired': 'danger', 'Under Discussion': 'info',
    'Identified': 'neutral', 'Initial Contact': 'neutral', 'Discontinued': 'neutral',
    'Full Import': 'danger', 'Partial Import': 'warning', 'Indigenous': 'success'
  };

  function tone(value) { return TONE[String(value || '').trim()] || 'neutral'; }

  /* ============================ FIELD HELPERS ============================ */

  function f(key, label, type, extra) {
    return Object.assign({ key: key, label: label, type: type || 'text' }, extra || {});
  }
  function sec(title, fields) { return { title: title, fields: fields }; }
  function sel(key, label, options, extra) {
    return Object.assign({ key: key, label: label, type: 'select', options: options }, extra || {});
  }

  var CUSTOMER_LIST = { datalist: 'customers.company' };
  var OWNER_LIST = { datalist: 'activities.owner' };

  /* ============================== ENTITIES ============================== */

  var ENTITIES = {};

  /* ---------------------------- ACTIVITIES ---------------------------- */
  ENTITIES.activities = {
    store: 'activities', page: 'activities.html', codePrefix: 'ACT',
    label: 'Activities', singular: 'Activity', icon: 'activity',
    titleField: 'activity',
    subtitleFields: ['customer', 'workstream'],
    derive: { target: 'targetDate', follow: 'nextActionDate', status: 'status' },
    defaultSort: { key: 'targetDate', dir: 'asc' },
    searchFields: ['code', 'activity', 'customer', 'contact', 'owner', 'application', 'product',
      'currentSituation', 'requiredAction', 'nextAction', 'notes', 'status', 'priority', 'workstream'],
    filters: ['status', 'priority', 'customer', 'workstream', 'owner', 'application', 'dateRange'],
    sections: [
      sec('Activity', [
        f('activity', 'Activity', 'text', { required: true, span: 2, placeholder: 'What needs to happen' }),
        sel('workstream', 'Workstream', V.workstream, { required: true }),
        f('subWorkstream', 'Sub-Workstream', 'text', { datalist: 'activities.subWorkstream' }),
        sel('priority', 'Priority', V.priority, { required: true, default: 'Medium' }),
        sel('status', 'Status', V.status, { required: true, default: 'Not Started' })
      ]),
      sec('Schedule', [
        f('startDate', 'Start Date', 'date'),
        f('targetDate', 'Target Date', 'date'),
        f('nextAction', 'Next Action', 'text'),
        f('nextActionDate', 'Next Action Date', 'date')
      ]),
      sec('Ownership & Context', [
        f('customer', 'Customer', 'text', CUSTOMER_LIST),
        f('contact', 'Contact', 'text'),
        f('owner', 'Internal Owner', 'text', OWNER_LIST),
        f('supportingTeam', 'Supporting Team', 'text'),
        sel('application', 'Application', V.applicationCategory),
        sel('laserType', 'Laser Type', V.laserType),
        f('product', 'Product', 'text', { datalist: 'products.partNumber' }),
        sel('opportunityType', 'Opportunity Type', V.opportunityType),
        sel('currentStage', 'Current Stage', V.opportunityStage)
      ]),
      sec('Execution', [
        f('currentSituation', 'Current Situation', 'textarea', { span: 2 }),
        f('requiredAction', 'Required Action', 'textarea', { span: 2 }),
        f('dependency', 'Dependency', 'text'),
        f('blocker', 'Blocker', 'text'),
        f('expectedOutcome', 'Expected Outcome', 'textarea', { span: 2 })
      ]),
      sec('Business', [
        sel('businessPotential', 'Business Potential', V.businessPotential),
        f('estimatedOpportunityValue', 'Estimated Opportunity Value', 'number', { min: 0, step: '0.01' }),
        sel('probability', 'Probability (%)', V.probability),
        sel('managementSupportRequired', 'Management Support Required', V.yesNo, { default: 'No' })
      ]),
      sec('Notes', [
        f('notes', 'Notes', 'textarea', { span: 2 }),
        f('referenceLink', 'Reference Link', 'url', { span: 2, placeholder: 'https://…' })
      ])
    ],
    columns: [
      { key: 'code', label: 'ID', type: 'code' },
      { key: 'activity', label: 'Activity', type: 'title', primary: true },
      { key: 'customer', label: 'Customer' },
      { key: 'workstream', label: 'Workstream' },
      { key: 'priority', label: 'Priority', type: 'badge' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'targetDate', label: 'Target', type: 'date' },
      { key: '_daysRemaining', label: 'Days Left', type: 'days' },
      { key: 'owner', label: 'Owner' }
    ]
  };

  /* ---------------------------- CUSTOMERS ---------------------------- */
  ENTITIES.customers = {
    store: 'customers', page: 'customers.html', codePrefix: 'CUS',
    label: 'Customers', singular: 'Customer', icon: 'users',
    titleField: 'company',
    subtitleFields: ['industry', 'location'],
    derive: { target: 'expectedClosure', follow: 'nextInteraction', status: 'opportunityStage' },
    defaultSort: { key: 'company', dir: 'asc' },
    searchFields: ['code', 'company', 'industry', 'contactPerson', 'email', 'phone', 'location',
      'application', 'laserRequirement', 'currentSupplier', 'currentPartNumber', 'owner',
      'customerRequirement', 'remarks', 'opportunityStage'],
    filters: ['opportunityStage', 'industry', 'customerType', 'segment', 'owner', 'dateRange'],
    dateFilterField: 'nextInteraction',
    sections: [
      sec('Company', [
        f('company', 'Company', 'text', { required: true, span: 2 }),
        sel('industry', 'Industry', V.industry),
        sel('segment', 'Segment', V.segment),
        sel('customerType', 'Customer Type', V.customerType),
        f('location', 'Location', 'text')
      ]),
      sec('Contact', [
        f('contactPerson', 'Contact Person', 'text'),
        f('designation', 'Designation', 'text'),
        f('email', 'Email', 'email'),
        f('phone', 'Phone', 'tel')
      ]),
      sec('Technical Requirement', [
        sel('application', 'Application', V.applicationCategory),
        f('laserRequirement', 'Laser Requirement', 'textarea', { span: 2 }),
        sel('laserType', 'Laser Type', V.laserType),
        f('wavelength', 'Wavelength', 'text', { placeholder: 'e.g. 1550 nm' }),
        f('power', 'Power', 'text', { placeholder: 'e.g. 10 W' }),
        sel('package', 'Package', V.package),
        f('technicalGap', 'Technical Gap', 'textarea', { span: 2 }),
        f('customerRequirement', 'Customer Requirement', 'textarea', { span: 2 })
      ]),
      sec('Current Supply', [
        f('currentSupplier', 'Current Supplier', 'text'),
        f('currentPartNumber', 'Current Part Number', 'text'),
        f('estimatedAnnualRequirement', 'Estimated Annual Requirement', 'text', { placeholder: 'e.g. 500 pcs / year' }),
        sel('procurementStatus', 'Procurement Status', V.procurementStatus)
      ]),
      sec('Opportunity', [
        f('tealOpportunity', 'TEAL Opportunity', 'textarea', { span: 2 }),
        sel('opportunityStage', 'Opportunity Stage', V.opportunityStage, { default: 'Lead' }),
        f('commercialPotential', 'Commercial Potential (value)', 'number', { min: 0, step: '0.01' }),
        sel('probability', 'Probability (%)', V.probability),
        f('expectedClosure', 'Expected Closure', 'date'),
        f('lastInteraction', 'Last Interaction', 'date'),
        f('nextInteraction', 'Next Interaction', 'date'),
        f('owner', 'Owner', 'text', OWNER_LIST)
      ]),
      sec('Notes', [f('remarks', 'Remarks', 'textarea', { span: 2 })])
    ],
    columns: [
      { key: 'company', label: 'Company', type: 'title', primary: true },
      { key: 'industry', label: 'Industry' },
      { key: 'customerType', label: 'Type' },
      { key: 'application', label: 'Application' },
      { key: 'opportunityStage', label: 'Stage', type: 'badge' },
      { key: '_weighted', label: 'Weighted', type: 'value' },
      { key: 'probability', label: 'Prob.', type: 'percent' },
      { key: 'nextInteraction', label: 'Next Interaction', type: 'date' },
      { key: 'owner', label: 'Owner' }
    ]
  };

  /* --------------------------- APPLICATIONS --------------------------- */
  ENTITIES.applications = {
    store: 'applications', page: 'applications.html', codePrefix: 'APP',
    label: 'Applications', singular: 'Application', icon: 'target',
    titleField: 'application',
    subtitleFields: ['customer', 'industry'],
    derive: { target: 'targetDate', follow: 'targetDate', status: 'applicationStatus' },
    defaultSort: { key: 'targetDate', dir: 'asc' },
    searchFields: ['code', 'application', 'industry', 'customer', 'endProduct', 'laserFunction',
      'laserType', 'wavelength', 'proposedProduct', 'technicalRequirement', 'nextStep', 'remarks'],
    filters: ['applicationStatus', 'application', 'industry', 'customer', 'dateRange'],
    sections: [
      sec('Application', [
        sel('application', 'Application', V.applicationCategory, { required: true }),
        sel('industry', 'Industry', V.industry),
        f('customer', 'Customer', 'text', CUSTOMER_LIST),
        f('endProduct', 'End Product', 'text'),
        f('laserFunction', 'Laser Function', 'textarea', { span: 2 })
      ]),
      sec('Laser Requirement', [
        sel('laserType', 'Laser Type', V.laserType),
        f('wavelength', 'Wavelength', 'text'),
        f('outputPower', 'Output Power', 'text'),
        sel('operatingMode', 'Operating Mode', V.operatingMode),
        sel('package', 'Package', V.package),
        f('beamRequirement', 'Beam Requirement', 'text'),
        f('coolingRequirement', 'Cooling Requirement', 'text'),
        f('driverRequirement', 'Driver Requirement', 'text')
      ]),
      sec('Supply Position', [
        f('currentTechnology', 'Current Technology', 'text'),
        f('currentSupplier', 'Current Supplier', 'text'),
        f('alternativeSupplier', 'Alternative Supplier', 'text'),
        f('existingProduct', 'Existing Product', 'text', { datalist: 'products.partNumber' }),
        f('proposedProduct', 'Proposed Product', 'text', { datalist: 'products.partNumber' })
      ]),
      sec('Requirements & Status', [
        f('technicalRequirement', 'Technical Requirement', 'textarea', { span: 2 }),
        f('qualificationRequirement', 'Qualification Requirement', 'textarea', { span: 2 }),
        sel('applicationStatus', 'Application Status', V.applicationStatus, { default: 'Identified' }),
        sel('customerInterest', 'Customer Interest', V.interest),
        sel('sampleRequired', 'Sample Required', V.yesNo),
        sel('demoRequired', 'Demo Required', V.yesNo),
        sel('trialRequired', 'Trial Required', V.yesNo),
        f('nextStep', 'Next Step', 'text'),
        f('targetDate', 'Target Date', 'date')
      ]),
      sec('Notes', [f('remarks', 'Remarks', 'textarea', { span: 2 })])
    ],
    columns: [
      { key: 'code', label: 'ID', type: 'code' },
      { key: 'application', label: 'Application', type: 'title', primary: true },
      { key: 'customer', label: 'Customer' },
      { key: 'industry', label: 'Industry' },
      { key: 'laserType', label: 'Laser Type' },
      { key: 'wavelength', label: 'Wavelength' },
      { key: 'applicationStatus', label: 'Status', type: 'badge' },
      { key: 'customerInterest', label: 'Interest', type: 'badge' },
      { key: 'targetDate', label: 'Target', type: 'date' }
    ]
  };

  /* ----------------------------- PRODUCTS ----------------------------- */
  ENTITIES.products = {
    store: 'products', page: 'products.html', codePrefix: 'PRD',
    label: 'Products', singular: 'Product', icon: 'box',
    titleField: 'partNumber',
    subtitleFields: ['manufacturer', 'productFamily'],
    derive: { target: null, follow: null, status: 'status' },
    defaultSort: { key: 'partNumber', dir: 'asc' },
    searchFields: ['code', 'partNumber', 'productFamily', 'manufacturer', 'laserType', 'wavelength',
      'power', 'package', 'application', 'targetCustomer', 'currentSupplier', 'remarks', 'status'],
    filters: ['status', 'laserType', 'application', 'qualificationStatus'],
    sections: [
      sec('Identification', [
        f('partNumber', 'Part Number', 'text', { required: true }),
        f('productFamily', 'Product Family', 'text'),
        f('manufacturer', 'Manufacturer', 'text'),
        sel('status', 'Status', V.productStatus, { default: 'Proposed' })
      ]),
      sec('Specification', [
        sel('laserType', 'Laser Type', V.laserType),
        f('wavelength', 'Wavelength', 'text'),
        f('power', 'Power', 'text'),
        sel('package', 'Package', V.package),
        sel('tec', 'TEC / Non-TEC', V.tec),
        sel('mode', 'CW / Pulsed', V.operatingMode)
      ]),
      sec('Market Fit', [
        sel('application', 'Application', V.applicationCategory),
        f('targetCustomer', 'Target Customer', 'text', CUSTOMER_LIST),
        sel('technicalFit', 'Technical Fit', V.fit),
        sel('commercialFit', 'Commercial Fit', V.fit),
        sel('localizationPotential', 'Localization Potential', V.potential)
      ]),
      sec('Commercial', [
        sel('datasheetAvailable', 'Datasheet Available', V.yesNo),
        sel('sampleAvailable', 'Sample Available', V.yesNo),
        sel('pricingAvailable', 'Pricing Available', V.yesNo),
        f('moq', 'MOQ', 'text'),
        f('leadTime', 'Lead Time', 'text'),
        f('currentSupplier', 'Current Supplier', 'text'),
        f('alternativeSupplier', 'Alternative Supplier', 'text'),
        sel('qualificationStatus', 'Qualification Status', V.qualificationStatus)
      ]),
      sec('Notes', [f('remarks', 'Remarks', 'textarea', { span: 2 })])
    ],
    columns: [
      { key: 'partNumber', label: 'Part Number', type: 'title', primary: true },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'laserType', label: 'Laser Type' },
      { key: 'wavelength', label: 'Wavelength' },
      { key: 'power', label: 'Power' },
      { key: 'package', label: 'Package' },
      { key: 'application', label: 'Application' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'localizationPotential', label: 'Localization', type: 'badge' }
    ]
  };

  /* --------------------- LOCALIZATION & R&D --------------------- */
  ENTITIES.localization = {
    store: 'localization', page: 'localization.html', codePrefix: 'LOC',
    label: 'Localization & R&D', singular: 'Project', icon: 'cpu',
    titleField: 'projectName',
    subtitleFields: ['customer', 'application'],
    derive: { target: 'targetCompletion', follow: 'nextActionDate', status: 'currentStatus',
      closed: ['Production', 'Cancelled'] },
    defaultSort: { key: 'targetCompletion', dir: 'asc' },
    pipeline: { field: 'currentStatus', stages: V.localizationStage },
    searchFields: ['code', 'projectName', 'customer', 'endUser', 'application', 'laserDiodeType',
      'wavelength', 'technologySource', 'currentImportedPart', 'keyChallenge', 'nextAction',
      'owner', 'remarks', 'currentStatus'],
    filters: ['currentStatus', 'localizationPotential', 'customer', 'owner', 'dateRange'],
    dateFilterField: 'targetCompletion',
    sections: [
      sec('Project', [
        f('projectName', 'Project Name', 'text', { required: true, span: 2 }),
        f('customer', 'Customer', 'text', CUSTOMER_LIST),
        f('endUser', 'End User', 'text'),
        sel('application', 'Application', V.applicationCategory),
        sel('currentStatus', 'Current Stage', V.localizationStage, { required: true, default: 'Concept' }),
        f('priority', 'Priority', 'select', { options: V.priority, default: 'High' }),
        f('owner', 'Owner', 'text', OWNER_LIST)
      ]),
      sec('Device', [
        sel('laserDiodeType', 'Laser Diode Type', V.laserType),
        f('wavelength', 'Wavelength', 'text'),
        f('power', 'Power', 'text'),
        sel('package', 'Package', V.package),
        f('technologySource', 'Technology Source', 'text'),
        f('currentImportedPart', 'Current Imported Part', 'text'),
        sel('importDependency', 'Import Dependency', V.importDependency),
        sel('localizationPotential', 'Localization Potential', V.potential)
      ]),
      sec('Capability & R&D', [
        f('technologyGap', 'Technology Gap', 'textarea', { span: 2 }),
        f('rdRequirement', 'R&D Requirement', 'textarea', { span: 2 }),
        f('internalCapability', 'Internal Capability', 'textarea', { span: 2 }),
        f('externalPartner', 'External Partner', 'text', { datalist: 'suppliers.company' }),
        f('requiredEquipment', 'Required Equipment', 'text')
      ]),
      sec('Development Status', [
        sel('prototypeStatus', 'Prototype Status', V.workStatus),
        sel('characterizationStatus', 'Characterization Status', V.workStatus),
        sel('testingStatus', 'Testing Status', V.workStatus),
        sel('reliabilityStatus', 'Reliability Status', V.workStatus),
        sel('qualificationStatus', 'Qualification Status', V.qualificationStatus)
      ]),
      sec('Cost & Timeline', [
        f('importedCost', 'Imported Cost', 'number', { min: 0, step: '0.01' }),
        f('targetCost', 'Target Cost', 'number', { min: 0, step: '0.01' }),
        f('expectedLocalizedCost', 'Expected Localized Cost', 'number', { min: 0, step: '0.01' }),
        f('localizationPercent', 'Localization %', 'number', { min: 0, max: 100, step: '1' }),
        f('targetCompletion', 'Target Completion', 'date'),
        f('nextActionDate', 'Next Action Date', 'date')
      ]),
      sec('Execution', [
        f('keyChallenge', 'Key Challenge', 'textarea', { span: 2 }),
        f('nextAction', 'Next Action', 'textarea', { span: 2 }),
        sel('managementSupportRequired', 'Management Support', V.yesNo, { default: 'No' }),
        f('remarks', 'Remarks', 'textarea', { span: 2 })
      ])
    ],
    columns: [
      { key: 'code', label: 'ID', type: 'code' },
      { key: 'projectName', label: 'Project', type: 'title', primary: true },
      { key: 'customer', label: 'Customer' },
      { key: 'laserDiodeType', label: 'Diode Type' },
      { key: 'wavelength', label: 'Wavelength' },
      { key: 'currentStatus', label: 'Stage', type: 'badge' },
      { key: 'localizationPercent', label: 'Local %', type: 'percent' },
      { key: 'targetCompletion', label: 'Target', type: 'date' },
      { key: 'owner', label: 'Owner' }
    ]
  };

  /* ------------------------ SAMPLES / TRIALS ------------------------ */
  ENTITIES.samples = {
    store: 'samples', page: 'samples.html', codePrefix: 'SMP',
    label: 'Samples / Trials', singular: 'Sample', icon: 'package',
    titleField: 'product',
    subtitleFields: ['customer', 'partNumber'],
    derive: { target: 'requiredDate', follow: 'requiredDate', status: 'status' },
    defaultSort: { key: 'requiredDate', dir: 'asc' },
    pipeline: { field: 'sampleStatus', stages: V.sampleStatus },
    searchFields: ['code', 'customer', 'application', 'product', 'partNumber', 'supplier',
      'testResult', 'customerFeedback', 'technicalIssue', 'nextStep', 'owner', 'remarks', 'sampleStatus'],
    filters: ['sampleStatus', 'status', 'customer', 'owner', 'dateRange'],
    dateFilterField: 'requiredDate',
    sections: [
      sec('Request', [
        f('customer', 'Customer', 'text', Object.assign({ required: true }, CUSTOMER_LIST)),
        sel('application', 'Application', V.applicationCategory),
        f('product', 'Product', 'text', { datalist: 'products.partNumber' }),
        f('partNumber', 'Part Number', 'text', { datalist: 'products.partNumber' }),
        f('quantity', 'Quantity', 'number', { min: 0, step: '1' }),
        f('supplier', 'Supplier', 'text', { datalist: 'suppliers.company' }),
        f('requestDate', 'Request Date', 'date'),
        f('requiredDate', 'Required Date', 'date')
      ]),
      sec('Lifecycle', [
        sel('sampleStatus', 'Sample Status', V.sampleStatus, { required: true, default: 'Requested' }),
        sel('status', 'Overall Status', V.status, { default: 'In Progress' }),
        f('dispatchDate', 'Dispatch Date', 'date'),
        f('deliveryDate', 'Delivery Date', 'date'),
        f('demoDate', 'Demo Date', 'date'),
        f('trialDate', 'Trial Date', 'date')
      ]),
      sec('Outcome', [
        f('testResult', 'Test Result', 'textarea', { span: 2 }),
        f('customerFeedback', 'Customer Feedback', 'textarea', { span: 2 }),
        f('technicalIssue', 'Technical Issue', 'textarea', { span: 2 }),
        f('correctiveAction', 'Corrective Action', 'textarea', { span: 2 }),
        f('nextStep', 'Next Step', 'text'),
        f('owner', 'Owner', 'text', OWNER_LIST)
      ]),
      sec('Notes', [f('remarks', 'Remarks', 'textarea', { span: 2 })])
    ],
    columns: [
      { key: 'code', label: 'ID', type: 'code' },
      { key: 'customer', label: 'Customer', type: 'title', primary: true },
      { key: 'product', label: 'Product' },
      { key: 'partNumber', label: 'Part Number' },
      { key: 'quantity', label: 'Qty', type: 'number' },
      { key: 'sampleStatus', label: 'Sample Stage', type: 'badge' },
      { key: 'requiredDate', label: 'Required', type: 'date' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'owner', label: 'Owner' }
    ]
  };

  /* --------------------- MEETINGS & FOLLOW-UPS --------------------- */
  ENTITIES.meetings = {
    store: 'meetings', page: 'meetings.html', codePrefix: 'MTG',
    label: 'Meetings', singular: 'Meeting', icon: 'calendar',
    titleField: 'objective',
    subtitleFields: ['customer', 'meetingType'],
    derive: { target: 'dueDate', follow: 'dueDate', status: 'status' },
    defaultSort: { key: 'meetingDate', dir: 'desc' },
    searchFields: ['code', 'customer', 'contact', 'meetingType', 'objective', 'keyDiscussion',
      'customerRequirement', 'technicalRequirement', 'commercialRequirement', 'decision',
      'actionItem', 'owner', 'remarks', 'status'],
    filters: ['status', 'meetingType', 'customer', 'owner', 'dateRange'],
    dateFilterField: 'meetingDate',
    sections: [
      sec('Meeting', [
        f('meetingDate', 'Meeting Date', 'date', { required: true, default: 'today' }),
        sel('meetingType', 'Meeting Type', V.meetingType, { default: 'Online Meeting' }),
        f('customer', 'Customer', 'text', CUSTOMER_LIST),
        f('contact', 'Contact', 'text'),
        f('objective', 'Objective', 'text', { required: true, span: 2 })
      ]),
      sec('Discussion', [
        f('keyDiscussion', 'Key Discussion', 'textarea', { span: 2 }),
        f('customerRequirement', 'Customer Requirement', 'textarea', { span: 2 }),
        f('technicalRequirement', 'Technical Requirement', 'textarea', { span: 2 }),
        f('commercialRequirement', 'Commercial Requirement', 'textarea', { span: 2 }),
        f('decision', 'Decision', 'textarea', { span: 2 })
      ]),
      sec('Follow-up', [
        f('actionItem', 'Action Item', 'textarea', { span: 2 }),
        f('owner', 'Owner', 'text', OWNER_LIST),
        f('dueDate', 'Due Date', 'date'),
        sel('status', 'Status', V.status, { default: 'In Progress' }),
        f('nextMeeting', 'Next Meeting', 'date'),
        sel('followUpSent', 'Follow-up Sent', V.yesNo, { default: 'No' })
      ]),
      sec('Notes', [f('remarks', 'Remarks', 'textarea', { span: 2 })])
    ],
    columns: [
      { key: 'meetingDate', label: 'Date', type: 'date' },
      { key: 'customer', label: 'Customer', type: 'title', primary: true },
      { key: 'meetingType', label: 'Type' },
      { key: 'objective', label: 'Objective' },
      { key: 'actionItem', label: 'Action Item' },
      { key: 'dueDate', label: 'Due', type: 'date' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'followUpSent', label: 'Follow-up', type: 'badge' },
      { key: 'owner', label: 'Owner' }
    ]
  };

  /* ---------------------- SUPPLIERS / PARTNERS ---------------------- */
  ENTITIES.suppliers = {
    store: 'suppliers', page: 'suppliers.html', codePrefix: 'SUP',
    label: 'Suppliers / Partners', singular: 'Supplier', icon: 'truck',
    titleField: 'company',
    subtitleFields: ['country', 'partnerType'],
    derive: { target: 'nextActionDate', follow: 'nextActionDate', status: 'currentEngagement',
      closed: ['Discontinued'] },
    defaultSort: { key: 'company', dir: 'asc' },
    searchFields: ['code', 'company', 'country', 'partnerType', 'product', 'technology',
      'application', 'contact', 'nextAction', 'owner', 'remarks', 'currentEngagement'],
    filters: ['currentEngagement', 'partnerType', 'country', 'owner', 'dateRange'],
    dateFilterField: 'nextActionDate',
    sections: [
      sec('Company', [
        f('company', 'Company', 'text', { required: true }),
        f('country', 'Country', 'text'),
        sel('partnerType', 'Partner Type', V.partnerType),
        f('contact', 'Contact', 'text'),
        f('product', 'Product', 'text'),
        f('technology', 'Technology', 'text'),
        sel('application', 'Application', V.applicationCategory),
        sel('currentEngagement', 'Current Engagement', V.engagement, { default: 'Identified' })
      ]),
      sec('Engagement Status', [
        sel('ndaStatus', 'NDA Status', V.ndaStatus),
        sel('sampleStatus', 'Sample Status', V.workStatus),
        sel('technicalDiscussion', 'Technical Discussion', V.workStatus),
        sel('pricingDiscussion', 'Pricing Discussion', V.workStatus),
        sel('qualificationStatus', 'Qualification Status', V.qualificationStatus)
      ]),
      sec('Capability', [
        sel('localizationPotential', 'Localization Potential', V.potential),
        f('manufacturingCapability', 'Manufacturing Capability', 'textarea', { span: 2 }),
        sel('indiaSupport', 'India Support', V.yesNo)
      ]),
      sec('Follow-up', [
        f('nextAction', 'Next Action', 'text', { span: 2 }),
        f('nextActionDate', 'Next Action Date', 'date'),
        f('owner', 'Owner', 'text', OWNER_LIST),
        f('remarks', 'Remarks', 'textarea', { span: 2 })
      ])
    ],
    columns: [
      { key: 'company', label: 'Company', type: 'title', primary: true },
      { key: 'country', label: 'Country' },
      { key: 'partnerType', label: 'Partner Type' },
      { key: 'technology', label: 'Technology' },
      { key: 'currentEngagement', label: 'Engagement', type: 'badge' },
      { key: 'ndaStatus', label: 'NDA', type: 'badge' },
      { key: 'localizationPotential', label: 'Localization', type: 'badge' },
      { key: 'nextActionDate', label: 'Next Action', type: 'date' },
      { key: 'owner', label: 'Owner' }
    ]
  };

  /* ------------------------- COMPETITORS ------------------------- */
  ENTITIES.competitors = {
    store: 'competitors', page: 'competitors.html', codePrefix: 'CMP',
    label: 'Competitors', singular: 'Intelligence Entry', icon: 'shield',
    titleField: 'competitor',
    subtitleFields: ['product', 'application'],
    derive: { target: null, follow: null, status: 'threatLevel' },
    defaultSort: { key: 'date', dir: 'desc' },
    searchFields: ['code', 'company', 'competitor', 'product', 'laserTechnology', 'application',
      'customer', 'supplier', 'technologyAdvantage', 'technologyGap', 'marketOpportunity',
      'source', 'actionRequired', 'remarks', 'threatLevel'],
    filters: ['threatLevel', 'application', 'customer', 'dateRange'],
    dateFilterField: 'date',
    sections: [
      sec('Intelligence', [
        f('date', 'Date', 'date', { required: true, default: 'today' }),
        f('competitor', 'Competitor', 'text', { required: true }),
        f('company', 'Company / Group', 'text'),
        f('product', 'Product', 'text'),
        f('laserTechnology', 'Laser Technology', 'text'),
        sel('application', 'Application', V.applicationCategory),
        f('customer', 'Customer', 'text', CUSTOMER_LIST),
        f('supplier', 'Supplier', 'text')
      ]),
      sec('Assessment', [
        f('pricing', 'Pricing', 'text'),
        sel('threatLevel', 'Threat Level', V.threatLevel, { default: 'Medium' }),
        f('technologyAdvantage', 'Technology Advantage', 'textarea', { span: 2 }),
        f('technologyGap', 'Technology Gap', 'textarea', { span: 2 }),
        f('marketOpportunity', 'Market Opportunity', 'textarea', { span: 2 })
      ]),
      sec('Action', [
        f('source', 'Source', 'text'),
        f('actionRequired', 'Action Required', 'textarea', { span: 2 }),
        f('remarks', 'Remarks', 'textarea', { span: 2 })
      ])
    ],
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'competitor', label: 'Competitor', type: 'title', primary: true },
      { key: 'product', label: 'Product' },
      { key: 'laserTechnology', label: 'Technology' },
      { key: 'application', label: 'Application' },
      { key: 'customer', label: 'Customer' },
      { key: 'threatLevel', label: 'Threat', type: 'badge' },
      { key: 'actionRequired', label: 'Action Required' }
    ]
  };

  /* --------------------------- DAILY LOG --------------------------- */
  ENTITIES.dailyLogs = {
    store: 'dailyLogs', page: 'daily-log.html', codePrefix: 'LOG',
    label: 'Daily Log', singular: 'Daily Log', icon: 'clipboard',
    titleField: 'date',
    derive: { target: null, follow: null, status: null },
    defaultSort: { key: 'date', dir: 'desc' },
    searchFields: ['date', 'priority1', 'priority2', 'priority3', 'keyAchievement', 'keyIssue',
      'blocker', 'decisionRequired', 'tomorrowPriority', 'notes'],
    fields: ['date', 'priority1', 'priority2', 'priority3', 'meetings', 'customerCalls',
      'technicalDiscussions', 'rdWork', 'businessDevelopment', 'followUps', 'keyAchievement',
      'keyIssue', 'blocker', 'decisionRequired', 'tomorrowPriority', 'notes']
  };

  /* ------------------------- WEEKLY REVIEW ------------------------- */
  ENTITIES.weeklyReviews = {
    store: 'weeklyReviews', page: 'weekly-review.html', codePrefix: 'WRV',
    label: 'Weekly Review', singular: 'Weekly Review', icon: 'chart',
    titleField: 'weekStart',
    derive: { target: null, follow: null, status: null },
    defaultSort: { key: 'weekStart', dir: 'desc' },
    searchFields: ['weekStart', 'keyAchievements', 'customerProgress', 'newOpportunities',
      'technicalProgress', 'rdProgress', 'localizationProgress', 'samplesDemos',
      'supplierPartnerProgress', 'majorChallenges', 'decisionsRequired', 'nextWeekPriorities'],
    fields: ['weekStart', 'keyAchievements', 'customerProgress', 'newOpportunities',
      'technicalProgress', 'rdProgress', 'localizationProgress', 'samplesDemos',
      'supplierPartnerProgress', 'majorChallenges', 'decisionsRequired', 'nextWeekPriorities']
  };

  /* ---------------------------- NAVIGATION ---------------------------- */

  var NAV = [
    { group: 'Operate', items: [
      { id: 'dashboard', label: 'Dashboard', href: 'dashboard.html', icon: 'grid' },
      { id: 'activities', label: 'Activities', href: 'activities.html', icon: 'activity' },
      { id: 'daily-log', label: 'Daily Log', href: 'daily-log.html', icon: 'clipboard' },
      { id: 'weekly-review', label: 'Weekly Review', href: 'weekly-review.html', icon: 'chart' }
    ] },
    { group: 'Market', items: [
      { id: 'customers', label: 'Customers', href: 'customers.html', icon: 'users' },
      { id: 'meetings', label: 'Meetings', href: 'meetings.html', icon: 'calendar' },
      { id: 'suppliers', label: 'Suppliers / Partners', href: 'suppliers.html', icon: 'truck' },
      { id: 'competitors', label: 'Competitors', href: 'competitors.html', icon: 'shield' }
    ] },
    { group: 'Technical', items: [
      { id: 'applications', label: 'Applications', href: 'applications.html', icon: 'target' },
      { id: 'products', label: 'Products', href: 'products.html', icon: 'box' },
      { id: 'localization', label: 'Localization & R&D', href: 'localization.html', icon: 'cpu' },
      { id: 'samples', label: 'Samples / Trials', href: 'samples.html', icon: 'package' }
    ] },
    { group: 'System', items: [
      { id: 'reports', label: 'Reports', href: 'reports.html', icon: 'file' },
      { id: 'settings', label: 'Settings', href: 'settings.html', icon: 'settings' }
    ] }
  ];

  /* ---------------------------- QUICK ADD ---------------------------- */

  var QUICK_ADD = [
    { entity: 'activities', label: 'New Activity', icon: 'activity' },
    { entity: 'customers', label: 'New Customer', icon: 'users' },
    { entity: 'applications', label: 'New Application', icon: 'target' },
    { entity: 'products', label: 'New Product', icon: 'box' },
    { entity: 'activities', label: 'New Opportunity', icon: 'trend',
      preset: { workstream: 'Business Development', opportunityType: 'New Business',
        currentStage: 'Lead', status: 'In Progress' } },
    { entity: 'localization', label: 'New Localization Project', icon: 'cpu' },
    { entity: 'samples', label: 'New Sample', icon: 'package' },
    { entity: 'meetings', label: 'New Meeting', icon: 'calendar' },
    { entity: 'suppliers', label: 'New Supplier', icon: 'truck' },
    { link: 'daily-log.html', label: 'Daily Log', icon: 'clipboard' }
  ];

  /* --------------------------- Field lookup --------------------------- */

  function fieldList(entityKey) {
    var e = ENTITIES[entityKey];
    if (!e || !e.sections) return [];
    var out = [];
    e.sections.forEach(function (s) { s.fields.forEach(function (fl) { out.push(fl); }); });
    return out;
  }

  function fieldMap(entityKey) {
    var m = {};
    fieldList(entityKey).forEach(function (fl) { m[fl.key] = fl; });
    return m;
  }

  function labelFor(entityKey, key) {
    var fm = fieldMap(entityKey);
    if (fm[key]) return fm[key].label;
    var extra = { code: 'ID', dateAdded: 'Date Added', lastUpdated: 'Last Updated',
      _daysRemaining: 'Days Remaining', _aging: 'Aging (days)', _weighted: 'Weighted Value',
      _overdue: 'Overdue', _followUpDue: 'Follow-up Due' };
    return extra[key] || key;
  }

  LPM.schema = {
    V: V,
    tone: tone,
    entities: ENTITIES,
    nav: NAV,
    quickAdd: QUICK_ADD,
    fieldList: fieldList,
    fieldMap: fieldMap,
    labelFor: labelFor,
    entity: function (k) { return ENTITIES[k]; }
  };
})(window);
