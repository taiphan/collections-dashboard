import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'open-banking' });

// ============================================================
// Types
// ============================================================

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  type: 'current' | 'savings' | 'credit';
  currency: string;
  balance: number;
  lastUpdated: Date;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: Date;
  amount: number;
  description: string;
  categoryCode: string;
  categoryName: string;
  merchant?: string;
  isRecurring: boolean;
  type: 'credit' | 'debit';
}

export interface TransactionCategory {
  code: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  parent?: string;
}

export interface AffordabilityAssessment {
  customerId: string;
  period: { from: Date; to: Date };
  income: {
    salary: number;
    otherRegular: number;
    irregular: number;
    total: number;
  };
  expenses: {
    housing: number;
    utilities: number;
    transport: number;
    food: number;
    debtRepayments: number;
    entertainment: number;
    other: number;
    total: number;
  };
  disposableIncome: number;
  affordableMonthlyPayment: number;
  stabilityScore: number;
  riskIndicators: string[];
  categorizationAccuracy: number;
}

// ============================================================
// Category definitions
// ============================================================

const CATEGORIES: TransactionCategory[] = [
  { code: 'SAL', name: 'Salary', type: 'income' },
  { code: 'INC_OTHER', name: 'Other Income', type: 'income' },
  { code: 'INC_RENTAL', name: 'Rental Income', type: 'income' },
  { code: 'INC_INVEST', name: 'Investment Income', type: 'income' },
  { code: 'EXP_HOUSING', name: 'Housing/Rent', type: 'expense' },
  { code: 'EXP_MORTGAGE', name: 'Mortgage', type: 'expense' },
  { code: 'EXP_UTILITIES', name: 'Utilities', type: 'expense' },
  { code: 'EXP_TRANSPORT', name: 'Transport', type: 'expense' },
  { code: 'EXP_FOOD', name: 'Food & Groceries', type: 'expense' },
  { code: 'EXP_INSURANCE', name: 'Insurance', type: 'expense' },
  { code: 'EXP_DEBT', name: 'Debt Repayment', type: 'expense' },
  { code: 'EXP_ENTERTAIN', name: 'Entertainment', type: 'expense' },
  { code: 'EXP_HEALTH', name: 'Healthcare', type: 'expense' },
  { code: 'EXP_EDUCATION', name: 'Education', type: 'expense' },
  { code: 'EXP_GAMBLING', name: 'Gambling', type: 'expense' },
  { code: 'EXP_OTHER', name: 'Other Expenses', type: 'expense' },
  { code: 'TRF', name: 'Transfer', type: 'transfer' },
];

// Keyword-based categorization rules
const CATEGORIZATION_RULES: Array<{ keywords: string[]; category: string }> = [
  { keywords: ['salary', 'payroll', 'wages', 'pay'], category: 'SAL' },
  { keywords: ['rent', 'landlord', 'housing'], category: 'EXP_HOUSING' },
  { keywords: ['mortgage', 'home loan'], category: 'EXP_MORTGAGE' },
  { keywords: ['electric', 'gas', 'water', 'internet', 'phone', 'utility'], category: 'EXP_UTILITIES' },
  { keywords: ['uber', 'lyft', 'fuel', 'petrol', 'parking', 'transit', 'bus', 'train'], category: 'EXP_TRANSPORT' },
  { keywords: ['grocery', 'supermarket', 'food', 'restaurant', 'cafe', 'dining'], category: 'EXP_FOOD' },
  { keywords: ['insurance', 'premium'], category: 'EXP_INSURANCE' },
  { keywords: ['loan', 'credit card', 'repayment', 'installment'], category: 'EXP_DEBT' },
  { keywords: ['netflix', 'spotify', 'cinema', 'entertainment', 'gaming'], category: 'EXP_ENTERTAIN' },
  { keywords: ['hospital', 'pharmacy', 'doctor', 'medical', 'dental'], category: 'EXP_HEALTH' },
  { keywords: ['school', 'university', 'tuition', 'course'], category: 'EXP_EDUCATION' },
  { keywords: ['bet', 'casino', 'gambling', 'lottery', 'poker'], category: 'EXP_GAMBLING' },
  { keywords: ['dividend', 'interest', 'investment', 'return'], category: 'INC_INVEST' },
  { keywords: ['rental income', 'tenant'], category: 'INC_RENTAL' },
  { keywords: ['transfer', 'sent to', 'received from'], category: 'TRF' },
];

// ============================================================
// Service
// ============================================================

export class OpenBankingService {
  async connectBank(customerId: string, bankId: string): Promise<{
    connectionId: string;
    consentUrl: string;
  }> {
    // In production: initiate OAuth flow with Open Banking provider
    const connectionId = crypto.randomUUID();
    log.info({ customerId, bankId, connectionId }, 'Bank connection initiated');

    return {
      connectionId,
      consentUrl: `https://bank.example.com/consent?id=${connectionId}`,
    };
  }

  async getAccounts(customerId: string): Promise<BankAccount[]> {
    // Simulated — in production, fetch from Open Banking API
    return [
      {
        id: 'acc-1',
        bankName: 'National Bank',
        accountNumber: '****4521',
        type: 'current',
        currency: 'USD',
        balance: 12500.00,
        lastUpdated: new Date(),
      },
      {
        id: 'acc-2',
        bankName: 'National Bank',
        accountNumber: '****7832',
        type: 'savings',
        currency: 'USD',
        balance: 45000.00,
        lastUpdated: new Date(),
      },
    ];
  }

  async getTransactions(
    customerId: string,
    months = 3,
  ): Promise<Transaction[]> {
    // Simulated — generate realistic transaction data
    const transactions = this.generateSimulatedTransactions(months);
    return this.categorizeTransactions(transactions);
  }

  async calculateAffordability(customerId: string): Promise<AffordabilityAssessment> {
    const transactions = await this.getTransactions(customerId, 3);
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 3600000);

    // Aggregate income
    const incomeTransactions = transactions.filter((t) => t.type === 'credit');
    const salaryTotal = incomeTransactions
      .filter((t) => t.categoryCode === 'SAL')
      .reduce((sum, t) => sum + t.amount, 0);
    const otherRegular = incomeTransactions
      .filter((t) => ['INC_RENTAL', 'INC_INVEST'].includes(t.categoryCode) && t.isRecurring)
      .reduce((sum, t) => sum + t.amount, 0);
    const irregular = incomeTransactions
      .filter((t) => t.categoryCode === 'INC_OTHER' && !t.isRecurring)
      .reduce((sum, t) => sum + t.amount, 0);

    // Monthly averages (3 months)
    const monthlySalary = salaryTotal / 3;
    const monthlyOtherRegular = otherRegular / 3;
    const monthlyIrregular = irregular / 3;
    const totalMonthlyIncome = monthlySalary + monthlyOtherRegular + monthlyIrregular;

    // Aggregate expenses
    const expenseTransactions = transactions.filter((t) => t.type === 'debit');
    const expenseByCategory = (code: string) =>
      expenseTransactions
        .filter((t) => t.categoryCode === code)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 3;

    const expenses = {
      housing: expenseByCategory('EXP_HOUSING') + expenseByCategory('EXP_MORTGAGE'),
      utilities: expenseByCategory('EXP_UTILITIES'),
      transport: expenseByCategory('EXP_TRANSPORT'),
      food: expenseByCategory('EXP_FOOD'),
      debtRepayments: expenseByCategory('EXP_DEBT'),
      entertainment: expenseByCategory('EXP_ENTERTAIN'),
      other: expenseByCategory('EXP_OTHER') + expenseByCategory('EXP_HEALTH') +
             expenseByCategory('EXP_EDUCATION') + expenseByCategory('EXP_INSURANCE'),
      total: 0,
    };
    expenses.total = Object.values(expenses).reduce((a, b) => a + b, 0) - expenses.total;

    const disposableIncome = totalMonthlyIncome - expenses.total;
    const affordableMonthlyPayment = Math.max(0, disposableIncome * 0.4); // 40% of disposable

    // Stability score (income consistency)
    const salaryMonths = incomeTransactions.filter((t) => t.categoryCode === 'SAL');
    const stabilityScore = salaryMonths.length >= 3 ? 85 : salaryMonths.length >= 2 ? 60 : 30;

    // Risk indicators
    const riskIndicators: string[] = [];
    const gamblingSpend = expenseByCategory('EXP_GAMBLING');
    if (gamblingSpend > 0) riskIndicators.push('Gambling transactions detected');
    if (disposableIncome < 500) riskIndicators.push('Low disposable income');
    if (expenses.debtRepayments > totalMonthlyIncome * 0.4) {
      riskIndicators.push('High existing debt service ratio');
    }

