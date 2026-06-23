document.addEventListener('DOMContentLoaded', function() {
    const autoPublishCheckbox = document.getElementById('autoPublish');
    const hideAutoFillBtnCheckbox = document.getElementById('hideAutoFillBtn');
    const showOptionalInputCheckbox = document.getElementById('showOptionalInput');
    const openTemplateBtn = document.getElementById('openTemplateBtn');

    // Load saved settings with migration
    chrome.storage.local.get(['autoPublish', 'hideAutoFillBtn', 'showOptionalInput'], function(result) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }
        
        // Auto Publish
        if (result.autoPublish === undefined) {
             // Try sync
             chrome.storage.sync.get(['autoPublish'], function(syncResult) {
                 if (syncResult.autoPublish !== undefined) {
                     autoPublishCheckbox.checked = syncResult.autoPublish;
                     // Migrate to local
                     chrome.storage.local.set({autoPublish: syncResult.autoPublish});
                 } else {
                     autoPublishCheckbox.checked = false;
                 }
             });
        } else {
             autoPublishCheckbox.checked = result.autoPublish;
        }

        // Hide Auto Fill Button
        if (result.hideAutoFillBtn !== undefined) {
            hideAutoFillBtnCheckbox.checked = result.hideAutoFillBtn;
        } else {
            hideAutoFillBtnCheckbox.checked = false; // Default off
        }

        // Show Optional Input
        if (result.showOptionalInput !== undefined) {
            showOptionalInputCheckbox.checked = result.showOptionalInput;
        } else {
            showOptionalInputCheckbox.checked = false; // Default off
        }
    });

    // Save settings on change
    autoPublishCheckbox.addEventListener('change', function() {
        chrome.storage.local.set({autoPublish: autoPublishCheckbox.checked}, function() {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            }
        });
    });

    hideAutoFillBtnCheckbox.addEventListener('change', function() {
        chrome.storage.local.set({hideAutoFillBtn: hideAutoFillBtnCheckbox.checked}, function() {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            }
        });
    });

    showOptionalInputCheckbox.addEventListener('change', function() {
        chrome.storage.local.set({showOptionalInput: showOptionalInputCheckbox.checked}, function() {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            }
        });
    });

    // Open template page
    openTemplateBtn.addEventListener('click', function() {
        chrome.tabs.create({url: 'template.html'});
    });
});
