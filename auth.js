document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:5000/api/auth';
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabButtons = document.querySelectorAll('.tab-btn');
  
    // Tab switching
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        if (button.dataset.tab === 'login') {
          loginForm.style.display = 'block';
          registerForm.style.display = 'none';
        } else {
          loginForm.style.display = 'none';
          registerForm.style.display = 'block';
        }
      });
    });
  
    // Login handler
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
  
      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
  
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');
  
        localStorage.setItem('token', data.token);
        window.location.href = 'home.html';
      } catch (error) {
        alert(error.message);
      }
    });
  
    // Register handler
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('register-username').value;
      const password = document.getElementById('register-password').value;
  
      try {
        const response = await fetch(`${API_BASE_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
  
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Registration failed');
  
        alert('Registration successful! Please login.');
        document.querySelector('[data-tab="login"]').click();
        registerForm.reset();
      } catch (error) {
        alert(error.message);
      }
    });
  });