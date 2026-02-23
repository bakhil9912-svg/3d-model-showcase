// Tools Management
document.addEventListener('DOMContentLoaded', () => {
    setupToolsEventListeners();
});

function setupToolsEventListeners() {
    document.getElementById('inspectorBtn')?.addEventListener('click', openInspector);
    document.getElementById('animEditorBtn')?.addEventListener('click', openAnimEditor);
    document.getElementById('materialEditorBtn')?.addEventListener('click', openMaterialEditor);
    document.getElementById('converterBtn')?.addEventListener('click', openConverter);
    document.getElementById('statsBtn')?.addEventListener('click