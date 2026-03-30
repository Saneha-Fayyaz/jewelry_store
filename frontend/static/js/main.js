// LuxeRings - Main JavaScript

// Global state
const state = {
    cart: [],
    uploadedImage: null,
    searchResults: [],
    catalogRings: [],
    currentPage: 1,
    ringsPerPage: 12
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCatalog();
    setupEventListeners();
    loadCartFromStorage();
});

// Setup event listeners
function setupEventListeners() {
    // Image upload
    const imageUpload = document.getElementById('imageUpload');
    const uploadArea = document.getElementById('uploadArea');
    
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageSelect);
    }
    
    // Drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary-color)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--border-color)';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border-color)';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handleImageFile(file);
            }
        });
    }
    
    // Cart icon click
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', openCartModal);
    }
    
    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// ============================================================================
// IMAGE UPLOAD & VISUAL SEARCH
// ============================================================================

function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleImageFile(file);
    }
}

function handleImageFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
    }
    
    // Validate file size (16MB)
    if (file.size > 16 * 1024 * 1024) {
        showNotification('File size exceeds 16MB limit', 'error');
        return;
    }
    
    // Store file
    state.uploadedImage = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('previewArea').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function clearSearch() {
    state.uploadedImage = null;
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('previewArea').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('imageUpload').value = '';
}

async function performVisualSearch() {
    if (!state.uploadedImage) {
        showNotification('Please select an image first', 'error');
        return;
    }
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    const searchButton = document.getElementById('searchButton');
    
    try {
        // Show loading
        loadingIndicator.style.display = 'block';
        searchButton.disabled = true;
        
        // Create form data
        const formData = new FormData();
        formData.append('image', state.uploadedImage);
        formData.append('top_k', '12');
        formData.append('min_score', '0.3');
        const metalType = document.getElementById('searchMetalType').value;
        if (metalType) {
            formData.append('metal_type', metalType);
        }
        
        // Make API call
        const response = await fetch('/api/search/visual', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            state.searchResults = data.results;
            displaySearchResults(data.results);
            
            // Scroll to results
            setTimeout(() => {
                document.getElementById('searchResults').scrollIntoView({ behavior: 'smooth' });
            }, 300);
        } else {
            showNotification(data.error || 'Search failed', 'error');
        }
        
    } catch (error) {
        console.error('Search error:', error);
        showNotification('An error occurred during search', 'error');
    } finally {
        loadingIndicator.style.display = 'none';
        searchButton.disabled = false;
    }
}

function displaySearchResults(results) {
    const resultsSection = document.getElementById('searchResults');
    const resultsCount = document.getElementById('resultsCount');
    const resultsGrid = document.getElementById('resultsGrid');
    
    resultsCount.textContent = results.length;
    resultsGrid.innerHTML = '';
    
    if (results.length === 0) {
        resultsGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No similar rings found. Try a different image or browse our catalog.</p>';
    } else {
        results.forEach(ring => {
            resultsGrid.appendChild(createRingCard(ring, true));
        });
    }
    
    resultsSection.style.display = 'block';
}

// ============================================================================
// CATALOG
// ============================================================================

async function loadCatalog() {
    try {
        const response = await fetch('/api/rings');
        const data = await response.json();
        
        if (data.success) {
            state.catalogRings = data.rings;
            displayCatalog(data.rings);
        } else {
            console.error('Failed to load catalog:', data.error);
        }
    } catch (error) {
        console.error('Error loading catalog:', error);
    }
}

function displayCatalog(rings) {
    const catalogGrid = document.getElementById('catalogGrid');
    catalogGrid.innerHTML = '';
    
    if (rings.length === 0) {
        catalogGrid.innerHTML = '<div class="loading-catalog">No rings in catalog yet</div>';
        return;
    }
    
    rings.forEach(ring => {
        catalogGrid.appendChild(createRingCard(ring, false));
    });
}

