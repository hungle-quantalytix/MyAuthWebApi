(function() {
    'use strict';

    const userCardElements = {
        card: document.getElementById('user-card'),
        avatar: document.getElementById('user-avatar'),
        name: document.getElementById('user-name'),
        email: document.getElementById('user-email'),
        status: document.getElementById('user-status'),
        roles: document.getElementById('user-roles'),
        issued: document.getElementById('user-issued'),
        expiration: document.getElementById('user-expiration'),
        claims: document.getElementById('user-claims-json')
    };

    function hasUserCardElements() {
        return Object.values(userCardElements).every(Boolean);
    }

    function decodeJwt(token) {
        if (!token || typeof token !== 'string') {
            return null;
        }
        const segments = token.split('.');
        if (segments.length < 2) {
            return null;
        }
        try {
            const payload = segments[1]
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            const paddedPayload = payload.padEnd(payload.length + (4 - payload.length % 4) % 4, '=');
            const json = atob(paddedPayload);
            return JSON.parse(json);
        } catch (error) {
            console.error('Failed to decode token payload', error);
            return null;
        }
    }

    function formatTimestamp(secondsSinceEpoch) {
        if (!secondsSinceEpoch && secondsSinceEpoch !== 0) {
            return '--';
        }
        const date = new Date(secondsSinceEpoch * 1000);
        if (Number.isNaN(date.getTime())) {
            return '--';
        }
        return date.toLocaleString();
    }

    function extractRoles(payload) {
        if (!payload) {
            return [];
        }
        const roleClaim = payload.role || payload.roles;
        if (Array.isArray(roleClaim)) {
            return roleClaim;
        }
        if (typeof roleClaim === 'string' && roleClaim.trim() !== '') {
            return roleClaim.split(',').map(role => role.trim()).filter(Boolean);
        }
        return [];
    }

    function getDisplayName(payload) {
        if (!payload) {
            return 'Guest user';
        }
        return payload.name || payload.given_name || payload.email || payload.sub || 'Authenticated user';
    }

    function getDisplayEmail(payload) {
        if (!payload) {
            return 'Login to load your profile data.';
        }
        return payload.email || payload.sub || 'Email not provided';
    }

    function getAvatarInitial(payload) {
        const fallback = '?';
        const source = getDisplayName(payload);
        if (!source) {
            return fallback;
        }
        return source.trim().charAt(0).toUpperCase() || fallback;
    }

    function updateUserProfileFromToken(token) {
        if (!hasUserCardElements()) {
            return;
        }

        const payload = decodeJwt(token);
        const isAuthenticated = Boolean(payload);
        userCardElements.card.dataset.state = isAuthenticated ? 'authenticated' : 'signed-out';
        userCardElements.avatar.textContent = getAvatarInitial(payload);
        userCardElements.name.textContent = getDisplayName(payload);
        userCardElements.email.textContent = getDisplayEmail(payload);
        userCardElements.status.textContent = isAuthenticated ? 'Signed in' : 'Signed out';
        userCardElements.status.className = `badge ${isAuthenticated ? 'bg-success' : 'bg-secondary'}`;

        const roles = extractRoles(payload);
        userCardElements.roles.textContent = roles.length ? roles.join(', ') : '--';
        userCardElements.issued.textContent = payload && payload.iat ? formatTimestamp(payload.iat) : '--';
        userCardElements.expiration.textContent = payload && payload.exp ? formatTimestamp(payload.exp) : '--';
        userCardElements.claims.textContent = isAuthenticated
            ? JSON.stringify(payload, null, 2)
            : 'No token loaded.';
    }

    async function copyAccessToken(button) {
        if (!button) {
            return;
        }
        const originalLabel = button.textContent;
        const token = window.getAccessToken();
        if (!token) {
            setTemporaryButtonLabel(button, 'No token to copy', originalLabel);
            return;
        }
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(token);
            } else {
                fallbackCopyText(token);
            }
            setTemporaryButtonLabel(button, 'Copied!', originalLabel);
        } catch (error) {
            console.error('Unable to copy token', error);
            setTemporaryButtonLabel(button, 'Copy failed', originalLabel);
        }
    }

    function fallbackCopyText(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-1000px';
        textarea.style.top = '-1000px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    function setTemporaryButtonLabel(button, label, original) {
        button.textContent = label;
        button.disabled = true;
        setTimeout(() => {
            button.textContent = original;
            button.disabled = false;
        }, 1800);
    }

    function setupUserProfileActions() {
        const copyButton = document.getElementById('copy-access-token');
        if (copyButton) {
            copyButton.addEventListener('click', () => copyAccessToken(copyButton));
        }

        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                window.setAccessToken('');
                window.setRefreshToken('');
                updateUserProfileFromToken('');
                const loginResult = document.getElementById('login-result');
                if (loginResult) {
                    loginResult.innerHTML = '<div class="alert alert-info">You signed out locally.</div>';
                }
            });
        }
    }

    // Handle login response (exposed globally for htmx)
    window.handleLoginResponse = function(event) {
        const status = event.detail.xhr.status;
        const target = document.getElementById('login-result');

        if (status === 200) {
            try {
                const response = JSON.parse(event.detail.xhr.responseText);
                if (response.accessToken) {
                    window.setAccessToken(response.accessToken);
                }
                if (response.refreshToken) {
                    window.setRefreshToken(response.refreshToken);
                }
                target.innerHTML = '<div class="alert alert-success">Login successful!</div>';
            } catch (e) {
                console.error('Error parsing login response:', e);
                target.innerHTML = '<div class="alert alert-warning">Login successful but failed to parse response.</div>';
            }
        } else {
            // Handle error responses
            let errorMessage = event.detail.xhr.responseText || 'Unknown error occurred';
            if (status === 401) {
                errorMessage = 'Invalid email or password.';
            } else if (status === 403) {
                errorMessage = 'Account is disabled or access denied.';
            } else if (status === 400) {
                errorMessage = 'Invalid request data.';
            }
            target.innerHTML = `<div class="alert alert-danger">Login failed: ${errorMessage}</div>`;
        }
    };

    // Handle refresh response (exposed globally for htmx)
    window.handleRefreshResponse = function(event) {
        const status = event.detail.xhr.status;
        const target = document.getElementById('refresh-result');

        if (status === 200) {
            try {
                const response = JSON.parse(event.detail.xhr.responseText);
                if (response.accessToken) {
                    window.setAccessToken(response.accessToken);
                }
                if (response.refreshToken) {
                    window.setRefreshToken(response.refreshToken);
                }
                target.innerHTML = '<div class="alert alert-success">Token refresh successful!</div>';
            } catch (e) {
                console.error('Error parsing refresh response:', e);
                target.innerHTML = '<div class="alert alert-warning">Token refresh successful but failed to parse response.</div>';
            }
        } else {
            // Handle error responses
            let errorMessage = event.detail.xhr.responseText || 'Unknown error occurred';
            if (status === 401) {
                errorMessage = 'Invalid or expired refresh token.';
            } else if (status === 403) {
                errorMessage = 'Refresh token is not allowed.';
            } else if (status === 400) {
                errorMessage = 'Invalid request data.';
            }
            target.innerHTML = `<div class="alert alert-danger">Token refresh failed: ${errorMessage}</div>`;
        }
    };

    // Handle register response (exposed globally for htmx)
    window.handleRegisterResponse = function(event) {
        const status = event.detail.xhr.status;
        const target = document.getElementById('register-result');

        if (status === 201 || status === 200) {
            target.innerHTML = '<div class="alert alert-success">Registration successful! You can now login.</div>';
        } else {
            // Handle error responses
            let errorMessage = event.detail.xhr.responseText || 'Unknown error occurred';
            if (status === 400) {
                errorMessage = 'Invalid registration data. Please check your email and password.';
            } else if (status === 409) {
                errorMessage = 'User with this email already exists.';
            } else if (status === 422) {
                errorMessage = 'Validation failed. Please check your input.';
            }
            target.innerHTML = `<div class="alert alert-danger">Registration failed: ${errorMessage}</div>`;
        }
    };

    document.addEventListener('auth:accessTokenChanged', event => {
        updateUserProfileFromToken(event.detail && event.detail.token ? event.detail.token : '');
    });

    if (window.onDocumentReady) {
        window.onDocumentReady(() => {
            updateUserProfileFromToken(window.getAccessToken());
            setupUserProfileActions();
        });
    } else {
        updateUserProfileFromToken(window.getAccessToken());
        setupUserProfileActions();
    }

})();
