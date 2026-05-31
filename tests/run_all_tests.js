const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║      光合作用模拟系统 - 完整测试套件运行                  ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const reportDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const finalReportPath = path.join(reportDir, `final_report_${timestamp}.json`);
const htmlReportPath = path.join(reportDir, `report_${timestamp}.html`);

const finalResults = {
    timestamp: new Date().toISOString(),
    tests: {}
};

console.log('📋 加载测试模块...\n');

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│  运行模型验证测试                                         │');
console.log('└─────────────────────────────────────────────────────────┘\n');

const { results: modelResults, wavelengthToEfficiency, getLightSaturationFactor, getEffectiveRate } = require('./model_validation.js');

finalResults.tests.modelValidation = {
    name: '模型验证测试',
    results: modelResults,
    passed: modelResults.filter(r => r.passed).length,
    total: modelResults.length
};

console.log('\n');
console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│  运行核心算法测试                                         │');
console.log('└─────────────────────────────────────────────────────────┘\n');

const testRunnerResults = require('./test_runner.js');
finalResults.tests.coreTests = {
    name: '核心算法测试',
    results: testRunnerResults.testResults.tests,
    passed: testRunnerResults.testResults.passed,
    total: testRunnerResults.testResults.tests.length
};

console.log('\n');
console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│  生成详细数据分析报告                                     │');
console.log('└─────────────────────────────────────────────────────────┘\n');

const lightIntensities = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const wavelengths = [400, 430, 450, 500, 550, 600, 650, 680, 700];

const analysisData = {
    lightSaturationCurve: lightIntensities.map(I => ({
        lightIntensity: I,
        rateAt680nm: getEffectiveRate(I, 680),
        rateAt430nm: getEffectiveRate(I, 430),
        rateAt550nm: getEffectiveRate(I, 550)
    })),
    wavelengthEfficiencyCurve: wavelengths.map(w => ({
        wavelength: w,
        efficiency: wavelengthToEfficiency(w)
    })),
    interactionMatrix: []
};

lightIntensities.forEach(I => {
    wavelengths.forEach(w => {
        analysisData.interactionMatrix.push({
            lightIntensity: I,
            wavelength: w,
            effectiveRate: getEffectiveRate(I, w)
        });
    });
});

console.log('✅  数据分析完成');
console.log(`   - 光饱和曲线: ${lightIntensities.length} 个数据点`);
console.log(`   - 波长效率曲线: ${wavelengths.length} 个数据点`);
console.log(`   - 交互矩阵: ${lightIntensities.length * wavelengths.length} 个组合\n`);

const overallPassed = Object.values(finalResults.tests).reduce((sum, t) => sum + t.passed, 0);
const overallTotal = Object.values(finalResults.tests).reduce((sum, t) => sum + t.total, 0);
const overallPassRate = (overallPassed / overallTotal * 100).toFixed(1);

finalResults.summary = {
    overallPassed,
    overallTotal,
    overallPassRate: parseFloat(overallPassRate)
};

finalResults.analysisData = analysisData;

console.log('📊  总体测试结果:');
console.log(`   通过: ${overallPassed}/${overallTotal}`);
console.log(`   通过率: ${overallPassRate}%`);
if (overallPassRate === '100.0') {
    console.log('   🎉  所有测试通过！');
} else if (parseFloat(overallPassRate) >= 80) {
    console.log('   ✅  大部分测试通过');
} else {
    console.log('   ⚠️   需要关注失败的测试');
}

fs.writeFileSync(finalReportPath, JSON.stringify(finalResults, null, 2));
console.log(`\n📄  JSON报告已保存: ${finalReportPath}`);

const htmlReport = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>光合作用模拟系统 - 测试报告</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
        .summary { background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; }
        .stat-box { padding: 20px; border-radius: 8px; }
        .stat-box.passed { background: #d4edda; color: #155724; }
        .stat-box.total { background: #cce5ff; color: #004085; }
        .stat-box.rate { background: #fff3cd; color: #856404; }
        .stat-value { font-size: 2.5em; font-weight: bold; }
        .test-section { background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .test-section h2 { color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .test-item { padding: 15px; margin-bottom: 10px; border-radius: 6px; display: flex; align-items: center; }
        .test-item.passed { background: #f0f9eb; border-left: 4px solid #67c23a; }
        .test-item.failed { background: #fef0f0; border-left: 4px solid #f56c6c; }
        .test-icon { font-size: 1.5em; margin-right: 15px; }
        .test-name { font-weight: 600; flex: 1; }
        .test-details { color: #666; font-size: 0.9em; }
        .timestamp { text-align: center; color: #666; margin-top: 30px; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌱 光合作用模拟系统 - 测试报告</h1>
        
        <div class="summary">
            <h2>📊 总体摘要</h2>
            <div class="summary-grid">
                <div class="stat-box passed">
                    <div class="stat-value">${overallPassed}</div>
                    <div>通过测试</div>
                </div>
                <div class="stat-box total">
                    <div class="stat-value">${overallTotal}</div>
                    <div>总测试数</div>
                </div>
                <div class="stat-box rate">
                    <div class="stat-value">${overallPassRate}%</div>
                    <div>通过率</div>
                </div>
            </div>
        </div>

        ${Object.entries(finalResults.tests).map(([key, testSet]) => `
            <div class="test-section">
                <h2>${testSet.name} <span style="font-size: 0.6em; color: #666;">(${testSet.passed}/${testSet.total})</span></h2>
                ${testSet.results.map(r => `
                    <div class="test-item ${r.passed ? 'passed' : 'failed'}">
                        <span class="test-icon">${r.passed ? '✅' : '❌'}</span>
                        <div class="test-name">${r.name}</div>
                        ${r.details ? `<div class="test-details">${r.details}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `).join('')}

        <div class="timestamp">
            生成时间: ${new Date().toLocaleString('zh-CN')}
        </div>
    </div>
</body>
</html>
`;

fs.writeFileSync(htmlReportPath, htmlReport);
console.log(`📄  HTML报告已保存: ${htmlReportPath}`);

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║                    测试运行完成！                          ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log('📋 测试文件列表:');
console.log(`   - tests/model_validation.js    模型验证测试`);
console.log(`   - tests/test_runner.js         核心算法测试`);
console.log(`   - tests/api_test.js            后端API测试`);
console.log(`   - tests/run_all_tests.js       测试运行入口`);

console.log('\n🚀 运行API测试（需要启动服务器）:');
console.log('   1. 在新终端运行: node server.js');
console.log('   2. 在当前目录运行: node tests/api_test.js');
