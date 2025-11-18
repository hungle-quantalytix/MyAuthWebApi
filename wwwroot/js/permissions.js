(function() {
    'use strict';

    const PERMISSIONS_ENDPOINT = '/api/Permissions';
    const TABLE_CONTAINER_ID = 'permissions-table-container';
    const DETAIL_CONTAINER_ID = 'permissions-detail-container';

    const elements = {
        form: null,
        idInput: null,
        resourceTypeInput: null,
        resourceIdInput: null,
        actionInput: null,
        subjectTypeInput: null,
        subjectIdInput: null,
        submitButton: null,
        cancelButton: null,
        title: null,
        feedback: null,
        tableContainer: null
    };

    let editingPermission = null;

    function initializePermissionsPage() {
        if (typeof window.loadDataTable !== 'function') {
            console.error('loadDataTable helper is unavailable.');
            return;
        }

        cacheElements();
        bindEvents();
        loadPermissions();
    }

    function cacheElements() {
        elements.form = document.getElementById('permission-form');
        elements.idInput = document.getElementById('permission-id');
        elements.resourceTypeInput = document.getElementById('permission-resource-type');
        elements.resourceIdInput = document.getElementById('permission-resource-id');
        elements.actionInput = document.getElementById('permission-action');
        elements.subjectTypeInput = document.getElementById('permission-subject-type');
        elements.subjectIdInput = document.getElementById('permission-subject-id');
        elements.submitButton = document.getElementById('permission-submit-button');
        elements.cancelButton = document.getElementById('permission-cancel-button');
        elements.title = document.getElementById('permission-form-title');
        elements.feedback = document.getElementById('permission-feedback');
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

    function loadPermissions() {
        window.loadDataTable({
            tableContainerId: TABLE_CONTAINER_ID,
            endpoint: PERMISSIONS_ENDPOINT,
            tableOptions: {
                rowActions: [
                    { label: 'Edit', action: 'edit-permission', className: 'btn btn-outline-secondary btn-sm me-1' },
                    { label: 'Delete', action: 'delete-permission', className: 'btn btn-outline-danger btn-sm' }
                ]
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

        if (action === 'edit-permission') {
            populateForm(rowData);
        } else if (action === 'delete-permission') {
            confirmDelete(rowData);
        }
    }

    function populateForm(permission) {
        editingPermission = permission;
        elements.idInput.value = permission.id || '';
        elements.resourceTypeInput.value = permission.resourceType || '';
        elements.resourceIdInput.value = permission.resourceId || '';
        elements.actionInput.value = permission.action || '';
        elements.subjectTypeInput.value = permission.subjectType || '';
        elements.subjectIdInput.value = permission.subjectId || '';

        elements.title.textContent = `Edit Permission #${permission.id}`;
        elements.submitButton.textContent = 'Update Permission';
        elements.cancelButton.style.display = 'inline-flex';
    }

    function resetForm() {
        if (!elements.form) {
            return;
        }

        elements.form.reset();
        elements.idInput.value = '';
        editingPermission = null;
        elements.title.textContent = 'Create Permission';
        elements.submitButton.textContent = 'Create Permission';
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
        savePermission(payload, isEdit);
    }

    function buildPayload() {
        const resourceType = (elements.resourceTypeInput.value || '').trim();
        const resourceId = (elements.resourceIdInput.value || '').trim();
        const action = (elements.actionInput.value || '').trim();
        const subjectType = (elements.subjectTypeInput.value || '').trim();
        const subjectId = (elements.subjectIdInput.value || '').trim();

        if (!resourceType || !resourceId || !action || !subjectType || !subjectId) {
            showFeedback('All fields are required.', 'error');
            return null;
        }

        const payload = {
            resourceType,
            resourceId,
            action,
            subjectType,
            subjectId
        };

        if (elements.idInput.value) {
            payload.id = Number(elements.idInput.value);
        }

        return payload;
    }

    async function savePermission(payload, isEdit) {
        try {
            toggleFormDisabled(true);
            const url = isEdit ? `${PERMISSIONS_ENDPOINT}/${payload.id}` : PERMISSIONS_ENDPOINT;
            const method = isEdit ? 'PUT' : 'POST';

            await apiRequest(url, {
                method,
                body: JSON.stringify(payload)
            });

            const message = `Permission ${isEdit ? 'updated' : 'created'} successfully.`;
            showFeedback(message, 'success');
            if (typeof window.showToast === 'function') {
                window.showToast(message, 'success');
            }
            resetForm();
            window.reloadDataTable(TABLE_CONTAINER_ID);
        } catch (error) {
            console.error('Unable to save permission', error);
            showFeedback(error.message || 'Unable to save permission.', 'error');
        } finally {
            toggleFormDisabled(false);
        }
    }

    async function confirmDelete(permission) {
        if (!permission || !permission.id) {
            return;
        }

        const confirmed = window.confirm(`Delete permission #${permission.id}?`);
        if (!confirmed) {
            return;
        }

        try {
            showFeedback('Deleting permission...', 'info');
            await apiRequest(`${PERMISSIONS_ENDPOINT}/${permission.id}`, { method: 'DELETE' });
            const message = 'Permission deleted successfully.';
            showFeedback(message, 'success');
            if (typeof window.showToast === 'function') {
                window.showToast(message, 'success');
            }
            resetForm();
            window.reloadDataTable(TABLE_CONTAINER_ID);
        } catch (error) {
            console.error('Unable to delete permission', error);
            showFeedback(error.message || 'Unable to delete permission.', 'error');
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
        window.onDocumentReady(initializePermissionsPage);
    } else {
        document.addEventListener('DOMContentLoaded', initializePermissionsPage, { once: true });
    }
})();

