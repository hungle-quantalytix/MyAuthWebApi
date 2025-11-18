(function() {
    'use strict';

    const ROLES_ENDPOINT = '/api/Roles';
    const TABLE_CONTAINER_ID = 'roles-table-container';
    const DETAIL_CONTAINER_ID = 'roles-detail-container';

    const elements = {
        form: null,
        idInput: null,
        idWrapper: null,
        idDisplay: null,
        nameInput: null,
        normalizedInput: null,
        concurrencyInput: null,
        submitButton: null,
        cancelButton: null,
        title: null,
        feedback: null,
        tableContainer: null
    };

    let editingRole = null;

    function initializeRolesPage() {
        if (typeof window.loadDataTable !== 'function') {
            console.error('loadDataTable helper is unavailable.');
            return;
        }

        cacheElements();
        bindEvents();
        loadRoles();
    }

    function cacheElements() {
        elements.form = document.getElementById('role-form');
        elements.idInput = document.getElementById('role-id');
        elements.idWrapper = document.getElementById('role-id-wrapper');
        elements.idDisplay = document.getElementById('role-id-display');
        elements.nameInput = document.getElementById('role-name');
        elements.normalizedInput = document.getElementById('role-normalized-name');
        elements.concurrencyInput = document.getElementById('role-concurrency-stamp');
        elements.submitButton = document.getElementById('role-submit-button');
        elements.cancelButton = document.getElementById('role-cancel-button');
        elements.title = document.getElementById('role-form-title');
        elements.feedback = document.getElementById('role-feedback');
        elements.tableContainer = document.getElementById(TABLE_CONTAINER_ID);
    }

    function bindEvents() {
        if (elements.form) {
            elements.form.addEventListener('submit', onFormSubmit);
        }
        if (elements.cancelButton) {
            elements.cancelButton.addEventListener('click', event => {
                event.preventDefault();
                resetForm();
            });
        }
        if (elements.tableContainer) {
            elements.tableContainer.addEventListener('click', onTableClick);
        }
    }

    function loadRoles() {
        window.loadDataTable({
            tableContainerId: TABLE_CONTAINER_ID,
            endpoint: ROLES_ENDPOINT,
            tableOptions: {
                rowActions: [
                    { label: 'Edit', action: 'edit-role', className: 'btn btn-outline-secondary btn-sm me-1' },
                    { label: 'Delete', action: 'delete-role', className: 'btn btn-outline-danger btn-sm' }
                ],
                navigationPropertyKeys: ['name']
            }
        });
    }

    function onTableClick(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const index = Number(button.dataset.rowIndex);

        if (Number.isNaN(index) || typeof window.getTableRowData !== 'function') {
            return;
        }

        const rowData = window.getTableRowData(DETAIL_CONTAINER_ID, index);
        if (!rowData) {
            return;
        }

        if (action === 'edit-role') {
            populateForm(rowData);
        } else if (action === 'delete-role') {
            confirmDelete(rowData);
        }
    }

    function populateForm(role) {
        editingRole = role;

        elements.idInput.value = role.id || '';
        elements.idDisplay.value = role.id || '';
        elements.idWrapper.style.display = role.id ? 'block' : 'none';
        elements.nameInput.value = role.name || '';
        elements.normalizedInput.value = role.normalizedName || '';
        elements.concurrencyInput.value = role.concurrencyStamp || '';

        elements.title.textContent = `Edit "${role.name || 'Role'}"`;
        elements.submitButton.textContent = 'Update Role';
        elements.cancelButton.style.display = 'inline-flex';
    }

    function resetForm() {
        if (!elements.form) {
            return;
        }
        elements.form.reset();
        elements.idInput.value = '';
        elements.idDisplay.value = '';
        elements.normalizedInput.value = '';
        elements.concurrencyInput.value = '';
        elements.idWrapper.style.display = 'none';
        editingRole = null;
        elements.title.textContent = 'Create Role';
        elements.submitButton.textContent = 'Create Role';
        elements.cancelButton.style.display = 'none';
        clearFeedback();
    }

    function onFormSubmit(event) {
        event.preventDefault();
        const payload = buildPayload();
        if (!payload) {
            return;
        }

        const isEdit = Boolean(elements.idInput.value);
        saveRole(payload, isEdit);
    }

    function buildPayload() {
        const name = (elements.nameInput.value || '').trim();
        if (!name) {
            showFeedback('Role name is required.', 'error');
            elements.nameInput.focus();
            return null;
        }

        const payload = {
            name,
            normalizedName: (elements.normalizedInput.value || name).trim().toUpperCase()
        };

        const concurrencyStamp = elements.concurrencyInput.value;
        if (concurrencyStamp) {
            payload.concurrencyStamp = concurrencyStamp;
        }

        if (elements.idInput.value) {
            payload.id = elements.idInput.value;
        }

        return payload;
    }

    async function saveRole(payload, isEdit) {
        try {
            toggleFormDisabled(true);
            const url = isEdit ? `${ROLES_ENDPOINT}/${payload.id}` : ROLES_ENDPOINT;
            const method = isEdit ? 'PUT' : 'POST';

            await apiRequest(url, {
                method,
                body: JSON.stringify(payload)
            });

            const message = `Role ${isEdit ? 'updated' : 'created'} successfully.`;
            showFeedback(message, 'success');
            if (typeof window.showToast === 'function') {
                window.showToast(message, 'success');
            }
            resetForm();
            window.reloadDataTable(TABLE_CONTAINER_ID);
        } catch (error) {
            console.error('Unable to save role', error);
            showFeedback(error.message || 'Unable to save role.', 'error');
        } finally {
            toggleFormDisabled(false);
        }
    }

    async function confirmDelete(role) {
        if (!role || !role.id) {
            return;
        }

        const confirmed = window.confirm(`Delete role "${role.name}"?`);
        if (!confirmed) {
            return;
        }

        try {
            showFeedback('Deleting role...', 'info');
            await apiRequest(`${ROLES_ENDPOINT}/${role.id}`, { method: 'DELETE' });
            const message = 'Role deleted successfully.';
            showFeedback(message, 'success');
            if (typeof window.showToast === 'function') {
                window.showToast(message, 'success');
            }
            resetForm();
            window.reloadDataTable(TABLE_CONTAINER_ID);
        } catch (error) {
            console.error('Unable to delete role', error);
            showFeedback(error.message || 'Unable to delete role.', 'error');
        }
    }

    async function apiRequest(url, options) {
        if (typeof window.authorizedFetch === 'function') {
            return window.authorizedFetch(url, options);
        }
        const response = await fetch(url, options);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Request failed.');
        }
        return response;
    }

    function toggleFormDisabled(disabled) {
        if (!elements.form) {
            return;
        }
        const inputs = elements.form.querySelectorAll('input, button');
        inputs.forEach(el => {
            el.disabled = disabled;
        });
    }

    function showFeedback(message, type) {
        if (!elements.feedback) {
            return;
        }
        elements.feedback.style.display = 'block';
        elements.feedback.textContent = message;
        elements.feedback.classList.remove('success', 'error', 'info');
        if (type) {
            elements.feedback.classList.add(type);
        }
    }

    function clearFeedback() {
        if (!elements.feedback) {
            return;
        }
        elements.feedback.style.display = 'none';
        elements.feedback.textContent = '';
        elements.feedback.classList.remove('success', 'error', 'info');
    }

    if (typeof window.onDocumentReady === 'function') {
        window.onDocumentReady(initializeRolesPage);
    } else {
        document.addEventListener('DOMContentLoaded', initializeRolesPage, { once: true });
    }
})();

