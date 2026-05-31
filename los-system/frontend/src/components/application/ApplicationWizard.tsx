import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, applicationsApi } from '@/lib/api';

interface WizardStep {
  id: string;
  title: string;
  description: string;
}

const STEPS: WizardStep[] = [
  { id: 'product', title: 'Select Product', description: 'Choose a loan product' },
  { id: 'applicant', title: 'Applicant Info', description: 'Personal and financial details' },
  { id: 'loan', title: 'Loan Details', description: 'Amount, tenure, and purpose' },
  { id: 'documents', title: 'Documents', description: 'Upload required documents' },
  { id: 'review', title: 'Review & Submit', description: 'Confirm and submit' },
];

interface ApplicationFormData {
  productId: string;
  customerId: string;
  requestedAmount: number;
  requestedTenure: number;
  purpose: string;
  channel: 'WEB';
}

interface ApplicationWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function ApplicationWizard({ onComplete, onCancel }: ApplicationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<ApplicationFormData>>({
    channel: 'WEB',
  });

  const createMutation = useMutation({
    mutationFn: (data: ApplicationFormData) => applicationsApi.create(data),
    onSuccess: () => onComplete(),
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (formData.productId && formData.customerId && formData.requestedAmount && formData.requestedTenure) {
      createMutation.mutate(formData as ApplicationFormData);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all ${
                    index < currentStep
                      ? 'bg-primary border-primary text-white'
                      : index === currentStep
                        ? 'border-primary text-primary bg-primary/10'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span className={`text-[10px] mt-1 ${
                  index === currentStep ? 'font-medium text-primary' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 mx-1 ${
                  index < currentStep ? 'bg-primary' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-card rounded-lg border p-6 min-h-[300px]">
        <h3 className="text-lg font-semibold">{STEPS[currentStep].title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{STEPS[currentStep].description}</p>

        {currentStep === 0 && (
          <ProductSelection
            selectedId={formData.productId}
            onSelect={(id) => setFormData({ ...formData, productId: id })}
          />
        )}

        {currentStep === 1 && (
          <ApplicantForm
            customerId={formData.customerId}
            onSelect={(id) => setFormData({ ...formData, customerId: id })}
          />
        )}

        {currentStep === 2 && (
          <LoanDetailsForm
            data={formData}
            onChange={(updates) => setFormData({ ...formData, ...updates })}
          />
        )}

        {currentStep === 3 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Document upload will be available after application creation.</p>
            <p className="text-xs mt-1">You can upload documents from the case view.</p>
          </div>
        )}

        {currentStep === 4 && (
          <ReviewStep data={formData} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={currentStep === 0 ? onCancel : handleBack}
          className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
        >
          {currentStep === 0 ? 'Cancel' : '← Back'}
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="px-6 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? 'Submitting...' : 'Submit Application'}
          </button>
        )}
      </div>

      {createMutation.isError && (
        <div className="mt-3 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {createMutation.error instanceof Error ? createMutation.error.message : 'Submission failed'}
        </div>
      )}
    </div>
  );
}

// Sub-components for each step

function ProductSelection({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const { data } = useQuery({
    queryKey: ['products-active'],
    queryFn: () => api.get<{ success: boolean; data: Array<{
      id: string; name: string; code: string; productType: string;
      minAmount: number; maxAmount: number; baseInterestRate: number;
    }> }>('/products/active'),
  });

  const products = data?.data || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onSelect(product.id)}
          className={`p-4 rounded-lg border text-left transition-all ${
            selectedId === product.id
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'hover:border-primary/50'
          }`}
        >
          <p className="font-medium text-sm">{product.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            ${Number(product.minAmount).toLocaleString()} – ${Number(product.maxAmount).toLocaleString()}
            {' · '}
            {(Number(product.baseInterestRate) * 100).toFixed(2)}% APR
          </p>
        </button>
      ))}
    </div>
  );
}

function ApplicantForm({
  customerId,
  onSelect,
}: {
  customerId?: string;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState('');

  const { data } = useQuery({
    queryKey: ['customers-search', search],
    queryFn: () => api.get<{ success: boolean; data: Array<{
      id: string; firstName: string; lastName: string; email?: string; kycStatus: string;
    }> }>('/customers', search ? { query: search } : {}),
    enabled: search.length >= 2,
  });

  const customers = data?.data || [];

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search customer by name, email, or ID..."
        className="w-full px-3 py-2 border rounded-md text-sm"
      />

      {customers.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => onSelect(customer.id)}
              className={`w-full p-3 rounded-md border text-left transition-all ${
                customerId === customer.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted'
              }`}
            >
              <p className="text-sm font-medium">
                {customer.firstName} {customer.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {customer.email || 'No email'} · KYC: {customer.kycStatus}
              </p>
            </button>
          ))}
        </div>
      )}

      {search.length >= 2 && customers.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No customers found. Create a new customer first.
        </p>
      )}
    </div>
  );
}

function LoanDetailsForm({
  data,
  onChange,
}: {
  data: Partial<ApplicationFormData>;
  onChange: (updates: Partial<ApplicationFormData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Requested Amount ($)</label>
        <input
          type="number"
          value={data.requestedAmount || ''}
          onChange={(e) => onChange({ requestedAmount: Number(e.target.value) })}
          className="w-full px-3 py-2 border rounded-md text-sm"
          placeholder="25000"
          min={1000}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tenure (months)</label>
        <input
          type="number"
          value={data.requestedTenure || ''}
          onChange={(e) => onChange({ requestedTenure: Number(e.target.value) })}
          className="w-full px-3 py-2 border rounded-md text-sm"
          placeholder="36"
          min={1}
          max={360}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Purpose</label>
        <textarea
          value={data.purpose || ''}
          onChange={(e) => onChange({ purpose: e.target.value })}
          className="w-full px-3 py-2 border rounded-md text-sm resize-none"
          rows={3}
          placeholder="Describe the purpose of this loan..."
          maxLength={500}
        />
      </div>
    </div>
  );
}

function ReviewStep({ data }: { data: Partial<ApplicationFormData> }) {
  return (
    <div className="space-y-3">
      <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Product ID</span>
          <span className="font-mono text-xs">{data.productId || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Customer ID</span>
          <span className="font-mono text-xs">{data.customerId || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-medium">
            ${data.requestedAmount?.toLocaleString() || '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tenure</span>
          <span>{data.requestedTenure ? `${data.requestedTenure} months` : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Purpose</span>
          <span className="max-w-[200px] truncate">{data.purpose || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Channel</span>
          <span>{data.channel}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        By submitting, a case will be created and the application will enter the processing pipeline.
      </p>
    </div>
  );
}
