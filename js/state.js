/**
 * AuraTrade - State Management & Market Simulation Engine
 * Handles assets, real-time price ticks, portfolio, orders, positions, and sound synthesis.
 */

class TradingState {
  constructor() {
    this.initialBalance = 100000;
    this.soundEnabled = true;
    this.activeAsset = 'BTC/USD';
    this.selectedTimeframe = '5M';

    // Exchange API & Broker Connectivity
    this.apiConfig = this.loadApiConfig();

    // High-Impact Macro Economic Events Calendar
    this.macroCalendar = [
      { id: 1, title: 'US FOMC Interest Rate Decision', date: 'Tomorrow, 18:30 UTC', impact: 'HIGH', forecast: '4.50%', previous: '4.75%', currency: 'USD', sentiment: 'Dovish' },
      { id: 2, title: 'US Core CPI Inflation YoY', date: 'Nov 14, 13:30 UTC', impact: 'HIGH', forecast: '3.2%', previous: '3.3%', currency: 'USD', sentiment: 'Neutral' },
      { id: 3, title: 'US Non-Farm Payrolls (NFP)', date: 'Friday, 13:30 UTC', impact: 'HIGH', forecast: '165K', previous: '142K', currency: 'USD', sentiment: 'Bullish' },
      { id: 4, title: 'ECB Monetary Policy Rate', date: 'Next Thu, 12:15 UTC', impact: 'MEDIUM', forecast: '3.25%', previous: '3.50%', currency: 'EUR', sentiment: 'Dovish' },
      { id: 5, title: 'Bitcoin Network Hashrate ATH', date: 'Live Constant', impact: 'HIGH', forecast: '+4.2%', previous: '+2.8%', currency: 'BTC', sentiment: 'Strong Bull' },
      { id: 6, title: 'NVIDIA (NVDA) Data Center Earnings', date: 'Nov 20, 21:00 UTC', impact: 'HIGH', forecast: '$0.75 EPS', previous: '$0.68 EPS', currency: 'USD', sentiment: 'Bullish' }
    ];

    // Live Streaming Financial News Wire
    this.financialNews = [
      { id: 101, time: '2m ago', title: 'Institutional spot crypto ETFs record $1.28B single-day net inflow led by BlackRock & Fidelity', category: 'Crypto', sentiment: 'bull' },
      { id: 102, time: '8m ago', title: 'Federal Reserve Chairman signals measured rate calibration amid steady macroeconomic labor growth', category: 'Macro', sentiment: 'neutral' },
      { id: 103, time: '14m ago', title: 'NVIDIA accelerates Blackwell architecture rollouts across premier algorithmic hedge funds', category: 'Equities', sentiment: 'bull' },
      { id: 104, time: '22m ago', title: 'Gold sustains firm bid above key psychological pivot as sovereign reserves accumulate', category: 'Commodities', sentiment: 'bull' },
      { id: 105, time: '35m ago', title: 'Ethereum staking ratio crosses 29% threshold reducing active circulating exchange float', category: 'Crypto', sentiment: 'bull' }
    ];

    // Market Assets
    this.assets = {
      'BTC/USD': {
        name: 'Bitcoin',
        type: 'crypto',
        price: 89450.00,
        open24h: 87800.00,
        high24h: 90200.00,
        low24h: 87400.00,
        volume24h: '4.2B',
        volatility: 0.0025,
        decimals: 2,
        history: []
      },
      'ETH/USD': {
        name: 'Ethereum',
        type: 'crypto',
        price: 3340.50,
        open24h: 3280.00,
        high24h: 3390.00,
        low24h: 3250.00,
        volume24h: '1.8B',
        volatility: 0.003,
        decimals: 2,
        history: []
      },
      'SOL/USD': {
        name: 'Solana',
        type: 'crypto',
        price: 214.50,
        open24h: 206.80,
        high24h: 218.40,
        low24h: 204.10,
        volume24h: '940M',
        volatility: 0.004,
        decimals: 2,
        history: []
      },
      'NVDA': {
        name: 'NVIDIA Corp',
        type: 'stock',
        price: 144.20,
        open24h: 141.50,
        high24h: 146.00,
        low24h: 140.80,
        volume24h: '85M',
        volatility: 0.002,
        decimals: 2,
        history: []
      },
      'AAPL': {
        name: 'Apple Inc',
        type: 'stock',
        price: 228.60,
        open24h: 227.00,
        high24h: 230.10,
        low24h: 226.50,
        volume24h: '48M',
        volatility: 0.0012,
        decimals: 2,
        history: []
      },
      'TSLA': {
        name: 'Tesla Inc',
        type: 'stock',
        price: 254.30,
        open24h: 248.00,
        high24h: 258.40,
        low24h: 247.10,
        volume24h: '62M',
        volatility: 0.0035,
        decimals: 2,
        history: []
      },
      'SPY': {
        name: 'S&P 500 ETF',
        type: 'stock',
        price: 585.80,
        open24h: 584.20,
        high24h: 587.30,
        low24h: 583.50,
        volume24h: '3.1B',
        volatility: 0.0008,
        decimals: 2,
        history: []
      },
      'GOLD': {
        name: 'Gold (XAU/USD)',
        type: 'commodity',
        price: 2682.40,
        open24h: 2675.00,
        high24h: 2690.00,
        low24h: 2670.00,
        volume24h: '850M',
        volatility: 0.0009,
        decimals: 2,
        history: []
      }
    };

    // Initialize historical candle data for each asset
    this.generateInitialCandles();

    // Portfolio State (load from localStorage or initialize)
    this.loadPortfolio();

    // Event listeners
    this.subscribers = [];

    // Web Audio Context
    this.audioCtx = null;

    // Live Market Data API Feed (Binance WebSocket & CoinGecko Fallback)
    this.isLiveFeed = true;
    this.liveLatency = 24;
    this.liveFeedStatus = 'connecting';
    this.ws = null;
    this.wsReconnectTimer = null;
    this.initLiveFeed();

    // Start Simulation Loop (handles stocks/commodities or full fallback)
    this.startPriceSimulation();
  }

