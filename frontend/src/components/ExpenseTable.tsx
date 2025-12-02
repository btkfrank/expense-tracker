import { useEffect, useState } from 'react';
import type { Expense, ExpenseInput } from '../types/expense';
import { expenseApi } from '../services/expenseApi';
import { useDraggableDialog } from '../hooks/useDraggableDialog';
import './ExpenseTable.css';

export function ExpenseTable() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  // const dialogRef = useRef<HTMLDialogElement>(null);
  const [dialogEl, setDialogEl] = useState<HTMLDialogElement | null>(null);
  const [askDialogEl, setAskDialogEl] = useState<HTMLDialogElement | null>(
    null
  );
  const [question, setQuestion] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);

  // Make dialog draggable
  // useDraggableDialog({ dialogRef });
  useDraggableDialog({ dialog: dialogEl });
  useDraggableDialog({ dialog: askDialogEl });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await expenseApi.getAll();
      setExpenses(data);
    } catch (err) {
      setError('Failed to fetch expenses. Please try again.');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, description: string) => {
    if (!window.confirm(`Are you sure you want to delete "${description}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await expenseApi.delete(id);
      // Remove the deleted expense from the state using functional update
      setExpenses((prevExpenses) =>
        prevExpenses.filter((expense) => expense.id !== id)
      );
    } catch (err) {
      alert('Failed to delete expense. Please try again.');
      console.error('Error deleting expense:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = () => {
    setEditingExpense(null);
    setIsAdding(true);
    dialogEl?.showModal();
  };

  const handleAsk = () => {
    setQuestion('');
    setAnswer(null);
    setAskError(null);
    askDialogEl?.showModal();
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsAdding(false);
    dialogEl?.showModal();
  };

  const handleCloseDialog = () => {
    dialogEl?.close();
    setEditingExpense(null);
    setIsAdding(false);
  };

  const handleCloseAskDialog = () => {
    askDialogEl?.close();
    setQuestion('');
    setAnswer(null);
    setAskError(null);
  };

  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    // Close dialog if clicking on the backdrop (not the form)
    if (e.target === dialogEl) {
      handleCloseDialog();
    }
  };

  const handleAskDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === askDialogEl) {
      handleCloseAskDialog();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const expenseData: ExpenseInput = {
      amount: parseFloat(formData.get('amount') as string),
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      date: formData.get('date') as string,
      paymentMethod: (formData.get('paymentMethod') as string) || undefined,
      tags: formData.get('tags')
        ? (formData.get('tags') as string)
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : undefined,
    };

    try {
      if (isAdding) {
        // Create new expense
        setUpdatingId('new');
        const newExpense = await expenseApi.create(expenseData);
        // Add the new expense to the state
        setExpenses((prevExpenses) => [newExpense, ...prevExpenses]);
        handleCloseDialog();
      } else if (editingExpense) {
        // Update existing expense
        setUpdatingId(editingExpense.id);
        const updated = await expenseApi.update(editingExpense.id, expenseData);
        // Update the expense in the state
        setExpenses((prevExpenses) =>
          prevExpenses.map((expense) =>
            expense.id === editingExpense.id ? updated : expense
          )
        );
        handleCloseDialog();
      }
    } catch (err) {
      alert(
        `Failed to ${isAdding ? 'create' : 'update'} expense. Please try again.`
      );
      console.error(
        `Error ${isAdding ? 'creating' : 'updating'} expense:`,
        err
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAskSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim()) return;
    try {
      setAskLoading(true);
      setAskError(null);
      const res = await expenseApi.ask(question.trim());
      setAnswer(res.answer);
    } catch (err) {
      setAskError('Failed to get answer. Please try again.');
      console.error('Error asking question:', err);
    } finally {
      setAskLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Loading expenses...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={fetchExpenses}>Retry</button>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="expense-table-container">
        <div className="table-header">
          <h2>Expense Tracker</h2>
          <div className="header-buttons">
            <button onClick={handleAdd} className="add-btn">
              Add Expense
            </button>
            <button onClick={handleAsk} className="add-btn">
              Ask Question
            </button>
            <button onClick={fetchExpenses} className="refresh-btn">
              Refresh
            </button>
          </div>
        </div>
        <div className="empty">
          No expenses found. Start by adding your first expense!
        </div>
        <dialog
          ref={setDialogEl}
          className="edit-dialog"
          onClick={handleDialogClick}
        >
          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>{isAdding ? 'Add Expense' : 'Edit Expense'}</h3>
              <button
                type="button"
                onClick={handleCloseDialog}
                className="close-btn"
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>
            <div className="dialog-body">
              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  defaultValue={editingExpense?.description || ''}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="amount">Amount *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  step="0.01"
                  min="0"
                  defaultValue={editingExpense?.amount || ''}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  defaultValue={editingExpense?.category || ''}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="date">Date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  defaultValue={
                    editingExpense
                      ? editingExpense.date.split('T')[0]
                      : new Date().toISOString().split('T')[0]
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method</label>
                <input
                  type="text"
                  id="paymentMethod"
                  name="paymentMethod"
                  defaultValue={editingExpense?.paymentMethod || ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="tags">Tags (comma-separated)</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  defaultValue={editingExpense?.tags?.join(', ') || ''}
                  placeholder="e.g., work, lunch, business"
                />
              </div>
            </div>
            <div className="dialog-footer">
              <button
                type="button"
                onClick={handleCloseDialog}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="save-btn"
                disabled={
                  isAdding
                    ? updatingId === 'new'
                    : updatingId === editingExpense?.id
                }
              >
                {isAdding
                  ? updatingId === 'new'
                    ? 'Creating...'
                    : 'Create'
                  : updatingId === editingExpense?.id
                  ? 'Saving...'
                  : 'Save'}
              </button>
            </div>
          </form>
        </dialog>

        <dialog
          ref={setAskDialogEl}
          className="edit-dialog"
          onClick={handleAskDialogClick}
        >
          <form onSubmit={handleAskSubmit} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Ask Question</h3>
              <button
                type="button"
                onClick={handleCloseAskDialog}
                className="close-btn"
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>
            <div className="dialog-body">
              <div className="form-group">
                <label htmlFor="question">Question *</label>
                <textarea
                  id="question"
                  name="question"
                  rows={3}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                />
              </div>
              {askError && <div className="error">{askError}</div>}
              {answer && (
                <div className="form-group">
                  <label>Answer</label>
                  <div className="answer-box">{answer}</div>
                </div>
              )}
            </div>
            <div className="dialog-footer">
              <button
                type="button"
                onClick={handleCloseAskDialog}
                className="cancel-btn"
              >
                Close
              </button>
              <button type="submit" className="save-btn" disabled={askLoading}>
                {askLoading ? 'Asking...' : 'Ask'}
              </button>
            </div>
          </form>
        </dialog>
      </div>
    );
  }

  return (
    <div className="expense-table-container">
      <div className="table-header">
        <h2>Expense Tracker</h2>
        <div className="header-buttons">
          <button onClick={handleAdd} className="add-btn">
            Add Expense
          </button>
          <button onClick={handleAsk} className="add-btn">
            Ask Question
          </button>
          <button onClick={fetchExpenses} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>
      <table className="expense-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Payment Method</th>
            <th>Tags</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>{formatDate(expense.date)}</td>
              <td>{expense.description}</td>
              <td>
                <span className="category-badge">{expense.category}</span>
              </td>
              <td className="amount">{formatCurrency(expense.amount)}</td>
              <td>{expense.paymentMethod || '-'}</td>
              <td>
                {expense.tags && expense.tags.length > 0 ? (
                  <div className="tags">
                    {expense.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  '-'
                )}
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    onClick={() => handleEdit(expense)}
                    className="edit-btn"
                    title="Edit expense"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(expense.id, expense.description)
                    }
                    className="delete-btn"
                    disabled={deletingId === expense.id}
                    title="Delete expense"
                  >
                    {deletingId === expense.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="total-label">
              Total
            </td>
            <td className="total-amount">
              {formatCurrency(
                expenses.reduce((sum, expense) => sum + expense.amount, 0)
              )}
            </td>
            <td colSpan={3}></td>
          </tr>
        </tfoot>
      </table>

      <dialog
        ref={setDialogEl}
        className="edit-dialog"
        onClick={handleDialogClick}
      >
        <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
          <div className="dialog-header">
            <h3>{isAdding ? 'Add Expense' : 'Edit Expense'}</h3>
            <button
              type="button"
              onClick={handleCloseDialog}
              className="close-btn"
              aria-label="Close dialog"
            >
              ×
            </button>
          </div>
          <div className="dialog-body">
            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <input
                type="text"
                id="description"
                name="description"
                defaultValue={editingExpense?.description || ''}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount *</label>
              <input
                type="number"
                id="amount"
                name="amount"
                step="0.01"
                min="0"
                defaultValue={editingExpense?.amount || ''}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <input
                type="text"
                id="category"
                name="category"
                defaultValue={editingExpense?.category || ''}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                defaultValue={
                  editingExpense
                    ? editingExpense.date.split('T')[0]
                    : new Date().toISOString().split('T')[0]
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="paymentMethod">Payment Method</label>
              <input
                type="text"
                id="paymentMethod"
                name="paymentMethod"
                defaultValue={editingExpense?.paymentMethod || ''}
              />
            </div>
            <div className="form-group">
              <label htmlFor="tags">Tags (comma-separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                defaultValue={editingExpense?.tags?.join(', ') || ''}
                placeholder="e.g., work, lunch, business"
              />
            </div>
          </div>
          <div className="dialog-footer">
            <button
              type="button"
              onClick={handleCloseDialog}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={
                isAdding
                  ? updatingId === 'new'
                  : updatingId === editingExpense?.id
              }
            >
              {isAdding
                ? updatingId === 'new'
                  ? 'Creating...'
                  : 'Create'
                : updatingId === editingExpense?.id
                ? 'Saving...'
                : 'Save'}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={setAskDialogEl}
        className="edit-dialog"
        onClick={handleAskDialogClick}
      >
        <form onSubmit={handleAskSubmit} onClick={(e) => e.stopPropagation()}>
          <div className="dialog-header">
            <h3>Ask Question</h3>
            <button
              type="button"
              onClick={handleCloseAskDialog}
              className="close-btn"
              aria-label="Close dialog"
            >
              ×
            </button>
          </div>
          <div className="dialog-body">
            <div className="form-group">
              <label htmlFor="question2">Question *</label>
              <textarea
                id="question2"
                name="question"
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />
            </div>
            {askError && <div className="error">{askError}</div>}
            {answer && (
              <div className="form-group">
                <label>Answer</label>
                <div className="answer-box">{answer}</div>
              </div>
            )}
          </div>
          <div className="dialog-footer">
            <button
              type="button"
              onClick={handleCloseAskDialog}
              className="cancel-btn"
            >
              Close
            </button>
            <button type="submit" className="save-btn" disabled={askLoading}>
              {askLoading ? 'Asking...' : 'Ask'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
