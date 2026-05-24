/**
 * QG UI - Frontend interactions and LightHash visualization
 * Fixed: stable clock display (monospace + fixed width per segment)
 */

class QGMoniitor {
    constructor() {
        this.timeEngine = new QGTimeEngine();
        this.transmutor = new QGTransmutor();
        this.por = new uPoR();

        this.stream = null;
        this.video = document.createElement('video');
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        this.isCapturing = false;
        this.energy = 0;
        this.balance = { r: 0, g: 0, b: 0, qg: 0 };
        this.lastResonance = null;

        // Распределение токенов 45% / 45% / 10%
        this.distribution = {
            holder:   { share: 0.45, label: 'Держатель (ты)', r: 0, g: 0, b: 0 },
            creator:  { share: 0.45, label: 'Автор контента', r: 0, g: 0, b: 0 },
            platform: { share: 0.10, label: 'Платформа',      r: 0, g: 0, b: 0 },
        };
        this.distributionLog = []; // хранит последние 100 записей

        this.initUI();
        this.startHeartbeat();
    }

    initUI() {
        this.container = document.querySelector('#qg-monitor-container') || this.createDefaultContainer();
        this.renderBaseLayout();
    }

    createDefaultContainer() {
        const div = document.createElement('div');
        div.id = 'qg-monitor-container';
        document.body.appendChild(div);
        return div;
    }

