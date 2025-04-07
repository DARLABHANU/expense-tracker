const token = localStorage.getItem('token');
const logoutBtn = document.getElementById('logout');
const expenseList = document.getElementById('expense-list');
const fetchError = document.getElementById('fetch-error');

if (!token) {
  window.location.href = 'index.html';
}

async function fetchExpenses() {
  try {
    const res = await fetch('https://expense-tracker-2-6w2c.onrender.com/api/expenses', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch expenses');
    }

    if (data.length === 0) {
      expenseList.innerHTML = '<li>No expenses found.</li>';
    } else {
      data.forEach(exp => {
        const li = document.createElement('li');
        li.textContent = `${exp.title} - $${exp.amount}`;
        expenseList.appendChild(li);
      });
    }
  } catch (err) {
    fetchError.textContent = err.message;
  }
}

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

fetchExpenses();
