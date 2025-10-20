/**
 * AnomFIN Link Shortener Frontend
 * 
 * Handles link shortening form submission and result display
 * 
 * @package AnomFIN
 * @version 1.0.0
 */

(function() {
    'use strict';

    // Elements
    const form = document.getElementById('short-link-form');
    const targetInput = document.getElementById('shortener-target');
    const aliasInput = document.getElementById('shortener-alias');
    const submitBtn = form?.querySelector('.shortener-submit');
    const resultDiv = document.getElementById('shortener-result');
    const resultLink = document.getElementById('shortener-link');
    const copyBtn = document.getElementById('shortener-copy');
    const statusMsg = document.getElementById('shortener-status');

    if (!form || !targetInput || !submitBtn || !resultDiv || !resultLink || !copyBtn || !statusMsg) {
        console.warn('Link shortener: Some required elements not found');
        return;
    }

    /**
     * Show status message
     */
    function showStatus(message, type = 'info') {
        statusMsg.textContent = message;
        statusMsg.className = 'shortener-status';
        
        if (type === 'error') {
            statusMsg.classList.add('status-error');
        } else if (type === 'success') {
            statusMsg.classList.add('status-success');
        }
        
        statusMsg.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusMsg.style.display = 'none';
        }, 5000);
    }

    /**
     * Show result
     */
    function showResult(shortUrl) {
        resultLink.href = shortUrl;
        resultLink.textContent = shortUrl;
        resultDiv.hidden = false;
        
        // Smooth scroll to result
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Hide result
     */
    function hideResult() {
        resultDiv.hidden = true;
    }

    /**
     * Reset form state
     */
    function resetForm() {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Luo lyhyt linkki';
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(event) {
        event.preventDefault();
        
        // Get form values
        const url = targetInput.value.trim();
        const alias = aliasInput.value.trim();
        
        // Basic validation
        if (!url) {
            showStatus('Syötä URL-osoite', 'error');
            targetInput.focus();
            return;
        }
        
        // URL format validation
        if (!/^https?:\/\/.+/i.test(url)) {
            showStatus('URL-osoitteen tulee alkaa http:// tai https://', 'error');
            targetInput.focus();
            return;
        }
        
        // Alias validation (optional)
        if (alias && !/^[a-zA-Z0-9]{1,4}$/i.test(alias)) {
            showStatus('Alias voi sisältää vain kirjaimia ja numeroita (1-4 merkkiä)', 'error');
            aliasInput.focus();
            return;
        }
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Luodaan...';
        hideResult();
        
        try {
            // Send request to API
            const response = await fetch('/api/shorten.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: url,
                    code: alias || undefined
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.short_url) {
                // Success
                showResult(data.short_url);
                showStatus('Lyhyt linkki luotu onnistuneesti!', 'success');
                
                // Clear form
                targetInput.value = '';
                aliasInput.value = '';
            } else {
                // Error from API
                showStatus(data.error || 'Lyhytlinkin luominen epäonnistui', 'error');
            }
            
        } catch (error) {
            console.error('Link shortener error:', error);
            showStatus('Verkkovirhe. Tarkista yhteytesi ja yritä uudelleen.', 'error');
        } finally {
            resetForm();
        }
    }

    /**
     * Copy short link to clipboard
     */
    async function handleCopy(event) {
        event.preventDefault();
        
        const shortUrl = resultLink.textContent;
        
        try {
            // Modern clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shortUrl);
                showStatus('Linkki kopioitu leikepöydälle!', 'success');
                
                // Visual feedback
                copyBtn.textContent = 'Kopioitu!';
                setTimeout(() => {
                    copyBtn.textContent = 'Kopioi';
                }, 2000);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = shortUrl;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    showStatus('Linkki kopioitu leikepöydälle!', 'success');
                    
                    // Visual feedback
                    copyBtn.textContent = 'Kopioitu!';
                    setTimeout(() => {
                        copyBtn.textContent = 'Kopioi';
                    }, 2000);
                } catch (err) {
                    showStatus('Kopiointi epäonnistui. Kopioi manuaalisesti.', 'error');
                }
                
                document.body.removeChild(textArea);
            }
        } catch (error) {
            console.error('Copy error:', error);
            showStatus('Kopiointi epäonnistui. Kopioi manuaalisesti.', 'error');
        }
    }

    // Event listeners
    form.addEventListener('submit', handleSubmit);
    copyBtn.addEventListener('click', handleCopy);
    
    // Real-time alias validation
    aliasInput.addEventListener('input', function() {
        const value = this.value;
        
        // Remove invalid characters
        this.value = value.replace(/[^a-zA-Z0-9]/g, '');
        
        // Enforce max length
        if (this.value.length > 4) {
            this.value = this.value.substring(0, 4);
        }
    });
    
    // URL input validation feedback
    targetInput.addEventListener('blur', function() {
        const url = this.value.trim();
        
        if (url && !/^https?:\/\/.+/i.test(url)) {
            showStatus('Muista lisätä http:// tai https:// URL:n alkuun', 'error');
        }
    });

})();
