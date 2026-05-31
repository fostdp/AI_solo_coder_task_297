class ElectronTransportAnimator {
    constructor(canvas, etcObservable, components) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.etcObservable = etcObservable;
        this.components = components;
        
        this.animatedElectrons = new Map();
        this.animationSpeed = 3;
        this.transitionDuration = 500;
        
        this.setupListeners();
    }
    
    setupListeners() {
        this.etcObservable.on('electron:created', (data) => {
            this.onElectronCreated(data);
        });
        
        this.etcObservable.on('electron:transition', (data) => {
            this.onElectronTransition(data);
        });
        
        this.etcObservable.on('electron:completed', (data) => {
            this.onElectronCompleted(data);
        });
    }
    
    onElectronCreated(data) {
        const electron = this.etcObservable.getElectron(data.electronId);
        let startPos;
        
        if (data.startComponent === 'psii') {
            startPos = {
                x: this.components.ps2.x + this.components.ps2.width / 2,
                y: this.components.ps2.y - 20
            };
        } else {
            startPos = {
                x: this.components.ps1.x + this.components.ps1.width / 2,
                y: this.components.ps1.y - 20
            };
        }
        
        this.animatedElectrons.set(data.electronId, {
            id: data.electronId,
            x: startPos.x,
            y: startPos.y,
            targetX: startPos.x,
            targetY: startPos.y,
            energy: electron.energy,
            state: electron.state,
            visible: true,
            glowIntensity: 1.0
        });
    }
    
    onElectronTransition(data) {
        const animated = this.animatedElectrons.get(data.electronId);
        if (!animated) return;
        
        animated.state = data.to;
        
        const electron = this.etcObservable.getElectron(data.electronId);
        if (electron) {
            animated.energy = electron.energy;
        }
        
        const targetPos = this.getTargetPosition(data.to);
        if (targetPos) {
            animated.targetX = targetPos.x;
            animated.targetY = targetPos.y;
        }
        
        if (data.data && data.data.pumpProton) {
            this.onProtonPumped();
        }
    }
    
    onElectronCompleted(data) {
        const animated = this.animatedElectrons.get(data.electronId);
        if (animated) {
            animated.visible = false;
            animated.fadingOut = true;
            animated.alpha = 1;
        }
    }
    
    onProtonPumped() {
    }
    
    getTargetPosition(state) {
        switch (state) {
            case 'psii_to_cyto':
                return {
                    x: this.components.cytochrome.x + this.components.cytochrome.width / 2,
                    y: this.components.cytochrome.y
                };
            case 'cyto_to_psi':
                return {
                    x: this.components.ps1.x + this.components.ps1.width / 2,
                    y: this.components.ps1.y - 20
                };
            case 'psi_to_nadp':
                return {
                    x: this.components.ps1.x + this.components.ps1.width + 30,
                    y: this.components.ps1.y - 50
                };
            default:
                return null;
        }
    }
    
    update() {
        this.animatedElectrons.forEach((animated, id) => {
            const dx = animated.targetX - animated.x;
            const dy = animated.targetY - animated.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 2) {
                animated.x += (dx / dist) * this.animationSpeed;
                animated.y += (dy / dist) * this.animationSpeed;
            }
            
            if (animated.fadingOut) {
                animated.alpha -= 0.05;
                if (animated.alpha <= 0) {
                    this.animatedElectrons.delete(id);
                }
            }
            
            animated.glowIntensity = 0.7 + Math.sin(Date.now() / 200) * 0.3;
        });
    }
    
    draw() {
        this.animatedElectrons.forEach((animated) => {
            if (!animated.visible && !animated.fadingOut) return;
            
            const alpha = animated.fadingOut ? animated.alpha : 1;
            const energyColor = this.getEnergyColor(animated.energy);
            
            this.drawElectronGlow(animated, energyColor, alpha * animated.glowIntensity);
            this.drawElectronBody(animated, energyColor, alpha);
            this.drawElectronLabel(animated, alpha);
        });
    }
    
    getEnergyColor(energy) {
        if (energy >= 0.9) return '#00FFFF';
        if (energy >= 0.7) return '#4DD0E1';
        if (energy >= 0.5) return '#26A69A';
        return '#00897B';
    }
    
    drawElectronGlow(animated, color, alpha) {
        const gradient = this.ctx.createRadialGradient(
            animated.x, animated.y, 0,
            animated.x, animated.y, 25
        );
        gradient.addColorStop(0, color + Math.floor(alpha * 200).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, color + Math.floor(alpha * 100).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(animated.x, animated.y, 25, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawElectronBody(animated, color, alpha) {
        this.ctx.globalAlpha = alpha;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(animated.x, animated.y, 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(animated.x - 3, animated.y - 3, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.globalAlpha = 1;
    }
    
    drawElectronLabel(animated, alpha) {
        if (alpha < 0.5) return;
        
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.font = 'bold 8px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('e⁻', animated.x, animated.y + 3);
    }
    
    getActiveElectronCount() {
        return this.animatedElectrons.size;
    }
    
    destroy() {
        this.animatedElectrons.clear();
    }
}

class ComponentAnimationExtension {
    constructor(componentType) {
        this.componentType = componentType;
        this.active = false;
        this.animationProgress = 0;
    }
    
    activate() {
        this.active = true;
        this.animationProgress = 0;
    }
    
    deactivate() {
        this.active = false;
    }
    
    update(deltaTime) {
        if (this.active) {
            this.animationProgress += deltaTime / 500;
            if (this.animationProgress > 1) {
                this.animationProgress = 0;
            }
        }
    }
    
    draw(ctx, x, y, width, height) {
        if (!this.active) return;
        
        const glowSize = 5 + Math.sin(this.animationProgress * Math.PI * 2) * 3;
        const gradient = ctx.createRadialGradient(
            x + width / 2, y + height / 2, 0,
            x + width / 2, y + height / 2, Math.max(width, height) / 2 + glowSize
        );
        gradient.addColorStop(0, 'rgba(0, 255, 200, 0.3)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x - glowSize, y - glowSize - height / 2, width + glowSize * 2, height * 2 + glowSize * 2);
    }
}

export {
    ElectronTransportAnimator,
    ComponentAnimationExtension
};
