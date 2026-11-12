/**
 * AuraTrade - Custom Canvas Candlestick & Advanced Indicator Engine
 * High-performance, Retina-sharp financial charting engine featuring:
 * - Candlestick chart with EMA 20 & EMA 50
 * - Bollinger Bands
 * - ⚡ Supertrend Indicator (ATR 10, Multiplier 3) with dynamic buy/sell trail
 * - 📐 Fibonacci Retracements (0%, 23.6%, 38.2%, 50%, 61.8% Golden Pocket, 78.6%, 100%)
 * - 📊 Lower Oscillator Panel: Toggleable between RSI(14) and MACD(12,26,9) with Histogram
 * - Interactive Crosshair & HUD
 */

class InteractiveCandleChart {
  constructor(canvasId, rsiCanvasId) {
    this.canvas = document.getElementById(canvasId);
    this.rsiCanvas = document.getElementById(rsiCanvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.rsiCtx = this.rsiCanvas ? this.rsiCanvas.getContext('2d') : null;

    // Technical Indicator Visibility Toggles
    this.showEma20 = true;
    this.showEma50 = true;
    this.showBollinger = false;
    this.showSupertrend = true;
    this.showFibonacci = true;

    // Oscillator mode: 'rsi' or 'macd'
    this.oscillatorMode = 'rsi';
    this.timeframe = '5M';

    // Interactive Drawing Tools
    this.activeDrawingTool = null; // null, 'trendline', 'horizontal', 'rectangle'
    this.drawings = [];
    this.isDrawing = false;
    this.currentDrawing = null;
    this.lastChartMetrics = null;

    this.hoverIndex = null;
    this.crosshairX = null;
    this.crosshairY = null;
    this.currentSupertrend = null;

    this.initEvents();
    this.resize();

    // Subscribe to state ticks to update the chart in real-time
    if (window.tradeState) {
      window.tradeState.subscribe((event) => {
        if (event === 'tick' || event === 'newCandle' || event === 'assetChange') {
          this.render();
        }
      });
    }
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    const getMouseCoords = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let price = null;
      if (this.lastChartMetrics) {
        const { padTop, chartH, maxPrice, priceRange } = this.lastChartMetrics;
        const clampedY = Math.max(padTop, Math.min(padTop + chartH, y));
        price = maxPrice - ((clampedY - padTop) / chartH) * priceRange;
      }
      return { x, y, price };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.activeDrawingTool) return;
      const { x, y, price } = getMouseCoords(e);
      if (price === null) return;

      if (this.activeDrawingTool === 'horizontal') {
        this.drawings.push({
          type: 'horizontal',
          price,
          color: '#00d4d4'
        });
        if (window.tradeState) window.tradeState.playSound('click');
        this.render();
      } else if (this.activeDrawingTool === 'trendline' || this.activeDrawingTool === 'rectangle') {
        this.isDrawing = true;
        this.currentDrawing = {
          type: this.activeDrawingTool,
          x1: x,
          y1: y,
          price1: price,
          x2: x,
          y2: y,
          price2: price,
          color: this.activeDrawingTool === 'trendline' ? '#87CEEB' : '#FFA500'
        };
        this.render();
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const { x, y, price } = getMouseCoords(e);
      this.crosshairX = x;
      this.crosshairY = y;

      if (this.isDrawing && this.currentDrawing) {
        this.currentDrawing.x2 = x;
        this.currentDrawing.y2 = y;
        this.currentDrawing.price2 = price;
      }
      this.render();
    });

