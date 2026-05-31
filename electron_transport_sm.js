const ElectronStates = {
    IDLE: 'idle',
    AT_PSII: 'at_psii',
    PSII_TO_CYTO: 'psii_to_cyto',
    AT_CYTO: 'at_cyto',
    CYTO_TO_PSI: 'cyto_to_psi',
    AT_PSI: 'at_psi',
    PSI_TO_NADP: 'psi_to_nadp',
    COMPLETED: 'completed'
};

const ComponentTypes = {
    PSII: 'psii',
    CYTOCHROME: 'cytochrome',
    PSI: 'psi',
    ATP_SYNTHASE: 'atp_synthase',
    NADP_REDUCTASE: 'nadp_reductase'
};

class ElectronTransportStateMachine {
    constructor(electronId, startComponent = ComponentTypes.PSII) {
        this.id = electronId;
        this.state = startComponent === ComponentTypes.PSII 
            ? ElectronStates.AT_PSII 
            : ElectronStates.AT_PSI;
        this.currentComponent = startComponent;
        this.energy = 1.0;
        this.createdAt = Date.now();
        this.transitionHistory = [{ state: this.state, timestamp: Date.now() }];
        
        this.stateCallbacks = {};
        this.transitionCallbacks = [];
    }

    onStateEnter(state, callback) {
        if (!this.stateCallbacks[state]) {
            this.stateCallbacks[state] = [];
        }
        this.stateCallbacks[state].push(callback);
    }

    onTransition(callback) {
        this.transitionCallbacks.push(callback);
    }

    transition(newState, data = {}) {
        const oldState = this.state;
        
        this.transitionCallbacks.forEach(cb => cb({
            electronId: this.id,
            from: oldState,
            to: newState,
            data
        }));
        
        this.state = newState;
        this.transitionHistory.push({ state: newState, timestamp: Date.now(), data });
        
        if (this.stateCallbacks[newState]) {
            this.stateCallbacks[newState].forEach(cb => cb(data));
        }
        
        return this;
    }

    proceed() {
        switch (this.state) {
            case ElectronStates.AT_PSII:
                this.energy = 0.8;
                return this.transition(ElectronStates.PSII_TO_CYTO, {
                    from: ComponentTypes.PSII,
                    to: ComponentTypes.CYTOCHROME,
                    energy: this.energy
                });
                
            case ElectronStates.PSII_TO_CYTO:
                this.currentComponent = ComponentTypes.CYTOCHROME;
                return this.transition(ElectronStates.AT_CYTO, {
                    component: ComponentTypes.CYTOCHROME,
                    energy: this.energy
                });
                
            case ElectronStates.AT_CYTO:
                this.energy *= 0.9;
                return this.transition(ElectronStates.CYTO_TO_PSI, {
                    from: ComponentTypes.CYTOCHROME,
                    to: ComponentTypes.PSI,
                    energy: this.energy,
                    pumpProton: true
                });
                
            case ElectronStates.CYTO_TO_PSI:
                this.currentComponent = ComponentTypes.PSI;
                return this.transition(ElectronStates.AT_PSI, {
                    component: ComponentTypes.PSI,
                    energy: this.energy
                });
                
            case ElectronStates.AT_PSI:
                this.energy = 1.0;
                return this.transition(ElectronStates.PSI_TO_NADP, {
                    from: ComponentTypes.PSI,
                    to: ComponentTypes.NADP_REDUCTASE,
                    energy: this.energy
                });
                
            case ElectronStates.PSI_TO_NADP:
                return this.transition(ElectronStates.COMPLETED, {
                    energy: this.energy,
                    nadpReduced: true
                });
                
            default:
                return this;
        }
    }

    reExcite() {
        if (this.state === ElectronStates.AT_PSI) {
            this.energy = 1.0;
            return this.transition(this.state, {
                reExcited: true,
                energy: this.energy
            });
        }
        return this;
    }

    isComplete() {
        return this.state === ElectronStates.COMPLETED;
    }

    isInTransit() {
        return [
            ElectronStates.PSII_TO_CYTO,
            ElectronStates.CYTO_TO_PSI,
            ElectronStates.PSI_TO_NADP
        ].includes(this.state);
    }

    getTargetPosition(components) {
        switch (this.state) {
            case ElectronStates.PSII_TO_CYTO:
                return components.cytochrome;
            case ElectronStates.CYTO_TO_PSI:
                return components.psi;
            case ElectronStates.PSI_TO_NADP:
                return { x: components.psi.x + 80, y: components.psi.y - 50 };
            default:
                return null;
        }
    }
}

class ETCObservable {
    constructor() {
        this.listeners = new Map();
        this.electrons = new Map();
        this.nextElectronId = 1;
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const idx = callbacks.indexOf(callback);
            if (idx > -1) callbacks.splice(idx, 1);
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => cb(data));
        }
    }

    createElectron(startComponent = ComponentTypes.PSII) {
        const electronId = `e-${this.nextElectronId++}`;
        const sm = new ElectronTransportStateMachine(electronId, startComponent);
        
        sm.onTransition((data) => {
            this.emit('electron:transition', data);
        });
        
        this.electrons.set(electronId, sm);
        this.emit('electron:created', { electronId, startComponent });
        
        return sm;
    }

    removeElectron(electronId) {
        if (this.electrons.has(electronId)) {
            this.electrons.delete(electronId);
            this.emit('electron:removed', { electronId });
        }
    }

    getElectron(electronId) {
        return this.electrons.get(electronId);
    }

    getAllElectrons() {
        return Array.from(this.electrons.values());
    }

    update() {
        const completed = [];
        
        this.electrons.forEach((electron, id) => {
            if (electron.isInTransit()) {
            } else if (!electron.isComplete()) {
                electron.proceed();
            }
            
            if (electron.isComplete()) {
                completed.push(id);
            }
        });
        
        completed.forEach(id => {
            this.emit('electron:completed', { electronId: id });
            this.removeElectron(id);
        });
        
        return completed.length;
    }
}

export {
    ElectronStates,
    ComponentTypes,
    ElectronTransportStateMachine,
    ETCObservable
};
