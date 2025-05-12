// Cookie Consent Banner
document.addEventListener('DOMContentLoaded', function() {
    // Check if user has already given consent
    if (!localStorage.getItem('cookieConsent')) {
        // Create cookie consent banner elements
        const banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.style.position = 'fixed';
        banner.style.bottom = '0';
        banner.style.left = '0';
        banner.style.right = '0';
        banner.style.padding = '15px 20px';
        banner.style.background = '#1e293b';
        banner.style.color = '#fff';
        banner.style.display = 'flex';
        banner.style.justifyContent = 'space-between';
        banner.style.alignItems = 'center';
        banner.style.flexWrap = 'wrap';
        banner.style.zIndex = '9999';
        banner.style.boxShadow = '0 -2px 10px rgba(0, 0, 0, 0.1)';
        
        // Message
        const message = document.createElement('div');
        message.className = 'cookie-message';
        message.style.flex = '1';
        message.style.marginRight = '20px';
        message.style.marginBottom = '10px';
        message.innerHTML = `
            <p style="margin: 0 0 10px 0; font-size: 14px;">
                This website uses cookies to ensure you get the best experience. We use cookies for:
            </p>
            <ul style="margin: 0 0 10px 0; padding-left: 20px; font-size: 14px;">
                <li>Essential website functionality</li>
                <li>Analytics to improve user experience</li>
                <li>Personalized advertisements via Google AdSense</li>
            </ul>
            <p style="margin: 0; font-size: 14px;">
                By using our website, you consent to our use of cookies in accordance with our 
                <a href="/privacy-policy.html" style="color: #3b82f6; text-decoration: underline;">Privacy Policy</a>.
            </p>
        `;
        
        // Buttons container
        const buttons = document.createElement('div');
        buttons.className = 'cookie-buttons';
        buttons.style.display = 'flex';
        buttons.style.gap = '10px';
        
        // Accept button
        const acceptBtn = document.createElement('button');
        acceptBtn.textContent = 'Accept All Cookies';
        acceptBtn.style.background = '#3b82f6';
        acceptBtn.style.color = '#fff';
        acceptBtn.style.border = 'none';
        acceptBtn.style.padding = '10px 15px';
        acceptBtn.style.borderRadius = '4px';
        acceptBtn.style.cursor = 'pointer';
        acceptBtn.style.fontWeight = '500';
        acceptBtn.style.fontSize = '14px';
        
        // Reject non-essential button
        const rejectBtn = document.createElement('button');
        rejectBtn.textContent = 'Reject Non-Essential';
        rejectBtn.style.background = 'transparent';
        rejectBtn.style.color = '#fff';
        rejectBtn.style.border = '1px solid #cbd5e1';
        rejectBtn.style.padding = '10px 15px';
        rejectBtn.style.borderRadius = '4px';
        rejectBtn.style.cursor = 'pointer';
        rejectBtn.style.fontWeight = '500';
        rejectBtn.style.fontSize = '14px';
        rejectBtn.style.marginLeft = '10px';
        
        // Customize Cookies button
        const customizeBtn = document.createElement('button');
        customizeBtn.textContent = 'Customize Cookies';
        customizeBtn.style.background = 'transparent';
        customizeBtn.style.color = '#cbd5e1';
        customizeBtn.style.border = '1px solid #cbd5e1';
        customizeBtn.style.padding = '10px 15px';
        customizeBtn.style.borderRadius = '4px';
        customizeBtn.style.cursor = 'pointer';
        customizeBtn.style.fontWeight = '500';
        customizeBtn.style.fontSize = '14px';
        customizeBtn.style.marginLeft = '10px';
        
        // Add event listeners
        acceptBtn.addEventListener('click', function() {
            setConsent('all');
            banner.remove();
        });
        
        rejectBtn.addEventListener('click', function() {
            setConsent('essential');
            banner.remove();
        });
        
        customizeBtn.addEventListener('click', function() {
            showCookiePreferencesModal();
        });
        
        // Assemble the banner
        buttons.appendChild(acceptBtn);
        buttons.appendChild(rejectBtn);
        buttons.appendChild(customizeBtn);
        
        banner.appendChild(message);
        banner.appendChild(buttons);
        
        // Add to page
        document.body.appendChild(banner);
    }
});

