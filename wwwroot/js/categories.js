(function() {
    'use strict';

    const CATEGORIES_ENDPOINT = '/api/Categories';
    const TABLE_CONTAINER_ID = 'categories-table-container';
    const DETAIL_CONTAINER_ID = 'categories-detail-container';

    const elements = {
        form: null,
        idInput: null,
        nameInput: null,
        descriptionInput: null,
        submitButton: null,
        cancelButton: null,
        title: null,
        feedback: null,
        tableContainer: null
    };

    let editingCategory = null;

    function initializeCategoriesPage() {
        if (typeof window.loadDataTable !== 'function') {
            console.error('loadDataTable helper is unavailable.');
            return;
        }

        cacheElements();
        bindEvents();
        loadCategories();
    }

    function cacheElements() {
        elements.form = document.getElementById('category-form');
        elements.idInput = document.getElementById('category-id');
        elements.nameInput = document.getElementById('category-name');
        elements.descriptionInput = document.getElementById('category-description');
        elements.submitButton = document.getElementById('category-submit-button');
        elements.cancelButton = document.getElementById('category-cancel-button');
        elements.title = document.getElementById('category-form-title');
        elements.feedback = document.getElementById('category-feedback');
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

    function loadCategories() {
        window.loadDataTable({
            tableContainerId: TABLE_CONTAINER_ID,
            endpoint: CATEGORIES_ENDPOINT,
            tableOptions: {
                rowActions: [
                    { label: 'Edit', action: 'edit-category', className: 'btn btn-outline-secondary btn-sm me-1' },
                    { label: 'Delete', action: 'delete-category', className: 'btn btn-outline-danger btn-sm' }
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

        if (action === 'edit-category') {
            populateForm(rowData);
        } else if (action === 'delete-category') {
            confirmDelete(rowData);
        }
    }

    function populateForm(category) {
        if (!elements.form) {
            return;
        }

        editingCategory = category;
        elements.idInput.value = category.id;
        elements.nameInput.value = category.name || '';
        elements.descriptionInput.value = category.description || '';
        elements.title.textContent = `Edit "${category.name || 'Category'}"`;
        elements.submitButton.textContent = 'Update Category';
        elements.cancelButton.style.display = 'inline-flex';
    }

    function resetForm() {
        if (!elements.form) {
            return;
        }
        elements.form.reset();
        elements.idInput.value = '';
        editingCategory = null;
        elements.title.textContent = 'Create Category';
        elements.submitButton.textContent = 'Create Category';
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
        saveCategory(payload, isEdit);
    }

    function buildPayload() {
        const name = (elements.nameInput.value || '').trim();
        if (!name) {
            showFeedback('Name is required.', 'error');
            elements.nameInput.focus();
            return null;
        }
        if (name.length > 50) {
            showFeedback('Name must be 50 characters or fewer.', 'error');
            elements.nameInput.focus();
            return null;
        }

        const description = (elements.descriptionInput.value || '').trim();
        if (description.length > 200) {
            showFeedback('Description must be 200 characters or fewer.', 'error');
            elements.descriptionInput.focus();
            return null;
        }

        const payload = {
            name,
            description: description || null,
            createdAt: new Date().toISOString(),
            updatedAt: null
        };

        if (elements.idInput.value) {
            payload.id = Number(elements.idInput.value);
            payload.createdAt = editingCategory && editingCategory.createdAt
                ? editingCategory.createdAt
                : payload.createdAt;
            payload.updatedAt = new Date().toISOString();
        }

        return payload;
    }

    async function saveCategory(payload, isEdit) {
        try {
            toggleFormDisabled(true);
            const url = isEdit ? `${CATEGORIES_ENDPOINT}/${payload.id}` : CATEGORIES_ENDPOINT;
            const method = isEdit ? 'PUT' : 'POST';

            await apiRequest(url, {
                method,
                body: JSON.stringify(payload)
            });

            const message = `Category ${isEdit ? 'updated' : 'created'} successfully.`;
            showFeedback(message, 'success');
            if (typeof window.showToast === 'function') {
                window.showToast(message, 'success');
            }
            resetForm();
            window.reloadDataTable(TABLE_CONTAINER_ID);
        } catch (error) {
            console.error('Unable to save category', error);
            showFeedback(error.message || 'Unable to save category.', 'error');
        } finally {
            toggleFormDisabled(false);
        }
    }

    async function confirmDelete(category) {
        if (!category || !category.id) {
            return;
        }

        const confirmed = window.confirm(`Are you sure you want to delete "${category.name}"?`);
        if (!confirmed) {
            return;
        }

        try {
            showFeedback('Deleting category...', 'info');
            await apiRequest(`${CATEGORIES_ENDPOINT}/${category.id}`, { method: 'DELETE' });
            const message = 'Category deleted successfully.';
            showFeedback(message, 'success');
            if (typeof window.showToast === 'function') {
                window.showToast(message, 'success');
            }
            resetForm();
            window.reloadDataTable(TABLE_CONTAINER_ID);
        } catch (error) {
            console.error('Unable to delete category', error);
            showFeedback(error.message || 'Unable to delete category.', 'error');
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
        const inputs = elements.form.querySelectorAll('input, textarea, button');
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
        window.onDocumentReady(initializeCategoriesPage);
    } else {
        document.addEventListener('DOMContentLoaded', initializeCategoriesPage, { once: true });
    }
})();

