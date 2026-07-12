/**
 * QG Engine - Quantum Gratitude Protocol Core Logic
 * Implements Time Engine, RGB Transmutor, and uPoR
 *
 * ============================================================
 * ⚠️  SECURITY WARNING — DO NOT USE AS-IS. NOT REAL CRYPTOGRAPHY.
 * ============================================================
 * This file predates QG_Model_Spec.md and contains THREE serious
 * problems that make it unsafe to treat as a working security layer:
 *
 * 1. uPoR.commit() computes `A × r mod q` with NO noise term. Real
 *    LWE (Learning With Errors) security depends entirely on adding
 *    random noise: `A × r + e mod q`. Without noise, this is a plain
 *    linear system, solvable in seconds with ordinary linear algebra
 *    (e.g. Gaussian elimination) given a few (A, U) pairs. This
 *    provides NO post-quantum security, or any cryptographic security
 *    at all, despite being named after LWE.
 *
 * 2. getMatrixA() uses Math.random(), which is NOT a cryptographically
 *    secure random number generator — its internal state can be
 *    reconstructed from its outputs. Any real implementation must use
 *    crypto.getRandomValues() (Web Crypto API) instead.
 *
 * 3. computeResonance() always returns `verified: true`, regardless of
 *    input. No verification is actually performed. Any code that
 *    checks this flag is being told a proof succeeded when nothing was
 *    checked.
 *
 * Additionally:
 * - The time hierarchy here (144/13/7/64/100) does not match the one
 *   documented in TEMPORAL-DYNAMICS.md (144/1296/72/760/160/14000) —
 *   these have diverged and need reconciling.
 * - getQGTime() uses `new Date()` — ordinary system/Unix time — not the
 *   Cs-133 physical tick count defined in QG_Model_Spec.md §2.1.
 *
 * Do not deploy this file, and do not treat `verified: true` as a real
 * security guarantee anywhere it is used. See `qg_model.py` /
 * `qgmath/qgmath.go` for the current, tested (non-cryptographic) core
 * math — neither of those implements real LWE either; that part of the
 * system remains genuinely unbuilt, not just undocumented.
 * ============================================================
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
        // NOTE: this uses ordinary system time (Date), not the Cs-133
        // tick count from QG_Model_Spec.md §2.1. See file header.
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
    // ⚠️ NOT REAL LWE — see file header. No noise term, insecure RNG,
    // and computeResonance() always reports verified: true.
    constructor(config = QG_CONFIG.LWE) {
        this.n = config.n;
        this.q = config.q;
        this.m = config.m;
    }

    async getMatrixA() {
        // ⚠️ Math.random() is NOT cryptographically secure. See file header.
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
            // ⚠️ Always true — no verification is actually performed.
            // See file header. Do not treat this as a real proof result.
            verified: true
        };
    }

    async commit(A, r) {
        // ⚠️ No noise term added — this is A×r mod q, not LWE.
        // See file header for why this provides no cryptographic security.
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