    renderBaseLayout() {
        this.container.innerHTML = `
        <style>
            .qg-monitor {
                background: rgba(8,7,5,0.97);
                border: 1px solid rgba(232,185,74,0.18);
                padding: 2.5rem 2rem;
                color: #faf3e3;
                font-family: 'Raleway', sans-serif;
            }

            /* Стабильные часы — каждый сегмент фиксированной ширины */
            .qg-clock-wrap {
                text-align: center;
                margin-bottom: 1.5rem;
            }
            .qg-clock-label {
                font-family: 'Arial', sans-serif;
                font-size: 10px;
                letter-spacing: 0.35em;
                text-transform: uppercase;
                color: rgba(232,185,74,0.5);
                margin-bottom: 0.6rem;
            }
            .qg-clock {
                display: inline-flex;
                align-items: center;
                gap: 0;
                font-family: 'Courier New', Courier, monospace;
                font-size: clamp(1.4rem, 4vw, 2.2rem);
                color: #e8b94a;
                letter-spacing: 0.05em;
            }
            .qg-seg {
                display: inline-block;
                text-align: center;
                /* Фиксированная ширина под каждый сегмент */
            }
            .qg-seg-2 { min-width: 2.2ch; }
            .qg-seg-3 { min-width: 3.2ch; }
            .qg-sep {
                color: rgba(232,185,74,0.35);
                padding: 0 0.15em;
                user-select: none;
            }
            .qg-clock-units {
                display: flex;
                justify-content: center;
                gap: 0;
                margin-top: 0.3rem;
            }
            .qg-unit {
                font-family: 'Arial', sans-serif;
                font-size: 9px;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                color: rgba(255,255,255,0.25);
                text-align: center;
            }
            .qg-unit-2 { min-width: 2.2ch; }
            .qg-unit-3 { min-width: 3.2ch; }
            .qg-unit-sep { min-width: 1ch; }

            .qg-visualizer {
                width: 100%;
                height: 180px;
                background: #000;
                margin: 1.5rem 0;
                position: relative;
                border: 1px solid rgba(255,255,255,0.05);
            }
            #lighthash-canvas { width: 100%; height: 100%; display: block; }

            .qg-stats {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 1px;
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.06);
                margin-bottom: 1.5rem;
            }
            .stat-box {
                background: #0a0906;
                padding: 1rem 0.5rem;
                text-align: center;
            }
            .stat-label {
                font-family: 'Arial', sans-serif;
                font-size: 10px;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: rgba(255,255,255,0.3);
                margin-bottom: 0.4rem;
            }
            .stat-value {
                font-family: 'Courier New', monospace;
                font-size: 1.3rem;
                color: #e8b94a;
            }

            .por-debug {
                font-family: 'Courier New', monospace;
                font-size: 10px;
                color: rgba(255,255,255,0.2);
                text-align: center;
                margin-bottom: 1.5rem;
                min-height: 1.2em;
            }

            .qg-controls {
                display: flex;
                justify-content: center;
            }
            .btn-capture {
                padding: 0.9rem 2.5rem;
                font-family: 'Arial', sans-serif;
                font-size: 11px;
                font-weight: 400;
                letter-spacing: 0.22em;
                text-transform: uppercase;
                background: #e8b94a;
                color: #000;
                border: 1px solid #e8b94a;
                cursor: pointer;
                transition: all 0.3s;
            }
            .btn-capture:hover { background: transparent; color: #e8b94a; }
            .btn-capture.active { background: transparent; color: #e8b94a; border-color: #e8b94a; }
        </style>

        <div class="qg-monitor">
            <div class="qg-clock-wrap">
                <div class="qg-clock-label">QG — Время присутствия</div>
                <div class="qg-clock" id="qg-clock">
                    <span class="qg-seg qg-seg-2" id="seg-h">00</span>
                    <span class="qg-sep">:</span>
                    <span class="qg-seg qg-seg-3" id="seg-p">000</span>
                    <span class="qg-sep">:</span>
                    <span class="qg-seg qg-seg-3" id="seg-f">000</span>
                    <span class="qg-sep">:</span>
                    <span class="qg-seg qg-seg-2" id="seg-i">00</span>
                    <span class="qg-sep">:</span>
                    <span class="qg-seg qg-seg-2" id="seg-m">00</span>
                    <span class="qg-sep">:</span>
                    <span class="qg-seg qg-seg-2" id="seg-t">00</span>
                </div>
                <div class="qg-clock-units">
                    <span class="qg-unit qg-unit-2">Час</span>
                    <span class="qg-unit qg-unit-sep"></span>
                    <span class="qg-unit qg-unit-3">Часть</span>
                    <span class="qg-unit qg-unit-sep"></span>
                    <span class="qg-unit qg-unit-3">Доля</span>
                    <span class="qg-unit qg-unit-sep"></span>
                    <span class="qg-unit qg-unit-2">Миг</span>
                    <span class="qg-unit qg-unit-sep"></span>
                    <span class="qg-unit qg-unit-2">Момент</span>
                    <span class="qg-unit qg-unit-sep"></span>
                    <span class="qg-unit qg-unit-2">Тик</span>
                </div>
            </div>

            <div class="qg-visualizer">
                <canvas id="lighthash-canvas"></canvas>
            </div>

            <div class="qg-stats">
                <div class="stat-box">
                    <div class="stat-label">Энергия</div>
                    <div class="stat-value" id="qg-energy">0.0000</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">R-Токены</div>
                    <div class="stat-value" id="bal-r">0</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">G-Токены</div>
                    <div class="stat-value" id="bal-g">0</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">B-Токены</div>
                    <div class="stat-value" id="bal-b">0</div>
                </div>
            </div>

            <!-- Распределение токенов -->
            <div style="margin-bottom:1.5rem">
                <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(232,185,74,0.5);margin-bottom:0.75rem;text-align:center">
                    Распределение токенов
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.06);margin-bottom:1rem">
                    <div style="background:#0a0906;padding:0.9rem 0.5rem;text-align:center">
                        <div style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:0.3rem">Держатель · 45%</div>
                        <div style="font-family:'Courier New',monospace;font-size:1rem;color:#e8b94a" id="dist-holder">0</div>
                    </div>
                    <div style="background:#0a0906;padding:0.9rem 0.5rem;text-align:center;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06)">
                        <div style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:0.3rem">Автор · 45%</div>
                        <div style="font-family:'Courier New',monospace;font-size:1rem;color:#00dd88" id="dist-creator">0</div>
                    </div>
                    <div style="background:#0a0906;padding:0.9rem 0.5rem;text-align:center">
                        <div style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:0.3rem">Платформа · 10%</div>
                        <div style="font-family:'Courier New',monospace;font-size:1rem;color:#0088ff" id="dist-platform">0</div>
                    </div>
                </div>

                <!-- Лог -->
                <div style="border:1px solid rgba(255,255,255,0.06);background:#000">
                    <div style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.2);padding:0.5rem 0.75rem;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;justify-content:space-between;align-items:center">
                        <span>QG Distribution Log</span>
                        <span id="log-count" style="color:rgba(232,185,74,0.4)">0 записей</span>
                    </div>
                    <div id="dist-log" style="height:120px;overflow-y:auto;padding:0.5rem 0.75rem;font-family:'Courier New',monospace;font-size:10px;color:rgba(255,255,255,0.25);line-height:1.8"></div>
                </div>
            </div>

            <div class="por-debug" id="resonance-debug">PoR: ожидание резонанса...</div>

            <div class="qg-controls">
                <button id="btn-start-stream" class="btn-capture">Запустить захват экрана</button>
            </div>
        </div>
        `;

        document.getElementById('btn-start-stream').addEventListener('click', () => this.toggleCapture());
        this.lhCanvas = document.getElementById('lighthash-canvas');
        this.lhCtx = this.lhCanvas.getContext('2d');
    }

