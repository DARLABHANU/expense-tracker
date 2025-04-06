document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'https://expense-tracker-qruc.onrender.com/api/expenses';
  const expenseForm = document.getElementById('expense-form');
  const expensesContainer = document.getElementById('expenses-container');
  const totalAmountElement = document.getElementById('total-amount');
  const expensesCountElement = document.getElementById('expenses-count');

  // Shared fetch configuration
  const fetchConfig = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    credentials: 'same-origin' // Change to 'include' if using cookies
  };

  // Load expenses when page loads
  loadExpenses();

  // Form submission handler
  expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);

    if (!description || isNaN(amount)) {
      showAlert('Please enter valid description and amount', 'error');
      return;
    }

    try {
      const response = await fetch(API_BASE_URL, {
        ...fetchConfig,
        method: 'POST',
        body: JSON.stringify({ description, amount })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add expense');
      }

      const newExpense = await response.json();
      addExpenseToDOM(newExpense.data);
      updateSummary();
      expenseForm.reset();
      showAlert('Expense added successfully!', 'success');
    } catch (error) {
      console.error('Add Expense Error:', error);
      showAlert(error.message || 'Failed to connect to server', 'error');
    }
  });

  // Load expenses from API
  async function loadExpenses() {
    try {
      expensesContainer.innerHTML = '<div class="loading">Loading expenses...</div>';
      
      const response = await fetch(API_BASE_URL, fetchConfig);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const { data } = await response.json();
      renderExpenses(data);
      updateSummary();
    } catch (error) {
      console.error('Load Expenses Error:', error);
      expensesContainer.innerHTML = `
        <div class="error">
          ${error.message}
          <button onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  // Render all expenses
  function renderExpenses(expenses) {
    expensesContainer.innerHTML = '';

    if (expenses.length === 0) {
      expensesContainer.innerHTML = '<div class="empty">No expenses found. Add your first expense!</div>';
      return;
    }

    expenses.forEach(expense => {
      addExpenseToDOM(expense);
    });
  }

  // Add single expense to DOM
  function addExpenseToDOM(expense) {
    const expenseElement = document.createElement('div');
    expenseElement.className = 'expense-item';
    expenseElement.dataset.id = expense._id;
    
    const date = new Date(expense.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    expenseElement.innerHTML = `
      <div class="expense-info">
        <div class="expense-description">${expense.description}</div>
        <div class="expense-date">${date}</div>
      </div>
      <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
      <button class="delete-btn" data-id="${expense._id}" aria-label="Delete expense">
        <span aria-hidden="true">×</span>
      </button>
    `;
    
    expensesContainer.prepend(expenseElement);
    
    // Add event listener to delete button
    expenseElement.querySelector('.delete-btn').addEventListener('click', deleteExpense);
  }

  // Delete expense
  async function deleteExpense(e) {
    const expenseId = e.currentTarget.dataset.id;
    const expenseItem = e.currentTarget.closest('.expense-item');
    
    try {
      expenseItem.style.opacity = '0.5'; // Visual feedback
      
      const response = await fetch(`${API_BASE_URL}/${expenseId}`, {
        ...fetchConfig,
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      expenseItem.remove();
      updateSummary();
      showAlert('Expense deleted successfully!', 'success');
    } catch (error) {
      console.error('Delete Error:', error);
      expenseItem.style.opacity = '1';
      showAlert(error.message || 'Failed to delete expense', 'error');
    }
  }

  // Update summary cards
  function updateSummary() {
    const expenses = document.querySelectorAll('.expense-item');
    const count = expenses.length;
    
    let total = 0;
    expenses.forEach(expense => {
      const amountText = expense.querySelector('.expense-amount').textContent;
      total += parseFloat(amountText.replace('₹', ''));
    });

    expensesCountElement.textContent = count;
    totalAmountElement.textContent = `₹${total.toFixed(2)}`;
  }

  // Show alert message
  function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
      ${message}
      <button class="alert-close" aria-label="Close alert">×</button>
    `;
    
    document.body.appendChild(alert);
    
    // Auto-remove after 5 seconds
    const timer = setTimeout(() => {
      alert.remove();
    }, 5000);

    // Manual close button
    alert.querySelector('.alert-close').addEventListener('click', () => {
      clearTimeout(timer);
      alert.remove();
    });
  }
});