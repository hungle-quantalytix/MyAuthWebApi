(function() {
    'use strict';

    const PRODUCTS_ENDPOINT = '/api/Products';
    const CATEGORIES_ENDPOINT = '/api/Categories';
    const TABLE_CONTAINER_ID = 'products-table-container';
    const DETAIL_CONTAINER_ID = 'products-detail-container';

    const elements = {
        form: null,
        idInput: null,
        nameInput: null,
        descriptionInput: null,
        priceInput: null,
        stockInput: null,
        categorySelect: null,
        submitButton: null,
        cancelButton: null,
        title: null,
        feedback: null,
        tableContainer: null
    };

    let editingProduct = null;

    function initializeProductsPage() {
        if (typeof window.loadDataTable !== 'function') {
            console.error('loadDataTable helper is unavailable.');
            return;
        }

        cacheElements();
        bindEvents();
        loadCategories();
        loadProducts();
    }

    function cacheElements() {
        elements.form = document.getElementById('product-form');
        elements.idInput = document.getElementById('product-id');
        elements.nameInput = document.getElementById('product-name');
        elements.descriptionInput = document.getElementById('product-description');
        elements.priceInput = document.getElementById('product-price');
        elements.stockInput = document.getElementById('product-stock');
        elements.categorySelect = document.getElementById('product-category');
        elements.submitButton = document.getElementById('product-submit-button');
        elements.cancelButton = document.getElementById('product-cancel-button');
        elements.title = document.getElementById('product-form-title');
        elements.feedback = document.getElementById('product-feedback');
        elements.tableContainer = document.getElementById(TABLE_CONTAINER_ID);
    }

    function bindEvents() {
        if (elements.form) {
            elements.form.addEventListener('submit', onFormSubmit);
        }
        if (elements.cancelButton) {
            elements.cancelButton.addEventListener('click', function(event) {
                event.preventDefault();
                resetForm();
            });
        }
        if (elements.tableContainer) {
            elements.tableContainer.addEventListener('click', onTableClick);
        }
    }

    function loadProducts() {
        window.loadDataTable({
            tableContainerId: TABLE_CONTAINER_ID,
            endpoint: PRODUCTS_ENDPOINT,
            tableOptions: {
                rowActions: [
                    { label: 'Edit', action: 'edit-product', className: 'btn btn-outline-secondary btn-sm me-1' },
                    { label: 'Delete', action: 'delete-product', className: 'btn btn-outline-danger btn-sm' }
                ],
                navigationPropertyKeys: ['name', 'title']
            }
        });
    }

    async function loadCategories() {
        if (!elements.categorySelect) {
            return;
        }

        elements.categorySelect.innerHTML = '<option value="">Loading...</option>';
        elements.categorySelect.disabled = true;

        try {
            const response = await authorizedFetch(CATEGORIES_ENDPOINT);
            const categories = await response.json();

            if (!Array.isArray(categories) || categories.length === 0) {
                elements.categorySelect.innerHTML = '<option value="">No categories available</option>';
                return;
            }

            const options = ['<option value="">Select a category</option>'];
            categories.forEach(category => {
                options.push(`<option value="${category.id}">${escapeHtml(category.name || `Category #${category.id}`)}</option>`);
            });

            elements.categorySelect.innerHTML = options.join('');
            elements.categorySelect.disabled = false;
        } catch (error) {
            console.error('Unable to load categories', error);
            elements.categorySelect.innerHTML = '<option value="">Unable to load categories</option>';
            showFeedback(error.message || 'Unable to load categories', 'error');
        }
    }

    function onTableClick(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const detailContainer = button.dataset.detailContainer || DETAIL_CONTAINER_ID;
        const index = Number(button.dataset.rowIndex);
        if (Number.isNaN(index) || !window.getTableRowData) {
            return;
        }

        const rowData = window.getTableRowData(detailContainer, index);
        if (!rowData) {
            return;
        }

        if (action === 'edit-product') {
            populateForm(rowData);
        } else if (action === 'delete-product') {
            confirmDelete(rowData);
        }
    }

    function populateForm(product) {
        if (!elements.form) {
            return;
        }

        editingProduct = product;
        elements.idInput.value = product.id;
        elements.nameInput.value = product.name || '';
        elements.descriptionInput.value = product.description || '';
        elements.priceInput.value = product.price !== undefined && product.price !== null ? product.price : '';
        elements.stockInput.value = product.stock !== undefined && product.stock !== null ? product.stock : 0;

        ensureCategoryOption(product);
        elements.categorySelect.value = product.categoryId || '';

        elements.title.textContent = `Edit "${product.name || 'Product'}"`;
        elements.submitButton.textContent = 'Update Product';
        elements.cancelButton.style.display = 'inline-flex';
    }

    function ensureCategoryOption(product) {
        if (!elements.categorySelect || !product || !product.categoryId) {
            return;
        }
        const existingOption = elements.categorySelect.querySelector(`option[value="${product.categoryId}"]`);
        if (!existingOption) {
            const option = document.createElement('option');
            option.value = product.categoryId;
            const categoryName = product.category && product.category.name
                ? product.category.name
                : `Category #${product.categoryId}`;
            option.textContent = categoryName;
            elements.categorySelect.appendChild(option);
        }
    }

    function resetForm() {
        if (!elements.form) {
            return;
        }

        elements.form.reset();
        elements.idInput.value = '';
        editingProduct = null;
        elements.title.textContent = 'Create Product';
        elements.submitButton.textContent = 'Create Product';
        elements.cancelButton.style.display = 'none';
        elements.categorySelect.disabled = false;
        clearFeedback();
    }

    function onFormSubmit(event) {
        event.preventDefault();
        if (!elements.form) {
            return;
        }

        const payload = buildPayload();
        if (!payload) {
            return;
        }

        const isEdit = Boolean(elements.idInput.value);
        saveProduct(payload, isEdit);
    }

    function buildPayload() {
        const name = (elements.nameInput.value || '').trim();
        if (!name) {
            showFeedback('Name is required.', 'error');
            elements.nameInput.focus();
            return null;
        }

        const description = (elements.descriptionInput.value || '').trim();

        const price = parseFloat(elements.priceInput.value);
        if (Number.isNaN(price) || price < 0) {
            showFeedback('Price must be a positive number.', 'error');
            elements.priceInput.focus();
            return null;
        }

        const stock = parseInt(elements.stockInput.value, 10);
        if (Number.isNaN(stock) || stock < 0) {
            showFeedback('Stock must be zero or greater.', 'error');
            elements.stockInput.focus();
            return null;
        }

        const categoryId = parseInt(elements.categorySelect.value, 10);
        if (Number.isNaN(categoryId)) {
            showFeedback('Please select a category.', 'error');
            elements.categorySelect.focus();
            return null;
        }

        const isEdit = Boolean(elements.idInput.value);
        const payload = {
            name,
            description: description || null,
            price,
            stock,
            categoryId
        };

        if (isEdit) {
            payload.id = Number(elements.idInput.value);
            payload.createdAt = editingProduct && editingProduct.createdAt
                ? editingProduct.createdAt
                : new Date().toISOString();
            payload.updatedAt = new Date().toISOString();
        } else {
            payload.createdAt = new Date().toISOString();
            payload.updatedAt = null;
        }

        return payload;
    }

    async function saveProduct(payload, isEdit) {
        try {
            toggleFormDisabled(true);
            const url = isEdit ? `${PRODUCTS_ENDPOINT}/${payload.id}` : PRODUCTS_ENDPOINT;
            const method = isEdit ? 'PUT' : 'POST';

            const response = await authorizedFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            if (!isEdit) {
                await response.json().catch(() => null);
            }

            showFeedback(`Product ${isEdit ? 'updated' : 'created'} successfully.`, 'success');
            resetForm();
            window.reloadDataTable(TABLE_CONTAINER_ID);
        } catch (error) {
            console.error('Unable to save product', error);
            showFeedback(error.message || 'Unable to save product.', 'error');
        } finally {
            toggleFormDisabled(false);
        }
    }

    async function confirmDelete(product) {
        if (!product || !product.id) {
            return;
        }

        const confirmed = window.confirm(`Are you sure you want to delete "${product.name}"?`);
        if (!confirmed) {
            return;
        }

        try {
            showFeedback('Deleting product...', 'info');
            await authorizedFetch(`${PRODUCTS_ENDPOINT}/${product.id}`, { method: 'DELETE' });
            showFeedback('Product deleted successfully.', 'success');
            resetForm();
            window.reloadDataTable(TABLE_CONTAINER_ID);
        } catch (error) {
            console.error('Unable to delete product', error);
            showFeedback(error.message || 'Unable to delete product.', 'error');
        }
    }

    function toggleFormDisabled(disabled) {
        if (!elements.form) {
            return;
        }
        const inputs = elements.form.querySelectorAll('input, textarea, select, button');
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

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    if (typeof window.onDocumentReady === 'function') {
        window.onDocumentReady(initializeProductsPage);
    } else {
        document.addEventListener('DOMContentLoaded', initializeProductsPage, { once: true });
    }
})();

