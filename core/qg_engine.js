/**
 * QG Engine - Quantum Gratitude Protocol Core Logic
 * Implements Time Engine, RGB Transmutor, and uPoR
 */

const QG_CONFIG = {
    TIME: {
        HOURS_PER_DAY: 16,
        PARTS_PER_HOUR: 144,
        FRACTIONS_PER_PART: 13,
        INSTANTS_PER_FRACTION: 7,
        MOMENTS_PER_INSTANT: 64,
        TICKS_PER_MOMENT: 100,
        DAY_START_HOUR: 18,
    },
    LWE: {
        n: 256,
        q: 12289,
        m: 512,
        sigma: 3.2
    }
};

class QGTimeEngine {
    constructor(config = QG_CONFIG.TIME) {
        this.config = config;
        this.totalTicksInDay = BigInt(config.HOURS_PER_DAY) *
                               BigInt(config.PARTS_PER_HOUR) *
                               BigInt(config.FRACTIONS_PER_PART) *
                               BigInt(config.INSTANTS_PER_FRACTION) *
                               BigInt(config.MOMENTS_PER_INSTANT) *
                               BigInt(config.TICKS_PER_MOMENT);
        this.secondsInDay = 86400;
    }

    pad(n, len) {
        return String(n).padStart(len, '0');
    }

    getQGTime(date = new Date()) {
        const localDate = new Date(date);
        const year = localDate.getFullYear();
        const month = localDate.getMonth();
        const day = localDate.getDate();

        let dayStart = new Date(year, month, day, this.config.DAY_START_HOUR, 0, 0, 0);
        if (localDate < dayStart) {
            dayStart.setDate(dayStart.getDate() - 1);
        }

        const msSinceDayStart = localDate.getTime() - dayStart.getTime();
        const totalTicks = (BigInt(msSinceDayStart) * this.totalTicksInDay) / BigInt(this.secondsInDay * 1000);

        let remainingTicks = totalTicks;

        const ticks    = Number(remainingTicks % BigInt(this.config.TICKS_PER_MOMENT));
        remainingTicks /= BigInt(this.config.TICKS_PER_MOMENT);

        const moments  = Number(remainingTicks % BigInt(this.config.MOMENTS_PER_INSTANT));
        remainingTicks /= BigInt(this.config.MOMENTS_PER_INSTANT);

        const instants = Number(remainingTicks % BigInt(this.config.INSTANTS_PER_FRACTION));
        remainingTicks /= BigInt(this.config.INSTANTS_PER_FRACTION);

        const fractions = Number(remainingTicks % BigInt(this.config.FRACTIONS_PER_PART));
        remainingTicks /= BigInt(this.config.FRACTIONS_PER_PART);

        const parts    = Number(remainingTicks % BigInt(this.config.PARTS_PER_HOUR));
        remainingTicks /= BigInt(this.config.PARTS_PER_HOUR);

        const hours    = Number(remainingTicks % BigInt(this.config.HOURS_PER_DAY));

        // Формат: ЧЧ:ЧЧЧ:ЧЧЧ:ЧЧ:ЧЧ:ЧЧ
        // Часы(2) : Части(3) : Доли(3) : Мгновения(2) : Миги(2) : Сиги(2)
        const toString = () =>
            `${this.pad(hours,2)}:${this.pad(parts,3)}:${this.pad(fractions,3)}:${this.pad(instants,2)}:${this.pad(moments,2)}:${this.pad(ticks,2)}`;

        return { hours, parts, fractions, instants, moments, ticks, toString };
    }
}

class QGTransmutor {
    constructor() {
        this.weights = { r: 1.0, g: 1.0, b: 1.0 };
    }

    async calculateWeights(t1, t2, t3, r_val) {
        const hash = async (val) => {
            const msgBuffer = new TextEncoder().encode(val);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const sum = hashArray.slice(0, 4).reduce((acc, b) => acc + b, 0);
            return 0.5 + (sum / (255 * 4));
        };
        this.weights.r = await hash(`T1:${t1}|R:${r_val}`);
        this.weights.g = await hash(`T2:${t2}|R:${r_val}`);
        this.weights.b = await hash(`T3:${t3}|R:${r_val}`);
        return this.weights;
    }

    calculateEnergy(rgb) {
        const r16 = rgb.r * 257;
        const g16 = rgb.g * 257;
        const b16 = rgb.b * 257;
        const norm = 3 * 65535;
        const energy = (r16 * this.weights.r + g16 * this.weights.g + b16 * this.weights.b) / norm;
        return Math.min(1.0, energy);
    }
}

class uPoR {
    constructor(config = QG_CONFIG.LWE) {
        this.n = config.n;
        this.q = config.q;
        this.m = config.m;
    }

    async getMatrixA() {
        const size = this.m * this.n;
        const A = new Int32Array(size);
        for (let i = 0; i < size; i++) {
            A[i] = Math.floor(Math.random() * this.q);
        }
        return A;
    }

    async computeResonance(T, R, alpha) {
        const q = BigInt(this.q);
        const x1 = BigInt(T.hours);
        const x2 = BigInt(T.parts);
        const x3 = BigInt(T.fractions);
        const x4 = BigInt(Math.floor(R * 1000));
        const alpha1 = BigInt(Math.floor(alpha.r * 1000));
        const alpha2 = BigInt(Math.floor(alpha.g * 1000));
        const alpha3 = BigInt(Math.floor(alpha.b * 1000));
        const innerSum = (alpha1 * x1 + alpha2 * x2 + alpha3 * x3 + x4) % q;
        const omega = Number(innerSum);
        return {
            x: [Number(x1), Number(x2), Number(x3), Number(x4), omega],
            omega,
            verified: true
        };
    }

    async commit(A, r) {
        const U = new Int32Array(this.m);
        for (let i = 0; i < this.m; i++) {
            let sum = 0;
            for (let j = 0; j < this.n; j++) {
                sum = (sum + A[i * this.n + j] * r[j]) % this.q;
            }
            U[i] = sum;
        }
        return U;
    }
}

if (typeof window !== 'undefined') {
    window.QGTimeEngine = QGTimeEngine;
    window.QGTransmutor = QGTransmutor;
    window.uPoR = uPoR;
    window.QG_CONFIG = QG_CONFIG;
}

if (typeof module !== 'undefined') {
    module.exports = { QGTimeEngine, QGTransmutor, uPoR, QG_CONFIG };
}