function applyCatalogFilters() {
    let filteredRings = [...state.catalogRings];
    
    // Featured only filter
    const featuredOnly = document.getElementById('featuredOnly').checked;
    if (featuredOnly) {
        filteredRings = filteredRings.filter(ring => ring.featured);
    }
    
    // Sort filter
    const sortValue = document.getElementById('sortSelect').value;
    switch (sortValue) {
        case 'price_low':
            filteredRings.sort((a, b) => a.base_price - b.base_price);
            break;
        case 'price_high':
            filteredRings.sort((a, b) => b.base_price - a.base_price);
            break;
        case 'newest':
        default:
            // Already in newest first order
            break;
    }
    
    displayCatalog(filteredRings);
}

function loadMoreRings() {
    state.currentPage++;
    // Implement pagination logic if needed
}

// ============================================================================
// RING CARD CREATION
// ============================================================================

function createRingCard(ring, showMatchScore = false) {
    const card = document.createElement('div');
    card.className = 'ring-card';
    card.onclick = () => showRingDetails(ring.ring_id);
    
    const matchBadge = showMatchScore && ring.match_percentage 
        ? `<div class="match-badge">${ring.match_percentage}% Match</div>` 
        : '';
    
    card.innerHTML = `
        ${matchBadge}
        <img src="${ring.image_url}" alt="${ring.name}" class="ring-card-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2220%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'">
        <div class="ring-card-content">
            <h3 class="ring-card-title">${ring.name}</h3>
            ${ring.description ? `<p class="ring-card-description">${ring.description.substring(0, 80)}...</p>` : ''}
            <div class="ring-card-details">
                <span class="detail-tag"><i class="fas fa-gem"></i> ${ring.gemstone_type || 'N/A'}</span>
                <span class="detail-tag"><i class="fas fa-ring"></i> ${ring.metal_type || 'N/A'}</span>
            </div>
            <div class="ring-card-footer">
                <div class="ring-card-price">$${ring.base_price.toFixed(2)}</div>
                <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${ring.ring_id}')">
                    <i class="fas fa-cart-plus"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// ============================================================================
// RING DETAILS MODAL
// ============================================================================

async function showRingDetails(ringId) {
    try {
        const response = await fetch(`/api/rings/${ringId}`);
        const data = await response.json();
        
        if (data.success) {
            displayRingModal(data.ring);
        }
    } catch (error) {
        console.error('Error fetching ring details:', error);
    }
}

function displayRingModal(ring) {
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div>
                <img src="${ring.image_url}" alt="${ring.name}" style="width: 100%; border-radius: 10px;">
            </div>
            <div>
                <h2>${ring.name}</h2>
                <p style="color: var(--text-light); margin: 1rem 0;">${ring.description || ''}</p>
                
                <div style="margin: 2rem 0;">
                    <h3 style="margin-bottom: 1rem;">Details</h3>
                    <div style="display: grid; gap: 0.75rem;">
                        <div><strong>Gemstone:</strong> ${ring.gemstone_type} (${ring.gemstone_count})</div>
                        <div><strong>Color:</strong> ${ring.gemstone_color || 'N/A'}</div>
                        <div><strong>Metal:</strong> ${ring.metal_type}</div>
                        <div><strong>Stock:</strong> ${ring.stock_quantity} available</div>
                    </div>
                </div>
                
                <div style="margin: 2rem 0;">
                    <h3 style="font-size: 2rem; color: var(--primary-color);">$${ring.base_price.toFixed(2)}</h3>
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-primary" onclick="addToCart('${ring.ring_id}'); closeModal();" style="flex: 1;">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    <button class="btn btn-secondary" onclick="showCustomization('${ring.ring_id}')" style="flex: 1;">
                        <i class="fas fa-palette"></i> Customize
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('ringModal').classList.add('active');
}

function closeModal() {
    document.getElementById('ringModal').classList.remove('active');
}

// ============================================================================
// CUSTOMIZATION
// ============================================================================

async function showCustomization(ringId) {
    try {
        const response = await fetch('/api/customize/options', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ring_id: ringId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayCustomizationModal(ringId, data.options);
        }
    } catch (error) {
        console.error('Error fetching customization options:', error);
    }
}

function displayCustomizationModal(ringId, options) {
    const modalBody = document.getElementById('modalBody');
    
    const gemstoneColorOptions = options.gemstone_colors[options.current_config.gemstone_type] || [];
    
    modalBody.innerHTML = `
        <h2>Customize Your Ring</h2>
        <form id="customizationForm" onsubmit="applyCustomization(event, '${ringId}')">
            <div class="form-group">
                <label>Gemstone Type</label>
                <select name="gemstone_type" id="gemstoneType" onchange="updateGemstoneColors()">
                    ${options.gemstone_types.map(type => 
                        `<option value="${type}" ${type === options.current_config.gemstone_type ? 'selected' : ''}>${type}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Gemstone Color</label>
                <select name="gemstone_color" id="gemstoneColor">
                    ${gemstoneColorOptions.map(color => 
                        `<option value="${color}">${color}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Number of Gemstones</label>
                <input type="number" name="gemstone_count" min="1" max="20" value="${options.current_config.gemstone_count || 1}">
            </div>
            
            <div class="form-group">
                <label>Metal Type</label>
                <select name="metal_type">
                    ${options.metal_types.map(metal => 
                        `<option value="${metal}" ${metal === options.current_config.metal_type ? 'selected' : ''}>${metal}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div id="priceEstimate" style="margin: 2rem 0; padding: 1rem; background: var(--bg-light); border-radius: 5px;">
                <h3>Estimated Price: <span id="customPrice">Calculating...</span></h3>
                <p style="color: var(--text-light); font-size: 0.9rem;">Production time: <span id="productionTime">7-14</span> days</p>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
                <i class="fas fa-cart-plus"></i> Add Customized Ring to Cart
            </button>
        </form>
    `;
    
    // Store customization data for later use
    document.getElementById('customizationForm').dataset.gemstoneColors = JSON.stringify(options.gemstone_colors);
    
    // Calculate initial price
    calculateCustomPrice(ringId);
}

function updateGemstoneColors() {
    const form = document.getElementById('customizationForm');
    const gemstoneColors = JSON.parse(form.dataset.gemstoneColors);
    const selectedType = document.getElementById('gemstoneType').value;
    const colorSelect = document.getElementById('gemstoneColor');
    
    const colors = gemstoneColors[selectedType] || [];
    colorSelect.innerHTML = colors.map(color => `<option value="${color}">${color}</option>`).join('');
    
    // Recalculate price
    const ringId = form.dataset.ringId || '';
    if (ringId) {
        calculateCustomPrice(ringId);
    }
}

async function calculateCustomPrice(ringId) {
    const form = document.getElementById('customizationForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const customizations = Object.fromEntries(formData.entries());
    customizations.gemstone_count = parseInt(customizations.gemstone_count);
    
    try {
        const response = await fetch('/api/customize/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ring_id: ringId, customizations })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('customPrice').textContent = `$${data.estimated_price.toFixed(2)}`;
            document.getElementById('productionTime').textContent = data.production_time_days;
        }
    } catch (error) {
        console.error('Error calculating price:', error);
    }
}

async function applyCustomization(event, ringId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const customizations = Object.fromEntries(formData.entries());
    customizations.gemstone_count = parseInt(customizations.gemstone_count);
    
    addToCart(ringId, customizations);
    closeModal();
}

// ============================================================================
// SHOPPING CART
// ============================================================================

function addToCart(ringId, customizations = null) {
    // Find ring details
    const ring = state.catalogRings.find(r => r.ring_id === ringId) || 
                 state.searchResults.find(r => r.ring_id === ringId);
    
    if (!ring) {
        showNotification('Ring not found', 'error');
        return;
    }
    
    const cartItem = {
        ring_id: ringId,
        name: ring.name,
        price: ring.base_price,
        image_url: ring.image_url,
        customizations: customizations,
        quantity: 1
    };
    
    state.cart.push(cartItem);
    updateCartDisplay();
    saveCartToStorage();
    showNotification('Added to cart!', 'success');
}

function updateCartDisplay() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = state.cart.length;
    }
}

function saveCartToStorage() {
    localStorage.setItem('luxerings_cart', JSON.stringify(state.cart));
}

function loadCartFromStorage() {
    const saved = localStorage.getItem('luxerings_cart');
    if (saved) {
        state.cart = JSON.parse(saved);
        updateCartDisplay();
    }
}

function openCartModal() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (state.cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; padding: 2rem;">Your cart is empty</p>';
        cartTotal.textContent = '0';
    } else {
        cartItems.innerHTML = state.cart.map((item, index) => `
            <div style="display: flex; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--border-color);">
                <img src="${item.image_url}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px;">
                <div style="flex: 1;">
                    <h4>${item.name}</h4>
                    ${item.customizations ? '<p style="font-size: 0.9rem; color: var(--text-light);">Customized</p>' : ''}
                    <p style="font-weight: bold; color: var(--primary-color);">$${item.price.toFixed(2)}</p>
                </div>
                <button onclick="removeFromCart(${index})" style="background: none; border: none; color: var(--error-color); cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        const total = state.cart.reduce((sum, item) => sum + item.price, 0);
        cartTotal.textContent = total.toFixed(2);
    }
    
    document.getElementById('cartModal').classList.add('active');
}

function closeCartModal() {
    document.getElementById('cartModal').classList.remove('active');
}

function removeFromCart(index) {
    state.cart.splice(index, 1);
    updateCartDisplay();
    saveCartToStorage();
    openCartModal(); // Refresh cart display
}

function proceedToCheckout() {
    if (state.cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }
    
    closeCartModal();
    openCheckoutModal();
}

// ============================================================================
// CHECKOUT
// ============================================================================

function openCheckoutModal() {
    const orderSummary = document.getElementById('orderSummary');
    const total = state.cart.reduce((sum, item) => sum + item.price, 0);
    
    orderSummary.innerHTML = `
        <h3>Order Summary</h3>
        <div style="margin: 1rem 0;">
            ${state.cart.map(item => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>${item.name}</span>
                    <span>$${item.price.toFixed(2)}</span>
                </div>
            `).join('')}
        </div>
        <div style="border-top: 2px solid var(--border-color); padding-top: 1rem; font-size: 1.2rem; font-weight: bold;">
            <div style="display: flex; justify-content: space-between;">
                <span>Total:</span>
                <span style="color: var(--primary-color);">$${total.toFixed(2)}</span>
            </div>
        </div>
    `;
    
    document.getElementById('checkoutModal').classList.add('active');
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('active');
}

async function submitOrder(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const orderData = {
        customer_name: formData.get('customer_name'),
        customer_email: formData.get('customer_email'),
        customer_phone: formData.get('customer_phone'),
        items: state.cart.map(item => ({
            ring_id: item.ring_id,
            price: item.price,
            quantity: item.quantity,
            customizations: item.customizations
        }))
    };
    
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`Order placed successfully! Order ID: ${data.order_id}`, 'success');
            state.cart = [];
            updateCartDisplay();
            saveCartToStorage();
            closeCheckoutModal();
            
            // Show order confirmation
            alert(`Thank you for your order!\n\nOrder ID: ${data.order_id}\nTotal: $${data.total_price.toFixed(2)}\n\nWe'll send a confirmation email to ${orderData.customer_email}`);
        } else {
            showNotification(data.error || 'Order failed', 'error');
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        showNotification('An error occurred while placing your order', 'error');
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--primary-color)'};
        color: white;
        border-radius: 5px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);