// Function to show cookie preferences modal
function showCookiePreferencesModal() {
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'cookie-preferences-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0, 0, 0, 0.5)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.background = '#fff';
    modalContent.style.borderRadius = '8px';
    modalContent.style.padding = '20px';
    modalContent.style.maxWidth = '500px';
    modalContent.style.width = '100%';
    modalContent.style.maxHeight = '90vh';
    modalContent.style.overflowY = 'auto';
    modalContent.style.color = '#1e293b';
    
    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.style.display = 'flex';
    modalHeader.style.justifyContent = 'space-between';
    modalHeader.style.alignItems = 'center';
    modalHeader.style.marginBottom = '20px';
    
    const modalTitle = document.createElement('h3');
    modalTitle.textContent = 'Cookie Preferences';
    modalTitle.style.margin = '0';
    modalTitle.style.fontSize = '18px';
    modalTitle.style.fontWeight = '600';
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.padding = '0 5px';
    closeBtn.style.lineHeight = '1';
    
    closeBtn.addEventListener('click', function() {
        modal.remove();
    });
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeBtn);
    
    // Cookie options
    const cookieOptions = document.createElement('div');
    cookieOptions.className = 'cookie-options';
    
    // Essential cookies (always enabled)
    const essentialOption = createCookieOption(
        'essential',
        'Essential Cookies',
        'These cookies are necessary for the website to function and cannot be disabled.',
        true,
        true
    );
    
    // Analytics cookies
    const analyticsOption = createCookieOption(
        'analytics',
        'Analytics Cookies',
        'These cookies help us understand how visitors interact with our website.',
        false,
        false
    );
    
    // Advertising cookies
    const advertisingOption = createCookieOption(
        'advertising',
        'Advertising Cookies',
        'These cookies are used to show personalized advertisements via Google AdSense.',
        false,
        false
    );
    
    cookieOptions.appendChild(essentialOption);
    cookieOptions.appendChild(analyticsOption);
    cookieOptions.appendChild(advertisingOption);
    
    // Action buttons
    const actionButtons = document.createElement('div');
    actionButtons.style.display = 'flex';
    actionButtons.style.justifyContent = 'flex-end';
    actionButtons.style.gap = '10px';
    actionButtons.style.marginTop = '20px';
    
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save Preferences';
    saveBtn.style.background = '#3b82f6';
    saveBtn.style.color = '#fff';
    saveBtn.style.border = 'none';
    saveBtn.style.padding = '10px 15px';
    saveBtn.style.borderRadius = '4px';
    saveBtn.style.cursor = 'pointer';
    saveBtn.style.fontWeight = '500';
    
    saveBtn.addEventListener('click', function() {
        const analyticsChecked = document.getElementById('analytics-checkbox').checked;
        const advertisingChecked = document.getElementById('advertising-checkbox').checked;
        
        let consentLevel = 'custom';
        const customPreferences = {
            essential: true, // Always true
            analytics: analyticsChecked,
            advertising: advertisingChecked
        };
        
        // If all checked, it's equivalent to 'all'
        if (analyticsChecked && advertisingChecked) {
            consentLevel = 'all';
        }
        // If all unchecked except essential, it's equivalent to 'essential'
        else if (!analyticsChecked && !advertisingChecked) {
            consentLevel = 'essential';
        }
        
        setConsent(consentLevel, customPreferences);
        modal.remove();
        document.querySelector('.cookie-banner').remove();
    });
    
    actionButtons.appendChild(saveBtn);
    
    // Assemble modal content
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(cookieOptions);
    modalContent.appendChild(actionButtons);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// Helper function to create cookie option row
