// AnomRace - Bolt Ride Comparison Script
// This script handles the comparison of two Bolt rides in real-time

class BoltRideTracker {
    constructor(url) {
        this.url = url;
        this.rideId = this.extractRideId(url);
        this.status = 'pending';
        this.distance = 0;
        this.speed = 0;
        this.eta = 0;
        this.progress = 0;
    }

    extractRideId(url) {
        try {
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.search);
            return params.get('s');
        } catch (e) {
            return null;
        }
    }

    async fetchRideData() {
        // In a real implementation, this would call the Bolt API
        // For now, we'll simulate the data
        if (!this.rideId) {
            throw new Error('Invalid ride URL');
        }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate simulated ride data
        return {
            status: 'in_progress',
            distance: Math.random() * 10 + 2, // 2-12 km
            speed: Math.random() * 30 + 20, // 20-50 km/h
            location: {
                lat: 59.437 + Math.random() * 0.1,
                lng: 24.745 + Math.random() * 0.1
            },
            destination: {
                lat: 59.437,
                lng: 24.745
            }
        };
    }

    calculateETA(distance, speed) {
        // ETA in minutes
        return (distance / speed) * 60;
    }

    update(data) {
        this.status = data.status;
        this.distance = data.distance;
        this.speed = data.speed;
        this.eta = this.calculateETA(data.distance, data.speed);
        this.progress = Math.max(0, 100 - (data.distance / 15) * 100);
    }
}

class AnomRace {
    constructor() {
        this.ride1 = null;
        this.ride2 = null;
        this.updateInterval = null;
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.elements = {
            compareBtn: document.getElementById('compare-btn'),
            rideUrl1: document.getElementById('ride-url-1'),
            rideUrl2: document.getElementById('ride-url-2'),
            inputGroup1: document.getElementById('input-group-1'),
            inputGroup2: document.getElementById('input-group-2'),
            errorMessage: document.getElementById('error-message'),
            loadingSpinner: document.getElementById('loading-spinner'),
            results: document.getElementById('results'),
            statusTitle: document.getElementById('status-title'),
            leaderInfo: document.getElementById('leader-info'),
            etaInfo: document.getElementById('eta-info'),
            progressFill: document.getElementById('progress-fill'),
            rideCard1: document.getElementById('ride-card-1'),
            rideCard2: document.getElementById('ride-card-2'),
            status1: document.getElementById('status-1'),
            distance1: document.getElementById('distance-1'),
            speed1: document.getElementById('speed-1'),
            eta1: document.getElementById('eta-1'),
            status2: document.getElementById('status-2'),
            distance2: document.getElementById('distance-2'),
            speed2: document.getElementById('speed-2'),
            eta2: document.getElementById('eta-2')
        };
    }