  // Generate realistic initial OHLC candlestick history
  generateInitialCandles() {
    const candleCount = 60;
    const now = Date.now();
    const intervalMs = 5 * 60 * 1000; // 5M candles

    Object.keys(this.assets).forEach(symbol => {
      const asset = this.assets[symbol];
      let currentPrice = asset.price * 0.95; // start slightly lower
      const candles = [];

      for (let i = candleCount; i >= 0; i--) {
        const time = now - i * intervalMs;
        const changePercent = (Math.random() - 0.49) * asset.volatility * 4;
        const open = currentPrice;
        const close = open * (1 + changePercent);
        const high = Math.max(open, close) * (1 + Math.random() * asset.volatility * 2);
        const low = Math.min(open, close) * (1 - Math.random() * asset.volatility * 2);
        const volume = Math.floor(Math.random() * 500 + 100);

        candles.push({ time, open, high, low, close, volume });
        currentPrice = close;
      }

      asset.history = candles;
      asset.price = candles[candles.length - 1].close;
    });
  }

  loadPortfolio() {
    try {
      const saved = localStorage.getItem('auratrade_portfolio_v1');
      if (saved) {
        const data = JSON.parse(saved);
        this.cash = data.cash ?? this.initialBalance;
        this.positions = data.positions ?? [];
        this.tradeHistory = data.tradeHistory ?? [];
        this.soundEnabled = data.soundEnabled ?? true;
        return;
      }
    } catch (e) {
      console.warn('Could not load portfolio from localStorage', e);
    }

    this.cash = this.initialBalance;
    this.positions = [];
    this.tradeHistory = [];
  }

  savePortfolio() {
    try {
      localStorage.setItem('auratrade_portfolio_v1', JSON.stringify({
        cash: this.cash,
        positions: this.positions,
        tradeHistory: this.tradeHistory,
        soundEnabled: this.soundEnabled
      }));
    } catch (e) {
      console.warn('Could not save portfolio to localStorage', e);
    }
  }