function createCookieOption(id, title, description, checked, disabled) {
    const option = document.createElement('div');
    option.className = 'cookie-option';
    option.style.marginBottom = '15px';
    option.style.padding = '15px';
    option.style.border = '1px solid #e2e8f0';
    option.style.borderRadius = '4px';
    
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '5px';
    
    const titleEl = document.createElement('h4');
    titleEl.textContent = title;
    titleEl.style.margin = '0';
    titleEl.style.fontSize = '16px';
    titleEl.style.fontWeight = '500';
    
    const toggle = document.createElement('label');
    toggle.className = 'toggle-switch';
    toggle.style.position = 'relative';
    toggle.style.display = 'inline-block';
    toggle.style.width = '50px';
    toggle.style.height = '24px';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id + '-checkbox';
    checkbox.checked = checked;
    checkbox.disabled = disabled;
    checkbox.style.opacity = '0';
    checkbox.style.width = '0';
    checkbox.style.height = '0';
    
    const slider = document.createElement('span');
    slider.className = 'slider';
    slider.style.position = 'absolute';
    slider.style.cursor = disabled ? 'default' : 'pointer';
    slider.style.top = '0';
    slider.style.left = '0';
    slider.style.right = '0';
    slider.style.bottom = '0';
    slider.style.backgroundColor = checked ? '#3b82f6' : '#cbd5e1';
    slider.style.borderRadius = '24px';
    slider.style.transition = '0.4s';
    
    // Create the circle on the slider
    const circle = document.createElement('span');
    circle.style.position = 'absolute';
    circle.style.content = '""';
    circle.style.height = '16px';
    circle.style.width = '16px';
    circle.style.left = checked ? '30px' : '4px';
    circle.style.bottom = '4px';
    circle.style.backgroundColor = 'white';
    circle.style.borderRadius = '50%';
    circle.style.transition = '0.4s';
    
    // Add the slider animation on click
    checkbox.addEventListener('change', function() {
        slider.style.backgroundColor = this.checked ? '#3b82f6' : '#cbd5e1';
        circle.style.left = this.checked ? '30px' : '4px';
    });
    
    slider.appendChild(circle);
    toggle.appendChild(checkbox);
    toggle.appendChild(slider);
    
    header.appendChild(titleEl);
    header.appendChild(toggle);
    
    const desc = document.createElement('p');
    desc.textContent = description;
    desc.style.margin = '0';
    desc.style.fontSize = '14px';
    desc.style.color = '#64748b';
    
    option.appendChild(header);
    option.appendChild(desc);
    
    return option;
}

// Set consent in localStorage
function setConsent(level, customPreferences = null) {
    const consent = {
        level: level,
        timestamp: new Date().toISOString(),
        expires: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(), // 6 months expiry
        preferences: customPreferences
    };
    
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    
    // Apply cookie settings based on user preferences
    applyCookieSettings(level, customPreferences);
}

// Function to apply cookie settings based on user preferences
function applyCookieSettings(level, customPreferences) {
    if (level === 'essential' || 
        (level === 'custom' && 
         customPreferences && 
         !customPreferences.analytics && 
         !customPreferences.advertising)) {
        // Disable all non-essential cookies
        disableAnalyticsCookies();
        disableAdvertisingCookies();
    } else if (level === 'custom') {
        // Apply custom settings
        if (!customPreferences.analytics) {
            disableAnalyticsCookies();
        }
        if (!customPreferences.advertising) {
            disableAdvertisingCookies();
        }
    }
    
    // Inform the user their preferences have been saved
    showNotification('Your cookie preferences have been saved.');
}

// Function to disable analytics cookies
function disableAnalyticsCookies() {
    // Set Google Analytics opt-out flag if it exists
    if (typeof window['ga-disable-UA-XXXXX-Y'] !== 'undefined') {
        window['ga-disable-UA-XXXXX-Y'] = true;
    }
}

// Function to disable advertising cookies
function disableAdvertisingCookies() {
    // Block AdSense cookies by setting a special cookie
    document.cookie = '__gads=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = '__gac=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Function to show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 15px';
    notification.style.background = '#10b981';
    notification.style.color = '#fff';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '9999';
    notification.style.fontSize = '14px';
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
} 