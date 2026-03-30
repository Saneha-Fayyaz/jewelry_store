// Admin Panel JavaScript

// State
const adminState = {
    currentSection: 'dashboard',
    catalogRings: []
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    refreshStats();
    loadCatalogTable();
});

// Show section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active to clicked nav item
    event.target.classList.add('active');
    
    adminState.currentSection = sectionId;
    
    // Load section-specific data
    if (sectionId === 'catalog') {
        loadCatalogTable();
    } else if (sectionId === 'orders') {
        loadOrdersTable();
    }
}

// ============================================================================
// DASHBOARD
// ============================================================================

async function refreshStats() {
    try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        
        if (data.success) {
            const stats = data.stats;
            document.getElementById('totalRings').textContent = stats.total_rings;
            document.getElementById('totalOrders').textContent = stats.total_orders;
            document.getElementById('totalRevenue').textContent = `$${stats.total_revenue.toFixed(2)}`;
            document.getElementById('catalogLoaded').textContent = stats.catalog_loaded;
        }
    } catch (error) {
        console.error('Error refreshing stats:', error);
    }
}

async function buildCatalog() {
    const folder = document.getElementById('catalogFolder').value;
    const statusDiv = document.getElementById('buildStatus');
    
    if (!folder) {
        showStatus('Please enter a folder path', 'error');
        return;
    }
    
    try {
        showStatus('Building catalog...', 'info');
        
        const response = await fetch('/api/admin/build-catalog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images_folder: folder })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showStatus(
                `Catalog built successfully! Found ${data.total_images} images, added ${data.added} new rings.`,
                'success'
            );
            refreshStats();
        } else {
            showStatus(`Error: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Error building catalog:', error);
        showStatus('An error occurred while building the catalog', 'error');
    }
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('buildStatus');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
}

// ============================================================================
// CATALOG MANAGEMENT
// ============================================================================

async function loadCatalogTable() {
    try {
        const response = await fetch('/api/rings');
        const data = await response.json();
        
        if (data.success) {
            adminState.catalogRings = data.rings;
            displayCatalogTable(data.rings);
        }
    } catch (error) {
        console.error('Error loading catalog:', error);
    }
}

function displayCatalogTable(rings) {
    const tbody = document.getElementById('catalogTableBody');
    
    if (rings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No rings in catalog</td></tr>';
        return;
    }
    
    tbody.innerHTML = rings.map(ring => `
        <tr>
            <td>
                <img src="${ring.image_url}" alt="${ring.name}" class="table-img">
            </td>
            <td>${ring.ring_id}</td>
            <td>${ring.name}</td>
            <td>$${ring.base_price.toFixed(2)}</td>
            <td>${ring.gemstone_type || 'N/A'} (${ring.gemstone_count || 0})</td>
            <td>${ring.metal_type || 'N/A'}</td>
            <td>${ring.stock_quantity}</td>
            <td class="action-btns">
                <button class="btn-icon" onclick="editRing('${ring.ring_id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon danger" onclick="deleteRing('${ring.ring_id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function editRing(ringId) {
    alert(`Edit functionality for ${ringId} - To be implemented`);
}

function deleteRing(ringId) {
    if (confirm(`Are you sure you want to delete ring ${ringId}?`)) {
        alert(`Delete functionality for ${ringId} - To be implemented`);
    }
}

// ============================================================================
// ORDER MANAGEMENT
// ============================================================================

async function loadOrdersTable() {
    // For now, show placeholder
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Order management coming soon</td></tr>';
}

// ============================================================================
// SEARCH
// ============================================================================

document.getElementById('catalogSearch')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = adminState.catalogRings.filter(ring => 
        ring.name.toLowerCase().includes(searchTerm) ||
        ring.ring_id.toLowerCase().includes(searchTerm) ||
        (ring.gemstone_type && ring.gemstone_type.toLowerCase().includes(searchTerm)) ||
        (ring.metal_type && ring.metal_type.toLowerCase().includes(searchTerm))
    );
    displayCatalogTable(filtered);
});