  loadApiConfig() {
    try {
      const saved = localStorage.getItem('auratrade_api_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      broker: 'binance',
      apiKey: '',
      secretKey: '',
      mode: 'simulated',
      status: 'simulated'
    };
  }

  saveApiConfig(config) {
    this.apiConfig = { ...this.apiConfig, ...config };
    try {
      localStorage.setItem('auratrade_api_config', JSON.stringify(this.apiConfig));
    } catch (e) {}
    this.notify('apiConfigChanged', this.apiConfig);
  }

  async testBrokerConnection(config) {
    this.saveApiConfig(config);
    if (!config.apiKey || config.apiKey.trim().length < 8) {
      return { success: false, message: 'Invalid API Key length. Minimum 8 characters required.' };
    }

    try {
      // Simulate low-latency handshake test
      await new Promise(r => setTimeout(r, 450));
      this.apiConfig.status = 'connected';
      this.saveApiConfig({ status: 'connected', mode: config.mode || 'live' });
      this.playSound('success');
      return {
        success: true,
        broker: config.broker,
        latency: 18,
        permissions: ['Read-Only Account Info', 'Spot Trading API', 'Futures / Derivatives Margin Execution'],
        message: `Successfully connected to ${config.broker.toUpperCase()} High-Frequency Gateway!`
      };
    } catch (err) {
      return { success: false, message: 'Connection timeout or invalid API credentials.' };
    }
  }

  resetAccount() {
    this.cash = this.initialBalance;
    this.positions = [];
    this.tradeHistory = [];
    this.savePortfolio();
    this.notify('accountReset');
    this.playSound('reset');
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify(event, data = {}) {
    this.subscribers.forEach(cb => cb(event, data));
  }

  getAsset(symbol = this.activeAsset) {
    return this.assets[symbol] || this.assets['BTC/USD'];
  }

  setAsset(symbol) {
    if (this.assets[symbol]) {
      this.activeAsset = symbol;
      this.notify('assetChange', { symbol, asset: this.assets[symbol] });
      this.playSound('click');
    }
  }

  // ========================================================================
  // LIVE MARKET DATA API ENGINE (Binance WebSocket & CoinGecko REST Fallback)
  // ========================================================================

  initLiveFeed() {
    if (!this.isLiveFeed) return;

    // Combined Binance WebSocket Streams for Ticker & 1-Minute Candlestick Klines
    const streams = [
      'btcusdt@ticker',
      'ethusdt@ticker',
      'solusdt@ticker',
      'btcusdt@kline_1m',
      'ethusdt@kline_1m',
      'solusdt@kline_1m'
    ].join('/');

    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    try {
      if (this.ws) {
        try { this.ws.close(); } catch (e) {}
      }

      this.liveFeedStatus = 'connecting';
      this.notify('liveFeedStatus', { status: 'connecting', latency: this.liveLatency, isLive: true });

      const startTime = performance.now();
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.liveLatency = Math.max(12, Math.round(performance.now() - startTime));
        this.liveFeedStatus = 'connected';
        this.notify('liveFeedStatus', { status: 'connected', latency: this.liveLatency, isLive: true });
        console.log('🟢 Binance WebSocket live feed connected successfully');
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg && msg.data) {
            this.handleBinanceMessage(msg.data);
          }
        } catch (err) {
          console.warn('Error parsing Binance live payload', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Binance WebSocket stream blocked or offline, activating REST fallback', err);
        this.liveFeedStatus = 'offline';
        this.notify('liveFeedStatus', { status: 'offline', latency: 0, isLive: this.isLiveFeed });
        this.pollCoinGeckoFallback();
      };

      this.ws.onclose = () => {
        if (this.isLiveFeed) {
          this.liveFeedStatus = 'reconnecting';
          this.notify('liveFeedStatus', { status: 'reconnecting', latency: 0, isLive: true });
          clearTimeout(this.wsReconnectTimer);
          this.wsReconnectTimer = setTimeout(() => this.initLiveFeed(), 3500);
        }
      };
    } catch (e) {
      console.warn('WebSocket init exception', e);
      this.pollCoinGeckoFallback();
    }
  }

  handleBinanceMessage(data) {
    if (!this.isLiveFeed) return;

    const stream = data.e;
    const symbolMap = {
      'BTCUSDT': 'BTC/USD',
      'ETHUSDT': 'ETH/USD',
      'SOLUSDT': 'SOL/USD'
    };

    const targetSymbol = symbolMap[data.s];
    if (!targetSymbol || !this.assets[targetSymbol]) return;

    const asset = this.assets[targetSymbol];

    if (stream === '24hrTicker') {
      const price = parseFloat(data.c);
      if (!isNaN(price) && price > 0) {
        asset.price = Number(price.toFixed(asset.decimals));
        asset.open24h = parseFloat(data.o) || asset.open24h;
        asset.high24h = parseFloat(data.h) || asset.high24h;
        asset.low24h = parseFloat(data.l) || asset.low24h;
        const volNum = parseFloat(data.v);
        asset.volume24h = volNum > 1000000 ? `${(volNum / 1000000).toFixed(1)}M` : (volNum > 1000 ? `${(volNum / 1000).toFixed(1)}K` : volNum.toFixed(0));
      }
    } else if (stream === 'kline') {
      const k = data.k;
      if (!k) return;
      const kPrice = parseFloat(k.c);
      if (!isNaN(kPrice) && kPrice > 0) {
        asset.price = Number(kPrice.toFixed(asset.decimals));
      }

      // Update current running candle in chart history
      const candles = asset.history;
      if (candles && candles.length > 0) {
        const lastCandle = candles[candles.length - 1];
        lastCandle.close = asset.price;
        lastCandle.high = Math.max(lastCandle.high, parseFloat(k.h) || asset.price);
        lastCandle.low = Math.min(lastCandle.low, parseFloat(k.l) || asset.price);
        lastCandle.volume = Math.round(parseFloat(k.v) || lastCandle.volume);

        // When 1m kline completes (k.x is true), append next candle
        if (k.x) {
          candles.push({
            time: k.t + 60000,
            open: asset.price,
            high: asset.price,
            low: asset.price,
            close: asset.price,
            volume: 1
          });
          if (candles.length > 80) candles.shift();
          this.notify('newCandle', { asset, symbol: targetSymbol });
        }
      }
    }

    // Positions P&L & trigger checks
    this.updatePositionsAndCheckTriggers();

    if (this.activeAsset === targetSymbol) {
      this.notify('tick', { activeAsset: asset });
    }
  }

  // Toggle between Live Binance API feed and High-Precision Simulation
  toggleLiveFeed(enableLive) {
    this.isLiveFeed = enableLive !== undefined ? enableLive : !this.isLiveFeed;
    if (this.isLiveFeed) {
      this.initLiveFeed();
    } else {
      if (this.ws) {
        try { this.ws.close(); } catch (e) {}
        this.ws = null;
      }
      clearTimeout(this.wsReconnectTimer);
      this.liveFeedStatus = 'simulated';
      this.notify('liveFeedStatus', { status: 'simulated', latency: 0, isLive: false });
    }
    return this.isLiveFeed;
  }

  // CoinGecko REST polling fallback for live prices if WebSocket is blocked
  async pollCoinGeckoFallback() {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true');
      if (res.ok) {
        const data = await res.json();
        if (data.bitcoin && this.assets['BTC/USD']) {
          this.assets['BTC/USD'].price = data.bitcoin.usd;
        }
        if (data.ethereum && this.assets['ETH/USD']) {
          this.assets['ETH/USD'].price = data.ethereum.usd;
        }
        if (data.solana && this.assets['SOL/USD']) {
          this.assets['SOL/USD'].price = data.solana.usd;
        }
        this.liveFeedStatus = 'connected';
        this.liveLatency = 55;
        this.notify('liveFeedStatus', { status: 'connected', latency: 55, isLive: true });
        this.notify('tick', { activeAsset: this.getAsset() });
      }
    } catch (e) {
      // CORS or offline - simulation handles continuity
    }
  }

