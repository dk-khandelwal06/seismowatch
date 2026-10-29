# SeismoWatch

> **Observe the Earth. Understand the Signals.**

SeismoWatch is an earthquake monitoring and statistical anomaly analysis platform focused on the **Indian Subcontinent and Himalayan seismic belt** (latitude 6°N–38°N, longitude 68°E–98°E).

It ingests real-time observations directly from the official United States Geological Survey (USGS) Earthquake API, normalizes and persists catalog records with Drizzle ORM and PostgreSQL, and computes **prospective rolling-window z-scores** to isolate statistical magnitude and frequency outliers without confounding predictive claims.

---

## ⚠️ Critical Scientific Notice

**SeismoWatch does not predict earthquakes, provide advance early warning, or establish that an anomaly forecasts an imminent rupture.**

Earthquakes are non-linear geological phenomena that cannot currently be predicted by any scientific agency or mathematical algorithm. Statistical anomalies identified by this platform are retrospective exploratory signals only.

---

## Core System Architecture

```text
       USGS EARTHQUAKE CATALOG API (GeoJSON)
                         ↓
  SERVER-SIDE DATA ACQUISITION & VALIDATION
  (Sanitization, Coordinate Boundaries, Deduplication)
                         ↓
  POSTGRESQL PERSISTENCE WITH DRIZZLE ORM
  (Idempotent Upserts, Ingestion Run Audits)
                         ↓
  PROSPECTIVE ROLLING-WINDOW STATISTICAL ENGINE
  (Moving Baseline, Sample StdDev, Z-Scores, Frequency Surges)
                         ↓
  SCIENTIFIC OBSERVATORY USER INTERFACE
  (Observatory Clock, Seismic Radar, Geospatial Map, Anomaly Lab)
```

---

## Key Features & Major Pages

1. **Observatory Dashboard (`/`)**:
   - Signature animated scientific **Observatory Clock** with smooth second hand, orbital concentric rings, and dual local/UTC readouts.
   - Polar coordinate **Seismic Radar** projecting real earthquakes onto regional radial rings.
   - Real-time KPI ribbons: Total observations, latest detected event, peak magnitude, and z-score anomaly counts.
   - Interactive Himalayan map preview, magnitude-over-time scatter plot, and 24-hour frequency histogram.
2. **Live Earthquake Catalog (`/earthquakes`)**:
   - Searchable, sortable catalog table with magnitude badges, focal depth, coordinates, and UTC timestamps.
   - Filters for minimum magnitude (M2.0+ to M6.0+), depth ranges, and date boundaries.
   - Dedicated interactive **Earthquake Detail Modal** and CSV export.
3. **Interactive Geospatial Map (`/map`)**:
   - Full-screen Leaflet cartography utilizing CartoDB Positron (light mode) and CartoDB Dark Matter (dark mode).
   - Magnitude-scaled circular epicenter rings, interactive hover tooltips, and detailed click popups.
   - Single-click view reset centering the Himalayan mountain arc.
4. **Anomaly Laboratory (`/analytics`)**:
   - **Interactive Parameter Sliders**: Window size ($N = 10\dots 80$), z-score threshold ($|z| \ge 1.5\dots 4.0\sigma$), and minimum baseline count ($K = 5\dots 25$).
   - **Baseline Comparison Chart**: Displays the prospective rolling mean with upper threshold envelope boundaries ($\mu \pm \text{threshold} \times \sigma$).
   - **Z-Score Timeline**: Plots standardized deviation for each sequential event.
   - **Independent Frequency Analysis**: Identifies 24-hour event clustering swarms independently of magnitude outliers.
   - **Flagged Outliers Register**: Detailed tabular explanation of every anomaly flag.
5. **Historical Explorer (`/history`)**:
   - Gutenberg-Richter magnitude distribution histogram and focal depth stratification chart.
   - Configurable lookback intervals (7 days, 14 days, 30 days) with direct CSV download.
6. **Dedicated Event View (`/earthquakes/[eventId]`)**:
   - Deep-dive view of individual seismic events with tectonic and geodetic attributes.
   - Contextual baseline comparison against surrounding regional events.
7. **Scientific Methodology (`/methodology`)**:
   - Complete documentation of USGS FDSNWS queries, bounding box coordinates, and mathematical formulas.
   - Explanation of prospective baseline rules and catalog completeness limits ($M_c$).