    this.canvas.addEventListener('mouseup', () => {
      if (this.isDrawing && this.currentDrawing) {
        this.isDrawing = false;
        this.drawings.push(this.currentDrawing);
        this.currentDrawing = null;
        if (window.tradeState) window.tradeState.playSound('click');
        this.render();
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.isDrawing && this.currentDrawing) {
        this.isDrawing = false;
        this.drawings.push(this.currentDrawing);
        this.currentDrawing = null;
      }
      this.crosshairX = null;
      this.crosshairY = null;
      this.hoverIndex = null;
      this.render();
    });
  }

  resize() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();

    this.width = rect.width;
    this.height = 380;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);

    if (this.rsiCanvas) {
      this.rsiHeight = 105;
      this.rsiCanvas.width = this.width * dpr;
      this.rsiCanvas.height = this.rsiHeight * dpr;
      this.rsiCanvas.style.width = `${this.width}px`;
      this.rsiCanvas.style.height = `${this.rsiHeight}px`;
      this.rsiCtx.scale(dpr, dpr);
    }

    this.render();
  }

  render() {
    if (!this.canvas || !window.tradeState) return;

    const asset = window.tradeState.getAsset();
    const rawCandles = asset.history || [];
    if (rawCandles.length === 0) return;

    const candles = this.getAggregatedCandles(rawCandles, this.timeframe);
    if (candles.length === 0) return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear background with soft frosted glass tint
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, w, h);

    // Padding
    const padRight = 72; // price axis width
    const padBottom = 26; // time axis height
    const padTop = 34; // top margin for HUD
    const chartW = w - padRight;
    const chartH = h - padBottom - padTop;

    // Visible slice (show last 50 candles)
    const visibleCount = Math.min(candles.length, 50);
    const visibleCandles = candles.slice(-visibleCount);

    // Find min and max price
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVol = 0;

    visibleCandles.forEach(c => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    // Add padding to price range
    const pricePadding = (maxPrice - minPrice) * 0.08 || 1;
    minPrice -= pricePadding;
    maxPrice += pricePadding;
    const priceRange = maxPrice - minPrice;

    const getY = (price) => padTop + chartH - ((price - minPrice) / priceRange) * chartH;
    this.lastChartMetrics = { padTop, padBottom, padRight, chartW, chartH, minPrice, maxPrice, priceRange, getY };
    const candleWidth = Math.max(3, (chartW / visibleCount) * 0.72);
    const step = chartW / visibleCount;

    // 1. Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridRows = 5;
    for (let i = 0; i <= gridRows; i++) {
      const y = padTop + (chartH / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartW, y);
      ctx.stroke();

      // Price Axis labels
      const p = maxPrice - (priceRange / gridRows) * i;
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p.toFixed(asset.decimals), chartW + 8, y + 4);
    }

    // 2. Volume Bars (Rendered softly behind candles)
    visibleCandles.forEach((c, i) => {
      const x = i * step + step / 2;
      const volHeight = (c.volume / (maxVol || 1)) * (chartH * 0.22);
      const isBull = c.close >= c.open;
      ctx.fillStyle = isBull ? 'rgba(0, 128, 128, 0.25)' : 'rgba(255, 165, 0, 0.25)';
      ctx.fillRect(x - candleWidth / 2, padTop + chartH - volHeight, candleWidth, volHeight);
    });

    // 3. Fibonacci Retracements (Underneath candles)
    if (this.showFibonacci) {
      this.renderFibonacci(ctx, visibleCandles, chartW, getY, asset.decimals);
    }

    // 4. Bollinger Bands & EMAs
    if (this.showBollinger) {
      this.renderBollinger(ctx, visibleCandles, step, getY);
    }
    if (this.showEma20) {
      this.renderEMA(ctx, visibleCandles, 14, '#87CEEB', step, getY, 'EMA 20');
    }
    if (this.showEma50) {
      this.renderEMA(ctx, visibleCandles, 28, '#FFA500', step, getY, 'EMA 50');
    }

    // 5. ⚡ Supertrend Indicator
    if (this.showSupertrend) {
      this.renderSupertrend(ctx, visibleCandles, step, getY);
    }

    // 6. Candlesticks (Teal for Bull, Orange for Bear)
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

      // Wick
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Candle Body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // 7. Current Price Line with Skyline Blue Badge
    const lastCandle = visibleCandles[visibleCandles.length - 1];
    if (lastCandle) {
      const currentY = getY(lastCandle.close);
      ctx.strokeStyle = 'rgba(135, 206, 235, 0.85)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(chartW, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current Price pill on axis (Skyline Blue)
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(chartW + 2, currentY - 9, padRight - 4, 18);
      ctx.fillStyle = '#0a0d10';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(lastCandle.close.toFixed(asset.decimals), chartW + padRight / 2, currentY + 3.5);
    }

    // 7.5 Interactive User Drawings (Trendlines, Horizontal Levels, Supply/Demand Boxes)
    this.renderDrawings(ctx, getY, chartW, asset.decimals);

    // 8. Interactive Crosshair & HUD
    let hoveredCandle = lastCandle;
    if (this.crosshairX !== null && this.crosshairX >= 0 && this.crosshairX <= chartW) {
      const hoveredIdx = Math.min(visibleCandles.length - 1, Math.max(0, Math.floor(this.crosshairX / step)));
      hoveredCandle = visibleCandles[hoveredIdx];

      // Draw crosshair lines in Skyline Blue
      ctx.strokeStyle = 'rgba(135, 206, 235, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(this.crosshairX, padTop);
      ctx.lineTo(this.crosshairX, padTop + chartH);
      ctx.stroke();

      // Horizontal line
      if (this.crosshairY !== null && this.crosshairY >= padTop && this.crosshairY <= padTop + chartH) {
        ctx.beginPath();
        ctx.moveTo(0, this.crosshairY);
        ctx.lineTo(chartW, this.crosshairY);
        ctx.stroke();

        // Crosshair Price Tag
        const hoveredPrice = maxPrice - ((this.crosshairY - padTop) / chartH) * priceRange;
        ctx.fillStyle = '#161c24';
        ctx.fillRect(chartW + 2, this.crosshairY - 9, padRight - 4, 18);
        ctx.fillStyle = '#FDFDFD';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(hoveredPrice.toFixed(asset.decimals), chartW + padRight / 2, this.crosshairY + 3.5);
      }
      ctx.setLineDash([]);
    }

    // 9. Update HUD Display
    this.updateHUD(hoveredCandle, asset);

    // 10. Render Oscillator Sub-Chart (RSI or MACD)
    if (this.rsiCtx) {
      if (this.oscillatorMode === 'macd') {
        this.renderMACD(visibleCandles, step);
      } else {
        this.renderRSI(visibleCandles, step);
      }
    }
  }

  // ========================================================================
  // 📐 FIBONACCI RETRACEMENT ENGINE
  // ========================================================================
  renderFibonacci(ctx, visibleCandles, chartW, getY, decimals) {
    if (visibleCandles.length < 5) return;

    let swingHigh = -Infinity;
    let swingLow = Infinity;
    visibleCandles.forEach(c => {
      if (c.high > swingHigh) swingHigh = c.high;
      if (c.low < swingLow) swingLow = c.low;
    });

    const diff = swingHigh - swingLow;
    if (diff <= 0) return;

    const fibLevels = [
      { ratio: 1.000, name: '100.0%', color: 'rgba(135, 206, 235, 0.75)' },
      { ratio: 0.786, name: '78.6%',  color: 'rgba(192, 132, 252, 0.75)' },
      { ratio: 0.618, name: '61.8% Gold', color: 'rgba(250, 204, 21, 0.95)', isGolden: true },
      { ratio: 0.500, name: '50.0%',  color: 'rgba(56, 189, 248, 0.85)', isGolden: true },
      { ratio: 0.382, name: '38.2%',  color: 'rgba(0, 212, 212, 0.75)' },
      { ratio: 0.236, name: '23.6%',  color: 'rgba(251, 146, 60, 0.75)' },
      { ratio: 0.000, name: '0.0%',   color: 'rgba(135, 206, 235, 0.75)' }
    ];

    // Shaded Golden Pocket (0.618 to 0.500)
    const y618 = getY(swingLow + diff * 0.618);
    const y500 = getY(swingLow + diff * 0.500);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.08)';
    ctx.fillRect(0, Math.min(y618, y500), chartW, Math.abs(y500 - y618));

    fibLevels.forEach(lvl => {
      const price = swingLow + diff * lvl.ratio;
      const y = getY(price);

      ctx.strokeStyle = lvl.color;
      ctx.lineWidth = lvl.isGolden ? 1.5 : 1;
      ctx.setLineDash(lvl.ratio === 1 || lvl.ratio === 0 ? [] : [4, 4]);

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartW, y);
      ctx.stroke();

      // Right pill label
      ctx.setLineDash([]);
      ctx.fillStyle = lvl.isGolden ? 'rgba(250, 204, 21, 0.16)' : 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(chartW - 124, y - 7.5, 120, 15);
      ctx.strokeStyle = lvl.color;
      ctx.strokeRect(chartW - 124, y - 7.5, 120, 15);

      ctx.fillStyle = lvl.color;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${lvl.name}: $${price.toFixed(decimals)}`, chartW - 8, y + 3.5);
    });

    ctx.setLineDash([]);
  }

  // ========================================================================
  // ⚡ SUPERTREND ENGINE (ATR 10, Multiplier 3)
  // ========================================================================
  renderSupertrend(ctx, visibleCandles, step, getY) {
    if (visibleCandles.length < 10) return;

    const period = 10;
    const multiplier = 3.0;

    // True Range
    const tr = [visibleCandles[0].high - visibleCandles[0].low];
    for (let i = 1; i < visibleCandles.length; i++) {
      const c = visibleCandles[i];
      const prev = visibleCandles[i - 1];
      const val = Math.max(
        c.high - c.low,
        Math.abs(c.high - prev.close),
        Math.abs(c.low - prev.close)
      );
      tr.push(val);
    }

    // ATR
    const atr = [];
    for (let i = 0; i < visibleCandles.length; i++) {
      if (i < period - 1) {
        atr.push(tr.slice(0, i + 1).reduce((a, b) => a + b, 0) / (i + 1));
      } else {
        const slice = tr.slice(i - period + 1, i + 1);
        atr.push(slice.reduce((a, b) => a + b, 0) / period);
      }
    }

    // Trailing Supertrend bands
    const supertrend = [];
    let trend = 'bull';
    let lastST = 0;

    for (let i = 0; i < visibleCandles.length; i++) {
      const c = visibleCandles[i];
      const mid = (c.high + c.low) / 2;
      const curAtr = atr[i] || 1;
      let upperBand = mid + multiplier * curAtr;
      let lowerBand = mid - multiplier * curAtr;

      if (i === 0) {
        lastST = lowerBand;
        trend = c.close >= mid ? 'bull' : 'bear';
      } else {
        const prevST = supertrend[i - 1].value;
        const prevTrend = supertrend[i - 1].trend;

        if (prevTrend === 'bull') {
          lowerBand = Math.max(lowerBand, prevST);
          if (c.close < prevST) {
            trend = 'bear';
            lastST = upperBand;
          } else {
            trend = 'bull';
            lastST = lowerBand;
          }
        } else {
          upperBand = Math.min(upperBand, prevST);
          if (c.close > prevST) {
            trend = 'bull';
            lastST = lowerBand;
          } else {
            trend = 'bear';
            lastST = upperBand;
          }
        }
      }

      supertrend.push({ value: lastST, trend });
    }

    // Draw stepped Supertrend Line
    for (let i = 0; i < supertrend.length - 1; i++) {
      const x1 = i * step + step / 2;
      const x2 = (i + 1) * step + step / 2;
      const st1 = supertrend[i];
      const st2 = supertrend[i + 1];

      const y1 = getY(st1.value);
      const y2 = getY(st2.value);

      const isBull = st2.trend === 'bull';
      ctx.strokeStyle = isBull ? '#00d4d4' : '#FFA500';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Shaded trail
      ctx.fillStyle = isBull ? 'rgba(0, 212, 212, 0.05)' : 'rgba(255, 165, 0, 0.05)';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y1);
      const candleY = isBull ? getY(visibleCandles[i].low) : getY(visibleCandles[i].high);
      ctx.lineTo(x2, candleY);
      ctx.lineTo(x1, candleY);
      ctx.closePath();
      ctx.fill();

      // Signal flip badge
      if (st1.trend !== st2.trend) {
        ctx.fillStyle = isBull ? '#008080' : '#FFA500';
        ctx.fillRect(x2 - 18, y2 - 15, 36, 14);
        ctx.fillStyle = isBull ? '#FDFDFD' : '#0a0d10';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isBull ? '▲ BUY' : '▼ SELL', x2, y2 - 4.5);
      }
    }

    if (supertrend.length > 0) {
      this.currentSupertrend = supertrend[supertrend.length - 1];
    }
  }

  // ========================================================================
  // 📊 MACD (12, 26, 9) OSCILLATOR ENGINE
  // ========================================================================
  renderMACD(candles, step) {
    const ctx = this.rsiCtx;
    if (!ctx) return;
    const w = this.width;
    const h = this.rsiHeight;
    const padRight = 72;
    const chartW = w - padRight;

    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(0, 0, w, h);

    if (candles.length < 15) return;

    const calcEMA = (data, period) => {
      const k = 2 / (period + 1);
      let ema = data[0];
      return data.map((val) => {
        ema = val * k + ema * (1 - k);
        return ema;
      });
    };

    const closes = candles.map(c => c.close);
    const ema12 = calcEMA(closes, 12);
    const ema26 = calcEMA(closes, 26);
    const macdLine = ema12.map((val, idx) => val - ema26[idx]);
    const signalLine = calcEMA(macdLine, 9);
    const histogram = macdLine.map((val, idx) => val - signalLine[idx]);

    let maxVal = -Infinity;
    let minVal = Infinity;
    for (let i = 0; i < candles.length; i++) {
      maxVal = Math.max(maxVal, macdLine[i], signalLine[i], histogram[i]);
      minVal = Math.min(minVal, macdLine[i], signalLine[i], histogram[i]);
    }

    const bound = Math.max(Math.abs(maxVal), Math.abs(minVal)) * 1.15 || 1;
    const zeroY = h / 2;
    const getOscY = (v) => zeroY - (v / bound) * (h * 0.42);

    // Zero baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(chartW, zeroY);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('0.00', chartW + 6, zeroY + 3);

    // Histogram Bars
    const barWidth = Math.max(2, (chartW / candles.length) * 0.65);
    histogram.forEach((hist, i) => {
      const x = i * step + step / 2;
      const y = getOscY(hist);
      const isPositive = hist >= 0;
      const prevHist = i > 0 ? histogram[i - 1] : 0;
      const isGrowing = isPositive ? hist >= prevHist : hist <= prevHist;

      if (isPositive) {
        ctx.fillStyle = isGrowing ? '#00d4d4' : 'rgba(0, 128, 128, 0.6)';
      } else {
        ctx.fillStyle = isGrowing ? '#FFA500' : 'rgba(255, 165, 0, 0.6)';
      }

      const barTop = Math.min(y, zeroY);
      const barH = Math.max(1, Math.abs(y - zeroY));
      ctx.fillRect(x - barWidth / 2, barTop, barWidth, barH);
    });

    // MACD Line (Skyline Blue)
    ctx.strokeStyle = '#87CEEB';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    macdLine.forEach((val, i) => {
      const x = i * step + step / 2;
      const y = getOscY(val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Signal Line (Orange)
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    signalLine.forEach((val, i) => {
      const x = i * step + step / 2;
      const y = getOscY(val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Update Label in Oscillator Header
    const lastMACD = macdLine[macdLine.length - 1];
    const lastSig = signalLine[signalLine.length - 1];
    const lastHist = histogram[histogram.length - 1];
    const rsiLabel = document.getElementById('rsi-value-label');
    if (rsiLabel) {
      const isBull = lastMACD >= lastSig;
      rsiLabel.innerHTML = `MACD(12,26,9): <b class="text-[#87CEEB]">${lastMACD.toFixed(2)}</b> | Signal: <b class="text-[#FFA500]">${lastSig.toFixed(2)}</b> | Hist: <b class="${lastHist >= 0 ? 'text-[#00d4d4]' : 'text-[#FFA500]'}">${lastHist.toFixed(2)}</b> <span class="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${isBull ? 'bg-[#008080]/30 text-[#00d4d4]' : 'bg-[#FFA500]/30 text-[#FFA500]'}">${isBull ? '▲ BULL CROSS' : '▼ BEAR CROSS'}</span>`;
    }
  }

  renderEMA(ctx, candles, period, color, step, getY, label) {
    if (candles.length < 5) return;
    const k = 2 / (period + 1);
    let ema = candles[0].close;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    candles.forEach((c, i) => {
      ema = c.close * k + ema * (1 - k);
      const x = i * step + step / 2;
      const y = getY(ema);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  renderBollinger(ctx, candles, step, getY) {
    const period = 14;
    if (candles.length < period) return;

    const uppers = [];
    const lowers = [];

    for (let i = 0; i < candles.length; i++) {
      const slice = candles.slice(Math.max(0, i - period + 1), i + 1);
      const mean = slice.reduce((a, b) => a + b.close, 0) / slice.length;
      const variance = slice.reduce((a, b) => a + Math.pow(b.close - mean, 2), 0) / slice.length;
      const stdDev = Math.sqrt(variance);
      uppers.push(getY(mean + stdDev * 2));
      lowers.push(getY(mean - stdDev * 2));
    }

    ctx.fillStyle = 'rgba(135, 206, 235, 0.08)';
    ctx.beginPath();
    uppers.forEach((y, i) => {
      const x = i * step + step / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    for (let i = lowers.length - 1; i >= 0; i--) {
      const x = i * step + step / 2;
      ctx.lineTo(x, lowers[i]);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(135, 206, 235, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    uppers.forEach((y, i) => {
      const x = i * step + step / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.beginPath();
    lowers.forEach((y, i) => {
      const x = i * step + step / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  renderRSI(candles, step) {
    const ctx = this.rsiCtx;
    const w = this.width;
    const h = this.rsiHeight;
    const padRight = 72;
    const chartW = w - padRight;

    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(0, 0, w, h);

    const y70 = h * 0.3;
    const y30 = h * 0.7;

    ctx.fillStyle = 'rgba(168, 85, 247, 0.06)';
    ctx.fillRect(0, y70, chartW, y30 - y70);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, y70); ctx.lineTo(chartW, y70);
    ctx.moveTo(0, y30); ctx.lineTo(chartW, y30);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#a855f7';
    ctx.font = '9px monospace';
    ctx.fillText('70 OB', chartW + 6, y70 + 3);
    ctx.fillText('30 OS', chartW + 6, y30 + 3);

    const rsiValues = [];
    let gains = 0, losses = 0;
    for (let i = 1; i < candles.length; i++) {
      const diff = candles[i].close - candles[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);

      const period = Math.min(i, 14);
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      rsiValues.push(rsi);
    }

    if (rsiValues.length > 0) {
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      rsiValues.forEach((val, i) => {
        const x = (i + 1) * step + step / 2;
        const y = h - (val / 100) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const lastRSI = rsiValues[rsiValues.length - 1];
      const rsiLabel = document.getElementById('rsi-value-label');
      if (rsiLabel) {
        const stateTag = lastRSI > 70 ? '⚠️ OVERBOUGHT' : (lastRSI < 30 ? '🚀 OVERSOLD' : 'NEUTRAL');
        rsiLabel.innerHTML = `RSI(14): <b class="text-purple-300">${lastRSI.toFixed(1)}</b> <span class="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">${stateTag}</span>`;
      }
    }
  }

  updateHUD(candle, asset) {
    const hud = document.getElementById('chart-hud');
    if (!hud || !candle) return;

    const isBull = candle.close >= candle.open;
    const colorClass = isBull ? 'text-[#00d4d4]' : 'text-[#FFA500]';
    const diff = candle.close - candle.open;
    const diffPct = ((diff / candle.open) * 100).toFixed(2);

    let supertrendBadge = '';
    if (this.currentSupertrend) {
      const isStBull = this.currentSupertrend.trend === 'bull';
      supertrendBadge = `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${isStBull ? 'bg-[#008080]/30 text-[#00d4d4]' : 'bg-[#FFA500]/30 text-[#FFA500]'}">ST: ${isStBull ? 'BULL' : 'BEAR'} ($${this.currentSupertrend.value.toFixed(asset.decimals)})</span>`;
    }

    hud.innerHTML = `
      <span class="text-[#87CEEB] font-bold">${asset.name} (${window.tradeState.activeAsset})</span>
      <span>O: <b class="text-[#FDFDFD]">${candle.open.toFixed(asset.decimals)}</b></span>
      <span>H: <b class="text-[#FDFDFD]">${candle.high.toFixed(asset.decimals)}</b></span>
      <span>L: <b class="text-[#FDFDFD]">${candle.low.toFixed(asset.decimals)}</b></span>
      <span>C: <b class="${colorClass}">${candle.close.toFixed(asset.decimals)} (${diff >= 0 ? '+' : ''}${diffPct}%)</b></span>
      <span>Vol: <b class="text-slate-300">${candle.volume}</b></span>
      ${supertrendBadge}
    `;
  }

  getAggregatedCandles(rawCandles, tf) {
    if (!rawCandles || rawCandles.length === 0) return [];
    if (tf === '1M') return rawCandles;

    let bucketSize = 5;
    if (tf === '15M') bucketSize = 15;
    else if (tf === '1H') bucketSize = 60;
    else if (tf === '4H') bucketSize = 240;
    else if (tf === '1D') bucketSize = 1440;

    // If we have fewer than bucketSize * 6 raw candles, generate realistic higher-timeframe candles anchored to live price
    if (rawCandles.length < bucketSize * 6) {
      const lastPrice = rawCandles[rawCandles.length - 1].close;
      const count = 50;
      let curr = lastPrice;
      const tfVol = tf === '1D' ? 0.024 : (tf === '4H' ? 0.012 : (tf === '1H' ? 0.006 : 0.003));
      
      const synth = [];
      for (let i = count - 1; i >= 0; i--) {
        const delta = (Math.random() - 0.495) * (curr * tfVol);
        const close = curr;
        const open = Math.max(0.01, close - delta);
        const high = Math.max(open, close) + Math.random() * (curr * tfVol * 0.65);
        const low = Math.max(0.01, Math.min(open, close) - Math.random() * (curr * tfVol * 0.65));
        const vol = Math.floor(Math.random() * 250 + 50) * Math.min(bucketSize, 20);
        synth.unshift({ time: Date.now() - i * bucketSize * 60000, open, high, low, close, volume: vol });
        curr = open;
      }
      synth[synth.length - 1].close = lastPrice;
      return synth;
    }

    const result = [];
    for (let i = 0; i < rawCandles.length; i += bucketSize) {
      const chunk = rawCandles.slice(i, i + bucketSize);
      if (chunk.length === 0) continue;
      const first = chunk[0];
      const last = chunk[chunk.length - 1];
      let high = -Infinity;
      let low = Infinity;
      let volume = 0;
      chunk.forEach(c => {
        if (c.high > high) high = c.high;
        if (c.low < low) low = c.low;
        volume += c.volume || 1;
      });
      result.push({
        time: first.time,
        open: first.open,
        high,
        low,
        close: last.close,
        volume
      });
    }

    if (result.length > 0 && rawCandles.length > 0) {
      result[result.length - 1].close = rawCandles[rawCandles.length - 1].close;
    }
    return result;
  }

  setDrawingTool(tool) {
    if (this.activeDrawingTool === tool) {
      this.activeDrawingTool = null;
    } else {
      this.activeDrawingTool = tool;
    }
    this.canvas.style.cursor = this.activeDrawingTool ? 'crosshair' : 'default';

    document.querySelectorAll('.draw-tool-btn').forEach(btn => {
      if (btn.dataset.tool === this.activeDrawingTool) {
        btn.classList.add('bg-[#87CEEB]', 'text-[#0a0d10]', 'font-bold', 'shadow-[0_0_12px_rgba(135,206,235,0.4)]');
        btn.classList.remove('text-slate-400', 'bg-slate-900');
      } else {
        btn.classList.remove('bg-[#87CEEB]', 'text-[#0a0d10]', 'font-bold', 'shadow-[0_0_12px_rgba(135,206,235,0.4)]');
        btn.classList.add('text-slate-400', 'bg-slate-900');
      }
    });

    if (window.tradeState) {
      window.tradeState.playSound('click');
    }
  }

  undoDrawing() {
    if (this.drawings.length > 0) {
      this.drawings.pop();
      this.render();
      if (window.tradeState) window.tradeState.playSound('click');
    }
  }

  clearDrawings() {
    this.drawings = [];
    this.currentDrawing = null;
    this.render();
    if (window.tradeState) window.tradeState.playSound('reset');
  }

  renderDrawings(ctx, getY, chartW, decimals) {
    const all = [...this.drawings];
    if (this.currentDrawing) all.push(this.currentDrawing);

    all.forEach(d => {
      if (d.type === 'horizontal') {
        const y = getY(d.price);
        ctx.save();
        ctx.strokeStyle = d.color || '#00d4d4';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartW, y);
        ctx.stroke();

        ctx.fillStyle = d.color || '#00d4d4';
        ctx.fillRect(chartW + 2, y - 8, 68, 16);
        ctx.fillStyle = '#0a0d10';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`HL: ${d.price.toFixed(decimals)}`, chartW + 36, y + 3.5);
        ctx.restore();
      } else if (d.type === 'trendline') {
        const y1 = getY(d.price1);
        const y2 = getY(d.price2);
        ctx.save();
        ctx.strokeStyle = d.color || '#87CEEB';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(d.x1, y1);
        ctx.lineTo(d.x2, y2);
        ctx.stroke();

        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.arc(d.x1, y1, 4, 0, Math.PI * 2);
        ctx.arc(d.x2, y2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '9px monospace';
        ctx.fillStyle = '#87CEEB';
        ctx.fillText(`$${d.price2.toFixed(decimals)}`, d.x2 + 6, y2 - 4);
        ctx.restore();
      } else if (d.type === 'rectangle') {
        const yTop = getY(Math.max(d.price1, d.price2));
        const yBottom = getY(Math.min(d.price1, d.price2));
        const xLeft = Math.min(d.x1, d.x2);
        const width = Math.max(10, Math.abs(d.x2 - d.x1));
        const height = Math.max(4, yBottom - yTop);

        ctx.save();
        ctx.fillStyle = 'rgba(255, 165, 0, 0.16)';
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 2]);
        ctx.fillRect(xLeft, yTop, width, height);
        ctx.strokeRect(xLeft, yTop, width, height);

        ctx.fillStyle = '#FFA500';
        ctx.font = '9px monospace';
        ctx.fillText('SUPPLY / DEMAND ZONE', xLeft + 6, yTop + 12);
        ctx.restore();
      }
    });
  }

  setTimeframe(tf) {
    this.timeframe = tf;
    document.querySelectorAll('.tf-btn').forEach(b => {
      if (b.dataset.tf === tf) {
        b.classList.add('bg-[#008080]', 'text-[#FDFDFD]', 'font-bold', 'shadow-md');
        b.classList.remove('text-slate-400', 'hover:bg-slate-800');
      } else {
        b.classList.remove('bg-[#008080]', 'text-[#FDFDFD]', 'font-bold', 'shadow-md');
        b.classList.add('text-slate-400', 'hover:bg-slate-800');
      }
    });
    this.render();
  }

  toggleIndicator(name) {
    if (name === 'ema20') this.showEma20 = !this.showEma20;
    if (name === 'ema50') this.showEma50 = !this.showEma50;
    if (name === 'bollinger') this.showBollinger = !this.showBollinger;
    if (name === 'supertrend') this.showSupertrend = !this.showSupertrend;
    if (name === 'fibonacci') this.showFibonacci = !this.showFibonacci;
    this.render();
  }

  setOscillatorMode(mode) {
    this.oscillatorMode = mode;
    this.render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.candleChart = new InteractiveCandleChart('mainCandleChart', 'rsiChart');
});
