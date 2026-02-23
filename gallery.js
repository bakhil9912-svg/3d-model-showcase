// Gallery Management
document.addEventListener('DOMContentLoaded', () => {
    setupGalleryEventListeners();
});

function setupGalleryEventListeners() {
    // Search
    const searchInput = document.getElementById('modelSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterModels);
    }

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterModels);
    }

    // Sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortModels);
    }
}

function filterModels() {
    const searchTerm = document.getElementById('modelSearch').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    let filtered = app.models.filter(model => {
        const matchesSearch = model.name.toLowerCase().includes(searchTerm) ||
                            model.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || model.category === category;
        return matchesSearch && matchesCategory;
    });

    displayFilteredModels(filtered);
}

function sortModels() {
    const sortValue = document.getElementById('sortSelect').value;
    let sorted = [...app.models];

    switch(sortValue) {
        case 'name-asc':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            sorted.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'date-new':
            sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'date-old':
            sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
    }

    displayFilteredModels(sorted);
}

function displayFilteredModels(models) {
    const grid = document.getElementById('modelsGrid');
    grid.innerHTML = '';

    if (models.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 3rem;">No models found</p>';
        return;
    }

    models.forEach(model => {
        const card = document.createElement('div');
        card.className = 'model-card';
        card.innerHTML = `
            <div class="model-card-thumbnail">${model.emoji}</div>
            <div class="model-card-content">
                <div class="model-card-title">${model.name}</div>
                <div class="model-card-category">${model.category}</div>
                <div class="model-card-description">${model.description}</div>
                <div class="model-card-stats">
                    <span>📊 ${model.vertices.toLocaleString()}</span>
                    <span>👁️ ${model.faces.toLocaleString()}</span>
                </div>
                <div class="model-card-actions">
                    <button class="btn btn-primary" onclick="loadModelInViewer(${model.id})">View</button>
                    <button class="btn btn-secondary" onclick="downloadModel(${model.id})">⬇️</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}