document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://expense-tracker-qruc.onrender.com/api/expenses';
    const expenseForm = document.getElementById('expense-form');
    const expensesContainer = document.getElementById('expenses-container');
    const totalAmountElement = document.getElementById('total-amount');
    const expensesCountElement = document.getElementById('expenses-count');
  
    // Load expenses when page loads
    loadExpenses();
  
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
          },
          body: JSON.stringify({ description, amount }),
        });
  
        if (!response.ok) throw new Error('Failed to add expense');
  
        const newExpense = await response.json();
        addExpenseToDOM(newExpense.data);
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
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error('Failed to load expenses');
        
        const { data } = await response.json();
        renderExpenses(data);
        updateSummary();
      } catch (error) {
        console.error('Error:', error);
        expensesContainer.innerHTML = `<div class="error">Error loading expenses: ${error.message}</div>`;
      }
    }
  
    // Render all expenses
    function renderExpenses(expenses) {
      if (expenses.length === 0) {
        expensesContainer.innerHTML = '<div class="empty">No expenses found. Add your first expense!</div>';
        return;
      }
  
      expensesContainer.innerHTML = '';
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
        <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
        <button class="delete-btn" data-id="${expense._id}">×</button>
      `;
      
      expensesContainer.prepend(expenseElement);
      
      // Add event listener to delete button
      const deleteBtn = expenseElement.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', deleteExpense);
    }
  
    // Delete expense
    async function deleteExpense(e) {
      const expenseId = e.target.dataset.id;
      
      try {
        const response = await fetch(`${API_BASE_URL}/${expenseId}`, {
          method: 'DELETE'
        });
  
        if (!response.ok) throw new Error('Failed to delete expense');
  
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
        total += parseFloat(amountText.replace('$', ''));
      });
  
      expensesCountElement.textContent = count;
      totalAmountElement.textContent = `$${total.toFixed(2)}`;
    }
  
    // Show alert message
    function showAlert(message, type) {
      const alert = document.createElement('div');
      alert.className = `alert alert-${type}`;
      alert.textContent = message;
      
      document.body.appendChild(alert);
      
      setTimeout(() => {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 300);
      }, 3000);
    }
  });
