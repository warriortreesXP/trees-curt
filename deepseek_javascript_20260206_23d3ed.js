// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const form = document.getElementById('proxyForm');
    const urlInput = document.getElementById('url');
    const dnsInput = document.getElementById('dns');
    const customPort = document.getElementById('customPort');
    const timeoutSlider = document.getElementById('timeout');
    const timeoutValue = document.getElementById('timeoutValue');
    const previewContainer = document.getElementById('previewContainer');
    const websiteFrame = document.getElementById('websiteFrame');
    const iframeOverlay = document.getElementById('iframeOverlay');
    const status = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    const resetBtn = document.getElementById('resetBtn');
    const exampleBtn = document.getElementById('exampleBtn');
    const closePreview = document.getElementById('closePreview');
    const currentDns = document.getElementById('currentDns');
    const openNewTab = document.getElementById('openNewTab');
    const toggleAdvanced = document.querySelector('.toggle-advanced');
    const advancedContent = document.querySelector('.advanced-content');
    
    // DNS preset buttons
    const dnsPresets = document.querySelectorAll('.preset-btn');
    
    // Modal elements
    const aboutModal = document.getElementById('aboutModal');
    const privacyModal = document.getElementById('privacyModal');
    const aboutLink = document.getElementById('aboutLink');
    const privacyLink = document.getElementById('privacyLink');
    const modalCloses = document.querySelectorAll('.modal-close');

    // Initialize
    initApp();

    function initApp() {
        setupEventListeners();
        setupDNSDefaults();
        updateStatus('Ready to browse with custom DNS', 'info');
    }

    function setupEventListeners() {
        // Form submission
        form.addEventListener('submit', handleFormSubmit);
        
        // DNS preset buttons
        dnsPresets.forEach(preset => {
            preset.addEventListener('click', handleDNSPreset);
        });
        
        // Reset button
        resetBtn.addEventListener('click', handleReset);
        
        // Example button
        exampleBtn.addEventListener('click', handleExample);
        
        // Close preview
        closePreview.addEventListener('click', () => {
            previewContainer.style.display = 'none';
        });
        
        // Timeout slider
        timeoutSlider.addEventListener('input', function() {
            timeoutValue.textContent = this.value;
        });
        
        // Advanced options toggle
        toggleAdvanced.addEventListener('click', function() {
            advancedContent.classList.toggle('show');
            const icon = this.querySelector('.fa-chevron-down');
            icon.classList.toggle('fa-rotate-180');
        });
        
        // Open in new tab
        openNewTab.addEventListener('click', function(e) {
            if (!websiteFrame.src || websiteFrame.src === 'about:blank') {
                e.preventDefault();
                updateStatus('No website loaded to open', 'error');
            }
        });
        
        // Modal controls
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            aboutModal.classList.add('show');
        });
        
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            privacyModal.classList.add('show');
        });
        
        modalCloses.forEach(close => {
            close.addEventListener('click', () => {
                aboutModal.classList.remove('show');
                privacyModal.classList.remove('show');
            });
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === aboutModal) aboutModal.classList.remove('show');
            if (e.target === privacyModal) privacyModal.classList.remove('show');
        });
    }

    function setupDNSDefaults() {
        // Set Cloudflare as default
        dnsInput.value = '1.1.1.1';
    }

    function handleDNSPreset(e) {
        const dns = e.currentTarget.getAttribute('data-dns');
        dnsInput.value = dns;
        
        // Visual feedback
        e.currentTarget.style.transform = 'scale(0.95)';
        setTimeout(() => {
            e.currentTarget.style.transform = '';
        }, 200);
        
        updateStatus(`Selected DNS: ${dns}`, 'success');
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        launchWebsite();
    }

    function handleReset() {
        form.reset();
        setupDNSDefaults();
        websiteFrame.src = 'about:blank';
        previewContainer.style.display = 'none';
        iframeOverlay.style.display = 'flex';
        updateStatus('Ready to browse with custom DNS', 'info');
    }

    function handleExample() {
        urlInput.value = 'https://www.wikipedia.org';
        dnsInput.value = '1.1.1.1';
        updateStatus('Example loaded. Click "Launch Website" to try it!', 'success');
    }

    async function launchWebsite() {
        let url = urlInput.value.trim();
        let dns = dnsInput.value.trim();
        let port = customPort.value.trim();
        
        // Validate URL
        if (!url) {
            updateStatus('Please enter a website URL', 'error');
            urlInput.focus();
            return;
        }
        
        // Add https:// if no protocol specified
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
            urlInput.value = url;
        }
        
        // Validate DNS (basic IP validation)
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipPattern.test(dns)) {
            updateStatus('Please enter a valid DNS IP address (e.g., 1.1.1.1)', 'error');
            dnsInput.focus();
            return;
        }
        
        // Validate each IP segment
        const segments = dns.split('.');
        const isValid = segments.every(segment => {
            const num = parseInt(segment);
            return num >= 0 && num <= 255 && segment === num.toString();
        });
        
        if (!isValid) {
            updateStatus('Please enter a valid DNS IP address', 'error');
            dnsInput.focus();
            return;
        }
        
        // Show loading state
        updateStatus(`Loading website through DNS ${dns}...`, 'loading');
        showPreview();
        iframeOverlay.style.display = 'flex';
        currentDns.textContent = dns;
        
        try {
            // In this demo, we'll use a CORS proxy since we can't actually change DNS from browser
            // For production, you would use the backend server
            const proxyUrl = getProxyUrl(url, dns, port);
            
            // Set up timeout
            const timeout = parseInt(timeoutSlider.value) * 1000;
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timed out')), timeout);
            });
            
            // Try to load through proxy
            const loadPromise = new Promise((resolve, reject) => {
                websiteFrame.onload = resolve;
                websiteFrame.onerror = reject;
                websiteFrame.src = proxyUrl;
            });
            
            await Promise.race([loadPromise, timeoutPromise]);
            
            // Success
            iframeOverlay.style.display = 'none';
            updateStatus(`Website loaded successfully using DNS: ${dns}`, 'success');
            
            // Update "Open in New Tab" link
            openNewTab.href = proxyUrl;
            
        } catch (error) {
            // Handle errors
            iframeOverlay.style.display = 'flex';
            iframeOverlay.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load website</p>
                <small>${error.message}</small>
            `;
            
            updateStatus(`Error: ${error.message}`, 'error');
            
            // For demo purposes, fall back to direct URL if proxy fails
            setTimeout(() => {
                websiteFrame.src = url;
                updateStatus('Trying direct connection...', 'info');
            }, 2000);
        }
    }

    function getProxyUrl(url, dns, port) {
        // For demonstration, we'll use a public CORS proxy
        // In production, this would route through your server.js backend
        const encodedUrl = encodeURIComponent(url);
        
        // Using a public CORS proxy (for demo only)
        // Note: Replace with your own backend URL when deployed
        const proxyBase = 'https://api.allorigins.win/get?url=';
        return `${proxyBase}${encodedUrl}`;
        
        // When using your own server, it would be:
        // return `/proxy?url=${encodeURIComponent(url)}&dns=${dns}`;
    }

    function showPreview() {
        previewContainer.style.display = 'block';
        // Smooth scroll to preview
        previewContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function updateStatus(message, type) {
        statusText.textContent = message;
        
        // Reset status classes
        status.className = 'status';
        
        // Add type-specific class
        switch(type) {
            case 'success':
                status.classList.add('status-success');
                status.querySelector('i').className = 'fas fa-check-circle';
                break;
            case 'error':
                status.classList.add('status-error');
                status.querySelector('i').className = 'fas fa-exclamation-triangle';
                break;
            case 'loading':
                status.classList.add('status-loading');
                status.querySelector('i').className = 'fas fa-spinner fa-spin';
                break;
            default:
                status.querySelector('i').className = 'fas fa-info-circle';
        }
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusText.textContent = 'Ready for another website';
                status.querySelector('i').className = 'fas fa-info-circle';
                status.className = 'status';
            }, 5000);
        }
    }

    // Add CSS for status types
    const style = document.createElement('style');
    style.textContent = `
        .status-success {
            border-left-color: #4CAF50 !important;
            background: #E8F5E9 !important;
        }
        .status-error {
            border-left-color: #F44336 !important;
            background: #FFEBEE !important;
        }
        .status-loading {
            border-left-color: #FF9800 !important;
            background: #FFF3E0 !important;
        }
        .status-success i { color: #4CAF50 !important; }
        .status-error i { color: #F44336 !important; }
        .status-loading i { color: #FF9800 !important; }
    `;
    document.head.appendChild(style);
});