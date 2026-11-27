---
name: japan-self-drive-trip-planner
description: Plan Japan self-drive trips to the v2.0 WeChat-shareable interactive web app & Live Co-Pilot specification — pre-flight Google Maps ETC/toll anti-trap gate, realistic driving pace buffering (1.2x–1.35x), GPS geofence + 1-tap live progress check-in, 4-channel strong mobile alerts (.ics dual calendar alarms, WakeLock + Chinese TTS voice chime, iPhone Bark critical push, PWA notifications), 3-tier automatic delay replanning with restaurant L.O. guards & AI emergency prompt builder, novice-safe Google Maps navigation, 3 curated restaurants (9+ photos & 9 reviews), high-DPI WeChat poster, and GitHub Pages deployment. Use whenever the user asks to plan a road trip, self-drive itinerary, travel schedule, or says 按照老规格/自驾攻略模板规划行程.
---
# Japan Self-Drive Trip Planner v2.0 (Interactive Guide + Live Co-Pilot & Auto-Replan Spec)

Follow this end-to-end specification whenever planning or updating a self-drive trip for the user.

## 0. Global Rule — Every Recommendation States "Why This Season / Weather / Day" (2026-11-27)
Every trip page and every chat recommendation MUST include a **`🌦️ 为什么是这里、为什么是这天（推荐理由）`** section placed right after the hero (before the timetable), covering all of:
1. **Season (季节)**: Why this place is at its best in this specific season/week (e.g., foliage/flower/snow stage with the latest status source, limited-period events such as seasonal cruises or festivals, and when the window closes).
2. **Weather (天气)**: How the exact forecast for that day shapes the plan (hour-by-hour rain end, wind, visibility, temperature) and which activity is placed in which weather window, including the rain/wind fallback.
3. **Day (日子)**: Why this weekday/date works — weekday vs weekend operating schedules, regular closing days (`定休日`), events and crowds, and the official hourly congestion forecast windows the timetable is designed to avoid, plus the hard deadline buffer.
4. **Driver fit**: Why the route suits the driver profile (wide roads, no narrow mountain roads, large free parking).
5. **Rejected alternatives (❌ 为什么没选)**: 2–3 candidates that were considered and the concrete season/weather/day reason each was rejected.
Cite the sources (forecast, foliage status, operator schedule, congestion forecast) with the query date.

---

