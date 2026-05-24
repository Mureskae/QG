/**
 * QG UI - Frontend interactions and LightHash visualization
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
        
        this.initUI();
        this.startHeartbeat();
    }

    initUI() {
        // Find or create UI containers in index.html
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
                    background: rgba(10, 9, 6, 0.95);
                    border: 1px solid var(--line);
                    padding: 2rem;
                    margin-top: 2rem;
                    color: var(--warm);
                    font-family: 'Raleway', sans-serif;
                }
                .qg-time {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 2rem;
                    color: var(--gold);
                    text-align: center;
                    margin-bottom: 1rem;
                }
                .qg-stats {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    text-align: center;
                }
                .stat-box {
                    border: 1px solid var(--line2);
                    padding: 0.5rem;
                }
                .stat-label { font-size: 10px; text-transform: uppercase; color: var(--warm3); }
                .stat-value { font-size: 1.2rem; color: var(--gold); }
                .qg-visualizer {
                    width: 100%;
                    height: 200px;
                    background: #000;
                    margin: 1rem 0;
                    position: relative;
                }
                #lighthash-canvas {
                    width: 100%;
                    height: 100%;
                }
                .qg-controls {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                }
            </style>
            <div class="qg-monitor reveal visible">
                <div class="qg-time" id="qg-clock">0.0.0.0.0.0</div>
                <div class="qg-visualizer">
                    <canvas id="lighthash-canvas"></canvas>
                </div>
                <div class="qg-stats">
                    <div class="stat-box">
                        <div class="stat-label">Energy</div>
                        <div class="stat-value" id="qg-energy">0.00</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">R-Tokens</div>
                        <div class="stat-value" id="bal-r">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">G-Tokens</div>
                        <div class="stat-value" id="bal-g">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">B-Tokens</div>
                        <div class="stat-value" id="bal-b">0</div>
                    </div>
                </div>
                <div id="resonance-debug" style="font-size: 9px; color: var(--warm3); margin-top: 1rem; font-family: monospace; text-align: center;">
                    PoR: Waiting for resonance...
                </div>
                <div class="qg-controls">
                    <button id="btn-start-stream" class="btn btn-warm">Start Screen Share</button>
                </div>
            </div>
        `;

        document.getElementById('btn-start-stream').addEventListener('click', () => this.toggleCapture());
        this.lhCanvas = document.getElementById('lighthash-canvas');
        this.lhCtx = this.lhCanvas.getContext('2d');
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
            this.stream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: false
            });
            this.video.srcObject = this.stream;
            this.video.play();
            this.isCapturing = true;
            document.getElementById('btn-start-stream').innerText = 'Stop Capture';
        } catch (err) {
            console.error("Error capturing screen:", err);
        }
    }

    stopCapture() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.isCapturing = false;
        document.getElementById('btn-start-stream').innerText = 'Start Screen Share';
    }

    startHeartbeat() {
        setInterval(() => this.update(), 64); // ~15fps for processing
    }

    async update() {
        const now = this.timeEngine.getQGTime();
        document.getElementById('qg-clock').innerText = now.toString();

        if (this.isCapturing && this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            this.processFrame(now);
        }
        
        this.drawLightHash();
    }

    async processFrame(qTime) {
        // Sample screen center for RGB
        this.canvas.width = 100;
        this.canvas.height = 100;
        this.ctx.drawImage(this.video, 
            this.video.videoWidth / 2 - 50, this.video.videoHeight / 2 - 50, 100, 100,
            0, 0, 100, 100);
        
        const frame = this.ctx.getImageData(0, 0, 100, 100);
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < frame.data.length; i += 4) {
            r += frame.data[i];
            g += frame.data[i+1];
            b += frame.data[i+2];
        }
        const pixelCount = frame.data.length / 4;
        const avgR = r / pixelCount;
        const avgG = g / pixelCount;
        const avgB = b / pixelCount;

        // Dynamic weights alpha
        const alpha = await this.transmutor.calculateWeights(qTime.hours, qTime.parts, qTime.fractions, Math.random());
        this.energy = this.transmutor.calculateEnergy({r: avgR, g: avgG, b: avgB});

        // Compute Resonance Proof
        const resonance = await this.por.computeResonance(qTime, this.energy, alpha);
        this.lastResonance = resonance;
        
        // Accumulate tokens
        this.balance.r += (avgR / 255) * this.energy;
        this.balance.g += (avgG / 255) * this.energy;
        this.balance.b += (avgB / 255) * this.energy;
        this.balance.qg += this.energy;

        // Update UI
        document.getElementById('qg-energy').innerText = this.energy.toFixed(4);
        document.getElementById('bal-r').innerText = Math.floor(this.balance.r);
        document.getElementById('bal-g').innerText = Math.floor(this.balance.g);
        document.getElementById('bal-b').innerText = Math.floor(this.balance.b);
        
        if (this.lastResonance) {
            document.getElementById('resonance-debug').innerText = `PoR [X]: ${this.lastResonance.x.join(', ')}`;
        }
    }

    drawLightHash() {
        if (!this.lhCanvas) return;
        const ctx = this.lhCtx;
        const w = this.lhCanvas.width = this.lhCanvas.offsetWidth;
        const h = this.lhCanvas.height = this.lhCanvas.offsetHeight;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        
        // Generative LightHash visualization
        const centerX = w / 2;
        const centerY = h / 2;
        const radius = Math.min(w, h) * 0.4 * (0.5 + this.energy * 0.5);
        
        // Dynamic colors based on dominant channel
        const r = this.balance.r % 255;
        const g = this.balance.g % 255;
        const b = this.balance.b % 255;

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, `rgba(${232}, ${185}, ${74}, ${0.2 + this.energy * 0.8})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some "quantum" particles
        if (this.isCapturing) {
            for(let i=0; i<10; i++) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * this.energy})`;
                const px = centerX + (Math.random() - 0.5) * radius * 2;
                const py = centerY + (Math.random() - 0.5) * radius * 2;
                ctx.fillRect(px, py, 2, 2);
            }
        }
    }
}

// Start when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.qgMonitor = new QGMoniitor();
});
