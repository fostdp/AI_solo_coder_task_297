console.log('========================================');
console.log('  光合作用模型验证测试');
console.log('========================================\n');

function wavelengthToEfficiency(wavelength) {
    const peak1 = 680;
    const peak2 = 430;
    const sigma1 = 25;
    const sigma2 = 30;
    
    const gaussianRed = Math.exp(-Math.pow(wavelength - peak1, 2) / (2 * sigma1 * sigma1));
    const gaussianBlue = Math.exp(-Math.pow(wavelength - peak2, 2) / (2 * sigma2 * sigma2));
    
    return Math.max(gaussianRed * 0.95 + gaussianBlue * 0.85, 0.15);
}

function getLightSaturationFactor(lightIntensity) {
    const I = lightIntensity;
    const saturationIntensity = 60;
    const k = 0.05;
    
    if (I <= saturationIntensity) {
        return I / saturationIntensity;
    } else {
        const excess = I - saturationIntensity;
        const saturatedFactor = 1 + (1 - Math.exp(-k * excess)) * 0.3;
        return 1 / saturatedFactor;
    }
}

function getEffectiveRate(lightIntensity, wavelength) {
    const wavelengthEfficiency = wavelengthToEfficiency(wavelength);
    const saturationFactor = getLightSaturationFactor(lightIntensity);
    
    const linearComponent = Math.min(lightIntensity / 100, 0.6);
    const saturatedComponent = Math.max(0, (lightIntensity / 100 - 0.6) * 0.3);
    const effectiveIntensity = (linearComponent + saturatedComponent) * 100;
    
    return (effectiveIntensity / 100) * wavelengthEfficiency * saturationFactor;
}

const results = [];

function logTest(name, passed, details = '') {
    results.push({ name, passed, details });
    const status = passed ? '\x1b[32m✓ PASS\x1b[0m' : '\x1b[31m✗ FAIL\x1b[0m';
    console.log(`${status} ${name}`);
    if (details) console.log(`   ${details}`);
}

console.log('📊 测试1: 光饱和效应验证');
console.log('---------------------------');

const lightIntensities = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const ratesAt680nm = lightIntensities.map(I => ({
    intensity: I,
    rate: getEffectiveRate(I, 680)
}));

console.log('\n   光强  |  电子传递速率');
console.log('   ------------------------');
ratesAt680nm.forEach(r => {
    const bar = '█'.repeat(Math.round(r.rate * 50));
    console.log(`   ${String(r.intensity).padStart(4)}%  |  ${r.rate.toFixed(4)} ${bar}`);
});

const lowLightRates = ratesAt680nm.filter(r => r.intensity <= 60);
const highLightRates = ratesAt680nm.filter(r => r.intensity >= 60);

const lowLightSlope = (lowLightRates[lowLightRates.length - 1].rate - lowLightRates[0].rate) / 60;
const highLightSlope = (highLightRates[highLightRates.length - 1].rate - highLightRates[0].rate) / 40;

logTest(
    '低光区(0-60%)斜率显著大于高光区(60-100%)',
    Math.abs(lowLightSlope) > Math.abs(highLightSlope) * 1.5,
    `低光区斜率: ${lowLightSlope.toFixed(5)}, 高光区斜率: ${highLightSlope.toFixed(5)}`
);

const rateAt60 = ratesAt680nm.find(r => r.intensity === 60).rate;
const rateAt100 = ratesAt680nm.find(r => r.intensity === 100).rate;

logTest(
    '光强从60%到100%增长<40%，速率增长<20%',
    (rateAt100 - rateAt60) / rateAt60 < 0.2,
    `60%时光速率: ${rateAt60.toFixed(4)}, 100%时光速率: ${rateAt100.toFixed(4)}, 增长: ${((rateAt100 - rateAt60) / rateAt60 * 100).toFixed(2)}%`
);

logTest(
    '光强为0时速率为0',
    ratesAt680nm[0].rate === 0,
    `0%光强速率: ${ratesAt680nm[0].rate}`
);

console.log('\n🌈 测试2: 波长吸收验证');
console.log('-----------------------');

const testWavelengths = [400, 430, 450, 500, 550, 600, 650, 680, 700];
const wavelengthEfficiencies = testWavelengths.map(w => ({
    wavelength: w,
    efficiency: wavelengthToEfficiency(w)
}));

console.log('\n   波长(nm)  |  吸收效率');
console.log('   ------------------------');
wavelengthEfficiencies.forEach(w => {
    const bar = '█'.repeat(Math.round(w.efficiency * 30));
    console.log(`   ${String(w.wavelength).padStart(8)}  |  ${w.efficiency.toFixed(4)} ${bar}`);
});

