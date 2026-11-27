/*!
 * Trip Co-Pilot v3.0 — Clean 3-Step Live Co-Pilot: Target Deadline, GPS / Nearby Station & SA/PA Check-in, Ahead/Behind & Stop Pruning
 * Repository: kenandxx/trip-planning
 * Zero external dependencies; offline-capable; mobile-first (iOS Safari / WeChat / Android Chrome).
 */
(function (global) {
  'use strict';

  const GLOBAL_PREF_KEY = 'trip_copilot_global_prefs_v2';

  // Built-in offline dictionary of major Kanto / Chiba / Tokyo / Kanagawa / Saitama / Izu railway stations & airports
  // Format: [canonicalName, lat, lng, lineHint, aliases]
  const JP_STATIONS = [
    ['滝不動駅', 35.7235, 140.0131, '京成松戸線（旧新京成）', '泷不动 滝不动 takifudo'],
    ['高根公団駅', 35.7231, 140.0005, '京成松戸線', '高根公团 takanekodan'],
    ['高根木戸駅', 35.7219, 139.9927, '京成松戸線', 'takanekido'],
    ['北習志野駅', 35.7212, 139.9856, '京成松戸線・東葉高速線', '北习志野 kitanarashino'],
    ['薬園台駅', 35.7136, 139.9949, '京成松戸線', '药园台 yakuendai'],
    ['前原駅', 35.7024, 140.0044, '京成松戸線', 'maebara'],
    ['新津田沼駅', 35.6913, 140.0236, '京成松戸線', 'shintsudanuma'],
    ['津田沼駅', 35.6913, 140.0203, 'JR総武線快速・各停', 'tsudanuma'],
    ['京成津田沼駅', 35.6837, 140.0247, '京成本線・千葉線・松戸線', 'keiseitsudanuma'],
    ['三咲駅', 35.7405, 140.0209, '京成松戸線', 'misaki'],
    ['二和向台駅', 35.7478, 140.0189, '京成松戸線', 'futawamukodai'],
    ['鎌ヶ谷大仏駅', 35.7547, 140.0145, '京成松戸線', '镰谷大佛 kamagayadaibutsu'],
    ['初富駅', 35.7689, 140.002, '京成松戸線', 'hatsutomi'],
    ['新鎌ヶ谷駅', 35.7804, 139.9977, '京成松戸線・北総線・東武野田線', '新镰谷 shinkamagaya'],
    ['くぬぎ山駅', 35.7897, 139.9693, '京成松戸線', 'kunugiyama'],
    ['五香駅', 35.7966, 139.9647, '京成松戸線', 'goko'],
    ['常盤平駅', 35.7997, 139.9482, '京成松戸線', '常盘平 tokiwadaira'],
    ['八柱駅', 35.7919, 139.9383, '京成松戸線・JR武蔵野線（新八柱）', '新八柱 yahashira shinyahashira'],
    ['松戸駅', 35.7844, 139.9007, 'JR常磐線・京成松戸線', '松户 matsudo'],
    ['柏駅', 35.8622, 139.9709, 'JR常磐線・東武アーバンパークライン', 'kashiwa'],
    ['船橋駅', 35.7017, 139.9853, 'JR総武線・東武・京成船橋', '船桥 京成船桥 funabashi'],
    ['西船橋駅', 35.7074, 139.9592, 'JR総武線・東西線・武蔵野線', '西船桥 nishifunabashi'],
    ['市川駅', 35.7289, 139.9081, 'JR総武線', 'ichikawa'],
    ['本八幡駅', 35.721, 139.9272, 'JR総武線・都営新宿線・京成八幡', 'motoyawata'],
    ['海浜幕張駅', 35.6483, 140.0418, 'JR京葉線', '海滨幕张 幕张 kaihinmakuhari'],
    ['舞浜駅', 35.6362, 139.8837, 'JR京葉線（東京ディズニーリゾート）', '舞滨 迪士尼 maihama disney'],
    ['千葉駅', 35.6131, 140.1134, 'JR総武線・外房・内房線', '千叶 chiba'],
    ['京成成田駅', 35.7764, 140.315, '京成本線・JR成田駅', '成田站 narita'],
    ['成田空港駅（第1ターミナル）', 35.7655, 140.3863, '成田国際空港 T1', '成田机场 成田空港 narita airport nrt t1'],
    ['空港第2ビル駅（成田T2/T3）', 35.7725, 140.3879, '成田国際空港 T2・T3', '成田第2航站楼 成田t2 nrt t2'],
    ['羽田空港', 35.5494, 139.7798, '東京モノレール・京急空港線', '羽田机场 haneda airport hnd'],
    ['池袋駅', 35.7295, 139.7109, 'JR山手線・埼京線・メトロ・西武・東武', 'ikebukuro'],
    ['日暮里駅', 35.7279, 139.7709, 'JR山手線・常磐線・京成本線', 'nippori'],
    ['西日暮里駅', 35.7321, 139.7668, 'JR山手線・千代田線・舎人ライナー', 'nishinippori'],
    ['上野駅', 35.7141, 139.7774, 'JR各線・新幹線・銀座線・日比谷線', '京成上野 ueno'],
    ['御徒町駅', 35.7075, 139.7747, 'JR山手線・京浜東北線', 'okachimachi'],
    ['秋葉原駅', 35.6984, 139.7731, 'JR山手線・総武線・日比谷線・TX', '秋叶原 akihabara'],
    ['神田駅', 35.6918, 139.7709, 'JR山手線・中央線・銀座線', 'kanda'],
    ['東京駅', 35.6812, 139.7671, 'JR各線・新幹線・丸ノ内線', '东京站 东京 tokyo'],
    ['有楽町駅', 35.6751, 139.7633, 'JR山手線・有楽町線', '有乐町 yurakucho'],
    ['銀座駅', 35.6717, 139.765, '銀座線・丸ノ内線・日比谷線', '银座 ginza'],
    ['新橋駅', 35.6664, 139.7583, 'JR各線・銀座線・浅草線・ゆりかもめ', '新桥 shimbashi'],
    ['浜松町駅', 35.6554, 139.7571, 'JR山手線・東京モノレール・大門', '滨松町 hamamatsucho'],
    ['品川駅', 35.6285, 139.7388, 'JR各線・東海道新幹線・京急', 'shinagawa'],
    ['大崎駅', 35.6197, 139.7286, 'JR山手線・りんかい線', 'osaki'],
    ['五反田駅', 35.6264, 139.7234, 'JR山手線・浅草線・池上線', 'gotanda'],
    ['目黒駅', 35.634, 139.7158, 'JR山手線・南北線・三田線・目黒線', '目黑 meguro'],
    ['恵比寿駅', 35.6467, 139.7101, 'JR山手線・日比谷線', '惠比寿 ebisu'],
    ['渋谷駅', 35.658, 139.7016, 'JR山手線・東急・京王井の頭・メトロ', '涩谷 涉谷 shibuya'],
    ['原宿駅', 35.6702, 139.7027, 'JR山手線・明治神宮前', 'harajuku'],
    ['代々木駅', 35.6831, 139.702, 'JR山手線・総武線・大江戸線', '代代木 yoyogi'],
    ['新宿駅', 35.6896, 139.7006, 'JR各線・小田急・京王・メトロ', 'shinjuku'],
    ['新大久保駅', 35.7013, 139.7, 'JR山手線', 'shinokubo'],
    ['高田馬場駅', 35.7126, 139.7039, 'JR山手線・東西線・西武新宿線', '高田马场 takadanobaba'],
    ['大塚駅', 35.7318, 139.7281, 'JR山手線', '大冢 otsuka'],
    ['巣鴨駅', 35.7335, 139.7393, 'JR山手線・三田線', '巢鸭 sugamo'],
    ['北千住駅', 35.7497, 139.8049, 'JR常磐線・千代田線・日比谷線・東武・TX', 'kitasenju'],
    ['錦糸町駅', 35.6967, 139.8145, 'JR総武線・半蔵門線', '锦糸町 kinshicho'],
    ['押上駅（スカイツリー前）', 35.7107, 139.8133, '半蔵門線・浅草線・京成・東武', '押上 晴空塔 oshiage skytree'],
    ['浅草駅', 35.7119, 139.7984, '銀座線・浅草線・東武スカイツリーライン', 'asakusa'],
    ['赤羽駅', 35.7777, 139.7209, 'JR京浜東北・埼京・宇都宮・高崎線', 'akabane'],
    ['中野駅', 35.7058, 139.6658, 'JR中央線・東西線', 'nakano'],
    ['吉祥寺駅', 35.7031, 139.5798, 'JR中央線・京王井の頭線', 'kichijoji'],
    ['立川駅', 35.698, 139.4138, 'JR中央線・青梅線・南武線', 'tachikawa'],
    ['大宮駅', 35.9064, 139.624, 'JR各線・東北/北陸/上越新幹線', '大宫 omiya'],
    ['横浜駅', 35.4658, 139.6223, 'JR各線・東急・京急・相鉄・みなとみらい線', '横滨 yokohama'],
    ['新横浜駅', 35.5075, 139.6176, '東海道新幹線・JR横浜線・東急新横浜線', '新横滨 shinyokohama'],
    ['川崎駅', 35.5314, 139.6969, 'JR東海道線・京浜東北線・南武線', '京急川崎 kawasaki'],
    ['武蔵小杉駅', 35.5766, 139.6596, 'JR横須賀線・南武線・東急東横線', '武藏小杉 musashikosugi'],
    ['鎌倉駅', 35.319, 139.5504, 'JR横須賀線・江ノ島電鉄', '镰仓 kamakura'],
    ['片瀬江ノ島駅', 35.3088, 139.4832, '小田急江ノ島線（江之岛）', '江之岛 江ノ島 enoshima'],
    ['藤沢駅', 35.3388, 139.4874, 'JR東海道線・小田急江ノ島線・江ノ電', '藤泽 fujisawa'],
    ['小田原駅', 35.2562, 139.1558, 'JR東海道線・新幹線・小田急・箱根登山', 'odawara'],
    ['箱根湯本駅', 35.2335, 139.104, '箱根登山鉄道', '箱根汤本 hakoneyumoto'],
    ['熱海駅', 35.1037, 139.0777, 'JR東海道線・新幹線・伊東線', '热海 atami'],
    ['三島駅', 35.1265, 138.9108, 'JR東海道線・新幹線・伊豆箱根鉄道', '三岛 mishima'],
    ['修善寺駅', 34.9794, 138.951, '伊豆箱根鉄道駿豆線', 'shuzenji'],
    ['沼津駅', 35.1031, 138.8597, 'JR東海道線・御殿場線', 'numazu'],
    ['伊東駅', 34.9749, 139.0921, 'JR伊東線・伊豆急行', '伊东 ito'],
    ['河口湖駅', 35.4982, 138.7687, '富士急行線', 'kawaguchiko'],
    ['軽井沢駅', 36.3428, 138.6352, '北陸新幹線・しなの鉄道', '轻井泽 karuizawa']
  ];

  // Built-in offline dictionary of major Kanto / Chiba / Kanagawa / Izu / Yamanashi Expressway SA & PA
  const JP_SAPAS = [
    ['海ほたるPA', 35.4645, 139.8744, '東京湾アクアライン', '海萤 umihotaru pa'],
    ['幕張PA', 35.6682, 140.0442, '京葉道路（上下）', '幕张pa makuhari pa'],
    ['湾岸幕張PA', 35.6544, 140.0258, '東関東自動車道', '湾岸幕张 wangan makuhari pa'],
    ['京葉市川PA', 35.6997, 139.9325, '京葉道路', '市川pa ichikawa pa'],
    ['酒々井PA', 35.7294, 140.2903, '東関東自動車道（成田前）', '酒酒井 shisui pa'],
    ['野呂PA', 35.5688, 140.2289, '千葉東金道路', 'noro pa'],
    ['市原SA', 35.4793, 140.0956, '館山自動車道', 'ichihara sa'],
    ['大黒PA', 35.4622, 139.6797, '首都高湾岸線・大黒ふ頭', '大黑pa daikoku pa'],
    ['芝浦PA', 35.6392, 139.7586, '首都高11号台場線', 'shibaura pa'],
    ['平和島PA', 35.5815, 139.7462, '首都高1号羽田線', 'heiwajima pa'],
    ['代々木PA', 35.6761, 139.6968, '首都高4号新宿線', '代代木pa yoyogi pa'],
    ['用賀PA', 35.6265, 139.6322, '首都高3号渋谷線', 'yoga pa'],
    ['八潮PA', 35.8086, 139.8398, '首都高6号三郷線', 'yashio pa'],
    ['川口PA', 35.8392, 139.7405, '首都高川口線', 'kawaguchi pa'],
    ['港北PA', 35.5295, 139.5664, '東名高速道路', 'kohoku pa'],
    ['海老名SA', 35.4293, 139.3924, '東名高速道路（上下）', 'ebina sa'],
    ['中井PA', 35.3353, 139.2156, '東名高速道路', 'nakai pa'],
    ['鮎沢PA', 35.3589, 139.0358, '東名高速道路', 'ayuzawa pa'],
    ['足柄SA', 35.3198, 138.9669, '東名高速道路（御殿場）', 'ashigara sa'],
    ['駿河湾沼津SA', 35.1469, 138.8077, '新東名高速道路', '骏河湾沼津 surugawan numazu sa'],
    ['富士川SA', 35.1586, 138.6188, '東名高速道路（富士山絶景）', 'fujikawa sa'],
    ['平塚PA', 35.3672, 139.3278, '小田原厚木道路', 'hiratsuka pa'],
    ['大磯PA', 35.3236, 139.2869, '小田原厚木道路', 'oiso pa'],
    ['小田原PA', 35.2665, 139.1764, '小田原厚木道路', 'odawara pa'],
    ['西湘PA', 35.2722, 139.2119, '西湘バイパス（湘南海景）', 'seisho pa'],
    ['箱根口IC', 35.2439, 139.1246, '小田原厚木道路・国道1号', 'hakoneguchi ic'],
    ['石川PA', 35.6761, 139.3853, '中央自動車道', 'ishikawa pa'],
    ['談合坂SA', 35.6295, 139.0669, '中央自動車道（上下）', '谈合坂 dangozaka sa'],
    ['双葉SA', 35.6897, 138.5082, '中央自動車道', 'futaba sa'],
    ['三芳PA', 35.8364, 139.5142, '関越自動車道', 'miyoshi pa'],
    ['高坂SA', 35.9939, 139.3792, '関越自動車道', 'たかさか takasaka sa'],
    ['上里SA', 36.2456, 139.1181, '関越自動車道', 'kamisato sa'],
    ['横川SA', 36.3347, 138.7381, '上信越自動車道（軽井沢前）', 'yokokawa sa'],
    ['守谷SA', 35.9486, 139.9742, '常磐自動車道', 'moriya sa'],
    ['谷田部東PA', 36.0269, 140.0886, '常磐自動車道', 'yatabehigashi pa'],
    ['友部SA', 36.3164, 140.3125, '常磐自動車道', 'tomobe sa'],
    ['蓮田SA', 36.0128, 139.6542, '東北自動車道', '莲田 hasuda sa'],
    ['羽生PA', 36.1856, 139.5661, '東北自動車道', 'hanyu pa'],
    ['佐野SA', 36.3086, 139.6156, '東北自動車道', 'sano sa']
  ];

  const ZH_TO_JA_MAP = [
    [/泷/g, '滝'],
    [/动/g, '動'],
    [/户/g, '戸'],
    [/桥/g, '橋'],
    [/习/g, '習'],
    [/药/g, '薬'],
    [/园/g, '園'],
    [/镰/g, '鎌'],
    [/东/g, '東'],
    [/涩|涉/g, '渋'],
    [/滨/g, '浜'],
    [/仓/g, '倉'],
    [/热/g, '熱'],
    [/岛/g, '島'],
    [/轻/g, '軽'],
    [/泽/g, '沢'],
    [/叶/g, '葉'],
    [/银/g, '銀'],
    [/锦/g, '錦'],
    [/浅/g, '浅'],
    [/马/g, '馬'],
    [/场/g, '場'],
    [/宫/g, '宮'],
    [/盘/g, '盤'],
    [/团/g, '団'],
    [/乐/g, '楽'],
    [/萤/g, 'ほたる'],
    [/骏/g, '駿'],
    [/湾/g, '湾'],
    [/莲/g, '蓮'],
    [/谈/g, '談'],
    [/黑/g, '黒']
  ];

  function normalizeStationStem(raw) {
    let s = String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/(?:サービスエリア|パーキングエリア|车站|駅|站|station|sta\.?|sa|pa|ic)$/i, '');
    ZH_TO_JA_MAP.forEach(([re, rep]) => {
      s = s.replace(re, rep);
    });
    return s;
  }

  async function geocodeStationOnline(rawQuery) {
    const clean = String(rawQuery || '').trim();
    if (!clean || typeof fetch !== 'function') return [];
    const looksLikeStation =
      !/[0-9]|http|市|区|町|ホテル|hotel|sa|pa|ic/i.test(clean) && !/[駅站]$/.test(clean);
    const tries = looksLikeStation ? [`${clean}駅`, clean] : [clean];
    for (const q of tries) {
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), 4500) : null;
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=jp&limit=5&accept-language=ja,zh&q=${encodeURIComponent(
          q
        )}`;
        const res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
        if (timer) clearTimeout(timer);
        if (!res.ok) continue;
        const arr = await res.json();
        if (Array.isArray(arr) && arr.length) {
          return arr
            .filter(it => it && it.lat != null && it.lon != null)
            .map(it => {
              const parts = String(it.display_name || '')
                .split(',')
                .map(x => x.trim())
                .filter(Boolean);
              let baseName = it.name || parts[0] || clean;
              if ((it.type === 'station' || it.type === 'halt' || it.category === 'railway') && !/[駅站]$/.test(baseName)) {
                baseName += '駅';
              }
              const isSapa = /service|rest_area|motorway/i.test(`${it.type} ${it.category}`) || /(?:SA|PA)$/i.test(baseName);
              return {
                icon: isSapa ? '🛣️' : '🚉',
                name: baseName.slice(0, 40),
                hint: parts.slice(1, 3).join(' · ') || '日本全国在线检索',
                lat: +parseFloat(it.lat).toFixed(5),
                lng: +parseFloat(it.lon).toFixed(5)
              };
            });
        }
      } catch (_) {
        if (timer) clearTimeout(timer);
      }
    }
    return [];
  }

  async function reverseGeocodeOnline(lat, lng) {
    if (typeof fetch !== 'function' || lat == null || lng == null) return null;
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 3200) : null;
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lng)}&zoom=17&accept-language=ja,zh`;
      const res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
      if (timer) clearTimeout(timer);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data) return null;
      const a = data.address || {};
      const city = a.city || a.ward || a.town || a.village || a.county || '';
      const area = a.neighbourhood || a.quarter || a.suburb || a.road || '';
      const poi = data.name || a.railway || a.amenity || '';
      const combined = [city, area, poi && poi !== area ? poi : ''].filter(Boolean).join('・');
      return (combined || (data.display_name || '').split(',').slice(0, 2).join('・') || '').slice(0, 36) || null;
    } catch (_) {
      if (timer) clearTimeout(timer);
      return null;
    }
  }

  const fmtTime = min => {
    const m = ((Math.round(min) % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };

  const fmtClockHMS = d =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

  const parseTime = str => {
    if (!str || !/^\d{1,2}:\d{2}$/.test(str.trim())) return null;
    const [h, m] = str.trim().split(':').map(Number);
    return h * 60 + m;
  };

  const nowLocalMin = () => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  };

  const todayTokyoYmd = () => {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
    } catch (_) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
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
      showPageToast._t = setTimeout(() => el.classList.remove('show'), 3000);
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
      checkinSpot: savedState.checkinSpot || null, // { nodeId, name, lat, lng, timeMin, updatedAt, source }
      activeTab: 'live',
      simClockMin: null,       // Set when testing Replay Scenarios or custom HH:MM simulation
      forceRealClock: false,   // Set when user checks in with real GPS/spot or sets custom deadline
      forcePreviewClock: false, // Set when user explicitly clicks "切回基准预览"
      guardActive: false,
      gpsActive: false,
      gpsPinging: false,
      gpsCheckingIn: false,
      gpsFixCount: 0,
      gpsLastFixAt: null,
      gpsLastFixClock: '',
      gpsLastError: null,
      gpsInfo: null,
      observedPace: savedState.observedPace || null,
      live: Object.assign({ status: {}, stayMode: 'full', hereMode: 'full', appliedAt: null }, savedState.live || {}),
      lastAlertSig: ''
    };

    let watchId = null;
    let gpsFreshTimer = null;
    let lastRenderedGpsFresh = false;
    const GPS_STALE_SEC = 30;
    const GPS_POOR_ACCURACY_M = 100;
    let wakeLockSentinel = null;
    let guardTimer = null;
    let swReg = null;
    let deferredInstallPrompt = null;

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
        checkinSpot: state.checkinSpot,
        observedPace: state.observedPace,
        live: state.live
      });
    }

    function savePrefs() {
      safeSave(GLOBAL_PREF_KEY, globalPrefs);
    }

    // Unified Smart Clock Context: prevents false "落后 257 分钟" on archived/finished trips
    // and keeps Replay Scenarios, GPS/Place Check-ins & Custom Deadlines 100% synchronized!
    function getHardLimitMin() {
      const d = config.deadlineSpec || {};
      if (d.trains && d.trains.length) {
        return d.trains[d.trains.length - 1].dep;
      }
      return d.hardArrMin || 1260;
    }

    function isWithinLiveTripWindow(realNow) {
      const m = realNow != null ? realNow : nowLocalMin();
      const isToday = Boolean(config.date && todayTokyoYmd() === config.date);
      const winStart = (config.defaultDepMin || 600) - 90;
      const winEnd = getHardLimitMin() + 30;
      return isToday && m >= winStart && m <= winEnd;
    }

    function getClockContext() {
      const realNow = nowLocalMin();
      if (state.simClockMin != null) {
        return {
          now: state.simClockMin + (state.anchor.extraDelayMin || 0),
          mode: 'sim',
          realNow
        };
      }
      const sixHoursMs = 6 * 3600 * 1000;
      const hasRecentLiveAction = Boolean(
        !state.forcePreviewClock &&
          ((state.live &&
            state.live.deadlines &&
            state.live.deadlines[0] &&
            state.live.deadlines[0].updatedAt &&
            Date.now() - state.live.deadlines[0].updatedAt < sixHoursMs) ||
            (state.checkinSpot && state.checkinSpot.updatedAt && Date.now() - state.checkinSpot.updatedAt < sixHoursMs))
      );
      if (!state.forcePreviewClock && (state.forceRealClock || hasRecentLiveAction || isWithinLiveTripWindow(realNow))) {
        return { now: realNow, mode: 'live', realNow };
      }
      const isToday = Boolean(config.date && todayTokyoYmd() === config.date);
      const winEnd = getHardLimitMin() + 30;
      return {
        now: state.anchor.timeMin + (state.anchor.extraDelayMin || 0),
        mode: 'preview',
        realNow,
        isPastToday: isToday && realNow > winEnd
      };
    }

    // Lookup base drive/walk minutes between any two active nodes
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
          if (toIdx - fromIdx > 1) base = Math.round(base * 0.92);
        } else {
          base = 30;
        }
      }
      return Math.round(base * (pace || 1.0));
    }

    function computeBaselineMap() {
      const active = config.nodes.filter(
        n => n.role === 'origin' || n.role === 'meal' || n.role === 'destination' || n.role === 'after' || defaultEnabled[n.id]
      );
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
        const origOrder = config.nodes.findIndex(n => n.id === anchor.nodeId);
        anchorIdx = 0;
        activeNodes.forEach((n, i) => {
          if (config.nodes.findIndex(x => x.id === n.id) <= origOrder) anchorIdx = i;
        });
      }

      const timeline = [];
      let t = anchor.timeMin + (anchor.extraDelayMin || 0);

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

    function getDelayVsBaseline() {
      const a = state.anchor;
      const base = baselineMap[a.nodeId];
      let delta = a.extraDelayMin || 0;
      if (base) {
        const ref = a.event === 'dep' ? base.dep : base.arr;
        delta = a.timeMin + (a.extraDelayMin || 0) - ref;
      }
      if (isGpsFresh() && state.gpsInfo.liveDeltaMin != null) {
        delta = Math.max(delta, state.gpsInfo.liveDeltaMin);
      }
      return delta;
    }

    function generateReplanProposals(currentSim, delayMin, anchorOverride) {
      const effAnchor = anchorOverride || state.anchor;
      const anchorOrigIdx = config.nodes.findIndex(n => n.id === effAnchor.nodeId);
      const remainingOptional = config.nodes.filter((n, idx) => idx > anchorOrigIdx && n.role === 'optional');
      const remainingCore = config.nodes.filter((n, idx) => idx > anchorOrigIdx && n.role === 'core');
      const mealNode = config.nodes.find((n, idx) => idx >= anchorOrigIdx && n.role === 'meal');

      const rescuePace = Math.min(Math.max(state.paceFactor, 1.05), 1.2);
      const proposals = [];

      // Plan A: Save Golden Target Deadline
      {
        const enA = Object.assign({}, state.enabledNodes);
        const stA = {};
        const pills = [];

        remainingOptional.forEach(n => {
          if (enA[n.id]) pills.push({ cls: 'cut', txt: `✂️ 砍掉 ${n.shortName || n.name}` });
          enA[n.id] = false;
        });

        if (mealNode && (effAnchor.nodeId !== mealNode.id || effAnchor.event === 'arr')) {
          const fastMeal = mealNode.minStayMin || 50;
          stA[mealNode.id] = fastMeal;
          pills.push({ cls: 'trim', txt: `⏱️ ${mealNode.shortName || '前站'}压至 ${fastMeal}分` });
        }

        remainingCore.forEach(n => {
          enA[n.id] = true;
          stA[n.id] = n.minStayMin || 18;
        });

        let simA = simulateSchedule({
          anchor: effAnchor,
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
            anchor: effAnchor,
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
          name:
            config.planAName ||
            (isTransit ? '🛡️ 方案一（首推）：稳保22:00铁律・砍第2轩从容归宅版' : '🛡️ 方案一（首推）：稳救黄金死线・砍支线直穿版'),
          summary: simA.matchedTrain
            ? `确保 ${fmtTime(simA.destArr)} 抵${config.deadlineSpec.destName || '站'}，稳赶【${simA.matchedTrain.name}】（缓冲 ${simA.bufferMin} 分钟）！`
            : simA.headline,
          pills,
          sim: simA,
          anchorOverride: anchorOverride || null,
          patch: { enabledNodes: enA, stayOverrides: stA, paceFactor: rescuePace, emergencyMode: false, liveStayMode: 'min' }
        });
      }

      // Plan B: Keep Core Stop compressed
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
        if (mealNode && (effAnchor.nodeId !== mealNode.id || effAnchor.event === 'arr')) {
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
          anchor: effAnchor,
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
            anchor: effAnchor,
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
          anchorOverride: anchorOverride || null,
          patch: { enabledNodes: enB, stayOverrides: stB, paceFactor: paceB, emergencyMode: false, liveStayMode: 'min' }
        });
      }

      // Plan C: Emergency Direct Fallback
      if (config.deadlineSpec && config.deadlineSpec.emergencyDirect) {
        const em = config.deadlineSpec.emergencyDirect;
        const stC = {};
        if (mealNode && !em.keepFullStays) stC[mealNode.id] = mealNode.stayMin ? Math.min(mealNode.stayMin, 55) : 55;
        const enC = Object.assign({}, state.enabledNodes);
        if (em.includeRemainingCore) {
          remainingCore.forEach(n => {
            enC[n.id] = true;
          });
        }
        const simC = simulateSchedule({
          anchor: effAnchor,
          enabledNodes: enC,
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
          anchorOverride: anchorOverride || null,
          patch: { enabledNodes: enC, stayOverrides: stC, paceFactor: rescuePace, emergencyMode: true, liveStayMode: 'full' }
        });
      }

      return proposals;
    }

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

      const depMin = config.defaultDepMin || 600;
      events.push({
        uid: `${config.tripId}-preflight@trip-copilot`,
        start: depMin - 10,
        end: depMin,
        summary: isTransit
          ? `🚨【开场防呆】${(config.gateLabels && config.gateLabels.icsPreflightTitle) || '确认Suica余额＋拒理客引き＋落座开40分表'}`
          : `🚨【发车防呆】关Google Maps避开收费站＋确认ETC绿灯`,
        desc: `${config.tollReminder || ''}\\n${config.etcCashReminder || ''}\\n打开实时护航页：${baseUrl}?copilot=1`,
        url: `${baseUrl}?copilot=1`
      });

      sim.timeline.forEach(item => {
        if (item.node.role === 'origin') {
          if (!isTransit) {
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
          '微信内置浏览器会拦截系统日历写入。请点击右上角「···」→「在默认浏览器中打开」，再点一次即可将关键死线双闹钟一键写入手机锁屏！',
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

    async function dispatchStrongNotifications(title, body, targetUrl, level) {
      const isCrit = level === 'err' && globalPrefs.barkLevel === 'critical';
      const results = [];

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
              group: '行程实时护航',
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
      closeBtn.textContent = '我知道了（查看重排方案）';
      closeBtn.addEventListener('click', () => modal.classList.remove('show'));
      actWrap.appendChild(closeBtn);

      modal.classList.add('show');
    }

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
        speakZh('常亮语音护航已开启，屏幕将保持常亮，为您盯防死线与晚点风险。');
        showPageToast('🛡️ 屏幕常亮＋语音护航已开启');
        clearInterval(guardTimer);
        guardTimer = setInterval(runClockWatchdog, 30000);
      } else {
        if (wakeLockSentinel) {
          wakeLockSentinel.release().catch(() => {});
          wakeLockSentinel = null;
        }
        clearInterval(guardTimer);
        guardTimer = null;
        showPageToast('已关闭屏幕常亮护航');
      }
      render();
    }

    function runClockWatchdog() {
      if (!state.guardActive) return;
      const sim = simulateSchedule({});
      const nowM = nowLocalMin();
      const firstAt = sim.timeline[0];
      if (!firstAt) return;

      if (firstAt.stay > 0 && nowM >= firstAt.dep - 10 && nowM <= firstAt.dep + 2) {
        const sig = `dep10_${firstAt.node.id}_${firstAt.dep}`;
        if (state.lastAlertSig !== sig) {
          state.lastAlertSig = sig;
          const msg = `距离离开 ${firstAt.node.shortName || firstAt.node.name} 的死线时间 ${fmtTime(firstAt.dep)} 仅剩不到 10 分钟，请立即准备结账出发。`;
          playChime('warn');
          speakZh(msg);
          if (globalPrefs.autoBark) dispatchStrongNotifications('⏰ 10分钟死线提醒', msg, firstAt.node.navUrl, 'warn');
        }
      }
    }

    // ===== Self-Proving Live GPS Engine (1-sec heartbeat + on-demand ping test) =====
    function gpsAgeSec() {
      return state.gpsLastFixAt ? Math.max(0, Math.floor((Date.now() - state.gpsLastFixAt) / 1000)) : null;
    }

    function isGpsFresh() {
      const age = gpsAgeSec();
      return Boolean(state.gpsActive && state.gpsInfo && age != null && age < GPS_STALE_SEC);
    }

    function gpsStatusModel() {
      if (!state.gpsActive) {
        if (state.gpsInfo) {
          const acc = state.gpsInfo.accuracy;
          const near = state.gpsInfo.nearestName ? ` · 邻近 ${state.gpsInfo.nearestName}` : '';
          return {
            cls: 'ok',
            dockTxt: '🟢 已定位',
            headline: `✅ 已取用当前 GPS 位置（${state.gpsLastFixClock || '刚刚'} · 精度 ±${acc ?? '?'}m）`,
            meta: `${near ? near.slice(3) + ' · ' : ''}如需移动中持续刷新可点右上「🛰️ 自动追踪」`
          };
        }
        return {
          cls: 'off',
          dockTxt: '',
          headline: 'GPS 持续追踪：未开启',
          meta: '点上方按钮可单次取用当前位置，或点「自动追踪」持续跟随'
        };
      }
      const acc = state.gpsInfo ? state.gpsInfo.accuracy : null;
      const age = gpsAgeSec();
      const near = state.gpsInfo && state.gpsInfo.nearestName ? ` · 邻近 ${state.gpsInfo.nearestName}` : '';

      if (age == null) {
        if (state.gpsLastError) {
          return {
            cls: 'lost',
            dockTxt: '🛰️ 无信号',
            headline: `⚪ GPS 搜星受阻（${state.gpsLastError}）`,
            meta: '后台仍在持续搜星；若在室内/地下可走到室外再点右侧「立即测位」验证'
          };
        }
        return {
          cls: 'wait',
          dockTxt: '🛰️ 连接中',
          headline: '🔵 正在连接手机 GPS 卫星…',
          meta: '首次开启请点「允许」定位权限，并在室外或窗边稍候 3–8 秒'
        };
      }

      const ageTxt = age < 60 ? `${age}秒前` : `${Math.floor(age / 60)}分${age % 60}秒前`;
      if (age >= GPS_STALE_SEC) {
        return {
          cls: 'lost',
          dockTxt: `🛰️ 中断 ${age}s`,
          headline: `⚪ GPS 信号暂时中断（最后更新 ${ageTxt}）`,
          meta: `上次 ${state.gpsLastFixClock} (±${acc ?? '?'}m) · 地下/店内无信号属正常，出地面自动恢复；旧定位已暂停计入晚点`
        };
      }
      if (acc != null && acc > GPS_POOR_ACCURACY_M) {
        return {
          cls: 'weak',
          dockTxt: `🛰️ 弱 ±${acc}m`,
          headline: `🟡 GPS 信号偏弱 · ${ageTxt}刷新（精度 ±${acc}m）`,
          meta: `更新 #${state.gpsFixCount} (${state.gpsLastFixClock})${near} · 室内正用 Wi-Fi/基站估算`
        };
      }
      return {
        cls: 'ok',
        dockTxt: `🟢 GPS ${age}s`,
        headline: `🟢 GPS 正常稼働中 · ${ageTxt}刷新（精度 ±${acc ?? '?'}m）`,
        meta: `更新 #${state.gpsFixCount} (${state.gpsLastFixClock})${near}${
          state.gpsInfo && state.gpsInfo.speedKmh != null ? ` · 速度 ${state.gpsInfo.speedKmh}km/h` : ''
        }`
      };
    }

    function renderGpsBarHtml() {
      const m = gpsStatusModel();
      const mapUrl =
        state.gpsInfo && state.gpsInfo.lat != null
          ? `https://www.google.com/maps/search/?api=1&query=${state.gpsInfo.lat},${state.gpsInfo.lng}`
          : '';
      return `
        <div class="cp-gps-card ${m.cls}" id="cp-gps-card">
          <div class="cp-gps-left">
            <span class="cp-gps-dot" aria-hidden="true"></span>
            <div class="cp-gps-main">
              <b id="cp-gps-headline">${escapeHtml(m.headline)}</b>
              <span class="cp-gps-meta" id="cp-gps-meta">${escapeHtml(m.meta)}</span>
            </div>
          </div>
          <div class="cp-gps-actions">
            ${
              state.gpsActive
                ? `<button type="button" class="cp-gps-btn-sm" id="cp-gps-ping" ${state.gpsPinging ? 'disabled' : ''}>${
                    state.gpsPinging ? '⏳ 测位中…' : '🔄 立即测位'
                  }</button>
                  <a class="cp-gps-btn-sm" id="cp-gps-map" href="${mapUrl || '#'}" target="_blank" rel="noopener" title="在 Google 地图核对当前蓝点" style="display:${
                    mapUrl ? 'inline-flex' : 'none'
                  }">🗺️ 地图核对</a>
                  <button type="button" class="cp-gps-btn-sm" id="cp-gps-toggle-top">⏹️ 关闭</button>`
                : `<button type="button" class="cp-gps-btn-sm pri" id="cp-gps-toggle-top">🛰️ 开启GPS自动追踪</button>`
            }
            <button type="button" class="cp-gps-btn-sm ${state.guardActive ? 'on' : ''}" id="cp-guard-toggle-top">
              ${state.guardActive ? '🛡️ 常亮语音中' : '🛡️ 常亮护航'}
            </button>
          </div>
        </div>`;
    }

    // In-place update on 1s ticks so buttons are NEVER detached mid-tap!
    function refreshGpsBarOnly(flash) {
      const m = gpsStatusModel();
      const card = document.getElementById('cp-gps-card');
      const hd = document.getElementById('cp-gps-headline');
      const meta = document.getElementById('cp-gps-meta');
      const pingBtn = document.getElementById('cp-gps-ping');
      const mapLink = document.getElementById('cp-gps-map');

      if (card && hd && meta) {
        card.className = `cp-gps-card ${m.cls}` + (flash ? ' flash' : '');
        hd.textContent = m.headline;
        meta.textContent = m.meta;
        if (pingBtn) {
          pingBtn.disabled = Boolean(state.gpsPinging);
          pingBtn.textContent = state.gpsPinging ? '⏳ 测位中…' : '🔄 立即测位';
        }
        if (mapLink) {
          if (state.gpsInfo && state.gpsInfo.lat != null) {
            mapLink.href = `https://www.google.com/maps/search/?api=1&query=${state.gpsInfo.lat},${state.gpsInfo.lng}`;
            mapLink.style.display = 'inline-flex';
          } else {
            mapLink.style.display = 'none';
          }
        }
        if (flash) {
          setTimeout(() => card.classList.remove('flash'), 700);
        }
      }

      const dockGps = document.getElementById('cp-dock-gps');
      if (dockGps) {
        dockGps.className = `cp-dock-gps ${m.cls}`;
        dockGps.textContent = m.dockTxt;
        dockGps.style.display = state.gpsActive ? 'inline-flex' : 'none';
      }

      const fresh = isGpsFresh();
      if (fresh !== lastRenderedGpsFresh) {
        render();
      }
    }

    function bindGpsBarEvents(root) {
      root.querySelector('#cp-gps-toggle-top')?.addEventListener('click', toggleGpsMode);
      root.querySelector('#cp-gps-ping')?.addEventListener('click', pingGpsNow);
      root.querySelector('#cp-guard-toggle-top')?.addEventListener('click', () => toggleGuardMode());
    }

    function startGpsFreshTicker() {
      if (gpsFreshTimer) clearInterval(gpsFreshTimer);
      gpsFreshTimer = setInterval(() => {
        if (document.visibilityState === 'visible') refreshGpsBarOnly(false);
      }, 1000);
    }

    function stopGps() {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      watchId = null;
      if (gpsFreshTimer) clearInterval(gpsFreshTimer);
      gpsFreshTimer = null;
      state.gpsActive = false;
      state.gpsPinging = false;
      state.gpsInfo = null;
      state.gpsLastFixAt = null;
      state.gpsLastError = null;
    }

    function recordRawFix(coords) {
      state.gpsFixCount += 1;
      state.gpsLastFixAt = Date.now();
      state.gpsLastFixClock = fmtClockHMS(new Date());
      state.gpsLastError = null;
      gpsTrail.push({ t: Date.now(), lat: coords.latitude, lng: coords.longitude });
      while (gpsTrail.length && Date.now() - gpsTrail[0].t > 5 * 60000) gpsTrail.shift();
      handleGpsPosition(coords);
    }

    function toggleGpsMode() {
      if (!('geolocation' in navigator)) {
        showPageToast('当前浏览器不支持 GPS 定位，请直接使用站点打卡');
        return;
      }
      if (state.gpsActive) {
        stopGps();
        showPageToast('已停止实时 GPS 监测');
        render();
        return;
      }

      unlockAudio();
      if (isWithinLiveTripWindow()) {
        state.simClockMin = null;
      }
      state.gpsActive = true;
      state.gpsFixCount = 0;
      state.gpsLastFixAt = null;
      state.gpsLastError = null;
      showPageToast('🛰️ 已开启 GPS 监测！正在请求卫星定位…');
      render();
      startGpsFreshTicker();

      watchId = navigator.geolocation.watchPosition(
        pos => {
          recordRawFix(pos.coords);
          refreshGpsBarOnly(true);
        },
        err => {
          if (err.code === 1) {
            stopGps();
            showPageToast('定位权限被拒绝：请在手机「设置 → 隐私与安全性 → 定位服务 → 浏览器」允许访问并开启精确位置');
            render();
            return;
          }
          const firstError = !state.gpsLastError;
          state.gpsLastError = err.code === 3 ? '搜星超时' : '暂无卫星信号';
          if (firstError) showPageToast(`🛰️ GPS 信号弱（${state.gpsLastError}），后台持续重连中…`);
          refreshGpsBarOnly(false);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    }

    // Active 1-tap GPS verification test ("GPSが稼働中か確認")
    function pingGpsNow() {
      if (!('geolocation' in navigator)) {
        showPageToast('当前浏览器不支持 GPS 定位');
        return;
      }
      unlockAudio();
      state.gpsPinging = true;
      refreshGpsBarOnly(false);

      navigator.geolocation.getCurrentPosition(
        pos => {
          state.gpsPinging = false;
          recordRawFix(pos.coords);
          playChime('ok');
          refreshGpsBarOnly(true);
          const acc = Math.round(pos.coords.accuracy || 0);
          const near = state.gpsInfo ? state.gpsInfo.nearestName : '';
          showPageToast(`✅ GPS 稼働確認OK！${state.gpsLastFixClock} 实测成功（精度 ±${acc}m · 邻近 ${near}）`);
        },
        err => {
          state.gpsPinging = false;
          if (err.code === 1) {
            stopGps();
            showPageToast('❌ 定位权限未开启：请检查手机系统设置 → 定位服务');
            render();
            return;
          }
          state.gpsLastError = err.code === 3 ? '测位超时（可能在室内/地下）' : '暂时无法获取卫星定位';
          refreshGpsBarOnly(false);
          showPageToast(`⚠️ 立即测位未果：${state.gpsLastError}。走到室外可自动恢复`);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }

    function handleGpsPosition(coords) {
      const { latitude: lat, longitude: lng, speed, accuracy } = coords;
      const speedKmh = speed != null && speed >= 0 ? Math.round(speed * 3.6) : null;
      const allowAutoGeofence = isWithinLiveTripWindow() || state.forceRealClock;

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

      const distFmt = minDist < 1 ? `${Math.round(minDist * 1000)}m` : `${minDist.toFixed(1)}km`;
      const nearestName = nearest ? `${nearest.shortName || nearest.name} (${distFmt})` : '--';

      if (
        allowAutoGeofence &&
        nearest &&
        minDist <= (nearest.radiusKm || (config.mode === 'transit' ? 0.06 : 0.65)) &&
        state.anchor.nodeId !== nearest.id &&
        !['origin', 'destination', 'after'].includes(nearest.role) &&
        liveStatus(nearest) === 'want'
      ) {
        state.gpsInfo = {
          lat: lat.toFixed(4),
          lng: lng.toFixed(4),
          speedKmh,
          accuracy: Math.round(accuracy || 0),
          nearestName,
          remKm: null,
          liveDeltaMin: null,
          slowRoadWarn: false
        };
        recordCheckin(nearest.id, 'arr', nowLocalMin(), 'GPS 围栏自动识别到站', { isRealTime: true });
        return;
      }

      const nextItem = sim.timeline.find(x => x.status === 'upcoming') || sim.timeline[0];
      let remKm = null;
      let liveDeltaMin = null;
      let slowRoadWarn = false;

      if (nextItem && nextItem.node.lat != null) {
        remKm = Math.round(haversineKm(lat, lng, nextItem.node.lat, nextItem.node.lng) * 10) / 10;
        const rad = nextItem.node.radiusKm || (config.mode === 'transit' ? 0.06 : 0.65);
        if (allowAutoGeofence && remKm <= rad && state.anchor.nodeId !== nextItem.node.id) {
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
          recordCheckin(nextItem.node.id, 'arr', nowLocalMin(), 'GPS 围栏自动识别到站', { isRealTime: true });
          return;
        }

        if (allowAutoGeofence) {
          const estSpeed = speedKmh && speedKmh > 18 ? Math.min(85, Math.max(25, speedKmh)) : config.mode === 'transit' ? 18 : 55;
          const estRemMin = Math.round(((remKm * 1.28) / estSpeed) * 60);
          const liveEta = nowLocalMin() + estRemMin;
          const baseTarget = baselineMap[nextItem.node.id];
          if (baseTarget) {
            liveDeltaMin = liveEta - baseTarget.arr;
          }
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

    // Core action: Check-in at a node or Replay simulation
    function recordCheckin(nodeId, eventType, timeMin, reason, opts) {
      unlockAudio();
      const options = opts || {};
      const realNow = nowLocalMin();

      if (options.isReplay || Math.abs(timeMin - realNow) > 8) {
        state.simClockMin = timeMin;
      } else if (options.isRealTime) {
        state.simClockMin = null;
        state.forceRealClock = true;
      }

      const prevAnchor = state.anchor;
      const isStop = id => {
        const n = config.nodes.find(x => x.id === id);
        return n && !['origin', 'destination', 'after'].includes(n.role);
      };

      // Mark earlier stops before nodeId as done when checking in mid-route
      const targetIdx = config.nodes.findIndex(x => x.id === nodeId);
      config.nodes.forEach((n, idx) => {
        if (!isStop(n.id)) return;
        if (idx < targetIdx) {
          state.live.status[n.id] = 'done';
        } else if (idx > targetIdx && options.isReplay) {
          state.live.status[n.id] = n.role === 'meal' || state.enabledNodes[n.id] ? 'want' : 'skip';
        }
      });

      if (prevAnchor && prevAnchor.event === 'arr' && prevAnchor.nodeId !== nodeId && isStop(prevAnchor.nodeId)) {
        state.live.status[prevAnchor.nodeId] = 'done';
      }
      if (eventType === 'dep' && isStop(nodeId)) state.live.status[nodeId] = 'done';
      if (eventType === 'arr' && isStop(nodeId)) state.live.status[nodeId] = 'want';
      if (eventType === 'arr') state.live.hereMode = 'full';
      if (options.isReplay) {
        state.live.stayMode = 'full';
        state.live.appliedAt = null;
      }

      const checkedNode = config.nodes.find(x => x.id === nodeId);
      state.checkinSpot = checkedNode
        ? {
            nodeId: checkedNode.id,
            name: checkedNode.shortName || checkedNode.name,
            lat: checkedNode.lat,
            lng: checkedNode.lng,
            timeMin,
            event: eventType,
            updatedAt: options.isReplay ? null : Date.now(),
            source: options.isReplay ? 'replay' : 'node'
          }
        : null;

      state.anchor = {
        nodeId,
        event: eventType,
        timeMin,
        extraDelayMin: 0,
        reason: reason || (eventType === 'arr' ? '手动到站打卡' : '手动离开打卡')
      };
      state.emergencyMode = false;
      state.activePlanId = 'current';

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
        const speech = `注意！当前比原计划滞后 ${delay} 分钟。${sim.headline} 已生成 ${proposals.length} 套重排方案，首推${best ? best.name : '调整行程'}。`;
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
        showPageToast(`✅ 已打卡：${fmtTime(timeMin)}（进度稳健！）`);
      }
    }

    // Unified Plan Apply: updates BOTH schedule state AND live-card stop status!
    function applyProposal(prop) {
      unlockAudio();
      if (prop.anchorOverride) {
        state.anchor = Object.assign({}, prop.anchorOverride);
      }
      if (prop.patch.enabledNodes) {
        state.enabledNodes = Object.assign({}, prop.patch.enabledNodes);
        const anchorIdx = config.nodes.findIndex(n => n.id === state.anchor.nodeId);
        config.nodes.forEach((n, idx) => {
          if (['origin', 'destination', 'after'].includes(n.role)) return;
          if (idx > anchorIdx) {
            state.live.status[n.id] = n.role === 'meal' || state.enabledNodes[n.id] ? 'want' : 'skip';
          }
        });
      }
      if (prop.patch.stayOverrides) state.stayOverrides = Object.assign({}, prop.patch.stayOverrides);
      if (prop.patch.paceFactor != null) state.paceFactor = prop.patch.paceFactor;
      state.emergencyMode = Boolean(prop.patch.emergencyMode);
      state.live.stayMode = prop.patch.liveStayMode || 'full';
      state.live.appliedAt = getClockContext().now;
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
      const lines = [`📢【实时行程动态更新｜${label || '最新重排方案'}】`, `${sim.headline}`];
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

    function buildAiEmergencyPrompt(sim, delayMin, customWish) {
      const isTransit = config.mode === 'transit';
      const aNode = config.nodes.find(n => n.id === state.anchor.nodeId) || config.nodes[0];
      const gpsStale = state.gpsInfo && !isGpsFresh();
      const gpsStr = state.gpsInfo
        ? `GPS (${state.gpsInfo.lat}, ${state.gpsInfo.lng})，邻近 ${state.gpsInfo.nearestName}，移动速度 ${
            state.gpsInfo.speedKmh != null ? state.gpsInfo.speedKmh + 'km/h' : '未知'
          }${gpsStale ? `（注意：这是 ${gpsAgeSec() ?? '?'} 秒前的旧定位，可能已不准）` : ''}`
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
        `- 当前真实时间锚点：${fmtTime(state.anchor.timeMin + (state.anchor.extraDelayMin || 0))}（状态：${
          state.anchor.event === 'arr' ? '刚到达' : '刚离开'
        }「${aNode.shortName || aNode.name}」，较原计划偏差 ${delayMin >= 0 ? '+' + delayMin : delayMin} 分钟）`,
        `- 当前位置：${gpsStr}`,
        `- 实测/设定节奏系数：${state.observedPace ? `前半段实测 ${state.observedPace}x / ` : ''}后续设定 ${state.paceFactor}x`,
        `- 已走进度：${doneList}`,
        `- 当前推演剩余时间线：${remList}`,
        `- 系统风险判定：${sim.headline}`,
        customWish
          ? `- 💬 我们的临时新诉求：${customWish}`
          : `- 💬 诉求：在绝不耽误核心硬死线的前提下，给出最省时、不踩雷、零容错的后续取舍与替代建议`,
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

    // Build persistent DOM skeleton (Sticky Bottom Dock + Urgent Modal)
    ensureGlobalOverlays();

    function switchTab(tabName, scrollToConsole) {
      state.activeTab = tabName || 'live';
      render();
      if (scrollToConsole) {
        const targetEl = tabName === 'deadline' ? document.getElementById('cp-step-1') : mount;
        (targetEl || mount).scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function ensureGlobalOverlays() {
      document.body.classList.add('has-cp-dock');
      if (!document.getElementById('cp-dock')) {
        const dock = document.createElement('div');
        dock.className = 'cp-dock';
        dock.id = 'cp-dock';
        dock.innerHTML = `
          <div class="cp-dock-inner">
            <div class="cp-dock-status" id="cp-dock-jump" title="点击查看 Ahead / Behind 判定与取舍">
              <div>
                <span class="cp-dock-badge" id="cp-dock-badge">🟢 准点待命</span>
                <span class="cp-dock-gps" id="cp-dock-gps" style="display:none"></span>
              </div>
              <div class="cp-dock-sub" id="cp-dock-sub">点右侧「现地打卡」确定当前位置并计算裕度</div>
            </div>
            <div class="cp-dock-btns">
              <button type="button" class="cp-dock-btn pri" id="cp-dock-checkin">📡 现地打卡</button>
              <button type="button" class="cp-dock-btn" id="cp-dock-guard">🛡️ 护航</button>
            </div>
          </div>`;
        document.body.appendChild(dock);

        document.getElementById('cp-dock-jump').addEventListener('click', () => {
          const s3 = document.getElementById('cp-step-3') || mount;
          s3.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        document.getElementById('cp-dock-checkin').addEventListener('click', () => {
          const s2 = document.getElementById('cp-step-2') || mount;
          s2.scrollIntoView({ behavior: 'smooth', block: 'start' });
          checkinViaGps();
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

    // ===== v3.0 Core Engine: Target Deadline + Check-in Origin + Ahead/Behind + Stop Pruning =====
    const STOP_ROLES_EXCLUDED = ['origin', 'destination', 'after'];
    const LIVE_SAFE_MIN = 5;
    const LEAVE_ALERTS = [15, 5, 0];
    const stopNodes = () => config.nodes.filter(n => !STOP_ROLES_EXCLUDED.includes(n.role));
    const destNode = () =>
      config.nodes.find(n => n.id === ((config.deadlineSpec && config.deadlineSpec.destNodeId) || 'dest')) ||
      config.nodes.filter(n => n.role === 'destination').pop() ||
      config.nodes[config.nodes.length - 1];

    let lastNowCard = null;
    const leaveAlertPrev = {};
    const gpsTrail = [];
    let onlineSuggestCache = [];
    let checkinSuggestCache = [];

    function liveStatus(n) {
      const st = state.live.status[n.id];
      if (st) return st;
      return n.role === 'meal' || state.enabledNodes[n.id] ? 'want' : 'skip';
    }

    function defaultDeadlines() {
      const d = config.deadlineSpec || {};
      const dest = destNode();
      if (d.trains && d.trains.length) {
        const buf = d.transferBufferMin || 10;
        const last = d.trains[d.trains.length - 1];
        const finalHint = last.finalBadge ? ` → ${last.finalBadge}` : '';
        return [
          {
            id: 'cfg',
            nodeId: dest.id,
            time: last.dep - buf,
            label: `赶 ${fmtTime(last.dep)} 末班${finalHint}`,
            presetLabel: true,
            fromConfig: true
          }
        ];
      }
      return [
        {
          id: 'cfg',
          nodeId: dest.id,
          time: d.hardArrMin || 1080,
          label: '最晚安全红线',
          presetLabel: true,
          fromConfig: true
        }
      ];
    }

    function sanitizeLoadedDeadlines(list) {
      if (!Array.isArray(list) || !list.length) return null;
      const def = defaultDeadlines()[0];
      return list.map(item => {
        const copy = Object.assign({}, item);
        if (copy.label && copy.label === def.label && (copy.nodeId !== def.nodeId || copy.time !== def.time)) {
          copy.label = '';
          copy.presetLabel = false;
        }
        if (copy.nodeId !== def.nodeId || copy.time !== def.time) {
          copy.fromConfig = false;
        }
        return copy;
      });
    }

    const getDeadlines = () => {
      const clean = sanitizeLoadedDeadlines(state.live.deadlines);
      return (clean || defaultDeadlines()).slice().sort((a, b) => a.time - b.time);
    };

    function effectiveDlMin(dlTime, now) {
      if (dlTime < 300 && now >= 1080 && now < 1440) return dlTime + 1440;
      return dlTime;
    }

    function deadlinePlace(dl) {
      const useTaxi = state.live.travelOverride === 'taxi';
      if (dl.nodeId) {
        const found = config.nodes.find(n => n.id === dl.nodeId) || destNode();
        if (!useTaxi || found.lat == null) return found;
        return Object.assign({}, found, {
          navUrl: `https://www.google.com/maps/dir/?api=1&destination=${found.lat},${found.lng}&travelmode=driving`
        });
      }
      const pName = dl.placeName || '自定车站';
      const tm = config.mode === 'transit' && !useTaxi ? 'transit' : 'driving';
      return {
        id: null,
        name: pName,
        shortName: pName,
        lat: dl.lat,
        lng: dl.lng,
        navUrl:
          dl.lat != null
            ? `https://www.google.com/maps/dir/?api=1&destination=${dl.lat},${dl.lng}&travelmode=${tm}`
            : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pName)}&travelmode=${tm}`
      };
    }

    // Search Trip Nodes + 80+ Stations + 38+ Highway SA/PAs (used by both Step 1 Target & Step 2 Check-in!)
    function searchLocalStations(rawQuery) {
      const qRaw = String(rawQuery || '').trim();
      if (!qRaw) return [];
      const qStem = normalizeStationStem(qRaw);
      if (!qStem) return [];

      const seen = new Set();
      const cands = [];

      config.nodes.forEach(n => {
        if (n.lat == null || n.lng == null) return;
        const disp = n.shortName || n.name;
        const stem = normalizeStationStem(disp);
        const fullStem = normalizeStationStem(n.name);
        let score = 0;
        let exact = false;
        if (stem === qStem || fullStem === qStem) {
          score = 105;
          exact = true;
        } else if (stem.startsWith(qStem) || fullStem.startsWith(qStem)) {
          score = 85;
        } else if (stem.includes(qStem) || fullStem.includes(qStem)) {
          score = 65;
        }
        if (score > 0) {
          seen.add(stem);
          cands.push({
            icon: '📍',
            nodeId: n.id,
            name: disp,
            lat: n.lat,
            lng: n.lng,
            hint: '本行程节点',
            score,
            exact
          });
        }
      });

      const scanDict = (dict, icon) => {
        dict.forEach(([stName, lat, lng, lineHint, aliases]) => {
          const stem = normalizeStationStem(stName);
          if (seen.has(stem)) return;
          const aliasNorm = normalizeStationStem(aliases || '');
          const rawLower = qRaw.toLowerCase().trim();
          const aliasTokens = String(aliases || '')
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean);
          let score = 0;
          let exact = false;
          if (stem === qStem || aliasTokens.some(tok => normalizeStationStem(tok) === qStem || tok === rawLower)) {
            score = 100;
            exact = true;
          } else if (stem.startsWith(qStem) || aliasTokens.some(tok => tok.startsWith(rawLower) || normalizeStationStem(tok).startsWith(qStem))) {
            score = 80;
          } else if (stem.includes(qStem) || aliasNorm.includes(qStem)) {
            score = 60;
          }
          if (score > 0) {
            seen.add(stem);
            cands.push({ icon, nodeId: null, name: stName, lat, lng, hint: lineHint, score, exact });
          }
        });
      };

      scanDict(JP_STATIONS, '🚉');
      scanDict(JP_SAPAS, '🛣️');
      return cands.sort((a, b) => b.score - a.score).slice(0, 6);
    }

    // Find closest Stations / Expressway SA・PA / Trip Nodes around any (lat, lng)
    function getNearbyPlaces(lat, lng, limit) {
      if (lat == null || lng == null) return [];
      const seen = new Set();
      const all = [];

      config.nodes.forEach(n => {
        if (n.lat == null || n.lng == null) return;
        const disp = n.shortName || n.name;
        const stem = normalizeStationStem(disp);
        seen.add(stem);
        const distKm = haversineKm(lat, lng, n.lat, n.lng);
        all.push({ icon: '📍', nodeId: n.id, name: disp, lat: n.lat, lng: n.lng, hint: '行程点', distKm });
      });

      JP_STATIONS.forEach(([stName, sLat, sLng, hint]) => {
        const stem = normalizeStationStem(stName);
        if (seen.has(stem)) return;
        seen.add(stem);
        all.push({ icon: '🚉', nodeId: null, name: stName, lat: sLat, lng: sLng, hint, distKm: haversineKm(lat, lng, sLat, sLng) });
      });

      JP_SAPAS.forEach(([saName, sLat, sLng, hint]) => {
        const stem = normalizeStationStem(saName);
        if (seen.has(stem)) return;
        seen.add(stem);
        all.push({ icon: '🛣️', nodeId: null, name: saName, lat: sLat, lng: sLng, hint, distKm: haversineKm(lat, lng, sLat, sLng) });
      });

      return all
        .sort((a, b) => a.distKm - b.distKm)
        .slice(0, limit || 6)
        .map(it =>
          Object.assign({}, it, {
            distTxt: it.distKm < 1 ? `${Math.round(it.distKm * 1000)}m` : `${it.distKm.toFixed(1)}km`
          })
        );
    }

    const nodeOrder = id => config.nodes.findIndex(n => n.id === id);
    function stopsBefore(dl, list) {
      // Custom station/place target is the final goal after remaining wanted stops!
      if (!dl.nodeId) return list.slice();
      const k = nodeOrder(dl.nodeId);
      if (k < 0) return list.slice();
      return list.filter(n => n.id !== dl.nodeId && nodeOrder(n.id) < k);
    }

    function activeDeadline(now) {
      const list = getDeadlines();
      return list.find(d => effectiveDlMin(d.time, now) >= now - 5) || list[list.length - 1];
    }

    function saveDeadlines(list) {
      state.live.deadlines = list;
      saveState();
    }

    function estimateLegMin(km) {
      if (state.live.travelOverride === 'taxi') {
        return Math.max(1, Math.round(5 + ((km * 1.3) / (km > 15 ? 45 : 20)) * 60));
      }
      const pace = state.paceFactor || 1;
      let m;
      if (config.mode === 'transit') m = km <= 1.5 ? ((km * 1.25) / 4.8) * 60 : 10 + ((km * 1.3) / 25) * 60;
      else m = 3 + ((km * 1.3) / (km > 20 ? 70 : 35)) * 60;
      return Math.max(1, Math.round(m * pace));
    }

    function legMin(a, b) {
      if (a.id && b.id && !(config.mode === 'transit' && state.live.travelOverride === 'taxi')) {
        if (a.id === b.id) return 0;
        const map = config.directDriveMap || {};
        const base = map[`${a.id}->${b.id}`] != null ? map[`${a.id}->${b.id}`] : map[`${b.id}->${a.id}`];
        if (base != null) return Math.max(1, Math.round(base * (state.paceFactor || 1)));
      }
      if (a.lat == null || b.lat == null) return 15;
      if (a.lat === b.lat && a.lng === b.lng) return 0;
      return estimateLegMin(haversineKm(a.lat, a.lng, b.lat, b.lng));
    }

    function liveStart(now) {
      const a = state.anchor;
      const aNode = config.nodes.find(n => n.id === a.nodeId) || config.nodes[0];
      const aTime = a.timeMin + (a.extraDelayMin || 0);
      const gps = isGpsFresh() ? { lat: +state.gpsInfo.lat, lng: +state.gpsInfo.lng } : null;
      const spot = state.checkinSpot;

      if (gps) {
        const nearNode =
          spot && spot.nodeId ? config.nodes.find(x => x.id === spot.nodeId) : aNode;
        const inStop =
          nearNode &&
          !STOP_ROLES_EXCLUDED.includes(nearNode.role) &&
          !['done', 'skip'].includes(liveStatus(nearNode)) &&
          nearNode.lat != null &&
          haversineKm(gps.lat, gps.lng, nearNode.lat, nearNode.lng) <= (nearNode.radiusKm || 0.25);
        return {
          here: inStop ? nearNode : null,
          hereArr: inStop ? (spot ? spot.timeMin : aTime) : null,
          pos: inStop ? nearNode : gps,
          source: 'gps',
          label: (spot && spot.source === 'gps' && spot.name) || (state.gpsInfo && `GPS实时定位（邻近 ${state.gpsInfo.nearestName}）`),
          aNode,
          aTime: spot ? spot.timeMin : aTime
        };
      }

      if (spot && (spot.lat != null || spot.nodeId)) {
        const sNode = spot.nodeId ? config.nodes.find(x => x.id === spot.nodeId) : null;
        const inStop =
          sNode &&
          spot.event !== 'dep' &&
          !STOP_ROLES_EXCLUDED.includes(sNode.role) &&
          !['done', 'skip'].includes(liveStatus(sNode));
        return {
          here: inStop ? sNode : null,
          hereArr: inStop ? spot.timeMin : null,
          pos: inStop ? sNode : sNode || { id: null, name: spot.name, shortName: spot.name, lat: spot.lat, lng: spot.lng },
          source: spot.source || 'spot',
          label: spot.name,
          aNode: sNode || aNode,
          aTime: spot.timeMin || aTime
        };
      }

      const inStop =
        a.event === 'arr' && !STOP_ROLES_EXCLUDED.includes(aNode.role) && !['done', 'skip'].includes(liveStatus(aNode));
      return {
        here: inStop ? aNode : null,
        hereArr: inStop ? aTime : null,
        pos: aNode,
        source: 'checkin',
        label: aNode.shortName || aNode.name,
        aNode,
        aTime
      };
    }

    // Unified v3.0 Check-in Action: locks current location (GPS / Station / SA・PA / Node), computes Ahead/Behind, and highlights Step 3!
    function checkinAtSpot(spot, opts) {
      unlockAudio();
      const options = opts || {};
      const realNow = nowLocalMin();
      const tMin = options.customTimeMin != null ? options.customTimeMin : realNow;

      if (options.customTimeMin != null && Math.abs(options.customTimeMin - realNow) > 5) {
        state.simClockMin = options.customTimeMin;
      } else {
        state.simClockMin = null;
        state.forcePreviewClock = false;
        state.forceRealClock = true;
      }

      let nearestNodeId = spot.nodeId || state.anchor.nodeId || config.nodes[0].id;
      if (!spot.nodeId && spot.lat != null) {
        let minD = Infinity;
        config.nodes.forEach(n => {
          if (n.lat == null || n.lng == null || n.role === 'after') return;
          const d = haversineKm(spot.lat, spot.lng, n.lat, n.lng);
          if (d < minD) {
            minD = d;
            nearestNodeId = n.id;
          }
        });
      }

      // If checking in at a trip node mid-route, mark earlier planned ('want') stops as done
      if (spot.nodeId) {
        const idx = config.nodes.findIndex(x => x.id === spot.nodeId);
        config.nodes.forEach((n, i) => {
          if (!STOP_ROLES_EXCLUDED.includes(n.role) && i < idx && liveStatus(n) === 'want') {
            state.live.status[n.id] = 'done';
          }
        });
        const targetNode = config.nodes[idx];
        if (targetNode && !STOP_ROLES_EXCLUDED.includes(targetNode.role)) {
          state.live.status[targetNode.id] = spot.event === 'dep' ? 'done' : 'want';
        }
      }

      state.checkinSpot = {
        nodeId: spot.nodeId || null,
        name: spot.name || '当前打卡位置',
        lat: spot.lat != null ? +spot.lat : null,
        lng: spot.lng != null ? +spot.lng : null,
        timeMin: tMin,
        event: spot.event || 'arr',
        updatedAt: Date.now(),
        source: spot.source || 'spot'
      };

      state.anchor = {
        nodeId: nearestNodeId,
        event: spot.event || (spot.nodeId ? 'arr' : 'dep'),
        timeMin: tMin,
        extraDelayMin: 0,
        reason: `打卡：${state.checkinSpot.name}`
      };
      state.activePlanId = 'current';
      state.emergencyMode = false;

      saveState();
      render();

      const L = computeLive();
      const slack = L.planned.slack;
      if (slack < 0) {
        playChime('err');
        showPageToast(`🚨 已定位「${state.checkinSpot.name}」：Behind 会晚 ${-slack} 分！请在下方面板取舍项目或选拯救方案`);
      } else {
        playChime('ok');
        showPageToast(`✅ 已打卡「${state.checkinSpot.name}」：Ahead 余裕 ${slack} 分钟！`);
      }

      if (options.scrollStep3 !== false) {
        setTimeout(() => {
          const s3 = document.getElementById('cp-step-3');
          if (s3) {
            s3.classList.add('flash-ring');
            s3.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => s3.classList.remove('flash-ring'), 950);
          }
        }, 80);
      }
    }

    // Option 1: 1-tap GPS Current Location Check-in (also populates nearby Stations & SA/PA!)
    function checkinViaGps() {
      if (!('geolocation' in navigator)) {
        showPageToast('⚠️ 当前浏览器不支持 GPS，请直接点选下方「附近车站 / PA・SA」打卡');
        return;
      }
      unlockAudio();
      state.gpsCheckingIn = true;
      const btn = document.getElementById('cp-checkin-gps-btn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ 正在获取当前 GPS 位置…';
      }

      navigator.geolocation.getCurrentPosition(
        pos => {
          state.gpsCheckingIn = false;
          const { latitude: lat, longitude: lng, accuracy, speed } = pos.coords;
          state.gpsFixCount += 1;
          state.gpsLastFixAt = Date.now();
          state.gpsLastFixClock = fmtClockHMS(new Date());
          state.gpsLastError = null;

          const nearList = getNearbyPlaces(lat, lng, 4);
          const closest = nearList[0];
          const nearestName = closest ? `${closest.name} (${closest.distTxt})` : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

          state.gpsInfo = {
            lat: lat.toFixed(5),
            lng: lng.toFixed(5),
            speedKmh: speed != null && speed >= 0 ? Math.round(speed * 3.6) : null,
            accuracy: Math.round(accuracy || 0),
            nearestName,
            remKm: null,
            liveDeltaMin: null,
            slowRoadWarn: false
          };

          const snapNodeId = closest && closest.nodeId && closest.distKm <= 0.12 ? closest.nodeId : null;
          const label =
            closest && closest.distKm <= 0.35
              ? `${closest.name}付近 (${closest.distTxt})`
              : closest
              ? `当前GPS位置（距${closest.name} ${closest.distTxt}）`
              : `当前GPS位置 (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

          checkinAtSpot(
            {
              nodeId: snapNodeId,
              name: label,
              lat,
              lng,
              source: 'gps'
            },
            { scrollStep3: true }
          );

          // Non-blocking online reverse geocode to enrich street/town label if network available
          reverseGeocodeOnline(lat, lng).then(areaName => {
            if (areaName && state.checkinSpot && state.checkinSpot.source === 'gps') {
              const rich = closest && closest.distKm <= 1.2 ? `${areaName}（近${closest.name}）` : areaName;
              state.checkinSpot.name = rich;
              saveState();
              render();
            }
          });
        },
        err => {
          state.gpsCheckingIn = false;
          state.gpsLastError = err.code === 1 ? '未授权定位权限' : '室内信号弱/超时';
          render();
          showPageToast(`⚠️ GPS 暂未取到位置（${state.gpsLastError}），请直接点选下方「车站 / PA・SA」或搜地名打卡！`);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }

    // Explicit 4-way item pruning control in Step 3: 'keep' | 'trim' | 'skip' | 'done'
    function setStopItemMode(nodeId, mode) {
      const n = config.nodes.find(x => x.id === nodeId);
      if (!n) return;
      unlockAudio();

      if (mode === 'keep') {
        state.live.status[nodeId] = 'want';
        state.enabledNodes[nodeId] = true;
        delete state.stayOverrides[nodeId];
      } else if (mode === 'trim') {
        state.live.status[nodeId] = 'want';
        state.enabledNodes[nodeId] = true;
        state.stayOverrides[nodeId] = n.minStayMin || Math.max(15, Math.round((n.stayMin || 40) * 0.65));
      } else if (mode === 'skip') {
        state.live.status[nodeId] = 'skip';
        state.enabledNodes[nodeId] = false;
      } else if (mode === 'done') {
        state.live.status[nodeId] = 'done';
      }

      state.live.appliedAt = getClockContext().now;
      saveState();

      if (typeof config.onApplyPlan === 'function') {
        try {
          config.onApplyPlan({
            enabledNodes: state.enabledNodes,
            stayOverrides: state.stayOverrides,
            paceFactor: state.paceFactor,
            emergencyMode: state.emergencyMode,
            sim: simulateSchedule({})
          });
        } catch (_) {}
      }

      playChime('ok');
      render();
    }

    function simulateLive(start, now, stops, stayMode, hereMode, dlRaw) {
      const dlEffTime = effectiveDlMin(dlRaw.time, now);
      const dl = dlEffTime === dlRaw.time ? dlRaw : Object.assign({}, dlRaw, { time: dlEffTime });
      const legs = [];
      let t = now;
      let pos = start.pos;
      if (start.here) {
        const n = start.here;
        const overrideStay = state.stayOverrides[n.id];
        const want =
          hereMode === 'now'
            ? 0
            : hereMode === 'min'
            ? n.minStayMin || n.stayMin || 0
            : overrideStay != null
            ? overrideStay
            : n.stayMin || 0;
        const leave = Math.max(now, start.hereArr + want);
        legs.push({ node: n, arr: start.hereArr, dep: leave, here: true });
        t = leave;
      }
      stops.forEach(n => {
        const arr = t + legMin(pos, n);
        const overrideStay = state.stayOverrides[n.id];
        const stay =
          stayMode === 'min'
            ? n.minStayMin || n.stayMin || 0
            : overrideStay != null
            ? overrideStay
            : n.stayMin || 0;
        legs.push({ node: n, arr, dep: arr + stay, stay });
        t = arr + stay;
        pos = n;
      });

      const d = config.deadlineSpec || {};
      if (state.emergencyMode && dl.fromConfig && d.emergencyDirect) {
        const em = d.emergencyDirect;
        const fromId = pos && pos.id;
        const baseDrv = (em.driveFrom && (em.driveFrom[fromId] || Object.values(em.driveFrom)[0])) || 45;
        const drvMin = Math.round(baseDrv * (em.fixedPace || state.paceFactor || 1));
        const finalArr = t + drvMin;
        const safeLim = em.safeAirportArrMin || d.hardArrMin || 1320;
        const emPlace = {
          id: 'em_dest',
          name: em.destBadgePrefix || '终点',
          shortName: em.destBadgePrefix || '直达终点',
          navUrl: em.navUrl
        };
        return {
          legs,
          lastDep: t,
          lastNode: pos,
          destArr: finalArr,
          slack: safeLim - finalArr,
          train: null,
          emergency: true,
          emSpec: em,
          place: emPlace,
          dl: Object.assign({}, dl, { time: safeLim, label: em.shortBadge || '直达兜底' }),
          stops,
          stayMode,
          hereMode
        };
      }

      const place = deadlinePlace(dl);
      const destArr = t + legMin(pos, place);
      let train = null;
      if (dl.fromConfig && d.trains && d.trains.length) {
        train = d.trains.find(tr => tr.dep >= destArr + (d.transferBufferMin || 10)) || null;
      }
      return { legs, lastDep: t, lastNode: pos, destArr, slack: dl.time - destArr, train, place, dl, stops, stayMode, hereMode };
    }

    function routeScore(r) {
      let s = 0;
      r.stops.forEach(n => {
        s += n.role === 'meal' || n.role === 'core' ? 10 : 3;
        if (r.stayMode === 'full') s += 1;
      });
      const h = r.legs[0] && r.legs[0].here ? r.legs[0] : null;
      if (h) {
        const minStay = h.node.minStayMin || h.node.stayMin || 0;
        if (r.hereMode === 'full') s += 11;
        else if (r.hereMode === 'min') s += 10;
        else if (h.dep - h.arr >= minStay) s += 10;
      }
      const tgt = config.deadlineSpec && r.dl.fromConfig ? config.deadlineSpec.targetArrMin : null;
      if (tgt && r.destArr <= tgt) s += 0.5;
      return s;
    }

    const sameRoute = (a, b) =>
      a &&
      b &&
      a.stayMode === b.stayMode &&
      a.hereMode === b.hereMode &&
      a.stops.map(s => s.id).join() === b.stops.map(s => s.id).join();

    function computeLive() {
      const clockCtx = getClockContext();
      const now = clockCtx.now;
      const dl = activeDeadline(now);
      const start = liveStart(now);
      const wantAll = stopNodes().filter(n => liveStatus(n) === 'want' && (!start.here || n.id !== start.here.id));
      const want = stopsBefore(dl, wantAll);
      const planned = simulateLive(start, now, want, state.live.stayMode || 'full', start.here ? state.live.hereMode || 'full' : null, dl);

      const cands = [];
      for (let mask = 0; mask < 1 << want.length; mask++) {
        const sub = want.filter((_, i) => mask & (1 << i));
        ['full', 'min'].forEach(sm =>
          (start.here ? ['full', 'min', 'now'] : [null]).forEach(hm => cands.push(simulateLive(start, now, sub, sm, hm, dl)))
        );
      }
      const pick = list => list.slice().sort((x, y) => routeScore(y) - routeScore(x) || y.slack - x.slack)[0];
      const safe = cands.filter(r => r.slack >= LIVE_SAFE_MIN);
      const ok = cands.filter(r => r.slack >= 0);
      const bestSafe = safe.length ? pick(safe) : null;
      const bestTight = ok.length ? pick(ok) : null;
      const best = bestSafe || bestTight || cands.slice().sort((x, y) => y.slack - x.slack)[0];
      const tight = bestTight && bestSafe && routeScore(bestTight) > routeScore(bestSafe) ? bestTight : null;

      let fallback = null;
      const em = config.deadlineSpec && config.deadlineSpec.emergencyDirect;
      if (em && dl.fromConfig && planned.slack < 0 && !planned.emergency) {
        const fromId = planned.lastNode && planned.lastNode.id;
        const drv = Math.round(((em.driveFrom && (em.driveFrom[fromId] || Object.values(em.driveFrom)[0])) || 45) * (em.fixedPace || 1));
        const arr = planned.lastDep + drv;
        const lim = em.safeAirportArrMin || config.deadlineSpec.hardArrMin || 1320;
        fallback = { name: em.cardName || em.title || '直达兜底', arr, slack: lim - arr, navUrl: em.navUrl };
      }

      const leaveBy = planned.slack >= 0 ? (planned.legs[0] && planned.legs[0].here ? planned.legs[0].dep : now) + planned.slack : null;
      return {
        now,
        clockCtx,
        dl: planned.dl || dl,
        rawDl: dl,
        start,
        want,
        planned,
        best,
        tight,
        fallback,
        chain: [],
        leaveBy,
        bestIsPlanned: sameRoute(best, planned)
      };
    }

    function describeRoute(r) {
      const nm = x => escapeHtml(x.shortName || x.name);
      const parts = r.legs.map(l =>
        l.here
          ? `${nm(l.node)}${r.hereMode === 'now' ? '（马上离开）' : `（待到 ${fmtTime(l.dep)}）`}`
          : `${nm(l.node)}${l.stay < (l.node.stayMin || 0) ? `（压缩至 ${l.stay} 分）` : ''}`
      );
      const placeIsStop = r.place.id && !STOP_ROLES_EXCLUDED.includes(r.place.role);
      if (!r.stops.length && !r.legs.some(l => l.here) && !placeIsStop && stopsBefore(r.dl, stopNodes()).length) {
        parts.push('砍掉中途项目直奔终点');
      }
      if (r.emergency && r.emSpec) {
        parts.push(`🚕 ${escapeHtml(r.emSpec.shortBadge || '直达')} → <b>${fmtTime(r.destArr)}</b> 抵${nm(r.place)}`);
        return parts.join(' → ');
      }
      parts.push(`${nm(r.place)} <b>${fmtTime(r.destArr)}</b>`);
      return parts.join(' → ') + (r.train ? ` → <b>${escapeHtml(r.train.finalBadge || r.train.name)}</b>` : '');
    }

    function fireLeaveAlerts(L) {
      if (L.clockCtx.mode !== 'live' || L.leaveBy == null) return;
      const m = L.leaveBy - L.now;
      const key = `${L.dl.id}@${L.dl.time}`;
      const prev = leaveAlertPrev[key];
      leaveAlertPrev[key] = m;
      if (prev == null) return;
      const th = LEAVE_ALERTS.find(x => prev > x && m <= x);
      if (th == null) return;
      const place = L.planned.place.shortName || L.planned.place.name;
      const msg = th === 0 ? `现在就出发去「${place}」！` : `${th} 分钟后必须出发去「${place}」（${L.dl.label || fmtTime(L.dl.time)}）`;
      playChime(th === 0 ? 'err' : 'warn');
      showPageToast(`⏰ ${msg}`);
      if (globalPrefs.autoBark) dispatchStrongNotifications('⏰ 死线出发提醒', msg, L.planned.place.navUrl || location.href, 'warn');
    }

    function applyLiveRoute(r) {
      const keep = new Set(r.stops.map(s => s.id));
      const hereId = r.legs[0] && r.legs[0].here ? r.legs[0].node.id : null;
      stopsBefore(r.dl, stopNodes()).forEach(n => {
        const shouldKeep = keep.has(n.id) || n.id === hereId;
        if (liveStatus(n) === 'want' && !shouldKeep) {
          state.live.status[n.id] = 'skip';
          state.enabledNodes[n.id] = false;
        }
        if (shouldKeep && r.stayMode === 'min' && n.minStayMin) {
          state.stayOverrides[n.id] = n.minStayMin;
        }
      });
      state.live.stayMode = r.stayMode;
      state.live.hereMode = r.hereMode || 'full';
      state.live.appliedAt = getClockContext().now;
      saveState();
      if (typeof config.onApplyPlan === 'function') {
        try {
          config.onApplyPlan({
            enabledNodes: state.enabledNodes,
            stayOverrides: state.stayOverrides,
            paceFactor: state.paceFactor,
            emergencyMode: state.emergencyMode,
            sim: simulateSchedule({})
          });
        } catch (_) {}
      }
      playChime('ok');
      showPageToast(`✅ 已套用取舍方案：预计 ${fmtTime(r.destArr)} 到「${r.place.shortName || r.place.name}」（余裕 ${r.slack} 分）`);
      render();
    }

    function parsePlaceInput(raw) {
      const txt = (raw || '').trim();
      if (!txt) return { error: '请输入车站 / PA・SA / 地名，或粘贴地图链接' };
      let s = txt;
      try {
        s = decodeURIComponent(txt);
      } catch (_) {}
      const pats = [
        /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
        /[?&](?:q|query|destination|daddr|ll)=(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/,
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,
        /^\s*(-?\d{1,2}\.\d+)\s*[,，\s]\s*(-?\d{1,3}\.\d+)\s*$/
      ];
      for (const re of pats) {
        const m = s.match(re);
        if (m) {
          const lat = +m[1];
          const lng = +m[2];
          if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
            const nm = s.match(/\/place\/([^/@?]+)/);
            return { lat, lng, name: nm ? nm[1].replace(/\+/g, ' ').slice(0, 40) : '' };
          }
        }
      }
      if (/goo\.gl|maps\.app/.test(s)) {
        return { error: '短链无法直接读坐标，请直接输入车站名 / PA・SA 名称（如：滝不動、海ほたるPA）' };
      }
      return { notCoord: true };
    }

    function modeEstimates(km) {
      const out = [];
      if (km <= 3) out.push({ key: 'walk', icon: '🚶', name: '步行', min: Math.max(1, Math.round(((km * 1.25) / 4.8) * 60)), tm: 'walking' });
      if (config.mode === 'transit') {
        if (km >= 1)
          out.push({ key: 'transit', icon: '🚆', name: '电车', min: Math.round(10 + ((km * 1.3) / 25) * 60), tm: 'transit', note: '含进站候车约10分' });
      } else {
        out.push({
          key: 'car',
          icon: '🚗',
          name: '自驾',
          min: Math.round((3 + ((km * 1.3) / (km > 20 ? 70 : 35)) * 60) * (state.paceFactor || 1)),
          tm: 'driving'
        });
      }
      if (km >= 0.8)
        out.push({ key: 'taxi', icon: '🚕', name: '打车', min: Math.round(5 + ((km * 1.3) / (km > 15 ? 45 : 20)) * 60), tm: 'driving', note: '含叫车约5分' });
      return out;
    }

    function buildDeadlineAiPrompt(L, km, modes) {
      const place = L.planned.place;
      const pName = place.shortName || place.name;
      const fromStr = isGpsFresh() && state.gpsInfo
        ? `实时 GPS (${state.gpsInfo.lat}, ${state.gpsInfo.lng})，邻近 ${state.gpsInfo.nearestName}`
        : L.start.label || '当前打卡起点';
      const modeSummary = (modes || []).map(m => `${m.name}约${m.min}分（${fmtTime(L.now + m.min)}到）`).join(' / ');
      const destCoord = place.lat != null ? `（坐标 ${place.lat}, ${place.lng}）` : '';

      return [
        `你现在是我的【日本终电核查＆行中晚点救急专家】。我目前处于晚点（Behind）状态，请立即给出最稳妥的执行方案：`,
        ``,
        `1. 【当前实况】`,
        `- 当前时刻：${fmtTime(L.now)}（JST）`,
        `- 当前位置：${fromStr}`,
        `- 目标终点：「${pName}」${destCoord}${km != null ? `（直线约 ${km.toFixed(1)} km）` : ''}`,
        `- 原定死线：${fmtTime(L.dl.time)}（当前预计晚 ${Math.max(1, -L.planned.slack)} 分钟）`,
        modeSummary ? `- 直达耗时参考：${modeSummary}` : '',
        ``,
        `2. 【请给出 3 套立即可用的方案】`,
        `① 现在出发还能赶上的最快电车/高速路线（若过直达终电，请给出最远电车站＋最短打车接驳）；`,
        `② 直接打车前往「${pName}」的预估车程与车费（含深夜割増与高速费）；`,
        `③ 每段附可直接点击的 Google Maps 链接与一句发微信报平安的话术。`
      ]
        .filter(Boolean)
        .join('\n');
    }

    function recalculateFromNow(opts) {
      const options = opts || {};
      if (options.useGps && 'geolocation' in navigator) {
        checkinViaGps();
        return;
      }
      unlockAudio();
      const realNow = nowLocalMin();
      state.simClockMin = null;
      state.forcePreviewClock = false;
      state.forceRealClock = true;
      state.activePlanId = 'current';
      state.emergencyMode = false;
      if (state.checkinSpot) {
        state.checkinSpot.timeMin = realNow;
        state.checkinSpot.updatedAt = Date.now();
      }
      state.anchor.timeMin = realNow;
      state.anchor.extraDelayMin = 0;
      if (state.live.deadlines && state.live.deadlines[0]) {
        state.live.deadlines[0].updatedAt = Date.now();
      }
      saveState();
      render();
      playChime('ok');
      const s3 = document.getElementById('cp-step-3');
      if (s3) setTimeout(() => s3.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
      showPageToast(`🔄 已按现在时间 ${fmtTime(realNow)} 重新计算裕度与拯救方案！`);
    }

    function buildRescueStackHtml(L) {
      const { now, start, planned, best, tight, fallback, dl } = L;
      const slack = planned.slack;
      const place = planned.place;
      const nm = x => escapeHtml(x.shortName || x.name);
      const placeName = nm(place);

      if (slack >= 0) return '';

      const from = start.pos || start.aNode;
      const km = from.lat != null && place.lat != null ? haversineKm(from.lat, from.lng, place.lat, place.lng) : null;
      const modes = km != null ? modeEstimates(km) : [];
      const okModes = modes.filter(m => now + m.min <= dl.time);
      const fastestMode = modes.length ? modes.slice().sort((a, b) => a.min - b.min)[0] : null;
      const taxiMode = modes.find(m => m.key === 'taxi') || null;
      const hasStops = Boolean(planned.stops.length || planned.legs.some(l => l.here));
      const cards = [];

      if ((best && best.slack >= 0 && !L.bestIsPlanned) || okModes.length) {
        if (best && best.slack >= 0 && !L.bestIsPlanned) {
          const cutNames = planned.stops.filter(s => !best.stops.some(bs => bs.id === s.id)).map(nm);
          const nextNav = (best.legs.find(l => !l.here) && best.legs.find(l => !l.here).node) || best.place;
          cards.push(`<div class="cp-rescue-card rec">
            <div class="cp-rescue-title"><span>🛡️ 拯救方案 A（推荐・自动取舍后续项目保死线）</span><span style="color:var(--cp-ok)">救回・余裕 ${best.slack} 分</span></div>
            <div class="cp-rescue-desc">${
              cutNames.length ? `✂️ 砍掉「${cutNames.join('、')}」 → ` : '⏱️ 压缩停留时长 → '
            }${describeRoute(best)}</div>
            <div class="cp-rescue-btns">
              <button type="button" class="cp-rbtn ok" data-live-apply="best">⚡ 一键套用此取舍</button>
              ${nextNav && nextNav.navUrl ? `<a class="cp-rbtn pri" href="${nextNav.navUrl}" target="_blank" rel="noopener">🧭 立即导航</a>` : ''}
            </div>
          </div>`);
        } else {
          const m = okModes[0];
          const mArr = now + m.min;
          const mUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=${m.tm}`;
          cards.push(`<div class="cp-rescue-card rec">
            <div class="cp-rescue-title"><span>🛡️ 拯救方案 A（推荐・${m.key === 'taxi' ? '改乘打车' : '砍中途项'}直奔终点）</span><span style="color:var(--cp-ok)">救回・余裕 ${
            dl.time - mArr
          } 分</span></div>
            <div class="cp-rescue-desc">${
              hasStops ? '砍掉后续中途项目，' : ''
            }立即改乘 <b>${m.icon} ${m.name}</b> 直奔「${placeName}」，预计 <b>${fmtTime(mArr)}</b> 按时赶到</div>
            <div class="cp-rescue-btns">
              <button type="button" class="cp-rbtn ok" data-rescue-act="skip-direct" data-mode-key="${m.key}">⚡ 套用：${
            m.key === 'taxi' ? '切换打车直达' : '砍掉中途项'
          }</button>
              <a class="cp-rbtn pri" href="${mUrl}" target="_blank" rel="noopener">🧭 开启${m.name}导航</a>
            </div>
          </div>`);
        }

        if (tight && !sameRoute(tight, planned)) {
          cards.push(`<div class="cp-rescue-card warn">
            <div class="cp-rescue-title"><span>⚡ 拯救方案 B（压哨保留项目・压缩时长）</span><span style="color:var(--cp-warn)">余裕 ${tight.slack} 分</span></div>
            <div class="cp-rescue-desc">${describeRoute(tight)}（换乘/结账零容错）</div>
            <div class="cp-rescue-btns">
              <button type="button" class="cp-rbtn pri" data-live-apply="tight">▶ 套用压哨版</button>
            </div>
          </div>`);
        } else {
          const relaxTime = Math.ceil((Math.max(dl.time + 30, planned.destArr + 5)) / 5) * 5;
          cards.push(`<div class="cp-rescue-card warn">
            <div class="cp-rescue-title"><span>⏰ 拯救方案 B（不砍项目・顺延目标死线）</span><span>新死线 ${fmtTime(relaxTime)}</span></div>
            <div class="cp-rescue-desc">保留全部后续安排，将到达「${placeName}」死线顺延至 <b>${fmtTime(relaxTime)}</b></div>
            <div class="cp-rescue-btns">
              <button type="button" class="cp-rbtn pri" data-set-dl-time="${relaxTime}">⏰ 顺延至 ${fmtTime(relaxTime)} 重算</button>
              <button type="button" class="cp-rbtn" data-rescue-act="copy-eta-wx">📋 复制新ETA发微信</button>
            </div>
          </div>`);
        }

        if (fallback) {
          cards.push(`<div class="cp-rescue-card taxi">
            <div class="cp-rescue-title"><span>🚕 拯救方案 C（打车/高速兜底・保留项目抢时间）</span><span>预计 ${fmtTime(fallback.arr)} 到</span></div>
            <div class="cp-rescue-desc">${escapeHtml(fallback.name)}（${fallback.slack >= 0 ? `余裕 ${fallback.slack} 分` : `晚 ${-fallback.slack} 分`}）</div>
            <div class="cp-rescue-btns">
              <button type="button" class="cp-rbtn warm" data-rescue-act="enable-emergency">🚕 启用打车直达</button>
              ${fallback.navUrl ? `<a class="cp-rbtn" href="${fallback.navUrl}" target="_blank" rel="noopener">🗺️ 查看路线</a>` : ''}
            </div>
          </div>`);
        } else if (taxiMode && place.lat != null) {
          const txUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=driving`;
          cards.push(`<div class="cp-rescue-card taxi">
            <div class="cp-rescue-title"><span>🚕 拯救方案 C（打车直达 ＋ AI 终电核查）</span><span>约 ${taxiMode.min} 分・${fmtTime(
            now + taxiMode.min
          )} 到</span></div>
            <div class="cp-rescue-desc">省去换乘候车直奔「${placeName}」，或一键问 AI 查最快乘换</div>
            <div class="cp-rescue-btns">
              <a class="cp-rbtn warm" href="${txUrl}" target="_blank" rel="noopener">🚕 打车导航</a>
              <button type="button" class="cp-rbtn" data-rescue-act="ai-gpt">🤖 问 ChatGPT 终电/车费</button>
            </div>
          </div>`);
        }
      } else {
        // Severely Behind: even fastest direct mode arrives after dl.time
        const primaryMode =
          modes.find(m => (config.mode === 'transit' && state.live.travelOverride !== 'taxi' ? m.key === 'transit' : m.key === 'car')) ||
          modes[0] ||
          null;
        const fastestArr = fastestMode ? now + fastestMode.min : best ? best.destArr : planned.destArr;
        const primaryDirectArr = primaryMode ? now + primaryMode.min : best ? best.destArr : planned.destArr;
        const realisticFastDl = Math.ceil((fastestArr + 5) / 5) * 5;
        const realisticPrimaryDl = Math.ceil((primaryDirectArr + 5) / 5) * 5;
        const realisticFullDl = Math.ceil((planned.destArr + 10) / 5) * 5;
        const fastUrl =
          fastestMode && place.lat != null
            ? `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=${fastestMode.tm}`
            : place.navUrl;

        const p1Desc = fastestMode
          ? primaryMode && fastestMode.key !== primaryMode.key
            ? `原死线 ${fmtTime(dl.time)} 已无法赶上；${hasStops ? '砍掉后续中途项并' : ''}改乘 <b>${fastestMode.icon} ${
                fastestMode.name
              }直达</b>（约 ${fastestMode.min} 分），最快 <b>${fmtTime(fastestArr)}</b> 抵达（比${primaryMode.name}快 ${
                primaryMode.min - fastestMode.min
              } 分）`
            : `原死线 ${fmtTime(dl.time)} 已无法赶上；${hasStops ? '砍掉全部中途项目' : '立即出发'}乘 <b>${fastestMode.icon} ${
                fastestMode.name
              }</b> 最快 <b>${fmtTime(fastestArr)}</b> 抵达`
          : `砍掉全部中途停留直奔「${placeName}」，最快预计 <b>${fmtTime(fastestArr)}</b> 抵达`;

        cards.push(`<div class="cp-rescue-card rec">
          <div class="cp-rescue-title"><span>✂️ 拯救方案 A（立即止损・砍中途项最快直达）</span><span style="color:var(--cp-err)">最快 ${fmtTime(fastestArr)} 到</span></div>
          <div class="cp-rescue-desc">${p1Desc}</div>
          <div class="cp-rescue-btns">
            <button type="button" class="cp-rbtn ok" data-rescue-act="adopt-fastest" data-mode-key="${
          fastestMode ? fastestMode.key : ''
        }" data-new-time="${realisticFastDl}">⚡ 启动${fastestMode ? fastestMode.name : ''}直达＋改死线至 ${fmtTime(
          realisticFastDl
        )}</button>
            ${fastUrl ? `<a class="cp-rbtn pri" href="${fastUrl}" target="_blank" rel="noopener">🧭 开启${fastestMode ? fastestMode.name : '最快'}导航</a>` : ''}
          </div>
        </div>`);

        const p2ModeTag = primaryMode ? `${primaryMode.icon}${primaryMode.name}可到` : '直达可到';
        cards.push(`<div class="cp-rescue-card warn">
          <div class="cp-rescue-title"><span>⏰ 拯救方案 B（顺延死线至可行时刻・重新排期）</span><span>新死线 ${fmtTime(realisticPrimaryDl)}</span></div>
          <div class="cp-rescue-desc">按${primaryMode ? primaryMode.name : '当前方式'}顺延目标时刻至 <b>${fmtTime(
          realisticPrimaryDl
        )}</b>，重新开启准点提醒并一键发微信通知：</div>
          <div class="cp-rescue-btns">
            <button type="button" class="cp-rbtn pri" data-set-dl-time="${realisticPrimaryDl}" data-skip-stops="1">⏰ 顺延至 ${fmtTime(
          realisticPrimaryDl
        )}（${p2ModeTag}）</button>
            ${
              hasStops && realisticFullDl > realisticPrimaryDl
                ? `<button type="button" class="cp-rbtn" data-set-dl-time="${realisticFullDl}">⏰ 顺延至 ${fmtTime(
                    realisticFullDl
                  )}（保留中途项）</button>`
                : ''
            }
            <button type="button" class="cp-rbtn" data-rescue-act="copy-eta-wx" data-eta="${primaryDirectArr}">📋 复制最新ETA发微信</button>
          </div>
        </div>`);

        cards.push(`<div class="cp-rescue-card taxi">
          <div class="cp-rescue-title"><span>🤖 拯救方案 C（AI 终电核查・半程打车・附近备选）</span><span>自动打包现地坐标</span></div>
          <div class="cp-rescue-desc">已打包当前位置与目标「${placeName}」${
          km != null ? `（${km.toFixed(1)}km）` : ''
        }，一键查终电衔接、打车费用或就近住宿：</div>
          <div class="cp-rescue-btns">
            <button type="button" class="cp-rbtn warm" data-rescue-act="ai-gpt">🚀 复制实况问 ChatGPT</button>
            <button type="button" class="cp-rbtn" data-rescue-act="ai-claude">🤖 打开 Claude</button>
            <button type="button" class="cp-rbtn" data-rescue-act="ai-copy">📋 仅复制指令</button>
          </div>
        </div>`);
      }

      return `<div class="cp-rescue-stack" id="cp-rescue-anchor">${cards.join('')}</div>`;
    }

    function bindRescueActions(root, L) {
      if (!root || !L) return;
      root.querySelectorAll('[data-recalc-now]').forEach(btn => {
        btn.addEventListener('click', () => recalculateFromNow({ useGps: btn.dataset.recalcNow === 'gps' }));
      });
      root.querySelectorAll('[data-clear-taxi]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.live.travelOverride = null;
          saveState();
          render();
          showPageToast('🚆 已切回默认电车/自驾方式推演');
        });
      });
      root.querySelectorAll('[data-stop-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
          setStopItemMode(btn.dataset.stopId, btn.dataset.stopMode);
        });
      });
      root.querySelectorAll('[data-live-apply]').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = btn.dataset.liveApply === 'tight' ? L.tight : L.best;
          if (r) applyLiveRoute(r);
        });
      });
      root.querySelectorAll('[data-set-dl-time]').forEach(btn => {
        btn.addEventListener('click', () => {
          const newMin = Number(btn.dataset.setDlTime);
          if (!Number.isFinite(newMin)) return;
          if (btn.dataset.skipStops === '1') {
            stopNodes().forEach(n => {
              if (liveStatus(n) === 'want') {
                state.live.status[n.id] = 'skip';
                state.enabledNodes[n.id] = false;
              }
            });
            state.live.hereMode = 'now';
          }
          const cur = Object.assign({}, getDeadlines()[0]);
          const def = defaultDeadlines()[0];
          cur.time = ((newMin % 1440) + 1440) % 1440;
          if (cur.presetLabel || cur.label === def.label) {
            cur.label = '';
            cur.presetLabel = false;
          }
          cur.fromConfig = false;
          cur.updatedAt = Date.now();
          state.simClockMin = null;
          state.forcePreviewClock = false;
          state.forceRealClock = true;
          saveDeadlines([cur]);
          playChime('ok');
          render();
          const p = deadlinePlace(cur);
          showPageToast(`⏰ 已顺延死线至 ${fmtTime(cur.time)} 前到「${p.shortName || p.name}」并重算！`);
        });
      });
      root.querySelectorAll('[data-rescue-act]').forEach(btn => {
        btn.addEventListener('click', () => {
          const act = btn.dataset.rescueAct;
          const place = L.planned.place;
          const pName = place.shortName || place.name;
          const from = L.start.pos || L.start.aNode;
          const km = from.lat != null && place.lat != null ? haversineKm(from.lat, from.lng, place.lat, place.lng) : null;
          const modes = km != null ? modeEstimates(km) : [];

          if (act === 'skip-direct' || act === 'adopt-fastest') {
            stopNodes().forEach(n => {
              if (liveStatus(n) === 'want') {
                state.live.status[n.id] = 'skip';
                state.enabledNodes[n.id] = false;
              }
            });
            state.live.hereMode = 'now';
            state.live.appliedAt = L.now;
            if (btn.dataset.modeKey === 'taxi') state.live.travelOverride = 'taxi';
            if (act === 'adopt-fastest' && btn.dataset.newTime) {
              const cur = Object.assign({}, getDeadlines()[0]);
              const def = defaultDeadlines()[0];
              cur.time = ((Number(btn.dataset.newTime) % 1440) + 1440) % 1440;
              if (cur.presetLabel || cur.label === def.label) {
                cur.label = '';
                cur.presetLabel = false;
              }
              cur.fromConfig = false;
              cur.updatedAt = Date.now();
              state.simClockMin = null;
              state.forcePreviewClock = false;
              state.forceRealClock = true;
              saveDeadlines([cur]);
              playChime('ok');
              render();
              showPageToast(`⚡ 已切换为${btn.dataset.modeKey === 'taxi' ? '打车' : ''}直奔「${pName}」，新死线设为 ${fmtTime(cur.time)}！`);
              return;
            }
            saveState();
            playChime('ok');
            render();
            showPageToast(`⚡ 已砍掉中途项，改为立即直奔「${pName}」！`);
          } else if (act === 'enable-emergency') {
            state.emergencyMode = true;
            state.activePlanId = 'emergency_direct';
            saveState();
            playChime('ok');
            render();
            showPageToast('🚕 已启用打车/高速直达兜底方案！');
          } else if (act === 'copy-eta-wx') {
            const fastest = modes.length ? modes.slice().sort((a, b) => a.min - b.min)[0] : null;
            const etaMin = btn.dataset.eta ? Number(btn.dataset.eta) : fastest ? L.now + fastest.min : L.planned.destArr;
            const wxTxt = [
              `📢【行程到达时间更新】`,
              `• 当前时刻：${fmtTime(L.now)}`,
              `• 目的地：${pName}`,
              `• 最新预计到达：${fmtTime(etaMin)}${fastest ? `（${fastest.name}直达）` : ''}`,
              place.navUrl ? `• 路线导航：${place.navUrl}` : ''
            ]
              .filter(Boolean)
              .join('\n');
            if (navigator.clipboard) navigator.clipboard.writeText(wxTxt).catch(() => {});
            showPageToast(`📋 已复制「预计 ${fmtTime(etaMin)} 到 ${pName}」微信通知！`);
          } else if (act === 'ai-gpt' || act === 'ai-claude' || act === 'ai-copy') {
            const promptTxt = buildDeadlineAiPrompt(L, km, modes);
            if (navigator.clipboard) navigator.clipboard.writeText(promptTxt).catch(() => {});
            showPageToast(`📋 已复制「${pName}」实时终电/改道急救指令！`);
            if (act === 'ai-gpt') global.open('https://chatgpt.com/', '_blank', 'noopener');
            if (act === 'ai-claude') global.open('https://claude.ai/new', '_blank', 'noopener');
          }
        });
      });
    }

    function getQuickStationChips(curDl) {
      const chips = [];
      const seenStems = new Set();

      // Show destination/after/origin trip nodes + popular nearby hubs (keep chip bar crisp, not crowded!)
      config.nodes
        .filter(n => n.lat != null && ['destination', 'after', 'origin'].includes(n.role))
        .forEach(n => {
          const label = n.shortName || n.name;
          const stem = normalizeStationStem(label);
          seenStems.add(stem);
          chips.push({
            key: `node:${n.id}`,
            nodeId: n.id,
            name: label,
            lat: n.lat,
            lng: n.lng,
            active: Boolean(curDl.nodeId === n.id)
          });
        });

      const extraHubs = config.mode === 'transit'
        ? ['滝不動駅', '松戸駅', '船橋駅', '日暮里駅', '新宿駅']
        : ['海ほたるPA', '海老名SA', '成田空港駅（第1ターミナル）', '滝不動駅'];
      extraHubs.forEach(stName => {
        const stem = normalizeStationStem(stName);
        if (seenStems.has(stem)) return;
        const found = JP_STATIONS.find(x => x[0] === stName) || JP_SAPAS.find(x => x[0] === stName);
        if (!found) return;
        seenStems.add(stem);
        const isActive = !curDl.nodeId && curDl.placeName && normalizeStationStem(curDl.placeName) === stem;
        chips.push({
          key: `st:${stName}`,
          nodeId: null,
          name: stName,
          lat: found[1],
          lng: found[2],
          active: Boolean(isActive)
        });
      });

      if (!curDl.nodeId && curDl.placeName) {
        const customStem = normalizeStationStem(curDl.placeName);
        if (!seenStems.has(customStem)) {
          chips.unshift({
            key: 'custom:current',
            nodeId: null,
            name: curDl.placeName,
            lat: curDl.lat,
            lng: curDl.lng,
            active: true
          });
        }
      }
      return chips;
    }

    function commitDeadlineEntry(nextEntry, opts) {
      const options = opts || {};
      const def = defaultDeadlines()[0];
      const entry = Object.assign({ id: 'user', updatedAt: Date.now() }, nextEntry);

      if (entry.nodeId && entry.nodeId === def.nodeId && entry.time === def.time) {
        entry.fromConfig = true;
      } else {
        entry.fromConfig = false;
        if (entry.presetLabel || entry.label === def.label) {
          entry.label = '';
          entry.presetLabel = false;
        }
      }

      if (state.simClockMin == null) {
        state.forcePreviewClock = false;
        state.forceRealClock = true;
      }

      saveDeadlines([entry]);
      if (options.reRenderForm !== false) {
        render();
      } else {
        refreshStep3AndDock();
      }
      if (options.toast) {
        const p = deadlinePlace(entry);
        showPageToast(`🎯 目标已更新：${fmtTime(entry.time)} 前到「${p.shortName || p.name}」`);
      }
    }

    function switchTab(tab) {
      const target = document.getElementById(tab === 'deadline' ? 'cp-step-1' : 'cp-step-2') || mount;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function bindStationResolver(inputEl, btnEl, sugBox, errBox, curValue, onSelect) {
      let localCache = [];
      const renderList = (list, prefix) => {
        localCache = list;
        if (!list.length) {
          sugBox.innerHTML = '';
          return;
        }
        sugBox.innerHTML = list
          .map(
            (it, idx) =>
              `<button type="button" class="cp-st-sug" data-sug-idx="${idx}">
                <b>${it.icon || '🚉'} ${prefix || ''}${escapeHtml(it.name)}</b>
                <span>${escapeHtml(it.hint || '点此选定')} ›</span>
              </button>`
          )
          .join('');
        sugBox.querySelectorAll('[data-sug-idx]').forEach(b => {
          b.addEventListener('click', () => {
            const picked = localCache[Number(b.dataset.sugIdx)];
            if (picked) onSelect(picked);
          });
        });
      };

      inputEl.addEventListener('focus', () => {
        if (curValue && inputEl.value === curValue) {
          try {
            inputEl.select();
          } catch (_) {}
        }
      });

      inputEl.addEventListener('input', () => {
        if (errBox) errBox.textContent = '';
        const raw = inputEl.value.trim();
        if (!raw || (curValue && raw === curValue)) {
          sugBox.innerHTML = '';
          return;
        }
        renderList(searchLocalStations(raw), '');
      });

      const resolveNow = async () => {
        if (errBox) errBox.textContent = '';
        const raw = inputEl.value.trim();
        if (!raw) {
          if (errBox) errBox.textContent = '请输入车站 / 高速 PA・SA / 地名（如：滝不動、日暮里、海ほたるPA）';
          return;
        }
        const parsedCoord = parsePlaceInput(raw);
        if (parsedCoord.lat != null) {
          onSelect({ nodeId: null, name: parsedCoord.name || '地图选定位置', lat: parsedCoord.lat, lng: parsedCoord.lng });
          return;
        }
        if (parsedCoord.error) {
          if (errBox) errBox.textContent = parsedCoord.error;
          return;
        }

        const localMatches = searchLocalStations(raw);
        if (localMatches.length && localMatches[0].exact) {
          onSelect(localMatches[0]);
          return;
        }

        const origTxt = btnEl ? btnEl.textContent : '';
        if (btnEl) {
          btnEl.disabled = true;
          btnEl.textContent = '⏳ 检索中…';
        }
        const onlineMatches = await geocodeStationOnline(raw);
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.textContent = origTxt;
        }

        if (onlineMatches.length) {
          onSelect(onlineMatches[0]);
          return;
        }
        if (localMatches.length) {
          onSelect(localMatches[0]);
          return;
        }
        const fallbackName = /(?:[駅站]|PA|SA|IC)$/i.test(raw) ? raw : `${raw}駅`;
        onSelect({ nodeId: null, name: fallbackName.slice(0, 40), lat: null, lng: null });
      };

      if (btnEl) btnEl.addEventListener('click', resolveNow);
      inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          resolveNow();
        }
      });
    }

    // STEP 1: Clean Target Time & Station/Place Form
    function renderDeadlineForm() {
      const box = document.getElementById('cp-dlt-form');
      if (!box) return;
      const cur = getDeadlines()[0];
      const curPlace = deadlinePlace(cur);
      const curPlaceName = curPlace.shortName || curPlace.name;
      const userCustomLabel = cur.presetLabel ? '' : cur.label || '';
      const chips = getQuickStationChips(cur);
      const realNow = nowLocalMin();
      const plus30 = ((realNow + 30) % 1440 + 1440) % 1440;
      const plus60 = ((realNow + 60) % 1440 + 1440) % 1440;
      const defaultHard = (config.deadlineSpec && config.deadlineSpec.hardArrMin) || 1320;

      box.innerHTML = `
        <div class="cp-dlt-form">
          <div class="cp-dlt-row">
            <label>⏰ 必到时刻
              <input type="time" id="dlt-time" value="${fmtTime(cur.time)}">
            </label>
            <div class="grow">
              <div class="cp-sub-label"><span>快捷改时刻</span></div>
              <div class="cp-st-chips">
                <button type="button" class="cp-st-chip time" data-quick-time="${plus30}">现在+30分 (${fmtTime(plus30)})</button>
                <button type="button" class="cp-st-chip time" data-quick-time="${plus60}">现在+60分 (${fmtTime(plus60)})</button>
                <button type="button" class="cp-st-chip time" data-quick-time="${defaultHard}">默认 ${fmtTime(defaultHard)}</button>
              </div>
            </div>
          </div>

          <div>
            <label for="dlt-query">🚉 目标车站 / PA・SA / 地名</label>
            <div class="cp-st-search-row" style="margin-top:4px">
              <input type="text" id="dlt-query" value="${escapeAttr(
                curPlaceName
              )}" placeholder="输入日本车站 / PA・SA / 地名（如：滝不動、船橋、海ほたるPA）" autocomplete="off">
              <button type="button" class="cp-st-btn" id="dlt-search-btn">🔍 设定目标</button>
            </div>
            <div class="cp-st-suggests" id="dlt-suggests"></div>
          </div>

          <div>
            <div class="cp-sub-label">
              <span>⚡ 常用目标一键切换：</span>
              ${state.live.deadlines ? '<button type="button" class="cp-now-mini" id="dlt-reset">恢复默认目标</button>' : ''}
            </div>
            <div class="cp-st-chips" id="dlt-station-chips">
              ${chips
                .map(
                  (c, idx) =>
                    `<button type="button" class="cp-st-chip ${c.active ? 'on' : ''}" data-chip-idx="${idx}">${
                      c.active ? '🎯 ' : ''
                    }${escapeHtml(c.name)}</button>`
                )
                .join('')}
            </div>
          </div>

          <details style="font-size:12px" ${userCustomLabel ? 'open' : ''}>
            <summary style="cursor:pointer;color:var(--cp-soft);font-weight:700">📝 添加目标备注（可选）</summary>
            <div style="margin-top:6px">
              <input type="text" id="dlt-label" value="${escapeAttr(userCustomLabel)}" placeholder="如：赶末班车 / 和朋友碰头 / 酒店入住" style="width:100%;padding:7px 10px;border:1px solid var(--cp-line);border-radius:8px;background:var(--cp-card2);color:var(--cp-ink);font:inherit;font-size:13px">
            </div>
          </details>
          <div class="cp-dlt-err" id="dlt-err"></div>
        </div>`;

      const $ = id => box.querySelector('#' + id);
      const timeInput = $('dlt-time');
      const labelInput = $('dlt-label');
      const readTimeMin = () => {
        const parsed = parseTime(timeInput.value);
        return parsed != null ? parsed : getDeadlines()[0].time;
      };

      const applyTarget = cand => {
        const nextTime = readTimeMin();
        const customNote = labelInput ? labelInput.value.trim().slice(0, 40) : '';
        if (cand.nodeId) {
          commitDeadlineEntry({ nodeId: cand.nodeId, time: nextTime, label: customNote, presetLabel: false }, { reRenderForm: true, toast: true });
        } else {
          commitDeadlineEntry(
            { nodeId: null, placeName: cand.name, lat: cand.lat, lng: cand.lng, time: nextTime, label: customNote, presetLabel: false },
            { reRenderForm: true, toast: true }
          );
        }
      };

      bindStationResolver($('dlt-query'), $('dlt-search-btn'), $('dlt-suggests'), $('dlt-err'), curPlaceName, applyTarget);

      timeInput.addEventListener('input', () => {
        const nextTime = parseTime(timeInput.value);
        if (nextTime == null) return;
        const latest = Object.assign({}, getDeadlines()[0], {
          time: nextTime,
          label: labelInput ? labelInput.value.trim().slice(0, 40) : '',
          presetLabel: false
        });
        commitDeadlineEntry(latest, { reRenderForm: false, toast: false });
      });

      box.querySelectorAll('[data-quick-time]').forEach(btn => {
        btn.addEventListener('click', () => {
          const latest = Object.assign({}, getDeadlines()[0], {
            time: Number(btn.dataset.quickTime),
            label: labelInput ? labelInput.value.trim().slice(0, 40) : '',
            presetLabel: false
          });
          commitDeadlineEntry(latest, { reRenderForm: true, toast: true });
        });
      });

      box.querySelectorAll('[data-chip-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const c = chips[Number(btn.dataset.chipIdx)];
          if (c) applyTarget(c);
        });
      });

      labelInput?.addEventListener('input', () => {
        const latest = Object.assign({}, getDeadlines()[0], {
          label: labelInput.value.trim().slice(0, 40),
          presetLabel: false
        });
        commitDeadlineEntry(latest, { reRenderForm: false, toast: false });
      });

      $('dlt-reset')?.addEventListener('click', () => {
        onlineSuggestCache = [];
        state.forceRealClock = false;
        state.forcePreviewClock = false;
        state.live.travelOverride = null;
        saveDeadlines(null);
        render();
        showPageToast('🔄 已恢复本行程默认目标死线');
      });
    }

    // STEP 2: Clean Location Check-in (Option 1: 1-Tap Current GPS | Option 2: Nearby Stations / SA・PA / Place Search)
    function renderCheckinStep2(L) {
      const box = document.getElementById('cp-step2-body');
      if (!box) return;

      const gm = gpsStatusModel();
      const mapUrl =
        state.gpsInfo && state.gpsInfo.lat != null
          ? `https://www.google.com/maps/search/?api=1&query=${state.gpsInfo.lat},${state.gpsInfo.lng}`
          : '';

      const refCoord =
        state.gpsInfo && state.gpsInfo.lat != null
          ? { lat: +state.gpsInfo.lat, lng: +state.gpsInfo.lng, fromGps: true }
          : state.checkinSpot && state.checkinSpot.lat != null
          ? { lat: +state.checkinSpot.lat, lng: +state.checkinSpot.lng, fromGps: false }
          : null;

      let nearbyItems = [];
      if (refCoord) {
        nearbyItems = getNearbyPlaces(refCoord.lat, refCoord.lng, 7);
      } else {
        // Curated route stations / SA・PA before first GPS fix so 1-tap check-in works immediately even indoors!
        const seen = new Set();
        config.nodes
          .filter(n => n.role !== 'after' && n.lat != null)
          .forEach(n => {
            const name = n.shortName || n.name;
            seen.add(normalizeStationStem(name));
            nearbyItems.push({ icon: '📍', nodeId: n.id, name, lat: n.lat, lng: n.lng, distTxt: '行程点' });
          });
        const fallbackHubs =
          config.mode === 'transit'
            ? ['池袋駅', '日暮里駅', '松戸駅', '新鎌ヶ谷駅', '船橋駅']
            : ['海老名SA', '海ほたるPA', '酒々井PA', '幕張PA', '大黒PA'];
        fallbackHubs.forEach(nm => {
          const stem = normalizeStationStem(nm);
          if (seen.has(stem)) return;
          const st = JP_STATIONS.find(x => x[0] === nm);
          const sa = JP_SAPAS.find(x => x[0] === nm);
          const hit = st || sa;
          if (!hit) return;
          seen.add(stem);
          nearbyItems.push({ icon: sa ? '🛣️' : '🚉', nodeId: null, name: hit[0], lat: hit[1], lng: hit[2], distTxt: sa ? '高速PA/SA' : '沿线站' });
        });
        nearbyItems = nearbyItems.slice(0, 8);
      }

      const activeSpotStem = state.checkinSpot ? normalizeStationStem(state.checkinSpot.name) : '';
      const clockModeTxt =
        L.clockCtx.mode === 'sim'
          ? `演练模拟 ${fmtTime(L.now)}`
          : L.clockCtx.mode === 'preview'
          ? `行前基准 ${fmtTime(L.now)}`
          : `实时 ${fmtTime(L.now)}`;

      box.innerHTML = `
        <div>
          <div class="cp-sub-label">
            <span>① 方案一：直接取用手机当前位置（推荐）</span>
          </div>
          <div class="cp-checkin-hero-row">
            <button type="button" class="cp-gps-hero-btn" id="cp-checkin-gps-btn" ${state.gpsCheckingIn ? 'disabled' : ''}>
              ${state.gpsCheckingIn ? '⏳ 正在获取当前 GPS 位置…' : '📡 取用当前位置立即打卡（算 Ahead / Behind）'}
            </button>
            <button type="button" class="cp-gps-watch-btn ${state.gpsActive ? 'on' : ''}" id="cp-gps-toggle-top">
              ${state.gpsActive ? '🟢 持续追踪中' : '🛰️ 自动追踪'}
            </button>
          </div>
          ${
            state.gpsActive || state.gpsInfo || state.gpsLastError
              ? `<div class="cp-gps-card ${gm.cls}" id="cp-gps-card" style="margin-top:8px;margin-bottom:0">
                  <div class="cp-gps-left">
                    <span class="cp-gps-dot" aria-hidden="true"></span>
                    <div class="cp-gps-main">
                      <b id="cp-gps-headline">${escapeHtml(gm.headline)}</b>
                      <span class="cp-gps-meta" id="cp-gps-meta">${escapeHtml(gm.meta)}</span>
                    </div>
                  </div>
                  <div class="cp-gps-actions">
                    ${
                      state.gpsActive
                        ? `<button type="button" class="cp-gps-btn-sm" id="cp-gps-ping" ${state.gpsPinging ? 'disabled' : ''}>${
                            state.gpsPinging ? '⏳' : '🔄 测位'
                          }</button>`
                        : ''
                    }
                    <a class="cp-gps-btn-sm" id="cp-gps-map" href="${mapUrl || '#'}" target="_blank" rel="noopener" style="display:${
                      mapUrl ? 'inline-flex' : 'none'
                    }">🗺️ 核对蓝点</a>
                  </div>
                </div>`
              : ''
          }

          <div class="cp-divider"></div>

          <div class="cp-sub-label">
            <span>② 方案二：点选${refCoord ? (refCoord.fromGps ? '当前 GPS 附近' : '当前打卡点附近') : '沿线常用'}车站 / PA・SA / 节点打卡</span>
            <span style="font-weight:500;font-size:11px">${refCoord ? '按距离排序' : '点上方 GPS 后自动刷新为身边站点'}</span>
          </div>
          <div class="cp-nearby-chips" id="cp-nearby-chips">
            ${nearbyItems
              .map((it, idx) => {
                const isAct =
                  (state.checkinSpot && it.nodeId && state.checkinSpot.nodeId === it.nodeId) ||
                  (activeSpotStem && normalizeStationStem(it.name) === activeSpotStem);
                return `<button type="button" class="cp-nearby-chip ${isAct ? 'active' : ''}" data-near-idx="${idx}">
                  <span>${it.icon} ${escapeHtml(it.name)}</span>
                  ${it.distTxt ? `<small>${escapeHtml(it.distTxt)}</small>` : ''}
                </button>`;
              })
              .join('')}
          </div>

          <div class="cp-st-search-row" style="margin-top:8px">
            <input type="text" id="cp-checkin-query" placeholder="或输入任意所在车站 / PA・SA / 地名打卡（如：松戸、海ほたるPA）" autocomplete="off">
            <button type="button" class="cp-st-btn" id="cp-checkin-search-btn">📍 在此打卡</button>
          </div>
          <div class="cp-st-suggests" id="cp-checkin-suggests"></div>
          <div class="cp-dlt-err" id="cp-checkin-err"></div>

          <div class="cp-anchor-summary">
            <span>📍 当前起算起点：<b>${escapeHtml(L.start.label || '行程起点')}</b> · <span>${clockModeTxt}</span></span>
            <details style="font-size:12px">
              <summary style="cursor:pointer;color:var(--cp-nav);font-weight:700">⌚ 指定模拟时刻</summary>
              <div style="display:flex;gap:6px;align-items:center;margin-top:6px;flex-wrap:wrap">
                <input type="time" id="cp-sim-time" value="${fmtTime(L.now)}" style="padding:5px 8px;border:1px solid var(--cp-line);border-radius:7px;background:var(--cp-card);color:var(--cp-ink);font:700 13px var(--cp-mono)">
                <button type="button" class="cp-now-mini" id="cp-apply-sim-time">以此刻重算</button>
                ${
                  L.clockCtx.mode !== 'live'
                    ? `<button type="button" class="cp-now-mini" id="cp-use-real-clock">切回真实时钟 (${fmtTime(L.clockCtx.realNow)})</button>`
                    : ''
                }
              </div>
            </details>
          </div>
        </div>`;

      box.querySelector('#cp-checkin-gps-btn')?.addEventListener('click', checkinViaGps);
      bindGpsBarEvents(box);

      box.querySelectorAll('[data-near-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const picked = nearbyItems[Number(btn.dataset.nearIdx)];
          if (!picked) return;
          checkinAtSpot(
            {
              nodeId: picked.nodeId || null,
              name: picked.name,
              lat: picked.lat,
              lng: picked.lng,
              source: 'nearby'
            },
            { scrollStep3: true }
          );
        });
      });

      bindStationResolver(
        box.querySelector('#cp-checkin-query'),
        box.querySelector('#cp-checkin-search-btn'),
        box.querySelector('#cp-checkin-suggests'),
        box.querySelector('#cp-checkin-err'),
        '',
        cand => {
          checkinAtSpot(
            {
              nodeId: cand.nodeId || null,
              name: cand.name,
              lat: cand.lat,
              lng: cand.lng,
              source: 'search'
            },
            { scrollStep3: true }
          );
        }
      );

      box.querySelector('#cp-apply-sim-time')?.addEventListener('click', () => {
        const t = parseTime(box.querySelector('#cp-sim-time').value);
        if (t == null) return;
        state.simClockMin = t;
        state.forceRealClock = false;
        state.forcePreviewClock = false;
        if (state.checkinSpot) state.checkinSpot.timeMin = t;
        state.anchor.timeMin = t;
        state.anchor.extraDelayMin = 0;
        saveState();
        render();
        showPageToast(`⌚ 已按模拟时刻 ${fmtTime(t)} 重新计算 Ahead / Behind`);
      });

      box.querySelector('#cp-use-real-clock')?.addEventListener('click', () => recalculateFromNow({}));
    }

    // STEP 3: Ahead / Behind Verdict + Behind Rescue Proposals + Subsequent Planned Items Pruning
    function renderStep3Result(L) {
      const stepCard = document.getElementById('cp-step-3');
      const box = document.getElementById('cp-dlt-result');
      if (!box) return;

      const nm = x => escapeHtml(x.shortName || x.name);
      const { now, clockCtx, start, planned, dl } = L;
      const place = planned.place;
      const slack = planned.slack;
      const lvl = slack < 0 ? 'err' : slack < 10 ? 'warn' : 'ok';
      if (stepCard) stepCard.className = `cp-step-card step-3 ${lvl}`;

      const from = start.here || start.pos || start.aNode;
      const km = from.lat != null && place.lat != null ? haversineKm(from.lat, from.lng, place.lat, place.lng) : null;
      const distBadge = km != null ? ` · 直线 ${km < 1 ? Math.round(km * 1000) + 'm' : km.toFixed(1) + 'km'}` : '';
      const modes = km != null ? modeEstimates(km) : [];
      const okModes = modes.filter(m => now + m.min <= dl.time);
      const hasStops = Boolean(planned.stops.length || planned.legs.some(l => l.here));
      const taxiTag = state.live.travelOverride === 'taxi' ? '（当前按 🚕 打车直达推演）' : '';

      let adviceHtml = '';
      if (slack >= 0) {
        adviceHtml = hasStops
          ? `✅ 按当前保留的后续项目（${planned.legs.map(l => nm(l.node)).join(' → ')}）<b>来得及</b>${taxiTag}！预计 <b>${fmtTime(
              planned.destArr
            )}</b> 抵「${nm(place)}」${planned.train ? ` → 稳赶 <b>${escapeHtml(planned.train.finalBadge || planned.train.name)}</b>` : ''}；最晚 <b>${fmtTime(
              L.leaveBy
            )}</b> ${start.here ? '离店/出发' : '动身'}。`
          : `✅ 直奔「${nm(place)}」<b>来得及</b>${taxiTag}！预计 <b>${fmtTime(planned.destArr)}</b> 到达，最晚 <b>${fmtTime(
              L.leaveBy
            )}</b> 出发（还有 ${L.leaveBy - now} 分钟机动时间）。`;
      } else if (L.best && L.best.slack >= 0 && !L.bestIsPlanned) {
        adviceHtml = `⚠️ 按原定全部项目预计 <b>${fmtTime(planned.destArr)}</b> 才到（晚 ${-slack} 分）→ <b>砍减或压缩下方后续项目即可救回死线！</b>请直接点下方「拯救方案 A」或手动切换项目取舍。`;
      } else if (okModes.length) {
        const m = okModes[0];
        adviceHtml = `⚠️ 当前方式预计晚 ${-slack} 分，但<b>立即砍掉中途项改乘 ${m.icon} ${m.name} 直奔「${nm(place)}」</b>可在 <b>${fmtTime(
          now + m.min
        )}</b> 赶到（余裕 ${dl.time - now - m.min} 分）！`;
      } else {
        const fastest = modes.length ? modes.slice().sort((a, b) => a.min - b.min)[0] : null;
        adviceHtml = fastest
          ? `🚨 即使现在立刻乘最快 ${fastest.icon} ${fastest.name} 直奔「${nm(place)}」最快也需 <b>${fmtTime(
              now + fastest.min
            )}</b> 到（晚于 ${fmtTime(dl.time)}）→ 请在下方点选<b>直达止损、顺延死线或问 AI 查终电</b>。`
          : `🚨 当前预计落后 <b>${-slack} 分钟</b> → 请在下方选择拯救方案或调整后续项目。`;
      }

      const nextNavTarget = (planned.legs.find(l => !l.here) && planned.legs.find(l => !l.here).node) || place;
      const clockLabel =
        clockCtx.mode === 'preview'
          ? `基准预览 ${fmtTime(now)}`
          : clockCtx.mode === 'sim'
          ? `模拟 ${fmtTime(now)}`
          : `现地 ${fmtTime(now)}`;

      const actionBtnHtml =
        clockCtx.mode === 'preview'
          ? `<button type="button" class="cp-recalc-btn" data-recalc-now="1">▶ 按现在 ${fmtTime(clockCtx.realNow)} 实测计算</button>`
          : `<button type="button" class="cp-recalc-btn" data-recalc-now="1">🔄 按现在 (${fmtTime(clockCtx.realNow)}) 重算</button>`;

      // Build Subsequent Planned Items Trade-off List
      const allStops = stopNodes();
      const legByNodeId = {};
      planned.legs.forEach(lg => {
        legByNodeId[lg.node.id] = lg;
      });

      const stopRowsHtml = allStops
        .map(n => {
          const st = liveStatus(n);
          const isTrim = st === 'want' && state.stayOverrides[n.id] != null && state.stayOverrides[n.id] < (n.stayMin || 0);
          const curMode = st === 'done' ? 'done' : st === 'skip' ? 'skip' : isTrim ? 'trim' : 'keep';
          const canTrim = Boolean(n.minStayMin && n.stayMin && n.minStayMin < n.stayMin);

          let saveHint = '';
          if ((curMode === 'keep' || curMode === 'trim') && planned.stops.some(s => s.id === n.id)) {
            const withoutThis = simulateLive(
              start,
              now,
              planned.stops.filter(s => s.id !== n.id),
              state.live.stayMode || 'full',
              start.here ? state.live.hereMode || 'full' : null,
              dl
            );
            const saved = withoutThis.slack - slack;
            if (saved > 0) saveHint = ` · 砍掉可抢回 ${saved} 分`;
          }

          const leg = legByNodeId[n.id];
          const timeSpanTxt =
            curMode === 'done'
              ? '已完成打卡'
              : curMode === 'skip'
              ? '已砍掉（不计入耗时）'
              : leg
              ? `预计 ${fmtTime(leg.arr)}–${fmtTime(leg.dep)}（停 ${leg.dep - leg.arr} 分）${saveHint}`
              : `标准停留 ${n.stayMin || 0} 分${saveHint}`;

          return `
            <div class="cp-stop-row ${curMode === 'skip' ? 'is-skip' : curMode === 'done' ? 'is-done' : ''}">
              <div class="cp-stop-info">
                <div class="cp-stop-name">${nm(n)}</div>
                <div class="cp-stop-meta">${timeSpanTxt}</div>
              </div>
              <div class="cp-stop-seg" role="group" aria-label="${nm(n)} 取舍">
                <button type="button" class="cp-sbtn ${curMode === 'keep' ? 'on-keep' : ''}" data-stop-id="${n.id}" data-stop-mode="keep">保留${
            n.stayMin ? `(${n.stayMin}m)` : ''
          }</button>
                ${
                  canTrim
                    ? `<button type="button" class="cp-sbtn ${curMode === 'trim' ? 'on-trim' : ''}" data-stop-id="${n.id}" data-stop-mode="trim">压至${n.minStayMin}m</button>`
                    : ''
                }
                <button type="button" class="cp-sbtn ${curMode === 'skip' ? 'on-skip' : ''}" data-stop-id="${n.id}" data-stop-mode="skip">✂️ 砍掉</button>
                <button type="button" class="cp-sbtn ${curMode === 'done' ? 'on-done' : ''}" data-stop-id="${n.id}" data-stop-mode="done">✔ 已完</button>
              </div>
            </div>`;
        })
        .join('');

      const rescueStackHtml = buildRescueStackHtml(L);
      const mealAlerts = evaluateMealGuards(simulateSchedule({})).filter(m => m.isRisk);

      const modeRows = modes
        .map(m => {
          const arr = now + m.min;
          const sl = dl.time - arr;
          const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=${m.tm}`;
          return `<tr class="${sl < 0 ? 'err' : sl < 5 ? 'warn' : 'ok'}">
              <td>${m.icon} ${m.name}${m.note ? `<span class="cp-now-sub">${m.note}</span>` : ''}</td>
              <td>约 ${m.min} 分</td>
              <td><b>${fmtTime(arr)}</b> 到</td>
              <td class="sl">${sl >= 0 ? `余裕 ${sl} 分` : `晚 ${-sl} 分`}</td>
              <td><a href="${url}" target="_blank" rel="noopener">导航</a></td>
            </tr>`;
        })
        .join('');

      box.innerHTML = `
        <div style="display:grid;gap:12px">
          <!-- 1. Ahead / Behind Verdict Banner -->
          <div class="cp-verdict-banner ${lvl}">
            <div class="cp-route-pair">
              📍 起点：<b>${escapeHtml(start.label || nm(start.aNode))}</b>（${clockLabel}） ➔ 🎯 目标：<b>${fmtTime(
        dl.time
      )}</b> 前到「<b id="cp-dlt-target-name">${nm(place)}</b>」${dl.label ? `（${escapeHtml(dl.label)}）` : ''}${distBadge}
            </div>
            <div class="cp-dlt-verdict-row">
              <div class="cp-verdict-big">${slack >= 0 ? `Ahead · 余裕 ${slack} 分钟` : `Behind · 预计晚 ${-slack} 分钟`}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${actionBtnHtml}
                ${state.live.travelOverride === 'taxi' ? '<button type="button" class="cp-now-mini" data-clear-taxi="1">切回默认交通</button>' : ''}
              </div>
            </div>
            <div class="cp-verdict-advice">${adviceHtml}</div>
            ${
              nextNavTarget && nextNavTarget.navUrl
                ? `<div style="margin-top:9px;display:flex;gap:8px;flex-wrap:wrap">
                    <a class="cp-rbtn pri" href="${nextNavTarget.navUrl}" target="_blank" rel="noopener">🧭 导航去「${nm(nextNavTarget)}」</a>
                  </div>`
                : ''
            }
          </div>

          <!-- 2. Behind Automatic Rescue Proposals (auto-launched whenever slack < 0!) -->
          ${
            slack < 0
              ? `<div>
                  <div class="cp-sub-label"><span style="color:var(--cp-err);font-size:13px">🚨 Behind 拯救方案（重新计算完毕 · 点选一键套用）</span></div>
                  ${rescueStackHtml}
                </div>`
              : ''
          }

          <!-- 3. Subsequent Planned Items Trade-off (Keep / Trim / Cut / Done) -->
          ${
            allStops.length
              ? `<div>
                  <div class="cp-sub-label">
                    <span>🗂️ 后续计划项目取舍（点按钮立即重算 Ahead / Behind）</span>
                  </div>
                  <div class="cp-stop-list">${stopRowsHtml}</div>
                </div>`
              : ''
          }

          <!-- 4. Restaurant L.O. Guard (only when at risk) -->
          ${
            mealAlerts.length
              ? `<div class="cp-diag warn" style="margin:0">
                  <div style="font-size:12px;font-weight:700;margin-bottom:4px">🍽️ 餐厅最后点单（L.O.）风险预警：</div>
                  ${mealAlerts.map(m => `<div class="cp-lo-item risk"><b>${escapeHtml(m.name)}：</b>${escapeHtml(m.statusTxt)}</div>`).join('')}
                </div>`
              : ''
          }

          <!-- 5. Direct-to-Destination Multi-Modal ETA Table -->
          ${
            modeRows
              ? `<details style="font-size:12.5px" ${slack < 0 ? 'open' : ''}>
                  <summary style="cursor:pointer;font-weight:700;color:var(--cp-soft)">🚦 查看若现在放弃中途项直奔「${nm(
                    place
                  )}」的各交通方式到达时刻</summary>
                  <div style="margin-top:8px">
                    <table class="cp-dlt-modes"><tbody>${modeRows}</tbody></table>
                  </div>
                </details>`
              : ''
          }
        </div>`;

      bindRescueActions(box, L);
    }

    function refreshStep3AndDock() {
      const L = computeLive();
      fireLeaveAlerts(L);
      renderStep3Result(L);

      const dockBadge = document.getElementById('cp-dock-badge');
      const dockSub = document.getElementById('cp-dock-sub');
      const dockGps = document.getElementById('cp-dock-gps');
      const ls = L.planned.slack;
      const modeTag = L.clockCtx.mode === 'sim' ? '演练 ' : L.clockCtx.mode === 'preview' ? '预览 ' : '';

      if (dockBadge) {
        dockBadge.className = `cp-dock-badge ${ls < 0 ? 'err' : ls < 10 ? 'warn' : 'ok'}`;
        dockBadge.textContent =
          ls >= 0 ? `${ls < 10 ? '🟡' : '🟢'} ${modeTag}Ahead +${ls}分` : `🔴 ${modeTag}Behind -${-ls}分`;
      }
      if (dockSub) {
        const p = L.planned;
        dockSub.textContent = `🎯 ${fmtTime(L.dl.time)} 前到「${p.place.shortName || p.place.name}」· 预计 ${fmtTime(p.destArr)}`;
      }
      if (dockGps) {
        const gm = gpsStatusModel();
        dockGps.className = `cp-dock-gps ${gm.cls}`;
        dockGps.textContent = gm.dockTxt;
        dockGps.style.display = state.gpsActive ? 'inline-flex' : 'none';
      }
      return L;
    }

    // 30 s live heartbeat for countdowns & leave alerts
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshStep3AndDock();
      }
    }, 30000);

    // Main Render: Clean Segmented v3.0 3-Step Layout
    function render() {
      lastRenderedGpsFresh = isGpsFresh();
      const liveSnap = computeLive();
      const sim = simulateSchedule({});
      const delayMin = getDelayVsBaseline();
      const allLockedReady = state.preFlight.tollsOn && state.preFlight.etcReady;
      const customWishVal = (document.getElementById('cp-ai-wish') && document.getElementById('cp-ai-wish').value) || '';
      const aiPrompt = buildAiEmergencyPrompt(sim, delayMin, customWishVal);

      const openReplayFold = document.getElementById('cp-fold-replay')?.open || false;
      const openGateFold = document.getElementById('cp-fold-gate')?.open || false;
      const openAlertsFold = document.getElementById('cp-fold-alerts')?.open || false;
      const openAiFold = document.getElementById('cp-fold-ai')?.open || false;
      const lvl = liveSnap.planned.slack < 0 ? 'err' : liveSnap.planned.slack < 10 ? 'warn' : 'ok';

      const dockGuard = document.getElementById('cp-dock-guard');
      if (dockGuard) {
        dockGuard.className = 'cp-dock-btn' + (state.guardActive ? ' guard-on' : '');
        dockGuard.textContent = state.guardActive ? '🛡️ 护航中' : '🛡️ 护航';
      }

      const guideFolded = Boolean(globalPrefs.hideGuide);

      mount.innerHTML = `
        <div class="cp-v3-stack">
          <!-- Concise 3-Step Usage Guide Strip -->
          <div class="cp-guide-box ${guideFolded ? 'folded' : ''}" id="cp-guide-box">
            <div class="cp-guide-hd" id="cp-guide-toggle">
              <span>💡 使用方法（3步搞定实时进度与晚点重排）</span>
              <span class="cp-guide-toggle">${guideFolded ? '展开提示 ▼' : '收起提示 ▲'}</span>
            </div>
            <div class="cp-guide-steps">
              <div class="cp-guide-item">
                <b>STEP 1 · 定目标死线</b>
                确认几点前必须到达哪个车站/地点（支持随时改站名或时刻）。
              </div>
              <div class="cp-guide-item">
                <b>STEP 2 · 打卡当前位置</b>
                点「📡 取用当前位置」一键 GPS 定位，或点选下方「附近车站 / PA・SA / 地名」。
              </div>
              <div class="cp-guide-item">
                <b>STEP 3 · 看 Ahead/Behind ＆ 取舍</b>
                自动算出提前或落后分钟数；一旦 Behind 自动给出拯救方案，可一键砍减后续项目。
              </div>
            </div>
          </div>

          <!-- STEP 1: Target Time & Destination Station -->
          <section class="cp-step-card step-1" id="cp-step-1" aria-labelledby="cp-s1-title">
            <div class="cp-step-hd">
              <div class="cp-step-title-wrap">
                <span class="cp-step-num">STEP 1</span>
                <h3 class="cp-step-title" id="cp-s1-title">🎯 目标死线（几点前必须到哪）</h3>
              </div>
            </div>
            <p class="cp-step-hint">默认已载入本行程终点死线；可直接输入日本车站 / PA・SA / 地名或修改时刻，第 3 步会同步重算。</p>
            <div id="cp-dlt-form"></div>
          </section>

          <!-- STEP 2: Current Location Check-in -->
          <section class="cp-step-card step-2" id="cp-step-2" aria-labelledby="cp-s2-title">
            <div class="cp-step-hd">
              <div class="cp-step-title-wrap">
                <span class="cp-step-num">STEP 2</span>
                <h3 class="cp-step-title" id="cp-s2-title">📍 位置打卡（确定我现在在哪）</h3>
              </div>
            </div>
            <p class="cp-step-hint">任选 ① 一键取用手机 GPS 当前位置，或 ② 点选身边车站 / 高速 PA・SA / 行程点（地下无信号也可手选打卡）。</p>
            <div id="cp-step2-body"></div>
          </section>

          <!-- STEP 3: Ahead / Behind Verdict & Subsequent Item Pruning -->
          <section class="cp-step-card step-3 ${lvl}" id="cp-step-3" aria-labelledby="cp-s3-title">
            <div class="cp-step-hd">
              <div class="cp-step-title-wrap">
                <span class="cp-step-num">STEP 3</span>
                <h3 class="cp-step-title" id="cp-s3-title">📊 Ahead / Behind 判定 ＆ 后续项目取舍</h3>
              </div>
            </div>
            <p class="cp-step-hint">打卡后立即算出裕度；若 Behind（晚点），自动启动拯救方案，也可手动对后续项目点「保留 / 压缩 / ✂️砍掉」。</p>
            <div id="cp-dlt-result"></div>
          </section>

          <!-- Clean Collapsed Secondary Toolbox -->
          <div class="cp-toolbox">
            ${
              config.replayScenarios && config.replayScenarios.length
                ? `<details class="cp-fold" id="cp-fold-replay" ${openReplayFold ? 'open' : ''}>
                    <summary>
                      <span>🧪 行前晚点演练 ／ 一键重置初始状态</span>
                      <span class="tag blue">模拟测试 ▼</span>
                    </summary>
                    <div class="cp-fold-body">
                      <div style="font-size:12px;color:var(--cp-soft);margin-bottom:8px">点下方场景可模拟行中延误并体验 Behind 拯救重算；测完点「重置初始状态」恢复：</div>
                      <div class="cp-replay-btns">
                        ${config.replayScenarios
                          .map((sc, idx) => `<button type="button" class="cp-chip ${sc.cls || ''}" data-replay="${idx}">${sc.label}</button>`)
                          .join('')}
                        <button type="button" class="cp-chip ok" id="cp-reset-btn">🔄 重置初始状态</button>
                      </div>
                    </div>
                  </details>`
                : ''
            }

            <details class="cp-fold" id="cp-fold-gate" ${openGateFold ? 'open' : ''}>
              <summary>
                <span>🛡️ 出发防呆核查 ＆ 移动节奏系数（当前 ${state.paceFactor.toFixed(2)}×）</span>
                <span class="tag ${allLockedReady ? 'ok' : 'warn'}">${allLockedReady ? '已核查 ▼' : '待勾选 ▼'}</span>
              </summary>
              <div class="cp-fold-body">
                <label class="cp-lock-item">
                  <input type="checkbox" id="cp-chk-tolls" ${state.preFlight.tollsOn ? 'checked' : ''}>
                  <span><b>${(config.gateLabels && config.gateLabels.lock1Title) || '① 已关闭 Google Maps「避开收费公路 / 避开高速公路」：'}</b>${
        config.tollReminder || '点开导航蓝线确认走有料高速，严防误入低速山路！'
      }</span>
                </label>
                <label class="cp-lock-item" style="margin-top:8px">
                  <input type="checkbox" id="cp-chk-etc" ${state.preFlight.etcReady ? 'checked' : ''}>
                  <span><b>${(config.gateLabels && config.gateLabels.lock2Title) || '② 车载 ETC 绿灯亮起 ＋ 零钱备妥：'}</b>${
        config.etcCashReminder || '确认 ETC 读卡正常、IC 卡余额充足。'
      }</span>
                </label>
                <div style="margin-top:10px">
                  <div class="cp-sub-label"><span>${(config.gateLabels && config.gateLabels.paceTitle) || '③ 移动耗时缓冲系数'}</span></div>
                  <div class="cp-pace-row">
                    ${(
                      config.pacePresets || [
                        [1.0, '1.00× 标准畅通', '理想基准'],
                        [1.2, '1.20× 稳健实况', '含换乘/短暂休息'],
                        [1.35, '1.35× 保守缓冲', '防拥堵/慢行']
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
            </details>

            <details class="cp-fold" id="cp-fold-alerts" ${openAlertsFold ? 'open' : ''}>
              <summary>
                <span>📲 手机强提醒设置（系统日历双闹钟 / 常亮语音 / Bark突破静音）</span>
                <span class="tag blue">展开配置 ▼</span>
              </summary>
              <div class="cp-fold-body">
                <div class="cp-chan">
                  <div class="cp-chan-hd">
                    <b>① 手机系统日历（.ics）死线双闹钟（地下无信号照样锁屏弹窗）</b>
                    <span class="tag ok">最稳</span>
                  </div>
                  <div class="cp-sm-btns" style="margin-top:6px">
                    <button type="button" class="cp-sm-btn ok" id="cp-dl-ics">📅 一键导入死线闹钟 (.ics)</button>
                  </div>
                </div>

                <div class="cp-chan">
                  <div class="cp-chan-hd">
                    <b>② 网页常亮语音护航（防息屏＋到点双音警报＋中文语音）</b>
                    <span class="tag ${state.guardActive ? 'ok' : 'warn'}">${state.guardActive ? '运行中' : '可开启'}</span>
                  </div>
                  <div class="cp-sm-btns" style="margin-top:6px">
                    <button type="button" class="cp-sm-btn pri" id="cp-toggle-guard-2">
                      ${state.guardActive ? '⏹️ 关闭常亮语音护航' : '🛡️ 开启常亮语音护航'}
                    </button>
                    <button type="button" class="cp-sm-btn acc" id="cp-test-voice">🔔 测试强提醒</button>
                  </div>
                </div>

                <div class="cp-chan">
                  <div class="cp-chan-hd">
                    <b>③ iPhone Bark 突破静音推送 ＆ 原生通知</b>
                    <span class="tag err">突破静音</span>
                  </div>
                  <div class="cp-inline-inputs" style="margin-top:6px">
                    <input type="text" id="cp-bark-input" placeholder="填入 Bark Key 或 https://api.day.app/你的Key" value="${escapeAttr(
                      globalPrefs.barkKeys
                    )}">
                    <select id="cp-bark-level">
                      <option value="critical" ${globalPrefs.barkLevel === 'critical' ? 'selected' : ''}>🚨 突破静音响铃 (Critical)</option>
                      <option value="timeSensitive" ${globalPrefs.barkLevel === 'timeSensitive' ? 'selected' : ''}>🔔 时效通知</option>
                    </select>
                  </div>
                  <div class="cp-inline-inputs">
                    <input type="text" id="cp-ntfy-input" placeholder="可选：ntfy.sh 频道名" value="${escapeAttr(globalPrefs.ntfyTopic)}">
                  </div>
                  <div class="cp-sm-btns">
                    <button type="button" class="cp-sm-btn pri" id="cp-save-push">💾 保存并测试推送</button>
                    <button type="button" class="cp-sm-btn" id="cp-req-notif">🔔 开启浏览器通知权限</button>
                  </div>
                </div>
              </div>
            </details>

            <details class="cp-fold" id="cp-fold-ai" ${openAiFold ? 'open' : ''}>
              <summary>
                <span>🤖 AI 深度实时改道急救台（临时换店 / 查终电 / 突发改线）</span>
                <span class="tag ok">自动打包坐标 ▼</span>
              </summary>
              <div class="cp-fold-body">
                <div class="cp-chan">
                  <div class="cp-inline-inputs">
                    <input type="text" id="cp-ai-wish" placeholder="可选补充诉求：例「想在附近换一家不用等的店」" value="${escapeAttr(
                      customWishVal
                    )}">
                  </div>
                  <div class="cp-sm-btns">
                    <button type="button" class="cp-sm-btn acc" id="cp-copy-ai">📋 复制 AI 急救指令</button>
                    <a class="cp-sm-btn pri" href="https://chatgpt.com/" target="_blank" rel="noopener" id="cp-open-gpt" style="text-decoration:none">🚀 打开 ChatGPT</a>
                    <a class="cp-sm-btn" href="https://claude.ai/new" target="_blank" rel="noopener" id="cp-open-claude" style="text-decoration:none">🤖 打开 Claude</a>
                  </div>
                  <pre class="cp-ai-pre" id="cp-ai-preview">${escapeHtml(aiPrompt)}</pre>
                </div>
              </div>
            </details>
          </div>
        </div>
      `;

      renderDeadlineForm();
      renderCheckinStep2(liveSnap);
      refreshStep3AndDock();
      bindEvents(sim);
    }

    function resetAllToBaseline() {
      state.enabledNodes = Object.assign({}, defaultEnabled);
      state.stayOverrides = {};
      state.paceFactor = config.defaultPaceFactor || 1.0;
      state.emergencyMode = false;
      state.activePlanId = 'current';
      state.observedPace = null;
      state.simClockMin = null;
      state.forceRealClock = false;
      state.forcePreviewClock = false;
      state.checkinSpot = null;
      state.live = { status: {}, stayMode: 'full', hereMode: 'full', appliedAt: null, deadlines: null, travelOverride: null };
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
      showPageToast('🔄 已重置回出发前初始状态');
    }

    function bindEvents(sim) {
      document.getElementById('cp-guide-toggle')?.addEventListener('click', () => {
        globalPrefs.hideGuide = !globalPrefs.hideGuide;
        savePrefs();
        const box = document.getElementById('cp-guide-box');
        if (box) {
          box.classList.toggle('folded', Boolean(globalPrefs.hideGuide));
          const tg = box.querySelector('.cp-guide-toggle');
          if (tg) tg.textContent = globalPrefs.hideGuide ? '展开提示 ▼' : '收起提示 ▲';
        }
      });

      document.getElementById('cp-chk-tolls')?.addEventListener('change', e => {
        state.preFlight.tollsOn = e.target.checked;
        saveState();
        render();
      });
      document.getElementById('cp-chk-etc')?.addEventListener('change', e => {
        state.preFlight.etcReady = e.target.checked;
        saveState();
        render();
      });

      mount.querySelectorAll('[data-pace]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.paceFactor = parseFloat(btn.dataset.pace);
          saveState();
          render();
          showPageToast(`已切换节奏折算系数为 ${state.paceFactor.toFixed(2)}×`);
        });
      });

      mount.querySelectorAll('[data-replay]').forEach(btn => {
        btn.addEventListener('click', () => {
          const sc = config.replayScenarios[Number(btn.dataset.replay)];
          if (!sc) return;
          if (sc.resetEnabled) state.enabledNodes = Object.assign({}, defaultEnabled, sc.enabledNodes || {});
          state.stayOverrides = Object.assign({}, sc.stayOverrides || {});
          if (sc.paceFactor != null) state.paceFactor = sc.paceFactor;
          if (sc.tollsOn != null) state.preFlight.tollsOn = sc.tollsOn;
          recordCheckin(sc.nodeId, sc.event || 'arr', sc.timeMin, sc.reason, { isReplay: true });
        });
      });

      document.getElementById('cp-reset-btn')?.addEventListener('click', resetAllToBaseline);
      document.getElementById('cp-dl-ics')?.addEventListener('click', () => downloadIcs(sim));
      document.getElementById('cp-toggle-guard-2')?.addEventListener('click', () => toggleGuardMode());
      document.getElementById('cp-test-voice')?.addEventListener('click', () => {
        unlockAudio();
        playChime('err');
        const sampleMsg = `强提醒测试成功！${sim.headline}`;
        speakZh(sampleMsg);
        showUrgentModal(
          sim.riskLevel === 'ok' ? 'warn' : 'err',
          '🔔 手机强提醒效果测试',
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
          '🛰️ 行程实时护航已连接！',
          `测试成功！当前状态：${sim.headline}`,
          location.href,
          globalPrefs.barkLevel === 'critical' ? 'err' : 'warn'
        );
        showPageToast(sent.length ? `✅ 已推送至：${sent.join(' + ')}，请看手机锁屏！` : '⚠️ 推送未送达，请检查 Key 或网络');
        render();
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
          showPageToast('通知权限未开启，可使用日历闹钟或 Bark 强提醒');
        }
      });

      const wishInput = document.getElementById('cp-ai-wish');
      const preEl = document.getElementById('cp-ai-preview');
      wishInput?.addEventListener('input', () => {
        if (preEl) preEl.textContent = buildAiEmergencyPrompt(sim, getDelayVsBaseline(), wishInput.value);
      });
      const copyPromptAction = () => {
        const txt = buildAiEmergencyPrompt(sim, getDelayVsBaseline(), wishInput ? wishInput.value : '');
        if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
        showPageToast('📋 已复制带实时坐标与死线的 AI 急救指令！');
        return txt;
      };
      document.getElementById('cp-copy-ai')?.addEventListener('click', copyPromptAction);
      document.getElementById('cp-open-gpt')?.addEventListener('click', copyPromptAction);
      document.getElementById('cp-open-claude')?.addEventListener('click', copyPromptAction);
    }

    document.querySelectorAll('a[href*="google.com/maps/dir"]').forEach(link => {
      link.addEventListener('click', () => {
        if (!state.preFlight.tollsOn && config.mode !== 'transit') {
          showPageToast('⚠️ 切记确认 Google Maps 未勾选「避开收费公路」且显示「有料」高速！');
        }
      });
    });

    function applyUrlParams() {
      const params = new URLSearchParams(location.search);
      if (params.has('scenario') && config.replayScenarios) {
        const sc = config.replayScenarios[Number(params.get('scenario'))];
        if (sc) {
          recordCheckin(sc.nodeId, sc.event || 'arr', sc.timeMin, sc.reason, { isReplay: true });
          setTimeout(() => mount.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
          return true;
        }
      }
      if (params.has('checkin')) {
        const nid = params.get('checkin');
        const atParam = params.get('at');
        const atMin = parseTime(atParam || '') ?? nowLocalMin();
        if (config.nodes.some(n => n.id === nid)) {
          recordCheckin(nid, params.get('event') || 'arr', atMin, '从提醒链接一键打卡汇报', {
            isRealTime: !atParam
          });
          setTimeout(() => mount.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
          return true;
        }
      }
      if (params.get('copilot') === '1' || location.hash === '#deadline') {
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
      checkinViaGps,
      checkinAtSpot,
      getNearbyPlaces,
      setStopItemMode,
      recalculateFromNow,
      searchLocalStations,
      downloadIcs: () => downloadIcs(simulateSchedule({})),
      playChime,
      speakZh,
      dispatchPush: dispatchStrongNotifications,
      showUrgentModal,
      pingGpsNow,
      switchTab
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
