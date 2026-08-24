# Email Threat Platform - UI Development Guide

This document serves as a comprehensive reference for the UI architecture, styling conventions, and component structure of the Email Threat Platform's frontend. Use this guide when modifying existing components, expanding the dashboard, or introducing new UI options.

## 1. Core Layout Architecture

The application uses a **Full-Screen Scroll-Snap Layout** managed inside `App.jsx`. The interface is divided into three primary `100vh` sections:

*   **Section 1: Hero (Welcome)** - Deep Charcoal (`bg-[#0A0A0C]`). Features bold typography and introductory content.
*   **Section 2: Scanner (Upload)** - Electric Violet (`bg-[#4F46E5]`). Houses the drag-and-drop `.eml` file upload zone and interactive demo preset buttons.
*   **Section 3: Analysis / Dashboard** - High Contrast Pure Light (`bg-[#F8FAFC]`). The primary work environment. Conditionally renders either the **Persistent Dashboard** (when idle) or the **Analysis Results** (when an email is processed).

### Shared Navigation
A floating, fixed navigation pill sits at the top of the screen (`fixed top-6`). It utilizes `backdrop-blur-xl bg-white/10` to maintain a glassmorphism effect and uses dynamic progress dots to track the user's current scroll-snap section via Framer Motion's `onViewportEnter`.

---

## 2. Dashboard View (`DashboardView.jsx`)

When no email is actively being analyzed, the app renders the **Tactical Dashboard View**. This acts as a global security operations center (SOC) idle screen.

### Layout & Elements
*   **Glass Wrapper:** The dashboard is encased in a `backdrop-blur-xl bg-white/20 border-white/40` glass container.
*   **Left Navigation Sidebar:** A fixed vertical ribbon containing core navigation icons (`LayoutDashboard`, `AlertTriangle`, `Activity`, `Settings`). Currently, these serve as structural placeholders (tooltips enabled) and can be wired to new React Router views if the app expands.
*   **Header HUD:** Displays platform status ("Global Tactical Dashboard") along with a pulsating green "All Systems Operational" badge.
*   **Grid System:** Uses a 12-column Tailwind grid (`grid-cols-12`).
    *   **Left Column (`col-span-5`):** 
        *   **Telemetry Cards:** Two quick-stat HUDs (Active Nodes, Critical Threats).
        *   **Live Attack Log:** A scrolling table of recent network events. Uses Framer Motion's `<AnimatePresence>` to gracefully slide in new log rows.
    *   **Right Column (`col-span-7`):**
        *   **3D Cyber Globe (`CyberGlobe.jsx`):** A React Three Fiber (`@react-three/fiber`) WebGL canvas rendering a rotating globe with attack arcs. It is strictly for visual topography. *Note: `OrbitControls` zoom is disabled to prevent scroll-trapping the parent container.*

---

## 3. Analysis Results Ecosystem

Once an email is analyzed, Section 3 replaces the Dashboard with the **Analysis Results**. These results are rendered inside a central `GlassCard` and divided into five distinct tabs. 

### Tab Navigation System
The tab menu provides horizontal navigation between deep-dive analytical views:

1.  **Summary & Verdict (`activeView === 'summary'`)**
    *   **`FraudScorePanel`:** Renders the primary 0-100 gauge and risk severity.
    *   **`AIMLThreatPanel`:** Displays AI classification, threat vectors, and confidence metrics.
2.  **Email Content (`activeView === 'content'`)**
    *   **`EmailBodyDissector`:** Safely parses and renders HTML/Text email bodies. Highlights suspicious links and hidden tracking pixels.
    *   **`DeepOSINTPanel`:** Cross-references email contents against known breach databases and open-source intelligence.
3.  **Sender Details (`activeView === 'sender'`)**
    *   **`HeaderPanel`:** Exposes raw SMTP headers, message IDs, and routing metadata.
    *   **`AuthPanel`:** Validates cryptographic signatures (SPF, DKIM, DMARC) with visual pass/fail badges.
4.  **Network & Origin (`activeView === 'network'`)**
    *   **`GraphAttributionPanel`:** A node-based visualization mapping the relationship between the sender, domains, and IPs.
    *   **`MapPanel`:** Integrates `react-leaflet` to draw geographic triangulation of SMTP relay hops.
5.  **Analysis Report (`activeView === 'report'`)**
    *   **`CustodyReportPanel`:** Generates a forensic chain-of-custody log for incident response documentation.

---

## 4. Global Modals & Overlays

The UI utilizes floating modal windows to handle interactions that shouldn't interrupt the user's scrolling context:

*   **`CyberScanOverlay`:** A full-screen, high-tech loading screen that appears while the backend API (`analyzeEmail`) processes a file.
*   **`IOCSearchModal`:** A pop-up dossier for searching Indicators of Compromise (IPs, domains, hashes). Can be triggered globally from the nav bar or contextual buttons within the analysis panels.
*   **`PlaybookModal`:** A slide-out or pop-up documentation viewer outlining standard operating procedures for SOC analysts.

---

## 5. UI Styling Conventions & Best Practices

If you are developing new UI components for this platform, adhere to the following standards:

1.  **Glassmorphism (`<GlassCard>`):** 
    Use the existing `<GlassCard>` wrapper component for panels. It automatically applies `backdrop-blur-xl`, semi-transparent backgrounds, and soft borders. *Warning: Do not nest `backdrop-blur` filters extensively, especially over WebGL canvases (like the 3D Globe), as this causes rendering bugs in WebKit/Blink.*
2.  **Color Palette:**
    *   Critical/Malicious: Red (`#ff4757`, `text-red-600`)
    *   Suspicious/Warning: Amber (`#d97706`, `text-amber-600`)
    *   Clean/Benign: Green (`#059669`, `text-green-600`)
    *   Tech/Info: Blue (`text-blue-600`)
3.  **Animations:**
    *   Use `framer-motion`. 
    *   For entry animations on scroll, use `whileInView={{ opacity: 1, y: 0 }}` on `motion.div`.
    *   Keep transitions smooth (`duration: 0.8, ease: 'easeOut'`).
4.  **Icons:** 
    *   The project exclusively uses `lucide-react`. Ensure stroke widths are consistent (default `w-4 h-4` or `w-5 h-5`).
5.  **Scroll Trapping Prevention:**
    *   If integrating maps (`react-leaflet`), 3D canvases, or code editors, ensure their native scroll-wheel zoom is disabled so the user does not get trapped while navigating the `snap-y` sections.
