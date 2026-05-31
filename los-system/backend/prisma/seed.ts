import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users
  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@los.com' },
    update: {},
    create: {
      email: 'admin@los.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      department: 'IT',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@los.com' },
    update: {},
    create: {
      email: 'manager@los.com',
      passwordHash,
      firstName: 'Loan',
      lastName: 'Manager',
      role: 'MANAGER',
      department: 'Lending',
    },
  });

  const officer = await prisma.user.upsert({
    where: { email: 'officer@los.com' },
    update: {},
    create: {
      email: 'officer@los.com',
      passwordHash,
      firstName: 'Loan',
      lastName: 'Officer',
      role: 'LOAN_OFFICER',
      department: 'Lending',
    },
  });

  const underwriter = await prisma.user.upsert({
    where: { email: 'underwriter@los.com' },
    update: {},
    create: {
      email: 'underwriter@los.com',
      passwordHash,
      firstName: 'Senior',
      lastName: 'Underwriter',
      role: 'UNDERWRITER',
      department: 'Risk',
    },
  });

  console.log('Users created:', { admin: admin.id, manager: manager.id, officer: officer.id, underwriter: underwriter.id });

  // Create loan products
  const personalLoan = await prisma.loanProduct.upsert({
    where: { code: 'PL-001' },
    update: {},
    create: {
      code: 'PL-001',
      name: 'Personal Loan - Standard',
      description: 'Unsecured personal loan for general purposes',
      productType: 'PERSONAL',
      minAmount: 1000,
      maxAmount: 50000,
      minTenureMonths: 6,
      maxTenureMonths: 60,
      baseInterestRate: 0.0899,
      interestType: 'FIXED',
      fees: { origination: 0.01, processing: 50, lateFee: 25 },
      eligibilityCriteria: {
        minAge: 21,
        maxAge: 65,
        minIncome: 2000,
        minCreditScore: 600,
      },
      requiredDocuments: [
        'government_id',
        'proof_of_income',
        'bank_statements_3m',
        'proof_of_address',
      ],
      effectiveFrom: new Date('2024-01-01'),
    },
  });

  const autoLoan = await prisma.loanProduct.upsert({
    where: { code: 'AL-001' },
    update: {},
    create: {
      code: 'AL-001',
      name: 'Auto Loan - New Vehicle',
      description: 'Secured loan for new vehicle purchase',
      productType: 'AUTO',
      minAmount: 5000,
      maxAmount: 100000,
      minTenureMonths: 12,
      maxTenureMonths: 84,
      baseInterestRate: 0.0549,
      interestType: 'FIXED',
      fees: { origination: 0.005, processing: 100 },
      eligibilityCriteria: {
        minAge: 18,
        maxAge: 70,
        minIncome: 3000,
        minCreditScore: 650,
        maxLTV: 0.9,
      },
      requiredDocuments: [
        'government_id',
        'proof_of_income',
        'bank_statements_3m',
        'vehicle_invoice',
        'insurance_quote',
      ],
      effectiveFrom: new Date('2024-01-01'),
    },
  });

  const mortgage = await prisma.loanProduct.upsert({
    where: { code: 'ML-001' },
    update: {},
    create: {
      code: 'ML-001',
      name: 'Home Mortgage - Fixed 30Y',
      description: '30-year fixed rate mortgage',
      productType: 'MORTGAGE',
      minAmount: 50000,
      maxAmount: 1000000,
      minTenureMonths: 120,
      maxTenureMonths: 360,
      baseInterestRate: 0.0649,
      interestType: 'FIXED',
      fees: { origination: 0.01, appraisal: 500, titleSearch: 300 },
      eligibilityCriteria: {
        minAge: 21,
        maxAge: 65,
        minIncome: 5000,
        minCreditScore: 680,
        maxDTI: 0.43,
        maxLTV: 0.8,
      },
      requiredDocuments: [
        'government_id',
        'proof_of_income',
        'tax_returns_2y',
        'bank_statements_6m',
        'property_appraisal',
        'title_report',
        'insurance_binder',
      ],
      effectiveFrom: new Date('2024-01-01'),
    },
  });

  console.log('Products created:', {
    personalLoan: personalLoan.id,
    autoLoan: autoLoan.id,
    mortgage: mortgage.id,
  });

  // Create SLA configurations
  const slaConfigs = [
    { stage: 'INTAKE' as const, productType: 'PERSONAL' as const, warningHours: 4, breachHours: 8, escalateTo: 'MANAGER' as const },
    { stage: 'VERIFICATION' as const, productType: 'PERSONAL' as const, warningHours: 12, breachHours: 24, escalateTo: 'MANAGER' as const },
    { stage: 'UNDERWRITING' as const, productType: 'PERSONAL' as const, warningHours: 24, breachHours: 48, escalateTo: 'MANAGER' as const },
    { stage: 'APPROVAL' as const, productType: 'PERSONAL' as const, warningHours: 8, breachHours: 16, escalateTo: 'ADMIN' as const },
    { stage: 'DOCUMENTATION' as const, productType: 'PERSONAL' as const, warningHours: 24, breachHours: 48, escalateTo: 'MANAGER' as const },
    { stage: 'DISBURSEMENT' as const, productType: 'PERSONAL' as const, warningHours: 4, breachHours: 8, escalateTo: 'MANAGER' as const },
  ];

  for (const sla of slaConfigs) {
    await prisma.slaConfig.upsert({
      where: { stage_productType: { stage: sla.stage, productType: sla.productType } },
      update: {},
      create: sla,
    });
  }

  console.log('SLA configs created');

  // Create default decision rule set
  const ruleSet = await prisma.decisionRuleSet.upsert({
    where: { name: 'underwriting-rules' },
    update: {},
    create: {
      name: 'underwriting-rules',
      description: 'Standard underwriting decision rules',
      version: 1,
    },
  });

  // Create decision rules
  const rules = [
    {
      name: 'Max DTI Check',
      description: 'Reject if DTI exceeds 50%',
      condition: { field: 'dti', operator: 'gt', value: 0.5 },
      action: { type: 'REJECT', message: 'DTI ratio exceeds maximum threshold' },
      priority: 100,
    },
    {
      name: 'Min Credit Score',
      description: 'Reject if credit score below 500',
      condition: { field: 'creditScore', operator: 'lt', value: 500 },
      action: { type: 'REJECT', message: 'Credit score below minimum requirement' },
      priority: 90,
    },
    {
      name: 'High Risk Referral',
      description: 'Refer to manual review if credit score between 500-600',
      condition: { field: 'creditScore', operator: 'between', value: [500, 600] },
      action: { type: 'REFER', message: 'Credit score in marginal range - manual review required' },
      priority: 80,
    },
    {
      name: 'High Amount Referral',
      description: 'Refer if amount exceeds 100k',
      condition: { field: 'requestedAmount', operator: 'gt', value: 100000 },
      action: { type: 'REFER', message: 'High value loan - senior approval required' },
      priority: 70,
    },
    {
      name: 'Excellent Credit Bonus',
      description: 'Score boost for excellent credit',
      condition: { field: 'creditScore', operator: 'gte', value: 750 },
      action: { type: 'SCORE_ADJUST', value: 15 },
      priority: 50,
    },
  ];

  for (const rule of rules) {
    await prisma.decisionRule.create({
      data: {
        ruleSetId: ruleSet.id,
        name: rule.name,
        description: rule.description,
        condition: rule.condition,
        action: rule.action,
        priority: rule.priority,
      },
    });
  }

  console.log('Decision rules created');

  // Create sample customers
  const customer1 = await prisma.customer.upsert({
    where: { nationalId: 'ID-001-SAMPLE' },
    update: {},
    create: {
      customerType: 'INDIVIDUAL',
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: new Date('1985-03-15'),
      nationalId: 'ID-001-SAMPLE',
      email: 'john.smith@email.com',
      phone: '+1234567890',
      address: {
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62701',
        country: 'US',
      },
      employmentInfo: {
        employer: 'Tech Corp',
        position: 'Senior Engineer',
        monthlyIncome: 8500,
        yearsEmployed: 5,
      },
      financialInfo: {
        monthlyIncome: 8500,
        monthlyExpenses: 3200,
        existingDebt: 15000,
        assets: 120000,
      },
      kycStatus: 'VERIFIED',
      kycVerifiedAt: new Date(),
    },
  });

  console.log('Sample customer created:', customer1.id);

  // Create workflow template
  await prisma.workflowTemplate.upsert({
    where: { name: 'personal-loan-standard' },
    update: {},
    create: {
      name: 'personal-loan-standard',
      description: 'Standard workflow for personal loan applications',
      productType: 'PERSONAL',
      stages: [
        {
          stage: 'INTAKE',
          tasks: ['Validate application data', 'Verify applicant identity', 'Check document completeness'],
          autoTransition: false,
        },
        {
          stage: 'VERIFICATION',
          tasks: ['Income verification', 'Address verification', 'Employment verification'],
          autoTransition: false,
        },
        {
          stage: 'UNDERWRITING',
          tasks: ['Credit bureau pull', 'Risk assessment', 'DTI calculation', 'Underwriter review'],
          autoTransition: false,
        },
        {
          stage: 'APPROVAL',
          tasks: ['Final decision', 'Terms finalization'],
          autoTransition: false,
        },
        {
          stage: 'DOCUMENTATION',
          tasks: ['Generate loan agreement', 'Collect signatures', 'Compliance review'],
          autoTransition: false,
        },
        {
          stage: 'DISBURSEMENT',
          tasks: ['Account setup', 'Fund transfer', 'Confirmation'],
          autoTransition: true,
        },
      ],
    },
  });

  console.log('Workflow template created');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