8. **Security, Privacy & System Status (`/security`)**:
   - Live system diagnostics polling `/api/health` for gateway latency, USGS upstream status, and PostgreSQL persistence state.
   - Zero-PII commitment, strict secret isolation policies, and SSRF prevention architecture.

---

## Mathematical Specification: Prospective Rolling Baseline

For an observation $x_i$ occurring at index $i$ in a chronologically ordered sequence:

1. **Prospective Baseline Slice**:
   $$\text{Baseline}_i = [x_{\max(0, i - N)}, \dots, x_{i-1}]$$
   *The observation $x_i$ is strictly excluded from its own baseline calculation.*

2. **Rolling Mean ($\mu$)**:
   $$\mu = \frac{1}{N} \sum_{k=1}^{N} x_k$$

3. **Sample Standard Deviation ($\sigma$)**:
   $$\sigma = \sqrt{\frac{1}{N - 1} \sum_{k=1}^{N} (x_k - \mu)^2}$$

4. **Standardized Z-Score**:
   $$z = \frac{x_i - \mu}{\sigma}$$

- **Zero Variance Safety**: If $\sigma < 0.0001$, $z = 0.0$ to prevent division by zero or `NaN`.
- **Insufficient Baseline Safety**: If the number of prior observations is less than $K_{\min}$ (default 10), the status is marked as `INSUFFICIENT_BASELINE` and $z = \text{null}$.
- **Anomaly Heuristic**: $|z| \ge 2.0\sigma$ flags the observation as a statistical outlier.

---

## Technology Stack

- **Framework**: Next.js 14.2 (App Router with TypeScript)
- **Styling**: Tailwind CSS with custom mission-control palette (deep midnight navy, graphite, warm amber, pale ice blue, ivory)
- **Geospatial & Cartography**: Leaflet & React-Leaflet with CartoDB Positron and Dark Matter tiles
- **Scientific Visualizations**: Recharts
- **Database & ORM**: Drizzle ORM with PostgreSQL (`postgres` client)
- **Icons**: Lucide React
- **Unit & Integration Testing**: Vitest
- **Deployment Platform**: Vercel-compatible serverless architecture

---

## Local Setup & Development

### Prerequisites
- Node.js 18+ or 20+ LTS
- npm 9+ or 10+
- (Optional) PostgreSQL database instance

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/<your-username>/seismowatch.git
cd seismowatch
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
# Optional: PostgreSQL Connection URL
# If left empty, SeismoWatch will transparently report database persistence as BLOCKED
# while continuing to serve real-time live data from the USGS API with in-memory caching.
DATABASE_URL=postgresql://postgres:password@localhost:5432/seismowatch

# Secret token protecting POST /api/ingestion/refresh
INGESTION_SECRET_TOKEN=your_secure_random_token_here
```

### 3. Database Migrations (When PostgreSQL is connected)
Generate and apply migrations:
```bash
npm run db:generate
npm run db:push
```

### 4. Run Unit Tests
```bash
npm test
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial release of SeismoWatch"
   git branch -M main
   git remote add origin https://github.com/<your-username>/seismowatch.git
   git push -u origin main
   ```

2. **Import into Vercel**:
   - In your Vercel Dashboard, click **Add New** → **Project** and select your repository.
   - Under **Storage**, create a **Vercel Postgres** or **Neon Database** instance and attach it to your project. This automatically configures `DATABASE_URL` in your production environment.
   - Set `INGESTION_SECRET_TOKEN` under **Environment Variables**.

3. **Deploy & Migrate**:
   - Deploy the project.
   - Run `npm run db:push` in your build step or via the Vercel CLI to apply the initial migration.
   - Verify health at `https://your-domain.vercel.app/api/health`.

---

## REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Comprehensive system health, USGS latency, and persistence diagnostics |
| `GET` | `/api/earthquakes` | Paginated catalog query with magnitude, depth, and spatial filters |
| `GET` | `/api/earthquakes/[eventId]` | Detailed event telemetry with contextual baseline evaluation |
| `GET` | `/api/analytics/summary` | Aggregate statistical summary, mean magnitude, and peak frequency |
| `GET` | `/api/analytics/timeseries` | Chronological time-series with prospective rolling baseline bounds |
| `GET` | `/api/analytics/anomalies` | Filtered list of observations exceeding the z-score threshold |
| `POST` | `/api/ingestion/refresh` | Protected endpoint triggering fresh catalog fetch and database upsert |

---

## License

Open scientific observation platform under the MIT License. Earthquake catalog data is sourced from the public domain United States Geological Survey (USGS).
