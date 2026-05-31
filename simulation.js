class PhotosynthesisSimulation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.isRunning = false;
        this.lightIntensity = 50;
        this.wavelength = 680;
        
        this.photons = [];
        this.electrons = [];
        this.oxygenBubbles = [];
        this.atpMolecules = [];
        this.hydrogenIons = [];
        
        this.oxygenCount = 0;
        this.atpCount = 0;
        this.electronTransportRate = 0;
        this.rateHistory = [];
        
        this.membraneY = this.height * 0.5;
        
        this.ps2 = { x: 150, y: this.membraneY, width: 100, height: 80 };
        this.cytochrome = { x: 350, y: this.membraneY, width: 80, height: 60 };
        this.ps1 = { x: 550, y: this.membraneY, width: 100, height: 80 };
        this.atpSynthase = { x: 750, y: this.membraneY, width: 80, height: 100 };
        
        this.lastTime = 0;
        this.electronCounter = 0;
        this.rateUpdateInterval = 1000;
        this.lastRateUpdate = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.animate();
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        
        const intensitySlider = document.getElementById('lightIntensity');
        intensitySlider.addEventListener('input', (e) => {
            this.lightIntensity = parseInt(e.target.value);
            document.getElementById('intensityValue').textContent = this.lightIntensity;
        });
        
        const wavelengthSlider = document.getElementById('wavelength');
        wavelengthSlider.addEventListener('input', (e) => {
            this.wavelength = parseInt(e.target.value);
            document.getElementById('wavelengthValue').textContent = this.wavelength;
            this.updateWavelengthPreview();
        });
        
        this.updateWavelengthPreview();
    }
    
    updateWavelengthPreview() {
        const preview = document.getElementById('wavelengthPreview');
        const color = this.wavelengthToColor(this.wavelength);
        preview.style.background = `linear-gradient(to right, #9400D3, #4B0082, #0000FF, #00FF00, #FFFF00, #FF7F00, #FF0000)`;
        preview.style.boxShadow = `0 0 20px ${color}`;
    }
    
    wavelengthToColor(wavelength) {
        let r, g, b;
        if (wavelength >= 400 && wavelength < 440) {
            r = -(wavelength - 440) / (440 - 400);
            g = 0;
            b = 1;
        } else if (wavelength >= 440 && wavelength < 490) {
            r = 0;
            g = (wavelength - 440) / (490 - 440);
            b = 1;
        } else if (wavelength >= 490 && wavelength < 510) {
            r = 0;
            g = 1;
            b = -(wavelength - 510) / (510 - 490);
        } else if (wavelength >= 510 && wavelength < 580) {
            r = (wavelength - 510) / (580 - 510);
            g = 1;
            b = 0;
        } else if (wavelength >= 580 && wavelength < 645) {
            r = 1;
            g = -(wavelength - 645) / (645 - 580);
            b = 0;
        } else {
            r = 1;
            g = 0;
            b = 0;
        }
        return `rgb(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)})`;
    }
    
    getWavelengthEfficiency() {
        const peak1 = 680;
        const peak2 = 430;
        const sigma1 = 25;
        const sigma2 = 30;
        
        const gaussianRed = Math.exp(-Math.pow(this.wavelength - peak1, 2) / (2 * sigma1 * sigma1));
        const gaussianBlue = Math.exp(-Math.pow(this.wavelength - peak2, 2) / (2 * sigma2 * sigma2));
        
        return Math.max(gaussianRed * 0.95 + gaussianBlue * 0.85, 0.0);
    }
    
    getPS2Efficiency() {
        const peak = 680;
        const sigma = 25;
        return Math.exp(-Math.pow(this.wavelength - peak, 2) / (2 * sigma * sigma)) * 0.95;
    }
    
    getPS1Efficiency() {
        const peak = 700;
        const sigma = 30;
        return Math.exp(-Math.pow(this.wavelength - peak, 2) / (2 * sigma * sigma)) * 0.90;
    }
    
    getLightSaturationFactor() {
        const I = this.lightIntensity;
        const saturationIntensity = 60;
        const k = 0.05;
        
        if (I <= 0) {
            return 0;
        }
        
        if (I <= saturationIntensity) {
            return I / saturationIntensity;
        } else {
            const excess = I - saturationIntensity;
            const saturatedFactor = 1 + (1 - Math.exp(-k * excess)) * 0.3;
            return 1 / saturatedFactor;
        }
    }
    
    start() {
        this.isRunning = true;
    }
    
    pause() {
        this.isRunning = false;
    }
    
    reset() {
        this.isRunning = false;
        this.photons = [];
        this.electrons = [];
        this.oxygenBubbles = [];
        this.atpMolecules = [];
        this.hydrogenIons = [];
        this.oxygenCount = 0;
        this.atpCount = 0;
        this.electronTransportRate = 0;
        this.rateHistory = [];
        this.electronCounter = 0;
        this.updateStats();
    }
    
    spawnPhoton() {
        if (!this.isRunning) return;
        
        if (this.lightIntensity <= 0) {
            return;
        }
        
        const wavelengthEfficiency = this.getWavelengthEfficiency();
        const saturationFactor = this.getLightSaturationFactor();
        const baseRate = 0.35;
        
        const linearComponent = Math.min(this.lightIntensity / 100, 0.6);
        const saturatedComponent = Math.max(0, (this.lightIntensity / 100 - 0.6) * 0.3);
        const effectiveIntensity = (linearComponent + saturatedComponent) * 100;
        
        const spawnRate = (effectiveIntensity / 100) * wavelengthEfficiency * saturationFactor * baseRate;
        
        if (Math.random() < spawnRate) {
            const ps2Eff = Math.max(this.getPS2Efficiency(), 0.1);
            const ps1Eff = Math.max(this.getPS1Efficiency(), 0.1);
            const totalEff = ps2Eff + ps1Eff;
            const ps2Probability = ps2Eff / totalEff;
            
            const targetX = Math.random() < ps2Probability 
                ? this.ps2.x + this.ps2.width / 2 
                : this.ps1.x + this.ps1.width / 2;
                
            this.photons.push({
                x: Math.random() * this.width,
                y: 0,
                targetX: targetX,
                speed: 3 + Math.random() * 2,
                color: this.wavelengthToColor(this.wavelength),
                size: 8 + Math.random() * 4
            });
        }
    }
    
    updatePhotons() {
        for (let i = this.photons.length - 1; i >= 0; i--) {
            const photon = this.photons[i];
            const dx = photon.targetX - photon.x;
            const dy = this.membraneY - 60 - photon.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 20) {
                if (photon.targetX < 300) {
                    this.exciteElectronPS2();
                } else {
                    this.exciteElectronPS1();
                }
                this.photons.splice(i, 1);
            } else {
                photon.x += (dx / dist) * photon.speed;
                photon.y += (dy / dist) * photon.speed;
            }
            
            if (photon.y > this.height) {
                this.photons.splice(i, 1);
            }
        }
    }
    
    exciteElectronPS2() {
        this.electrons.push({
            x: this.ps2.x + this.ps2.width / 2,
            y: this.ps2.y - 20,
            targetX: this.cytochrome.x + this.cytochrome.width / 2,
            targetY: this.cytochrome.y,
            stage: 'ps2_to_cyto',
            speed: 2,
            excited: true
        });
        this.electronCounter++;
        
        if (this.electronCounter % 4 === 0) {
            this.releaseOxygen();
            for (let i = 0; i < 2; i++) {
                this.spawnHydrogenIon(this.ps2.x + this.ps2.width / 2, this.ps2.y + 30);
            }
        }
    }
    
    exciteElectronPS1() {
        this.electrons.push({
            x: this.ps1.x + this.ps1.width / 2,
            y: this.ps1.y - 20,
            targetX: this.ps1.x + this.ps1.width / 2 + 50,
            targetY: this.ps1.y - 40,
            stage: 'ps1_to_nadp',
            speed: 2,
            excited: true
        });
        this.electronCounter++;
    }
    
    releaseOxygen() {
        this.oxygenCount++;
        for (let i = 0; i < 2; i++) {
            this.oxygenBubbles.push({
                x: this.ps2.x + this.ps2.width / 2 + (Math.random() - 0.5) * 40,
                y: this.ps2.y - 40,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -1 - Math.random(),
                size: 10 + Math.random() * 10,
                alpha: 1
            });
        }
    }
    
    spawnHydrogenIon(x, y) {
        this.hydrogenIons.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 1,
            size: 6
        });
    }
    
    updateElectrons() {
        for (let i = this.electrons.length - 1; i >= 0; i--) {
            const e = this.electrons[i];
            const dx = e.targetX - e.x;
            const dy = e.targetY - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 5) {
                if (e.stage === 'ps2_to_cyto') {
                    e.stage = 'cyto_to_ps1';
                    e.targetX = this.ps1.x + this.ps1.width / 2;
                    e.targetY = this.ps1.y - 20;
                    this.spawnHydrogenIon(this.cytochrome.x + this.cytochrome.width / 2, this.cytochrome.y + 20);
                } else if (e.stage === 'cyto_to_ps1') {
                    this.electrons.splice(i, 1);
                } else if (e.stage === 'ps1_to_nadp') {
                    this.electrons.splice(i, 1);
                }
            } else {
                e.x += (dx / dist) * e.speed;
                e.y += (dy / dist) * e.speed;
            }
        }
    }
    
    updateOxygenBubbles() {
        for (let i = this.oxygenBubbles.length - 1; i >= 0; i--) {
            const bubble = this.oxygenBubbles[i];
            bubble.x += bubble.vx;
            bubble.y += bubble.vy;
            bubble.alpha -= 0.005;
            bubble.size += 0.05;
            
            if (bubble.alpha <= 0 || bubble.y < -50) {
                this.oxygenBubbles.splice(i, 1);
            }
        }
    }
    
    updateHydrogenIons() {
        for (let i = this.hydrogenIons.length - 1; i >= 0; i--) {
            const ion = this.hydrogenIons[i];
            ion.x += ion.vx;
            ion.y += ion.vy;
            
            if (ion.y < this.membraneY) {
                ion.y = this.membraneY;
            }
            if (ion.y > this.membraneY + 100) {
                ion.y = this.membraneY + 100;
            }
            
            const dxToAtp = this.atpSynthase.x + this.atpSynthase.width / 2 - ion.x;
            if (Math.abs(dxToAtp) < 60 && ion.y > this.membraneY) {
                if (Math.random() < 0.02) {
                    this.produceATP();
                    this.hydrogenIons.splice(i, 1);
                    continue;
                }
            }
            
            if (Math.random() < 0.05) {
                ion.vx += (Math.random() - 0.5) * 0.5;
                ion.vy += (Math.random() - 0.5) * 0.3;
            }
            
            ion.vx *= 0.99;
            ion.vy *= 0.99;
        }
    }
    
    produceATP() {
        this.atpCount++;
        this.atpMolecules.push({
            x: this.atpSynthase.x + this.atpSynthase.width / 2,
            y: this.atpSynthase.y - 30,
            vx: (Math.random() - 0.5) * 2,
            vy: -0.5,
            alpha: 1,
            size: 12
        });
    }
    
    updateATPMolecules() {
        for (let i = this.atpMolecules.length - 1; i >= 0; i--) {
            const atp = this.atpMolecules[i];
            atp.x += atp.vx;
            atp.y += atp.vy;
            atp.alpha -= 0.01;
            
            if (atp.alpha <= 0 || atp.y < -50) {
                this.atpMolecules.splice(i, 1);
            }
        }
    }
    
    updateStats() {
        document.getElementById('oxygenLevel').textContent = this.oxygenCount;
        document.getElementById('atpLevel').textContent = this.atpCount;
        document.getElementById('electronRate').textContent = this.electronTransportRate;
    }
    
    drawMembrane() {
        const gradient = this.ctx.createLinearGradient(0, this.membraneY - 20, 0, this.membraneY + 20);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        gradient.addColorStop(0.3, 'rgba(100, 150, 100, 0.8)');
        gradient.addColorStop(0.5, 'rgba(60, 120, 60, 0.9)');
        gradient.addColorStop(0.7, 'rgba(100, 150, 100, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0.3)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, this.membraneY - 20, this.width, 40);
        
        this.ctx.fillStyle = 'rgba(200, 230, 200, 0.6)';
        for (let x = 0; x < this.width; x += 30) {
            this.ctx.beginPath();
            this.ctx.ellipse(x + 15, this.membraneY - 10, 12, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(x + 15, this.membraneY + 10, 12, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawPS2() {
        const x = this.ps2.x;
        const y = this.ps2.y;
        const w = this.ps2.width;
        const h = this.ps2.height;
        
        this.ctx.fillStyle = 'rgba(100, 180, 100, 0.9)';
        this.ctx.beginPath();
        this.ctx.roundRect(x, y - h/2, w, h, 10);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(80, 150, 80, 0.8)';
        for (let i = 0; i < 8; i++) {
            this.ctx.beginPath();
            this.ctx.arc(x + 15 + (i % 4) * 20, y - h/2 + 15 + Math.floor(i / 4) * 25, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PSII', x + w/2, y + 5);
        
        this.ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(x + w/2, y - 30, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#8B4513';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText('P680', x + w/2, y - 26);
    }
    
    drawCytochrome() {
        const x = this.cytochrome.x;
        const y = this.cytochrome.y;
        const w = this.cytochrome.width;
        const h = this.cytochrome.height;
        
        this.ctx.fillStyle = 'rgba(150, 100, 180, 0.9)';
        this.ctx.beginPath();
        this.ctx.roundRect(x, y - h/2, w, h, 8);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Cyt b₆f', x + w/2, y + 5);
    }
    
    drawPS1() {
        const x = this.ps1.x;
        const y = this.ps1.y;
        const w = this.ps1.width;
        const h = this.ps1.height;
        
        this.ctx.fillStyle = 'rgba(100, 160, 200, 0.9)';
        this.ctx.beginPath();
        this.ctx.roundRect(x, y - h/2, w, h, 10);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(80, 130, 160, 0.8)';
        for (let i = 0; i < 8; i++) {
            this.ctx.beginPath();
            this.ctx.arc(x + 15 + (i % 4) * 20, y - h/2 + 15 + Math.floor(i / 4) * 25, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PSI', x + w/2, y + 5);
        
        this.ctx.fillStyle = 'rgba(255, 150, 100, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(x + w/2, y - 30, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#8B4513';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText('P700', x + w/2, y - 26);
    }
    
    drawATPSynthase() {
        const x = this.atpSynthase.x;
        const y = this.atpSynthase.y;
        const w = this.atpSynthase.width;
        const h = this.atpSynthase.height;
        
        this.ctx.fillStyle = 'rgba(200, 150, 100, 0.9)';
        this.ctx.beginPath();
        this.ctx.moveTo(x + w/2, y - h/2);
        this.ctx.lineTo(x + 10, y);
        this.ctx.lineTo(x + 10, y + 30);
        this.ctx.lineTo(x + w - 10, y + 30);
        this.ctx.lineTo(x + w - 10, y);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(220, 180, 120, 0.9)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + w/2, y - h/2, 25, 15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(180, 130, 80, 0.8)';
        this.ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.arc(x + w/2, y - h/2, 10, i * Math.PI * 2/3, i * Math.PI * 2/3 + Math.PI/3);
            this.ctx.stroke();
        }
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ATP', x + w/2, y - h/2 + 5);
    }
    
    drawPhotons() {
        this.photons.forEach(photon => {
            const gradient = this.ctx.createRadialGradient(photon.x, photon.y, 0, photon.x, photon.y, photon.size);
            gradient.addColorStop(0, photon.color);
            gradient.addColorStop(0.5, photon.color + '88');
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(photon.x, photon.y, photon.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = photon.color;
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 + Date.now() / 200;
                this.ctx.beginPath();
                this.ctx.moveTo(photon.x + Math.cos(angle) * photon.size * 0.5, photon.y + Math.sin(angle) * photon.size * 0.5);
                this.ctx.lineTo(photon.x + Math.cos(angle) * photon.size * 1.2, photon.y + Math.sin(angle) * photon.size * 1.2);
                this.ctx.stroke();
            }
        });
    }
    
    drawElectrons() {
        this.electrons.forEach(e => {
            const gradient = this.ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 12);
            gradient.addColorStop(0, e.excited ? '#00FFFF' : '#4169E1');
            gradient.addColorStop(0.5, e.excited ? '#00CED1' : '#6495ED');
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(e.x, e.y, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('e⁻', e.x, e.y + 4);
        });
    }
    
    drawOxygenBubbles() {
        this.oxygenBubbles.forEach(bubble => {
            this.ctx.globalAlpha = bubble.alpha;
            
            const gradient = this.ctx.createRadialGradient(bubble.x, bubble.y, 0, bubble.x, bubble.y, bubble.size);
            gradient.addColorStop(0, 'rgba(200, 255, 255, 0.8)');
            gradient.addColorStop(0.7, 'rgba(150, 220, 255, 0.4)');
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.2, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.globalAlpha = 1;
        });
    }
    
    drawHydrogenIons() {
        this.hydrogenIons.forEach(ion => {
            this.ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(ion.x, ion.y, ion.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('H⁺', ion.x, ion.y + 3);
        });
    }
    
    drawATPMolecules() {
        this.atpMolecules.forEach(atp => {
            this.ctx.globalAlpha = atp.alpha;
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.ellipse(atp.x, atp.y, atp.size, atp.size * 0.6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ATP', atp.x, atp.y + 3);
            
            this.ctx.globalAlpha = 1;
        });
    }
    
    drawLabels() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        
        this.ctx.fillText('类囊体膜', this.width / 2, this.membraneY + 45);
        
        this.ctx.fillStyle = 'rgba(255, 200, 200, 0.8)';
        this.ctx.fillText('H⁺浓度高 →', 450, this.membraneY + 70);
        
        this.ctx.fillStyle = 'rgba(200, 200, 255, 0.8)';
        this.ctx.fillText('← H⁺浓度低', 450, this.membraneY - 40);
    }
    
    animate(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawMembrane();
        this.drawPS2();
        this.drawCytochrome();
        this.drawPS1();
        this.drawATPSynthase();
        this.drawLabels();
        
        if (this.isRunning) {
            this.spawnPhoton();
            this.updatePhotons();
            this.updateElectrons();
            this.updateOxygenBubbles();
            this.updateHydrogenIons();
            this.updateATPMolecules();
            
            if (currentTime - this.lastRateUpdate >= this.rateUpdateInterval) {
                this.electronTransportRate = this.electronCounter;
                this.rateHistory.push({ time: currentTime, rate: this.electronTransportRate });
                if (this.rateHistory.length > 60) {
                    this.rateHistory.shift();
                }
                this.electronCounter = 0;
                this.lastRateUpdate = currentTime;
                this.updateStats();
            }
        }
        
        this.drawHydrogenIons();
        this.drawPhotons();
        this.drawElectrons();
        this.drawOxygenBubbles();
        this.drawATPMolecules();
        
        requestAnimationFrame((t) => this.animate(t));
    }
    
    getSimulationData() {
        return {
            timestamp: new Date().toISOString(),
            lightIntensity: this.lightIntensity,
            wavelength: this.wavelength,
            oxygenCount: this.oxygenCount,
            atpCount: this.atpCount,
            electronRate: this.electronTransportRate
        };
    }
}