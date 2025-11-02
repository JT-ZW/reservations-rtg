import React from 'react';
import Button from '@/components/ui/Button';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  currency?: 'ZWG' | 'USD';
}

export default function LineItemsEditor({ items, onChange, currency = 'USD' }: LineItemsEditorProps) {
  const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addLineItem = () => {
    const newItem: LineItem = {
      id: generateId(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    onChange([...items, newItem]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Recalculate amount when quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
          const qty = typeof updated.quantity === 'number' ? updated.quantity : parseFloat(updated.quantity as string) || 0;
          const rt = typeof updated.rate === 'number' ? updated.rate : parseFloat(updated.rate as string) || 0;
          updated.quantity = qty;
          updated.rate = rt;
          updated.amount = qty * rt;
        }
        
        return updated;
      }
      return item;
    });
    onChange(updatedItems);
  };

  const removeLineItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const getCurrencySymbol = (curr: 'ZWG' | 'USD') => {
    return curr === 'ZWG' ? 'ZWG' : 'USD';
  };

  const formatCurrency = (amount: number) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Line Items <span className="text-red-500">*</span>
        </label>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addLineItem}
        >
          + Add Line Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 text-sm mb-2">No line items yet</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addLineItem}
          >
            Add First Line Item
          </Button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Rate ({currency})
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Amount
                  </th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="e.g., Room Hire, Audio Equipment, Catering"
                        required
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : e.target.value;
                          updateLineItem(item.id, 'quantity', value);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            updateLineItem(item.id, 'quantity', 0);
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.rate || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : e.target.value;
                          updateLineItem(item.id, 'rate', value);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            updateLineItem(item.id, 'rate', 0);
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        required
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        title="Remove item"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Total:
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                    {formatCurrency(calculateTotal())}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Add individual line items for room hire, add-ons, or any other charges. Set your own pricing for each item.
      </p>
    </div>
  );
}
