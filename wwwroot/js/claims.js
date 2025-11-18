(function() {
    'use strict';

    function initializeClaimsPage() {
        if (typeof window.loadDataTable !== 'function') {
            console.error('loadDataTable helper is unavailable.');
            return;
        }

        window.loadDataTable({
            tableContainerId: 'claims-table-container',
            endpoint: '/api/Claims'
        });
    }

    if (typeof window.onDocumentReady === 'function') {
        window.onDocumentReady(initializeClaimsPage);
    } else {
        document.addEventListener('DOMContentLoaded', initializeClaimsPage, { once: true });
    }
})();

