const http = require('http');

console.log('========================================');
console.log('  后端API测试套件');
console.log('========================================\n');

const API_BASE = 'http://localhost:3000';

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(`${API_BASE}${path}`, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        data: JSON.parse(body)
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: body
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    const results = [];
    
    function logTest(name, passed, details = '') {
        results.push({ name, passed, details });
        const status = passed ? '\x1b[32m✓ PASS\x1b[0m' : '\x1b[31m✗ FAIL\x1b[0m';
        console.log(`${status} ${name}`);
        if (details) console.log(`   ${details}`);
    }

    console.log('1️⃣  测试GET /api/records');
    console.log('--------------------------');
    
    try {
        const res = await makeRequest('GET', '/api/records');
        logTest(
            'API返回200状态码',
            res.statusCode === 200,
            `实际状态码: ${res.statusCode}`
        );
        
        logTest(
            '返回包含success字段',
            res.data.success === true,
            `success: ${res.data.success}`
        );
        
        logTest(
            '返回包含data数组',
            Array.isArray(res.data.data),
            `data类型: ${typeof res.data.data}`
        );
        
        logTest(
            '返回包含count字段',
            typeof res.data.count === 'number',
            `count: ${res.data.count}`
        );
    } catch (e) {
        logTest('API连接失败', false, e.message);
        console.log('\n⚠️  请先启动后端服务器: npm start');
        process.exit(1);
    }

    console.log('\n2️⃣  测试POST /api/records (数据类型验证)');
    console.log('-------------------------------------------');
    
    const validRecord = {
        lightIntensity: 75,
        wavelength: 680,
        oxygenCount: 15,
        atpCount: 30,
        electronRate: 25
    };
    
    try {
        const res = await makeRequest('POST', '/api/records', validRecord);
        
        logTest(
            '有效记录保存成功',
            res.statusCode === 200 && res.data.success,
            `状态码: ${res.statusCode}, message: ${res.data.message}`
        );
        
        if (res.data.data) {
            const saved = res.data.data;
            
            logTest(
                'lightIntensity类型为Number',
                typeof saved.lightIntensity === 'number',
                `类型: ${typeof saved.lightIntensity}, 值: ${saved.lightIntensity}`
            );
            
            logTest(
                'wavelength类型为Number',
                typeof saved.wavelength === 'number',
                `类型: ${typeof saved.wavelength}, 值: ${saved.wavelength}`
            );
            
            logTest(
                'oxygenCount类型为Number',
                typeof saved.oxygenCount === 'number',
                `类型: ${typeof saved.oxygenCount}, 值: ${saved.oxygenCount}`
            );
            
            logTest(
                'atpCount类型为Number',
                typeof saved.atpCount === 'number',
                `类型: ${typeof saved.atpCount}, 值: ${saved.atpCount}`
            );
            
            logTest(
                'electronRate类型为Number',
                typeof saved.electronRate === 'number',
                `类型: ${typeof saved.electronRate}, 值: ${saved.electronRate}`
            );
            
            logTest(
                'ID为数字时间戳',
                typeof saved.id === 'number' && saved.id > 1e12,
                `ID: ${saved.id}`
            );
            
            logTest(
                '包含timestamp字段',
                typeof saved.timestamp === 'string',
                `timestamp: ${saved.timestamp}`
            );
            
            console.log(`\n   保存的记录ID: ${saved.id}`);
        }
    } catch (e) {
        logTest('POST请求失败', false, e.message);
    }

    console.log('\n3️⃣  测试边界值与约束验证');
    console.log('--------------------------');
    
    const boundaryTests = [
        { name: '光强=0', data: { lightIntensity: 0, wavelength: 680 }, shouldPass: true },
        { name: '光强=100', data: { lightIntensity: 100, wavelength: 680 }, shouldPass: true },
        { name: '波长=400(下限)', data: { lightIntensity: 50, wavelength: 400 }, shouldPass: true },
        { name: '波长=700(上限)', data: { lightIntensity: 50, wavelength: 700 }, shouldPass: true },
        { name: '零值产量', data: { lightIntensity: 50, wavelength: 680, oxygenCount: 0, atpCount: 0 }, shouldPass: true },
    ];
    
    for (const test of boundaryTests) {
        try {
            const res = await makeRequest('POST', '/api/records', test.data);
            const passed = res.statusCode === 200 && res.data.success;
            logTest(
                `边界值: ${test.name}`,
                passed === test.shouldPass,
                `光强=${test.data.lightIntensity}, 波长=${test.data.wavelength}`
            );
        } catch (e) {
            logTest(`边界值测试失败: ${test.name}`, false, e.message);
        }
    }

    console.log('\n4️⃣  测试缺失必需参数');
    console.log('----------------------');
    
    const missingParamTests = [
        { name: '缺失lightIntensity', data: { wavelength: 680 }, shouldFail: true },
        { name: '缺失wavelength', data: { lightIntensity: 50 }, shouldFail: true },
        { name: '缺失所有参数', data: {}, shouldFail: true },
    ];
    
    for (const test of missingParamTests) {
        try {
            const res = await makeRequest('POST', '/api/records', test.data);
            const shouldFail = res.statusCode === 400 || !res.data.success;
            logTest(
                `${test.name}`,
                shouldFail === test.shouldFail,
                `状态码: ${res.statusCode}, success: ${res.data.success}`
            );
        } catch (e) {
            logTest(`测试失败: ${test.name}`, false, e.message);
        }
    }

    console.log('\n5️⃣  测试GET /api/stats');
    console.log('------------------------');
    
    try {
        const res = await makeRequest('GET', '/api/stats');
        
        logTest(
            '统计API返回成功',
            res.statusCode === 200 && res.data.success,
            `状态码: ${res.statusCode}`
        );
        
        if (res.data) {
            logTest(
                '包含totalRecords字段',
                typeof res.data.totalRecords === 'number',
                `totalRecords: ${res.data.totalRecords}`
            );
            
            logTest(
                '包含avgOxygen字段',
                typeof res.data.avgOxygen === 'string' || typeof res.data.avgOxygen === 'number',
                `avgOxygen: ${res.data.avgOxygen}`
            );
            
            logTest(
                '包含avgAtp字段',
                typeof res.data.avgAtp === 'string' || typeof res.data.avgAtp === 'number',
                `avgAtp: ${res.data.avgAtp}`
            );
            
            logTest(
                '包含avgRate字段',
                typeof res.data.avgRate === 'string' || typeof res.data.avgRate === 'number',
                `avgRate: ${res.data.avgRate}`
            );
        }
    } catch (e) {
        logTest('统计API测试失败', false, e.message);
    }

    console.log('\n6️⃣  测试数据持久化');
    console.log('---------------------');
    
    try {
        const testRecord = {
            lightIntensity: 88,
            wavelength: 430,
            oxygenCount: 22,
            atpCount: 44,
            electronRate: 35
        };
        
        const postRes = await makeRequest('POST', '/api/records', testRecord);
        const getRes = await makeRequest('GET', '/api/records');
        
        if (postRes.data && postRes.data.data && postRes.data.data.id) {
            const savedId = postRes.data.data.id;
            const found = getRes.data.data.find(r => r.id === savedId);
            
            logTest(
                '保存的数据可被检索',
                found !== undefined,
                `记录ID ${savedId} ${found ? '已找到' : '未找到'}`
            );
            
            if (found) {
                logTest(
                    '数据一致性验证',
                    found.lightIntensity === testRecord.lightIntensity &&
                    found.wavelength === testRecord.wavelength &&
                    found.oxygenCount === testRecord.oxygenCount &&
                    found.atpCount === testRecord.atpCount,
                    '所有字段值匹配'
                );
            }
        }
    } catch (e) {
        logTest('数据持久化测试失败', false, e.message);
    }

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    console.log('\n========================================');
    console.log('  API测试总结');
    console.log('========================================');
    console.log(`总测试数: ${total}`);
    console.log(`通过: \x1b[32m${passed}\x1b[0m`);
    console.log(`失败: \x1b[31m${total - passed}\x1b[0m`);
    console.log(`通过率: ${((passed / total) * 100).toFixed(1)}%`);
    console.log('========================================');

    return { results, passed, total };
}

if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };