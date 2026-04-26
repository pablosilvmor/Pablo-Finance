import fs from 'fs';
import path from 'path';

const basePath = './src/pages/';
const filesToReplace = [
  'CalendarView.tsx',
  'Categories.tsx',
  'Charts.tsx',
  'Expenses.tsx',
  'Incomes.tsx',
  'Performance.tsx',
  'Planning.tsx',
  'Reports.tsx'
];

filesToReplace.forEach(filename => {
  const file = path.join(basePath, filename);
  let content = fs.readFileSync(file, 'utf8');
  
  // Regex to match: const { ..., transactions, ... } = useAppStore();
  // We need to replace "transactions," or "transactions " or ", transactions" with "activeTransactions: transactions,"
  
  if (content.includes('transactions,') && !content.includes('activeTransactions')) {
    content = content.replace(/transactions,/, 'activeTransactions: transactions,');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${filename}`);
  } else if (content.includes(', transactions') && !content.includes('activeTransactions')) {
    content = content.replace(/, transactions/, ', activeTransactions: transactions');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${filename}`);
  }
});
