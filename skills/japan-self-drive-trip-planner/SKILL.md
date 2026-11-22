---
name: japan-self-drive-trip-planner
description: "Plan Japan self-drive trips to the full WeChat-shareable interactive web app specification — schedule feasibility & interactive timeline simulator, official highway congestion & road-closure risk analysis, novice-safe one-tap Google Maps navigation with anti-trap route verification, scenic drive & SA/PA specialty stops, 3 curated restaurants with 9+ real photos & 9 real reviews, high-DPI WeChat summary poster, and public GitHub Pages deployment. Use whenever the user asks to plan a road trip, self-drive itinerary, travel schedule, or says 按照老规格/自驾攻略模板规划行程."
---

# Japan Self-Drive Trip Planner (Full Interactive & WeChat-Shareable Spec)

Follow this end-to-end specification whenever planning a self-drive trip for the user.

## 1. Defaults & User Profile (Override When Provided)
- **Language**: Write all user-facing prose, web UI, posters, and WeChat copy in **Simplified Chinese (`zh-CN`)**, while preserving official Japanese place, road, IC/JCT, SA/PA, and restaurant names so the driver can match road signs and navigation screens.
- **Default Driver Context** (confirm or override if the user specifies otherwise):
  - Typical starting area: near **滝不動駅 (Chiba)** unless another origin is given.
  - Driving style: ~30,000 km experience, relies strictly on turn-by-turn navigation ("跟着导航开车"), prefers wide dual-lane roads, avoids narrow alleys, steep blind descents, confusing highway junctions, and unnecessary night mountain driving.
- **Ask or Confirm Missing Inputs Only If Blocking**: Date(s), departure/pickup time anchor, pickup location(s), destination/lodging, group size/luggage constraints, scenic/food preferences.

---

## 2. Mandatory Pre-Planning Research & Fact-Checking
Before designing the timetable, verify real-world conditions via web search:
1. **Weather & Daylight**: Forecast for each day (precipitation %, Mt. Fuji / scenic visibility), exact **sunset time**, and closing times (`最終入場` / `閉園`) of key outdoor spots.
2. **Official Highway Traffic & Construction**:
   - Check NEXCO (East/Central/West), Shutoko, and prefectural road announcements for the exact date(s): hourly congestion forecast (km & peak hours), public holiday ETC discount exclusions, full/lane road closures, seasonal winter closures (`冬季通行止め`), and long-term construction zones.
   - Check toll payment constraints: **ETC-only ramps (ETC専用)** vs **cash/ETCX-only toll roads** (where standard ETC does not work) and calculate exact cash needed.
   - For winter/mountain trips (Nov–Apr), check studless tire (`スタッドレスタイヤ`) and chain regulation (`チェーン規制`) zones.
3. **Pickup & Parking Verification**:
   - Check curb/parking capacity at pickup hotels/stations; identify the nearest large flat backup parking lot (capacity, opening time, fee, height limit).
   - For sightseeing towns with narrow alleys, always target a verified wide, flat, attendant-guided perimeter parking lot — **never** route directly to a temple hall or narrow alley landmark.
4. **Scenic Routes & Highway SA/PA Specialties (名物)**:
   - Evaluate scenic toll/skyline drives (viewpoints with free parking, toll payment method, safest downhill exit + engine braking reminder) AND prepare a **zero-mountain-road highway backup** for fog, snow, wind, or fatigue.
   - Identify notable SA/PA food specialties along the exact direction (`下り` / `上り`) that fit naturally without detours.
5. **Dining Research (3 Curated Picks)**:
   - Select **3 distinct, verified-open restaurants** for the target meal (verify regular closing day `定休日` AND holiday schedule for the exact date, business hours & `L.O.`, distance/parking/walkability from lodging, phone reservation or mobile queue URL).
   - Gather **at least 3 real photos per restaurant (≥ 9 photos total)** plus scenic/SA photos, and **3 real diner reviews per restaurant (9 reviews total)** with reviewer name/platform and actionable takeaways.
   - Download all images locally into that trip's `img/` folder inside the repo (verify each image renders cleanly and is not hotlink-blocked or broken).

---

## 3. Novice-Safe One-Tap Google Maps Navigation Rules (Critical)
Every navigation link MUST follow official Google Maps URLs v1 (`https://www.google.com/maps/dir/?api=1&...` or `search/?api=1&...`):
1. **Natural-Stop Relay Instead of Mid-Highway Waypoints**:
   - Do **not** insert intermediate waypoints on expressways/viaducts (mobile Google Maps pauses navigation at each waypoint requiring a manual "Continue" tap, and elevated coordinates snap to surface roads or opposite lanes).
   - Split the drive into legs ending at **real free parking stops / SA / viewpoints** so the co-pilot can tap the next leg safely.
   - Optionally include a collapsible **"副驾专用：带安全经由点单线锁死版"** using ONLY real free parking lots/viewpoints as `waypoints=`.