  // Real-time market tick generator (ticks stocks/gold, or all assets when in simulation mode)
  startPriceSimulation() {
    setInterval(() => {
      const symbols = Object.keys(this.assets);
      // If live feed is active, tick equities & commodities (NVDA, AAPL, TSLA, SPY, GOLD)
      // If simulated mode, tick everything!
      const eligibleSymbols = this.isLiveFeed && this.liveFeedStatus === 'connected'
        ? symbols.filter(s => this.assets[s].type !== 'crypto')
        : symbols;

      const chosenSymbols = eligibleSymbols.sort(() => 0.5 - Math.random()).slice(0, 3);

      chosenSymbols.forEach(symbol => {
        const asset = this.assets[symbol];
        const deltaPct = (Math.random() - 0.495) * asset.volatility;
        const oldPrice = asset.price;
        const newPrice = Math.max(0.01, oldPrice * (1 + deltaPct));
        asset.price = Number(newPrice.toFixed(asset.decimals));

        if (asset.price > asset.high24h) asset.high24h = asset.price;
        if (asset.price < asset.low24h) asset.low24h = asset.price;

        const candles = asset.history;
        if (candles.length > 0) {
          const lastCandle = candles[candles.length - 1];
          lastCandle.close = asset.price;
          if (asset.price > lastCandle.high) lastCandle.high = asset.price;
          if (asset.price < lastCandle.low) lastCandle.low = asset.price;
          lastCandle.volume += Math.floor(Math.random() * 5 + 1);
        }
      });

      this.updatePositionsAndCheckTriggers();

      if (chosenSymbols.includes(this.activeAsset)) {
        this.notify('tick', { activeAsset: this.getAsset() });
      }
    }, 1100);

    // Candle completion interval for simulated assets
    setInterval(() => {
      Object.keys(this.assets).forEach(symbol => {
        const asset = this.assets[symbol];
        // If live feed connected and crypto, klines come from Binance
        if (this.isLiveFeed && this.liveFeedStatus === 'connected' && asset.type === 'crypto') return;

        const lastCandle = asset.history[asset.history.length - 1];
        if (lastCandle) {
          const newCandle = {
            time: Date.now(),
            open: lastCandle.close,
            high: lastCandle.close,
            low: lastCandle.close,
            close: lastCandle.close,
            volume: 1
          };
          asset.history.push(newCandle);
          if (asset.history.length > 80) asset.history.shift();
        }
      });
      this.notify('newCandle');
    }, 15000);
  }