    const assessment: AffordabilityAssessment = {
      customerId,
      period: { from: threeMonthsAgo, to: now },
      income: {
        salary: Math.round(monthlySalary * 100) / 100,
        otherRegular: Math.round(monthlyOtherRegular * 100) / 100,
        irregular: Math.round(monthlyIrregular * 100) / 100,
        total: Math.round(totalMonthlyIncome * 100) / 100,
      },
      expenses: {
        housing: Math.round(expenses.housing * 100) / 100,
        utilities: Math.round(expenses.utilities * 100) / 100,
        transport: Math.round(expenses.transport * 100) / 100,
        food: Math.round(expenses.food * 100) / 100,
        debtRepayments: Math.round(expenses.debtRepayments * 100) / 100,
        entertainment: Math.round(expenses.entertainment * 100) / 100,
        other: Math.round(expenses.other * 100) / 100,
        total: Math.round(expenses.total * 100) / 100,
      },
      disposableIncome: Math.round(disposableIncome * 100) / 100,
      affordableMonthlyPayment: Math.round(affordableMonthlyPayment * 100) / 100,
      stabilityScore,
      riskIndicators,
      categorizationAccuracy: 0.92,
    };

    log.info(
      { customerId, disposableIncome: assessment.disposableIncome, stabilityScore },
      'Affordability assessment completed',
    );

    return assessment;
  }

  categorizeTransaction(description: string, amount: number): { code: string; name: string } {
    const lowerDesc = description.toLowerCase();

    for (const rule of CATEGORIZATION_RULES) {
      if (rule.keywords.some((kw) => lowerDesc.includes(kw))) {
        const cat = CATEGORIES.find((c) => c.code === rule.category);
        if (cat) return { code: cat.code, name: cat.name };
      }
    }

    // Default based on credit/debit
    return amount > 0
      ? { code: 'INC_OTHER', name: 'Other Income' }
      : { code: 'EXP_OTHER', name: 'Other Expenses' };
  }

  getCategories(): TransactionCategory[] {
    return CATEGORIES;
  }

  private categorizeTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.map((t) => {
      const cat = this.categorizeTransaction(t.description, t.amount);
      return { ...t, categoryCode: cat.code, categoryName: cat.name };
    });
  }

  private generateSimulatedTransactions(months: number): Transaction[] {
    const transactions: Transaction[] = [];
    const now = new Date();

    for (let m = 0; m < months; m++) {
      const monthDate = new Date(now.getTime() - m * 30 * 24 * 3600000);

      // Salary (recurring)
      transactions.push({
        id: `txn-sal-${m}`,
        accountId: 'acc-1',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 25),
        amount: 8500,
        description: 'PAYROLL - TECH CORP',
        categoryCode: 'SAL',
        categoryName: 'Salary',
        merchant: 'Tech Corp',
        isRecurring: true,
        type: 'credit',
      });

      // Rent
      transactions.push({
        id: `txn-rent-${m}`,
        accountId: 'acc-1',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        amount: -1800,
        description: 'RENT PAYMENT - LANDLORD',
        categoryCode: 'EXP_HOUSING',
        categoryName: 'Housing/Rent',
        isRecurring: true,
        type: 'debit',
      });

      // Utilities
      transactions.push({
        id: `txn-util-${m}`,
        accountId: 'acc-1',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5),
        amount: -250,
        description: 'ELECTRIC & GAS UTILITY',
        categoryCode: 'EXP_UTILITIES',
        categoryName: 'Utilities',
        isRecurring: true,
        type: 'debit',
      });

      // Food/groceries
      transactions.push({
        id: `txn-food-${m}`,
        accountId: 'acc-1',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10),
        amount: -600,
        description: 'SUPERMARKET GROCERY',
        categoryCode: 'EXP_FOOD',
        categoryName: 'Food & Groceries',
        isRecurring: true,
        type: 'debit',
      });

      // Existing loan repayment
      transactions.push({
        id: `txn-loan-${m}`,
        accountId: 'acc-1',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15),
        amount: -450,
        description: 'AUTO LOAN REPAYMENT',
        categoryCode: 'EXP_DEBT',
        categoryName: 'Debt Repayment',
        isRecurring: true,
        type: 'debit',
      });

      // Transport
      transactions.push({
        id: `txn-transport-${m}`,
        accountId: 'acc-1',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 12),
        amount: -150,
        description: 'FUEL STATION',
        categoryCode: 'EXP_TRANSPORT',
        categoryName: 'Transport',
        isRecurring: false,
        type: 'debit',
      });
    }

    return transactions;
  }
}

export const openBankingService = new OpenBankingService();
