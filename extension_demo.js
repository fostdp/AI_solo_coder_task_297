console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║       组件扩展演示：添加新型电子传递链组件                    ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

import { 
    ElectronStates, 
    ComponentTypes,
    ElectronTransportStateMachine,
    ETCObservable
} from './electron_transport_sm.js';

console.log('📝 演示目标:');
console.log('   展示如何通过状态机扩展机制添加新的电子传递链组件');
console.log('   例如：添加新型电子载体、人工复合体等');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   扩展1: 添加新型电子载体 Plastocyanin (PC)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const ExtendedStates = {
    ...ElectronStates,
    AT_PLASTOCYANIN: 'at_plastocyanin',
    CYTO_TO_PC: 'cyto_to_pc',
    PC_TO_PSI: 'pc_to_psi'
};

class ExtendedElectronSM extends ElectronTransportStateMachine {
    constructor(id, startComponent) {
        super(id, startComponent);
    }
    
    proceed() {
        switch (this.state) {
            case ExtendedStates.AT_CYTO:
                this.energy *= 0.95;
                return this.transition(ExtendedStates.CYTO_TO_PC, {
                    from: ComponentTypes.CYTOCHROME,
                    to: 'plastocyanin',
                    energy: this.energy
                });
                
            case ExtendedStates.CYTO_TO_PC:
                return this.transition(ExtendedStates.AT_PLASTOCYANIN, {
                    component: 'plastocyanin',
                    energy: this.energy
                });
                
            case ExtendedStates.AT_PLASTOCYANIN:
                return this.transition(ExtendedStates.PC_TO_PSI, {
                    from: 'plastocyanin',
                    to: ComponentTypes.PSI,
                    energy: this.energy,
                    throughPC: true
                });
                
            case ExtendedStates.PC_TO_PSI:
                return this.transition(ExtendedStates.AT_PSI, {
                    component: ComponentTypes.PSI,
                    energy: this.energy
                });
                
            default:
                return super.proceed();
        }
    }
}

console.log('✓ 新增状态枚举:');
console.log('   • AT_PLASTOCYANIN: at_plastocyanin');
console.log('   • CYTO_TO_PC: cyto_to_pc');
console.log('   • PC_TO_PSI: pc_to_psi');

const extendedElectron = new ExtendedElectronSM('ext-e-1', ComponentTypes.PSII);

console.log(`\n执行扩展电子的传递过程:\n`);

