/**
 * MAHESH NEXORA MARKETS - Professional AI Trading Analyst Engine
 * Real-time graph scanning, Buy/Sell/Wait recommendations, target prices, stop losses,
 * and Multilingual Voice/Text AI Copilot with dynamic translation across 12 languages.
 */

class AIAnalystEngine {
  constructor() {
    this.canvas = document.getElementById('aiChart');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.activeAnalysis = null;

    // Multilingual & Voice Configuration
    this.currentLanguage = 'en-US';
    this.autoVoiceEnabled = true;
    this.isListening = false;
    this.recognition = null;
    this.speechSynth = window.speechSynthesis || null;

    // Supported Languages (including Telugu, Tamil, and Hindi)
    this.languages = {
      'en-US': { name: 'English (US)', flag: '🇺🇸', label: 'English' },
      'hi-IN': { name: 'हिन्दी (Hindi)', flag: '🇮🇳', label: 'Hindi' },
      'te-IN': { name: 'తెలుగు (Telugu)', flag: '🇮🇳', label: 'Telugu' },
      'ta-IN': { name: 'தமிழ் (Tamil)', flag: '🇮🇳', label: 'Tamil' },
      'es-ES': { name: 'Español', flag: '🇪🇸', label: 'Spanish' },
      'fr-FR': { name: 'Français', flag: '🇫🇷', label: 'French' },
      'de-DE': { name: 'Deutsch', flag: '🇩🇪', label: 'German' },
      'ar-SA': { name: 'العربية', flag: '🇸🇦', label: 'Arabic' },
      'zh-CN': { name: '中文 (简体)', flag: '🇨🇳', label: 'Chinese' },
      'ja-JP': { name: '日本語', flag: '🇯🇵', label: 'Japanese' },
      'pt-BR': { name: 'Português', flag: '🇧🇷', label: 'Portuguese' },
      'ru-RU': { name: 'Русский', flag: '🇷🇺', label: 'Russian' },
      'tr-TR': { name: 'Türkçe', flag: '🇹🇷', label: 'Turkish' },
      'it-IT': { name: 'Italiano', flag: '🇮🇹', label: 'Italian' }
    };

    // Localization Dictionary for Core Technical Signals & Dialogue
    this.translations = {
      'en-US': {
        welcome: 'Hello! I am your <b>MAHESH NEXORA AI Trading Assistant</b>. I monitor real-time graph structures, moving averages, RSI, and options. Ask me any question by voice or text in any language!',
        strongBuy: 'STRONG BUY (LONG)',
        buy: 'BUY (LONG)',
        neutral: 'NEUTRAL / WAIT',
        sell: 'SELL (SHORT)',
        strongSell: 'STRONG SELL (SHORT)',
        whyBuyBeg: (name, rsi) => `<b>Why BUY?</b> ${name} is showing solid buyer momentum. Price is sitting comfortably above its 20-period moving average, with RSI at ${rsi} indicating strong absorption.`,
        whySellBeg: (name, rsi) => `<b>Why SELL?</b> Sellers are currently dominating ${name}. Price broke below key support with RSI at ${rsi}, signaling continued short-term slide risk.`,
        whyWaitBeg: (name, supp, res) => `<b>Why WAIT?</b> Market is consolidating inside a channel between $${supp} and $${res}. Best practice is waiting for a confirmed breakout.`,
        optionsCall: (strike) => `Buy Call Strike $${strike} or Bull Call Spread. Capitalize on upward momentum with defined risk.`,
        optionsPut: (strike) => `Buy Put Strike $${strike} or Bear Put Spread to protect downside and profit from bearish move.`,
        optionsCondor: (res) => `Execute an Iron Condor or wait for resistance breakout above $${res}. Range favors theta decay income.`,
        prompts: ['Should I buy or sell right now?', 'What is the best options trade?', 'Where is the stop loss?'],
        listening: '🎙️ Listening... Speak your question now',
        speechNotSupported: 'Speech recognition is not supported in this browser. Please use text input.',
        orderExecuted: (dir, name, tp, sl) => `✅ <b>Order Placed:</b> Opened <b>${dir}</b> on ${name} with Take-Profit ($${tp}) and Stop-Loss ($${sl}).`
      },
      'es-ES': {
        welcome: '¡Hola! Soy tu <b>Asistente de Trading MAHESH NEXORA AI</b>. Monitoreo gráficos, medias móviles, RSI y opciones en tiempo real. ¡Pregúntame lo que quieras por voz o texto en cualquier idioma!',
        strongBuy: 'COMPRA FUERTE (LARGO)',
        buy: 'COMPRAR (LARGO)',
        neutral: 'NEUTRAL / ESPERAR',
        sell: 'VENDER (CORTO)',
        strongSell: 'VENTA FUERTE (CORTO)',
        whyBuyBeg: (name, rsi) => `<b>¿Por qué COMPRAR?</b> ${name} muestra un sólido impulso alcista. El precio está por encima de su media de 20 períodos con RSI en ${rsi}.`,
        whySellBeg: (name, rsi) => `<b>¿Por qué VENDER?</b> Los vendedores dominan ${name}. El precio cayó por debajo del soporte clave con RSI en ${rsi}.`,
        whyWaitBeg: (name, supp, res) => `<b>¿Por qué ESPERAR?</b> El mercado se consolida en un rango entre $${supp} y $${res}. Es mejor esperar una ruptura.`,
        optionsCall: (strike) => `Comprar Call precio de ejercicio $${strike} o Bull Call Spread. Aprovecha la subida con riesgo limitado.`,
        optionsPut: (strike) => `Comprar Put precio de ejercicio $${strike} o Bear Put Spread para protegerte y beneficiarte de la caída.`,
        optionsCondor: (res) => `Ejecuta un Iron Condor o espera la ruptura de resistencia en $${res}. Ideal para recolectar theta.`,
        prompts: ['¿Debo comprar o vender ahora?', '¿Cuál es la mejor opción de trading?', '¿Dónde colocar el stop loss?'],
        listening: '🎙️ Escuchando... Haz tu pregunta ahora',
        speechNotSupported: 'El reconocimiento de voz no es compatible con este navegador. Escribe tu pregunta.',
        orderExecuted: (dir, name, tp, sl) => `✅ <b>Orden Ejecutada:</b> <b>${dir}</b> en ${name} con Take-Profit ($${tp}) y Stop-Loss ($${sl}).`
      },
      'fr-FR': {
        welcome: 'Bonjour! Je suis votre <b>Assistant de Trading MAHESH NEXORA AI</b>. Je surveille les graphiques, moyennes mobiles, RSI et options en direct. Posez vos questions par voix ou texte en toute langue!',
        strongBuy: 'ACHAT FORT (LONG)',
        buy: 'ACHETER (LONG)',
        neutral: 'NEUTRE / ATTENDRE',
        sell: 'VENDRE (SHORT)',
        strongSell: 'VENTE FORTE (SHORT)',
        whyBuyBeg: (name, rsi) => `<b>Pourquoi ACHETER?</b> ${name} montre une dynamique haussière solide au-dessus de sa moyenne mobile avec un RSI à ${rsi}.`,
        whySellBeg: (name, rsi) => `<b>Pourquoi VENDRE?</b> Les vendeurs dominent ${name}. Le prix a franchi le support clé avec un RSI à ${rsi}.`,
        whyWaitBeg: (name, supp, res) => `<b>Pourquoi ATTENDRE?</b> Consolidation dans un canal entre $${supp} et $${res}. Attendez une cassure confirmée.`,
        optionsCall: (strike) => `Acheter un Call Strike $${strike} ou un Bull Call Spread pour capter la hausse avec risque défini.`,
        optionsPut: (strike) => `Acheter un Put Strike $${strike} ou Bear Put Spread pour couvrir la baisse.`,
        optionsCondor: (res) => `Iron Condor recommandé tant que la résistance à $${res} tient.`,
        prompts: ['Dois-je acheter ou vendre?', 'Quelle est la meilleure stratégie d\'options?', 'Où placer mon stop loss?'],
        listening: '🎙️ Écoute en cours... Posez votre question',
        speechNotSupported: 'Reconnaissance vocale non prise en charge. Veuillez taper votre message.',
        orderExecuted: (dir, name, tp, sl) => `✅ <b>Ordre Passé:</b> <b>${dir}</b> sur ${name} avec TP ($${tp}) et SL ($${sl}).`
      },
      'de-DE': {
        welcome: 'Hallo! Ich bin Ihr <b>MAHESH NEXORA AI Trading Assistent</b>. Ich analysiere Kurscharts, EMAs, RSI und Optionen in Echtzeit. Fragen Sie mich per Sprache oder Text in jeder Sprache!',
        strongBuy: 'STARKER KAUF (LONG)',
        buy: 'KAUFEN (LONG)',
        neutral: 'NEUTRAL / WARTEN',
        sell: 'VERKAUFEN (SHORT)',
        strongSell: 'STARKER VERKAUF (SHORT)',
        whyBuyBeg: (name, rsi) => `<b>Warum KAUFEN?</b> ${name} zeigt starke bullische Dynamik über dem 20-Perioden-Trend mit RSI bei ${rsi}.`,
        whySellBeg: (name, rsi) => `<b>Warum VERKAUFEN?</b> Bären dominieren ${name}. Unterstützung gebrochen bei RSI ${rsi}.`,
        whyWaitBeg: (name, supp, res) => `<b>Warum WARTEN?</b> Seitwärtsbewegung zwischen $${supp} und $${res}. Bestätigten Ausbruch abwarten.`,
        optionsCall: (strike) => `Call Strike $${strike} oder Bull Call Spread kaufen mit festem Risiko.`,
        optionsPut: (strike) => `Put Strike $${strike} oder Bear Put Spread zur Absicherung kaufen.`,
        optionsCondor: (res) => `Iron Condor ausführen zur Zeitwertgewinnung im Kanal unter $${res}.`,
        prompts: ['Sollte ich jetzt kaufen oder verkaufen?', 'Was ist der beste Optionshandel?', 'Wo setze ich den Stop Loss?'],
        listening: '🎙️ Höre zu... Sprechen Sie jetzt',
        speechNotSupported: 'Spracherkennung wird nicht unterstützt.',
        orderExecuted: (dir, name, tp, sl) => `✅ <b>Order Ausgeführt:</b> <b>${dir}</b> für ${name} (TP: $${tp}, SL: $${sl}).`
      },
      'hi-IN': {
        welcome: 'नमस्ते! मैं आपका <b>MAHESH NEXORA AI ट्रेडिंग सहायक</b> हूँ। मैं लाइव चार्ट, मूविंग एवरेज, RSI और ऑप्शंस का विश्लेषण करता हूँ। किसी भी भाषा में बोलकर या लिखकर प्रश्न पूछें!',
        strongBuy: 'मजबूत खरीद (LONG)',
        buy: 'खरीदें (LONG)',
        neutral: 'तटस्थ / प्रतीक्षा करें',
        sell: 'बेचें (SHORT)',
        strongSell: 'मजबूत बिक्री (SHORT)',
        whyBuyBeg: (name, rsi) => `<b>खरीदें क्यों?</b> ${name} में जोरदार तेजी दिख रही है। कीमत 20-दिवसीय औसत से ऊपर है और RSI ${rsi} पर है।`,
        whySellBeg: (name, rsi) => `<b>बेचें क्यों?</b> विक्रेता ${name} पर हावी हैं। मुख्य सपोर्ट टूट गया है और RSI ${rsi} है।`,
        whyWaitBeg: (name, supp, res) => `<b>प्रतीक्षा क्यों?</b> बाजार $${supp} और $${res} के बीच अटका है। ब्रेकआउट का इंतजार करें।`,
        optionsCall: (strike) => `कॉल स्ट्राइक $${strike} खरीदें या बुल कॉल स्प्रेड अपनाएं। सीमित जोखिम के साथ मुनाफा।`,
        optionsPut: (strike) => `पुट स्ट्राइक $${strike} खरीदें या बेयर पुट स्प्रेड द्वारा गिरावट से लाभ कमाएं।`,
        optionsCondor: (res) => `आयरन कोंडोर रणनीति अपनाएं या $${res} के पार ब्रेकआउट देखें।`,
        prompts: ['क्या मुझे अभी खरीदना चाहिए या बेचना?', 'सबसे अच्छा ऑप्शंस ट्रेड कौन सा है?', 'स्टॉप लॉस कहाँ रखें?'],
        listening: '🎙️ सुन रहा हूँ... अभी बोलें',
        speechNotSupported: 'इस ब्राउज़र में वॉइस पहचान समर्थित नहीं है।',
        orderExecuted: (dir, name, tp, sl) => `✅ <b>ऑर्डर दर्ज:</b> ${name} पर <b>${dir}</b> (TP: $${tp}, SL: $${sl})।`
      },
      'te-IN': {
        welcome: 'నమస్కారం! నేను మీ <b>MAHESH NEXORA AI ట్రేడింగ్ అసిస్టెంట్‌ని</b>. లైవ్ చార్ట్, మూవింగ్ యావరేజ్, RSI మరియు ఆప్షన్‌లను విశ్లేషిస్తాను. ఏదైనా ప్రశ్నను తెలుగులో వాయిస్ లేదా టెక్స్ట్ ద్వారా అడగండి!',
        strongBuy: 'బలమైన కొనుగోలు (STRONG BUY)',
        buy: 'కొనుగోలు (BUY)',
        neutral: 'న్యూట్రల్ / వేచి ఉండండి',
        sell: 'అమ్మకం (SELL)',
        strongSell: 'బలమైన అమ్మకం (STRONG SELL)',
        whyBuyBeg: (name, rsi) => `<b>ఎందుకు కొనాలి?</b> ${name} లో బలమైన కొనుగోలు జోరు కనిపిస్తోంది. ధర 20-పీరియడ్ మూవింగ్ యావరేజ్ పైన ఉంది, RSI ${rsi} వద్ద ఉంది.`,
        whySellBeg: (name, rsi) => `<b>ఎందుకు అమ్మాలి?</b> విక్రేతలు ${name} పై ఆధిపత్యం వహిస్తున్నారు. సపోర్ట్ బ్రేక్ అయింది, RSI ${rsi}.`,
        whyWaitBeg: (name, supp, res) => `<b>ఎందుకు వేచి ఉండాలి?</b> మార్కెట్ $${supp} మరియు $${res} మధ్య కన్సాలిడేట్ అవుతోంది. బ్రేక్ అవుట్ వచ్చేవరకు వేచి చూడండి.`,
        optionsCall: (strike) => `కాల్ ఆప్షన్ స్ట్రైక్ $${strike} లేదా బుల్ కాల్ స్ప్రెడ్ కొనండి.`,
        optionsPut: (strike) => `పుట్ ఆప్షన్ స్ట్రైక్ $${strike} కొనండి డౌన్‌సైడ్ ప్రొటెక్షన్ కోసం.`,
        optionsCondor: (res) => `$${res} రెసిస్టెన్స్ కింద ఐరన్ కాండోర్ స్ట్రాటజీ ఉత్తమం.`,
        prompts: ['నేను ఇప్పుడు కొనాలా లేదా అమ్మాలా?', 'ఉత్తమ ఆప్షన్స్ ట్రేడ్ ఏది?', 'స్టాప్ లాస్ ఎక్కడ ఉంచాలి?'],
        listening: '🎙️ వింటున్నాను... ఇప్పుడు తెలుగులో మాట్లాడండి',
        speechNotSupported: 'వాయిస్ రికగ్నిషన్ సపోర్ట్ చేయలేదు.',
        orderExecuted: (dir, name, tp, sl) => `✅ <b>ఆర్డర్ అమలు చేయబడింది:</b> <b>${dir}</b> ${name} పై (TP: $${tp}, SL: $${sl}).`
      },
      'ta-IN': {
        welcome: 'வணக்கம்! நான் உங்கள் <b>MAHESH NEXORA AI வர்த்தக உதவியாளர்</b>. நிகழ்நேர வரைபடங்கள், மூவிங் ஆவரேஜ், RSI மற்றும் விருப்பங்களை ஆய்வு செய்கிறேன். குரல் அல்லது உரை மூலம் தமிழில் கேளுங்கள்!',
        strongBuy: 'வலுவான வாங்குதல் (STRONG BUY)',
        buy: 'வாங்கு (BUY)',
        neutral: 'நடுநிலை / காத்திருக்கவும்',
        sell: 'விற்பனை (SELL)',
        strongSell: 'வலுவான விற்பனை (STRONG SELL)',
        whyBuyBeg: (name, rsi) => `<b>ஏன் வாங்க வேண்டும்?</b> ${name} வலுவான வாங்கும் வேகத்தைக் காட்டுகிறது. விலை 20-கால சராசரிக்கு மேல் உள்ளது, RSI ${rsi}.`,
        whySellBeg: (name, rsi) => `<b>ஏன் விற்க வேண்டும்?</b> விற்பனையாளர்கள் ${name} ஐ ஆதிக்கம் செலுத்துகிறார்கள். முக்கிய ஆதரவு உடைந்துள்ளது (RSI ${rsi}).`,
        whyWaitBeg: (name, supp, res) => `<b>ஏன் காத்திருக்க வேண்டும்?</b> சந்தை $${supp} மற்றும் $${res} இடையே நகர்கிறது. பிரேக்அவுட்டிற்காக காத்திருங்கள்.`,
        optionsCall: (strike) => `கால் ஆப்ஷன் ஸ்ட்ரைக் $${strike} அல்லது புல் கால் ஸ்ப்ரெட் வாங்கவும்.`,
        optionsPut: (strike) => `புட் ஆப்ஷன் ஸ்ட்ரைக் $${strike} வாங்கி சரிவிலிருந்து பாதுகாக்கவும்.`,
        optionsCondor: (res) => `$${res} எதிர்ப்பின் கீழ் அயர்ன் காண்டோர் உத்தி சிறந்தது.`,
        prompts: ['நான் இப்போது வாங்க வேண்டுமா அல்லது விற்க வேண்டுமா?', 'சிறந்த விருப்ப வர்த்தகம் எது?', 'ஸ்டாப் லாஸ் எங்கே வைக்க வேண்டும்?'],
        listening: '🎙️ கேட்கிறது... இப்போது தமிழில் பேசுங்கள்',
        speechNotSupported: 'குரல் அறிதல் ஆதரிக்கப்படவில்லை.',
        orderExecuted: (dir, name, tp, sl) => `✅ <b>ஆர்டர் செயல்படுத்தப்பட்டது:</b> ${name} இல் <b>${dir}</b> (TP: $${tp}, SL: $${sl}).`
      },
      'ar-SA': {
        welcome: 'مرحباً! أنا <b>مساعد MAHESH NEXORA AI للتداول</b>. أحلل الرسوم البيانية والمتوسطات ومؤشر RSI وعقود الخيارات لحظياً. اسألني بالصوت أو النص بأي لغة!',
        strongBuy: 'شراء قوي (LONG)',
        buy: 'شراء (LONG)',
        neutral: 'محايد / انتظر',
        sell: 'بيع (SHORT)',
        strongSell: 'بيع قوي (SHORT)',
        whyBuyBeg: (name, rsi) => `<b>لماذا تشتري؟</b> يظهر ${name} زخماً صعودياً قوياً فوق المتوسط المتحرك مع RSI عند ${rsi}.`,
        whySellBeg: (name, rsi) => `<b>لماذا تبيع؟</b> البائعون يسيطرون على ${name}. كسر السعر الدعم مع RSI عند ${rsi}.`,
        whyWaitBeg: (name, supp, res) => `<b>لماذا الانتظار؟</b> السوق يتذبذب بين $${supp} و $${res}. انتظر الاختراق.`,
        optionsCall: (strike) => `شراء عقد Call عند سعر $${strike} للاستفادة من الصعود بمخاطر محددة.`,
        optionsPut: (strike) => `شراء عقد Put عند سعر $${strike} للحماية والاستفادة من الهبوط.`,
        optionsCondor: (res) => `استراتيجية Iron Condor مناسبة داخل القناة الحالية حتى $${res}.`,
        prompts: ['هل يجب أن أشتري أم أبيع الآن؟', 'ما هي أفضل صفقة خيارات؟', 'أين أضع وقف الخسارة؟'],
        listening: '🎙️ جاري الاستماع... تحدث الآن',
        speechNotSupported: 'التعرف على الصوت غير مدعوم في هذا المتصفح.',
        orderExecuted: (dir, name, tp, sl) => `✅ <b>تم تنفيذ الأمر:</b> <b>${dir}</b> على ${name} مع أهداف TP ($${tp}) و SL ($${sl}).`
      },
      'zh-CN': {
        welcome: '您好！我是您的 <b>MAHESH NEXORA AI 智能交易助手</b>。我实时监控K线图表、移动平均线、RSI指标和期权链。支持任意语言的语音或文本交流！',
        strongBuy: '强烈买入 (做多)',
        buy: '买入 (做多)',
        neutral: '中立 / 观望',
        sell: '卖出 (做空)',
        strongSell: '强烈卖出 (做空)',
        whyBuyBeg: (name, rsi) => `<b>为何买入？</b> ${name} 展现出强劲买盘动能，价格位于20周期均线上方，RSI为 ${rsi}。`,
        whySellBeg: (name, rsi) => `<b>为何卖出？</b> 卖家目前主导 ${name}，跌破关键支撑位，RSI为 ${rsi}。`,
        whyWaitBeg: (name, supp, res) => `<b>为何观望？</b> 价格在 $${supp} 至 $${res} 的通道内震荡，建议等待有效突破。`,
        optionsCall: (strike) => `买入看涨期权 (行权价 $${strike}) 或牛市看涨价差，锁定下行风险。`,
        optionsPut: (strike) => `买入看跌期权 (行权价 $${strike}) 进行对冲或从下跌中获利。`,
        optionsCondor: (res) => `建议执行铁鹰式策略 (Iron Condor) 收取时间价值，阻力位 $${res}。`,
        prompts: ['现在应该买入还是卖出？', '目前最佳期权策略是什么？', '止损点位设在哪里？'],
        listening: '🎙️ 正在聆听... 请说话',
        speechNotSupported: '此浏览器不支持语音识别。',
        orderExecuted: (dir, name, tp, sl) => `✅ <b>订单已执行:</b> 在 ${name} 建立 <b>${dir}</b> 仓位 (TP: $${tp}, SL: $${sl})。`
      },
      'ja-JP': {
        welcome: 'こんにちは！<b>MAHESH NEXORA AI トレーディングアシスタント</b>です。チャート、移動平均、RSI、オプションをリアルタイムで監視しています。音声やテキストでお気軽にどうぞ！',
        strongBuy: '強い買い (ロング)',
        buy: '買い (ロング)',
        neutral: '中立 / 様子見',
        sell: '売り (ショート)',
        strongSell: '強い売り (ショート)',
        whyBuyBeg: (name, rsi) => `<b>買いの理由:</b> ${name} は20期間移動平均線の上で力強い買い圧力を示しており、RSIは ${rsi} です。`,
        whySellBeg: (name, rsi) => `<b>売りの理由:</b> ${name} は売り手が優勢でサポートラインを割り込み、RSIは ${rsi} です。`,
        whyWaitBeg: (name, supp, res) => `<b>様子見の理由:</b> $${supp} と $${res} のレンジ相場です。ブレイクアウトを確認しましょう。`,
        optionsCall: (strike) => `権利行使価格 $${strike} のコールまたはブルコールスプレッドの購入が有利です。`,
        optionsPut: (strike) => `権利行使価格 $${strike} のプットを購入して下落をヘッジ・利益化します。`,
        optionsCondor: (res) => `レンジ相場ではアイアンコンドルが最適です (レジスタンス $${res})。`,
        prompts: ['今買うべき？それとも売るべき？', '一番おすすめのオプション取引は？', 'ストップロスはどこに置くべき？'],
        listening: '🎙️ 音声を認識中... お話しください',
        speechNotSupported: 'お使いのブラウザは音声認識に対応していません。',
        orderExecuted: (dir, name, tp, sl) => `✅ <b>注文完了:</b> ${name} で <b>${dir}</b> (TP: $${tp}, SL: $${sl}) を約定しました。`
      },
      'pt-BR': {
        welcome: 'Olá! Sou seu <b>Assistente de Trading MAHESH NEXORA AI</b>. Monitoro gráficos, médias móveis, RSI e opções em tempo real. Pergunte por voz ou texto em qualquer idioma!',
        strongBuy: 'COMPRA FORTE (LONG)',
        buy: 'COMPRAR (LONG)',
        neutral: 'NEUTRO / AGUARDAR',
        sell: 'VENDER (SHORT)',
        strongSell: 'VENDA FORTE (SHORT)',
        whyBuyBeg: (name, rsi) => `<b>Por que COMPRAR?</b> ${name} apresenta forte ímpeto comprador acima da média de 20 períodos com RSI em ${rsi}.`,
        whySellBeg: (name, rsi) => `<b>Por que VENDER?</b> Vendedores dominam ${name}, quebrando o suporte com RSI em ${rsi}.`,
        whyWaitBeg: (name, supp, res) => `<b>Por que AGUARDAR?</b> Mercado consolidado entre $${supp} e $${res}. Aguarde rompimento.`,
        optionsCall: (strike) => `Comprar Call Strike $${strike} ou Bull Call Spread com risco limitado.`,
        optionsPut: (strike) => `Comprar Put Strike $${strike} ou Bear Put Spread para lucrar na queda.`,
        optionsCondor: (res) => `Execute Iron Condor para rentabilizar passagem de tempo até resistência em $${res}.`,
        prompts: ['Devo comprar ou vender agora?', 'Qual a melhor operação de opções?', 'Onde posicionar o stop loss?'],
        listening: '🎙️ Ouvindo... Fale agora',
        speechNotSupported: 'Reconhecimento de voz não suportado neste navegador.',
        orderExecuted: (dir, name, tp, sl) => `✅ <b>Ordem Executada:</b> <b>${dir}</b> em ${name} (TP: $${tp}, SL: $${sl}).`
      },
      'ru-RU': {
        welcome: 'Здравствуйте! Я ваш <b>MAHESH NEXORA AI Торговый Ассистент</b>. Анализирую графики, скользящие средние, RSI и опционы в реальном времени. Спрашивайте голосом или текстом на любом языке!',
        strongBuy: 'АКТИВНО ПОКУПАТЬ (LONG)',
        buy: 'ПОКУПАТЬ (LONG)',
        neutral: 'НЕЙТРАЛЬНО / ЖДАТЬ',
        sell: 'ПРОДАВАТЬ (SHORT)',
        strongSell: 'АКТИВНО ПРОДАВАТЬ (SHORT)',
        whyBuyBeg: (name, rsi) => `<b>Почему ПОКУПАТЬ?</b> ${name} демонстрирует сильный восходящий импульс выше 20 EMA, RSI равен ${rsi}.`,
        whySellBeg: (name, rsi) => `<b>Почему ПРОДАВАТЬ?</b> Продавцы доминируют по ${name}, пробит уровень поддержки, RSI равен ${rsi}.`,
        whyWaitBeg: (name, supp, res) => `<b>Почему ЖДАТЬ?</b> Консолидация в канале между $${supp} и $${res}. Дождитесь пробоя.`,
        optionsCall: (strike) => `Покупка Call страйк $${strike} или Bull Call Spread с фиксированным риском.`,
        optionsPut: (strike) => `Покупка Put страйк $${strike} для хеджа и заработка на падении.`,
        optionsCondor: (res) => `Стратегия Iron Condor оптимальна при сопротивлении $${res}.`,
        prompts: ['Покупать или продавать прямо сейчас?', 'Какая лучшая опционная стратегия?', 'Где выставить стоп-лосс?'],
        listening: '🎙️ Слушаю... Говорите сейчас',
        speechNotSupported: 'Распознавание речи не поддерживается браузером.',
        orderExecuted: (dir, name, tp, sl) => `✅ <b>Ордер исполнен:</b> <b>${dir}</b> по ${name} (TP: $${tp}, SL: $${sl}).`
      },
      'tr-TR': {
        welcome: 'Merhaba! Ben <b>MAHESH NEXORA AI Alım Satım Asistanınız</b>. Grafikleri, hareketli ortalamaları, RSI ve opsiyonları anlık analiz ediyorum. Sesli veya yazılı olarak her dilde sorabilirsiniz!',
        strongBuy: 'GÜÇLÜ AL (LONG)',
        buy: 'AL (LONG)',
        neutral: 'NÖTR / BEKLE',
        sell: 'SAT (SHORT)',
        strongSell: 'GÜÇLÜ SAT (SHORT)',
        whyBuyBeg: (name, rsi) => `<b>Neden AL?</b> ${name} 20 periyotluk hareketli ortalamanın üzerinde güçlü yükseliş ivmesi gösteriyor (RSI: ${rsi}).`,
        whySellBeg: (name, rsi) => `<b>Neden SAT?</b> ${name} üzerinde satıcılar hakim. Destek kırıldı (RSI: ${rsi}).`,
        whyWaitBeg: (name, supp, res) => `<b>Neden BEKLE?</b> $${supp} ile $${res} arasında yatay kanal var. Kırılımı bekleyin.`,
        optionsCall: (strike) => `$${strike} kullanım fiyatlı Call veya Bull Call Spread ile yükselişten faydalanın.`,
        optionsPut: (strike) => `$${strike} kullanım fiyatlı Put satın alarak düşüşe karşı korunun.`,
        optionsCondor: (res) => `$${res} direnci altında Iron Condor ile zaman erimesinden kazanın.`,
        prompts: ['Şimdi almalı mıyım yoksa satmalı mıyım?', 'En iyi opsiyon işlemi nedir?', 'Stop loss nerede olmalı?'],
        listening: '🎙️ Dinleniyor... Şimdi konuşun',
        speechNotSupported: 'Bu tarayıcıda ses tanıma desteklenmiyor.',
        orderExecuted: (dir, name, tp, sl) => `✅ <b>Emir İletildi:</b> ${name} için <b>${dir}</b> (TP: $${tp}, SL: $${sl}).`
      },
      'it-IT': {
        welcome: 'Ciao! Sono il tuo <b>Assistente di Trading MAHESH NEXORA AI</b>. Monitoro grafici, medie mobili, RSI e opzioni in tempo reale. Chiedimi qualsiasi cosa a voce o testo in qualunque lingua!',
        strongBuy: 'FORTE ACQUISTO (LONG)',
        buy: 'COMPRA (LONG)',
        neutral: 'NEUTRO / ATTENDI',
        sell: 'VENDI (SHORT)',
        strongSell: 'FORTE VENDITA (SHORT)',
        whyBuyBeg: (name, rsi) => `<b>Perché COMPRARE?</b> ${name} mostra un solido slancio rialzista sopra la media a 20 periodi con RSI a ${rsi}.`,
        whySellBeg: (name, rsi) => `<b>Perché VENDERE?</b> I venditori dominano ${name}, con supporto rotto e RSI a ${rsi}.`,
        whyWaitBeg: (name, supp, res) => `<b>Perché ATTENDERE?</b> Consolidamento nel canale tra $${supp} e $${res}. Attendi il breakout.`,
        optionsCall: (strike) => `Acquista Call Strike $${strike} o Bull Call Spread con rischio limitato.`,
        optionsPut: (strike) => `Acquista Put Strike $${strike} o Bear Put Spread per proteggerti dal ribasso.`,
        optionsCondor: (res) => `Iron Condor consigliato sotto la resistenza di $${res}.`,
        prompts: ['Dovrei comprare o vendere adesso?', 'Qual è la migliore operazione in opzioni?', 'Dove posizionare lo stop loss?'],
        listening: '🎙️ In ascolto... Parla ora',
        speechNotSupported: 'Riconoscimento vocale non supportato in questo browser.',
        orderExecuted: (dir, name, tp, sl) => `✅ <b>Ordine Eseguito:</b> <b>${dir}</b> su ${name} (TP: $${tp}, SL: $${sl}).`
      }
    };

    this.initEvents();
    this.initSpeechRecognition();
    this.resizeChart();
    this.analyze();
    this.renderChart();
    this.updateRadarTable();

    // Listen to real-time price changes
    if (window.tradeState) {
      window.tradeState.subscribe((event) => {
        if (event === 'tick' || event === 'newCandle' || event === 'assetChange') {
          this.analyze();
          this.renderChart();
          this.updateRadarTable();
        }
      });
    }
  }

