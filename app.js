let simulation;
let rateChart;
let experimentRecords = JSON.parse(localStorage.getItem('photosynthesisRecords') || '[]');

document.addEventListener('DOMContentLoaded', () => {
    const simulationCanvas = document.getElementById('simulationCanvas');
    const chartCanvas = document.getElementById('chartCanvas');
    
    simulation = new PhotosynthesisSimulation(simulationCanvas);
    rateChart = new RateChart(chartCanvas, simulation);
    
    document.getElementById('saveBtn').addEventListener('click', saveRecord);
    
    renderRecords();
    
    console.log('光合作用光反应模拟系统已启动');
});

function saveRecord() {
    const data = simulation.getSimulationData();
    
    const record = {
        id: Date.now(),
        ...data,
        formattedTime: new Date(data.timestamp).toLocaleString('zh-CN')
    };
    
    experimentRecords.unshift(record);
    
    if (experimentRecords.length > 50) {
        experimentRecords = experimentRecords.slice(0, 50);
    }
    
    localStorage.setItem('photosynthesisRecords', JSON.stringify(experimentRecords));
    
    renderRecords();
    
    showNotification('实验记录已保存！');
}

function renderRecords() {
    const recordsList = document.getElementById('recordsList');
    
    if (experimentRecords.length === 0) {
        recordsList.innerHTML = '<p class="no-records">暂无记录</p>';
        return;
    }
    
    recordsList.innerHTML = experimentRecords.map(record => `
        <div class="record-item">
            <div class="record-time">${record.formattedTime}</div>
            <div class="record-data">
                光强: ${record.lightIntensity}% | 
                波长: ${record.wavelength}nm<br>
                O₂: ${record.oxygenCount} | ATP: ${record.atpCount} | 
                速率: ${record.electronRate}e⁻/s
            </div>
        </div>
    `).join('');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(76, 175, 80, 0.9);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);