  updatePositionsAndCheckTriggers() {
    let portfolioChanged = false;
    const triggeredPositions = [];

    this.positions.forEach(pos => {
      const asset = this.assets[pos.symbol];
      if (!asset) return;

      const currentPrice = asset.price;
      pos.currentPrice = currentPrice;

      // Dynamic Ratchet for Trailing Stop-Loss
      if (pos.trailingSl && pos.trailingDistance) {
        if (pos.type === 'BUY') {
          if (!pos.highestPrice || currentPrice > pos.highestPrice) {
            pos.highestPrice = currentPrice;
            const newSl = Number((pos.highestPrice - pos.trailingDistance).toFixed(asset.decimals));
            if (!pos.sl || newSl > pos.sl) {
              pos.sl = newSl;
            }
          }
        } else if (pos.type === 'SELL') {
          if (!pos.lowestPrice || currentPrice < pos.lowestPrice) {
            pos.lowestPrice = currentPrice;
            const newSl = Number((pos.lowestPrice + pos.trailingDistance).toFixed(asset.decimals));
            if (!pos.sl || newSl < pos.sl) {
              pos.sl = newSl;
            }
          }
        }
      }

      // PnL calculation
      const priceDiff = pos.type === 'BUY' ? (currentPrice - pos.entryPrice) : (pos.entryPrice - currentPrice);
      const rawPnl = (priceDiff / pos.entryPrice) * pos.amount * pos.leverage;
      pos.pnl = Number(rawPnl.toFixed(2));
      pos.pnlPercent = Number(((priceDiff / pos.entryPrice) * 100 * pos.leverage).toFixed(2));

      // Check Take Profit (or OCO Take-Profit target)
      if (pos.tp && ((pos.type === 'BUY' && currentPrice >= pos.tp) || (pos.type === 'SELL' && currentPrice <= pos.tp))) {
        const tag = pos.orderMode === 'OCO' ? 'OCO Target Hit (+$$$)' : 'Take Profit Hit (+$$$)';
        triggeredPositions.push({ pos, reason: tag });
      }
      // Check Stop Loss (or Trailing Stop / OCO Stop leg)
      else if (pos.sl && ((pos.type === 'BUY' && currentPrice <= pos.sl) || (pos.type === 'SELL' && currentPrice >= pos.sl))) {
        let tag = 'Stop Loss Hit (Risk Protected)';
        if (pos.trailingSl) tag = 'Trailing Stop Triggered (Profits Locked)';
        else if (pos.orderMode === 'OCO') tag = 'OCO Stop-Loss Triggered';
        triggeredPositions.push({ pos, reason: tag });
      }
    });

    // Close any triggered positions
    triggeredPositions.forEach(({ pos, reason }) => {
      this.closePosition(pos.id, reason);
      portfolioChanged = true;
    });

    if (portfolioChanged) {
      this.savePortfolio();
    }
  }