  getLangData() {
    return this.translations[this.currentLanguage] || this.translations['en-US'];
  }

  setLanguage(langCode) {
    if (this.languages[langCode]) {
      this.currentLanguage = langCode;
      if (this.recognition) {
        this.recognition.lang = langCode;
      }

      // Re-analyze & re-render with translated verdict
      this.analyze();
      this.updateQuickPrompts();

      // Announce language change in chat
      const langName = this.languages[langCode].name;
      const flag = this.languages[langCode].flag;
      const welcomeMsg = this.getLangData().welcome;
      this.appendChatBubble('ai', `${flag} <b>${langName}</b> selected.<br>${welcomeMsg}`);

      if (this.autoVoiceEnabled) {
        this.speakText(welcomeMsg.replace(/<[^>]*>?/gm, ''), this.currentLanguage);
      }
    }
  }

  updateQuickPrompts() {
    const prompts = this.getLangData().prompts;
    const container = document.getElementById('ai-quick-prompts');
    if (!container || !prompts) return;

    container.innerHTML = `
      <button onclick="aiAnalyst.sendQuickPrompt('${prompts[0]}')" class="text-[11px] bg-slate-900 border border-white/10 hover:border-[#008080] text-slate-300 px-2 py-1 rounded-lg transition">
        💬 ${prompts[0]}
      </button>
      <button onclick="aiAnalyst.sendQuickPrompt('${prompts[1]}')" class="text-[11px] bg-slate-900 border border-white/10 hover:border-[#008080] text-slate-300 px-2 py-1 rounded-lg transition">
        ⚡ ${prompts[1]}
      </button>
      <button onclick="aiAnalyst.sendQuickPrompt('${prompts[2]}')" class="text-[11px] bg-slate-900 border border-white/10 hover:border-[#008080] text-slate-300 px-2 py-1 rounded-lg transition">
        🛑 ${prompts[2]}
      </button>
    `;
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.currentLanguage;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateMicUI(true);
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById('ai-chat-input');
      if (input) input.value = transcript;
      this.handleUserMessage(transcript);
    };