    pad(n, len) { return String(n).padStart(len, '0'); }

    updateClock(t) {
        document.getElementById('seg-h').textContent = this.pad(t.hours, 2);
        document.getElementById('seg-p').textContent = this.pad(t.parts, 3);
        document.getElementById('seg-f').textContent = this.pad(t.fractions, 3);
        document.getElementById('seg-i').textContent = this.pad(t.instants, 2);
        document.getElementById('seg-m').textContent = this.pad(t.moments, 2);
        document.getElementById('seg-t').textContent = this.pad(t.ticks, 2);
    }

    async toggleCapture() {
        if (this.isCapturing) {
            this.stopCapture();
        } else {
            await this.startCapture();
        }
    }

    async startCapture() {
        try {
            this.stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
            this.video.srcObject = this.stream;
            this.video.play();
            this.isCapturing = true;
            const btn = document.getElementById('btn-start-stream');
            btn.textContent = 'Остановить захват';
            btn.classList.add('active');
        } catch (err) {
            console.error('QG capture error:', err);
        }
    }

    stopCapture() {
        if (this.stream) this.stream.getTracks().forEach(t => t.stop());
        this.isCapturing = false;
        const btn = document.getElementById('btn-start-stream');
        btn.textContent = 'Запустить захват экрана';
        btn.classList.remove('active');
    }

    startHeartbeat() {
        setInterval(() => this.update(), 64);
    }

    async update() {
        const now = this.timeEngine.getQGTime();
        this.updateClock(now);

        if (this.isCapturing && this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            await this.processFrame(now);
        }

        this.drawLightHash();
    }

    async processFrame(qTime) {
        // Sample full screen at reduced resolution for performance
        const sw = Math.min(this.video.videoWidth, 320);
        const sh = Math.min(this.video.videoHeight, 180);
        this.canvas.width = sw;
        this.canvas.height = sh;
        this.ctx.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight, 0, 0, sw, sh);