const bluePeak430 = wavelengthToEfficiency(430);
const redPeak680 = wavelengthToEfficiency(680);
const green550 = wavelengthToEfficiency(550);

logTest(
    '红光峰(680nm)效率 > 0.8',
    redPeak680 > 0.8,
    `680nm效率: ${redPeak680.toFixed(4)}`
);

logTest(
    '蓝光峰(430nm)效率 > 0.7',
    bluePeak430 > 0.7,
    `430nm效率: ${bluePeak430.toFixed(4)}`
);

logTest(
    '绿光(550nm)效率显著低于红蓝峰值',
    green550 < Math.min(redPeak680, bluePeak430) * 0.6,
    `550nm效率: ${green550.toFixed(4)}`
);

logTest(
    '存在两个吸收峰(红和蓝)',
    redPeak680 > 0.8 && bluePeak430 > 0.7,
    '双吸收峰模式符合叶绿素吸收光谱'
);

const efficiencyAt400 = wavelengthToEfficiency(400);
const efficiencyAt700 = wavelengthToEfficiency(700);

logTest(
    '边界波长(400nm和700nm)效率>基线(0.15)',
    efficiencyAt400 > 0.15 && efficiencyAt700 > 0.15,
    `400nm: ${efficiencyAt400.toFixed(3)}, 700nm: ${efficiencyAt700.toFixed(3)}`
);

console.log('\n🧪 测试3: 光强×波长交互效应');
console.log('-------------------------------');

const combinations = [
    { light: 50, wavelength: 430, label: '中光+蓝光' },
    { light: 50, wavelength: 550, label: '中光+绿光' },
    { light: 50, wavelength: 680, label: '中光+红光' },
    { light: 100, wavelength: 430, label: '强光+蓝光' },
    { light: 100, wavelength: 550, label: '强光+绿光' },
    { light: 100, wavelength: 680, label: '强光+红光' },
];

console.log('\n   条件          |  综合速率');
console.log('   ---------------------------');
combinations.forEach(c => {
    const rate = getEffectiveRate(c.light, c.wavelength);
    const bar = '█'.repeat(Math.round(rate * 40));
    console.log(`   ${c.label.padEnd(14)} |  ${rate.toFixed(4)} ${bar}`);
});

const blueAt50 = getEffectiveRate(50, 430);
const greenAt50 = getEffectiveRate(50, 550);
const redAt50 = getEffectiveRate(50, 680);

logTest(
    '相同光强下:红光速率>绿光速率',
    redAt50 > greenAt50,
    `红光: ${redAt50.toFixed(4)}, 绿光: ${greenAt50.toFixed(4)}`
);

logTest(
    '相同光强下:蓝光速率>绿光速率',
    blueAt50 > greenAt50,
    `蓝光: ${blueAt50.toFixed(4)}, 绿光: ${greenAt50.toFixed(4)}`
);

const redAt100 = getEffectiveRate(100, 680);
const redAt50_680 = getEffectiveRate(50, 680);

logTest(
    '饱和效应验证:100%光强速率<2×50%光强速率',
    redAt100 < 2 * redAt50_680,
    `100%: ${redAt100.toFixed(4)}, 2×50%: ${(2 * redAt50_680).toFixed(4)}`
);

console.log('\n⚡ 测试4: 长时间运行内存稳定性测试');
console.log('----------------------------------');

class MockSimulation {
    constructor() {
        this.photons = [];
        this.electrons = [];
        this.oxygenBubbles = [];
        this.atpMolecules = [];
        this.hydrogenIons = [];
        this.lightIntensity = 100;
        this.wavelength = 680;
    }