    this.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      this.isListening = false;
      this.updateMicUI(false);
      showToast(`Mic Notice: ${event.error}`, 'warning');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateMicUI(false);
    };
  }

  toggleSpeechRecognition() {
    if (!this.recognition) {
      showToast(this.getLangData().speechNotSupported, 'warning');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.updateMicUI(false);
    } else {
      try {
        this.recognition.lang = this.currentLanguage;
        this.recognition.start();
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }
  }

  updateMicUI(listening) {
    const micBtn = document.getElementById('ai-mic-btn');
    const listeningBanner = document.getElementById('ai-listening-indicator');

    if (micBtn) {
      if (listening) {
        micBtn.classList.add('recording');
        micBtn.title = 'Listening... Click to stop';
      } else {
        micBtn.classList.remove('recording');
        micBtn.title = 'Click to speak in your language';
      }
    }

    if (listeningBanner) {
      listeningBanner.style.display = listening ? 'flex' : 'none';
      if (listening) {
        const langName = this.languages[this.currentLanguage]?.name || 'English';
        listeningBanner.innerHTML = `
          <div class="speaking-wave-bars">
            <span></span><span></span><span></span><span></span>
          </div>
          <span>🎙️ Listening in <b>${langName}</b>... Speak now</span>
        `;
      }
    }
  }

  // Voice Output (Speech Synthesis)
  speakText(text, lang = this.currentLanguage) {
    if (!this.speechSynth) return;

    try {
      this.speechSynth.cancel(); // stop any current speech
      const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/[$#*]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang;
      utterance.rate = 1.02;
      utterance.pitch = 1.0;

      // Match voice for locale if available
      const voices = this.speechSynth.getVoices();
      const langPrefix = lang.split('-')[0].toLowerCase();
      const matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      this.speechSynth.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  }

  toggleAutoVoice() {
    this.autoVoiceEnabled = !this.autoVoiceEnabled;
    const btn = document.getElementById('ai-voice-toggle-btn');
    if (btn) {
      btn.innerHTML = this.autoVoiceEnabled ? '🗣️ Voice: ON' : '🔇 Voice: OFF';
      btn.classList.toggle('text-[#00d4d4]', this.autoVoiceEnabled);
      btn.classList.toggle('text-slate-500', !this.autoVoiceEnabled);
    }
    if (!this.autoVoiceEnabled && this.speechSynth) {
      this.speechSynth.cancel();
    }
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.resizeChart();
      this.renderChart();
    });

    // Chat form submit
    const chatForm = document.getElementById('ai-chat-form');
    const chatInput = document.getElementById('ai-chat-input');
    if (chatForm && chatInput) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if (msg) {
          this.handleUserMessage(msg);
          chatInput.value = '';
        }
      });
    }

    // Populate voices when ready
    if (this.speechSynth && this.speechSynth.onvoiceschanged !== undefined) {
      this.speechSynth.onvoiceschanged = () => this.speechSynth.getVoices();
    }
  }

  resizeChart() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = 360;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);
  }

  // Core Technical Analysis Algorithms
  computeTechnicalMetrics(asset) {
    const candles = asset.history || [];
    if (candles.length < 15) {
      return null;
    }

    const currentPrice = asset.price;
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);

    // 1. Calculate RSI (14)
    let gains = 0, losses = 0;
    for (let i = candles.length - 14; i < candles.length; i++) {
      const diff = candles[i].close - candles[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = Number((100 - (100 / (1 + rs))).toFixed(1));

    // 2. Exponential Moving Averages (EMA 20 & EMA 50)
    const k20 = 2 / (20 + 1);
    const k50 = 2 / (50 + 1);
    let ema20 = closes[0];
    let ema50 = closes[0];
    closes.forEach(c => {
      ema20 = c * k20 + ema20 * (1 - k20);
      ema50 = c * k50 + ema50 * (1 - k50);
    });

    // 3. MACD (12, 26, 9)
    const calcEMAArr = (arr, p) => {
      const k = 2 / (p + 1);
      let e = arr[0];
      return arr.map(v => { e = v * k + e * (1 - k); return e; });
    };
    const ema12Arr = calcEMAArr(closes, 12);
    const ema26Arr = calcEMAArr(closes, 26);
    const macdLineArr = ema12Arr.map((v, i) => v - ema26Arr[i]);
    const signalLineArr = calcEMAArr(macdLineArr, 9);
    const lastMacd = macdLineArr[macdLineArr.length - 1];
    const lastSignal = signalLineArr[signalLineArr.length - 1];
    const lastHist = lastMacd - lastSignal;
    const isMacdBullCross = lastMacd >= lastSignal;

    // 4. ⚡ Supertrend (ATR 10, Multiplier 3)
    let isSupertrendBull = true;
    let supertrendVal = currentPrice * 0.98;
    if (candles.length >= 10) {
      const trArr = [candles[0].high - candles[0].low];
      for (let i = 1; i < candles.length; i++) {
        trArr.push(Math.max(
          candles[i].high - candles[i].low,
          Math.abs(candles[i].high - candles[i - 1].close),
          Math.abs(candles[i].low - candles[i - 1].close)
        ));
      }
      const last10Tr = trArr.slice(-10);
      const atr10 = last10Tr.reduce((a, b) => a + b, 0) / 10;
      const mid = (candles[candles.length - 1].high + candles[candles.length - 1].low) / 2;
      isSupertrendBull = currentPrice >= mid;
      supertrendVal = isSupertrendBull ? (mid - 3 * atr10) : (mid + 3 * atr10);
    }

    // 5. 📐 Fibonacci Retracements (61.8% Golden Ratio)
    const recentLows = lows.slice(-30);
    const recentHighs = highs.slice(-30);
    const supportLevel = Math.min(...recentLows);
    const resistanceLevel = Math.max(...recentHighs);
    const fibRange = resistanceLevel - supportLevel;
    const fibGolden618 = supportLevel + fibRange * 0.618;
    const fib50 = supportLevel + fibRange * 0.500;
    const isNearFibSupport = Math.abs(currentPrice - fibGolden618) / currentPrice < 0.015 || Math.abs(currentPrice - fib50) / currentPrice < 0.015;

    // 6. Momentum & Trend Evaluation
    const priceVsEma20 = (currentPrice - ema20) / ema20;
    const emaSpread = (ema20 - ema50) / ema50;
    const isEmaBullCross = ema20 > ema50;
    const recentChangePct = ((currentPrice - closes[closes.length - 6]) / closes[closes.length - 6]) * 100;

    // Scoring Algorithm: Confluence of EMA, RSI, MACD, and Supertrend
    let score = 0;
    if (isEmaBullCross) score += 20; else score -= 20;
    if (currentPrice > ema20) score += 15; else score -= 15;
    if (isSupertrendBull) score += 25; else score -= 25;
    if (isMacdBullCross) score += 20; else score -= 20;
    if (lastHist > 0) score += 10; else score -= 10;

    if (rsi < 35) score += 25; // oversold bounce
    else if (rsi > 70) score -= 25; // overbought exhaustion
    else if (rsi >= 50 && rsi <= 65) score += 10;
    else if (rsi < 50 && rsi >= 40) score -= 10;

    if (isNearFibSupport && isSupertrendBull) score += 15;

    if (recentChangePct > 0) score += 5; else score -= 5;

    const t = this.getLangData();

    // Determine Action Signal
    let signal = t.neutral;
    let signalClass = 'text-[#87CEEB] bg-[#87CEEB]/20 border-[#87CEEB]/50';
    let direction = 'HOLD';
    let confidence = Math.min(94, Math.max(68, Math.round(Math.abs(score) * 0.45 + 55)));

    if (score >= 40) {
      signal = t.strongBuy;
      signalClass = 'text-[#00d4d4] bg-[#008080]/30 border-[#008080] shadow-[0_0_20px_rgba(0,128,128,0.4)]';
      direction = 'BUY';
    } else if (score >= 15) {
      signal = t.buy;
      signalClass = 'text-[#00d4d4] bg-[#008080]/20 border-[#008080]/60';
      direction = 'BUY';
    } else if (score <= -40) {
      signal = t.strongSell;
      signalClass = 'text-[#FFA500] bg-[#FFA500]/30 border-[#FFA500] shadow-[0_0_20px_rgba(255,165,0,0.4)]';
      direction = 'SELL';
    } else if (score <= -15) {
      signal = t.sell;
      signalClass = 'text-[#FFA500] bg-[#FFA500]/20 border-[#FFA500]/60';
      direction = 'SELL';
    }

    // Targets & Stop Loss
    let target1, target2, stopLoss;
    if (direction === 'BUY') {
      stopLoss = Number(Math.max(supportLevel * 0.995, currentPrice * 0.975).toFixed(asset.decimals));
      const risk = currentPrice - stopLoss;
      target1 = Number((currentPrice + risk * 1.6).toFixed(asset.decimals));
      target2 = Number((currentPrice + risk * 2.8).toFixed(asset.decimals));
    } else if (direction === 'SELL') {
      stopLoss = Number(Math.min(resistanceLevel * 1.005, currentPrice * 1.025).toFixed(asset.decimals));
      const risk = stopLoss - currentPrice;
      target1 = Number((currentPrice - risk * 1.6).toFixed(asset.decimals));
      target2 = Number((currentPrice - risk * 2.8).toFixed(asset.decimals));
    } else {
      target1 = Number((currentPrice * 1.02).toFixed(asset.decimals));
      target2 = Number((currentPrice * 1.04).toFixed(asset.decimals));
      stopLoss = Number((currentPrice * 0.98).toFixed(asset.decimals));
    }

    // Localized Advice
    let optionsAdvice = '';
    if (direction === 'BUY') {
      optionsAdvice = t.optionsCall(Math.round(currentPrice));
    } else if (direction === 'SELL') {
      optionsAdvice = t.optionsPut(Math.round(currentPrice * 0.98));
    } else {
      optionsAdvice = t.optionsCondor(resistanceLevel.toFixed(0));
    }

    // Localized Explanations
    let beginnerReason = '';
    if (direction === 'BUY') {
      beginnerReason = t.whyBuyBeg(asset.name, rsi);
    } else if (direction === 'SELL') {
      beginnerReason = t.whySellBeg(asset.name, rsi);
    } else {
      beginnerReason = t.whyWaitBeg(asset.name, supportLevel.toFixed(0), resistanceLevel.toFixed(0));
    }

    const stStatus = isSupertrendBull ? '<span class="text-[#00d4d4] font-bold">⚡ Supertrend BULL</span>' : '<span class="text-[#FFA500] font-bold">⚡ Supertrend BEAR</span>';
    const macdStatus = isMacdBullCross ? '<span class="text-[#00d4d4] font-bold">MACD Bull Cross</span>' : '<span class="text-[#FFA500] font-bold">MACD Bear Cross</span>';
    const proReason = `<b>Confluence:</b> ${stStatus} ($${supertrendVal.toFixed(asset.decimals)}) | ${macdStatus} (Hist: ${lastHist.toFixed(2)}) | RSI: ${rsi} | Fib 61.8% Golden: $${fibGolden618.toFixed(asset.decimals)} | S: $${supportLevel.toFixed(asset.decimals)}, R: $${resistanceLevel.toFixed(asset.decimals)}.`;

    return {
      asset,
      currentPrice,
      signal,
      signalClass,
      direction,
      confidence,
      score,
      rsi,
      isSupertrendBull,
      supertrendVal: Number(supertrendVal.toFixed(asset.decimals)),
      lastMacd: Number(lastMacd.toFixed(2)),
      lastHist: Number(lastHist.toFixed(2)),
      fibGolden618: Number(fibGolden618.toFixed(asset.decimals)),
      ema20: Number(ema20.toFixed(asset.decimals)),
      ema50: Number(ema50.toFixed(asset.decimals)),
      supportLevel: Number(supportLevel.toFixed(asset.decimals)),
      resistanceLevel: Number(resistanceLevel.toFixed(asset.decimals)),
      target1,
      target2,
      stopLoss,
      riskRewardRatio: '1 : 2.2',
      optionsAdvice,
      beginnerReason,
      proReason
    };
  }

  analyze() {
    if (!window.tradeState) return;
    const asset = window.tradeState.getAsset();
    const metrics = this.computeTechnicalMetrics(asset);
    if (!metrics) return;

    this.activeAnalysis = metrics;
    this.updateUI(metrics);
  }

  updateUI(m) {
    const badgeEl = document.getElementById('ai-signal-badge');
    const confEl = document.getElementById('ai-confidence-val');
    const confBar = document.getElementById('ai-confidence-bar');
    const assetNameEl = document.getElementById('ai-active-asset-name');
    const currentPriceEl = document.getElementById('ai-active-asset-price');

    if (badgeEl) {
      badgeEl.className = `px-4 py-2 rounded-xl font-black text-sm uppercase tracking-wider border transition-all ${m.signalClass}`;
      badgeEl.textContent = m.signal;
    }
    if (confEl) confEl.textContent = `${m.confidence}%`;
    if (confBar) {
      confBar.style.width = `${m.confidence}%`;
      confBar.className = m.direction === 'BUY' ? 'bg-[#008080] h-full transition-all duration-500' : (m.direction === 'SELL' ? 'bg-[#FFA500] h-full transition-all duration-500' : 'bg-[#87CEEB] h-full transition-all duration-500');
    }
    if (assetNameEl) assetNameEl.textContent = `${m.asset.name} (${window.tradeState.activeAsset})`;
    if (currentPriceEl) currentPriceEl.textContent = `$${m.currentPrice.toFixed(m.asset.decimals)}`;

    const target1El = document.getElementById('ai-target1-val');
    const target2El = document.getElementById('ai-target2-val');
    const stopLossEl = document.getElementById('ai-stoploss-val');
    const rrEl = document.getElementById('ai-rr-val');

    if (target1El) target1El.textContent = `$${m.target1.toLocaleString()}`;
    if (target2El) target2El.textContent = `$${m.target2.toLocaleString()}`;
    if (stopLossEl) stopLossEl.textContent = `$${m.stopLoss.toLocaleString()}`;
    if (rrEl) rrEl.textContent = m.riskRewardRatio;

    const begReasonEl = document.getElementById('ai-beginner-reason');
    const proReasonEl = document.getElementById('ai-pro-reason');
    const optionsAdviceEl = document.getElementById('ai-options-advice');

    if (begReasonEl) begReasonEl.innerHTML = m.beginnerReason;
    if (proReasonEl) proReasonEl.innerHTML = m.proReason;
    if (optionsAdviceEl) optionsAdviceEl.innerHTML = `<b>Options:</b> ${m.optionsAdvice}`;

    const execBtn = document.getElementById('ai-exec-btn');
    if (execBtn) {
      if (m.direction === 'BUY') {
        execBtn.className = 'btn-teal w-full py-3.5 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2';
        execBtn.innerHTML = `<span>🚀 Auto-Execute ${m.signal} ($1,000)</span>`;
      } else if (m.direction === 'SELL') {
        execBtn.className = 'btn-orange w-full py-3.5 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2';
        execBtn.innerHTML = `<span>📉 Auto-Execute ${m.signal} ($1,000)</span>`;
      } else {
        execBtn.className = 'btn-skyline w-full py-3.5 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2';
        execBtn.innerHTML = `<span>⏳ Market Neutral — Open Safe Straddle</span>`;
      }
    }
  }

  // Draw the AI chart with Target 1, Target 2, Stop Loss and Projection cones
  renderChart() {
    if (!this.canvas || !this.ctx || !this.activeAnalysis) return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const m = this.activeAnalysis;
    const asset = m.asset;
    const candles = asset.history || [];
    if (candles.length === 0) return;

    ctx.fillStyle = '#0b0f14';
    ctx.fillRect(0, 0, w, h);

    const padRight = 85;
    const padTop = 35;
    const padBottom = 25;
    const chartW = w - padRight;
    const chartH = h - padTop - padBottom;

    const visibleCount = Math.min(candles.length, 45);
    const visibleCandles = candles.slice(-visibleCount);

    let minPrice = Math.min(...visibleCandles.map(c => c.low), m.stopLoss);
    let maxPrice = Math.max(...visibleCandles.map(c => c.high), m.target2);

    const pricePadding = (maxPrice - minPrice) * 0.1 || 1;
    minPrice -= pricePadding;
    maxPrice += pricePadding;
    const priceRange = maxPrice - minPrice;

    const getY = (p) => padTop + chartH - ((p - minPrice) / priceRange) * chartH;
    const step = chartW / (visibleCount + 8);
    const candleWidth = Math.max(3, step * 0.7);

    // 1. Grid
    ctx.strokeStyle = 'rgba(253, 253, 253, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padTop + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartW, y);
      ctx.stroke();

      const p = maxPrice - (priceRange / 5) * i;
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p.toFixed(asset.decimals), chartW + 8, y + 4);
    }

    // 2. Candlesticks (Teal Bull, Orange Bear)
    visibleCandles.forEach((c, i) => {
      const x = i * step + step / 2;
      const isBull = c.close >= c.open;
      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);

      const color = isBull ? '#008080' : '#FFA500';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // 3. AI Projection Cone
    const lastX = (visibleCandles.length - 1) * step + step / 2;
    const projX = chartW;
    const currentY = getY(m.currentPrice);
    const t1Y = getY(m.target1);
    const slY = getY(m.stopLoss);

    ctx.fillStyle = m.direction === 'BUY' ? 'rgba(0, 128, 128, 0.14)' : 'rgba(255, 165, 0, 0.14)';
    ctx.beginPath();
    ctx.moveTo(lastX, currentY);
    ctx.lineTo(projX, t1Y);
    ctx.lineTo(projX, slY);
    ctx.closePath();
    ctx.fill();

    // 4. Target 2 Line (Teal)
    const t2Y = getY(m.target2);
    ctx.strokeStyle = '#00d4d4';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, t2Y); ctx.lineTo(chartW, t2Y);
    ctx.stroke();

    ctx.fillStyle = '#008080';
    ctx.fillRect(chartW + 2, t2Y - 9, padRight - 4, 18);
    ctx.fillStyle = '#FDFDFD';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`TP2: $${m.target2}`, chartW + padRight / 2, t2Y + 3.5);

    // 5. Target 1 Line (Teal)
    ctx.strokeStyle = '#00a8a8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, t1Y); ctx.lineTo(chartW, t1Y);
    ctx.stroke();

    ctx.fillStyle = '#00a8a8';
    ctx.fillRect(chartW + 2, t1Y - 9, padRight - 4, 18);
    ctx.fillStyle = '#FDFDFD';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`TP1: $${m.target1}`, chartW + padRight / 2, t1Y + 3.5);

    // 6. Stop Loss Line (Orange)
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, slY); ctx.lineTo(chartW, slY);
    ctx.stroke();

    ctx.fillStyle = '#FFA500';
    ctx.fillRect(chartW + 2, slY - 9, padRight - 4, 18);
    ctx.fillStyle = '#0a0d10';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`SL: $${m.stopLoss}`, chartW + padRight / 2, slY + 3.5);

    // 7. Current Price Marker (Skyline Blue)
    ctx.setLineDash([]);
    ctx.strokeStyle = '#87CEEB';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, currentY); ctx.lineTo(chartW, currentY);
    ctx.stroke();

    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(chartW + 2, currentY - 9, padRight - 4, 18);
    ctx.fillStyle = '#0a0d10';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`$${m.currentPrice.toFixed(asset.decimals)}`, chartW + padRight / 2, currentY + 3.5);

    // 8. AI Signal Arrow
    ctx.fillStyle = m.direction === 'BUY' ? '#00d4d4' : (m.direction === 'SELL' ? '#FFA500' : '#87CEEB');
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    const arrowSymbol = m.direction === 'BUY' ? `▲ ${m.signal}` : (m.direction === 'SELL' ? `▼ ${m.signal}` : `◆ ${m.signal}`);
    ctx.fillText(arrowSymbol, lastX, currentY - 14);
  }

  // Multi-Asset Radar Matrix Scanner
  updateRadarTable() {
    const tbody = document.getElementById('ai-radar-tbody');
    if (!tbody || !window.tradeState) return;

    const assets = window.tradeState.assets;
    let html = '';

    Object.keys(assets).forEach(symbol => {
      const a = assets[symbol];
      const m = this.computeTechnicalMetrics(a);
      if (!m) return;

      const isCurrent = symbol === window.tradeState.activeAsset;
      const highlight = isCurrent ? 'bg-[#008080]/15 ring-1 ring-[#008080]' : 'hover:bg-slate-800/40';

      let signalPill = '';
      if (m.direction === 'BUY') {
        signalPill = `<span class="teal-badge text-xs px-2.5 py-0.5 rounded font-bold">${m.signal}</span>`;
      } else if (m.direction === 'SELL') {
        signalPill = `<span class="orange-badge text-xs px-2.5 py-0.5 rounded font-bold">${m.signal}</span>`;
      } else {
        signalPill = `<span class="skyline-badge text-xs px-2.5 py-0.5 rounded font-bold">${m.signal}</span>`;
      }

      html += `
        <tr class="border-b border-white/5 transition font-mono text-xs cursor-pointer ${highlight}" onclick="tradeState.setAsset('${symbol}')">
          <td class="py-3 pl-3 font-bold text-[#FDFDFD]">${symbol} <span class="text-[10px] text-slate-400 font-sans block">${a.name}</span></td>
          <td class="text-[#FDFDFD] font-bold">$${a.price.toFixed(a.decimals)}</td>
          <td>${signalPill}</td>
          <td class="text-[#87CEEB] font-bold">${m.confidence}%</td>
          <td class="text-[#00d4d4] font-bold">$${m.target1}</td>
          <td class="text-[#FFA500] font-bold">$${m.stopLoss}</td>
          <td class="text-right pr-3">
            <button onclick="tradeState.setAsset('${symbol}'); aiAnalyst.executeTradeFromRadar(); event.stopPropagation();" class="px-2.5 py-1 rounded bg-[#008080]/20 hover:bg-[#008080] text-[#00d4d4] hover:text-[#FDFDFD] transition text-[11px] font-bold">
              Trade Signal
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  // Multilingual Interactive AI Chat Logic
  handleUserMessage(userText) {
    const chatContainer = document.getElementById('ai-chat-messages');
    if (!chatContainer || !this.activeAnalysis) return;

    this.appendChatBubble('user', userText);

    setTimeout(() => {
      const response = this.generateAIResponse(userText);
      this.appendChatBubble('ai', response);

      // Voice output in selected language
      if (this.autoVoiceEnabled) {
        this.speakText(response, this.currentLanguage);
      }
    }, 450);
  }

  generateAIResponse(q) {
    const m = this.activeAnalysis;
    const a = m.asset;
    const t = this.getLangData();
    const l = q.toLowerCase();

    // Universal keyword matching across languages (including Telugu, Tamil, and Hindi)
    const isBuySellQ = l.includes('buy') || l.includes('sell') || l.includes('comprar') || l.includes('vender') ||
                       l.includes('acheter') || l.includes('kaufen') || l.includes('खरीद') || l.includes('बेच') || l.includes('شراء') ||
                       l.includes('买') || l.includes('買う') || l.includes('покупать') || l.includes('al') ||
                       l.includes('కొను') || l.includes('అమ్ము') || l.includes('వాங்கு') || l.includes('விற்க');

    const isOptionQ = l.includes('option') || l.includes('call') || l.includes('put') || l.includes('opcion') ||
                      l.includes('optionen') || l.includes('ऑप्शन') || l.includes('خيارات') || l.includes('期权') ||
                      l.includes('オプション') || l.includes('opções') || l.includes('опцион') ||
                      l.includes('ఆప్షన్') || l.includes('విరుప్పం') || l.includes('விருப்ப');

    const isStopQ = l.includes('stop') || l.includes('risk') || l.includes('riesgo') || l.includes('risque') ||
                    l.includes('risiko') || l.includes('जोखिम') || l.includes('مخاطر') || l.includes('止损') ||
                    l.includes('ストップ') || l.includes('perda') || l.includes('риск') ||
                    l.includes('స్టాప్') || l.includes('రిస్క్') || l.includes('ஸ்டாப்') || l.includes('ஆபத்து');

    if (isBuySellQ) {
      return `<b>${a.name} ($${m.currentPrice.toFixed(a.decimals)})</b> — <b class="${m.direction === 'BUY' ? 'text-[#00d4d4]' : (m.direction === 'SELL' ? 'text-[#FFA500]' : 'text-[#87CEEB]')}">${m.signal}</b> (${m.confidence}%).<br><br>
      • <b>Entry:</b> $${m.currentPrice.toFixed(a.decimals)}<br>
      • <b>Take Profit (TP1):</b> $${m.target1}<br>
      • <b>Take Profit (TP2):</b> $${m.target2}<br>
      • <b>Stop Loss:</b> $${m.stopLoss}<br>
      ${m.beginnerReason}`;
    }

    if (isOptionQ) {
      return `⚡ <b>${a.name}</b> Options Analysis:<br><br>
      • <b>Strategy:</b> ${m.optionsAdvice}<br>
      • <b>Expiry Recommendation:</b> 14D - 30D`;
    }

    if (isStopQ) {
      return `🛡️ <b>${a.name}</b> Risk Level:<br><br>
      • <b>Stop-Loss:</b> $${m.stopLoss}<br>
      • <b>Risk/Reward Ratio:</b> ${m.riskRewardRatio}<br>
      • <b>Golden Rule:</b> Never risk more than 1-2% of total capital.`;
    }

    // Default response in chosen language
    return `<b>${a.name} (${window.tradeState.activeAsset})</b>: $${m.currentPrice.toFixed(a.decimals)}. <b>${m.signal}</b> (${m.confidence}%). ${m.beginnerReason}`;
  }

  appendChatBubble(sender, text) {
    const chatContainer = document.getElementById('ai-chat-messages');
    if (!chatContainer) return;

    const div = document.createElement('div');
    const isAi = sender === 'ai';
    const msgId = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    div.className = isAi ? 'flex gap-3 text-xs leading-relaxed' : 'flex gap-3 text-xs leading-relaxed justify-end';

    // Per-message Listen & Translate Buttons for AI messages
    const voiceActionBtn = isAi ? `
      <div class="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
        <button onclick="aiAnalyst.speakMessageById('${msgId}')" class="listen-btn">
          🔊 Listen
        </button>
        <div class="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span>Translate to:</span>
          <select onchange="aiAnalyst.translateMessageElement('${msgId}', this.value)" class="bg-[#121820] text-slate-300 border border-white/10 rounded px-1.5 py-0.5 text-[10px] cursor-pointer">
            <option value="">Choose...</option>
            ${Object.keys(this.languages).map(code => `<option value="${code}">${this.languages[code].flag} ${this.languages[code].name}</option>`).join('')}
          </select>
        </div>
      </div>
    ` : '';

    div.innerHTML = isAi ? `
      <div class="w-7 h-7 rounded-lg bg-[#008080] flex items-center justify-center font-bold text-white shrink-0 text-sm shadow-md">
        🤖
      </div>
      <div class="bg-[#161c24] border border-[#008080]/30 p-3 rounded-xl max-w-[85%] text-slate-200">
        <div id="${msgId}" class="message-content">${text}</div>
        ${voiceActionBtn}
      </div>
    ` : `
      <div class="bg-[#008080]/20 border border-[#008080]/50 p-3 rounded-xl max-w-[80%] text-[#FDFDFD]">
        ${text}
      </div>
      <div class="w-7 h-7 rounded-lg bg-[#121820] border border-white/20 flex items-center justify-center font-bold text-slate-300 shrink-0 text-xs">
        👤
      </div>
    `;

    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  speakMessageById(msgId) {
    const el = document.getElementById(msgId);
    if (el) {
      this.speakText(el.innerText || el.textContent, this.currentLanguage);
    }
  }

  translateMessageElement(msgId, targetLang) {
    if (!targetLang) return;
    const el = document.getElementById(msgId);
    if (!el || !this.activeAnalysis) return;

    // Generate response translated to targetLang
    const prevLang = this.currentLanguage;
    this.currentLanguage = targetLang;
    const translatedText = this.generateAIResponse('summary');
    this.currentLanguage = prevLang; // restore

    const targetFlag = this.languages[targetLang]?.flag || '🌐';
    el.innerHTML = `<span class="text-[10px] text-[#87CEEB] block mb-1">${targetFlag} Translated to ${this.languages[targetLang]?.name}:</span>` + translatedText;

    if (this.autoVoiceEnabled) {
      this.speakText(translatedText, targetLang);
    }
  }

  sendQuickPrompt(text) {
    const input = document.getElementById('ai-chat-input');
    if (input) {
      input.value = text;
      this.handleUserMessage(text);
      input.value = '';
    }
  }

  executeRecommendedTrade() {
    if (!this.activeAnalysis || !window.tradeState) return;

    const m = this.activeAnalysis;
    const direction = m.direction === 'SELL' ? 'SELL' : 'BUY';
    const t = this.getLangData();

    const res = window.tradeState.executeTrade({
      symbol: m.asset.name,
      type: direction,
      amount: 1000,
      leverage: 1,
      tp: m.target1,
      sl: m.stopLoss,
      orderMode: `AI Signal (${m.signal})`
    });

    if (res.success) {
      const toastMsg = `🤖 ${direction} ${m.asset.name} (TP: $${m.target1}, SL: $${m.stopLoss})`;
      showToast(toastMsg, 'success');
      const orderNotice = t.orderExecuted(direction, m.asset.name, m.target1, m.stopLoss);
      this.appendChatBubble('ai', orderNotice);

      if (this.autoVoiceEnabled) {
        this.speakText(orderNotice.replace(/<[^>]*>?/gm, ''), this.currentLanguage);
      }
    } else {
      showToast(res.message, 'error');
    }
  }

  executeTradeFromRadar() {
    this.executeRecommendedTrade();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.aiAnalyst = new AIAnalystEngine();
});
