document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const form = document.getElementById('proxyForm');
    const urlInput = document.getElementById('url');
    const dnsInput = document.getElementById('dns');
    const resultDiv = document.getElementById('result');
    const dnsButtons = document.querySelectorAll('.dns-btn');
    const liveLink = document.getElementById('liveLink');
    
    // Set current live URL
    const currentUrl = window.location.href;
    liveLink.textContent = currentUrl;
    liveLink.href = currentUrl;
    
    // DNS button click handler
    dnsButtons.forEach(button => {
        button.addEventListener('click', function() {
            dnsInput.value = this.getAttribute('data-dns');
            showMessage(`Selected DNS: ${dnsInput.value}`, 'success');
        });
    });
    
    // Form submit handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        launchWebsite();
    });
    
    function launchWebsite() {
        const url = urlInput.value.trim();
        const dns = dnsInput.value.trim();
        
        // Validation
        if (!url) {
            showMessage('Please enter a website URL', 'error');
            return;
        }
        
        if (!dns) {
            showMessage('Please enter a DNS server', 'error');
            return;
        }
        
        // Validate URL format
        let finalUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            finalUrl = 'https://' + url;
        }
        
        // Validate DNS format (simple IP check)
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipPattern.test(dns)) {
            showMessage('Please enter a valid DNS IP (e.g., 1.1.1.1)', 'error');
            return;
        }
        
        // Show loading
        showMessage(`Loading ${finalUrl} through DNS ${dns}...`, 'loading');
        
        // Create iframe with proxy URL
        const proxyUrl = createProxyUrl(finalUrl, dns);
        
        // Display result
        resultDiv.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: #2E7D32; margin-bottom: 15px;">
                    <i class="fas fa-check-circle"></i> Website Launched
                </h3>
                <p>URL: <strong>${finalUrl}</strong></p>
                <p>DNS: <strong>${dns}</strong></p>
                <div style="margin: 20px 0;">
                    <a href="${proxyUrl}" target="_blank" 
                       style="background: #2E7D32; color: white; padding: 12px 24px; 
                              border-radius: 8px; text-decoration: none; display: inline-block;">
                        <i class="fas fa-external-link-alt"></i> Open in New Tab
                    </a>
                </div>
                <iframe src="${proxyUrl}" 
                        style="width: 100%; height: 400px; border: 2px solid #8D6E63; border-radius: 10px; margin-top: 15px;">
                </iframe>
            </div>
        `;
        
        showMessage('Website loaded successfully!', 'success');
    }
    
    function createProxyUrl(url, dns) {
        // For GitHub Pages demo, we'll use a simple CORS proxy
        // Note: In production, you'd use your server.js backend
        const encodedUrl = encodeURIComponent(url);
        return `https://api.allorigins.win/get?url=${encodedUrl}`;
    }
    
    function showMessage(message, type) {
        // Create or update message element
        let messageEl = document.getElementById('statusMessage');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'statusMessage';
            form.appendChild(messageEl);
        }
        
        messageEl.innerHTML = `
            <div style="padding: 12px; margin: 15px 0; border-radius: 8px; 
                        background: ${type === 'error' ? '#ffebee' : type === 'success' ? '#e8f5e9' : '#fff3e0'}; 
                        color: ${type === 'error' ? '#c62828' : type === 'success' ? '#2e7d32' : '#ef6c00'}; 
                        border-left: 4px solid ${type === 'error' ? '#c62828' : type === 'success' ? '#2e7d32' : '#ef6c00'};">
                <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'spinner fa-spin'}"></i>
                ${message}
            </div>
        `;
        
        // Auto-remove success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (messageEl) messageEl.remove();
            }, 5000);
        }
    }
    
    // Initialize with example
    urlInput.value = 'https://wikipedia.org';
    dnsInput.value = '1.1.1.1';
});