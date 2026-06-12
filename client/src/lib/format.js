import { format as dateFnsFormat } from 'date-fns';

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return dateFnsFormat(new Date(dateString), 'dd MMM yyyy');
  } catch (error) {
    return dateString;
  }
};
