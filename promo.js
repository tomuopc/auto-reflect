// promo.js
function createPromoModal() {
    // URL check: strictly on https://www.reflect.today/ or https://www.reflect.today
    const currentUrl = window.location.href;
    if (currentUrl !== 'https://www.reflect.today/' && currentUrl !== 'https://www.reflect.today') {
        return;
    }

    // Check if the user has already chosen not to see the promo
    chrome.storage.local.get(['hidePromoModal'], function(result) {
        if (result.hidePromoModal) {
            return;
        }
        
        // Prevent duplicate modals
        if (document.getElementById('ai-reflect-promo-modal')) return;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'ai-reflect-promo-modal';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: '20000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        });

        // Create modal container
        const modal = document.createElement('div');
        Object.assign(modal.style, {
            position: 'relative',
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            maxWidth: '500px',
            width: '90%',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        });

        // Close button (X)
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666'
        });

        // Title Link
        const titleLink = document.createElement('a');
        titleLink.href = 'https://affx.ai/?af=x';
        titleLink.target = '_blank';
        titleLink.innerText = 'affx.ai';
        Object.assign(titleLink.style, {
            display: 'block',
            textAlign: 'center',
            color: '#3498db',
            fontSize: '40px',
            fontWeight: 'bold',
            textDecoration: 'none',
            marginTop: '5px',
            marginBottom: '0',
            transition: 'color 0.2s'
        });
        titleLink.onmouseover = () => titleLink.style.color = '#2980b9';
        titleLink.onmouseout = () => titleLink.style.color = '#3498db';

        // Image
        const img = document.createElement('img');
        img.src = chrome.runtime.getURL('image/aff.png');
        Object.assign(img.style, {
            width: '100%',
            height: 'auto',
            borderRadius: '8px',
            marginTop: '10px',
            marginBottom: '20px',
            maxHeight: '400px',
            objectFit: 'contain'
        });

        // Footer container
        const footer = document.createElement('div');
        Object.assign(footer.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '10px'
        });

        // Green button (Left)
        const goBtn = document.createElement('button');
        goBtn.innerText = '去看看';
        Object.assign(goBtn.style, {
            padding: '10px 24px',
            backgroundColor: '#2ecc71',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
        });
        goBtn.onmouseover = () => goBtn.style.backgroundColor = '#27ae60';
        goBtn.onmouseout = () => goBtn.style.backgroundColor = '#2ecc71';

        // Checkbox container (Right)
        const checkboxContainer = document.createElement('label');
        Object.assign(checkboxContainer.style, {
            display: 'flex',
            alignItems: 'center',
            color: '#999',
            fontSize: '14px',
            cursor: 'pointer'
        });

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.marginRight = '6px';

        const checkboxText = document.createTextNode('不再弹出');

        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(checkboxText);

        // Assemble footer
        footer.appendChild(checkboxContainer);
        footer.appendChild(goBtn);

        // Assemble modal
        modal.appendChild(closeBtn);
        modal.appendChild(titleLink);
        modal.appendChild(img);
        modal.appendChild(footer);
        overlay.appendChild(modal);

        document.body.appendChild(overlay);

        // Logic

        function hideModal() {
            overlay.remove();
        }

        // 1. Click "去看看"
        goBtn.addEventListener('click', () => {
            // Never show again
            chrome.storage.local.set({ hidePromoModal: true }, () => {
                // Open new tab
                window.open('https://affx.ai/?af=x', '_blank');
                hideModal();
            });
        });

        // 2. Click Close (X)
        closeBtn.addEventListener('click', () => {
            if (checkbox.checked) {
                // User checked "不再弹出"
                chrome.storage.local.set({ hidePromoModal: true }, () => {
                    hideModal();
                });
            } else {
                hideModal();
            }
        });
    });
}

// Run when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createPromoModal);
} else {
    createPromoModal();
}