    attachEventListeners() {
        this.elements.compareBtn.addEventListener('click', () => this.startComparison());
        
        this.elements.rideUrl1.addEventListener('focus', () => {
            this.elements.inputGroup1.classList.add('active');
        });
        
        this.elements.rideUrl1.addEventListener('blur', () => {
            this.elements.inputGroup1.classList.remove('active');
        });
        
        this.elements.rideUrl2.addEventListener('focus', () => {
            this.elements.inputGroup2.classList.add('active');
        });
        
        this.elements.rideUrl2.addEventListener('blur', () => {
            this.elements.inputGroup2.classList.remove('active');
        });

        // Enter key support
        this.elements.rideUrl1.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startComparison();
        });
        
        this.elements.rideUrl2.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startComparison();
        });
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.add('active');
        setTimeout(() => {
            this.elements.errorMessage.classList.remove('active');
        }, 5000);
    }

    hideError() {
        this.elements.errorMessage.classList.remove('active');
    }

    validateUrls() {
        const url1 = this.elements.rideUrl1.value.trim();
        const url2 = this.elements.rideUrl2.value.trim();

        if (!url1 || !url2) {
            this.showError('Please enter both ride URLs');
            return false;
        }

        // Basic URL validation
        const boltUrlPattern = /^https?:\/\/(www\.)?ride\.bolt\.eu\/route-sharing\/\?s=.+$/;
        
        if (!boltUrlPattern.test(url1)) {
            this.showError('Ride 1 URL is invalid. Please use a valid Bolt ride sharing URL.');
            return false;
        }

        if (!boltUrlPattern.test(url2)) {
            this.showError('Ride 2 URL is invalid. Please use a valid Bolt ride sharing URL.');
            return false;
        }

        return true;
    }

    async startComparison() {
        if (!this.validateUrls()) {
            return;
        }

        this.hideError();
        this.elements.compareBtn.disabled = true;
        this.elements.loadingSpinner.classList.add('active');
        this.elements.results.classList.remove('active');

        try {
            const url1 = this.elements.rideUrl1.value.trim();
            const url2 = this.elements.rideUrl2.value.trim();

            this.ride1 = new BoltRideTracker(url1);
            this.ride2 = new BoltRideTracker(url2);

            // Fetch initial data
            const [data1, data2] = await Promise.all([
                this.ride1.fetchRideData(),
                this.ride2.fetchRideData()
            ]);

            this.ride1.update(data1);
            this.ride2.update(data2);

            // Show results
            this.elements.loadingSpinner.classList.remove('active');
            this.elements.results.classList.add('active');
            this.elements.compareBtn.disabled = false;
            this.elements.compareBtn.textContent = 'Refresh Data';

            // Update UI
            this.updateUI();

            // Start live updates every 5 seconds
            this.startLiveUpdates();

        } catch (error) {
            console.error('Error fetching ride data:', error);
            this.showError('Failed to fetch ride data. Please check the URLs and try again.');
            this.elements.loadingSpinner.classList.remove('active');
            this.elements.compareBtn.disabled = false;
        }
    }

    updateUI() {
        // Update Ride 1
        this.elements.status1.textContent = this.formatStatus(this.ride1.status);
        this.elements.distance1.textContent = `${this.ride1.distance.toFixed(2)} km`;
        this.elements.speed1.textContent = `${this.ride1.speed.toFixed(1)} km/h`;
        this.elements.eta1.textContent = `${Math.round(this.ride1.eta)} min`;

        // Update Ride 2
        this.elements.status2.textContent = this.formatStatus(this.ride2.status);
        this.elements.distance2.textContent = `${this.ride2.distance.toFixed(2)} km`;
        this.elements.speed2.textContent = `${this.ride2.speed.toFixed(1)} km/h`;
        this.elements.eta2.textContent = `${Math.round(this.ride2.eta)} min`;

        // Determine leader
        const leader = this.ride1.eta < this.ride2.eta ? 1 : 2;
        const timeDiff = Math.abs(this.ride1.eta - this.ride2.eta);

        // Update leader status
        this.elements.rideCard1.classList.toggle('leading', leader === 1);
        this.elements.rideCard2.classList.toggle('leading', leader === 2);

        this.elements.leaderInfo.textContent = `Ride ${leader} is leading!`;
        this.elements.etaInfo.textContent = `Expected to arrive ${timeDiff.toFixed(1)} minutes earlier`;

        // Update progress bar (based on average progress)
        const avgProgress = (this.ride1.progress + this.ride2.progress) / 2;
        this.elements.progressFill.style.width = `${avgProgress}%`;

        // Check if any ride has completed
        if (this.ride1.distance < 0.1 || this.ride2.distance < 0.1) {
            const winner = this.ride1.distance < 0.1 ? 1 : 2;
            this.elements.statusTitle.textContent = '🏁 Race Complete!';
            this.elements.leaderInfo.textContent = `Ride ${winner} has arrived!`;
            this.stopLiveUpdates();
        }
    }

    formatStatus(status) {
        const statusMap = {
            'pending': '⏳ Pending',
            'in_progress': '🚗 In Progress',
            'completed': '✅ Completed',
            'cancelled': '❌ Cancelled'
        };
        return statusMap[status] || status;
    }

    async startLiveUpdates() {
        // Clear any existing interval
        this.stopLiveUpdates();

        // Update every 5 seconds
        this.updateInterval = setInterval(async () => {
            try {
                const [data1, data2] = await Promise.all([
                    this.ride1.fetchRideData(),
                    this.ride2.fetchRideData()
                ]);

                // Simulate progress (decrease distance over time)
                data1.distance = Math.max(0, this.ride1.distance - (this.ride1.speed / 720)); // Update based on speed
                data2.distance = Math.max(0, this.ride2.distance - (this.ride2.speed / 720));

                // Add some randomness to speed
                data1.speed = this.ride1.speed + (Math.random() - 0.5) * 5;
                data2.speed = this.ride2.speed + (Math.random() - 0.5) * 5;

                this.ride1.update(data1);
                this.ride2.update(data2);

                this.updateUI();

                // Stop if both rides are complete
                if (this.ride1.distance < 0.1 && this.ride2.distance < 0.1) {
                    this.stopLiveUpdates();
                }
            } catch (error) {
                console.error('Error updating ride data:', error);
            }
        }, 5000);
    }

    stopLiveUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AnomRace();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.anomRace) {
        window.anomRace.stopLiveUpdates();
    }
});
