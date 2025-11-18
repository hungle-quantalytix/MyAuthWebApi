/**
 * Common JavaScript functionality for MyAuth Web API
 *
 * This file contains shared utilities used across all pages:
 * - Token management (localStorage)
 * - Table rendering and detail views
 * - Sidebar loading and navigation
 * - HTMX configuration and error handling
 *
 * Page-specific logic should be in separate files (e.g., auth.js, products.js)
 * and loaded after this common file.
 */

(function() {
    'use strict';

    // Store current table data for detail views
    const tableDataStore = {};
    const tableOptionsStore = {};

    function setTableOptions(tableContainerId, options) {
        if (!tableContainerId) {
            return;
        }
        tableOptionsStore[tableContainerId] = Object.assign({}, tableOptionsStore[tableContainerId] || {}, options || {});
    }

    window.setTableOptions = setTableOptions;

    window.getTableData = function(detailContainerId) {
        const data = tableDataStore[detailContainerId];
        return Array.isArray(data) ? data.slice() : [];
    };

    window.getTableRowData = function(detailContainerId, index) {
        const data = tableDataStore[detailContainerId];
        if (!Array.isArray(data) || typeof index !== 'number') {
            return null;
        }
        return data[index] || null;
    };

    function dispatchAuthEvent(name, detail) {
        try {
            document.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
        } catch (error) {
            console.error(`Failed to dispatch ${name}`, error);
        }
    }

    // Store tokens in localStorage
    function setAccessToken(token) {
        if (token) {
            localStorage.setItem('accessToken', token);
        } else {
            localStorage.removeItem('accessToken');
        }
        const display = document.getElementById('access-token-display');
        if (display) {
            display.textContent = token ? `${token.substring(0, 50)}${token.length > 50 ? '...' : ''}` : 'Not set';
        }
        dispatchAuthEvent('auth:accessTokenChanged', { token: token || '' });
    }

    function getAccessToken() {
        return localStorage.getItem('accessToken') || '';
    }

    function setRefreshToken(token) {
        if (token) {
            localStorage.setItem('refreshToken', token);
        } else {
            localStorage.removeItem('refreshToken');
        }
        const refreshInput = document.getElementById('refresh-token');
        if (refreshInput) {
            refreshInput.value = token || '';
        }
        const display = document.getElementById('refresh-token-display');
        if (display) {
            display.textContent = token ? `${token.substring(0, 50)}${token.length > 50 ? '...' : ''}` : 'Not set';
        }
        dispatchAuthEvent('auth:refreshTokenChanged', { token: token || '' });
    }

    function getRefreshToken() {
        return localStorage.getItem('refreshToken') || '';
    }

    // Expose token functions globally for page-specific scripts
    window.setAccessToken = setAccessToken;
    window.getAccessToken = getAccessToken;
    window.setRefreshToken = setRefreshToken;
    window.getRefreshToken = getRefreshToken;

    async function authorizedFetch(url, options) {
        if (!url) {
            throw new Error('Request URL is required.');
        }

        const fetchOptions = Object.assign({ method: 'GET' }, options || {});
        const headers = new Headers(fetchOptions.headers || {});
        const token = getAccessToken();

        if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        if (fetchOptions.body && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
        if (!headers.has('Accept')) {
            headers.set('Accept', 'application/json');
        }

        fetchOptions.headers = headers;

        const response = await fetch(url, fetchOptions);
        if (!response.ok) {
            let errorMessage = `Request failed (${response.status})`;

            try {
                const data = await response.clone().json();
                if (typeof data === 'string') {
                    errorMessage = data;
                } else if (data && typeof data === 'object') {
                    errorMessage = data.message || data.title || JSON.stringify(data);
                }
            } catch {
                const text = await response.text();
                if (text) {
                    errorMessage = text;
                }
            }

            throw new Error(errorMessage);
        }

        return response;
    }

    window.authorizedFetch = authorizedFetch;

    const DEFAULT_TOAST_TIMEOUT = 5000;

    function getToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = 2000;
            document.body.appendChild(container);
        }
        return container;
    }

    function showToast(message, type, options) {
        const container = getToastContainer();
        const toast = document.createElement('div');
        const toastType = type || 'info';
        const bootstrapType = ({
            success: 'success',
            error: 'danger',
            danger: 'danger',
            warning: 'warning',
            info: 'info'
        })[toastType] || 'info';

        toast.className = `toast align-items-center text-bg-${bootstrapType} border-0 show`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Close"></button>
            </div>
        `;

        const dismiss = () => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
            setTimeout(() => toast.remove(), 300);
        };

        toast.querySelector('.btn-close').addEventListener('click', dismiss);

        container.appendChild(toast);

        const timeout = (options && options.timeout) || DEFAULT_TOAST_TIMEOUT;
        setTimeout(dismiss, timeout);
    }

    window.showToast = showToast;

    function isHtmxReady() {
        return typeof window.htmx !== 'undefined' && typeof window.htmx.ajax === 'function';
    }

    function performDataRequest(container, config) {
        if (!isHtmxReady()) {
            console.warn('htmx is required for data loading but is not available.');
            return;
        }

        const endpoint = config.endpoint;
        if (!endpoint) {
            console.warn(`No endpoint provided for container "${container.id}".`);
            return;
        }

        const method = (config.method || 'GET').toUpperCase();
        const swap = config.swap || 'innerHTML';
        const htmxOptions = Object.assign({}, config.htmxOptions || {}, {
            target: container,
            swap: swap
        });

        container.dataset.endpoint = endpoint;
        container.dataset.method = method;
        container.dataset.swap = swap;

        window.htmx.ajax(method, endpoint, htmxOptions);
    }

    function loadDataTable(config) {
        if (!config || !config.tableContainerId) {
            console.warn('loadDataTable requires a tableContainerId.');
            return;
        }

        const container = document.getElementById(config.tableContainerId);
        if (!container) {
            console.warn(`Container "${config.tableContainerId}" was not found in the DOM.`);
            return;
        }

        setTableOptions(container.id, config.tableOptions || {});
        performDataRequest(container, config);
    }

    function reloadDataTable(tableContainerId, overrideConfig) {
        const container = document.getElementById(tableContainerId);
        if (!container) {
            console.warn(`Container "${tableContainerId}" was not found in the DOM.`);
            return;
        }

        const config = Object.assign(
            {
                endpoint: container.dataset.endpoint,
                method: container.dataset.method || 'GET',
                swap: container.dataset.swap || 'innerHTML'
            },
            overrideConfig || {}
        );

        if (!config.endpoint) {
            console.warn(`No endpoint configured for container "${tableContainerId}".`);
            return;
        }

        if (overrideConfig && overrideConfig.tableOptions) {
            setTableOptions(container.id, overrideConfig.tableOptions);
        }

        config.tableContainerId = container.id;

        performDataRequest(container, config);
    }

    window.loadDataTable = loadDataTable;
    window.reloadDataTable = reloadDataTable;

    function onDocumentReady(callback) {
        if (typeof callback !== 'function') {
            return;
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
        } else {
            callback();
        }
    }

    window.onDocumentReady = onDocumentReady;

    // Sidebar is now handled by Alpine.js - no additional setup needed

    // Load top navigation from separate file
    function loadNavigation() {
        fetch('/sidebar.html')
            .then(response => response.text())
            .then(html => {
                const container = document.getElementById('sidebar-container');
                if (container) {
                    container.innerHTML = html;
                    // Initialize navigation after sidebar is loaded
                    initializeNavigation();
                }
            })
            .catch(error => {
                console.error('Error loading navigation:', error);
            });
    }

    // Initialize navigation - set active link based on current page
    function initializeNavigation() {
        // Set active link based on current page
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'auth';
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && (href.includes(currentPage) || (currentPage === 'index' && href.includes('auth')))) {
                link.classList.add('active');
            }
        });
    }

    // Convert JSON array to HTML table (flat properties only)
    function jsonToTable(data, containerId, options) {
        const tableOptions = options || {};
        if (!Array.isArray(data) || data.length === 0) {
            return '<div class="alert alert-warning">No data available</div>';
        }

        // Store data for detail view
        tableDataStore[containerId] = data;

        // Get all unique keys from all objects (flat only)
        const allKeys = new Set();
        data.forEach(item => {
            Object.keys(item).forEach(key => {
                allKeys.add(key);
            });
        });

        const keys = Array.from(allKeys);
        if (keys.length === 0) {
            return '<div class="alert alert-danger">No valid data to display</div>';
        }

        let html = '<div class="table-responsive"><table class="table table-striped table-hover"><thead class="table-dark"><tr>';
        keys.forEach(key => {
            html += `<th>${key}</th>`;
        });
        html += '<th>Actions</th></tr></thead><tbody>';

        data.forEach((item, index) => {
            html += `<tr data-row-index="${index}" data-detail-container="${containerId}">`;
            keys.forEach(key => {
                const value = formatTableCellValue(item[key], tableOptions);
                html += `<td>${value}</td>`;
            });
            html += `<td class="table-actions">${renderRowActions(containerId, index, tableOptions)}</td>`;
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        return html;
    }

    // Show detail page (exposed globally for onclick)
    window.showDetail = function(containerId, index) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const data = tableDataStore[containerId];
        if (!data || !data[index]) return;

        const item = data[index];

        // Hide table container
        const tableContainer = container.parentElement.querySelector('[id$="-table-container"]');
        if (tableContainer) {
            tableContainer.style.display = 'none';
        }

        // Show detail
        container.style.display = 'block';
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <button class="btn btn-outline-secondary btn-sm me-2" onclick="hideDetail('${containerId}')">
                        <i class="bi bi-arrow-left"></i> Back to List
                    </button>
                    <h5 class="card-title mb-0 d-inline">Detail View</h5>
                </div>
                <div class="card-body">
                    ${formatDetailObject(item, 0)}
                </div>
            </div>
        `;
    };

    // Hide detail page (exposed globally for onclick)
    window.hideDetail = function(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.style.display = 'none';
        }
        const tableContainer = container.parentElement.querySelector('[id$="-table-container"]');
        if (tableContainer) {
            tableContainer.style.display = 'block';
        }
    };

    // Format object for detail view (skip nested navigation objects)
    function formatDetailObject(obj, depth) {
        if (depth > 3) return '<em>... (too deep)</em>';
        
        if (obj === null || obj === undefined) {
            return '<em>null</em>';
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return '<em>[]</em>';
            }
            const hasNestedObjects = obj.some(item => item && typeof item === 'object');
            if (hasNestedObjects) {
                return `<em>[${obj.length} related item${obj.length === 1 ? '' : 's'}]</em>`;
            }
            let html = '<ul class="list-group list-group-flush">';
            obj.forEach((item, index) => {
                html += `<li class="list-group-item">${index}: ${escapeHtml(String(item))}</li>`;
            });
            html += '</ul>';
            return html;
        }

        if (typeof obj === 'object') {
            if (depth > 0) {
                const navLabel = getNavigationLabel(obj);
                if (navLabel) {
                    return escapeHtml(navLabel);
                }
                return '<em>[Navigation data not shown]</em>';
            }
            let html = '<dl class="row">';
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                html += `<dt class="col-sm-3">${escapeHtml(key)}:</dt>`;
                html += `<dd class="col-sm-9">${formatDetailObject(value, depth + 1)}</dd>`;
            });
            html += '</dl>';
            return html;
        }

        return escapeHtml(String(obj));
    }

    function formatTableCellValue(value, options) {
        if (value === null || value === undefined) {
            return '';
        }

        if (Array.isArray(value)) {
            return value.length > 0 ? `[${value.length} item${value.length === 1 ? '' : 's'}]` : '[]';
        }

        if (typeof value === 'object') {
            const navLabel = getNavigationLabel(value, options);
            return escapeHtml(navLabel || '[Object]');
        }

        let output = String(value);
        if (typeof value === 'string' && value.length > 50) {
            output = value.substring(0, 50) + '...';
        }
        return escapeHtml(output);
    }

    function getNavigationLabel(value, options) {
        if (value === null || typeof value !== 'object') {
            return '';
        }

        const preferredKeys = (options && options.navigationPropertyKeys) || ['name', 'title', 'label', 'code'];
        for (const key of preferredKeys) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                const candidate = value[key];
                if (typeof candidate === 'string' && candidate.trim() !== '') {
                    return candidate;
                }
            }
        }

        if (typeof value.id === 'string' || typeof value.id === 'number') {
            return `#${value.id}`;
        }

        return '';
    }

    function renderRowActions(containerId, index, options) {
        let actionsHtml = `<button class="btn btn-outline-primary btn-sm me-1" onclick="showDetail('${containerId}', ${index})">View Detail</button>`;

        if (!options || !Array.isArray(options.rowActions)) {
            return actionsHtml;
        }

        options.rowActions.forEach(action => {
            if (!action || !action.action) {
                return;
            }
            const label = escapeHtml(action.label || 'Action');
            const className = escapeHtml(action.className || 'btn btn-outline-primary btn-sm me-1');
            const actionName = escapeHtml(action.action);
            const extraAttributes = action.confirm
                ? ` data-confirm="${escapeHtml(action.confirm)}"`
                : '';

            actionsHtml += `<button class="${className}" data-action="${actionName}" data-row-index="${index}" data-detail-container="${containerId}"${extraAttributes}>${label}</button>`;
        });

        return actionsHtml;
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize - script is at end of body, so DOM is ready
    // Load navigation first
    loadNavigation();

    // Load tokens from localStorage
    const refreshToken = getRefreshToken();
    if (refreshToken) {
        const refreshInput = document.getElementById('refresh-token');
        if (refreshInput) {
            refreshInput.value = refreshToken;
        }
        setRefreshToken(refreshToken);
    }
    const accessToken = getAccessToken();
    if (accessToken) {
        setAccessToken(accessToken);
    }

    // Configure htmx to include Authorization header
    document.body.addEventListener('htmx:configRequest', function(event) {
        const accessToken = getAccessToken();
        if (accessToken && !event.detail.headers['Authorization']) {
            event.detail.headers['Authorization'] = 'Bearer ' + accessToken;
        }
    });

    // Handle HTMX response errors globally
    document.body.addEventListener('htmx:responseError', function(event) {
        const xhr = event.detail.xhr;
        const status = xhr.status;
        const target = event.detail.target;

        // Skip if already handled by specific handlers
        if (target.id === 'login-result' || target.id === 'register-result' || target.id === 'refresh-result') {
            return;
        }

        let errorMessage = xhr.responseText || 'Unknown error occurred';
        let userMessage = '';

        if (status === 401) {
            userMessage = 'Authentication required. Please login first.';
        } else if (status === 403) {
            userMessage = 'Access denied. You don\'t have permission to access this resource.';
        } else if (status === 404) {
            userMessage = 'Resource not found.';
        } else if (status >= 500) {
            userMessage = 'Server error. Please try again later.';
        } else {
            userMessage = `Request failed: ${errorMessage}`;
        }

        // Display error in target element
        if (target) {
            target.innerHTML = `<div class="alert alert-danger">${userMessage}</div>`;
        }

        console.error(`HTMX Error ${status}:`, errorMessage);
    });

    // Handle htmx responses and convert to tables
    document.body.addEventListener('htmx:afterSwap', function(event) {
        const target = event.detail.target;
        
        // Handle table containers
        if (target.id && target.id.endsWith('-table-container')) {
            try {
                const json = JSON.parse(target.textContent);
                if (Array.isArray(json)) {
                    const containerId = target.id.replace('-table-container', '-detail-container');
                    const tableOptions = tableOptionsStore[target.id] || {};
                    target.innerHTML = jsonToTable(json, containerId, tableOptions);
                } else {
                    target.innerHTML = '<div class="alert alert-danger">Expected array data</div>';
                }
            } catch (e) {
                // Not JSON or error - check for various error indicators
                const text = target.textContent.trim();
                const isError = text.includes('error') || text.includes('Error') ||
                               text.includes('401') || text.includes('403') ||
                               text.includes('Unauthorized') || text.includes('Permission denied') ||
                               text.includes('Forbidden') || text.includes('Access denied') ||
                               text.includes('Invalid') || text.includes('failed') || text.includes('Failed');

                if (isError) {
                    target.classList.add('error');
                } else if (text.includes('success') || text.includes('Success')) {
                    target.classList.add('success');
                }
            }
        }
            
        // Handle result divs (for auth forms)
        if (target.classList.contains('result') && !target.id.endsWith('-table-container')) {
            try {
                const json = JSON.parse(target.textContent);
                target.textContent = JSON.stringify(json, null, 2);
                target.classList.add('info');
            } catch (e) {
                // Not JSON, keep as is - check for various error indicators
                const text = target.textContent;
                const isError = text.includes('error') || text.includes('Error') ||
                               text.includes('401') || text.includes('403') ||
                               text.includes('Unauthorized') || text.includes('Permission denied') ||
                               text.includes('Forbidden') || text.includes('Access denied') ||
                               text.includes('Invalid') || text.includes('failed') || text.includes('Failed');

                if (isError) {
                    target.classList.add('error');
                } else if (text.includes('success') || text.includes('Success')) {
                    target.classList.add('success');
                }
            }
        }
    });

})();
