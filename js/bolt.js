const MIN_RIDES = 2;
const MAX_RIDES = 4;
const COLORS = ['#00ffa6', '#00d4ff', '#ff6ec7', '#ffa600'];
const UPDATE_INTERVAL_MS = 5000;

const BOLT_URL_PATTERN = /^https?:\/\/(www\.)?ride\.bolt\.eu\/route-sharing\/\?s=.+$/i;

const localStorageKeys = {
    archive: 'anomRaceHistory',
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mulberry32 = (seed) => {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const hashStringToSeed = (value) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) || Math.floor(Math.random() * 10_000);
};

const haversineDistance = (a, b) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const sinLat = Math.sin(dLat / 2) ** 2;
    const sinLon = Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.asin(Math.sqrt(sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon));
    return R * c;
};

const formatDistance = (km) => `${km.toFixed(2)} km`;
const formatSpeed = (speed) => `${speed.toFixed(1)} km/h`;
const formatMinutes = (minutes) => `${minutes.toFixed(1)} min`;
const formatSeconds = (seconds) => {
    const minutes = Math.floor(seconds / 60)
        .toString()
        .padStart(2, '0');
    const secs = Math.floor(seconds % 60)
        .toString()
        .padStart(2, '0');
    return `${minutes}:${secs}`;
};

const createToast = (element, message) => {
    element.textContent = message;
    element.classList.add('active');
    clearTimeout(createToast._timeout);
    createToast._timeout = setTimeout(() => {
        element.classList.remove('active');
    }, 3500);
};