## 1. Defaults & User Profile (Override When Provided)
- **Language**: Write all user-facing prose, web UI, posters, `.ics` calendar alarms, voice alerts, and WeChat copy in **Simplified Chinese (`zh-CN`)**, while preserving official Japanese place, road, IC/JCT, SA/PA, and restaurant names so the driver can match road signs and navigation screens.
- **Default Driver Context** (confirm or override if the user specifies otherwise):
  - Typical starting area: near **滝不動駅 (Chiba)** unless another origin is given.
  - Driving style: ~30,000 km experience, relies strictly on turn-by-turn navigation ("跟着导航开车"), prefers wide dual-lane roads, avoids narrow alleys, steep blind descents, confusing highway junctions, and unnecessary night mountain driving.
  - **Real-World Pace Reality (11/25 Post-Mortem Lesson)**: Never schedule tight chains on `1.00×` ideal Google Maps duration alone! Unplanned rest stops, missed turns, traffic, or cautious driving below speed limits on unfamiliar/mountain roads routinely add `20%–35%+`. Always model a **1.20× default realistic pace option** (`1.35×` for mountain/rain/snow) and wire up live dynamic replanning.
  - **Live Personal Context Mesh (`.context/PERSONAL_CONTEXT.md` ← `kenandxx/ob-life-hub`)**: Always read `.context/PERSONAL_CONTEXT.md` (auto-compiled & synced from the user's central private Obsidian vault `kenandxx/ob-life-hub`, or run `./scripts/sync-life-context.sh pull` for the latest live slice) plus `notes/places/` and `notes/driver-memory.md` before planning so evolving daily habits, curfews, UI preferences, toll traps, and recent `#sync/travel` reflections take immediate effect; after post-trip feedback, offer `./scripts/sync-life-context.sh push-insight` to write reusable takeaways back upstream to `ob-life-hub`.
- **Ask or Confirm Missing Inputs Only If Blocking**: Date(s), departure/pickup time anchor, pickup location(s), destination/lodging & **hard deadline** (e.g., ryokan kaiseki dinner cutoff `17:30`, airport train `16:05`, last Gondola), group size/luggage constraints, scenic/food preferences.

---

## 2. Mandatory Pre-Planning Research & Fact-Checking
Before designing the timetable, verify real-world conditions via web search:
1. **Weather, Daylight & Hard Time Cutoffs**:
   - Forecast for each day (precipitation %, Mt. Fuji / scenic visibility), exact **sunset time**, attraction closing / `最終入場` times, AND restaurant **Last Order (`L.O.`)** cutoffs (critical when lunch/dinner gets delayed by 60–90 min!).
2. **Official Highway Traffic & Construction**:
   - Check NEXCO (East/Central/West), Shutoko, and prefectural road announcements for the exact date(s): hourly congestion forecast (km & peak hours), public holiday ETC discount exclusions, full/lane road closures, seasonal winter closures (`冬季通行止め`), and long-term construction zones.
   - Check toll payment constraints: **ETC-only ramps (ETC専用)** vs **cash/Suica/ETCX-only toll roads** (where standard ETC does not work) and calculate exact cash coins needed in the cupholder.
   - For winter/mountain trips (Nov–Apr), check studless tire (`スタッドレスタイヤ`) and chain regulation (`チェーン規制`) zones.
3. **Pickup & Parking Verification**:
   - Check curb/parking capacity at pickup hotels/stations; identify the nearest large flat backup parking lot (capacity, opening time, fee, height limit).
   - For sightseeing towns with narrow alleys, always target a verified wide, flat, attendant-guided perimeter parking lot — **never** route directly to a temple hall or narrow alley landmark.
4. **Scenic Routes & Highway SA/PA Specialties (名物)**:
   - Evaluate scenic toll/skyline drives (viewpoints with free parking, toll payment method, safest downhill exit + engine braking reminder) AND prepare a **zero-mountain-road highway backup** for fog, snow, wind, or fatigue.
   - Tag stops clearly by replan priority: `must` (origin, meal, hotel/airport drop-off), `core` (signature highlight that can be time-compressed first before skipping), and `optional` (20-min bonus pit stops that get auto-trimmed first if running behind).
5. **Dining Research (3 Curated Picks + Late-Arrival Resilience)**:
   - Select **3 distinct, verified-open restaurants** for the target meal (verify regular closing day `定休日` AND holiday schedule for the exact date, business hours & exact `L.O.` minute, service speed/queue risk, distance/parking/walkability, phone reservation or mobile queue URL).
   - Ensure at least 1–2 of the 3 picks have **all-afternoon / late `L.O.` and fast turnover** so a `+90 min` highway/detour delay does not leave the group locked out of lunch or dinner.
   - Gather **at least 3 real photos per restaurant (≥ 9 photos total)** plus scenic/SA photos, and **3 real diner reviews per restaurant (9 reviews total)** with reviewer name/platform and actionable takeaways.
   - Download all images locally into that trip's `img/` folder inside the repo (verify each image renders cleanly and is not hotlink-blocked or broken).

---

## 3. Novice-Safe One-Tap Google Maps Navigation & Anti-Trap Rules (Critical)
Every navigation link MUST follow official Google Maps URLs v1 (`https://www.google.com/maps/dir/?api=1&...` or `search/?api=1&...`):
1. **Pre-Flight Google Maps "Avoid Tolls = OFF" Gate (Mandatory 11/25 Anti-Trap Rule)**:
   - Google Maps URLs v1 cannot override a user's sticky in-app **"Avoid tolls (避开收费公路)"** or **"Avoid highways"** toggle! If left ON, Google Maps silently routes drivers off Tomei/expressways onto steep, slow mountain roads, causing `+90 min` delays.
   - Every trip page MUST display the **Pre-Flight 2-Lock Gate** at departure:
     1. Confirm Google Maps Route Options has **「避开收费公路 / 避开高速公路」turned OFF**, and verify the preview blue line shows the **「有料 / 收费」** badge AND matches expected Leg 1 duration.
     2. Confirm in-car **ETC card reader green light** + exact cash coins in cupholder for non-ETC toll gates.
2. **Natural-Stop Relay Instead of Mid-Highway Waypoints**:
   - Do **not** insert intermediate waypoints on expressways/viaducts (mobile Google Maps pauses navigation at each waypoint requiring a manual "Continue" tap, and elevated coordinates snap to surface roads or opposite lanes).
   - Split the drive into legs ending at **real free parking stops / SA / viewpoints** so the co-pilot can tap the next leg safely.
3. **Never Set Tunnel Entrances or Highway On-Ramps as Standalone Destinations**:
   - Long tunnels lose GPS and ramp coordinates snap to surface overpasses. Launch continuous navigation from the pickup/current stop directly to the next SA/stop, paired with `👀 预览蓝线` and verified coordinates for reference only.
4. **Expressway SA/PA Links**:
   - Use the expressway facility name + direction (e.g., `EXPASA海老名 下り`, `Pasar幕張 上り`), **never** append the local street address.
5. **Every Navigation Card Must Contain**:
   - **✅ 1秒选线核对**: Exact road name(s) + `有料` badge + expected minutes to confirm on the blue line vs `❌` road(s) to reject.
   - **Lane / JCT Mnemonics**: Concrete visual cues (colored lanes, LED sign text, speed limits) for complex junctions.
   - **WeChat Browser Escape Tip** & **Yahoo!カーナビ** (`広い道優先` + 3D JCT lane diagrams) co-pilot backup tip.

---

## 4. Live Trip Co-Pilot, 4-Channel Strong Alerts & Auto-Replan Engine (v2.9 Core)
Every trip page under `trips/YYYY-MM-<slug>/` MUST include `manifest.webmanifest`, link `../../copilot/trip-copilot.css?v=2.9` & `../../copilot/trip-copilot.js?v=2.9` (backed by root `sw.js`), mount `#copilot` as the top interactive section + sticky bottom dock, and configure `TripCopilot.init({...})` with:
1. **Self-Proving GPS Live Bar, Station-Name Deadline Back-Planner (`🧭 此刻护航` ｜ `⏰ 自由死线倒推`) & 1-Tap Check-in**:
   - **Always-Visible GPS Live Verification Bar**: Displays pulsing status (`🟢 GPS正常稼働中 · N秒前刷新 · 更新#次数 · 精度±米数 · 邻近站点距离` / `🟡 信号偏弱` / `⚪ 信号暂中断`), 1-tap **`🔄 立即测位`** active hardware ping test, and **`🗺️ 地图核对`** blue-dot verification link, plus a live GPS pill in the sticky bottom dock. Stale fixes (`≥ 30s` in tunnels/B1/subways) automatically pause from delay math while keeping `watchPosition` alive.
   - **Unified Smart Clock, Station-Name Search & Instant Reactive Sync**: Tab 1 (`🧭 此刻护航＆打卡`) unifies pre-trip/archive preview vs live clock vs replay simulation with interactive stop chips (`要去 → 📍在这 → ✔已去 → 不去`) and expandable exact-time check-in / delay bump buttons; Tab 2 (`⏰ 自由死线倒推`) supports **direct Japan station/place name input** (built-in 80+ station dictionary with Simplified Chinese / Japanese Kanji / Romaji instant autocomplete + nationwide Nominatim fallback + 1-tap station chips + Google Maps URL/coords), updating the result card, Walk/Transit/Car/Taxi ETA table, Tab 1 summary, and sticky dock instantaneously while clearing stale preset subtitles, plus `🔄 按当前位置＆现在时间重算提案` and 3 executable rescue proposals even when severely `Behind`.
2. **Restaurant `L.O.` Guard & 3-Tier Dynamic Re-Plan Engine**:
   - Configure `directDriveMap` (exact expressway minutes when skipping optional/core stops), `mealGuards` (`loMin`, `closeMin`, fast-turnover flag), and `deadlineSpec` (`targetArrMin`, `hardArrMin`, train connections if any, and `emergencyDirect` ultimate fallback if applicable).
   - Whenever delay `≥ 20 min` or a deadline is threatened, automatically present **3 concrete Re-Plan cards**:
     - **Plan 1 (`🛡️ 稳救黄金死线版`)**: Compress meal to `minStayMin`, cut `optional` stops (and convert `core` stops to pass-through if needed) to rescue the primary target deadline.
     - **Plan 2 (`🌉 保留核心体验速刷版`)**: Cut `optional` stops, keep `core` stop at compressed `minStayMin`, and show the exact fallback train/arrival margin.
     - **Plan 3 (`✈️ 终极兜底直达版`)**: Direct expressway fallback (e.g., direct drive to airport terminal or zero-mountain direct hotel highway route).
   - Include 1-tap `⚡ 套用此方案` (syncing with the Section 4 Gantt Simulator) + `📋 复制调整版微信群通知` + `🧪 实况痛点演练按钮` so users can pre-test delay scenarios before departure.
3. **4-Channel Strong Mobile Alerts**:
   - **Channel 1 — System Calendar `.ics` Dual Alarms**: 1-tap export of RFC 5545 `.ics` (`Asia/Tokyo`, `-PT15M` + `PT0M` dual `VALARM`s) for pre-flight gate, 1-hour highway check, and each stop's must-depart redline (re-exportable after replanning!).
   - **Channel 2 — Foreground Co-Pilot Guard**: Screen `WakeLock` + Web Audio automotive dual-tone chime + Chinese `speechSynthesis` voice briefing + vibration + high-contrast fullscreen takeover modal.
   - **Channel 3 — iPhone Bark Critical Push & Team `ntfy.sh` Topic**: Supports multi-device Bark Keys (`level=critical&volume=10&call=1` to ring through iPhone silent switch on severe risk, carrying 1-tap Google Maps URL) + `ntfy.sh` team channel + iOS Shortcuts auto-checkin URL (`?copilot=1&checkin=<nodeId>`).
   - **Channel 4 — Home-Screen PWA & Tunnel Offline Cache**: `manifest.webmanifest` + root `sw.js` for iOS 16.4+/Android native notifications and zero-signal tunnel/mountain availability.
4. **AI Deep Emergency Replan Drawer**:
   - Auto-packages live timestamp, GPS coordinates, completed/remaining stops, observed pace multiplier, hard deadlines, and novice anti-trap Google Maps URL rules for 1-tap copy to ChatGPT/Claude/Gemini (plus optional local-storage-only API key inline generation).
   - *(Note: When answering in an external web chat without repo access, inline an equivalent self-contained Live Check-in + `.ics` Export + 3-Plan Auto-Replan JS module directly inside the single `index.html`.)*

---

## 5. Full Page Deliverables & Section Architecture
Build a cohesive, mobile-first (390px+), dark-mode-ready web app (`index.html`) + PWA manifest + WeChat share kit:
1. **Hero & Sticky Section Nav**: Trip date, weather/sunset/anchor badges, `#copilot` first tab + jump links.
   - **`🌦️ 推荐理由` card (Global Rule §0)**: season / weather / day / driver fit / rejected alternatives, with sources.
2. **Section 0 — 行中实时进度护航 ＆ 晚点自动重排副驾台 (`#copilot`)**: Powered by `TripCopilot.init(...)` + sticky bottom `.cp-dock`.
3. **Section 1 — 沿途绝景 / 20分钟彩蛋 ＆ SA/PA 名物**: Real photos (with tap-to-zoom lightbox), priority tags (`核心` vs `可选弹性`), toll/cash tips, downhill advice.
4. **Section 2 — 新手逐段一键导航 ＆ 老司机 Drive 要点**: Sequential relay cards, `1秒选线核对`, JCT lane mnemonics, zero-mountain backup, WeChat copy button.
5. **Section 3 — 精选餐厅 3 选 1**: 3 cards × (3 real photos + 3 real reviews + exact `L.O.` badge + parking + driving/walking nav + `tel:` button).
6. **Section 4 — 交互式行程时间轴模拟器 (`#sim`)**: Presets, departure/pickup slider, traffic/pace selector, optional-spot toggles (synced with `TripCopilot` `onApplyPlan`), KPI cards, horizontal Gantt bar with sunset/deadline lines, and leg-by-leg timetable.
7. **Section 5 — 官方高速拥堵预测 ＆ 风险避坑矩阵**: Hourly congestion chart + High/Medium risk cards.
8. **Section 6 — 行前协同清单**: Persisted in `localStorage` with a unique trip-scoped key.
9. **WeChat Share Assets**:
   - `og-cover.png` (1200×630) with cache-busting `?v=...`.
   - Versioned high-DPI vertical summary poster PNG (440px logical width @ 2.5x, new filename on every edit e.g. `poster_v2.png`).

---

## 6. Multi-Trip Monorepo & Verification Checklist
1. **Monorepo Structure (`kenandxx/trip-planning`)**:
   - Do **not** overwrite root `/` (hosts live 2026-11-23 Izu Day 1).
   - Shared Co-Pilot runtime lives at `/copilot/trip-copilot.{css,js}`, `/copilot/icon-{192,512}.png`, and `/sw.js`.
   - Create each new trip under `trips/YYYY-MM-<slug>/` (`brief.md`, `index.html`, `manifest.webmanifest`, `img/`, `og-cover.png`, `poster_*.png`) and update `trips/index.html` + `README.md`.
2. **Playwright Mobile QA (390×844) Before Finishing**:
   - Zero JS console/page errors and zero horizontal overflow (`scrollWidth <= innerWidth`), including when Co-Pilot replan cards, folds, and urgent modals are open!
   - Test Pre-Flight Gate, 1-tap delay replay scenario (verifying 3 Re-Plan options & `L.O.` guard render and sync with Gantt simulator), `.ics` calendar builder, and AI emergency prompt preview.
   - Commit, push to `origin main`, and verify GitHub Pages build status `"built"`.