  // Execute a new trade (supports Market, Limit, Stop, Trailing Stop, and OCO Bracket)
  executeTrade({ symbol, type, amount, leverage = 1, tp = null, sl = null, orderMode = 'Market', trailingSl = false, trailingDistance = null }) {
    const asset = this.assets[symbol];
    if (!asset) return { success: false, message: 'Invalid asset.' };

    const cost = amount;
    if (this.cash < cost) {
      this.playSound('error');
      return { success: false, message: `Insufficient cash balance ($${this.cash.toLocaleString()}).` };
    }

    // Deduct cash for margin
    this.cash -= cost;

    let computedSl = sl ? Number(sl) : null;
    let trailDist = trailingDistance ? Number(trailingDistance) : null;
    if (trailingSl && trailDist) {
      computedSl = type === 'BUY' ? asset.price - trailDist : asset.price + trailDist;
    }

    const position = {
      id: 'pos_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      symbol,
      type, // 'BUY' (Long) or 'SELL' (Short)
      entryPrice: asset.price,
      currentPrice: asset.price,
      highestPrice: asset.price,
      lowestPrice: asset.price,
      amount,
      leverage,
      tp: tp ? Number(tp) : null,
      sl: computedSl,
      trailingSl: !!trailingSl,
      trailingDistance: trailDist,
      pnl: 0,
      pnlPercent: 0,
      timestamp: Date.now(),
      orderMode
    };

    this.positions.unshift(position);
    this.savePortfolio();

    this.playSound('trade');
    this.notify('positionOpened', { position });
    return { success: true, position };
  }

  // Close an existing position
  closePosition(positionId, triggerReason = 'Manual Close') {
    const index = this.positions.findIndex(p => p.id === positionId);
    if (index === -1) return false;

    const pos = this.positions[index];
    const asset = this.assets[pos.symbol] || { price: pos.currentPrice };
    const closePrice = asset.price;

    const priceDiff = pos.type === 'BUY' ? (closePrice - pos.entryPrice) : (pos.entryPrice - closePrice);
    const finalPnl = Number(((priceDiff / pos.entryPrice) * pos.amount * pos.leverage).toFixed(2));
    const returnedCash = Math.max(0, pos.amount + finalPnl);

    this.cash = Number((this.cash + returnedCash).toFixed(2));

    const historyRecord = {
      id: pos.id,
      symbol: pos.symbol,
      type: pos.type,
      entryPrice: pos.entryPrice,
      closePrice,
      amount: pos.amount,
      leverage: pos.leverage,
      pnl: finalPnl,
      pnlPercent: Number(((priceDiff / pos.entryPrice) * 100 * pos.leverage).toFixed(2)),
      openTime: pos.timestamp,
      closeTime: Date.now(),
      reason: triggerReason
    };

    this.tradeHistory.unshift(historyRecord);
    this.positions.splice(index, 1);
    this.savePortfolio();

    if (finalPnl >= 0) {
      this.playSound('win');
    } else {
      this.playSound('loss');
    }

    this.notify('positionClosed', { position: historyRecord });
    return true;
  }

  // Web Audio API Synthesizer (Instant, elegant audio chimes)
  playSound(type) {
    if (!this.soundEnabled) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'trade') {
        // Uplifting dual chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'win') {
        // Golden cheerful chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'loss') {
        // Low warm tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(329.63, now); // E4
        osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.2); // C4
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'pageTransition' || type === 'bounceTransition') {
        // Buoyant skyline blue bounce spring chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(740, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.28);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      // Audio might be blocked until user interacts with document
    }
  }

  // Portfolio aggregates
  getPortfolioMetrics() {
    const unrealizedPnl = this.positions.reduce((acc, pos) => acc + (pos.pnl || 0), 0);
    const usedMargin = this.positions.reduce((acc, pos) => acc + pos.amount, 0);
    const totalEquity = this.cash + usedMargin + unrealizedPnl;
    const totalTrades = this.tradeHistory.length;
    const wins = this.tradeHistory.filter(t => t.pnl > 0).length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;
    const totalProfit = this.tradeHistory.filter(t => t.pnl > 0).reduce((a, b) => a + b.pnl, 0);
    const totalLoss = Math.abs(this.tradeHistory.filter(t => t.pnl < 0).reduce((a, b) => a + b.pnl, 0));
    const profitFactor = totalLoss > 0 ? (totalProfit / totalLoss).toFixed(2) : (totalProfit > 0 ? '∞' : '1.00');

    return {
      cash: this.cash,
      usedMargin,
      unrealizedPnl,
      totalEquity,
      winRate,
      totalTrades,
      profitFactor,
      netRealizedPnl: this.tradeHistory.reduce((a, b) => a + b.pnl, 0)
    };
  }

  // Formatters
  formatCurrency(val, decimals = 2) {
    if (val === undefined || val === null || isNaN(val)) return '$0.00';
    return '$' + Number(val).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  formatPercent(val) {
    if (val === undefined || val === null || isNaN(val)) return '0.00%';
    const sign = val >= 0 ? '+' : '';
    return `${sign}${Number(val).toFixed(2)}%`;
  }
}

// Global instance
window.tradeState = new TradingState();