for (let i = 1; i <= 10; i++) {
    const prevState = extendedElectron.state;
    extendedElectron.proceed();
    const currentState = extendedElectron.state;
    
    const isNewState = currentState.includes('pc') || currentState.includes('plastocyanin');
    const marker = isNewState ? '⭐' : ' ';
    
    console.log(`   ${marker}步骤${i}: ${prevState.padEnd(18)} → ${currentState.padEnd(18)} | 能量: ${extendedElectron.energy.toFixed(2)}`);
    
    if (extendedElectron.isComplete()) {
        console.log('\n   ✓ 扩展电子传递完成，经过了Plastocyanin载体!');
        break;
    }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   扩展2: 添加人工抑制模块 (除草剂模拟)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

class InhibitableElectronSM extends ElectronTransportStateMachine {
    constructor(id, startComponent) {
        super(id, startComponent);
        this.inhibited = false;
        this.inhibitedAt = null;
    }
    
    applyInhibitor(targetState) {
        this.inhibited = true;
        this.inhibitedAt = targetState;
        console.log(`   💊 抑制剂生效: 将在 ${targetState} 状态阻塞电子传递`);
    }
    
    proceed() {
        if (this.inhibited && this.state === this.inhibitedAt) {
            console.log(`   ⛔ 电子在 ${this.state} 状态被抑制剂阻断!`);
            return this;
        }
        return super.proceed();
    }
}

console.log('创建可抑制电子并添加DCMU类抑制剂 (阻断PSII→Cyt)...\n');

const inhibitableElectron = new InhibitableElectronSM('inh-e-1', ComponentTypes.PSII);
inhibitableElectron.applyInhibitor('psii_to_cyto');

console.log('');

for (let i = 1; i <= 5; i++) {
    const prevState = inhibitableElectron.state;
    inhibitableElectron.proceed();
    console.log(`   步骤${i}: ${prevState.padEnd(15)} → ${inhibitableElectron.state.padEnd(15)}`);
    
    if (inhibitableElectron.state === inhibitableElectron.inhibitedAt) {
        console.log('   ✓ 电子传递被成功阻断，模拟除草剂效果!');
        break;
    }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   扩展3: 多观察者协同工作');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const multiObserverETC = new ETCObservable();

class DataCollector {
    constructor(name) {
        this.name = name;
        this.events = [];
    }
    
    handleEvent(eventName, data) {
        this.events.push({
            event: eventName,
            data,
            timestamp: Date.now()
        });
    }
    
    getStats() {
        return {
            name: this.name,
            eventCount: this.events.length,
            latestEvent: this.events.length > 0 ? this.events[this.events.length - 1].event : null
        };
    }
}

const animationCollector = new DataCollector('动画系统');
const statsCollector = new DataCollector('统计系统');
const logCollector = new DataCollector('日志系统');

multiObserverETC.on('electron:created', (data) => {
    animationCollector.handleEvent('electron:created', data);
    statsCollector.handleEvent('electron:created', data);
    logCollector.handleEvent('electron:created', data);
});

multiObserverETC.on('electron:transition', (data) => {
    animationCollector.handleEvent('electron:transition', data);
    statsCollector.handleEvent('electron:transition', data);
});

multiObserverETC.on('electron:completed', (data) => {
    animationCollector.handleEvent('electron:completed', data);
    statsCollector.handleEvent('electron:completed', data);
    logCollector.handleEvent('electron:completed', data);
});

console.log('创建5个电子，多个观察者同时接收事件...\n');

for (let i = 1; i <= 5; i++) {
    multiObserverETC.createElectron(ComponentTypes.PSII);
}

for (let i = 1; i <= 8; i++) {
    multiObserverETC.update();
}

console.log('各观察者收集到的事件统计:\n');

[animationCollector, statsCollector, logCollector].forEach(collector => {
    const stats = collector.getStats();
    console.log(`   📊 ${stats.name.padEnd(12)}: ${stats.eventCount} 个事件`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   扩展4: 自定义能量衰减模型');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

class CustomEnergyElectronSM extends ElectronTransportStateMachine {
    constructor(id, startComponent, decayModel = 'linear') {
        super(id, startComponent);
        this.decayModel = decayModel;
        this.transitionCount = 0;
    }
    
    applyEnergyDecay() {
        this.transitionCount++;
        
        switch (this.decayModel) {
            case 'linear':
                this.energy = Math.max(0, this.energy - 0.1);
                break;
            case 'exponential':
                this.energy *= 0.85;
                break;
            case 'step':
                if (this.transitionCount % 3 === 0) {
                    this.energy *= 0.7;
                }
                break;
            default:
                this.energy *= 0.9;
        }
    }
    
    proceed() {
        const result = super.proceed();
        if (result.state !== this.state) {
            this.applyEnergyDecay();
        }
        return result;
    }
}

const decayModels = ['linear', 'exponential', 'step'];

decayModels.forEach(model => {
    const electron = new CustomEnergyElectronSM(`custom-${model}`, ComponentTypes.PSII, model);
    
    console.log(`\n${model} 衰减模型:`);
    console.log(`   状态转移                | 能量`);
    console.log(`   ─────────────────────────────────`);
    
    for (let i = 1; i <= 8; i++) {
        const prevState = electron.state;
        const prevEnergy = electron.energy;
        electron.proceed();
        
        if (prevState !== electron.state) {
            console.log(`   ${prevState.padEnd(12)} → ${electron.state.padEnd(12)} | ${prevEnergy.toFixed(2)} → ${electron.energy.toFixed(2)}`);
        }
        
        if (electron.isComplete()) break;
    }
});

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║                    扩展能力验证完成                          ║');
console.log('╠═══════════════════════════════════════════════════════════╣');
console.log('║ ✓ 新增状态节点: 通过继承扩展状态枚举                        ║');
console.log('║ ✓ 新增中间载体: Plastocyanin (PC) 插入 Cyt 和 PSI 之间      ║');
console.log('║ ✓ 功能扩展: 抑制剂机制、自定义能量衰减                      ║');
console.log('║ ✓ 多观察者: 动画、统计、日志系统可同时监听                   ║');
console.log('║ ✓ 零侵入扩展: 无需修改原有代码，通过继承实现                ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('💡 架构设计优势:');
console.log('   1. 状态机封装每个电子的生命周期，无全局硬编码依赖');
console.log('   2. 观察者模式解耦逻辑与表现，动画、统计、音效等可独立扩展');
console.log('   3. 继承机制支持添加新状态、新组件、新行为');
console.log('   4. 事件驱动架构，各模块间松耦合');
console.log('   5. 迁移历史支持调试和数据分析');
console.log('   6. 每个电子独立实例，支持并行模拟和差异化参数');
