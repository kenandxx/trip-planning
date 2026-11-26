/*!
 * Trip Co-Pilot v2.0 — Universal Live Progress, Risk Management & Multi-Channel Strong Alert Engine
 * Repository: kenandxx/trip-planning
 * Zero external dependencies; offline-capable; mobile-first (iOS Safari / WeChat / Android Chrome).
 */
(function (global) {
  'use strict';

  const GLOBAL_PREF_KEY = 'trip_copilot_global_prefs_v2';

  const fmtTime = min => {
    const m = ((Math.round(min) % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };

  const parseTime = str => {
    if (!str || !/^\d{1,2}:\d{2}$/.test(str.trim())) return null;
    const [h, m] = str.trim().split(':').map(Number);
    return h * 60 + m;
  };

  const nowLocalMin = () => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  };

  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const toRad = x => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const isWeChat = () => /MicroMessenger/i.test(navigator.userAgent || '');
  const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent || '');

  // Automotive Web Audio synthesizer (works on iOS Safari without external audio files)
  let audioCtx = null;
  function unlockAudio() {
    try {
      const Ctx = global.AudioContext || global.webkitAudioContext;
      if (!Ctx) return null;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (_) {
      return null;
    }
  }

  function playChime(level) {
    const ctx = unlockAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes =
      level === 'err'
        ? [
            [987.77, 0, 0.16],
            [783.99, 0.18, 0.16],
            [987.77, 0.36, 0.18],
            [783.99, 0.56, 0.24]
          ]
        : level === 'warn'
        ? [
            [587.33, 0, 0.14],
            [880.0, 0.16, 0.18],
            [1174.66, 0.36, 0.24]
          ]
        : [
            [880.0, 0, 0.12],
            [1174.66, 0.14, 0.2]
          ];

    notes.forEach(([freq, offset, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = level === 'err' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + offset);
      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.28, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + dur + 0.02);
    });

    if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) {
      navigator.vibrate(level === 'err' ? [320, 120, 320, 120, 500] : [200, 100, 200]);
    }
  }

  function speakZh(text) {
    try {
      if (!('speechSynthesis' in global)) return;
      global.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 1.05;
      global.speechSynthesis.speak(u);
    } catch (_) {}
  }

  function showPageToast(msg) {
    const el = document.getElementById('toast');
    if (el) {
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(showPageToast._t);
      showPageToast._t = setTimeout(() => el.classList.remove('show'), 2800);
    }
  }

  function init(config) {
    if (!config || !config.nodes || !config.nodes.length) return null;

    const mount = document.querySelector(config.mountSelector || '#copilot-mount');
    if (!mount) return null;

    const storageKey = `trip_copilot_state_${config.tripId || 'default'}_v2`;
    const savedState = safeLoad(storageKey, {});
    const globalPrefs = safeLoad(GLOBAL_PREF_KEY, {
      barkKeys: '',
      barkLevel: 'critical',
      autoBark: true,
      ntfyTopic: '',
      llmEndpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      llmModel: 'gemini-2.5-flash',
      llmApiKey: ''
    });

    const defaultEnabled = {};
    config.nodes.forEach(n => {
      defaultEnabled[n.id] = n.enabledByDefault !== false;
    });

    const state = {
      preFlight: Object.assign({ tollsOn: false, etcReady: false, collapsed: false }, savedState.preFlight || {}),
      paceFactor: savedState.paceFactor || config.defaultPaceFactor || 1.0,
      enabledNodes: Object.assign({}, defaultEnabled, savedState.enabledNodes || {}),
      stayOverrides: Object.assign({}, savedState.stayOverrides || {}),
      emergencyMode: Boolean(savedState.emergencyMode),
      activePlanId: savedState.activePlanId || 'current',
      anchor: savedState.anchor || {
        nodeId: config.nodes[0].id,
        event: 'dep',
        timeMin: config.defaultDepMin || 600,
        extraDelayMin: 0,
        reason: '行前基准计划'
      },
      guardActive: false,
      gpsActive: false,
      gpsInfo: null, // { lat, lng, speedKmh, accuracy, nearestId, remKm, liveDeltaMin, slowRoadWarn }
      gpsLastFixAt: null, // ms timestamp of the last position received from watchPosition
      gpsLastError: null, // last non-fatal error message (timeout / unavailable) while still watching
      observedPace: savedState.observedPace || null,
      live: Object.assign({ status: {}, stayMode: 'full', hereMode: 'full', appliedAt: null }, savedState.live || {}),
      lastAlertSig: ''
    };

    let watchId = null;
    let gpsFreshTimer = null;
    let lastRenderedGpsFresh = false; // isGpsFresh() as of the last full render()
    const GPS_STALE_SEC = 30; // no new fix for this long → show "signal lost"
    const GPS_POOR_ACCURACY_M = 100; // accuracy worse than this → show "poor accuracy"
    let wakeLockSentinel = null;
    let guardTimer = null;
    let swReg = null;
    let deferredInstallPrompt = null;

    // Register Service Worker for offline + PWA system notifications
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker
        .register(config.swPath || '../../sw.js')
        .then(reg => {
          swReg = reg;
        })
        .catch(() => {});
    }

    global.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredInstallPrompt = e;
      const btn = document.getElementById('cp-pwa-install-btn');
      if (btn) btn.style.display = 'inline-flex';
    });

    document.addEventListener('visibilitychange', async () => {
      if (state.guardActive && document.visibilityState === 'visible' && navigator.wakeLock) {
        try {
          wakeLockSentinel = await navigator.wakeLock.request('screen');
        } catch (_) {}
      }
    });

    function saveState() {
      safeSave(storageKey, {
        preFlight: state.preFlight,
        paceFactor: state.paceFactor,
        enabledNodes: state.enabledNodes,
        stayOverrides: state.stayOverrides,
        emergencyMode: state.emergencyMode,
        activePlanId: state.activePlanId,
        anchor: state.anchor,
        observedPace: state.observedPace,
        live: state.live
      });
    }

    function savePrefs() {
      safeSave(GLOBAL_PREF_KEY, globalPrefs);
    }

    // Lookup base drive minutes between any two active nodes
    function getDriveMin(fromId, toId, pace) {
      const key = `${fromId}->${toId}`;
      const map = config.directDriveMap || {};
      let base = map[key];
      if (base == null) {
        const fromIdx = config.nodes.findIndex(n => n.id === fromId);
        const toIdx = config.nodes.findIndex(n => n.id === toId);
        if (fromIdx >= 0 && toIdx > fromIdx) {
          base = 0;
          for (let i = fromIdx + 1; i <= toIdx; i++) {
            base += config.nodes[i].driveMin || 0;
          }
          // Slight directness discount when skipping intermediate stops
          if (toIdx - fromIdx > 1) base = Math.round(base * 0.92);
        } else {
          base = 30;
        }
      }
      return Math.round(base * (pace || 1.0));
    }

    // Compute baseline schedule (1.0x from defaultDepMin with defaultEnabled nodes) for delay comparison
    function computeBaselineMap() {
      const active = config.nodes.filter(n => n.role === 'origin' || n.role === 'meal' || n.role === 'destination' || n.role === 'after' || defaultEnabled[n.id]);
      let t = config.defaultDepMin || 600;
      const byId = {};
      active.forEach((n, idx) => {
        if (idx > 0) {
          t += getDriveMin(active[idx - 1].id, n.id, 1.0);
        }
        const arr = t;
        const stay = n.stayMin || 0;
        const dep = arr + stay;
        byId[n.id] = { arr, dep };
        t = dep;
      });
      return byId;
    }

    const baselineMap = computeBaselineMap();

    // Simulate schedule given explicit overrides
    function simulateSchedule(opts) {
      const enabled = opts.enabledNodes || state.enabledNodes;
      const stays = opts.stayOverrides || state.stayOverrides;
      const pace = opts.paceFactor != null ? opts.paceFactor : state.paceFactor;
      const anchor = opts.anchor || state.anchor;
      const emergency = opts.emergencyMode != null ? opts.emergencyMode : state.emergencyMode;

      const activeNodes = config.nodes.filter(n => {
        if (n.role === 'origin' || n.role === 'meal' || n.role === 'destination' || n.role === 'after') return true;
        return Boolean(enabled[n.id]);
      });

      let anchorIdx = activeNodes.findIndex(n => n.id === anchor.nodeId);
      if (anchorIdx < 0) {
        // If anchor node was disabled, snap to nearest preceding active node
        const origOrder = config.nodes.findIndex(n => n.id === anchor.nodeId);
        anchorIdx = 0;
        activeNodes.forEach((n, i) => {
          if (config.nodes.findIndex(x => x.id === n.id) <= origOrder) anchorIdx = i;
        });
      }

      const timeline = [];
      let t = anchor.timeMin + (anchor.extraDelayMin || 0);

      // Emergency direct override (e.g. direct expressway drive to airport OR late-night Shutoko taxi rescue!)
      if (emergency && config.deadlineSpec && config.deadlineSpec.emergencyDirect) {
        const em = config.deadlineSpec.emergencyDirect;
        const anchorNode = activeNodes[anchorIdx];
        let startDep = t;
        let lastNodeId = anchorNode.id;
        if (anchor.event === 'arr') {
          const stay = stays[anchorNode.id] != null ? stays[anchorNode.id] : Math.min(anchorNode.stayMin || 0, 55);
          timeline.push({
            node: anchorNode,
            arr: t,
            dep: t + stay,
            stay,
            drive: 0,
            status: 'current'
          });
          startDep = t + stay;
        }
        if (em.includeRemainingCore) {
          activeNodes.slice(anchorIdx + 1).forEach(cn => {
            if (cn.role === 'core') {
              const w = getDriveMin(lastNodeId, cn.id, 1.0);
              const cArr = startDep + w;
              const cStay = stays[cn.id] != null ? stays[cn.id] : (cn.stayMin || 45);
              timeline.push({ node: cn, arr: cArr, dep: cArr + cStay, stay: cStay, drive: w, status: 'upcoming' });
              startDep = cArr + cStay;
              lastNodeId = cn.id;
            }
          });
        }
        const baseDirect = (em.driveFrom && em.driveFrom[lastNodeId]) || (em.driveFrom && em.driveFrom[anchorNode.id]) || 48;
        const drvMin = Math.round(baseDirect * (em.fixedPace || pace));
        const finalArr = startDep + drvMin;
        const homeArr = em.isFinalHome ? finalArr : finalArr + 15 + (em.homeAfterMin || 50);
        const safeLim = em.safeAirportArrMin || (config.deadlineSpec.hardArrMin || 1320);
        const headline = em.headlineFn
          ? em.headlineFn(fmtTime(finalArr), safeLim - finalArr, fmtTime(startDep))
          : `✈️ 驾车直送成田航站楼：预计 ${fmtTime(finalArr)} 抵出发大厅（距 ${fmtTime(em.flightMin || 1160)} 起飞留足 ${Math.round(((em.flightMin || 1160) - finalArr) / 60 * 10) / 10} 小时）`;
        return {
          emergency: true,
          timeline,
          emStartDep: startDep,
          destArr: finalArr,
          homeArr,
          matchedTrain: null,
          bufferMin: safeLim - finalArr,
          riskLevel: finalArr <= safeLim ? 'ok' : 'warn',
          headline,
          emSpec: em
        };
      }

      for (let i = anchorIdx; i < activeNodes.length; i++) {
        const node = activeNodes[i];
        const stay = stays[node.id] != null ? stays[node.id] : (node.stayMin || 0);
        if (i === anchorIdx) {
          if (anchor.event === 'dep') {
            timeline.push({ node, arr: anchor.timeMin, dep: t, stay: 0, drive: 0, status: 'departed' });
          } else {
            timeline.push({ node, arr: t, dep: t + stay, stay, drive: 0, status: 'at' });
            t = t + stay;
          }
        } else {
          const prev = activeNodes[i - 1];
          const drv = getDriveMin(prev.id, node.id, pace);
          const arr = t + drv;
          const dep = arr + stay;
          timeline.push({ node, arr, dep, stay, drive: drv, status: 'upcoming' });
          t = dep;
        }
      }

      const dSpec = config.deadlineSpec || {};
      const destEntry = timeline.find(x => x.node.id === (dSpec.destNodeId || 'dest')) || timeline[timeline.length - 1];
      const afterEntry = timeline.find(x => x.node.role === 'after');
      const destArr = destEntry ? destEntry.arr : t;
      const homeArr = afterEntry ? afterEntry.arr : destArr + 30;

      // Evaluate against trains or hard arrival deadline
      let matchedTrain = null;
      let riskLevel = 'ok';
      let bufferMin = 0;
      let headline = '';

      if (dSpec.trains && dSpec.trains.length) {
        const minBuf = dSpec.transferBufferMin || 12;
        matchedTrain = dSpec.trains.find(tr => tr.dep >= destArr + minBuf) || null;
        if (!matchedTrain) {
          riskLevel = 'err';
          bufferMin = (dSpec.hardArrMin || 997) - destArr;
          headline = `🚨 预计 ${fmtTime(destArr)} 才抵${dSpec.destName}，已错过最后一班安全直达车！请立即启用下方重排救援方案！`;
        } else {
          bufferMin = matchedTrain.dep - destArr;
          if (destArr <= (dSpec.targetArrMin || 953)) {
            riskLevel = 'ok';
            headline = `✅ 预计 ${fmtTime(destArr)} 抵${dSpec.destName}（缓冲 ${bufferMin} 分），稳赶 ${matchedTrain.name}！`;
          } else if (destArr <= (dSpec.hardArrMin || 997)) {
            riskLevel = 'warn';
            headline = `⚠️ 预计 ${fmtTime(destArr)} 抵${dSpec.destName}，已错过黄金班次，仅赶上 ${matchedTrain.name}（缓冲 ${bufferMin} 分）`;
          } else {
            riskLevel = 'err';
            headline = `🚨 预计 ${fmtTime(destArr)} 抵${dSpec.destName}，晚于安全红线！`;
          }
        }
      } else {
        const target = dSpec.targetArrMin || 1020;
        const hard = dSpec.hardArrMin || 1080;
        bufferMin = target - destArr;
        if (destArr <= target) {
          riskLevel = 'ok';
          headline = `✅ 预计 ${fmtTime(destArr)} 抵达终点（比目标 ${fmtTime(target)} 提前 ${bufferMin} 分钟）`;
        } else if (destArr <= hard) {
          riskLevel = 'warn';
          headline = `⚠️ 预计 ${fmtTime(destArr)} 抵达终点（晚于理想目标 ${destArr - target} 分钟，距最晚红线剩 ${hard - destArr} 分钟）`;
        } else {
          riskLevel = 'err';
          headline = `🚨 预计 ${fmtTime(destArr)} 抵达终点，已超出最晚安全红线 ${fmtTime(hard)}！`;
        }
      }

      return {
        emergency: false,
        timeline,
        destArr,
        homeArr,
        matchedTrain,
        bufferMin,
        riskLevel,
        headline
      };
    }

    // Calculate current delay vs baseline at current anchor
    function getDelayVsBaseline() {
      const a = state.anchor;
      const base = baselineMap[a.nodeId];
      let delta = a.extraDelayMin || 0;
      if (base) {
        const ref = a.event === 'dep' ? base.dep : base.arr;
        delta = a.timeMin + (a.extraDelayMin || 0) - ref;
      }
      // Only trust the GPS-derived ETA while the fix is fresh; a stale fix would freeze an old delay.
      if (isGpsFresh() && state.gpsInfo.liveDeltaMin != null) {
        delta = Math.max(delta, state.gpsInfo.liveDeltaMin);
      }
      return delta;
    }

    // Generate 3 smart Re-Plan options dynamically from current anchor & time
    function generateReplanProposals(currentSim, delayMin) {
      const anchorOrigIdx = config.nodes.findIndex(n => n.id === state.anchor.nodeId);
      const remainingOptional = config.nodes.filter((n, idx) => idx > anchorOrigIdx && n.role === 'optional');
      const remainingCore = config.nodes.filter((n, idx) => idx > anchorOrigIdx && n.role === 'core');
      const mealNode = config.nodes.find((n, idx) => idx >= anchorOrigIdx && n.role === 'meal');

      // Use realistic highway pace once ETC/highway is verified (avoid over-penalizing highway legs)
      const rescuePace = Math.min(Math.max(state.paceFactor, 1.05), 1.2);
      const proposals = [];

      // Plan A: Save Golden Target Deadline (trim meal, cut optional stops, and cut/compress core stop as needed)
      {
        const enA = Object.assign({}, state.enabledNodes);
        const stA = {};
        const pills = [];

        remainingOptional.forEach(n => {
          if (enA[n.id]) pills.push({ cls: 'cut', txt: `✂️ 砍掉 ${n.shortName || n.name}` });
          enA[n.id] = false;
        });

        if (mealNode && (state.anchor.nodeId !== mealNode.id || state.anchor.event === 'arr')) {
          const fastMeal = mealNode.minStayMin || 50;
          stA[mealNode.id] = fastMeal;
          pills.push({ cls: 'trim', txt: `🍽️ 用餐压缩至 ${fastMeal}分（选快出餐店）` });
        }

        // First test keeping core stops compressed; if that misses targetArrMin, convert core stop to non-stop pass-through
        remainingCore.forEach(n => {
          enA[n.id] = true;
          stA[n.id] = n.minStayMin || 18;
        });

        let simA = simulateSchedule({
          enabledNodes: enA,
          stayOverrides: stA,
          paceFactor: rescuePace,
          emergencyMode: false
        });

        const isTransit = config.mode === 'transit';
        const targetArr = (config.deadlineSpec && config.deadlineSpec.targetArrMin) || 953;
        if (simA.destArr > targetArr && remainingCore.length) {
          remainingCore.forEach(n => {
            enA[n.id] = false;
            pills.push({
              cls: 'cut',
              txt: isTransit ? `✂️ 果断砍掉 ${n.shortName || n.name}` : `🌉 ${n.shortName || n.name} 改为车窗直穿不停车`
            });
          });
          simA = simulateSchedule({
            enabledNodes: enA,
            stayOverrides: stA,
            paceFactor: rescuePace,
            emergencyMode: false
          });
        } else {
          remainingCore.forEach(n => {
            pills.push({ cls: 'trim', txt: `⏱️ ${n.shortName || n.name} 压至 ${stA[n.id]}分` });
          });
        }

        pills.push({ cls: 'keep', txt: isTransit ? '🚆 严守换乘死线・零延长' : '🛣️ 全程开启ETC走高速' });

        proposals.push({
          id: 'rescue_gold',
          rec: true,
          name: config.planAName || (isTransit ? '🛡️ 方案一（首推）：稳保22:00铁律・砍第2轩从容归宅版' : '🛡️ 方案一（首推）：稳救黄金死线・砍支线直穿版'),
          summary: simA.matchedTrain
            ? `确保 ${fmtTime(simA.destArr)} 抵${config.deadlineSpec.destName || '站'}，稳赶【${simA.matchedTrain.name}】（缓冲 ${simA.bufferMin} 分钟）！`
            : simA.headline,
          pills,
          sim: simA,
          patch: { enabledNodes: enA, stayOverrides: stA, paceFactor: rescuePace, emergencyMode: false }
        });
      }

      // Plan B: Keep Core Highlight Stop (compressed to minStayMin), accept fallback deadline/train
      if (remainingCore.length) {
        const isTransit = config.mode === 'transit';
        const enB = Object.assign({}, state.enabledNodes);
        const stB = {};
        const pillsB = [];

        remainingOptional.forEach(n => {
          enB[n.id] = false;
        });
        if (remainingOptional.length) {
          pillsB.push({ cls: 'cut', txt: '✂️ 砍掉可选小站' });
        }
        if (mealNode && (state.anchor.nodeId !== mealNode.id || state.anchor.event === 'arr')) {
          stB[mealNode.id] = Math.max(isTransit ? 38 : 42, (mealNode.minStayMin || 50) - 5);
          pillsB.push({ cls: 'trim', txt: `⏱️ ${mealNode.shortName || '前站'}压至 ${stB[mealNode.id]}分` });
        }
        remainingCore.forEach(n => {
          enB[n.id] = true;
          stB[n.id] = n.minStayMin || 15;
          pillsB.push({ cls: 'keep', txt: `✨ 保留 ${n.shortName || n.name} (${stB[n.id]}分短缩快闪)` });
        });

        let paceB = rescuePace;
        let simB = simulateSchedule({
          enabledNodes: enB,
          stayOverrides: stB,
          paceFactor: paceB,
          emergencyMode: false
        });
        const hardArr = (config.deadlineSpec && config.deadlineSpec.hardArrMin) || 997;
        if (simB.destArr > hardArr && paceB > 1.0) {
          paceB = 1.0;
          pillsB.push({ cls: 'trim', txt: isTransit ? '🏃 提前买单＋快步进改札' : '🛣️ 需全程高速零耽搁' });
          simB = simulateSchedule({
            enabledNodes: enB,
            stayOverrides: stB,
            paceFactor: paceB,
            emergencyMode: false
          });
        }

        const summaryB =
          simB.riskLevel === 'err'
            ? `⚠️ 风险提示：即使短缩快闪也将 ${fmtTime(simB.destArr)} 才抵终点（超出安全底线），强烈建议选方案一或方案三！`
            : simB.matchedTrain
            ? `预计 ${fmtTime(simB.destArr)} 抵${config.deadlineSpec.destName || '站'} → 压哨改搭【${simB.matchedTrain.name}】（缓冲 ${simB.bufferMin} 分钟，零容错！）`
            : simB.headline;

        proposals.push({
          id: 'keep_core',
          rec: false,
          name:
            config.planBName ||
            `🌉 方案二：快闪核心站（${remainingCore.map(x => `${x.shortName || x.name} ${stB[x.id]}分`).join('+')}）`,
          summary: summaryB,
          pills: pillsB,
          sim: simB,
          patch: { enabledNodes: enB, stayOverrides: stB, paceFactor: paceB, emergencyMode: false }
        });
      }

      // Plan C: Emergency Direct Fallback (Airport direct drive OR Late-night Shutoko Taxi rescue!)
      if (config.deadlineSpec && config.deadlineSpec.emergencyDirect) {
        const em = config.deadlineSpec.emergencyDirect;
        const stC = {};
        if (mealNode && !em.keepFullStays) stC[mealNode.id] = mealNode.stayMin ? Math.min(mealNode.stayMin, 55) : 55;
        const simC = simulateSchedule({
          enabledNodes: state.enabledNodes,
          stayOverrides: stC,
          paceFactor: rescuePace,
          emergencyMode: true
        });
        proposals.push({
          id: 'emergency_direct',
          rec: false,
          name: em.cardName || '✈️ 方案三（终极兜底）：不赶电车・高速直送成田航站楼出发层',
          summary: em.summaryFn ? em.summaryFn(fmtTime(simC.destArr), fmtTime(simC.emStartDep || simC.destArr)) : em.desc,
          pills: em.pillsFn
            ? em.pillsFn(fmtTime(simC.destArr))
            : [
                { cls: 'keep', txt: '🧳 门到门零搬箱换乘' },
                { cls: 'keep', txt: `✈️ 预计 ${fmtTime(simC.destArr)} 抵航站楼` },
                { cls: 'trim', txt: '🏠 送完开50分回滝不動' }
              ],
          sim: simC,
          patch: { stayOverrides: stC, paceFactor: rescuePace, emergencyMode: true }
        });
      }

      return proposals;
    }

    // Evaluate Restaurant Last Order (L.O.) & Queue Risks at predicted/actual meal arrival
    function evaluateMealGuards(sim) {
      if (!config.mealGuards || !config.mealGuards.length) return [];
      const mealEntry = sim.timeline.find(x => x.node.role === 'meal');
      if (!mealEntry) return [];
      if (state.anchor.nodeId === mealEntry.node.id && state.anchor.event === 'dep') return [];

      const mealArr = mealEntry.arr;
      return config.mealGuards.map(g => {
        const margin = g.loMin - mealArr;
        const warnWindow = g.warnBeforeLoMin || 60;
        const isRisk = margin < warnWindow;
        let statusTxt = '';
        if (margin < 0) {
          statusTxt = `❌ 已过 ${fmtTime(g.loMin)} 最后点单（LO），请勿前往！`;
        } else if (isRisk) {
          statusTxt = `⚠️ 距 ${fmtTime(g.loMin)} LO 仅剩 ${margin} 分钟！排队 >20 分即踩雷，不建议冒险`;
        } else {
          statusTxt = `✅ 营业安全（LO ${fmtTime(g.loMin)}）｜${g.note}`;
        }
        return { name: g.name, isRisk, statusTxt, note: g.note };
      });
    }

    // Build RFC 5545 .ics calendar content with dual VALARM triggers
    function buildIcsContent(sim) {
      const dateRaw = (config.date || '2026-11-25').replace(/-/g, '');
      const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const baseUrl = (location.origin + location.pathname).replace(/index\.html$/, '');

      const toLocalDT = min => {
        const clamped = Math.max(0, Math.min(1439, Math.round(min)));
        const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
        const mm = String(clamped % 60).padStart(2, '0');
        return `${dateRaw}T${hh}${mm}00`;
      };

      const events = [];
      const isTransit = config.mode === 'transit';

      // 1. Pre-flight check 10m before origin departure
      const depMin = config.defaultDepMin || 600;
      events.push({
        uid: `${config.tripId}-preflight@trip-copilot`,
        start: depMin - 10,
        end: depMin,
        summary: isTransit
          ? `🚨【开场防呆】${(config.gateLabels && config.gateLabels.icsPreflightTitle) || 'Suica余额核查＋拒理客引き＋准备开40分表'}`
          : `🚨【发车防呆】关Google Maps避开收费站＋确认ETC绿灯`,
        desc: `${config.tollReminder || ''}\\n${config.etcCashReminder || ''}\\n打开实时护航页：${baseUrl}?copilot=1`,
        url: `${baseUrl}?copilot=1`
      });

      // 2. Key checkpoints & must-depart redlines from current active schedule
      sim.timeline.forEach((item, idx) => {
        if (item.node.role === 'origin') {
          if (!isTransit) {
            // Add mid-way highway checkpoint 60 min after origin departure
            events.push({
              uid: `${config.tripId}-midcheck@trip-copilot`,
              start: item.dep + 60,
              end: item.dep + 70,
              summary: `📍【进度核查】发车1小时检查：是否已顺畅在高速主线上？`,
              desc: `若此时仍在地面道路/山路或预计晚点超25分钟，请副驾立即点开链接一键重排后续行程：${baseUrl}?copilot=1`,
              url: `${baseUrl}?copilot=1`
            });
          }
          return;
        }
        if (item.node.role === 'after') return;

        const checkUrl = `${baseUrl}?copilot=1&checkin=${encodeURIComponent(item.node.id)}`;
        if (item.stay > 0) {
          events.push({
            uid: `${config.tripId}-dep-${item.node.id}@trip-copilot`,
            start: item.dep - 5,
            end: item.dep + 5,
            summary: isTransit
              ? `⏰【离店防加钟死线 ${fmtTime(item.dep)}】立即结账离开 ${item.node.shortName || item.node.name}`
              : `⏰【发车死线 ${fmtTime(item.dep)}】请准备离开 ${item.node.shortName || item.node.name}`,
            desc: `计划 ${fmtTime(item.arr)} 到达，最晚必须 ${fmtTime(item.dep)} 离店/出发前往下一站，严防超时错过末班死线！\\n晚点一键重算：${checkUrl}`,
            url: checkUrl
          });
        } else if (item.node.role === 'destination') {
          events.push({
            uid: `${config.tripId}-dest-${item.node.id}@trip-copilot`,
            start: item.arr,
            end: item.arr + 15,
            summary: `🎯【终点死线 ${fmtTime(item.arr)}】抵达 ${item.node.shortName || item.node.name}`,
            desc: `${sim.headline}\\n打开护航控制台：${baseUrl}?copilot=1`,
            url: `${baseUrl}?copilot=1`
          });
        }
      });

      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//kenandxx//Trip Planning Live CoPilot v2//CN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${isTransit ? '🚆' : '🚗'} ${config.title || '行程实时护航死线闹钟'}`,
        'X-WR-TIMEZONE:Asia/Tokyo',
        'BEGIN:VTIMEZONE',
        'TZID:Asia/Tokyo',
        'BEGIN:STANDARD',
        'TZOFFSETFROM:+0900',
        'TZOFFSETTO:+0900',
        'TZNAME:JST',
        'DTSTART:19700101T000000',
        'END:STANDARD',
        'END:VTIMEZONE'
      ];

      events.forEach(ev => {
        lines.push(
          'BEGIN:VEVENT',
          `UID:${ev.uid}`,
          `DTSTAMP:${stamp}`,
          `DTSTART;TZID=Asia/Tokyo:${toLocalDT(ev.start)}`,
          `DTEND;TZID=Asia/Tokyo:${toLocalDT(Math.max(ev.start + 5, ev.end))}`,
          `SUMMARY:${escapeIcs(ev.summary)}`,
          `DESCRIPTION:${ev.desc}`,
          `URL:${ev.url}`,
          'BEGIN:VALARM',
          'TRIGGER:-PT15M',
          'ACTION:DISPLAY',
          `DESCRIPTION:⏳ 15分钟后：${escapeIcs(ev.summary)}`,
          'END:VALARM',
          'BEGIN:VALARM',
          'TRIGGER:PT0M',
          'ACTION:DISPLAY',
          `DESCRIPTION:🚨 到点强提醒：${escapeIcs(ev.summary)}`,
          'END:VALARM',
          'END:VEVENT'
        );
      });

      lines.push('END:VCALENDAR');
      return lines.join('\r\n');
    }

    function escapeIcs(s) {
      return String(s || '').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
    }

    function downloadIcs(sim) {
      if (isWeChat()) {
        showUrgentModal(
          'warn',
          '📱 请在 Safari / 默认浏览器中导入日历',
          '微信内置浏览器会拦截系统日历写入。请点击右上角「···」→「在默认浏览器中打开」，再点一次即可将全天关键死线双闹钟一键写入手机锁屏与 CarPlay！',
          null
        );
        return;
      }
      const ics = buildIcsContent(sim);
      if (isIOS() && !navigator.webdriver) {
        global.location.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
        showPageToast('正在唤起 iPhone 系统日历导入全部强提醒闹钟…');
        return;
      }
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.tripId || 'trip'}-deadlines.ics`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 600);
      showPageToast('已生成 .ics 死线闹钟文件，打开即可导入手机系统日历！');
    }

    // Push notifications: Bark (iOS) + ntfy.sh + PWA Service Worker Notification
    async function dispatchStrongNotifications(title, body, targetUrl, level) {
      const isCrit = level === 'err' && globalPrefs.barkLevel === 'critical';
      const results = [];

      // 1. PWA / Browser System Notification
      if ('Notification' in global && Notification.permission === 'granted') {
        try {
          if (swReg && swReg.active) {
            swReg.active.postMessage({
              type: 'SHOW_NOTIFICATION',
              title,
              urgent: level !== 'ok',
              url: targetUrl || location.href,
              options: { body }
            });
          } else {
            new Notification(title, { body });
          }
          results.push('系统通知');
        } catch (_) {}
      }

      // 2. iPhone Bark Push (supports multiple keys & critical bypass-mute ring!)
      const rawBark = (globalPrefs.barkKeys || '').trim();
      if (rawBark) {
        const entries = rawBark.split(/[\s,;]+/).filter(Boolean);
        for (const entry of entries) {
          let endpoint = 'https://api.day.app/push';
          let deviceKey = entry;
          const m = entry.match(/^(https?:\/\/[^/]+)\/([^/?#]+)/i);
          if (m) {
            endpoint = `${m[1]}/push`;
            deviceKey = m[2];
          }
          try {
            const payload = {
              device_key: deviceKey,
              title,
              body,
              group: '日本自驾护航',
              level: isCrit ? 'critical' : 'timeSensitive',
              volume: 10,
              url: targetUrl || location.href
            };
            if (isCrit) payload.call = '1';
            await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json; charset=utf-8' },
              body: JSON.stringify(payload)
            });
            results.push('Bark强推送');
          } catch (_) {}
        }
      }

      // 3. ntfy.sh Team Broadcast
      const topic = (globalPrefs.ntfyTopic || '').trim();
      if (topic) {
        try {
          await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
            method: 'POST',
            body: `${title}\n${body}`,
            headers: {
              Title: 'Trip Co-Pilot Alert',
              Priority: level === 'err' ? '5' : '4',
              Tags: level === 'err' ? 'rotating_light,car' : 'warning,car',
              Click: targetUrl || location.href
            }
          });
          results.push(`ntfy(${topic})`);
        } catch (_) {}
      }

      return results;
    }

    // Urgent Fullscreen Takeover Modal
    function showUrgentModal(level, title, bodyHtml, primaryAction) {
      const modal = document.getElementById('cp-urgent-modal');
      if (!modal) return;
      const box = modal.querySelector('.cp-modal-box');
      box.className = 'cp-modal-box' + (level === 'warn' ? ' warn' : '');
      modal.querySelector('.cp-modal-kicker').textContent =
        level === 'err' ? '🚨 严重延误・强提醒接管' : config.mode === 'transit' ? '⚠️ 节点与死线强提醒' : '⚠️ 行车进度风险提醒';
      modal.querySelector('h3').textContent = title;
      modal.querySelector('.cp-modal-body').innerHTML = bodyHtml;

      const actWrap = modal.querySelector('.cp-modal-actions');
      actWrap.innerHTML = '';

      if (primaryAction) {
        const pBtn = document.createElement('button');
        pBtn.type = 'button';
        pBtn.className = 'm-pri';
        pBtn.textContent = primaryAction.label;
        pBtn.addEventListener('click', () => {
          modal.classList.remove('show');
          primaryAction.onClick();
        });
        actWrap.appendChild(pBtn);
      }

      const ttsBtn = document.createElement('button');
      ttsBtn.type = 'button';
      ttsBtn.className = 'm-sec';
      ttsBtn.textContent = '🔊 语音播报当前风险与建议';
      ttsBtn.addEventListener('click', () => {
        playChime(level);
        speakZh(`${title}。${modal.querySelector('.cp-modal-body').textContent}`);
      });
      actWrap.appendChild(ttsBtn);

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'm-sec';
      closeBtn.textContent = '我知道了（查看下方重排方案）';
      closeBtn.addEventListener('click', () => modal.classList.remove('show'));
      actWrap.appendChild(closeBtn);

      modal.classList.add('show');
    }

    // Toggle Foreground WakeLock + Voice Watchdog
    async function toggleGuardMode(forceState) {
      const next = forceState != null ? forceState : !state.guardActive;
      state.guardActive = next;
      unlockAudio();

      if (next) {
        if (navigator.wakeLock) {
          try {
            wakeLockSentinel = await navigator.wakeLock.request('screen');
          } catch (_) {}
        }
        playChime('ok');
        speakZh('副驾护航已开启，屏幕将保持常亮，为您实时盯防发车红线与晚点风险。');
        showPageToast('🛡️ 副驾常亮护航已开启（含语音与死线巡检）');
        clearInterval(guardTimer);
        guardTimer = setInterval(runClockWatchdog, 30000);
      } else {
        if (wakeLockSentinel) {
          wakeLockSentinel.release().catch(() => {});
          wakeLockSentinel = null;
        }
        clearInterval(guardTimer);
        guardTimer = null;
        showPageToast('已关闭副驾常亮护航');
      }
      render();
    }

    // Periodic clock watchdog when Foreground Guard is ON
    function runClockWatchdog() {
      if (!state.guardActive) return;
      const sim = simulateSchedule({});
      const nowM = nowLocalMin();
      const firstAt = sim.timeline[0];
      if (!firstAt) return;

      // Warn 10m before departure deadline of current stop
      if (firstAt.stay > 0 && nowM >= firstAt.dep - 10 && nowM <= firstAt.dep + 2) {
        const sig = `dep10_${firstAt.node.id}_${firstAt.dep}`;
        if (state.lastAlertSig !== sig) {
          state.lastAlertSig = sig;
          const msg = `距离离开 ${firstAt.node.shortName || firstAt.node.name} 的建议发车时间 ${fmtTime(firstAt.dep)} 仅剩不到 10 分钟，请准备上车出发。`;
          playChime('warn');
          speakZh(msg);
          if (globalPrefs.autoBark) dispatchStrongNotifications('⏰ 10分钟发车提醒', msg, firstAt.node.navUrl, 'warn');
        }
      }
    }

    // Toggle Live GPS Monitoring
    function toggleGpsMode() {
      if (!('geolocation' in navigator)) {
        showPageToast('当前浏览器不支持 GPS 定位，请使用手动 1 秒打卡');
        return;
      }
      if (state.gpsActive) {
        stopGps();
        showPageToast('已停止实时 GPS 监测');
        render();
        return;
      }

      unlockAudio();
      state.gpsActive = true;
      state.gpsLastFixAt = null;
      state.gpsLastError = null;
      showPageToast('🛰️ 正在连接手机 GPS 定位监测…');
      render();
      startGpsFreshTicker();

      watchId = navigator.geolocation.watchPosition(
        pos => {
          state.gpsLastFixAt = Date.now();
          state.gpsLastError = null;
          handleGpsPosition(pos.coords);
        },
        err => {
          // PERMISSION_DENIED (1) is fatal: stop watching.
          // POSITION_UNAVAILABLE (2) / TIMEOUT (3) are transient (tunnel, subway, indoors):
          // the browser keeps the watch alive, so keep the UI "on" and show the stale state instead.
          if (err.code === 1) {
            stopGps();
            showPageToast('定位权限被拒绝：请在 设置 → 隐私与安全性 → 定位服务 → Safari 网站 中允许，并打开「精确位置」。现在可先用下方 1 秒打卡');
            render();
            return;
          }
          const firstError = !state.gpsLastError;
          state.gpsLastError = err.code === 3 ? '定位超时' : '暂时无法定位';
          if (firstError) showPageToast(`🛰️ GPS 信号弱（${state.gpsLastError}），继续搜索中…可先用下方 1 秒打卡`);
          updateGpsFreshness();
        },
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 }
      );
    }

    function stopGps() {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      watchId = null;
      if (gpsFreshTimer) clearInterval(gpsFreshTimer);
      gpsFreshTimer = null;
      state.gpsActive = false;
      state.gpsInfo = null;
      state.gpsLastFixAt = null;
      state.gpsLastError = null;
    }

    function startGpsFreshTicker() {
      if (gpsFreshTimer) clearInterval(gpsFreshTimer);
      gpsFreshTimer = setInterval(updateGpsFreshness, 5000);
    }

    // One glanceable status for the GPS pill. Plain words first; numbers only in `detail`.
    // level: 'wait' (connecting) | 'ok' (live) | 'weak' (poor accuracy) | 'lost' (no recent fix)
    function gpsFreshness() {
      const acc = state.gpsInfo ? state.gpsInfo.accuracy : null;
      const ageSec = gpsAgeSec();
      const ageTxt = ageSec == null ? '' : ageSec < 60 ? `${ageSec} 秒前` : `${Math.floor(ageSec / 60)} 分钟前`;
      const detail = ageSec == null
        ? (state.gpsLastError ? `尚未收到任何位置（${state.gpsLastError}）` : '尚未收到任何位置')
        : `最后更新 ${ageTxt} · 误差约 ${acc != null ? acc + 'm' : '未知'}`;
      if (ageSec == null) {
        return state.gpsLastError
          ? { level: 'lost', label: '搜不到信号', hint: '到站请先手动打卡', detail }
          : { level: 'wait', label: '正在连接…', hint: '', detail };
      }
      if (ageSec >= GPS_STALE_SEC) {
        return { level: 'lost', label: '信号中断', hint: '地下或室内时，到站请手动打卡', detail };
      }
      if (acc != null && acc > GPS_POOR_ACCURACY_M) {
        return { level: 'weak', label: '信号弱', hint: '位置可能偏差几百米', detail };
      }
      return { level: 'ok', label: '定位中', hint: '', detail };
    }

    function gpsAgeSec() {
      return state.gpsLastFixAt ? Math.max(0, Math.round((Date.now() - state.gpsLastFixAt) / 1000)) : null;
    }

    // True while GPS is on and the last fix is younger than GPS_STALE_SEC.
    function isGpsFresh() {
      const age = gpsAgeSec();
      return Boolean(state.gpsActive && state.gpsInfo && age != null && age < GPS_STALE_SEC);
    }

    let gpsShowDetail = false; // details (seconds / metres) hidden by default

    function gpsPillInner() {
      const f = gpsFreshness();
      return `<button type="button" class="cp-gps-pill ${f.level}" id="cp-gps-pill" aria-expanded="${gpsShowDetail}" title="点击查看详情">
          <span class="cp-gps-dot" aria-hidden="true"></span><b>${escapeHtml(f.label)}</b>${
            f.hint ? `<span class="cp-gps-hint">${escapeHtml(f.hint)}</span>` : ''
          }<span class="cp-gps-more" aria-hidden="true">${gpsShowDetail ? '▴' : '▾'}</span>
        </button>${gpsShowDetail ? `<div class="cp-gps-detail">${escapeHtml(f.detail)}</div>` : ''}`;
    }

    function gpsFreshHtml() {
      if (!state.gpsActive) return '';
      return `<div class="cp-gps-fresh" id="cp-gps-fresh">${gpsPillInner()}</div>`;
    }

    // Lightweight update of only the status pill (no full re-render every few seconds).
    function updateGpsFreshness() {
      const el = document.getElementById('cp-gps-fresh');
      if (!el || !state.gpsActive) return;
      const fresh = isGpsFresh();
      if (fresh !== lastRenderedGpsFresh) {
        // Fresh ↔ stale transition changes the delay verdict: do one full re-render.
        render();
        return;
      }
      el.innerHTML = gpsPillInner();
    }

    // Pill is re-created every few seconds, so handle its clicks by delegation.
    document.addEventListener('click', e => {
      if (!e.target.closest || !e.target.closest('#cp-gps-pill')) return;
      gpsShowDetail = !gpsShowDetail;
      updateGpsFreshness();
    });

    function handleGpsPosition(coords) {
      const { latitude: lat, longitude: lng, speed, accuracy } = coords;
      const speedKmh = speed != null && speed >= 0 ? Math.round(speed * 3.6) : null;

      // Find nearest active node & check geofence
      const sim = simulateSchedule({});
      let nearest = null;
      let minDist = Infinity;
      config.nodes.forEach(n => {
        if (n.lat == null || n.lng == null) return;
        const d = haversineKm(lat, lng, n.lat, n.lng);
        if (d < minDist) {
          minDist = d;
          nearest = n;
        }
      });

      // Arrived at any stop we still want to visit (order doesn't matter: plans change on the road)
      if (nearest && minDist <= (nearest.radiusKm || (config.mode === 'transit' ? 0.06 : 0.65)) && state.anchor.nodeId !== nearest.id &&
          !['origin', 'destination', 'after'].includes(nearest.role) && liveStatus(nearest) === 'want') {
        state.gpsInfo = { lat: lat.toFixed(4), lng: lng.toFixed(4), speedKmh, accuracy: Math.round(accuracy || 0),
          nearestName: `${nearest.shortName || nearest.name} (${minDist.toFixed(1)}km)`, remKm: null, liveDeltaMin: null, slowRoadWarn: false };
        recordCheckin(nearest.id, 'arr', nowLocalMin(), 'GPS 自动识别到站');
        return;
      }

      // Next upcoming node in current timeline
      const nextItem = sim.timeline.find(x => x.status === 'upcoming') || sim.timeline[0];
      let remKm = null;
      let liveDeltaMin = null;
      let slowRoadWarn = false;
      const nearestName = nearest ? `${nearest.shortName || nearest.name} (${minDist.toFixed(1)}km)` : '--';

      if (nextItem && nextItem.node.lat != null) {
        remKm = Math.round(haversineKm(lat, lng, nextItem.node.lat, nextItem.node.lng) * 10) / 10;
        // Geofence auto check-in if within radiusKm
        const rad = nextItem.node.radiusKm || (config.mode === 'transit' ? 0.06 : 0.65);
        if (remKm <= rad && state.anchor.nodeId !== nextItem.node.id) {
          state.gpsInfo = {
            lat: lat.toFixed(4),
            lng: lng.toFixed(4),
            speedKmh,
            accuracy: Math.round(accuracy || 0),
            nearestName,
            remKm,
            liveDeltaMin: null,
            slowRoadWarn: false
          };
          recordCheckin(nextItem.node.id, 'arr', nowLocalMin(), 'GPS 围栏自动识别到站');
          return;
        }

        // Estimate remaining drive time at realistic speed (default 58 km/h highway or live speed)
        const estSpeed = speedKmh && speedKmh > 18 ? Math.min(85, Math.max(25, speedKmh)) : 55;
        const estRemMin = Math.round(((remKm * 1.28) / estSpeed) * 60);
        const liveEta = nowLocalMin() + estRemMin;
        const baseTarget = baselineMap[nextItem.node.id];
        if (baseTarget) {
          liveDeltaMin = liveEta - baseTarget.arr;
        }
        if (speedKmh != null && speedKmh > 5 && speedKmh < 32 && remKm > 22) {
          slowRoadWarn = true;
        }
      }

      state.gpsInfo = {
        lat: lat.toFixed(4),
        lng: lng.toFixed(4),
        speedKmh,
        accuracy: Math.round(accuracy || 0),
        nearestName,
        remKm,
        liveDeltaMin,
        slowRoadWarn
      };
      render();
    }

    // Core action: Check-in at a node or bump delay
    function recordCheckin(nodeId, eventType, timeMin, reason) {
      unlockAudio();
      const prevAnchor = state.anchor;
      const isStop = id => {
        const n = config.nodes.find(x => x.id === id);
        return n && !['origin', 'destination', 'after'].includes(n.role);
      };
      if (prevAnchor && prevAnchor.event === 'arr' && prevAnchor.nodeId !== nodeId && isStop(prevAnchor.nodeId)) {
        state.live.status[prevAnchor.nodeId] = 'done';
      }
      if (eventType === 'dep' && isStop(nodeId)) state.live.status[nodeId] = 'done';
      if (eventType === 'arr' && isStop(nodeId) && state.live.status[nodeId] !== 'done') state.live.status[nodeId] = 'want';
      if (eventType === 'arr') state.live.hereMode = 'full';
      state.anchor = {
        nodeId,
        event: eventType,
        timeMin,
        extraDelayMin: 0,
        reason: reason || (eventType === 'arr' ? '手动到站打卡' : '手动发车打卡')
      };
      state.emergencyMode = false;
      state.activePlanId = 'current';

      // Learn observed pace if checking in arrival from origin departure
      const origBase = baselineMap[config.nodes[0].id];
      const curBase = baselineMap[nodeId];
      if (eventType === 'arr' && origBase && curBase && curBase.arr > origBase.dep) {
        const expected = curBase.arr - origBase.dep;
        const actual = timeMin - (prevAnchor.nodeId === config.nodes[0].id ? prevAnchor.timeMin : origBase.dep);
        if (actual > 15 && expected > 15) {
          state.observedPace = Math.round(Math.min(2.4, Math.max(0.85, actual / expected)) * 100) / 100;
        }
      }

      saveState();
      const sim = simulateSchedule({});
      const delay = getDelayVsBaseline();
      const proposals = generateReplanProposals(sim, delay);
      render();

      if (sim.riskLevel === 'err' || delay >= 45) {
        playChime('err');
        const best = proposals[0];
        const speech = `注意！当前进度比原计划滞后 ${delay} 分钟。${sim.headline} 系统已为您生成 ${proposals.length} 套救援重排方案，首推${best ? best.name : '调整行程'}。`;
        speakZh(speech);
        if (globalPrefs.autoBark) {
          dispatchStrongNotifications(
            `🚨 行程晚点 +${delay}分｜请立即查看重排方案`,
            `${sim.headline}${best ? ' 👉 推荐：' + best.summary : ''}`,
            best && best.sim.timeline[1] ? best.sim.timeline[1].node.navUrl : location.href,
            'err'
          );
        }
        showUrgentModal(
          'err',
          `晚点 +${delay} 分钟！原计划将危及关键死线`,
          `<p style="margin:0 0 8px">${sim.headline}</p>` +
            (!state.preFlight.tollsOn
              ? `<p style="margin:0 0 8px;color:var(--cp-err);font-weight:700">${
                  config.modalTrapWarn ||
                  (config.mode === 'transit'
                    ? '⚠️ 切记：下一家若等位 >5 分钟或被自动延长将直接错过末班安全电车！'
                    : '⚠️ 请优先检查 Google Maps 是否误开了「避开收费公路」（未走ETC高速）！')
                }</p>`
              : '') +
            (best ? `<p style="margin:0"><b>💡 推荐一键救援：</b>${best.summary}</p>` : ''),
          best
            ? {
                label: `✅ 立即启用：${best.name.replace(/^.*?：/, '')}`,
                onClick: () => applyProposal(best)
              }
            : null
        );
      } else if (sim.riskLevel === 'warn' || delay >= 20) {
        playChime('warn');
        speakZh(`轻度滞后 ${delay} 分钟。${sim.headline}`);
      } else {
        playChime('ok');
        showPageToast(`✅ 已打卡：${fmtTime(timeMin)}（进度非常稳健！）`);
      }
    }

    function applyProposal(prop) {
      unlockAudio();
      if (prop.patch.enabledNodes) state.enabledNodes = Object.assign({}, prop.patch.enabledNodes);
      if (prop.patch.stayOverrides) state.stayOverrides = Object.assign({}, prop.patch.stayOverrides);
      if (prop.patch.paceFactor != null) state.paceFactor = prop.patch.paceFactor;
      state.emergencyMode = Boolean(prop.patch.emergencyMode);
      state.activePlanId = prop.id;
      saveState();

      if (typeof config.onApplyPlan === 'function') {
        try {
          config.onApplyPlan({
            enabledNodes: state.enabledNodes,
            stayOverrides: state.stayOverrides,
            paceFactor: state.paceFactor,
            emergencyMode: state.emergencyMode,
            sim: prop.sim
          });
        } catch (_) {}
      }

      playChime('ok');
      showPageToast(`✅ 已切换至新方案：${prop.name}`);
      if (globalPrefs.autoBark) {
        const nextLeg = prop.sim.timeline.find(x => x.status === 'upcoming');
        dispatchStrongNotifications(
          `🔄 已启用新行程方案`,
          `${prop.summary}`,
          (nextLeg && nextLeg.node.navUrl) || location.href,
          'ok'
        );
      }
      render();
    }

    function copyAdjustedWeChatSummary(sim, label) {
      const lines = [
        `📢【实时行程动态更新｜${label || '最新重排方案'}】`,
        `${sim.headline}`
      ];
      if (sim.emergency && sim.emSpec) {
        lines.push(`• 路线调整：${sim.emSpec.desc}`);
        lines.push(
          sim.emSpec.wxEtaLineFn
            ? sim.emSpec.wxEtaLineFn(fmtTime(sim.destArr))
            : `• 预计抵成田航站楼：${fmtTime(sim.destArr)}（下车直接办值机！）`
        );
        lines.push(`• 一键导航终点：${sim.emSpec.navUrl}`);
      } else {
        sim.timeline.forEach(item => {
          const n = item.node;
          if (item.stay > 0) {
            lines.push(`• ${fmtTime(item.arr)}–${fmtTime(item.dep)} ${n.shortName || n.name}（停${item.stay}分）`);
          } else {
            lines.push(`• ${fmtTime(item.arr)} ${n.shortName || n.name}`);
          }
        });
        if (sim.matchedTrain) {
          lines.push(`🚆 衔接列车：${sim.matchedTrain.name}（缓冲 ${sim.bufferMin} 分钟）`);
        }
      }
      lines.push(`🧭 实时护航与一键导航：${location.origin}${location.pathname}`);
      const txt = lines.join('\n');
      if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
      showPageToast('📋 已复制最新调整版微信群通知！');
    }

    // Build Context-Rich Prompt for AI Deep Replanning
    function buildAiEmergencyPrompt(sim, delayMin, customWish) {
      const isTransit = config.mode === 'transit';
      const aNode = config.nodes.find(n => n.id === state.anchor.nodeId) || config.nodes[0];
      const gpsStale = state.gpsInfo && !isGpsFresh();
      const gpsStr = state.gpsInfo
        ? `GPS (${state.gpsInfo.lat}, ${state.gpsInfo.lng})，邻近 ${state.gpsInfo.nearestName}，移动速度 ${state.gpsInfo.speedKmh != null ? state.gpsInfo.speedKmh + 'km/h' : '未知'}${
            gpsStale ? `（注意：这是 ${gpsAgeSec() ?? '?'} 秒前的旧定位，可能已不准）` : ''
          }`
        : `打卡节点「${aNode.name}」（坐标约 ${aNode.lat}, ${aNode.lng}）`;

      const doneList = config.nodes
        .slice(0, config.nodes.findIndex(n => n.id === state.anchor.nodeId) + 1)
        .map(n => n.shortName || n.name)
        .join(' → ');

      const remList = sim.timeline
        .map(x => `${fmtTime(x.arr)} ${x.node.shortName || x.node.name}${x.stay ? `(停${x.stay}m)` : ''}`)
        .join(' → ');

      const constraints = isTransit
        ? [
            `- 交通画像：全程电车＋步行（兜底可叫首都高/近站出租车），严禁推荐容易迷路的跨站地下长通道换乘！`,
            `- 夜生活/门店防坑铁律：严禁跟随街头客引き（拉客），严控单店 1セット 40分（入座即定30分闹钟喊「延長なしで先会計」防自动加钟）！`,
            `- 导航与乘换格式：每段必须附带可直接点击的 Google Maps 官方 URL（travelmode=walking 或 travelmode=transit），并注明精确站台/改札口与最晚发车时刻！`
          ]
        : [
            `- 驾驶画像：严格跟着导航开，只走宽阔双车道/高速（已开启ETC），绝对避开狭窄小巷、陡坡山路、复杂掉头！`,
            `- 停车铁律：若推荐替代餐厅/咖啡/休息站，必须核实今日营业、未过 L.O. 且有宽敞平地停车场（或高速SA/PA）。`,
            `- 导航链接格式：每一段必须附带可直接点击的 Google Maps 官方 URL（https://www.google.com/maps/dir/?api=1&destination=...&travelmode=driving），禁止把隧道口/高速匝道设为终点，SA/PA 只写设施名+上下行方向绝不带门牌号！`
          ];

      return [
        `你现在是我的【${isTransit ? '日本电车换乘＆严卡死线实时护航救急专家' : '日本自驾行中实时副驾救急专家'}】。请基于我们当前的真实延误与位置，立即给出最优后续调整方案：`,
        ``,
        `1. 【当前实况】`,
        `- 日期与行程：${config.date}｜${config.title}`,
        `- 当前真实时间锚点：${fmtTime(state.anchor.timeMin + (state.anchor.extraDelayMin || 0))}（状态：${state.anchor.event === 'arr' ? '刚到达' : '刚离开'}「${aNode.shortName || aNode.name}」，较原计划偏差 ${delayMin >= 0 ? '+' + delayMin : delayMin} 分钟）`,
        `- 当前位置：${gpsStr}`,
        `- 实测/设定节奏系数：${state.observedPace ? `前半段实测 ${state.observedPace}x / ` : ''}后续设定 ${state.paceFactor}x`,
        `- 已走进度：${doneList}`,
        `- 当前推演剩余时间线：${remList}`,
        `- 系统风险判定：${sim.headline}`,
        customWish ? `- 💬 我们的临时新诉求：${customWish}` : `- 💬 诉求：在绝不耽误核心硬死线的前提下，给出最省时、不踩雷、零容错的后续取舍与替代建议`,
        ``,
        `2. 【绝对硬约束（必须遵守）】`,
        ...constraints,
        ``,
        `请直接输出：① 一句话止损结论；② 精确到分钟的新时间表；③ 每段一键 Google Maps 链接与 1 秒防错核对。`
      ].join('\n');
    }

    async function callInlineAi(promptText, outEl, btnEl) {
      const key = (globalPrefs.llmApiKey || '').trim();
      if (!key) {
        showPageToast('请先填入 Gemini / OpenAI 兼容 API Key，或直接点左边的「一键复制并打开 ChatGPT/Claude」');
        return;
      }
      btnEl.disabled = true;
      btnEl.textContent = '⏳ AI 正在结合实时坐标重算…';
      outEl.style.display = 'block';
      outEl.textContent = '正在请求实时大模型生成改道方案…';
      try {
        const res = await fetch(globalPrefs.llmEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`
          },
          body: JSON.stringify({
            model: globalPrefs.llmModel || 'gemini-2.5-flash',
            messages: [{ role: 'user', content: promptText }],
            temperature: 0.3
          })
        });
        const data = await res.json();
        const reply =
          (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ||
          (data.error && data.error.message) ||
          JSON.stringify(data);
        outEl.textContent = reply;
      } catch (e) {
        outEl.textContent = `请求失败（${e.message}）。建议直接点击「复制急救指令」粘贴到手机 ChatGPT / Claude / Gemini App！`;
      } finally {
        btnEl.disabled = false;
        btnEl.textContent = '⚡ 网页内直连 AI 秒出方案';
      }
    }

    // Build persistent DOM skeleton (Dock + Urgent Modal) once
    ensureGlobalOverlays();

    function ensureGlobalOverlays() {
      document.body.classList.add('has-cp-dock');
      if (!document.getElementById('cp-dock')) {
        const dock = document.createElement('div');
        dock.className = 'cp-dock';
        dock.id = 'cp-dock';
        dock.innerHTML = `
          <div class="cp-dock-inner">
            <div class="cp-dock-status" id="cp-dock-jump" title="点击跳至实时护航与重排控制台">
              <div><span class="cp-dock-badge" id="cp-dock-badge">🟢 准点待命</span></div>
              <div class="cp-dock-sub" id="cp-dock-sub">点右侧「打卡」汇报进度，晚点自动生成3套新方案</div>
            </div>
            <div class="cp-dock-btns">
              <button type="button" class="cp-dock-btn pri" id="cp-dock-checkin">📍 1秒打卡</button>
              <button type="button" class="cp-dock-btn" id="cp-dock-guard">🛡️ 护航</button>
            </div>
          </div>`;
        document.body.appendChild(dock);

        document.getElementById('cp-dock-jump').addEventListener('click', () => {
          mount.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        document.getElementById('cp-dock-checkin').addEventListener('click', () => {
          mount.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => {
            const sel = document.getElementById('cp-node-sel');
            if (sel) sel.focus();
          }, 350);
        });
        document.getElementById('cp-dock-guard').addEventListener('click', () => toggleGuardMode());
      }

      if (!document.getElementById('cp-urgent-modal')) {
        const modal = document.createElement('div');
        modal.className = 'cp-modal';
        modal.id = 'cp-urgent-modal';
        modal.setAttribute('role', 'alertdialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
          <div class="cp-modal-box">
            <div class="cp-modal-kicker">🚨 强提醒</div>
            <h3>行程风险预警</h3>
            <div class="cp-modal-body"></div>
            <div class="cp-modal-actions"></div>
          </div>`;
        document.body.appendChild(modal);
      }
    }

    // ===== Live reverse planner ("此刻导航") =====
    // Assumes nothing went to plan: starts from where we are NOW (GPS, or the last check-in place),
    // works back from the final deadline, and searches every combination of the remaining stops.
    const STOP_ROLES_EXCLUDED = ['origin', 'destination', 'after'];
    const stopNodes = () => config.nodes.filter(n => !STOP_ROLES_EXCLUDED.includes(n.role));
    const destNode = () =>
      config.nodes.find(n => n.id === ((config.deadlineSpec && config.deadlineSpec.destNodeId) || 'dest')) ||
      config.nodes.filter(n => n.role === 'destination').pop() ||
      config.nodes[config.nodes.length - 1];

    function liveStatus(n) {
      const st = state.live.status[n.id];
      if (st) return st;
      return n.role === 'meal' || state.enabledNodes[n.id] ? 'want' : 'skip';
    }

    function estimateLegMin(km) {
      const pace = state.paceFactor || 1;
      let m;
      if (config.mode === 'transit') m = km <= 1.5 ? (km * 1.25 / 4.8) * 60 : 8 + (km * 1.3 / 25) * 60;
      else m = 3 + (km * 1.3 / (km > 20 ? 70 : 35)) * 60;
      return Math.max(1, Math.round(m * pace));
    }

    // Minutes from a to b. a/b are nodes or { lat, lng } points.
    function legMin(a, b) {
      if (a.id && b.id) {
        if (a.id === b.id) return 0;
        const map = config.directDriveMap || {};
        const base = map[`${a.id}->${b.id}`] != null ? map[`${a.id}->${b.id}`] : map[`${b.id}->${a.id}`];
        if (base != null) return Math.max(1, Math.round(base * (state.paceFactor || 1)));
      }
      if (a.lat == null || b.lat == null) return 15;
      return estimateLegMin(haversineKm(a.lat, a.lng, b.lat, b.lng));
    }

    function deadlineFor(destArr) {
      const d = config.deadlineSpec || {};
      if (d.trains && d.trains.length) {
        const buf = d.transferBufferMin || 10;
        const last = d.trains[d.trains.length - 1];
        const train = d.trains.find(tr => tr.dep >= destArr + buf) || null;
        return { hard: last.dep - buf, target: d.targetArrMin || last.dep - buf, train, hardLabel: `赶 ${fmtTime(last.dep)} 末班` };
      }
      const hard = d.hardArrMin || 1080;
      return { hard, target: d.targetArrMin || hard, train: null, hardLabel: `${fmtTime(hard)} 最晚红线` };
    }

    // Where are we, and are we in the middle of a stop?
    function liveStart(now) {
      const a = state.anchor;
      const aNode = config.nodes.find(n => n.id === a.nodeId) || config.nodes[0];
      const aTime = a.timeMin + (a.extraDelayMin || 0);
      const gps = isGpsFresh() ? { lat: +state.gpsInfo.lat, lng: +state.gpsInfo.lng } : null;
      const nearAnchor = !gps || aNode.lat == null || haversineKm(gps.lat, gps.lng, aNode.lat, aNode.lng) <= (aNode.radiusKm || 0.35);
      const inStop =
        a.event === 'arr' && !STOP_ROLES_EXCLUDED.includes(aNode.role) && liveStatus(aNode) !== 'done' && liveStatus(aNode) !== 'skip' && nearAnchor;
      return {
        here: inStop ? aNode : null,
        hereArr: inStop ? aTime : null,
        pos: inStop ? aNode : gps || aNode,
        source: gps ? 'gps' : 'checkin',
        aNode,
        aTime,
        aEvent: a.event
      };
    }

    function simulateLive(start, now, stops, stayMode, hereMode) {
      const legs = [];
      let t = now;
      let pos = start.pos;
      if (start.here) {
        const n = start.here;
        const want = hereMode === 'now' ? 0 : hereMode === 'min' ? n.minStayMin || n.stayMin || 0 : n.stayMin || 0;
        const leave = Math.max(now, start.hereArr + want);
        legs.push({ node: n, arr: start.hereArr, dep: leave, here: true });
        t = leave;
      }
      stops.forEach(n => {
        const arr = t + legMin(pos, n);
        const stay = stayMode === 'min' ? n.minStayMin || n.stayMin || 0 : n.stayMin || 0;
        legs.push({ node: n, arr, dep: arr + stay, stay });
        t = arr + stay;
        pos = n;
      });
      const dest = destNode();
      const destArr = t + legMin(pos, dest);
      const dl = deadlineFor(destArr);
      return { legs, lastDep: t, lastNode: pos, destArr, slack: dl.hard - destArr, dl, stops, stayMode, hereMode };
    }

    function routeScore(r) {
      let s = 0;
      r.stops.forEach(n => {
        s += n.role === 'meal' || n.role === 'core' ? 10 : 3;
        if (r.stayMode === 'full') s += 1;
      });
      // The stop we're in counts like a visit; walking out before its minimum stay throws it away.
      const h = r.legs[0] && r.legs[0].here ? r.legs[0] : null;
      if (h) {
        const minStay = h.node.minStayMin || h.node.stayMin || 0;
        if (r.hereMode === 'full') s += 11;
        else if (r.hereMode === 'min') s += 10;
        else if (h.dep - h.arr >= minStay) s += 10;
      }
      if (r.destArr <= r.dl.target) s += 0.5;
      return s;
    }

    function computeLive() {
      const now = nowLocalMin();
      const start = liveStart(now);
      const want = stopNodes().filter(n => liveStatus(n) === 'want' && (!start.here || n.id !== start.here.id));
      const plannedStay = state.live.stayMode || 'full';
      const plannedHere = start.here ? state.live.hereMode || 'full' : null;
      const planned = simulateLive(start, now, want, plannedStay, plannedHere);

      const cands = [];
      const n = want.length;
      for (let mask = 0; mask < 1 << n; mask++) {
        const sub = want.filter((_, i) => mask & (1 << i));
        ['full', 'min'].forEach(sm => {
          (start.here ? ['full', 'min', 'now'] : [null]).forEach(hm => cands.push(simulateLive(start, now, sub, sm, hm)));
        });
      }
      const pick = list => list.slice().sort((x, y) => routeScore(y) - routeScore(x) || y.slack - x.slack)[0];
      const safe = cands.filter(r => r.slack >= LIVE_SAFE_MIN);
      const ok = cands.filter(r => r.slack >= 0);
      const bestSafe = safe.length ? pick(safe) : null;
      const bestTight = ok.length ? pick(ok) : null;
      const best = bestSafe || bestTight || cands.slice().sort((x, y) => y.slack - x.slack)[0];
      // Offer the tight option too when it buys more than the safe one
      const tight = bestTight && bestSafe && routeScore(bestTight) > routeScore(bestSafe) ? bestTight : null;

      // Money-for-time fallback (e.g. taxi): keep the planned stops, go direct from the last one.
      let fallback = null;
      const em = config.deadlineSpec && config.deadlineSpec.emergencyDirect;
      if (em && planned.slack < 0) {
        const fromId = planned.lastNode && planned.lastNode.id;
        const drv = Math.round(((em.driveFrom && (em.driveFrom[fromId] || Object.values(em.driveFrom)[0])) || 45) * (em.fixedPace || 1));
        const arr = planned.lastDep + drv;
        const lim = em.safeAirportArrMin || (config.deadlineSpec.hardArrMin || 1320);
        fallback = { name: em.cardName || em.title || '直达兜底', badge: em.shortBadge || '直达兜底', arr, slack: lim - arr, navUrl: em.navUrl };
      }
      return { now, start, want, planned, best, tight, fallback, bestIsPlanned: sameRoute(best, planned) };
    }

    function sameRoute(a, b) {
      return (
        a && b && a.stayMode === b.stayMode && a.hereMode === b.hereMode &&
        a.stops.map(s => s.id).join() === b.stops.map(s => s.id).join()
      );
    }

    function describeRoute(r) {
      const nm = x => escapeHtml(x.shortName || x.name);
      const parts = r.legs.map(l =>
        l.here
          ? `${nm(l.node)}${r.hereMode === 'now' ? '（马上走）' : `（待到 ${fmtTime(l.dep)}）`}`
          : `${nm(l.node)}${r.stayMode === 'min' ? `（缩短到 ${l.stay} 分）` : ''}`
      );
      const dest = destNode();
      if (!r.stops.length && !r.legs.some(l => l.here)) parts.push('不去店了，直接去');
      parts.push(`${nm(dest)} <b>${fmtTime(r.destArr)}</b>`);
      const train = r.dl.train ? ` → ${escapeHtml(r.dl.train.finalBadge || r.dl.train.name)}` : '';
      return parts.join(' → ') + train;
    }

    function applyLiveRoute(r) {
      const keep = new Set(r.stops.map(s => s.id));
      stopNodes().forEach(n => {
        if (liveStatus(n) === 'want' && !keep.has(n.id) && !(r.legs[0] && r.legs[0].here && r.legs[0].node.id === n.id)) {
          state.live.status[n.id] = 'skip';
        }
      });
      state.live.stayMode = r.stayMode;
      state.live.hereMode = r.hereMode || 'full';
      state.live.appliedAt = nowLocalMin();
      saveState();
      playChime('ok');
      showPageToast(`✅ 已启动重算方案：${fmtTime(r.destArr)} 到终点，余裕 ${r.slack} 分`);
      render();
    }

    function cycleStopStatus(id) {
      const n = config.nodes.find(x => x.id === id);
      if (!n) return;
      const start = liveStart(nowLocalMin());
      if (start.here && start.here.id === id) {
        // here → done (we just left)
        state.live.status[id] = 'done';
        recordCheckin(id, 'dep', nowLocalMin(), '手动标记离开');
        return;
      }
      const st = liveStatus(n);
      if (st === 'want') {
        recordCheckin(id, 'arr', nowLocalMin(), '手动标记：我在这');
        return;
      }
      state.live.status[id] = st === 'done' ? 'skip' : 'want';
      saveState();
      render();
    }

    let lastNowCard = null;
    const LIVE_SAFE_MIN = 5; // recommended plans keep at least this much buffer when possible

    function buildNowCard() {
      const L = computeLive();
      const { now, start, planned, best, tight, fallback } = L;
      const nm = x => escapeHtml(x.shortName || x.name);
      const slack = planned.slack;
      const lvl = slack < 0 ? 'err' : slack < 10 ? 'warn' : 'ok';
      const big = slack >= 0 ? `余裕 ${slack} 分钟` : `落后 ${-slack} 分钟`;
      const dl = planned.dl;
      const dest = destNode();

      // Where
      let whereTxt;
      if (start.here) whereTxt = `在「${nm(start.here)}」（${fmtTime(start.hereArr)} 到）`;
      else if (start.source === 'gps') whereTxt = `GPS 定位中（最近的站点：${escapeHtml(state.gpsInfo.nearestName)}）`;
      else whereTxt = `假设在「${nm(start.aNode)}」（最后打卡 ${fmtTime(start.aTime)}）`;
      if (start.source !== 'gps') whereTxt += `<span class="cp-now-sub">${state.gpsActive ? 'GPS 信号中断，' : ''}不对的话点下面的站标「我在这」，或打开 GPS</span>`;

      // Plan label
      const planLbl = state.live.appliedAt != null ? `重算方案（${fmtTime(state.live.appliedAt)} 启动）` : '原定计划（按现在位置重算）';

      // Next action
      const first = planned.legs.find(l => !l.here);
      let doTxt;
      let navNode;
      if (planned.legs[0] && planned.legs[0].here) {
        const h = planned.legs[0];
        const nextName = first ? nm(first.node) : nm(dest);
        navNode = first ? first.node : dest;
        doTxt =
          h.dep <= now
            ? `<b>现在离开</b>「${nm(h.node)}」，去「${nextName}」`
            : `在「${nm(h.node)}」待到 <b>${fmtTime(h.dep)}</b>（还剩 ${h.dep - now} 分），然后去「${nextName}」`;
        if (slack > 0) doTxt += `<span class="cp-now-sub">最晚可拖到 ${fmtTime(h.dep + slack)} 再走</span>`;
      } else if (first) {
        navNode = first.node;
        doTxt = `去「${nm(first.node)}」，约 <b>${fmtTime(first.arr)}</b> 到`;
        if (slack > 0) doTxt += `<span class="cp-now-sub">最晚 ${fmtTime(now + slack)} 前出发都来得及</span>`;
      } else {
        navNode = dest;
        doTxt = `去「${nm(dest)}」，约 <b>${fmtTime(planned.destArr)}</b> 到${dl.train ? `，坐 ${escapeHtml(dl.train.name)}` : ''}`;
        if (slack > 0) doTxt += `<span class="cp-now-sub">最晚 ${fmtTime(now + slack)} 前出发</span>`;
      }
      const navBtn = navNode && navNode.navUrl
        ? `<a class="cp-now-nav" href="${navNode.navUrl}" target="_blank" rel="noopener">🧭 导航去「${nm(navNode)}」</a>`
        : '';

      // Stop chips
      const chips = stopNodes()
        .map(n => {
          const isHere = start.here && start.here.id === n.id;
          const st = isHere ? 'here' : liveStatus(n);
          const lbl = { here: '📍 在这', want: '要去', done: '✔ 已去', skip: '不去' }[st];
          return `<button type="button" class="cp-now-chip ${st}" data-stop="${escapeAttr(n.id)}"><b>${nm(n)}</b> ${lbl}</button>`;
        })
        .join('');

      // Alternative
      let altHtml = '';
      if (slack < 0 || !L.bestIsPlanned) {
        if (best && best.slack >= 0 && !L.bestIsPlanned) {
          altHtml = `<div class="cp-now-rec">
              <div><b>${slack < 0 ? '来不及！改成这样：' : '更稳的走法：'}</b></div>
              <div class="cp-now-route">${describeRoute(best)}</div>
              <div class="cp-now-rec-sum">余裕 ${best.slack} 分钟${best.destArr <= best.dl.target ? '（赶得上理想班次）' : ''}</div>
              <button type="button" class="cp-plan-apply" data-live-apply="best">▶ 启动这个方案</button>
            </div>`;
          if (tight && !sameRoute(tight, planned)) {
            altHtml += `<div class="cp-now-rec">
              <div><b>⚡ 压哨版（玩得更多，但几乎没余裕）：</b></div>
              <div class="cp-now-route">${describeRoute(tight)}</div>
              <div class="cp-now-rec-sum">余裕只有 ${tight.slack} 分钟，排队、结账慢一点就会错过</div>
              <button type="button" class="cp-plan-apply" data-live-apply="tight">▶ 启动压哨版</button>
            </div>`;
          }
        } else if (slack < 0) {
          altHtml = `<div class="cp-now-rec"><b>所有走法都来不及${dl.hardLabel}</b>，最好的是：<div class="cp-now-route">${describeRoute(best)}</div></div>`;
        }
        if (fallback) {
          altHtml += `<div class="cp-now-rec">
              <div><b>💴 花钱换时间：</b>${escapeHtml(fallback.name)}</div>
              <div class="cp-now-rec-sum">保留全部安排，约 ${fmtTime(fallback.arr)} 到终点（${fallback.slack >= 0 ? `余裕 ${fallback.slack} 分` : `仍晚 ${-fallback.slack} 分`}）</div>
              ${fallback.navUrl ? `<a class="cp-now-more" href="${fallback.navUrl}" target="_blank" rel="noopener">查看路线</a>` : ''}
            </div>`;
        }
      }

      const html = `<div class="cp-now ${lvl}" id="cp-now">
          <div class="cp-now-hd"><span>🧭 此刻导航</span><span class="cp-now-clock">现在 ${fmtTime(now)}</span></div>
          <div class="cp-now-prog">${big}</div>
          <div class="cp-now-why">从终点倒推：${escapeHtml(dl.hardLabel)}，最晚 ${fmtTime(dl.hard)} 到「${nm(dest)}」</div>
          <div class="cp-now-row"><span class="k">方案</span><span>${planLbl}<span class="cp-now-route">${describeRoute(planned)}</span></span></div>
          <div class="cp-now-row"><span class="k">位置</span><span>${whereTxt}</span></div>
          <div class="cp-now-row"><span class="k">现在做</span><span>${doTxt}</span></div>
          <div class="cp-now-btns">${navBtn}</div>
          ${altHtml}
          <div class="cp-now-row"><span class="k">各站</span><span class="cp-now-chips">${chips}<span class="cp-now-sub">点一下切换：要去 → 📍在这 → ✔已去 → 不去</span></span></div>
        </div>`;
      return { html, L };
    }

    // Main Render
    function render() {
      lastRenderedGpsFresh = isGpsFresh();
      const nowCard = buildNowCard();
      lastNowCard = nowCard;
      const sim = simulateSchedule({});
      const delayMin = getDelayVsBaseline();
      const showReplan = sim.riskLevel !== 'ok' || delayMin >= 20 || state.activePlanId !== 'current' || state.emergencyMode;
      const proposals = showReplan ? generateReplanProposals(sim, delayMin) : [];
      const mealAlerts = evaluateMealGuards(sim);
      const allLockedReady = state.preFlight.tollsOn && state.preFlight.etcReady;
      const customWishVal = (document.getElementById('cp-ai-wish') && document.getElementById('cp-ai-wish').value) || '';
      const aiPrompt = buildAiEmergencyPrompt(sim, delayMin, customWishVal);

      // Preserve open state of <details> folds across re-renders
      const openAlertsFold = document.getElementById('cp-fold-alerts')?.open || false;
      const openAiFold = document.getElementById('cp-fold-ai')?.open || false;
      const curTimeInput =
        document.getElementById('cp-time-input')?.value ||
        fmtTime(state.anchor.timeMin + (state.anchor.extraDelayMin || 0));
      const curSelectedNode = document.getElementById('cp-node-sel')?.value || suggestNextCheckinNodeId();

      const delayBadgeCls = sim.riskLevel === 'err' ? 'err' : sim.riskLevel === 'warn' || delayMin >= 25 ? 'warn' : 'ok';
      const delaySign = delayMin > 0 ? `+${delayMin}分` : delayMin < 0 ? `${delayMin}分` : '准点 ±0分';

      // Update Sticky Bottom Dock
      const dockBadge = document.getElementById('cp-dock-badge');
      const dockSub = document.getElementById('cp-dock-sub');
      const dockGuard = document.getElementById('cp-dock-guard');
      if (dockBadge) {
        const ls = nowCard.L.planned.slack;
        dockBadge.className = `cp-dock-badge ${ls < 0 ? 'err' : ls < 10 ? 'warn' : 'ok'}`;
        dockBadge.textContent = ls >= 0 ? `${ls < 10 ? "🟡" : "🟢"} 余裕 ${ls} 分` : `🔴 落后 ${-ls} 分・点看改法`;
      }
      if (dockSub) {
        const lp = nowCard.L.planned;
        dockSub.textContent = `按现在位置倒推：约 ${fmtTime(lp.destArr)} 到终点（${lp.dl.hardLabel}）`;
      }
      if (dockGuard) {
        dockGuard.className = 'cp-dock-btn' + (state.guardActive ? ' guard-on' : '');
        dockGuard.textContent = state.guardActive ? '🛡️ 护航中' : '🛡️ 开启护航';
      }

      // Replay scenarios bar (e.g., 11/25 post-mortem test!)
      const replayHtml =
        config.replayScenarios && config.replayScenarios.length
          ? `<div class="cp-replay-bar">
              <div class="cp-replay-title">
                <span>🧪 实况痛点演练 / 一键复盘模拟（点一下立即测试风险预警与自动重排）</span>
              </div>
              <div class="cp-replay-btns">
                ${config.replayScenarios
                  .map(
                    (sc, idx) =>
                      `<button type="button" class="cp-chip ${sc.cls || ''}" data-replay="${idx}">${sc.label}</button>`
                  )
                  .join('')}
                <button type="button" class="cp-chip ok" id="cp-reset-btn">🔄 重置回出发前待命</button>
              </div>
            </div>`
          : '';

      mount.innerHTML = `
        <div class="cp-shell state-${delayBadgeCls}">
          ${nowCard.html}
          ${replayHtml}

          <!-- 1. Pre-Flight Anti-Trap Gate -->
          <div class="cp-gate ${allLockedReady ? 'ready' : 'locked'} ${state.preFlight.collapsed ? 'collapsed' : ''}" id="cp-gate-box">
            <div class="cp-gate-hd" id="cp-gate-toggle">
              <b>${
                allLockedReady
                  ? (config.gateLabels && config.gateLabels.readyTitle) || '✅ 发车防呆核查已通过（收费高速开启＋ETC就位）'
                  : (config.gateLabels && config.gateLabels.lockedTitle) || '🛑 发车前必做 2 项防呆锁扣（严防忘开地图ETC误入山路！）'
              }</b>
              <span class="tag ${allLockedReady ? 'ok' : 'warn'}">${state.preFlight.collapsed ? '展开 ▼' : '收起 ▲'}</span>
            </div>
            <div class="cp-gate-body">
              <label class="cp-lock-item">
                <input type="checkbox" id="cp-chk-tolls" ${state.preFlight.tollsOn ? 'checked' : ''}>
                <span><b>${(config.gateLabels && config.gateLabels.lock1Title) || '① 已关闭 Google Maps「避开收费公路 / 避开高速公路」：'}</b>${
                  config.tollReminder ||
                  '点开导航蓝线必须看到「有料/收费」标志！<span class="danger-inline">若未开启收费路，导航会把你导进限速低、弯急危险的山路并直接晚点 1.5 小时！</span>'
                }</span>
              </label>
              <label class="cp-lock-item">
                <input type="checkbox" id="cp-chk-etc" ${state.preFlight.etcReady ? 'checked' : ''}>
                <span><b>${(config.gateLabels && config.gateLabels.lock2Title) || '② 车载 ETC 绿灯亮起 ＋ 零钱硬币放杯架：'}</b>${
                  config.etcCashReminder || '启动车辆确认 ETC 读卡器绿灯提示音，纯现金收费站零钱提前备妥。'
                }</span>
              </label>
              <div>
                <div style="font-size:12px;font-weight:700;color:var(--cp-soft);margin-bottom:4px">
                  ${(config.gateLabels && config.gateLabels.paceTitle) || '③ 预设真实行车节奏系数（把低于限速慢行、短暂歇脚缓冲提前算进时间表！）'}
                </div>
                <div class="cp-pace-row">
                  ${(
                    config.pacePresets || [
                      [1.0, '1.00× 理想畅通', '纯高速老手基准'],
                      [1.2, '1.20× 稳健实况(推荐)', '含慢行/短暂歇脚'],
                      [1.35, '1.35× 谨慎/山路/雨雾', '低速防堵大缓冲']
                    ]
                  )
                    .map(
                      ([val, t1, t2]) =>
                        `<button type="button" class="cp-pace-btn ${Math.abs(state.paceFactor - val) < 0.03 ? 'on' : ''}" data-pace="${val}"><b>${t1}</b>${t2}</button>`
                    )
                    .join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Live Progress KPI Hero -->
          <div class="cp-status-hero">
            <div class="cp-stat ${delayBadgeCls}">
              <div class="k">当前进度偏差</div>
              <div class="v">${delaySign}</div>
              <div class="s">${escapeHtml(state.anchor.reason || '基准计划')}</div>
            </div>
            <div class="cp-stat ${sim.riskLevel}">
              <div class="k">${escapeHtml((config.deadlineSpec && config.deadlineSpec.finalDestLabel) || '终点预计抵达')}</div>
              <div class="v">${
                sim.emergency
                  ? fmtTime(sim.destArr)
                  : sim.matchedTrain && sim.matchedTrain.finalArr
                  ? escapeHtml(sim.matchedTrain.finalArr)
                  : !sim.matchedTrain && config.deadlineSpec && config.deadlineSpec.missFinalArr
                  ? escapeHtml(config.deadlineSpec.missFinalArr)
                  : fmtTime(sim.destArr)
              }</div>
              <div class="s">${
                sim.emergency
                  ? escapeHtml((sim.emSpec && sim.emSpec.shortBadge) || '直抵成田出发层')
                  : sim.matchedTrain
                  ? sim.matchedTrain.finalArr
                    ? `${fmtTime(sim.destArr)}进站 → ${sim.matchedTrain.name.split(' ')[0]}発`
                    : `赶 ${sim.matchedTrain.name.split(' ')[0]} (余${sim.bufferMin}m)`
                  : config.deadlineSpec && config.deadlineSpec.missFinalArr
                  ? `${fmtTime(sim.destArr)}才到站・已失守末班`
                  : `缓冲 ${sim.bufferMin} 分钟`
              }</div>
            </div>
            <div class="cp-stat">
              <div class="k">${config.mode === 'transit' ? '步行/换乘系数' : '车速折算系数'}</div>
              <div class="v">${state.paceFactor.toFixed(2)}×</div>
              <div class="s">${
                state.observedPace ? `前半段实测 ${state.observedPace}×` : '可随时按实况切换'
              }</div>
            </div>
            <div class="cp-stat ${state.guardActive ? 'ok' : ''}">
              <div class="k">手机强提醒护航</div>
              <div class="v">${state.guardActive ? '🛡️ 常亮开启' : '待开启'}</div>
              <div class="s">${globalPrefs.barkKeys ? 'Bark已配' : '支持日历/语音/Bark'}</div>
            </div>
          </div>

          <!-- 3. 1-Second Check-in & Live GPS Box -->
          <div class="cp-report-box">
            <div class="cp-report-top">
              <div class="cp-field">
                <label for="cp-node-sel">📍 选择当前所在 / 刚到的节点</label>
                <select id="cp-node-sel">
                  ${config.nodes
                    .filter(n => n.role !== 'after')
                    .map(
                      n =>
                        `<option value="${n.id}" ${n.id === curSelectedNode ? 'selected' : ''}>${
                          n.shortName || n.name
                        }${baselineMap[n.id] ? `（原计划 ${fmtTime(n.role === 'origin' ? baselineMap[n.id].dep : baselineMap[n.id].arr)}）` : ''}</option>`
                    )
                    .join('')}
                </select>
              </div>
              <div class="cp-field">
                <label for="cp-time-input">⌚ 实际时间（可改时间模拟）</label>
                <div class="cp-time-wrap">
                  <input type="time" id="cp-time-input" value="${curTimeInput}">
                  <button type="button" class="cp-now-btn" id="cp-use-now">取当前</button>
                </div>
              </div>
            </div>

            <div class="cp-primary-actions">
              <button type="button" class="cp-act-btn arr" id="cp-btn-arr">📍 我刚到这里（重算后续）</button>
              <button type="button" class="cp-act-btn dep" id="cp-btn-dep">🚀 刚从这出发（重算后续）</button>
            </div>

            <div class="cp-quick-bumps">
              ${(
                config.bumpPresets || [
                  [15, '临时停车休息 +15分', '☕ 临时休息 +15m'],
                  [15, '走错路口重导 +15分', '🔄 走错路 +15m'],
                  [20, '拥堵/低速慢行 +20分', '🐢 堵车慢行 +20m'],
                  [-10, '路段顺畅追回 10分', '⚡ 顺畅追回 -10m']
                ]
              )
                .map(
                  ([bMin, bWhy, bTxt]) =>
                    `<button type="button" class="cp-bump" data-bump="${bMin}" data-why="${escapeAttr(bWhy)}">${escapeHtml(bTxt)}</button>`
                )
                .join('')}
            </div>

            <div class="cp-gps-strip">
              <div>
                ${
                  state.gpsInfo
                    ? `🛰️ 实时定位：距下一站约 <b>${state.gpsInfo.remKm ?? '--'}km</b>｜速度 <b>${
                        state.gpsInfo.speedKmh != null ? state.gpsInfo.speedKmh + 'km/h' : '测算中'
                      }</b>｜邻近 ${escapeHtml(state.gpsInfo.nearestName)}${
                        state.gpsInfo.slowRoadWarn && isGpsFresh() && config.mode !== 'transit'
                          ? '<br><b style="color:var(--cp-err)">⚠️ 车速持续低于32km/h！请核查是否未上ETC收费高速或遇严重拥堵！</b>'
                          : ''
                      }`
                    : `🛰️ 自动监测：开启后进站自动打卡，并实时测算剩余时间与死线风险`
                }
                ${gpsFreshHtml()}
              </div>
              <button type="button" class="cp-gps-toggle ${state.gpsActive ? 'on' : ''}" id="cp-gps-btn">
                ${state.gpsActive ? '🛰️ GPS监测中(点击关闭)' : '🛰️ 开启GPS实时监测'}
              </button>
            </div>
          </div>

          <!-- 4. Live Risk Verdict & Restaurant Last-Order Trap Guard -->
          <div class="cp-diag ${sim.riskLevel}">
            <div class="cp-diag-title">${sim.headline}</div>
            <div style="font-size:12px;opacity:.92">
              当前推演路线：${
                sim.emergency
                  ? `<b>${escapeHtml(sim.emSpec.title)}</b>`
                  : sim.timeline
                      .map(x => `${fmtTime(x.arr)} ${escapeHtml(x.node.shortName || x.node.name)}`)
                      .join(' → ')
              }
            </div>
            ${
              mealAlerts.length && (delayMin >= 20 || mealAlerts.some(m => m.isRisk))
                ? `<div class="cp-lo-list">
                    <div style="font-size:12px;font-weight:700;margin-top:3px">${escapeHtml(
                      config.guardListTitle || '🍽️ 餐厅营业与最后点单（L.O.）实时排雷：'
                    )}</div>
                    ${mealAlerts
                      .map(
                        m =>
                          `<div class="cp-lo-item ${m.isRisk ? 'risk' : ''}"><b>${escapeHtml(m.name)}：</b>${escapeHtml(
                            m.statusTxt
                          )}</div>`
                      )
                      .join('')}
                  </div>`
                : ''
            }
          </div>

          <!-- 5. Dynamic 3-Option Re-Plan Engine (auto-appears whenever delayed >=20m or at risk!) -->
          ${
            proposals.length
              ? `<div class="cp-plans-wrap" id="cp-plans-anchor">
                  <div class="cp-plans-hd">
                    <h3>🧭 动态重排引擎：为您定制的 ${proposals.length} 套后续更优方案</h3>
                    <span class="tag ${sim.riskLevel === 'err' ? 'err' : 'warn'}">点选即刻更新全页路线与提醒</span>
                  </div>
                  <div class="cp-plans-grid">
                    ${proposals
                      .map((p, idx) => {
                        const nextNavNode = p.sim.emergency
                          ? { navUrl: p.sim.emSpec.navUrl, navLabel: p.sim.emSpec.navLabel }
                          : p.sim.timeline.find(x => x.status === 'upcoming')?.node ||
                            p.sim.timeline[p.sim.timeline.length - 1]?.node;
                        return `
                        <div class="cp-plan-card ${state.activePlanId === p.id ? 'active' : p.rec ? 'rec' : ''}">
                          <div class="cp-plan-top">
                            <div class="cp-plan-name">${escapeHtml(p.name)}</div>
                            <span class="cp-plan-eta">${
                              p.sim.matchedTrain && p.sim.matchedTrain.finalBadge
                                ? escapeHtml(p.sim.matchedTrain.finalBadge)
                                : p.sim.emergency && p.sim.emSpec && p.sim.emSpec.destBadgePrefix
                                ? `${escapeHtml(p.sim.emSpec.destBadgePrefix)} ${fmtTime(p.sim.destArr)}`
                                : `终点 ${fmtTime(p.sim.destArr)}`
                            }</span>
                          </div>
                          <div class="cp-plan-summary">${escapeHtml(p.summary)}</div>
                          <div class="cp-plan-pills">
                            ${p.pills.map(pl => `<span class="cp-pill ${pl.cls}">${escapeHtml(pl.txt)}</span>`).join('')}
                          </div>
                          <div class="cp-plan-legs">
                            ${
                              p.sim.emergency
                                ? p.sim.timeline
                                    .map(
                                      lg =>
                                        `<div class="cp-plan-leg"><code>${fmtTime(lg.arr)}${
                                          lg.stay ? '–' + fmtTime(lg.dep) : ''
                                        }</code><span>${escapeHtml(lg.node.shortName || lg.node.name)}${
                                          lg.stay ? `（停${lg.stay}m）` : ''
                                        }</span></div>`
                                    )
                                    .join('') +
                                  `<div class="cp-plan-leg"><code>${escapeHtml(
                                    (p.sim.emSpec && p.sim.emSpec.legCode) || '直达航站楼'
                                  )}</code><span>${escapeHtml(
                                    p.sim.emSpec && p.sim.emSpec.legDescFn
                                      ? p.sim.emSpec.legDescFn(fmtTime(p.sim.destArr), fmtTime(p.sim.emStartDep || p.sim.destArr))
                                      : `${fmtTime(p.sim.destArr)} 抵成田出发大厅 → 送完约 ${fmtTime(p.sim.homeArr)} 回自宅`
                                  )}</span></div>`
                                : p.sim.timeline
                                    .map(
                                      lg =>
                                        `<div class="cp-plan-leg"><code>${fmtTime(lg.arr)}${
                                          lg.stay ? '–' + fmtTime(lg.dep) : ''
                                        }</code><span>${escapeHtml(lg.node.shortName || lg.node.name)}${
                                          lg.stay ? `（停${lg.stay}m）` : ''
                                        }</span></div>`
                                    )
                                    .join('')
                            }
                          </div>
                          <div class="cp-plan-btns">
                            <button type="button" class="cp-plan-apply" data-plan-idx="${idx}">
                              ${state.activePlanId === p.id ? '✅ 当前已启用此方案' : '⚡ 一键套用此方案'}
                            </button>
                            ${
                              nextNavNode && nextNavNode.navUrl
                                ? `<a class="cp-plan-nav" href="${nextNavNode.navUrl}" target="_blank" rel="noopener">🧭 ${escapeHtml(
                                    nextNavNode.navLabel || '启动下一段导航'
                                  )}</a>`
                                : ''
                            }
                            <button type="button" class="cp-plan-wx" data-wx-idx="${idx}">📋 复制群通知</button>
                          </div>
                        </div>`;
                      })
                      .join('')}
                  </div>
                </div>`
              : ''
          }

          <!-- 6. 4-Channel Strong Phone Alert Hub -->
          <details class="cp-fold" id="cp-fold-alerts" ${openAlertsFold ? 'open' : ''}>
            <summary>
              <span>📲 手机「四通道强提醒」设置中心（系统日历闹钟 / 语音常亮 / iPhone Bark突破静音 / 主屏幕通知）</span>
              <span class="tag blue">展开配置 ▼</span>
            </summary>
            <div class="cp-fold-body">
              <div class="cp-chan">
                <div class="cp-chan-hd">
                  <b>① 手机系统日历（.ics）关键死线双闹钟（锁屏 / CarPlay 100% 强弹窗）</b>
                  <span class="tag ok">零安装最稳</span>
                </div>
                <p>根据当前激活的时间表（重排后点此可更新！），在 iPhone/Android 系统日历写入「发车防呆＋途中核查＋每站最晚发车死线」，每站提前 15 分钟＋到点两次系统级响铃弹窗，绝不怕微信/网页杀后台！</p>
                <div class="cp-sm-btns">
                  <button type="button" class="cp-sm-btn ok" id="cp-dl-ics">📅 一键导入当前行程死线闹钟 (.ics)</button>
                </div>
              </div>

              <div class="cp-chan">
                <div class="cp-chan-hd">
                  <b>② 网页「副驾常亮护航」：屏幕不息屏 ＋ 车载警示音 ＋ 中文语音播报</b>
                  <span class="tag ${state.guardActive ? 'ok' : 'warn'}">${state.guardActive ? '运行中' : '支架推荐'}</span>
                </div>
                <p>手机插电放中控架上开启：自动锁定屏幕常亮（WakeLock），逼近每站发车死线或晚点超阈值时自动播放双音警报并语音播报调整建议。</p>
                <div class="cp-sm-btns">
                  <button type="button" class="cp-sm-btn pri" id="cp-toggle-guard-2">
                    ${state.guardActive ? '⏹️ 关闭副驾常亮护航' : '🛡️ 开启副驾常亮护航（解锁语音）'}
                  </button>
                  <button type="button" class="cp-sm-btn acc" id="cp-test-voice">🔔 测试强提醒（声音＋语音＋弹窗）</button>
                </div>
              </div>

              <div class="cp-chan">
                <div class="cp-chan-hd">
                  <b>③ iPhone Bark 强推送 ＆ 同车 ntfy 广播（支持锁屏置顶 / 突破静音响铃！）</b>
                  <span class="tag err">支持突破静音</span>
                </div>
                <p>iPhone 免费安装 <b>Bark</b> App 复制 Key 填入下方（可填多个逗号分隔，司机副驾同收）；选「突破静音响铃」后，一旦发生严重延误会自动向手机发送强制最大音量警报并附带新路线导航直链！Android/跨平台也可填 <b>ntfy.sh</b> 暗号频道。</p>
                <div class="cp-inline-inputs">
                  <input type="text" id="cp-bark-input" placeholder="填入 Bark Key 或 https://api.day.app/你的Key（支持多个逗号分隔）" value="${escapeAttr(
                    globalPrefs.barkKeys
                  )}">
                  <select id="cp-bark-level">
                    <option value="critical" ${globalPrefs.barkLevel === 'critical' ? 'selected' : ''}>🚨 紧急突破静音持续响铃 (Critical)</option>
                    <option value="timeSensitive" ${globalPrefs.barkLevel === 'timeSensitive' ? 'selected' : ''}>🔔 穿透专注模式时效通知</option>
                  </select>
                </div>
                <div class="cp-inline-inputs">
                  <input type="text" id="cp-ntfy-input" placeholder="可选：同车队 ntfy.sh 频道名（如 ken-izu-1125）" value="${escapeAttr(
                    globalPrefs.ntfyTopic
                  )}">
                </div>
                <div class="cp-sm-btns">
                  <button type="button" class="cp-sm-btn pri" id="cp-save-push">💾 保存并发送测试推送到手机</button>
                  <button type="button" class="cp-sm-btn" id="cp-copy-shortcut-url">🔗 复制 iOS 快捷指令自动打卡链接</button>
                </div>
              </div>

              <div class="cp-chan">
                <div class="cp-chan-hd">
                  <b>④ 添加到主屏幕 PWA 原生通知 ＆ 隧道离线秒开</b>
                  <span class="tag blue">离线防失联</span>
                </div>
                <p>iPhone Safari 点底部分享按钮 <code>[↑]</code> → <b>「添加到主屏幕」</b>（Android 直接点下方安装），即可开启系统级原生通知权限，且进海底隧道/深山无信号也能秒开攻略与重排引擎！</p>
                <div class="cp-sm-btns">
                  <button type="button" class="cp-sm-btn pri" id="cp-req-notif">🔔 开启浏览器/主屏幕原生通知权限</button>
                  <button type="button" class="cp-sm-btn ok" id="cp-pwa-install-btn" style="display:${
                    deferredInstallPrompt ? 'inline-flex' : 'none'
                  }">📲 一键安装到手机主屏幕</button>
                </div>
              </div>
            </div>
          </details>

          <!-- 7. AI Deep Live Re-Planning Drawer -->
          <details class="cp-fold" id="cp-fold-ai" ${openAiFold ? 'open' : ''}>
            <summary>
              <span>🤖 AI 深度实时改道急救台（遇临时封路 / 想换附近餐厅 / 特殊变数）</span>
              <span class="tag ok">自动打包坐标与死线 ▼</span>
            </summary>
            <div class="cp-fold-body">
              <div class="cp-chan">
                <p>已自动将你们的<b>当前时间、GPS 坐标、已完结节点、实测慢速系数、硬死线列车/入住约束、新手宽路导航规则</b>打包成急救指令。你可以补充一句话诉求，一键发给任意 AI 秒拿带防坑 Google Maps 链接的新方案：</p>
                <div class="cp-inline-inputs">
                  <input type="text" id="cp-ai-wish" placeholder="可选补充诉求：例「刚在小田原吃完饭13:50，想顺路找个高速SA喝咖啡并保16:05送机」" value="${escapeAttr(
                    customWishVal
                  )}">
                </div>
                <div class="cp-sm-btns">
                  <button type="button" class="cp-sm-btn acc" id="cp-copy-ai">📋 一键复制 AI 实时急救指令</button>
                  <a class="cp-sm-btn pri" href="https://chatgpt.com/" target="_blank" rel="noopener" id="cp-open-gpt" style="text-decoration:none">🚀 复制并打开 ChatGPT</a>
                  <a class="cp-sm-btn" href="https://claude.ai/new" target="_blank" rel="noopener" id="cp-open-claude" style="text-decoration:none">🤖 打开 Claude</a>
                </div>
                <pre class="cp-ai-pre" id="cp-ai-preview">${escapeHtml(aiPrompt)}</pre>

                <details style="margin-top:8px;font-size:12px">
                  <summary style="cursor:pointer;color:var(--cp-soft)">⚙️ 高阶可选：填入自有 API Key 在本页内直接流式生成方案（仅存本机浏览器）</summary>
                  <div class="cp-inline-inputs" style="margin-top:6px">
                    <input type="password" id="cp-llm-key" placeholder="Gemini / OpenAI 兼容 API Key（仅保存在本机 localStorage）" value="${escapeAttr(
                      globalPrefs.llmApiKey
                    )}">
                    <input type="text" id="cp-llm-model" placeholder="模型名 (如 gemini-2.5-flash)" value="${escapeAttr(
                      globalPrefs.llmModel
                    )}">
                  </div>
                  <button type="button" class="cp-sm-btn ok" id="cp-run-llm">⚡ 网页内直连 AI 秒出方案</button>
                  <div class="cp-ai-reply" id="cp-llm-out" style="display:none"></div>
                </details>
              </div>
            </div>
          </details>
        </div>
      `;

      bindEvents(sim, proposals);
    }

    function suggestNextCheckinNodeId() {
      const idx = config.nodes.findIndex(n => n.id === state.anchor.nodeId);
      if (state.anchor.event === 'dep' && idx + 1 < config.nodes.length) {
        for (let i = idx + 1; i < config.nodes.length; i++) {
          const cand = config.nodes[i];
          if (cand.role === 'after') break;
          if (cand.role === 'origin' || cand.role === 'meal' || cand.role === 'destination' || state.enabledNodes[cand.id]) {
            return cand.id;
          }
        }
      }
      return state.anchor.nodeId;
    }

    function bindEvents(sim, proposals) {
      // Pre-flight gate
      document.getElementById('cp-gate-toggle')?.addEventListener('click', () => {
        state.preFlight.collapsed = !state.preFlight.collapsed;
        saveState();
        render();
      });
      document.getElementById('cp-chk-tolls')?.addEventListener('change', e => {
        state.preFlight.tollsOn = e.target.checked;
        if (state.preFlight.tollsOn && state.preFlight.etcReady) {
          showPageToast('✅ 防呆核查完成！祝一路顺风！');
        }
        saveState();
        render();
      });
      document.getElementById('cp-chk-etc')?.addEventListener('change', e => {
        state.preFlight.etcReady = e.target.checked;
        if (state.preFlight.tollsOn && state.preFlight.etcReady) {
          showPageToast('✅ 防呆核查完成！祝一路顺风！');
        }
        saveState();
        render();
      });

      // Pace buttons
      mount.querySelectorAll('[data-pace]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.paceFactor = parseFloat(btn.dataset.pace);
          saveState();
          render();
          showPageToast(`已切换车速折算系数为 ${state.paceFactor.toFixed(2)}×`);
        });
      });

      // Replay scenarios
      mount.querySelectorAll('[data-replay]').forEach(btn => {
        btn.addEventListener('click', () => {
          const sc = config.replayScenarios[Number(btn.dataset.replay)];
          if (!sc) return;
          if (sc.resetEnabled) state.enabledNodes = Object.assign({}, defaultEnabled, sc.enabledNodes || {});
          state.stayOverrides = Object.assign({}, sc.stayOverrides || {});
          if (sc.paceFactor != null) state.paceFactor = sc.paceFactor;
          if (sc.tollsOn != null) state.preFlight.tollsOn = sc.tollsOn;
          recordCheckin(sc.nodeId, sc.event || 'arr', sc.timeMin, sc.reason);
        });
      });

      document.getElementById('cp-reset-btn')?.addEventListener('click', () => {
        state.enabledNodes = Object.assign({}, defaultEnabled);
        state.stayOverrides = {};
        state.paceFactor = config.defaultPaceFactor || 1.0;
        state.emergencyMode = false;
        state.activePlanId = 'current';
        state.observedPace = null;
        state.live = { status: {}, stayMode: 'full', hereMode: 'full', appliedAt: null };
        state.anchor = {
          nodeId: config.nodes[0].id,
          event: 'dep',
          timeMin: config.defaultDepMin || 600,
          extraDelayMin: 0,
          reason: '行前基准计划'
        };
        saveState();
        if (typeof config.onApplyPlan === 'function') {
          config.onApplyPlan({
            enabledNodes: state.enabledNodes,
            stayOverrides: state.stayOverrides,
            paceFactor: state.paceFactor,
            emergencyMode: false,
            sim: simulateSchedule({})
          });
        }
        render();
        showPageToast('🔄 已重置回出发前基准状态');
      });

      // Check-in buttons
      document.getElementById('cp-use-now')?.addEventListener('click', () => {
        const inp = document.getElementById('cp-time-input');
        if (inp) inp.value = fmtTime(nowLocalMin());
      });
      document.getElementById('cp-btn-arr')?.addEventListener('click', () => {
        const nodeId = document.getElementById('cp-node-sel').value;
        const tVal = parseTime(document.getElementById('cp-time-input').value) ?? nowLocalMin();
        const node = config.nodes.find(n => n.id === nodeId);
        recordCheckin(nodeId, 'arr', tVal, `${fmtTime(tVal)} 抵达 ${node ? node.shortName || node.name : ''}`);
      });
      document.getElementById('cp-btn-dep')?.addEventListener('click', () => {
        const nodeId = document.getElementById('cp-node-sel').value;
        const tVal = parseTime(document.getElementById('cp-time-input').value) ?? nowLocalMin();
        const node = config.nodes.find(n => n.id === nodeId);
        recordCheckin(nodeId, 'dep', tVal, `${fmtTime(tVal)} 从 ${node ? node.shortName || node.name : ''} 出发`);
      });

      // Quick bump buttons
      mount.querySelectorAll('[data-bump]').forEach(btn => {
        btn.addEventListener('click', () => {
          unlockAudio();
          const delta = Number(btn.dataset.bump);
          state.anchor.extraDelayMin = (state.anchor.extraDelayMin || 0) + delta;
          state.anchor.reason = btn.dataset.why || `手动调整 ${delta}分`;
          saveState();
          const nextSim = simulateSchedule({});
          const totalDelay = getDelayVsBaseline();
          render();
          if (nextSim.riskLevel === 'err' || totalDelay >= 45) {
            playChime('err');
            speakZh(`已记录${state.anchor.reason}。${nextSim.headline}`);
          } else if (delta > 0) {
            playChime('warn');
            showPageToast(`⏱️ 已记录：${state.anchor.reason}，时间表已实时顺延并重算风险`);
          } else {
            playChime('ok');
            showPageToast(`⚡ 已记录：${state.anchor.reason}`);
          }
        });
      });

      // GPS button
      document.getElementById('cp-gps-btn')?.addEventListener('click', toggleGpsMode);

      // Apply proposal & copy WeChat buttons
      mount.querySelectorAll('[data-stop]').forEach(btn => {
        btn.addEventListener('click', () => cycleStopStatus(btn.dataset.stop));
      });
      mount.querySelectorAll('[data-live-apply]').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = lastNowCard && (btn.dataset.liveApply === 'tight' ? lastNowCard.L.tight : lastNowCard.L.best);
          if (r) applyLiveRoute(r);
        });
      });
      mount.querySelectorAll('[data-plan-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const prop = proposals[Number(btn.dataset.planIdx)];
          if (prop) applyProposal(prop);
        });
      });
      mount.querySelectorAll('[data-wx-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const prop = proposals[Number(btn.dataset.wxIdx)];
          if (prop) copyAdjustedWeChatSummary(prop.sim, prop.name);
        });
      });

      // 4-Channel Strong Alert Hub actions
      document.getElementById('cp-dl-ics')?.addEventListener('click', () => downloadIcs(sim));
      document.getElementById('cp-toggle-guard-2')?.addEventListener('click', () => toggleGuardMode());
      document.getElementById('cp-test-voice')?.addEventListener('click', () => {
        unlockAudio();
        playChime('err');
        const sampleMsg = `强提醒测试成功！${sim.headline}`;
        speakZh(sampleMsg);
        showUrgentModal(
          sim.riskLevel === 'ok' ? 'warn' : 'err',
          '🔔 车载强提醒效果测试',
          `<p style="margin:0">声音警报、中文语音播报与全屏高对比弹窗均已正常工作！<br><br><b>当前行程诊断：</b>${sim.headline}</p>`,
          null
        );
      });

      document.getElementById('cp-save-push')?.addEventListener('click', async () => {
        globalPrefs.barkKeys = document.getElementById('cp-bark-input').value.trim();
        globalPrefs.barkLevel = document.getElementById('cp-bark-level').value;
        globalPrefs.ntfyTopic = document.getElementById('cp-ntfy-input').value.trim();
        savePrefs();
        if (!globalPrefs.barkKeys && !globalPrefs.ntfyTopic) {
          showPageToast('已保存设置（填入 Bark Key 或 ntfy 频道名即可发送手机锁屏强推送）');
          return;
        }
        showPageToast('📨 正在向手机发送测试强提醒推送…');
        const sent = await dispatchStrongNotifications(
          '🚗 日本自驾护航已连接！',
          `测试成功！当前状态：${sim.headline}`,
          location.href,
          globalPrefs.barkLevel === 'critical' ? 'err' : 'warn'
        );
        showPageToast(sent.length ? `✅ 已推送至：${sent.join(' + ')}，请看手机锁屏！` : '⚠️ 推送未送达，请检查 Key 或网络');
        render();
      });

      document.getElementById('cp-copy-shortcut-url')?.addEventListener('click', () => {
        const selNode = document.getElementById('cp-node-sel').value;
        const shortcutUrl = `${location.origin}${location.pathname}?copilot=1&checkin=${encodeURIComponent(selNode)}`;
        if (navigator.clipboard) navigator.clipboard.writeText(shortcutUrl).catch(() => {});
        showPageToast('🔗 已复制自动打卡链接！可放入 iOS「快捷指令 / CarPlay 自动化」一键触发');
      });

      document.getElementById('cp-req-notif')?.addEventListener('click', async () => {
        if (!('Notification' in global)) {
          showPageToast('iPhone 请先点 Safari 底部分享 [↑] →「添加到主屏幕」，从桌面打开即可开启原生通知！');
          return;
        }
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          await dispatchStrongNotifications('🔔 原生通知已开启', sim.headline, location.href, 'ok');
          showPageToast('✅ 原生系统通知权限已开启！');
        } else {
          showPageToast('通知权限未开启，可在系统设置或使用日历闹钟 / Bark 强提醒');
        }
      });

      document.getElementById('cp-pwa-install-btn')?.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice.catch(() => {});
        deferredInstallPrompt = null;
        render();
      });

      // AI Live Emergency Replan actions
      const wishInput = document.getElementById('cp-ai-wish');
      const preEl = document.getElementById('cp-ai-preview');
      wishInput?.addEventListener('input', () => {
        if (preEl) preEl.textContent = buildAiEmergencyPrompt(sim, getDelayVsBaseline(), wishInput.value);
      });
      const copyPromptAction = () => {
        const txt = buildAiEmergencyPrompt(sim, getDelayVsBaseline(), wishInput ? wishInput.value : '');
        if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
        showPageToast('📋 已复制带实时坐标与死线的 AI 急救指令！直接粘贴即可');
        return txt;
      };
      document.getElementById('cp-copy-ai')?.addEventListener('click', copyPromptAction);
      document.getElementById('cp-open-gpt')?.addEventListener('click', copyPromptAction);
      document.getElementById('cp-open-claude')?.addEventListener('click', copyPromptAction);

      document.getElementById('cp-run-llm')?.addEventListener('click', e => {
        globalPrefs.llmApiKey = document.getElementById('cp-llm-key').value.trim();
        globalPrefs.llmModel = document.getElementById('cp-llm-model').value.trim() || 'gemini-2.5-flash';
        savePrefs();
        const txt = copyPromptAction();
        callInlineAi(txt, document.getElementById('cp-llm-out'), e.currentTarget);
      });
    }

    // Intercept Leg 1 navigation clicks softly if Pre-Flight Anti-Trap Gate isn't confirmed yet
    document.querySelectorAll('a[href*="google.com/maps/dir"]').forEach(link => {
      link.addEventListener('click', () => {
        if (!state.preFlight.tollsOn && config.mode !== 'transit') {
          showPageToast('⚠️ 切记确认 Google Maps 未勾选「避开收费公路」且显示「有料」高速！');
        }
      });
    });

    // Handle URL deep-link parameters (?copilot=1&checkin=lunch&at=13:30 or ?scenario=0)
    function applyUrlParams() {
      const params = new URLSearchParams(location.search);
      if (params.has('scenario') && config.replayScenarios) {
        const sc = config.replayScenarios[Number(params.get('scenario'))];
        if (sc) {
          recordCheckin(sc.nodeId, sc.event || 'arr', sc.timeMin, sc.reason);
          setTimeout(() => mount.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
          return true;
        }
      }
      if (params.has('checkin')) {
        const nid = params.get('checkin');
        const atMin = parseTime(params.get('at') || '') ?? nowLocalMin();
        if (config.nodes.some(n => n.id === nid)) {
          recordCheckin(nid, params.get('event') || 'arr', atMin, '从提醒链接一键打卡汇报');
          setTimeout(() => mount.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
          return true;
        }
      }
      if (params.get('copilot') === '1') {
        setTimeout(() => mount.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
      }
      return false;
    }

    render();
    applyUrlParams();

    return {
      getState: () => state,
      simulate: () => simulateSchedule({}),
      recordCheckin,
      downloadIcs: () => downloadIcs(simulateSchedule({})),
      playChime,
      speakZh,
      dispatchPush: dispatchStrongNotifications,
      showUrgentModal
    };
  }

  function safeLoad(k, fallback) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function safeSave(k, val) {
    try {
      localStorage.setItem(k, JSON.stringify(val));
    } catch (_) {}
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  global.TripCopilot = { init };
})(window);
