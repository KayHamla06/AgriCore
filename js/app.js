/* ============================================
   AgriCore — Shared Utilities & Mock Data Store
   ============================================ */

const AgriCore = (() => {
  'use strict';

  // ===== Mock Farmers Data =====
  const mockFarmers = [
    {
      id: 'F001', name: 'Thabo Molefe', email: 'thabo@agricore.com',
      farmName: 'Sunrise Valley Farm', province: 'Limpopo', district: 'Vhembe',
      farmSize: 45, farmerType: 'Smallholder', mainActivity: 'Crops',
      performanceScore: 87, status: 'improving',
      yieldHistory: [3.1, 3.4, 3.2, 3.5, 3.8, 4.0, 3.7, 4.1, 4.2, 4.0, 4.3, 4.5],
      productionHistory: [120, 135, 128, 142, 155, 160, 148, 165, 170, 162, 175, 182],
      livestock: 45,
      timeline: [
        { date: 'Mar 2026', content: 'Uploaded March yield data — 4.5t/ha' },
        { date: 'Feb 2026', content: 'Performance score increased to 87' },
        { date: 'Jan 2026', content: 'Received irrigation support plan' },
        { date: 'Dec 2025', content: 'Completed training program' },
        { date: 'Nov 2025', content: 'Flagged for follow-up — yield dropped' },
      ]
    },
    {
      id: 'F002', name: 'Nomsa Dlamini', email: 'nomsa@agricore.com',
      farmName: 'Green Hills Estate', province: 'KwaZulu-Natal', district: 'uMgungundlovu',
      farmSize: 120, farmerType: 'Commercial', mainActivity: 'Mixed',
      performanceScore: 92, status: 'improving',
      yieldHistory: [4.0, 4.2, 4.1, 4.3, 4.5, 4.4, 4.6, 4.7, 4.8, 4.6, 4.9, 5.0],
      productionHistory: [200, 215, 210, 225, 235, 230, 245, 250, 260, 248, 265, 275],
      livestock: 230,
      timeline: [
        { date: 'Mar 2026', content: 'Record yield of 5.0t/ha achieved' },
        { date: 'Feb 2026', content: 'Expanded livestock operation' },
        { date: 'Jan 2026', content: 'Performance score: 92 — Top performer' },
      ]
    },
    {
      id: 'F003', name: 'Sipho Nkosi', email: 'sipho@agricore.com',
      farmName: 'Riverside Farm', province: 'Mpumalanga', district: 'Ehlanzeni',
      farmSize: 28, farmerType: 'Subsistence', mainActivity: 'Crops',
      performanceScore: 54, status: 'declining',
      yieldHistory: [3.5, 3.3, 3.1, 3.0, 2.8, 2.9, 2.6, 2.5, 2.7, 2.4, 2.3, 2.1],
      productionHistory: [95, 90, 85, 82, 78, 80, 72, 70, 74, 68, 65, 60],
      livestock: 12,
      timeline: [
        { date: 'Mar 2026', content: 'Yield dropped to 2.1t/ha — critical' },
        { date: 'Feb 2026', content: 'Flagged for follow-up by district office' },
        { date: 'Jan 2026', content: 'Financial aid plan created' },
        { date: 'Dec 2025', content: 'Drought impact assessment completed' },
      ]
    },
    {
      id: 'F004', name: 'Lindiwe Zulu', email: 'lindiwe@agricore.com',
      farmName: 'Golden Harvest', province: 'Free State', district: 'Thabo Mofutsanyane',
      farmSize: 85, farmerType: 'Smallholder', mainActivity: 'Livestock',
      performanceScore: 73, status: 'improving',
      yieldHistory: [2.5, 2.6, 2.8, 2.7, 2.9, 3.0, 3.1, 3.0, 3.2, 3.3, 3.4, 3.5],
      productionHistory: [65, 70, 75, 72, 78, 82, 85, 80, 88, 90, 92, 95],
      livestock: 380,
      timeline: [
        { date: 'Mar 2026', content: 'Livestock herd expanded to 380' },
        { date: 'Feb 2026', content: 'Market access plan initiated' },
      ]
    },
    {
      id: 'F005', name: 'Bongani Mthembu', email: 'bongani@agricore.com',
      farmName: 'Misty Ridge', province: 'Eastern Cape', district: 'Amathole',
      farmSize: 35, farmerType: 'Subsistence', mainActivity: 'Mixed',
      performanceScore: 41, status: 'declining',
      yieldHistory: [2.8, 2.6, 2.5, 2.3, 2.4, 2.2, 2.0, 1.9, 2.1, 1.8, 1.7, 1.6],
      productionHistory: [72, 68, 65, 60, 62, 58, 52, 50, 54, 48, 45, 42],
      livestock: 25,
      timeline: [
        { date: 'Mar 2026', content: 'Critical — performance below threshold' },
        { date: 'Feb 2026', content: 'Comprehensive support plan underway' },
        { date: 'Jan 2026', content: 'Flagged as high-risk farmer' },
      ]
    },
    {
      id: 'F006', name: 'Fatima Patel', email: 'fatima@agricore.com',
      farmName: 'Sunflower Fields', province: 'North West', district: 'Ngaka Modiri Molema',
      farmSize: 200, farmerType: 'Commercial', mainActivity: 'Crops',
      performanceScore: 95, status: 'improving',
      yieldHistory: [4.5, 4.7, 4.6, 4.8, 4.9, 5.0, 5.1, 5.0, 5.2, 5.3, 5.4, 5.5],
      productionHistory: [280, 295, 290, 305, 315, 320, 325, 318, 335, 340, 348, 355],
      livestock: 0,
      timeline: [
        { date: 'Mar 2026', content: 'Top performer in North West province' },
        { date: 'Feb 2026', content: 'New irrigation system installed' },
      ]
    },
    {
      id: 'F007', name: 'Johannes van der Merwe', email: 'johannes@agricore.com',
      farmName: 'Oak Valley', province: 'Western Cape', district: 'Cape Winelands',
      farmSize: 150, farmerType: 'Commercial', mainActivity: 'Mixed',
      performanceScore: 88, status: 'improving',
      yieldHistory: [3.8, 3.9, 4.0, 4.1, 4.0, 4.2, 4.3, 4.4, 4.3, 4.5, 4.6, 4.7],
      productionHistory: [190, 200, 205, 210, 208, 218, 225, 230, 226, 238, 242, 248],
      livestock: 175,
      timeline: [
        { date: 'Mar 2026', content: 'Diversified into wine grapes' },
        { date: 'Feb 2026', content: 'Performance consistently improving' },
      ]
    },
    {
      id: 'F008', name: 'Mpho Kgatlhane', email: 'mpho@agricore.com',
      farmName: 'Baobab Kraal', province: 'Limpopo', district: 'Capricorn',
      farmSize: 18, farmerType: 'Subsistence', mainActivity: 'Livestock',
      performanceScore: 38, status: 'declining',
      yieldHistory: [2.0, 1.9, 1.8, 1.7, 1.8, 1.6, 1.5, 1.4, 1.5, 1.3, 1.2, 1.1],
      productionHistory: [40, 38, 36, 34, 36, 32, 30, 28, 30, 26, 24, 22],
      livestock: 18,
      timeline: [
        { date: 'Mar 2026', content: 'Emergency intervention recommended' },
        { date: 'Feb 2026', content: 'Lost livestock to disease outbreak' },
        { date: 'Jan 2026', content: 'Flagged — critical condition' },
      ]
    }
  ];

  // ===== Mock Plans Data =====
  const mockPlans = [
    { id: 'PLN-001', farmerId: 'F003', farmerName: 'Sipho Nkosi', type: 'Financial Aid', created: '2026-01-15', budget: 25000, status: 'Active', createdBy: 'Dr. Sarah Ndlovu', createdByRole: 'government', objectives: 'Provide emergency financial support for drought recovery', timeline: '6 months', approvalStatus: 'Approved', approvedDate: '2026-01-18' },
    { id: 'PLN-002', farmerId: 'F005', farmerName: 'Bongani Mthembu', type: 'Comprehensive', created: '2026-02-01', budget: 75000, status: 'Active', createdBy: 'Dr. Sarah Ndlovu', createdByRole: 'government', objectives: 'Full farm rehabilitation including soil, livestock, and infrastructure', timeline: '12 months', approvalStatus: 'Approved', approvedDate: '2026-02-05' },
    { id: 'PLN-003', farmerId: 'F001', farmerName: 'Thabo Molefe', type: 'Irrigation Support', created: '2026-01-10', budget: 40000, status: 'Completed', createdBy: 'Dr. Sarah Ndlovu', createdByRole: 'government', objectives: 'Install drip irrigation for vegetable plots', timeline: '6 months', approvalStatus: 'Approved', approvedDate: '2026-01-12' },
    { id: 'PLN-004', farmerId: 'F004', farmerName: 'Lindiwe Zulu', type: 'Market Access', created: '2026-02-20', budget: 15000, status: 'Active', createdBy: 'Dr. Sarah Ndlovu', createdByRole: 'government', objectives: 'Connect farmer to local and regional markets', timeline: '3 months', approvalStatus: 'Approved', approvedDate: '2026-02-22' },
    { id: 'PLN-005', farmerId: 'F008', farmerName: 'Mpho Kgatlhane', type: 'Training Program', created: '2026-03-01', budget: 10000, status: 'Pending', createdBy: 'Dr. Sarah Ndlovu', createdByRole: 'government', objectives: 'Agricultural best practices and soil management training', timeline: '3 months', approvalStatus: 'Pending', approvedDate: null },
    { id: 'PLN-006', farmerId: 'F008', farmerName: 'Mpho Kgatlhane', type: 'Equipment Support', created: '2026-03-10', budget: 55000, status: 'Pending', createdBy: 'Dr. Sarah Ndlovu', createdByRole: 'government', objectives: 'Provide essential farming equipment and tools', timeline: '6 months', approvalStatus: 'Pending', approvedDate: null },
    { id: 'PLN-007', farmerId: 'F001', farmerName: 'Thabo Molefe', type: 'Crop Rotation', created: '2026-02-15', budget: 5000, status: 'In Progress', createdBy: 'Thabo Molefe', createdByRole: 'farmer', objectives: 'Rotate maize and beans to improve soil nitrogen levels', timeline: '6 months', approvalStatus: null, approvedDate: null },
    { id: 'PLN-008', farmerId: 'F001', farmerName: 'Thabo Molefe', type: 'Livestock Expansion', created: '2026-03-01', budget: 20000, status: 'Draft', createdBy: 'Thabo Molefe', createdByRole: 'farmer', objectives: 'Increase goat herd by 10 head for milk production', timeline: '12 months', approvalStatus: null, approvedDate: null },
  ];

  // ===== Mock Users for Login =====
  const mockUsers = [
    { email: 'farmer@agricore.com', password: 'farmer123', role: 'farmer', name: 'Thabo Molefe', id: 'F001', verified: true },
    { email: 'gov@gov.za', password: 'gov123', role: 'government', name: 'Dr. Sarah Ndlovu', id: 'G001', verified: true },
    { email: 'admin@agricore.com', password: 'admin123', role: 'admin', name: 'Josef Admin', id: 'A001', verified: true },
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ===== Livestock Records (per farmer) =====
  const livestockRecords = {
    'F001': [
      { animalType: 'Cattle', total: 25, born: 6, twins: 1, triplets: 0, sold: 3, consumed: 1, young: 8, lastDosed: '2026-02-10', diseases: ['Tick Fever'], treatment: 'Dip treatment applied' },
      { animalType: 'Goats', total: 15, born: 4, twins: 2, triplets: 0, sold: 2, consumed: 0, young: 5, lastDosed: '2026-01-20', diseases: [], treatment: '' },
      { animalType: 'Chickens', total: 5, born: 0, twins: 0, triplets: 0, sold: 0, consumed: 0, young: 0, lastDosed: '2026-03-01', diseases: [], treatment: '' }
    ],
    'F002': [
      { animalType: 'Cattle', total: 120, born: 18, twins: 3, triplets: 0, sold: 12, consumed: 2, young: 25, lastDosed: '2026-03-05', diseases: ['Foot-and-Mouth'], treatment: 'Vaccination completed' },
      { animalType: 'Sheep', total: 80, born: 15, twins: 4, triplets: 1, sold: 8, consumed: 3, young: 18, lastDosed: '2026-02-28', diseases: [], treatment: '' },
      { animalType: 'Goats', total: 30, born: 8, twins: 2, triplets: 0, sold: 4, consumed: 1, young: 10, lastDosed: '2026-02-15', diseases: [], treatment: '' }
    ],
    'F003': [
      { animalType: 'Goats', total: 8, born: 1, twins: 0, triplets: 0, sold: 0, consumed: 1, young: 2, lastDosed: '2025-11-10', diseases: ['Heartwater'], treatment: 'Antibiotics administered' },
      { animalType: 'Chickens', total: 4, born: 0, twins: 0, triplets: 0, sold: 0, consumed: 2, young: 0, lastDosed: '2025-12-01', diseases: ['Newcastle Disease'], treatment: 'Vaccination pending' }
    ],
    'F004': [
      { animalType: 'Cattle', total: 200, born: 30, twins: 5, triplets: 0, sold: 20, consumed: 5, young: 45, lastDosed: '2026-03-10', diseases: [], treatment: '' },
      { animalType: 'Sheep', total: 120, born: 22, twins: 6, triplets: 1, sold: 10, consumed: 4, young: 28, lastDosed: '2026-03-08', diseases: ['Blue Tongue'], treatment: 'Under observation' },
      { animalType: 'Goats', total: 60, born: 12, twins: 3, triplets: 0, sold: 6, consumed: 2, young: 15, lastDosed: '2026-02-20', diseases: [], treatment: '' }
    ],
    'F005': [
      { animalType: 'Cattle', total: 10, born: 1, twins: 0, triplets: 0, sold: 0, consumed: 1, young: 2, lastDosed: '2025-10-15', diseases: ['Lumpy Skin Disease', 'Tick Fever'], treatment: 'Treatment ongoing' },
      { animalType: 'Goats', total: 12, born: 2, twins: 0, triplets: 0, sold: 0, consumed: 2, young: 3, lastDosed: '2025-11-01', diseases: ['Heartwater'], treatment: 'Antibiotics' },
      { animalType: 'Chickens', total: 3, born: 0, twins: 0, triplets: 0, sold: 0, consumed: 1, young: 0, lastDosed: '2025-09-20', diseases: [], treatment: '' }
    ],
    'F006': [],
    'F007': [
      { animalType: 'Cattle', total: 80, born: 10, twins: 2, triplets: 0, sold: 8, consumed: 2, young: 15, lastDosed: '2026-03-12', diseases: [], treatment: '' },
      { animalType: 'Sheep', total: 60, born: 10, twins: 3, triplets: 0, sold: 5, consumed: 2, young: 12, lastDosed: '2026-03-01', diseases: [], treatment: '' },
      { animalType: 'Pigs', total: 35, born: 8, twins: 0, triplets: 0, sold: 6, consumed: 1, young: 10, lastDosed: '2026-02-25', diseases: [], treatment: '' }
    ],
    'F008': [
      { animalType: 'Cattle', total: 8, born: 0, twins: 0, triplets: 0, sold: 0, consumed: 2, young: 1, lastDosed: '2025-08-20', diseases: ['Anthrax', 'Lumpy Skin Disease'], treatment: 'Emergency veterinary care' },
      { animalType: 'Goats', total: 10, born: 1, twins: 0, triplets: 0, sold: 0, consumed: 3, young: 2, lastDosed: '2025-09-15', diseases: ['Heartwater'], treatment: 'Antibiotics administered' }
    ]
  };

  // ===== Crop Records (per farmer) =====
  const cropRecords = {
    'F001': [
      { cropType: 'Maize', areaPlanted: 20, yieldTons: 90, plantingDate: '2025-10-15', harvestDate: '2026-03-10' },
      { cropType: 'Beans', areaPlanted: 10, yieldTons: 15, plantingDate: '2025-11-01', harvestDate: '2026-02-28' },
      { cropType: 'Sunflower', areaPlanted: 15, yieldTons: 22, plantingDate: '2025-10-20', harvestDate: '2026-03-15' }
    ],
    'F002': [
      { cropType: 'Sugarcane', areaPlanted: 50, yieldTons: 250, plantingDate: '2025-09-01', harvestDate: '2026-03-20' },
      { cropType: 'Maize', areaPlanted: 40, yieldTons: 180, plantingDate: '2025-10-10', harvestDate: '2026-03-05' },
      { cropType: 'Soya Beans', areaPlanted: 30, yieldTons: 48, plantingDate: '2025-11-05', harvestDate: '2026-03-12' }
    ],
    'F003': [
      { cropType: 'Maize', areaPlanted: 15, yieldTons: 32, plantingDate: '2025-10-20', harvestDate: '2026-03-01' },
      { cropType: 'Sweet Potato', areaPlanted: 8, yieldTons: 18, plantingDate: '2025-11-10', harvestDate: '2026-02-20' }
    ],
    'F004': [
      { cropType: 'Wheat', areaPlanted: 30, yieldTons: 105, plantingDate: '2025-05-15', harvestDate: '2025-11-20' },
      { cropType: 'Maize', areaPlanted: 20, yieldTons: 70, plantingDate: '2025-10-15', harvestDate: '2026-03-05' }
    ],
    'F005': [
      { cropType: 'Maize', areaPlanted: 15, yieldTons: 24, plantingDate: '2025-10-25', harvestDate: '2026-03-08' },
      { cropType: 'Cabbage', areaPlanted: 5, yieldTons: 8, plantingDate: '2025-09-15', harvestDate: '2026-01-10' }
    ],
    'F006': [
      { cropType: 'Sunflower', areaPlanted: 80, yieldTons: 440, plantingDate: '2025-10-05', harvestDate: '2026-03-18' },
      { cropType: 'Maize', areaPlanted: 60, yieldTons: 330, plantingDate: '2025-10-10', harvestDate: '2026-03-10' },
      { cropType: 'Soya Beans', areaPlanted: 40, yieldTons: 72, plantingDate: '2025-11-01', harvestDate: '2026-03-08' },
      { cropType: 'Wheat', areaPlanted: 20, yieldTons: 80, plantingDate: '2025-05-10', harvestDate: '2025-11-15' }
    ],
    'F007': [
      { cropType: 'Grapes', areaPlanted: 50, yieldTons: 235, plantingDate: '2025-09-01', harvestDate: '2026-02-15' },
      { cropType: 'Wheat', areaPlanted: 40, yieldTons: 160, plantingDate: '2025-05-20', harvestDate: '2025-11-25' },
      { cropType: 'Citrus', areaPlanted: 30, yieldTons: 120, plantingDate: '2025-08-01', harvestDate: '2026-01-20' }
    ],
    'F008': [
      { cropType: 'Maize', areaPlanted: 10, yieldTons: 11, plantingDate: '2025-10-30', harvestDate: '2026-03-05' },
      { cropType: 'Groundnuts', areaPlanted: 5, yieldTons: 4, plantingDate: '2025-11-15', harvestDate: '2026-02-28' }
    ]
  };

  // ===== Weather Data (per farmer location, simulated) =====
  const weatherData = {
    'F001': { rainfall: 480, avgTemp: 26.5, maxTemp: 34, minTemp: 18, humidity: 62, droughtRisk: 'Low', lastRain: '2026-03-18', season: 'Summer' },
    'F002': { rainfall: 820, avgTemp: 23.8, maxTemp: 32, minTemp: 16, humidity: 75, droughtRisk: 'Very Low', lastRain: '2026-03-20', season: 'Summer' },
    'F003': { rainfall: 350, avgTemp: 27.2, maxTemp: 36, minTemp: 19, humidity: 55, droughtRisk: 'Moderate', lastRain: '2026-03-08', season: 'Summer' },
    'F004': { rainfall: 520, avgTemp: 22.0, maxTemp: 30, minTemp: 12, humidity: 58, droughtRisk: 'Low', lastRain: '2026-03-15', season: 'Summer' },
    'F005': { rainfall: 280, avgTemp: 21.5, maxTemp: 29, minTemp: 13, humidity: 50, droughtRisk: 'High', lastRain: '2026-02-22', season: 'Summer' },
    'F006': { rainfall: 410, avgTemp: 25.8, maxTemp: 33, minTemp: 17, humidity: 48, droughtRisk: 'Moderate', lastRain: '2026-03-12', season: 'Summer' },
    'F007': { rainfall: 550, avgTemp: 20.5, maxTemp: 28, minTemp: 11, humidity: 65, droughtRisk: 'Low', lastRain: '2026-03-19', season: 'Summer' },
    'F008': { rainfall: 220, avgTemp: 28.5, maxTemp: 38, minTemp: 20, humidity: 40, droughtRisk: 'Very High', lastRain: '2026-02-05', season: 'Summer' }
  };

  // ===== Soil & Farm Info (per farmer) =====
  const soilData = {
    'F001': { soilType: 'Loamy', irrigation: true, irrigationType: 'Drip', waterSource: 'Borehole', fencingType: 'Wire', landGradient: 'Flat' },
    'F002': { soilType: 'Clay', irrigation: true, irrigationType: 'Sprinkler', waterSource: 'River', fencingType: 'Electric', landGradient: 'Gently Sloping' },
    'F003': { soilType: 'Sandy', irrigation: false, irrigationType: 'None', waterSource: 'Rain-fed', fencingType: 'None', landGradient: 'Hilly' },
    'F004': { soilType: 'Clay Loam', irrigation: true, irrigationType: 'Centre Pivot', waterSource: 'Dam', fencingType: 'Wire', landGradient: 'Flat' },
    'F005': { soilType: 'Sandy Loam', irrigation: false, irrigationType: 'None', waterSource: 'Rain-fed', fencingType: 'Partial Wire', landGradient: 'Steep' },
    'F006': { soilType: 'Loamy', irrigation: true, irrigationType: 'Centre Pivot', waterSource: 'Borehole', fencingType: 'Electric', landGradient: 'Flat' },
    'F007': { soilType: 'Alluvial', irrigation: true, irrigationType: 'Drip', waterSource: 'River', fencingType: 'Electric', landGradient: 'Gently Sloping' },
    'F008': { soilType: 'Sandy', irrigation: false, irrigationType: 'None', waterSource: 'Rain-fed', fencingType: 'None', landGradient: 'Rocky' }
  };

  // ===== Extended Farmer Data =====
  const farmerExtras = {
    'F001': {
      coordinates: { lat: -22.97, lng: 30.45 },
      lastUpdated: '2026-03-20',
      uploadHistory: [
        { date: '2025-10', yield: 4.0, livestock: 40, notes: '' },
        { date: '2025-11', yield: 4.3, livestock: 42, notes: 'Yield recovering' },
        { date: '2025-12', yield: 4.0, livestock: 43, notes: 'Completed training' },
        { date: '2026-01', yield: 4.2, livestock: 43, notes: 'Irrigation support received' },
        { date: '2026-02', yield: 4.3, livestock: 44, notes: 'Score increased' },
        { date: '2026-03', yield: 4.5, livestock: 45, notes: 'Record yield' }
      ]
    },
    'F002': {
      coordinates: { lat: -29.60, lng: 30.38 },
      lastUpdated: '2026-03-18',
      uploadHistory: [
        { date: '2025-11', yield: 4.6, livestock: 220, notes: '' },
        { date: '2025-12', yield: 4.9, livestock: 225, notes: '' },
        { date: '2026-01', yield: 4.8, livestock: 225, notes: '' },
        { date: '2026-02', yield: 4.9, livestock: 228, notes: 'Expanded livestock' },
        { date: '2026-03', yield: 5.0, livestock: 230, notes: 'Record yield' }
      ]
    },
    'F003': {
      coordinates: { lat: -25.47, lng: 31.00 },
      lastUpdated: '2026-03-15',
      uploadHistory: [
        { date: '2025-11', yield: 2.4, livestock: 14, notes: '' },
        { date: '2025-12', yield: 2.3, livestock: 13, notes: 'Drought impact' },
        { date: '2026-01', yield: 2.1, livestock: 12, notes: 'Financial aid received' },
        { date: '2026-02', yield: 2.3, livestock: 12, notes: 'Slight recovery' },
        { date: '2026-03', yield: 2.1, livestock: 12, notes: 'Dropped again' }
      ]
    },
    'F004': {
      coordinates: { lat: -28.73, lng: 28.78 },
      lastUpdated: '2026-03-22',
      uploadHistory: [
        { date: '2025-12', yield: 3.2, livestock: 360, notes: '' },
        { date: '2026-01', yield: 3.3, livestock: 365, notes: '' },
        { date: '2026-02', yield: 3.4, livestock: 372, notes: 'Market access plan' },
        { date: '2026-03', yield: 3.5, livestock: 380, notes: 'Herd expanded' }
      ]
    },
    'F005': {
      coordinates: { lat: -32.88, lng: 27.44 },
      lastUpdated: '2026-02-10',
      uploadHistory: [
        { date: '2025-11', yield: 1.8, livestock: 28, notes: '' },
        { date: '2025-12', yield: 1.7, livestock: 26, notes: 'Declining' },
        { date: '2026-01', yield: 1.6, livestock: 25, notes: 'High risk flagged' },
        { date: '2026-02', yield: 1.6, livestock: 25, notes: 'Support plan underway' }
      ]
    },
    'F006': {
      coordinates: { lat: -25.86, lng: 25.64 },
      lastUpdated: '2026-03-21',
      uploadHistory: [
        { date: '2026-01', yield: 5.2, livestock: 0, notes: '' },
        { date: '2026-02', yield: 5.4, livestock: 0, notes: 'New irrigation' },
        { date: '2026-03', yield: 5.5, livestock: 0, notes: 'Top performer' }
      ]
    },
    'F007': {
      coordinates: { lat: -33.72, lng: 18.96 },
      lastUpdated: '2026-03-19',
      uploadHistory: [
        { date: '2026-01', yield: 4.5, livestock: 170, notes: '' },
        { date: '2026-02', yield: 4.6, livestock: 173, notes: '' },
        { date: '2026-03', yield: 4.7, livestock: 175, notes: 'Wine grapes diversification' }
      ]
    },
    'F008': {
      coordinates: { lat: -23.90, lng: 29.45 },
      lastUpdated: '2026-01-28',
      uploadHistory: [
        { date: '2025-11', yield: 1.3, livestock: 22, notes: '' },
        { date: '2025-12', yield: 1.2, livestock: 20, notes: 'Disease outbreak' },
        { date: '2026-01', yield: 1.1, livestock: 18, notes: 'Emergency intervention needed' }
      ]
    }
  };

  // Merge extended data into farmers
  mockFarmers.forEach(f => {
    if (farmerExtras[f.id]) Object.assign(f, farmerExtras[f.id]);
    f.livestockRecords = livestockRecords[f.id] || [];
    f.cropRecords = cropRecords[f.id] || [];
    f.weatherData = weatherData[f.id] || {};
    f.soilData = soilData[f.id] || {};
  });

  // ===== Utility Functions =====
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function formatCurrency(amount) {
    return 'R ' + Number(amount).toLocaleString('en-ZA');
  }

  function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  function getPerformanceStatus(currentYield, previousYield) {
    if (currentYield > previousYield) {
      return { status: 'improving', label: 'Improving', class: 'badge-success' };
    } else {
      return { status: 'declining', label: 'Declining', class: 'badge-danger' };
    }
  }

  // ===== Session Management =====
  function setCurrentUser(user) {
    sessionStorage.setItem('agricore_user', JSON.stringify(user));
  }

  function getCurrentUser() {
    const data = sessionStorage.getItem('agricore_user');
    return data ? JSON.parse(data) : null;
  }

  function clearCurrentUser() {
    sessionStorage.removeItem('agricore_user');
  }

  function authenticateUser(email, password) {
    return mockUsers.find(u => u.email === email && u.password === password) || null;
  }

  // ===== Toast Notifications =====
  function showToast(message, type) {
    type = type || 'success';
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span class="toast-message">' + escapeHtml(message) + '</span>';
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all .3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ===== Performance Engine =====
  function calculatePerformanceScore(farmer) {
    let score = 50;
    const yields = farmer.yieldHistory;
    const len = yields.length;
    const lastYield = yields[len - 1];
    const prevYield = yields[len - 2];

    // Yield trend (+20 / -15)
    if (lastYield > prevYield) score += 20;
    else if (lastYield < prevYield) score -= 15;

    // Production trend (+15 / -10)
    const prod = farmer.productionHistory;
    if (prod[prod.length - 1] > prod[prod.length - 2]) score += 15;
    else if (prod[prod.length - 1] < prod[prod.length - 2]) score -= 10;

    // 3-month yield trajectory (+10 / -10)
    const recent3 = yields.slice(-3);
    if (recent3[2] >= recent3[0]) score += 10;
    else score -= 10;

    // Active support plan bonus (+5)
    if (mockPlans.some(p => p.farmerId === farmer.id && p.status === 'Active')) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  function getScoreLevel(score) {
    if (score >= 70) return { level: 'good', label: 'Performing Well', color: 'var(--success)', cssClass: 'good' };
    if (score >= 40) return { level: 'stable', label: 'Stable', color: 'var(--warning)', cssClass: 'stable' };
    return { level: 'declining', label: 'Declining', color: 'var(--danger)', cssClass: 'declining' };
  }

  // ===== Early Warning System =====
  function detectWarnings(farmer) {
    const warnings = [];
    const yields = farmer.yieldHistory;
    const lastYield = yields[yields.length - 1];
    const prevYield = yields[yields.length - 2];

    // Yield drop percentage
    if (prevYield > 0) {
      const dropPct = ((prevYield - lastYield) / prevYield) * 100;
      if (dropPct >= 20) {
        warnings.push({ type: 'critical', message: 'Yield dropped ' + Math.round(dropPct) + '%', icon: 'trending-down' });
      } else if (dropPct >= 10) {
        warnings.push({ type: 'warning', message: 'Yield declining (' + Math.round(dropPct) + '% drop)', icon: 'trending-down' });
      }
    }

    // No update in 30+ days
    if (farmer.lastUpdated) {
      const daysSince = Math.floor((new Date('2026-03-24') - new Date(farmer.lastUpdated)) / 86400000);
      if (daysSince > 30) {
        warnings.push({ type: 'warning', message: 'No updates in ' + daysSince + ' days', icon: 'clock' });
      }
    }

    // Production decrease
    const prod = farmer.productionHistory;
    if (prod[prod.length - 1] < prod[prod.length - 2]) {
      warnings.push({ type: 'info', message: 'Production decreased', icon: 'arrow-down' });
    }

    // Critical performance
    const score = calculatePerformanceScore(farmer);
    if (score < 30) {
      warnings.push({ type: 'critical', message: 'Critical performance level (' + score + ')', icon: 'alert-triangle' });
    }

    // Livestock decrease
    if (farmer.livestock < 20 && farmer.mainActivity !== 'Crops') {
      warnings.push({ type: 'warning', message: 'Low livestock count (' + farmer.livestock + ')', icon: 'alert-circle' });
    }

    return warnings;
  }

  // ===== Smart Plan Suggestions =====
  function generatePlanSuggestions(farmer) {
    const suggestions = [];
    const yields = farmer.yieldHistory;
    const lastYield = yields[yields.length - 1];
    const score = calculatePerformanceScore(farmer);
    const warnings = detectWarnings(farmer);

    if (lastYield < 2.5 && farmer.mainActivity !== 'Livestock') {
      suggestions.push({ plan: 'Irrigation Upgrade', reason: 'Low crop yield in dry region' });
    }
    if (lastYield < 3.0 && farmer.mainActivity === 'Crops') {
      suggestions.push({ plan: 'Soil Testing & Analysis', reason: 'Below-average yield' });
    }
    if (score < 40) {
      suggestions.push({ plan: 'Comprehensive Support Package', reason: 'Critical performance score' });
    }
    if (farmer.livestock < 30 && farmer.mainActivity !== 'Crops') {
      suggestions.push({ plan: 'Livestock Recovery Program', reason: 'Low livestock count' });
    }
    if (farmer.farmerType === 'Subsistence') {
      suggestions.push({ plan: 'Training Program', reason: 'Skill development for subsistence farmer' });
    }
    if (score < 60) {
      suggestions.push({ plan: 'Subsidy Application', reason: 'Below-target performance' });
    }
    if (farmer.mainActivity === 'Crops' && lastYield < 3.5) {
      suggestions.push({ plan: 'Seed Quality Assessment', reason: 'Yield below regional average' });
    }
    if (warnings.some(w => w.type === 'critical')) {
      suggestions.push({ plan: 'Emergency Intervention', reason: 'Critical warnings detected' });
    }

    return suggestions;
  }

  // ===== Notifications Generator =====
  function generateNotifications() {
    const notifications = [];
    mockFarmers.forEach(f => {
      const score = calculatePerformanceScore(f);
      const level = getScoreLevel(score);
      const warnings = detectWarnings(f);

      warnings.forEach(w => {
        notifications.push({
          id: 'n-' + f.id + '-' + w.icon,
          farmerId: f.id,
          farmerName: f.name,
          type: w.type,
          message: w.message,
          icon: w.icon,
          time: f.lastUpdated || '2026-03-24'
        });
      });

      if (level.level === 'declining') {
        notifications.push({
          id: 'n-' + f.id + '-score',
          farmerId: f.id,
          farmerName: f.name,
          type: 'critical',
          message: 'Performance score: ' + score + ' — needs attention',
          icon: 'alert-circle',
          time: f.lastUpdated || '2026-03-24'
        });
      }
    });

    const severity = { critical: 0, warning: 1, info: 2 };
    notifications.sort((a, b) => (severity[a.type] || 2) - (severity[b.type] || 2));
    return notifications;
  }

  function getFarmersNeedingAttention() {
    return mockFarmers.filter(f => {
      const score = calculatePerformanceScore(f);
      return score < 50 || detectWarnings(f).some(w => w.type === 'critical' || w.type === 'warning');
    });
  }

  // ===== Livestock Growth Rate =====
  function calculateLivestockGrowthRate(farmer) {
    const records = farmer.livestockRecords || [];
    if (records.length === 0) return { rate: 0, totalBorn: 0, totalLost: 0, netChange: 0 };
    let totalBorn = 0, totalSold = 0, totalConsumed = 0, totalAnimals = 0;
    records.forEach(r => {
      totalBorn += r.born + (r.twins * 2) + (r.triplets * 3);
      totalSold += r.sold;
      totalConsumed += r.consumed;
      totalAnimals += r.total;
    });
    const totalLost = totalSold + totalConsumed;
    const netChange = totalBorn - totalLost;
    const rate = totalAnimals > 0 ? ((netChange / totalAnimals) * 100) : 0;
    return { rate: Math.round(rate * 10) / 10, totalBorn, totalLost, netChange, totalAnimals };
  }

  // ===== Crop Productivity =====
  function calculateCropProductivity(farmer) {
    const records = farmer.cropRecords || [];
    if (records.length === 0) return { avgYieldPerHa: 0, totalArea: 0, totalYield: 0, crops: [] };
    let totalArea = 0, totalYield = 0;
    const crops = records.map(c => {
      const yieldPerHa = c.areaPlanted > 0 ? Math.round((c.yieldTons / c.areaPlanted) * 10) / 10 : 0;
      totalArea += c.areaPlanted;
      totalYield += c.yieldTons;
      return { name: c.cropType, area: c.areaPlanted, yield: c.yieldTons, yieldPerHa };
    });
    const avgYieldPerHa = totalArea > 0 ? Math.round((totalYield / totalArea) * 10) / 10 : 0;
    return { avgYieldPerHa, totalArea, totalYield, crops };
  }

  // ===== Risk Score =====
  function calculateRiskScore(farmer) {
    let risk = 0;
    const reasons = [];

    // Disease factor
    const records = farmer.livestockRecords || [];
    const totalDiseases = records.reduce((sum, r) => sum + r.diseases.length, 0);
    if (totalDiseases >= 3) { risk += 25; reasons.push('Multiple disease outbreaks (' + totalDiseases + ')'); }
    else if (totalDiseases >= 1) { risk += 12; reasons.push('Disease detected (' + totalDiseases + ' type' + (totalDiseases > 1 ? 's' : '') + ')'); }

    // Livestock deaths / losses
    const growth = calculateLivestockGrowthRate(farmer);
    if (growth.netChange < 0) { risk += 15; reasons.push('Livestock numbers declining'); }

    // Yield decline
    const yields = farmer.yieldHistory;
    const lastYield = yields[yields.length - 1];
    const avg3 = (yields[yields.length - 1] + yields[yields.length - 2] + yields[yields.length - 3]) / 3;
    const avg6 = yields.slice(-6).reduce((a, b) => a + b, 0) / 6;
    if (lastYield < avg6 * 0.8) { risk += 20; reasons.push('Yield significantly below 6-month average'); }
    else if (lastYield < avg6 * 0.9) { risk += 10; reasons.push('Yield below 6-month average'); }

    // Drought risk from weather
    const weather = farmer.weatherData || {};
    if (weather.droughtRisk === 'Very High') { risk += 20; reasons.push('Very high drought risk'); }
    else if (weather.droughtRisk === 'High') { risk += 15; reasons.push('High drought risk'); }
    else if (weather.droughtRisk === 'Moderate') { risk += 8; reasons.push('Moderate drought risk'); }

    // No irrigation in dry area
    const soil = farmer.soilData || {};
    if (!soil.irrigation && (weather.droughtRisk === 'High' || weather.droughtRisk === 'Very High')) {
      risk += 10; reasons.push('No irrigation in drought-prone area');
    }

    // Stale dosing dates
    records.forEach(r => {
      if (r.lastDosed) {
        const daysSince = Math.floor((new Date('2026-03-24') - new Date(r.lastDosed)) / 86400000);
        if (daysSince > 90) { risk += 5; reasons.push(r.animalType + ' not dosed in ' + daysSince + ' days'); }
      }
    });

    // Performance score factor
    const score = calculatePerformanceScore(farmer);
    if (score < 30) { risk += 15; reasons.push('Critical performance score (' + score + ')'); }
    else if (score < 50) { risk += 8; reasons.push('Low performance score (' + score + ')'); }

    return { score: Math.min(100, risk), level: risk >= 60 ? 'Critical' : risk >= 40 ? 'High' : risk >= 20 ? 'Medium' : 'Low', reasons };
  }

  // ===== System Insights Generator =====
  function generateSystemInsights(farmer) {
    const insights = [];
    const escape = escapeHtml;
    const growth = calculateLivestockGrowthRate(farmer);
    const cropProd = calculateCropProductivity(farmer);
    const risk = calculateRiskScore(farmer);
    const weather = farmer.weatherData || {};
    const soil = farmer.soilData || {};
    const score = calculatePerformanceScore(farmer);
    const yields = farmer.yieldHistory;
    const lastYield = yields[yields.length - 1];

    // Livestock insights
    if (growth.totalAnimals > 0) {
      if (growth.rate > 5) {
        insights.push({ type: 'success', icon: 'trending-up', text: 'Livestock herd growing at ' + growth.rate + '%. Good breeding performance.' });
      } else if (growth.rate < -5) {
        insights.push({ type: 'danger', icon: 'trending-down', text: 'Livestock herd declining at ' + growth.rate + '%. Review animal health and feed quality.' });
      }
    }

    // Disease insights
    const records = farmer.livestockRecords || [];
    const diseasedAnimals = records.filter(r => r.diseases.length > 0);
    if (diseasedAnimals.length > 0) {
      const diseaseNames = [...new Set(diseasedAnimals.flatMap(r => r.diseases))];
      insights.push({ type: 'warning', icon: 'shield-alert', text: 'Active diseases: ' + diseaseNames.join(', ') + '. Ensure treatment protocols are followed.' });
    }

    // Crop insights
    if (cropProd.crops.length > 0) {
      const bestCrop = cropProd.crops.reduce((a, b) => a.yieldPerHa > b.yieldPerHa ? a : b);
      insights.push({ type: 'info', icon: 'sprout', text: 'Best performing crop: ' + bestCrop.name + ' at ' + bestCrop.yieldPerHa + ' t/ha.' });
      if (cropProd.avgYieldPerHa < 2.5) {
        insights.push({ type: 'warning', icon: 'alert-triangle', text: 'Overall crop productivity is below average (' + cropProd.avgYieldPerHa + ' t/ha). Consider soil testing.' });
      }
    }

    // Weather insights
    if (weather.droughtRisk === 'Very High' || weather.droughtRisk === 'High') {
      insights.push({ type: 'danger', icon: 'cloud-off', text: 'Drought risk is ' + weather.droughtRisk + '. Rainfall only ' + weather.rainfall + 'mm this season.' });
      if (!soil.irrigation) {
        insights.push({ type: 'danger', icon: 'droplets', text: 'No irrigation system detected. Recommend installing water harvesting or drip irrigation.' });
      }
    }

    // Performance trajectory
    if (score >= 80) {
      insights.push({ type: 'success', icon: 'award', text: 'Excellent performance score (' + score + '). This farmer could mentor others in the district.' });
    } else if (score < 40) {
      insights.push({ type: 'danger', icon: 'alert-circle', text: 'Critical performance (' + score + '). Recommend comprehensive support package and regular follow-ups.' });
    }

    // Dosing reminder
    records.forEach(r => {
      if (r.lastDosed) {
        const daysSince = Math.floor((new Date('2026-03-24') - new Date(r.lastDosed)) / 86400000);
        if (daysSince > 60) {
          insights.push({ type: 'warning', icon: 'syringe', text: r.animalType + ' last dosed ' + daysSince + ' days ago. Schedule dosing immediately.' });
        }
      }
    });

    return insights;
  }

  // ===== District Summary (Government) =====
  function getDistrictSummary() {
    const districts = {};
    mockFarmers.forEach(f => {
      const key = f.district;
      if (!districts[key]) {
        districts[key] = { district: key, province: f.province, farmers: [], totalLivestock: 0, totalCrops: 0, totalArea: 0, diseases: [], scores: [], riskScores: [] };
      }
      const d = districts[key];
      d.farmers.push(f);
      d.totalLivestock += (f.livestockRecords || []).reduce((sum, r) => sum + r.total, 0);
      d.totalCrops += (f.cropRecords || []).reduce((sum, r) => sum + r.yieldTons, 0);
      d.totalArea += f.farmSize;
      (f.livestockRecords || []).forEach(r => {
        r.diseases.forEach(dis => { if (!d.diseases.includes(dis)) d.diseases.push(dis); });
      });
      d.scores.push(calculatePerformanceScore(f));
      d.riskScores.push(calculateRiskScore(f).score);
    });

    return Object.values(districts).map(d => {
      const avgScore = Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length);
      const avgRisk = Math.round(d.riskScores.reduce((a, b) => a + b, 0) / d.riskScores.length);
      const declining = d.farmers.filter(f => calculatePerformanceScore(f) < 50).length;
      return {
        ...d,
        avgScore,
        avgRisk,
        farmerCount: d.farmers.length,
        decliningCount: declining
      };
    });
  }

  // ===== Smart Alerts Generator =====
  function generateSmartAlerts() {
    const alerts = [];
    const districtSummaries = getDistrictSummary();

    // District-level alerts
    districtSummaries.forEach(d => {
      if (d.diseases.length >= 2) {
        alerts.push({ type: 'critical', icon: 'shield-alert', message: 'Multiple diseases in ' + d.district + ': ' + d.diseases.join(', '), district: d.district });
      }
      if (d.avgRisk >= 50) {
        alerts.push({ type: 'critical', icon: 'alert-triangle', message: 'High average risk score in ' + d.district + ' (' + d.avgRisk + ')', district: d.district });
      }
      if (d.decliningCount > 0) {
        alerts.push({ type: 'warning', icon: 'users', message: d.decliningCount + ' farmer(s) declining in ' + d.district, district: d.district });
      }
    });

    // Individual farmer alerts
    mockFarmers.forEach(f => {
      const risk = calculateRiskScore(f);
      if (risk.score >= 60) {
        alerts.push({ type: 'critical', icon: 'alert-circle', message: f.name + ': Critical risk (' + risk.score + ') — ' + risk.reasons[0], district: f.district });
      }
      const records = f.livestockRecords || [];
      records.forEach(r => {
        if (r.diseases.includes('Anthrax') || r.diseases.includes('Foot-and-Mouth')) {
          alerts.push({ type: 'critical', icon: 'bug', message: 'Reportable disease (' + r.diseases.join(', ') + ') at ' + f.farmName + ', ' + f.district, district: f.district });
        }
      });
    });

    const severity = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => (severity[a.type] || 2) - (severity[b.type] || 2));
    return alerts;
  }

  // ===== Secure API Fetch Utility =====
  // Wraps fetch with auth headers, error handling, and friendly user messages.
  // Never exposes raw errors to the user.
  var API_BASE = window.AGRICORE_API_BASE || '/api';

  function apiFetch(path, options) {
    options = options || {};
    var user = getCurrentUser();
    var headers = Object.assign({
      'Content-Type': 'application/json',
    }, options.headers || {});

    if (user && user.token) {
      headers['Authorization'] = 'Bearer ' + user.token;
    }

    return fetch(API_BASE + path, Object.assign({}, options, { headers: headers }))
      .then(function (res) {
        if (res.status === 401 && user && user.token) {
          clearCurrentUser();
          window.location.href = '/auth/login';
          return { success: false, error: 'Session expired. Please log in again.' };
        }
        return res.json();
      })
      .catch(function () {
        return { success: false, error: 'Network error. Please check your connection.' };
      });
  }

  function apiGet(path) {
    return apiFetch(path, { method: 'GET' });
  }

  function apiPost(path, body) {
    return apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
  }

  function apiPut(path, body) {
    return apiFetch(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  function apiDelete(path) {
    return apiFetch(path, { method: 'DELETE' });
  }

  function apiPatch(path, body) {
    return apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) });
  }

  // ===== UI State Helpers (Loading / Error / Empty) =====
  function showLoading(container) {
    if (!container) return;
    container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading...</p></div>';
  }

  function showError(container, message) {
    if (!container) return;
    container.innerHTML = '<div class="error-state"><p>' + escapeHtml(message || 'Something went wrong. Please try again.') + '</p></div>';
  }

  function showEmpty(container, message) {
    if (!container) return;
    container.innerHTML = '<div class="empty-state"><p>' + escapeHtml(message || 'No data available.') + '</p></div>';
  }

  // ===== Public API =====
  return {
    API_URL: API_BASE,
    mockFarmers,
    mockPlans,
    mockUsers,
    months,
    livestockRecords,
    cropRecords,
    weatherData,
    soilData,
    isValidEmail,
    escapeHtml,
    formatCurrency,
    getInitials,
    getPerformanceStatus,
    setCurrentUser,
    getCurrentUser,
    clearCurrentUser,
    authenticateUser,
    showToast,
    apiGet,
    apiPost,
    apiPut,
    apiPatch,
    apiDelete,
    showLoading,
    showError,
    showEmpty,
    calculatePerformanceScore,
    getScoreLevel,
    detectWarnings,
    generatePlanSuggestions,
    generateNotifications,
    getFarmersNeedingAttention,
    calculateLivestockGrowthRate,
    calculateCropProductivity,
    calculateRiskScore,
    generateSystemInsights,
    getDistrictSummary,
    generateSmartAlerts
  };
})();
