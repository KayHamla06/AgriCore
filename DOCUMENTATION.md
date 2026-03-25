# AgriCore — National Agricultural Monitoring System

## Project Overview

AgriCore is a web-based agricultural monitoring and decision-support system designed for South Africa's farming sector. It serves two user roles — **farmers** and **government officials** — providing real-time performance tracking, livestock and crop management, risk assessment, and district-level analytics.

The platform enables farmers to submit structured agricultural data (soil conditions, livestock records, crop yields, and weather observations) and receive AI-generated insights, performance scores, and actionable recommendations. Government users gain visibility into district-level trends, disease outbreaks, and at-risk farmers.

---

## Technology Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Markup       | HTML5                               |
| Styling      | CSS3 (custom, no frameworks)        |
| Logic        | Vanilla JavaScript (ES6+)           |
| Charts       | Chart.js v4.4.7 (CDN)              |
| Maps         | Leaflet.js v1.9.4 (CDN)            |
| Icons        | Lucide Icons (CDN)                  |
| Font         | Inter (Google Fonts)                |
| Auth         | SessionStorage-based mock auth      |
| Backend      | None (client-side only, mock data)  |

---

## File Structure

```
The Code/
├── assets/
│   └── AgriCore Logo.png         # Application logo
├── css/
│   ├── global.css                # Shared variables, reset, typography, utilities
│   ├── landing.css               # Landing page styles
│   ├── login.css                 # Login page styles
│   ├── signup.css                # Sign-up page styles
│   └── dashboard.css             # Dashboard layout, components, all feature styles
├── js/
│   ├── app.js                    # Core data store, mock data, calculations, intelligence engine
│   ├── landing.js                # Landing page interactions
│   ├── login.js                  # Login form + authentication
│   ├── signup.js                 # Sign-up form handling
│   ├── dashboard.js              # Dashboard interactivity, dynamic rendering, all features
│   └── charts.js                 # Chart.js configurations (farmer, gov, profile, analytics)
├── index.html                    # Landing page
├── login.html                    # Login page
├── signup.html                   # Sign-up page
├── dashboard.html                # Main application (all panels, modals, profile)
└── DOCUMENTATION.md              # This file
```

---

## User Roles & Authentication

### Mock Credentials

| Role       | Email               | Password  |
|------------|---------------------|-----------|
| Farmer     | farmer@agricore.com | farmer123 |
| Government | gov@gov.za          | gov123    |

### Role Differences

- **Farmer**: Sees personal analytics, performance score, upload data form, comparison tools, smart plans, notifications, and map view.
- **Government**: Sees aggregated dashboards, district overview cards, smart alerts, recent farmer data tables, analytics, and the comparison/map tools.

Authentication is handled via `sessionStorage`. On login, user data (name, email, role) is stored. The dashboard reads this on load and renders role-specific content.

---

## Core Data Model (app.js)

All data is stored in-memory as JavaScript objects. There is no backend — the system uses mock data to simulate a production environment.

### Farmer Base Data (`mockFarmers`)

Each farmer has: `id`, `name`, `province`, `district`, `farmSize`, `mainCrop`, `yieldHistory` (6-month array), `status` (improving/declining/stable), `lastUpload`, `performanceScore`, `riskLevel`.

### Extended Data Stores

| Store             | Keys per farmer                                                                                       |
|-------------------|-------------------------------------------------------------------------------------------------------|
| `farmerExtras`    | phone, idNumber, farmName, farmType, employees, registrationDate, gpsCoordinates                      |
| `livestockRecords`| Array of: animalType, total, born, twins, triplets, sold, consumed, young, lastDosed, diseases[], treatment |
| `cropRecords`     | Array of: cropType, areaPlanted, yieldTons, plantingDate, harvestDate                                 |
| `weatherData`     | rainfall, avgTemp, maxTemp, minTemp, humidity, droughtRisk, lastRain, season                          |
| `soilData`        | soilType, irrigation (boolean), irrigationType, waterSource, fencingType, landGradient                |

All stores are merged onto each farmer object during initialization, making `farmer.livestockRecords`, `farmer.cropRecords`, `farmer.weatherData`, and `farmer.soilData` directly accessible.

---

## Calculation Engine (app.js)

### `calculateLivestockGrowthRate(farmer)`
Computes net livestock change from births minus losses (sold + consumed).
- **Returns**: `{ rate, totalBorn, totalLost, netChange, totalAnimals }`
- `rate` = percentage change relative to total animals

