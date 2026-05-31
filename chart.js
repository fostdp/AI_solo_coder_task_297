class RateChart {
    constructor(canvas, simulation) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.simulation = simulation;
        
        this.padding = { top: 30, right: 20, bottom: 40, left: 50 };
        this.chartWidth = this.width - this.padding.left - this.padding.right;
        this.chartHeight = this.height - this.padding.top - this.padding.bottom;
        
        this.maxDataPoints = 60;
        this.animationFrame = null;
        
        this.init();
    }
    
    init() {
        this.animate();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= 5; i++) {
            const y = this.padding.top + (this.chartHeight / 5) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding.left, y);
            this.ctx.lineTo(this.width - this.padding.right, y);
            this.ctx.stroke();
        }
        
        for (let i = 0; i <= 6; i++) {
            const x = this.padding.left + (this.chartWidth / 6) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.padding.top);
            this.ctx.lineTo(x, this.height - this.padding.bottom);
            this.ctx.stroke();
        }
    }
    
    drawAxes() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding.left, this.padding.top);
        this.ctx.lineTo(this.padding.left, this.height - this.padding.bottom);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding.left, this.height - this.padding.bottom);
        this.ctx.lineTo(this.width - this.padding.right, this.height - this.padding.bottom);
        this.ctx.stroke();
    }
    
    drawLabels() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        
        this.ctx.fillText('时间 (s)', this.width / 2, this.height - 10);
        
        this.ctx.save();
        this.ctx.translate(15, this.height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('电子传递速率 (e⁻/s)', 0, 0);
        this.ctx.restore();
        
        this.ctx.textAlign = 'right';
        const maxRate = this.getMaxRate();
        for (let i = 0; i <= 5; i++) {
            const y = this.padding.top + (this.chartHeight / 5) * i;
            const value = Math.round(maxRate - (maxRate / 5) * i);
            this.ctx.fillText(value.toString(), this.padding.left - 10, y + 4);
        }
    }
    
    getMaxRate() {
        if (this.simulation.rateHistory.length === 0) return 50;
        const max = Math.max(...this.simulation.rateHistory.map(d => d.rate));
        return Math.max(50, Math.ceil(max / 10) * 10);
    }
    
    drawDataLine() {
        const data = this.simulation.rateHistory;
        if (data.length < 2) return;
        
        const maxRate = this.getMaxRate();
        
        const gradient = this.ctx.createLinearGradient(0, this.padding.top, 0, this.height - this.padding.bottom);
        gradient.addColorStop(0, 'rgba(0, 255, 200, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 200, 255, 0.9)');
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 3;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        data.forEach((point, i) => {
            const x = this.padding.left + (this.chartWidth / (this.maxDataPoints - 1)) * i;
            const y = this.padding.top + this.chartHeight - (point.rate / maxRate) * this.chartHeight;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        this.ctx.stroke();
        
        const fillGradient = this.ctx.createLinearGradient(0, this.padding.top, 0, this.height - this.padding.bottom);
        fillGradient.addColorStop(0, 'rgba(0, 255, 200, 0.3)');
        fillGradient.addColorStop(1, 'rgba(0, 200, 255, 0.1)');
        
        this.ctx.fillStyle = fillGradient;
        this.ctx.lineTo(this.padding.left + (this.chartWidth / (this.maxDataPoints - 1)) * (data.length - 1), this.height - this.padding.bottom);
        this.ctx.lineTo(this.padding.left, this.height - this.padding.bottom);
        this.ctx.closePath();
        this.ctx.fill();
        
        data.forEach((point, i) => {
            const x = this.padding.left + (this.chartWidth / (this.maxDataPoints - 1)) * i;
            const y = this.padding.top + this.chartHeight - (point.rate / maxRate) * this.chartHeight;
            
            this.ctx.fillStyle = 'rgba(0, 255, 200, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawTitle() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('电子传递速率实时曲线', this.width / 2, 18);
    }
    
    drawCurrentValue() {
        const currentRate = this.simulation.electronTransportRate;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.roundRect(this.width - 120, 5, 115, 25, 5);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(0, 255, 200, 1)';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${currentRate} e⁻/s`, this.width - 15, 23);
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawGrid();
        this.drawAxes();
        this.drawLabels();
        this.drawDataLine();
        this.drawTitle();
        this.drawCurrentValue();
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}