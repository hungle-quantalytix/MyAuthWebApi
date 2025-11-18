(function() {
    'use strict';

    const USERS_ENDPOINT = '/api/Users';
    const ROLES_ENDPOINT = '/api/Roles';
    const ASSIGN_ROLE_ENDPOINT = '/api/Users/assign-role';
    const TABLE_CONTAINER_ID = 'users-table-container';

    const elements = {
        tableContainer: null,
        form: null,
        emailInput: null,
        roleSelect: null,
        submitButton: null,
        feedback: null,
        emailDataList: null
    };

    function initializeUsersPage() {
        if (typeof window.loadDataTable !== 'function') {
            console.error('loadDataTable helper is unavailable.');
            return;
        }

        cacheElements();
        bindEvents();
        loadUsers();
        loadRoles();
        loadUserEmails();
    }

    function cacheElements() {
        elements.tableContainer = document.getElementById(TABLE_CONTAINER_ID);
        elements.form = document.getElementById('assign-role-form');
        elements.emailInput = document.getElementById('assign-role-email');
        elements.roleSelect = document.getElementById('assign-role-select');
        elements.submitButton = document.getElementById('assign-role-submit');
        elements.feedback = document.getElementById('assign-role-feedback');
        elements.emailDataList = document.getElementById('user-email-options');
    }

    function bindEvents() {
        if (elements.form) {
            elements.form.addEventListener('submit', onAssignRoleSubmit);
        }
    }

    function loadUsers() {
        window.loadDataTable({
            tableContainerId: TABLE_CONTAINER_ID,
            endpoint: USERS_ENDPOINT,
            tableOptions: {
                navigationPropertyKeys: ['email']
            }
        });
    }

    async function loadRoles() {
        if (!elements.roleSelect) {
            return;
        }

        setRoleSelectState({ loading: true });

        try {
            const response = await apiRequest(ROLES_ENDPOINT);
            const roles = await response.json();

            if (!Array.isArray(roles) || roles.length === 0) {
                elements.roleSelect.innerHTML = '<option value="">No roles found</option>';
                return;
            }

            const options = ['<option value="">Select role</option>'];
            roles.forEach(role => {
                options.push(`<option value="${role.name}">${escapeHtml(role.name)}</option>`);
            });
            elements.roleSelect.innerHTML = options.join('');
        } catch (error) {
            console.error('Unable to load roles', error);
            elements.roleSelect.innerHTML = '<option value="">Unable to load roles</option>';
            showFeedback(error.message || 'Unable to load roles.', 'error');
        } finally {
            setRoleSelectState({ loading: false });
        }
    }

    async function loadUserEmails() {
        if (!elements.emailDataList) {
            return;
        }

        try {
            const response = await apiRequest(USERS_ENDPOINT);
            const users = await response.json();

            if (!Array.isArray(users)) {
                return;
            }

            elements.emailDataList.innerHTML = users
                .map(user => `<option value="${escapeHtml(user.email || '')}"></option>`)
                .join('');
        } catch (error) {
            console.warn('Unable to load user emails', error);
        }
    }

    async function onAssignRoleSubmit(event) {
        event.preventDefault();

        const email = (elements.emailInput.value || '').trim();
        const role = elements.roleSelect.value;
        if (!email || !role) {
            showFeedback('Email and role are required.', 'error');
            return;
        }

        try {
            setAssignFormDisabled(true);
            showFeedback('Assigning role...', 'info');

            await apiRequest(ASSIGN_ROLE_ENDPOINT, {
                method: 'POST',
                body: JSON.stringify({ email, role })
            });

            const message = `Role "${role}" assigned to ${email}.`;
            showFeedback(message, 'success');
            if (typeof window.showToast === 'function') {
                window.showToast(message, 'success');
            }
            elements.form.reset();
            loadUsers();
            loadUserEmails();
        } catch (error) {
            console.error('Unable to assign role', error);
            showFeedback(error.message || 'Unable to assign role.', 'error');
        } finally {
            setAssignFormDisabled(false);
        }
    }

    function setAssignFormDisabled(disabled) {
        if (!elements.form) {
            return;
        }

        const inputs = elements.form.querySelectorAll('input, select, button');
        inputs.forEach(input => {
            input.disabled = disabled;
        });

        if (disabled) {
            elements.submitButton.textContent = 'Assigning...';
        } else {
            elements.submitButton.textContent = 'Assign';
        }
    }

    function setRoleSelectState({ loading }) {
        if (!elements.roleSelect) {
            return;
        }
        elements.roleSelect.disabled = Boolean(loading);
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

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    if (typeof window.onDocumentReady === 'function') {
        window.onDocumentReady(initializeUsersPage);
    } else {
        document.addEventListener('DOMContentLoaded', initializeUsersPage, { once: true });
    }
})();