2. **Never Set Tunnel Entrances or Highway On-Ramps as Standalone Destinations**:
   - Long tunnels lose GPS and ramp coordinates snap to surface overpasses. Instead, launch continuous navigation from the pickup point directly to the next SA/stop, and pair it with:
     - `👀 预览蓝线` (`origin=<pickup>&destination=<next_stop>&travelmode=driving`)
     - Verified exact coordinates (`search/?api=1&query=<lat>,<lng>`) for reference only
     - Ground-road/zero-tunnel alternative using `&avoid=highways` where helpful.
3. **Expressway SA/PA Links**:
   - Use the expressway facility name + direction (e.g., `EXPASA海老名 下り`), **never** append the local street address (which can route drivers onto local roads / external Platt Park).
4. **Every Navigation Card Must Contain**:
   - **✅ 1秒选线核对**: Exact road name(s) to confirm on the blue line vs `❌` road(s) to reject.
   - **Lane / JCT Mnemonics**: Concrete visual cues (colored lanes, LED sign text, speed limits) for complex junctions.
   - **WeChat Browser Escape Tip**: Remind users to tap `···` → "在默认浏览器（Safari / Chrome）中打开" if WeChat blocks deep-linking to Google Maps.
   - Recommend **Yahoo!カーナビ** (free, `広い道優先` + 3D JCT lane diagrams) as a co-pilot backup.

---

## 4. Deliverables & Page Architecture
Build a cohesive, mobile-first (390px+), dark-mode-ready, single-file web app (`index.html`) + WeChat share kit:

1. **Interactive Web Page (`index.html`)**:
   - **Hero**: Trip date, weather/sunset/key anchor badges, high-level route summary.
   - **Sticky Section Nav**: One-tap jump between sections.
   - **Section 1 — 新手一键导航控制台**: Route mode switcher (Scenic vs Zero-Mountain-Road backup), optional live pickup-point input override, sequential navigation cards, and a "复制微信群文案" button.
   - **Section 2 — 绝景路段评估 & 沿途 SA/PA 名物**: Real photos (with tap-to-zoom lightbox), toll/cash tips, downhill driving advice, and must-eat SA items.
   - **Section 3 — 精选餐厅 3 选 1**: 3 cards × (3 real photos + 3 real reviews + hours/parking/budget + walking/driving Google Maps nav + map pin + call/mobile-queue button).
   - **Section 4 — 交互式行程时间轴模拟器**:
     - Preset buttons comparing recommended, relaxed/backup, and risky/tight plans.
     - Slider anchored to the user's key time constraint (departure or pickup time), route dropdown, traffic scenario selector (official forecast / smooth / +30m accident), and order toggle (e.g., sightsee before check-in).
     - Live KPI cards, horizontal Gantt bar with **sunset red vertical line** (evenly padded ticks so edge labels never clip), and detailed leg-by-leg timetable.
   - **Section 5 — 官方高速拥堵预测 & 风险避坑矩阵**: Hourly outbound vs return congestion bar chart + categorized High/Medium risk cards with concrete countermeasures.
   - **Section 6 — 行前协同清单**: Interactive checkboxes persisted in `localStorage` (use a unique trip-scoped storage key per trip).

2. **WeChat Share Assets**:
   - `og-cover.png` (1200×630) referenced in `<meta property="og:image">` with a version query string (`?v=...`) to bust WeChat cache.
   - High-DPI vertical summary poster PNG (440px logical width @ 2.5x) summarizing timelines, scenic/SA highlights, 3 dinner picks, and critical alerts. **Whenever regenerating the poster after edits, use a new versioned filename** (e.g., `poster_v2.png` or `poster_0900.png`) to prevent CDN/WeChat caching stale images.
   - `wechat_share_kit.md` containing copy-pasteable WeChat group confirmation text, plain-text one-tap Google Maps link pack, and direct poster link.

---

## 5. Multi-Trip Monorepo & GitHub Pages Publishing Convention
Use a single public repository (`kenandxx/trip-planning`) with one subfolder per trip instead of creating a new repo each time:
- Keep existing published trip URLs intact (do **not** overwrite root `/` which hosts the live 2026-11-23 Izu trip).
- Create each new trip under `trips/YYYY-MM-<slug>/` (e.g., `trips/2027-01-hakuba/`) containing `brief.md`, `index.html`, `img/`, `og-cover.png`, and versioned `poster_*.png`.
- Update `trips/index.html` (the Trip Hub) to list the newly published trip with its status badge, date, and direct link (`https://kenandxx.github.io/trip-planning/trips/YYYY-MM-<slug>/`).

## 6. Verification Checklist Before Finishing
1. **Static Audit**: Confirm zero stale timestamps, zero broken/concatenated POI strings, zero street addresses in SA/PA queries, and 100% consistency across `index.html`, `wechat_share_kit.md`, `og-cover.png`, and the summary poster.
2. **Playwright Mobile QA (390×844)**:
   - Zero JS console/page errors and zero horizontal overflow (`scrollWidth <= innerWidth`).
   - Test all mode tabs, simulator presets, traffic modes, and live inputs.
   - Visually inspect screenshots of the hero, key nav cards, Gantt chart, OG cover, and poster PNG.
3. **GitHub Pages Deployment**:
   - Commit and push to `origin main` and verify `gh api repos/kenandxx/trip-planning/pages/builds/latest` reports `"status": "built"` for the pushed commit SHA.