        const frame = this.ctx.getImageData(0, 0, sw, sh);
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < frame.data.length; i += 4) {
            r += frame.data[i]; g += frame.data[i+1]; b += frame.data[i+2];
        }
        const px = frame.data.length / 4;
        const avgR = r / px, avgG = g / px, avgB = b / px;

        // Seed from time only — no randomness, so R/G/B weights differ by channel
        const timeSeed = qTime.hours * 10000 + qTime.parts * 100 + qTime.fractions;
        const alpha = await this.transmutor.calculateWeights(qTime.hours, qTime.parts, qTime.fractions, timeSeed);
        this.energy = this.transmutor.calculateEnergy({ r: avgR, g: avgG, b: avgB });

        const resonance = await this.por.computeResonance(qTime, this.energy, alpha);
        this.lastResonance = resonance;

        this.balance.r += (avgR / 255) * this.energy;
        this.balance.g += (avgG / 255) * this.energy;
        this.balance.b += (avgB / 255) * this.energy;

        document.getElementById('qg-energy').textContent = this.energy.toFixed(4);
        document.getElementById('bal-r').textContent = Math.floor(this.balance.r);
        document.getElementById('bal-g').textContent = Math.floor(this.balance.g);
        document.getElementById('bal-b').textContent = Math.floor(this.balance.b);
        document.getElementById('resonance-debug').textContent =
            `PoR [Ω]: ${resonance.omega} · X: [${resonance.x.join(', ')}]`;

        // Распределение: накапливаем по долям
        const earned = { r: (avgR / 255) * this.energy, g: (avgG / 255) * this.energy, b: (avgB / 255) * this.energy };
        for (const [key, party] of Object.entries(this.distribution)) {
            party.r += earned.r * party.share;
            party.g += earned.g * party.share;
            party.b += earned.b * party.share;
        }

        // Обновляем UI распределения
        const h = this.distribution.holder, c = this.distribution.creator, p = this.distribution.platform;
        document.getElementById('dist-holder').textContent =
            `R:${Math.floor(h.r)} G:${Math.floor(h.g)} B:${Math.floor(h.b)}`;
        document.getElementById('dist-creator').textContent =
            `R:${Math.floor(c.r)} G:${Math.floor(c.g)} B:${Math.floor(c.b)}`;
        document.getElementById('dist-platform').textContent =
            `R:${Math.floor(p.r)} G:${Math.floor(p.g)} B:${Math.floor(p.b)}`;

        // Пишем в лог каждые ~3 секунды (каждые ~47 кадров при 64ms)
        this.frameCount = (this.frameCount || 0) + 1;
        if (this.frameCount % 47 === 0) {
            const t = this.timeEngine.getQGTime();
            const entry = {
                time: t.toString(),
                energy: this.energy.toFixed(4),
                holder:   { r: Math.floor(h.r), g: Math.floor(h.g), b: Math.floor(h.b) },
                creator:  { r: Math.floor(c.r), g: Math.floor(c.g), b: Math.floor(c.b) },
                platform: { r: Math.floor(p.r), g: Math.floor(p.g), b: Math.floor(p.b) },
            };
            this.distributionLog.unshift(entry); // новые сверху
            if (this.distributionLog.length > 100) this.distributionLog.pop();

            // Рендерим лог
            const logEl = document.getElementById('dist-log');
            const countEl = document.getElementById('log-count');
            countEl.textContent = `${this.distributionLog.length} записей`;
            logEl.innerHTML = this.distributionLog.map(e =>
                `<div style="border-bottom:1px solid rgba(255,255,255,0.04);padding:2px 0">` +
                `<span style="color:rgba(232,185,74,0.5)">${e.time}</span> ` +
                `<span style="color:rgba(255,255,255,0.35)">E:${e.energy}</span> ` +
                `<span style="color:#e8b94a">H[${e.holder.r},${e.holder.g},${e.holder.b}]</span> ` +
                `<span style="color:#00dd88">C[${e.creator.r},${e.creator.g},${e.creator.b}]</span> ` +
                `<span style="color:#0088ff">P[${e.platform.r},${e.platform.g},${e.platform.b}]</span>` +
                `</div>`
            ).join('');
        }
    }

    drawLightHash() {
        if (!this.lhCanvas) return;
        const ctx = this.lhCtx;
        const w = this.lhCanvas.width = this.lhCanvas.offsetWidth;
        const h = this.lhCanvas.height = this.lhCanvas.offsetHeight;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2, cy = h / 2;
        const radius = Math.min(w, h) * 0.38 * (0.4 + this.energy * 0.6);

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, `rgba(232,185,74,${0.15 + this.energy * 0.7})`);
        grad.addColorStop(0.5, `rgba(180,100,30,${0.08 + this.energy * 0.3})`);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Спектральные лучи при активном захвате
        if (this.isCapturing && this.energy > 0.01) {
            const colors = ['#ff2200','#ff7700','#ffee00','#00dd44','#0088ff','#6600ff','#cc00ff'];
            colors.forEach((c, i) => {
                const angle = (i / colors.length) * Math.PI * 2;
                const len = radius * (0.6 + this.energy * 0.8);
                ctx.strokeStyle = c;
                ctx.globalAlpha = 0.15 + this.energy * 0.4;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
                ctx.stroke();
            });
            ctx.globalAlpha = 1;

            for (let i = 0; i < 15; i++) {
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * this.energy * 0.6})`;
                ctx.fillRect(
                    cx + (Math.random() - 0.5) * radius * 2,
                    cy + (Math.random() - 0.5) * radius * 2,
                    2, 2
                );
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.qgMonitor = new QGMoniitor();
});