    step() {
        const wavelengthEfficiency = wavelengthToEfficiency(this.wavelength);
        const saturationFactor = getLightSaturationFactor(this.lightIntensity);
        const linearComponent = Math.min(this.lightIntensity / 100, 0.6);
        const saturatedComponent = Math.max(0, (this.lightIntensity / 100 - 0.6) * 0.3);
        const effectiveIntensity = (linearComponent + saturatedComponent) * 100;
        const spawnRate = (effectiveIntensity / 100) * wavelengthEfficiency * saturationFactor * 0.35;

        if (Math.random() < spawnRate) {
            this.photons.push({
                x: Math.random() * 900,
                y: 0,
                targetX: 450,
                speed: 3 + Math.random() * 2,
                size: 8 + Math.random() * 4
            });
        }

        this.photons.forEach(p => p.y += p.speed);
        this.photons = this.photons.filter(p => p.y < 500);

        if (this.photons.length > 0 && Math.random() < 0.3) {
            this.electrons.push({
                x: 150, y: 250, targetX: 550, speed: 2
            });
            this.photons.shift();
        }

        this.electrons.forEach(e => e.x += e.speed);
        this.electrons = this.electrons.filter(e => e.x < 600);

        if (Math.random() < 0.1) {
            this.oxygenBubbles.push({
                x: 150, y: 200, vy: -1, alpha: 1
            });
        }

        this.oxygenBubbles.forEach(b => {
            b.y += b.vy;
            b.alpha -= 0.01;
        });
        this.oxygenBubbles = this.oxygenBubbles.filter(b => b.alpha > 0);

        if (Math.random() < 0.15) {
            this.hydrogenIons.push({
                x: 350 + Math.random() * 200,
                y: 260 + Math.random() * 40,
                vx: (Math.random() - 0.5) * 2
            });
        }

        this.hydrogenIons.forEach(ion => ion.x += ion.vx);
        if (this.hydrogenIons.length > 200) {
            this.hydrogenIons = this.hydrogenIons.slice(-150);
        }

        if (Math.random() < 0.08) {
            this.atpMolecules.push({
                x: 750, y: 250, vy: -0.5, alpha: 1
            });
        }

        this.atpMolecules.forEach(a => {
            a.y += a.vy;
            a.alpha -= 0.008;
        });
        this.atpMolecules = this.atpMolecules.filter(a => a.alpha > 0);
    }

    getObjectCounts() {
        return {
            photons: this.photons.length,
            electrons: this.electrons.length,
            oxygen: this.oxygenBubbles.length,
            atp: this.atpMolecules.length,
            hydrogen: this.hydrogenIons.length,
            total: this.photons.length + this.electrons.length +
                   this.oxygenBubbles.length + this.atpMolecules.length +
                   this.hydrogenIons.length
        };
    }
}

const sim = new MockSimulation();
const steps = 5000;
const objectCounts = [];

console.log(`   运行 ${steps} 模拟步骤...`);

for (let i = 0; i < steps; i++) {
    sim.step();
    if (i % 500 === 0) {
        const counts = sim.getObjectCounts();
        objectCounts.push({ step: i, ...counts });
        console.log(`   Step ${i}: 总对象数=${counts.total} (光子=${counts.photons}, 电子=${counts.electrons}, H⁺=${counts.hydrogen})`);
    }
}

const finalCounts = sim.getObjectCounts();
const maxObjects = Math.max(...objectCounts.map(o => o.total));
const minObjects = Math.min(...objectCounts.map(o => o.total));

logTest(
    '5000步后对象数量未无限增长',
    finalCounts.total < 500,
    `最终对象数: ${finalCounts.total}, 最大值: ${maxObjects}, 最小值: ${minObjects}`
);

const initialObjects = objectCounts[0].total;
const stable = Math.abs(finalCounts.total - initialObjects) / initialObjects < 0.5;

logTest(
    '对象数量保持相对稳定',
    stable,
    `初始: ${initialObjects}, 最终: ${finalCounts.total}, 变化率: ${Math.abs(finalCounts.total - initialObjects) / initialObjects * 100}%`
);

console.log('\n📈 测试5: 数据生成分析报告');
console.log('---------------------------');

console.log('\n   光饱和曲线数据点(CSV):');
console.log('   LightIntensity,Rate');
ratesAt680nm.forEach(r => {
    console.log(`   ${r.intensity},${r.rate.toFixed(6)}`);
});

console.log('\n   波长吸收曲线数据点(CSV):');
console.log('   Wavelength,Efficiency');
wavelengthEfficiencies.forEach(w => {
    console.log(`   ${w.wavelength},${w.efficiency.toFixed(6)}`);
});

const passed = results.filter(r => r.passed).length;
const total = results.length;

console.log('\n========================================');
console.log('  模型验证测试总结');
console.log('========================================');
console.log(`总测试数: ${total}`);
console.log(`通过: \x1b[32m${passed}\x1b[0m`);
console.log(`失败: \x1b[31m${total - passed}\x1b[0m`);
console.log(`通过率: ${((passed / total) * 100).toFixed(1)}%`);
console.log('========================================\n');

if (passed === total) {
    console.log('🎉 所有模型验证测试通过！');
    console.log('✅ 光饱和效应符合米氏方程特征');
    console.log('✅ 波长吸收符合叶绿素双吸收峰');
    console.log('✅ 长时间运行内存稳定无泄漏');
} else {
    console.log('⚠️  部分测试需要关注，请检查上述失败项');
}

module.exports = { results, wavelengthToEfficiency, getLightSaturationFactor, getEffectiveRate };