const hexToRgba = (hex, alpha = 1) => {
    const sanitized = hex.replace('#', '');
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

class BoltRideTracker {
    constructor({ url, index, color, seed, label }) {
        this.url = url;
        this.index = index;
        this.color = color;
        this.label = label || `Kyyti ${index + 1}`;
        this.rideId = BoltRideTracker.extractRideIdFromUrl(url) || `sim-${index + 1}`;
        this.seed = seed || hashStringToSeed(this.rideId);
        this.random = mulberry32(this.seed);

        this.status = 'preparing';
        this.totalDistance = 0;
        this.remainingDistance = 0;
        this.directDistance = 0;
        this.progress = 0;
        this.elapsedSeconds = 0;
        this.finishTime = null;
        this.lastSnapshot = null;

        this.history = {
            timestamps: [],
            speeds: [],
            etas: [],
            efficiency: [],
        };

        this.route = [];
        this.segmentDistances = [];
        this.destination = null;
        this.currentLocation = null;

        this.initializeRoute();
    }

    static extractRideIdFromUrl(url) {
        try {
            const parsed = new URL(url);
            const params = new URLSearchParams(parsed.search);
            return params.get('s');
        } catch (error) {
            return null;
        }
    }

    initializeRoute() {
        const baseLat = 60.1699 + (this.random() - 0.5) * 0.16;
        const baseLng = 24.9384 + (this.random() - 0.5) * 0.24;
        const destinationLat = baseLat + (this.random() - 0.5) * 0.22;
        const destinationLng = baseLng + (this.random() - 0.5) * 0.22;
        const waypoints = 8 + Math.floor(this.random() * 6);

        this.route = [];
        for (let i = 0; i <= waypoints; i += 1) {
            const t = i / waypoints;
            const lat = baseLat + (destinationLat - baseLat) * t + (this.random() - 0.5) * 0.01;
            const lng = baseLng + (destinationLng - baseLng) * t + (this.random() - 0.5) * 0.01;
            this.route.push([lat, lng]);
        }

        this.destination = {
            lat: destinationLat,
            lng: destinationLng,
        };
        this.currentLocation = {
            lat: this.route[0][0],
            lng: this.route[0][1],
        };

        this.segmentDistances = [];
        this.totalDistance = 0;
        for (let i = 0; i < this.route.length - 1; i += 1) {
            const segment = haversineDistance(this.route[i], this.route[i + 1]);
            this.segmentDistances.push(segment);
            this.totalDistance += segment;
        }

        this.directDistance = haversineDistance(this.route[0], this.route[this.route.length - 1]);
        this.remainingDistance = this.totalDistance;
    }

    getLocationForProgress(progress) {
        if (progress <= 0 || !this.route.length) {
            return {
                lat: this.route[0][0],
                lng: this.route[0][1],
            };
        }

        if (progress >= 1) {
            return {
                lat: this.destination.lat,
                lng: this.destination.lng,
            };
        }

        const targetDistance = this.totalDistance * progress;
        let accumulated = 0;

        for (let i = 0; i < this.segmentDistances.length; i += 1) {
            const segmentDistance = this.segmentDistances[i];
            if (accumulated + segmentDistance >= targetDistance) {
                const remaining = targetDistance - accumulated;
                const ratio = remaining / segmentDistance;
                const start = this.route[i];
                const end = this.route[i + 1];
                return {
                    lat: start[0] + (end[0] - start[0]) * ratio,
                    lng: start[1] + (end[1] - start[1]) * ratio,
                };
            }
            accumulated += segmentDistance;
        }

        return {
            lat: this.destination.lat,
            lng: this.destination.lng,
        };
    }

    computeEfficiency() {
        const travelled = this.totalDistance - this.remainingDistance;
        if (travelled <= 0.02) {
            return 100;
        }
        const efficiency = (this.directDistance / travelled) * 100;
        return clamp(efficiency, 60, 140);
    }

    async fetchRideData() {
        await delay(220 + this.random() * 480);

        if (this.status === 'completed') {
            this.lastSnapshot = {
                status: this.status,
                distance: 0,
                speed: 0,
                eta: 0,
                progress: 1,
                location: { ...this.destination },
                destination: { ...this.destination },
                efficiency: this.computeEfficiency(),
            };
            return this.lastSnapshot;
        }

        const baseSpeed = 24 + this.random() * 18;
        const variance = (this.random() - 0.5) * 6;
        const speed = Math.max(12, baseSpeed + variance);
        const stepSeconds = UPDATE_INTERVAL_MS / 1000;
        const distanceCovered = (speed * stepSeconds) / 3600;
        this.remainingDistance = Math.max(0, this.remainingDistance - distanceCovered);
        this.elapsedSeconds += stepSeconds;
        this.progress = clamp(1 - this.remainingDistance / this.totalDistance, 0, 1);

        const etaMinutes = this.remainingDistance > 0 ? (this.remainingDistance / Math.max(speed, 1)) * 60 : 0;
        const location = this.getLocationForProgress(this.progress);
        this.currentLocation = location;
        const efficiency = this.computeEfficiency();

        this.history.timestamps.push(this.elapsedSeconds / 60);
        this.history.speeds.push(Number(speed.toFixed(2)));
        this.history.etas.push(Number(etaMinutes.toFixed(2)));
        this.history.efficiency.push(Number(efficiency.toFixed(2)));

        if (this.remainingDistance <= 0.02) {
            this.status = 'completed';
            this.remainingDistance = 0;
            this.progress = 1;
            this.finishTime = this.elapsedSeconds;
        } else if (this.status === 'preparing') {
            this.status = 'in_progress';
        }

        this.lastSnapshot = {
            status: this.status,
            distance: this.remainingDistance,
            speed,
            eta: etaMinutes,
            progress: this.progress,
            location,
            destination: { ...this.destination },
            efficiency,
        };

        return this.lastSnapshot;
    }

    getAverageSpeed() {
        if (!this.history.speeds.length) {
            return 0;
        }
        const sum = this.history.speeds.reduce((acc, value) => acc + value, 0);
        return sum / this.history.speeds.length;
    }
}

class AnomRace {
    constructor() {
        this.rides = [];
        this.map = null;
        this.mapLayers = new Map();
        this.markerLayers = new Map();
        this.updateInterval = null;
        this.currentLeaderId = null;
        this.shareSeedMap = {};
        this.currentSharePayload = null;
        this.audioContext = null;
        this.soundEnabled = true;
        this.notificationsEnabled = true;
        this.speedChart = null;
        this.etaChart = null;
        this.efficiencyChart = null;
        this.raceCompleted = false;

        this.elements = this.cacheElements();
        this.inputGroups = [];

        this.init();
    }

    cacheElements() {
        return {
            rideInputs: document.getElementById('ride-inputs'),
            addRideBtn: document.getElementById('add-ride-btn'),
            compareBtn: document.getElementById('compare-btn'),
            errorMessage: document.getElementById('error-message'),
            loadingSpinner: document.getElementById('loading-spinner'),
            results: document.getElementById('results'),
            statusTitle: document.getElementById('status-title'),
            leaderInfo: document.getElementById('leader-info'),
            etaInfo: document.getElementById('eta-info'),
            progressFill: document.getElementById('progress-fill'),
            rideCards: document.getElementById('ride-cards'),
            mapLegend: document.getElementById('map-legend'),
            bracketGrid: document.getElementById('bracket-grid'),
            sharePanel: document.getElementById('share-panel'),
            shareLink: document.getElementById('share-link'),
            shareRaceId: document.getElementById('share-race-id'),
            copyLinkBtn: document.getElementById('copy-link-btn'),
            shareResetBtn: document.getElementById('share-reset-btn'),
            soundToggle: document.getElementById('sound-toggle'),
            notificationToggle: document.getElementById('notification-toggle'),
            toast: document.getElementById('toast'),
            themeToggle: document.getElementById('theme-toggle'),
            archiveBody: document.getElementById('archive-body'),
            leaderboardList: document.getElementById('leaderboard-list'),
        };
    }

    init() {
        this.setupInputs();
        this.attachEventListeners();
        this.loadArchiveFromStorage();
        this.restoreShareFromUrl();
        this.initializeTheme();
    }

    setupInputs() {
        for (let i = 0; i < MIN_RIDES; i += 1) {
            this.addRideInput();
        }
    }

    attachEventListeners() {
        this.elements.addRideBtn.addEventListener('click', () => this.addRideInput());
        this.elements.compareBtn.addEventListener('click', () => this.startComparison());
        this.elements.copyLinkBtn.addEventListener('click', () => this.copyShareLink());
        this.elements.shareResetBtn.addEventListener('click', () => this.promptForShareLink());
        this.elements.soundToggle.addEventListener('change', (event) => {
            this.soundEnabled = event.target.checked;
        });
        this.elements.notificationToggle.addEventListener('change', (event) => {
            this.notificationsEnabled = event.target.checked;
        });
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

        window.addEventListener('beforeunload', () => this.stopLiveUpdates());
    }

    initializeTheme() {
        const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        if (prefersLight) {
            this.toggleTheme(true);
        }
    }

    toggleTheme(forceLight = null) {
        const body = document.body;
        const isCurrentlyDark = body.getAttribute('data-theme') === 'dark';
        const shouldSetLight = forceLight !== null ? forceLight : isCurrentlyDark;
        body.setAttribute('data-theme', shouldSetLight ? 'light' : 'dark');
        this.elements.themeToggle.textContent = shouldSetLight ? '☀️ Vaalea tila' : '🌙 Tumma tila';
        this.elements.themeToggle.setAttribute('aria-pressed', shouldSetLight ? 'true' : 'false');
        this.updateChartThemes();
    }

    addRideInput(value = '') {
        if (this.inputGroups.length >= MAX_RIDES) {
            createToast(this.elements.toast, 'Enintään neljä kyytiä voidaan vertailla kerralla.');
            return;
        }

        const index = this.inputGroups.length;
        const wrapper = document.createElement('div');
        wrapper.className = 'input-group';
        wrapper.dataset.index = index.toString();

        const label = document.createElement('label');
        label.className = 'input-label';
        label.htmlFor = `ride-url-${index}`;
        label.textContent = `Kyyti ${index + 1}`;

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `ride-url-${index}`;
        input.className = 'input-field';
        input.placeholder = 'https://ride.bolt.eu/route-sharing/?s=...';
        input.value = value;

        const actions = document.createElement('div');
        actions.className = 'input-actions';

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.title = 'Tyhjennä kenttä';
        clearBtn.innerText = '⌫';
        clearBtn.addEventListener('click', () => {
            input.value = '';
            input.focus();
        });

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.title = 'Poista kyyti';
        removeBtn.innerText = '✖';
        removeBtn.addEventListener('click', () => this.removeRideInput(wrapper));
        if (this.inputGroups.length < MIN_RIDES) {
            removeBtn.disabled = true;
            removeBtn.style.opacity = '0.4';
        }

        actions.append(clearBtn, removeBtn);
        wrapper.append(label, input, actions);
        this.elements.rideInputs.appendChild(wrapper);
        this.inputGroups.push({ wrapper, input, label, removeBtn });

        this.updateRideActionsState();
    }

    removeRideInput(wrapper) {
        if (this.inputGroups.length <= MIN_RIDES) {
            createToast(this.elements.toast, 'Kilpailussa on oltava vähintään kaksi kyytiä.');
            return;
        }
        const index = this.inputGroups.findIndex((group) => group.wrapper === wrapper);
        if (index >= 0) {
            wrapper.remove();
            this.inputGroups.splice(index, 1);
            this.inputGroups.forEach((group, idx) => {
                group.wrapper.dataset.index = idx.toString();
                group.label.textContent = `Kyyti ${idx + 1}`;
                group.label.htmlFor = `ride-url-${idx}`;
                group.input.id = `ride-url-${idx}`;
            });
            this.updateRideActionsState();
        }
    }

    updateRideActionsState() {
        this.inputGroups.forEach((group) => {
            if (this.inputGroups.length <= MIN_RIDES) {
                group.removeBtn.disabled = true;
                group.removeBtn.style.opacity = '0.4';
            } else {
                group.removeBtn.disabled = false;
                group.removeBtn.style.opacity = '1';
            }
        });
    }

    collectRideConfigs() {
        return this.inputGroups.map((group, index) => {
            const url = group.input.value.trim();
            const rideId = BoltRideTracker.extractRideIdFromUrl(url) || `sim-${index + 1}`;
            const seed = this.shareSeedMap[rideId] || hashStringToSeed(rideId);
            return {
                url,
                index,
                color: COLORS[index % COLORS.length],
                seed,
                label: `Kyyti ${index + 1}`,
                rideId,
            };
        });
    }

    validateRideConfigs(configs) {
        if (configs.length < MIN_RIDES) {
            this.showError('Kilpailuun tarvitaan vähintään kaksi kyytiä.');
            return false;
        }

        const invalid = configs.find((config) => !config.url || !BOLT_URL_PATTERN.test(config.url));
        if (invalid) {
            this.showError('Varmista, että jokainen linkki on Bolt-jako-osoite muodossa https://ride.bolt.eu/route-sharing/?s=...');
            return false;
        }

        return true;
    }

    async startComparison() {
        const configs = this.collectRideConfigs();
        if (!this.validateRideConfigs(configs)) {
            return;
        }

        this.clearError();
        this.showLoading(true);
        this.stopLiveUpdates();

        try {
            this.rides = configs.map((config) => new BoltRideTracker(config));
            this.raceCompleted = false;
            this.currentLeaderId = null;
            this.renderRideCards();
            this.initializeMap();
            this.elements.results.classList.add('active');

            await Promise.all(this.rides.map((ride) => ride.fetchRideData()));
            this.updateInterface();
            this.initializeCharts();
            this.updateCharts();
            this.updateShareLink(this.createSharePayload());
            this.showLoading(false);

            this.startLiveUpdates();
            this.requestNotificationPermission();
            this.triggerNotification('AnomRace käynnistyi', 'Kilpailu on käynnissä. Seuraa karttaa ja tilastoja!');
            this.playSound('start');
            createToast(this.elements.toast, 'AnomRace käynnistyi!');
        } catch (error) {
            console.error('Race start failed', error);
            this.showError('Kilpailun käynnistys epäonnistui. Yritä uudelleen.');
            this.showLoading(false);
        }
    }

    showLoading(state) {
        this.elements.compareBtn.disabled = state;
        this.elements.loadingSpinner.classList.toggle('active', state);
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.add('active');
    }

    clearError() {
        this.elements.errorMessage.classList.remove('active');
    }

    renderRideCards() {
        this.elements.rideCards.innerHTML = '';
        this.rideCardElements = new Map();

        this.rides.forEach((ride, index) => {
            const card = document.createElement('article');
            card.className = 'ride-card';
            card.dataset.rideId = ride.rideId;

            const heading = document.createElement('h3');
            heading.innerHTML = `${ride.label} <span>${ride.rideId.slice(0, 6)}…</span>`;

            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = `Väri ${index + 1}`;

            const info = document.createElement('div');
            info.className = 'ride-info';

            const rows = [
                { label: 'Status', id: 'status' },
                { label: 'Jäljellä', id: 'distance' },
                { label: 'Nopeus', id: 'speed' },
                { label: 'ETA', id: 'eta' },
                { label: 'Tehokkuus', id: 'efficiency' },
            ];

            const rowElements = {};
            rows.forEach((row) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'info-row';
                const label = document.createElement('span');
                label.className = 'info-label';
                label.textContent = row.label;
                const value = document.createElement('span');
                value.className = 'info-value';
                value.textContent = '-';
                wrapper.append(label, value);
                info.appendChild(wrapper);
                rowElements[row.id] = value;
            });

            card.append(heading, badge, info);
            this.elements.rideCards.appendChild(card);
            this.rideCardElements.set(ride.rideId, {
                card,
                rows: rowElements,
                badge,
            });
        });
    }

    initializeMap() {
        const mapElement = document.getElementById('race-map');
        if (!this.map) {
            this.map = L.map(mapElement, {
                zoomControl: false,
                attributionControl: false,
            });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '© OpenStreetMap - AnomFIN Hypervisuals',
            }).addTo(this.map);
        }

        this.mapLayers.forEach((layer) => this.map.removeLayer(layer));
        this.markerLayers.forEach((layer) => this.map.removeLayer(layer));
        this.mapLayers.clear();
        this.markerLayers.clear();

        const bounds = [];
        this.rides.forEach((ride) => {
            const polyline = L.polyline(ride.route, {
                color: ride.color,
                weight: 4,
                opacity: 0.8,
            }).addTo(this.map);
            const marker = L.circleMarker([ride.route[0][0], ride.route[0][1]], {
                radius: 8,
                color: '#05070e',
                weight: 2,
                fillColor: ride.color,
                fillOpacity: 1,
            }).addTo(this.map);
            marker.bindTooltip(`${ride.label}`, { direction: 'top' });
            this.mapLayers.set(ride.rideId, polyline);
            this.markerLayers.set(ride.rideId, marker);
            ride.route.forEach((point) => bounds.push(point));
        });

        if (bounds.length) {
            this.map.fitBounds(bounds, { padding: [40, 40] });
        }

        this.updateMapLegend();
    }

    updateMapLegend() {
        if (!this.elements.mapLegend) return;
        this.elements.mapLegend.innerHTML = this.rides
            .map(
                (ride) =>
                    `<span class="legend-item"><span class="legend-swatch" style="background:${ride.color}"></span>${ride.label}</span>`
            )
            .join('');
    }

    updateMapPositions() {
        this.rides.forEach((ride) => {
            const marker = this.markerLayers.get(ride.rideId);
            if (marker && ride.currentLocation) {
                marker.setLatLng([ride.currentLocation.lat, ride.currentLocation.lng]);
            }
        });
    }

    initializeCharts() {
        if (this.speedChart && this.etaChart && this.efficiencyChart) {
            return;
        }

        this.speedChart = this.createChartInstance('speed-chart', 'Aika (min)', 'Nopeus (km/h)');
        this.etaChart = this.createChartInstance('eta-chart', 'Aika (min)', 'Jäljellä (min)');
        this.efficiencyChart = this.createChartInstance('efficiency-chart', 'Aika (min)', 'Tehokkuus (%)');
    }

    createChartInstance(canvasId, xLabel, yLabel) {
        const ctx = document.getElementById(canvasId);
        const { textColor, gridColor } = this.getChartThemeColors();
        return new Chart(ctx, {
            type: 'line',
            data: { datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: xLabel, color: textColor },
                        grid: { color: gridColor },
                        ticks: { color: textColor },
                    },
                    y: {
                        title: { display: true, text: yLabel, color: textColor },
                        grid: { color: gridColor },
                        ticks: { color: textColor },
                    },
                },
                plugins: {
                    legend: {
                        labels: {
                            color: textColor,
                        },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                    },
                },
            },
        });
    }

    getChartThemeColors() {
        const styles = getComputedStyle(document.body);
        const textColor = styles.getPropertyValue('--anomrace-text').trim() || '#f4f7fb';
        const gridColor = styles.getPropertyValue('--anomrace-border').trim() || 'rgba(255,255,255,0.12)';
        return { textColor, gridColor };
    }

    updateChartThemes() {
        if (!this.speedChart || !this.etaChart || !this.efficiencyChart) return;
        const { textColor, gridColor } = this.getChartThemeColors();
        [this.speedChart, this.etaChart, this.efficiencyChart].forEach((chart) => {
            chart.options.scales.x.title.color = textColor;
            chart.options.scales.y.title.color = textColor;
            chart.options.scales.x.grid.color = gridColor;
            chart.options.scales.y.grid.color = gridColor;
            chart.options.scales.x.ticks.color = textColor;
            chart.options.scales.y.ticks.color = textColor;
            chart.options.plugins.legend.labels.color = textColor;
            chart.update('none');
        });
    }

    updateCharts() {
        if (!this.speedChart || !this.etaChart || !this.efficiencyChart) {
            return;
        }

        const datasetsFor = (metric) =>
            this.rides.map((ride) => ({
                label: ride.label,
                data: ride.history.timestamps.map((time, index) => ({ x: time, y: ride.history[metric][index] })),
                borderColor: ride.color,
                backgroundColor: hexToRgba(ride.color, 0.25),
                tension: 0.35,
                fill: false,
            }));

        this.speedChart.data.datasets = datasetsFor('speeds');
        this.etaChart.data.datasets = datasetsFor('etas');
        this.efficiencyChart.data.datasets = datasetsFor('efficiency');

        this.speedChart.update('none');
        this.etaChart.update('none');
        this.efficiencyChart.update('none');
    }

    async startLiveUpdates() {
        this.stopLiveUpdates();
        this.updateInterval = setInterval(async () => {
            try {
                await Promise.all(this.rides.map((ride) => ride.fetchRideData()));
                this.updateInterface();
                this.updateCharts();
            } catch (error) {
                console.error('Live update error', error);
            }
        }, UPDATE_INTERVAL_MS);
    }

    stopLiveUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateInterface() {
        this.rides.forEach((ride) => {
            const snapshot = ride.lastSnapshot;
            const elements = this.rideCardElements.get(ride.rideId);
            if (!snapshot || !elements) return;

            elements.rows.status.textContent = this.formatStatus(snapshot.status);
            elements.rows.distance.textContent = formatDistance(snapshot.distance);
            elements.rows.speed.textContent = formatSpeed(snapshot.speed || 0);
            elements.rows.eta.textContent = formatMinutes(snapshot.eta || 0);
            elements.rows.efficiency.textContent = `${snapshot.efficiency.toFixed(1)} %`;
        });

        this.highlightLeader();
        this.updateRaceStatusBlock();
        this.updateBracket();
        this.updateMapPositions();

        if (!this.raceCompleted && this.rides.every((ride) => ride.status === 'completed')) {
            this.completeRace();
        }
    }

    highlightLeader() {
        const leader = this.getLeader();
        this.rideCardElements.forEach((elements) => elements.card.classList.remove('leading'));
        if (leader) {
            const leaderElements = this.rideCardElements.get(leader.rideId);
            if (leaderElements) {
                leaderElements.card.classList.add('leading');
            }

            if (this.currentLeaderId && this.currentLeaderId !== leader.rideId) {
                this.triggerNotification('Kärkipaikka vaihtui', `${leader.label} johtaa kilpailua!`);
                this.playSound('leader');
                createToast(this.elements.toast, `${leader.label} nappasi kärkipaikan.`);
            }
            this.currentLeaderId = leader.rideId;
        }
    }

    getLeader() {
        if (!this.rides.length) return null;
        return this.rides
            .slice()
            .sort((a, b) => {
                const aFinished = typeof a.finishTime === 'number';
                const bFinished = typeof b.finishTime === 'number';
                if (aFinished && bFinished) {
                    return (a.finishTime || Infinity) - (b.finishTime || Infinity);
                }
                if (aFinished) return -1;
                if (bFinished) return 1;
                const remainingDiff = a.remainingDistance - b.remainingDistance;
                if (remainingDiff !== 0) {
                    return remainingDiff;
                }
                const etaA = (a.lastSnapshot?.eta ?? a.history.etas.at(-1)) ?? Infinity;
                const etaB = (b.lastSnapshot?.eta ?? b.history.etas.at(-1)) ?? Infinity;
                return etaA - etaB;
            })[0];
    }

    updateRaceStatusBlock() {
        if (!this.rides.length) return;
        const leader = this.getLeader();
        const averageProgress = this.rides.reduce((acc, ride) => acc + ride.progress, 0) / this.rides.length;
        this.elements.progressFill.style.width = `${(averageProgress * 100).toFixed(1)}%`;
        this.elements.progressFill.parentElement.setAttribute('aria-valuenow', (averageProgress * 100).toFixed(0));

        if (leader) {
            this.elements.statusTitle.textContent = this.rides.every((ride) => ride.status === 'completed')
                ? '🏁 AnomRace valmis'
                : '🚀 Hyperkilpailu käynnissä';
            this.elements.leaderInfo.textContent = `${leader.label} johtaa – ETA ${formatMinutes(leader.lastSnapshot?.eta || 0)}`;
            const trailing = this.rides
                .filter((ride) => ride.rideId !== leader.rideId)
                .sort((a, b) => (a.lastSnapshot?.eta || Infinity) - (b.lastSnapshot?.eta || Infinity))[0];
            if (trailing && trailing.lastSnapshot) {
                const diff = Math.abs((trailing.lastSnapshot.eta || 0) - (leader.lastSnapshot?.eta || 0));
                this.elements.etaInfo.textContent = `Ero seuraavaan: ${formatMinutes(diff)}`;
            } else {
                this.elements.etaInfo.textContent = 'Seuraa reaaliaikaisia ETA-lukuja.';
            }
        }
    }

    updateBracket() {
        const grid = this.elements.bracketGrid;
        grid.innerHTML = '';
        if (!this.rides.length) return;

        const sorted = this.rides
            .slice()
            .sort((a, b) => a.remainingDistance - b.remainingDistance || (a.lastSnapshot?.eta || 0) - (b.lastSnapshot?.eta || 0));

        const rounds = document.createElement('div');
        rounds.className = 'bracket-column';
        const finalMatch = document.createElement('div');
        finalMatch.className = 'bracket-match';
        finalMatch.innerHTML = `<strong>Hyperfinaali</strong><span>${sorted[0].label} vs. ${sorted[sorted.length - 1].label}</span><span>ETA johtajalla ${formatMinutes(
            sorted[0].lastSnapshot?.eta || 0
        )}</span>`;
        rounds.appendChild(finalMatch);

        if (sorted.length > 2) {
            const semifinals = document.createElement('div');
            semifinals.className = 'bracket-column';
            for (let i = 0; i < sorted.length; i += 2) {
                const match = document.createElement('div');
                match.className = 'bracket-match';
                const challenger = sorted[i + 1] || sorted[0];
                match.innerHTML = `<strong>Semifinaali ${i / 2 + 1}</strong><span>${sorted[i].label} vs. ${challenger.label}</span><span>Matkaa jäljellä ${formatDistance(
                    sorted[i].remainingDistance
                )}</span>`;
                semifinals.appendChild(match);
            }
            grid.appendChild(semifinals);
        }

        const rankings = document.createElement('div');
        rankings.className = 'bracket-column';
        sorted.forEach((ride, index) => {
            const rankingRow = document.createElement('div');
            rankingRow.className = 'bracket-match';
            rankingRow.innerHTML = `<strong>${index + 1}. ${ride.label}</strong><span>Kokonaismatka ${formatDistance(
                ride.totalDistance
            )}</span><span>Keskinopeus ${formatSpeed(ride.getAverageSpeed() || 0)}</span>`;
            rankings.appendChild(rankingRow);
        });

        grid.append(rounds, rankings);
    }

    async completeRace() {
        this.stopLiveUpdates();
        if (this.raceCompleted) return;
        this.raceCompleted = true;
        const leader = this.getLeader();
        if (leader) {
            this.elements.statusTitle.textContent = '🏁 AnomRace valmis';
            this.elements.leaderInfo.textContent = `${leader.label} ehti perille ensimmäisenä!`;
            this.elements.etaInfo.textContent = `Voittoaika ${formatSeconds(leader.finishTime || 0)}.`;
        }

        this.triggerNotification('AnomRace päättyi', `${leader?.label || 'Kilpailu'} on maalissa.`);
        this.playSound('finish');
        createToast(this.elements.toast, 'Kilpailu tallennettiin arkistoon.');
        this.persistRaceResult();
    }

    createSharePayload() {
        const raceId = `ANOMRACE-${Date.now()}`;
        return {
            id: raceId,
            rides: this.rides.map((ride) => ({
                url: ride.url,
                seed: ride.seed,
                label: ride.label,
                rideId: ride.rideId,
            })),
            createdAt: new Date().toISOString(),
        };
    }

    updateShareLink(payload) {
        this.currentSharePayload = payload;
        try {
            const encoded = encodeURIComponent(btoa(JSON.stringify(payload)));
            const shareUrl = `${window.location.origin}${window.location.pathname}?race=${encoded}`;
            this.elements.shareLink.textContent = shareUrl;
            this.elements.shareRaceId.textContent = payload.id;
            this.elements.sharePanel.classList.add('active');
            window.history.replaceState({}, '', `?race=${encoded}`);
        } catch (error) {
            console.error('Share link generation failed', error);
        }
    }

    copyShareLink() {
        const link = this.elements.shareLink.textContent;
        navigator.clipboard
            .writeText(link)
            .then(() => createToast(this.elements.toast, 'Jako-osoite kopioitu leikepöydälle.'))
            .catch(() => this.showError('Linkin kopiointi epäonnistui.'));
    }

    promptForShareLink() {
        const url = window.prompt('Liitä AnomRace-jakolinkki');
        if (!url) return;
        this.loadShareFromLink(url);
    }

    loadShareFromLink(url) {
        try {
            const parsed = new URL(url);
            const raceParam = parsed.searchParams.get('race');
            if (!raceParam) {
                throw new Error('Puuttuva race-parametri');
            }
            const payload = JSON.parse(atob(decodeURIComponent(raceParam)));
            this.applySharePayload(payload, true);
            window.history.replaceState({}, '', `?race=${encodeURIComponent(btoa(JSON.stringify(payload)))}`);
            createToast(this.elements.toast, 'Kilpailukonfiguraatio ladattu jakolinkistä.');
        } catch (error) {
            console.error('Failed to load share link', error);
            this.showError('Jakolinkin lukeminen epäonnistui. Tarkista osoite.');
        }
    }

    restoreShareFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const race = params.get('race');
        if (!race) return;
        try {
            const payload = JSON.parse(atob(decodeURIComponent(race)));
            this.applySharePayload(payload, false);
            createToast(this.elements.toast, 'Esiladattu AnomRace-konfiguraatio käytössä.');
        } catch (error) {
            console.error('Failed to parse share payload', error);
        }
    }

    applySharePayload(payload, fromPrompt) {
        if (!payload || !Array.isArray(payload.rides) || !payload.rides.length) {
            throw new Error('Virheellinen jakodataa');
        }

        this.shareSeedMap = payload.rides.reduce((acc, ride) => {
            const rideId = ride.rideId || BoltRideTracker.extractRideIdFromUrl(ride.url);
            if (rideId) {
                acc[rideId] = ride.seed;
            }
            return acc;
        }, {});

        this.inputGroups.forEach((group) => group.wrapper.remove());
        this.inputGroups = [];

        payload.rides.forEach((ride) => this.addRideInput(ride.url));
        this.updateRideActionsState();
        if (fromPrompt) {
            this.elements.shareRaceId.textContent = payload.id || '-';
            this.elements.shareLink.textContent = window.location.href;
            this.elements.sharePanel.classList.add('active');
        }
    }

    requestNotificationPermission() {
        if (!('Notification' in window) || !this.notificationsEnabled) return;
        if (Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {
                this.notificationsEnabled = false;
                this.elements.notificationToggle.checked = false;
            });
        }
    }

    triggerNotification(title, body) {
        if (!('Notification' in window) || !this.notificationsEnabled) return;
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: 'assets/logo.png',
            });
        }
    }

    playSound(type) {
        if (!this.soundEnabled) return;
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const context = this.audioContext;
            const now = context.currentTime;
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            const frequencyMap = {
                start: 660,
                leader: 880,
                finish: 520,
            };
            oscillator.frequency.value = frequencyMap[type] || 600;
            gainNode.gain.setValueAtTime(0.0001, now);
            gainNode.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.start(now);
            oscillator.stop(now + 0.32);
        } catch (error) {
            console.error('Audio playback failed', error);
        }
    }

    formatStatus(status) {
        switch (status) {
            case 'preparing':
                return '⏳ Valmistautuu';
            case 'in_progress':
                return '🚗 Liikkeellä';
            case 'completed':
                return '✅ Perillä';
            default:
                return status;
        }
    }

    persistRaceResult() {
        if (!this.rides.length) return;
        const winner = this.getLeader();
        const entry = {
            timestamp: Date.now(),
            winner: winner?.label || 'Tuntematon',
            winnerId: winner?.rideId || '',
            duration: winner?.finishTime || 0,
            rides: this.rides.map((ride) => ({
                id: ride.rideId,
                label: ride.label,
                averageSpeed: ride.getAverageSpeed(),
                totalDistance: ride.totalDistance,
                finishTime: ride.finishTime,
            })),
        };

        const archive = this.loadArchiveFromStorage();
        archive.unshift(entry);
        const trimmed = archive.slice(0, 25);
        localStorage.setItem(localStorageKeys.archive, JSON.stringify(trimmed));
        this.renderArchive(trimmed);
        this.renderLeaderboard(trimmed);
    }

    loadArchiveFromStorage() {
        const raw = localStorage.getItem(localStorageKeys.archive);
        let archive = [];
        if (raw) {
            try {
                archive = JSON.parse(raw);
                if (!Array.isArray(archive)) archive = [];
            } catch (error) {
                console.error('Failed to parse archive', error);
            }
        }
        this.renderArchive(archive);
        this.renderLeaderboard(archive);
        return archive;
    }

    renderArchive(archive) {
        const body = this.elements.archiveBody;
        body.innerHTML = '';
        if (!archive.length) {
            const row = document.createElement('tr');
            row.className = 'empty-state';
            const cell = document.createElement('td');
            cell.colSpan = 5;
            cell.textContent = 'Ei vielä tallennettuja kilpailuja.';
            row.appendChild(cell);
            body.appendChild(row);
            return;
        }

        archive.forEach((entry) => {
            const row = document.createElement('tr');
            const winnerRide = entry.rides.find((ride) => ride.id === entry.winnerId) || entry.rides[0];
            const columns = [
                new Date(entry.timestamp).toLocaleString('fi-FI'),
                entry.winner,
                formatSeconds(entry.duration || winnerRide?.finishTime || 0),
                `${(winnerRide?.averageSpeed || 0).toFixed(1)} km/h`,
                formatDistance(winnerRide?.totalDistance || 0),
            ];
            columns.forEach((value) => {
                const cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            });
            body.appendChild(row);
        });
    }

    renderLeaderboard(archive) {
        const list = this.elements.leaderboardList;
        list.innerHTML = '';
        if (!archive.length) {
            const item = document.createElement('li');
            item.className = 'empty-state';
            item.textContent = 'Kilpailut kirjataan automaattisesti tänne.';
            list.appendChild(item);
            return;
        }

        const performances = [];
        archive.forEach((entry) => {
            entry.rides.forEach((ride) => {
                if (ride.finishTime) {
                    performances.push({
                        ride: ride.label,
                        time: ride.finishTime,
                        speed: ride.averageSpeed,
                        timestamp: entry.timestamp,
                    });
                }
            });
        });

        performances
            .sort((a, b) => a.time - b.time)
            .slice(0, 5)
            .forEach((perf, index) => {
                const item = document.createElement('li');
                item.innerHTML = `<strong>${index + 1}. ${perf.ride}</strong> – ${formatSeconds(perf.time)} (${perf.speed.toFixed(1)} km/h)`;
                list.appendChild(item);
            });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new AnomRace();
});