### `calculateCropProductivity(farmer)`
Aggregates crop yield data across all crop records.
- **Returns**: `{ avgYieldPerHa, totalArea, totalYield, crops[] }`
- Each crop entry: `{ name, area, yield, yieldPerHa }`

### `calculateRiskScore(farmer)`
Multi-factor risk assessment (0–100 scale).
- **Factors scored**: disease count, livestock decline, yield decline vs 6-month average, drought risk, missing irrigation in dry conditions, stale dosing dates, low performance score
- **Returns**: `{ score, level (Critical/High/Medium/Low), reasons[] }`

### `generateSystemInsights(farmer)`
Rule-based engine producing actionable insight objects.
- **Checks**: livestock growth trends, disease presence, crop performance, weather/drought conditions, irrigation recommendations, performance trajectory, dosing reminders
- **Returns**: Array of `{ type (success/warning/danger/info), icon, text }`

### `getDistrictSummary()`
Groups all farmers by district and computes aggregated metrics.
- **Returns per district**: `{ totalLivestock, totalCrops, totalArea, diseases[], avgScore, avgRisk, farmerCount, decliningCount }`

### `generateSmartAlerts()`
Produces prioritized alert objects for the government dashboard.
- **District-level**: multiple disease types, high average risk, declining farmer counts
- **Individual**: critical risk farmers, reportable diseases (Anthrax, Foot-and-Mouth, etc.)
- **Returns**: Sorted array of `{ type (critical/warning/info), icon, title, message, district }`

---

## Features

### 1. Structured Data Input (Upload Modal)

A multi-tab form that replaces free-text input:

| Tab          | Fields                                                                                              |
|--------------|------------------------------------------------------------------------------------------------------|
| Soil & Farm  | Reporting period, soil type, irrigation (yes/no + type), water source, land gradient, fencing type   |
| Livestock    | Dynamic repeating entries: animal type, counts (total, born, twins, triplets, sold, consumed, young), last dosed date, diseases (multi-select), treatment |
| Crops        | Dynamic repeating entries: crop type, area planted, yield, planting date, harvest date               |
| Weather      | Auto-filled from farmer data: rainfall, temperature, humidity, drought risk, last rain, season       |

- **Tab navigation** with Previous/Next/Submit buttons
- **Dynamic entries**: "Add Animal" / "Add Crop" buttons create new form blocks; each has a remove button
- **Irrigation toggle**: irrigation type field enables/disables based on yes/no selection

### 2. Enhanced Farmer Profile

Six new sections added to the farmer profile panel:

1. **Livestock Breakdown** — Grid of livestock cards showing per-animal stats (totals, births, sold, diseases), growth rate indicator bar
2. **Crop Performance** — Table with yield-per-hectare bars, plus a Chart.js bar chart (yield vs area per crop)
3. **Health & Disease** — Cards per animal showing disease status (diseased in red, healthy in green)
4. **Environmental Data** — 6 data cards: rainfall, temperature, humidity, drought risk, soil type, irrigation status
5. **System Insights** — AI-generated recommendations with color-coded severity (success/warning/danger/info)
6. **Risk Assessment** — Visual risk meter (0–100), severity badge, and itemized risk factor list

### 3. Government District Overview

Aggregated district summary cards showing:
- Total livestock count and crop count
- Total area under cultivation
- Average performance score (visual bar)
- Average risk score
- Disease tags
- Number of declining farmers

### 4. Government Smart Alerts

Prioritized alert list with three severity levels:
- **Critical** (red): Reportable diseases, critically at-risk farmers
- **Warning** (amber): High district-level risk, multiple declining farmers
- **Info** (blue): General district health observations

### 5. Performance Engine

Calculates and displays a 0–100 performance score per farmer based on yield trends, consistency, and historical data.

### 6. Early Warning System

Identifies at-risk farmers using multi-factor analysis. Displayed in the government dashboard with configurable thresholds.

### 7. Smart Plan Generator

Creates actionable improvement plans for farmers based on their current performance, risk factors, and crop/livestock data. Supports plan types: Improvement, Diversification, Emergency, Growth.

### 8. Comparison View

Side-by-side farmer comparison showing yield history charts, performance scores, and key metrics.

### 9. Map View

Leaflet.js-powered map showing farmer locations with markers color-coded by status (improving=green, declining=red, stable=blue). Click markers for farmer details.

### 10. Upload History Timeline

Visual timeline of farmer data uploads with timestamps and summary of reported data.

### 11. Notifications System

Toast-style notifications appear for important events (data submitted, alerts triggered, plan generated).

