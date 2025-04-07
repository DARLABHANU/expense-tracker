document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'http://localhost:5000/api/expenses';
  const expenseForm = document.getElementById('expense-form');
  const expensesContainer = document.getElementById('expenses-container');
  const totalAmountElement = document.getElementById('total-amount');
  const expensesCountElement = document.getElementById('expenses-count');
  const logoutBtn = document.getElementById('logout-btn');

  // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'auth.html';
    return;
  }

  // Load expenses when page loads
  loadExpenses();

  // Logout handler
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  });

  // Form submission handler
  expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    
    if (!description || !amount) {
      showAlert('Please fill all fields', 'error');
      return;
    }

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ description, amount })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add expense');
      }

      addExpenseToDOM(result.data);
      updateSummary();
      expenseForm.reset();
      showAlert('Expense added successfully!', 'success');
    } catch (error) {
      console.error('Error:', error);
      showAlert(error.message, 'error');
    }
  });

  // Load expenses from API
  async function loadExpenses() {
    try {
      const response = await fetch(API_BASE_URL, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load expenses');
      }

      renderExpenses(result.data);
      updateSummary();
    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('token') || error.message.includes('Unauthorized')) {
        localStorage.removeItem('token');
        window.location.href = 'auth.html';
      } else {
        expensesContainer.innerHTML = `<div class="error">Error loading expenses: ${error.message}</div>`;
      }
    }
  }

  // Render all expenses
  function renderExpenses(expenses) {
    expensesContainer.innerHTML = '';
    
    if (!expenses || expenses.length === 0) {
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
      <button class="delete-btn" data-id="${expense._id}">×</button>
    `;
    
    expensesContainer.appendChild(expenseElement);
    
    // Add event listener to delete button
    const deleteBtn = expenseElement.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', deleteExpense);
  }

  // Delete expense
  async function deleteExpense(e) {
    const expenseId = e.target.dataset.id;
    
    try {
      const response = await fetch(`${API_BASE_URL}/${expenseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete expense');
      }

      e.target.closest('.expense-item').remove();
      updateSummary();
      showAlert('Expense deleted successfully!', 'success');
    } catch (error) {
      console.error('Error:', error);
      showAlert(error.message, 'error');
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
    alert.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      ${message}
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
      alert.classList.add('fade-out');
      setTimeout(() => alert.remove(), 300);
    }, 3000);
  }
});