console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║       电子传递链状态机架构演示                              ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

import { 
    ElectronStates, 
    ComponentTypes,
    ElectronTransportStateMachine,
    ETCObservable
} from './electron_transport_sm.js';

console.log('📋 电子状态枚举:');
Object.keys(ElectronStates).forEach(key => {
    console.log(`   • ${key}: ${ElectronStates[key]}`);
});

console.log('\n📋 组件类型枚举:');
Object.keys(ComponentTypes).forEach(key => {
    console.log(`   • ${key}: ${ComponentTypes[key]}`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   演示1: 单个电子的状态机迁移');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const electronSM = new ElectronTransportStateMachine('demo-e-1', ComponentTypes.PSII);

console.log(`创建电子: ${electronSM.id}`);
console.log(`初始状态: ${electronSM.state}`);
console.log(`初始能量: ${electronSM.energy}`);

const steps = 6;
for (let i = 1; i <= steps; i++) {
    const prevState = electronSM.state;
    electronSM.proceed();
    const currentState = electronSM.state;
    console.log(`   步骤${i}: ${prevState.padEnd(15)} → ${currentState.padEnd(15)} | 能量: ${electronSM.energy.toFixed(2)}`);
    
    if (electronSM.isComplete()) {
        console.log('   ✓ 电子传递完成!');
        break;
    }
}

console.log('\n迁移历史:');
electronSM.transitionHistory.forEach((h, i) => {
    console.log(`   ${i + 1}. ${h.state} @ ${new Date(h.timestamp).toLocaleTimeString()}`);
    if (h.data && Object.keys(h.data).length > 0) {
        console.log(`      数据: ${JSON.stringify(h.data)}`);
    }
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   演示2: 使用观察者模式监听事件');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const etcObservable = new ETCObservable();

etcObservable.on('electron:created', (data) => {
    console.log(`✓ 事件: 电子创建 - ${data.electronId}, 起点: ${data.startComponent}`);
});

etcObservable.on('electron:transition', (data) => {
    console.log(`✓ 事件: 状态迁移 - ${data.electronId}: ${data.from} → ${data.to}`);
    if (data.data && Object.keys(data.data).length > 0) {
        console.log(`   附加数据: ${JSON.stringify(data.data)}`);
    }
});

etcObservable.on('electron:completed', (data) => {
    console.log(`✓ 事件: 电子完成 - ${data.electronId}`);
});

console.log('创建3个电子并模拟传递过程...\n');

for (let i = 1; i <= 3; i++) {
    const startComponent = i % 2 === 0 ? ComponentTypes.PSII : ComponentTypes.PSI;
    etcObservable.createElectron(startComponent);
}

console.log(`\n当前电子总数: ${etcObservable.getAllElectrons().length}`);

for (let step = 1; step <= 8; step++) {
    const completed = etcObservable.update();
    if (completed > 0) {
        console.log(`\n步骤${step}: ${completed}个电子完成传递`);
    }
    if (step === 3) {
        console.log(`步骤${step}: 再创建2个电子`);
        etcObservable.createElectron(ComponentTypes.PSII);
        etcObservable.createElectron(ComponentTypes.PSII);
    }
}

console.log(`剩余电子数: ${etcObservable.getAllElectrons().length}`);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   演示3: 可扩展性演示 - 监听特定事件触发');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const etcObservable2 = new ETCObservable();
let protonCount = 0;
let nadpReducedCount = 0;

etcObservable2.on('electron:transition', (data) => {
    if (data.data && data.data.pumpProton) {
        protonCount++;
        console.log(`⚡ 质子泵浦! 总数: ${protonCount}`);
    }
    if (data.data && data.data.nadpReduced) {
        nadpReducedCount++;
        console.log(`✨ NADP还原! 总数: ${nadpReducedCount}`);
    }
});

for (let i = 1; i <= 4; i++) {
    etcObservable2.createElectron(ComponentTypes.PSII);
}

for (let i = 1; i <= 10; i++) {
    etcObservable2.update();
}

console.log(`\n统计结果:`);
console.log(`   质子泵浦总数: ${protonCount}`);
console.log(`   NADP还原总数: ${nadpReducedCount}`);
console.log(`   ATP理论产量: ~${Math.floor(protonCount / 3)} 个`);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   演示4: 自定义状态回调');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const customElectron = etcObservable2.createElectron(ComponentTypes.PSII);

customElectron.onStateEnter(ElectronStates.AT_CYTO, (data) => {
    console.log(`🎯 电子到达细胞色素复合体，能量: ${data.energy.toFixed(2)}`);
    console.log(`   可以触发自定义逻辑如: 质子泵浦动画、音效、数据采集等`);
});

customElectron.onStateEnter(ElectronStates.AT_PSI, (data) => {
    console.log(`🎯 电子到达光系统I，能量: ${data.energy.toFixed(2)}`);
    console.log(`   可以触发重新激发、能量注入等扩展功能`);
});

for (let i = 1; i <= 5; i++) {
    etcObservable2.update();
}

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║                      架构优势总结                            ║');
console.log('╠═══════════════════════════════════════════════════════════╣');
console.log('║ ✓ 逻辑层与动画层完全解耦                                    ║');
console.log('║ ✓ 状态迁移驱动，无硬编码定时器                              ║');
console.log('║ ✓ 事件驱动，易于扩展新组件                                  ║');
console.log('║ ✓ 每个电子独立状态机，互不干扰                              ║');
console.log('║ ✓ 支持自定义状态回调，灵活扩展                              ║');
console.log('║ ✓ 观察者模式，多模块可同时监听                              ║');
console.log('║ ✓ 迁移历史追踪，便于调试分析                                ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('📁 架构文件说明:');
console.log('   electron_transport_sm.js   - 状态机核心逻辑层');
console.log('   etc_animator.js            - 动画渲染层');
console.log('   simulation.js              - 整合两者的主模拟');