### 12. Trust Features

Data verification badges and confidence indicators to build user trust in reported metrics.

---

## Dashboard Panels

| Panel ID      | Access       | Description                                        |
|---------------|-------------|----------------------------------------------------|
| farmer-dash   | Farmer       | Personal stats, recent yields, quick actions       |
| gov-dash      | Government   | Aggregated stats, district cards, smart alerts, recent farmers |
| analytics     | Both         | 4 analytics charts (regional, risk, crop, trend)   |
| farmer-profile| Both         | Full farmer profile with all 6 enhanced sections   |
| smart-plans   | Both         | Plan generator and plan history                    |
| comparison    | Both         | Multi-farmer comparison tool                       |
| map-view      | Both         | Geographic farmer distribution                     |
| settings      | Both         | Account preferences                                |

---

## Charts (charts.js)

### Farmer Dashboard Charts
- **Performance Trend** — Line chart of yield/performance over 6 months
- **Yield Overview** — Bar chart of monthly yields

### Government Dashboard Charts
- **Regional Performance** — Bar chart comparing provinces
- **Risk Distribution** — Doughnut chart of risk levels across all farmers
- **Crop Distribution** — Pie chart of main crops
- **Performance Trend** — Line chart of aggregate scores over time

### Profile Charts
- **Performance History** — Line chart (color-coded by farmer status)
- **Yield History** — Bar chart (green for increases, red for decreases)
- **Crop Productivity** — Bar chart showing yield (tons) and area (ha) per crop type

### Analytics Charts
- **Regional Performance** — Horizontal bar by province
- **Risk Distribution** — Doughnut (Critical/High/Medium/Low)
- **Crop Distribution** — Doughnut by main crop type
- **Monthly Trend** — Line chart over 6 months

---

## Styling Architecture (CSS)

### global.css
CSS custom properties (variables), reset, typography scale, utility classes, shared component styles (buttons, cards, badges, form elements).

### dashboard.css
All dashboard-specific styles organized by feature:
- Layout (sidebar, main content, panels)
- Stat cards and data grids
- Modal system (standard + large modal for structured form)
- Form tabs and navigation
- Dynamic entry blocks (livestock, crop)
- Profile sections (livestock grid, crop table, health cards, env grid, insights, risk meter)
- District summary cards
- Smart alerts list
- Timeline, comparison, map container
- Responsive breakpoints (tablet, mobile)

### Page-specific CSS
`landing.css`, `login.css`, `signup.css` — isolated styles for their respective pages.

---

## Script Load Order (dashboard.html)

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<script src="js/app.js"></script>
<script src="js/dashboard.js"></script>
<script src="js/charts.js"></script>
```

Order matters: Chart.js and Leaflet must load before app.js. Lucide must load before dashboard.js (which calls `lucide.createIcons()`). charts.js runs last and uses both Chart.js and AgriCore data.

---

## Public API (AgriCore namespace)

The `app.js` file exposes a global `AgriCore` object with:

```javascript
window.AgriCore = {
  farmers,              // Merged farmer array
  months,               // ['Jan', 'Feb', ... 'Jun']
  livestockRecords,     // Raw livestock data by farmer ID
  cropRecords,          // Raw crop data by farmer ID
  weatherData,          // Raw weather data by farmer ID
  soilData,             // Raw soil data by farmer ID
  getPerformanceDetails(farmer),
  getEarlyWarnings(),
  generateSmartPlan(farmerId, type, budget),
  calculateLivestockGrowthRate(farmer),
  calculateCropProductivity(farmer),
  calculateRiskScore(farmer),
  generateSystemInsights(farmer),
  getDistrictSummary(),
  generateSmartAlerts()
};
```

---

## Setup & Running

1. Clone or copy the `The Code` folder to any location.
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari).
3. Navigate to the login page and use the credentials above.
4. No build step, no server, no dependencies to install — all libraries load via CDN.

> **Note**: An internet connection is required for CDN resources (Chart.js, Leaflet, Lucide, Google Fonts).

---

## Browser Support

Tested with modern evergreen browsers. Uses ES6+ features (arrow functions, template literals, destructuring, optional chaining). No IE11 support.

---

## Future Considerations

- Replace mock data with a real backend API and database
- Add actual weather API integration (e.g., OpenWeatherMap)
- Implement persistent authentication (JWT, OAuth)
- Add data export functionality (CSV, PDF reports)
- Implement real-time notifications via WebSockets
- Add offline support with Service Workers
- Multi-language support (Zulu, Afrikaans, Xhosa)
