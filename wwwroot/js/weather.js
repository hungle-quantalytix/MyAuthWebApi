(function() {
    'use strict';

    function initializeWeatherPage() {
        if (typeof window.loadDataTable !== 'function') {
            console.error('loadDataTable helper is unavailable.');
            return;
        }

        window.loadDataTable({
            tableContainerId: 'weather-table-container',
            endpoint: '/api/WeatherForecast'
        });
    }

    if (typeof window.onDocumentReady === 'function') {
        window.onDocumentReady(initializeWeatherPage);
    } else {
        document.addEventListener('DOMContentLoaded', initializeWeatherPage, { once: true });
    }
})();

