import { useState } from 'react';

type StepStatus = 'pending' | 'in_progress' | 'passed' | 'failed' | 'skipped';

interface OnboardingStep {
  id: string;
  type: 'identity' | 'document' | 'biometric' | 'signature' | 'aml_check';
  status: StepStatus;
  label: string;
}

const INITIAL_STEPS: OnboardingStep[] = [
  { id: '1', type: 'identity', status: 'pending', label: 'Identity Verification' },
  { id: '2', type: 'document', status: 'pending', label: 'Document Upload' },
  { id: '3', type: 'biometric', status: 'pending', label: 'Biometric Check' },
  { id: '4', type: 'signature', status: 'pending', label: 'E-Signature' },
  { id: '5', type: 'aml_check', status: 'pending', label: 'AML Screening' },
];

export function OnboardingWizard() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>(INITIAL_STEPS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const startSession = () => {
    setSessionStarted(true);
    setSteps((prev) =>
      prev.map((s, i) => (i === 0 ? { ...s, status: 'in_progress' } : s)),
    );
  };

  const processStep = async () => {
    setIsProcessing(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

    const passed = Math.random() > 0.1; // 90% pass rate

    setSteps((prev) =>
      prev.map((s, i) => {
        if (i === currentStepIndex) {
          return { ...s, status: passed ? 'passed' : 'failed' };
        }
        if (i === currentStepIndex + 1 && passed) {
          return { ...s, status: 'in_progress' };
        }
        return s;
      }),
    );

    if (passed && currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else if (passed && currentStepIndex === steps.length - 1) {
      setCompleted(true);
    }

    setIsProcessing(false);
  };

  const resetWizard = () => {
    setCurrentStepIndex(0);
    setSteps(INITIAL_STEPS);
    setIsProcessing(false);
    setSessionStarted(false);
    setCompleted(false);
  };

  if (!sessionStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <UserCheckIcon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Digital Onboarding</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Complete the onboarding process to verify your identity and open your account.
            This typically takes 3-5 minutes.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-6">
            {['Web', 'Mobile', 'Branch', 'API'].map((channel) => (
              <div
                key={channel}
                className="p-3 rounded-lg border bg-muted/30 text-sm font-medium"
              >
                {channel}
              </div>
            ))}
          </div>
          <button
            onClick={startSession}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Start Onboarding
          </button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-green-700 dark:text-green-400">
            Onboarding Complete
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            All verification steps passed. Your account has been created successfully.
          </p>
          <div className="space-y-2 max-w-sm mx-auto mb-6">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/10">
                <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm">{step.label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={resetWizard}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Stepper */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Onboarding Progress</h3>
          <span className="text-xs text-muted-foreground">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {steps.map((step, i) => (
            <div key={step.id} className="flex-1 flex items-center gap-1">
              <div
                className={`flex-1 h-2 rounded-full transition-colors ${
                  step.status === 'passed'
                    ? 'bg-green-500'
                    : step.status === 'failed'
                      ? 'bg-red-500'
                      : step.status === 'in_progress'
                        ? 'bg-primary animate-pulse'
                        : 'bg-muted'
                }`}
              />
              {i < steps.length - 1 && <div className="w-1" />}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-1 flex-1">
              <StepIcon status={step.status} />
              <span className="text-[10px] text-muted-foreground text-center leading-tight">
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-card border rounded-xl p-6">
        <StepContent
          step={steps[currentStepIndex]}
          isProcessing={isProcessing}
          onProcess={processStep}
        />
      </div>

      {/* Step Results */}
      {steps.some((s) => s.status === 'passed' || s.status === 'failed') && (
        <div className="bg-card border rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-3">Verification Results</h3>
          <div className="space-y-2">
            {steps
              .filter((s) => s.status === 'passed' || s.status === 'failed')
              .map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    step.status === 'passed'
                      ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {step.status === 'passed' ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      step.status === 'passed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {step.status === 'passed' ? 'Verified' : 'Failed'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepContent({
  step,
  isProcessing,
  onProcess,
}: {
  step: OnboardingStep;
  isProcessing: boolean;
  onProcess: () => void;
}) {
  const stepConfig = {
    identity: {
      title: 'Identity Verification',
      description: 'Upload a government-issued ID document for verification.',
      icon: <IdCardIcon className="w-6 h-6 text-primary" />,
      action: 'Verify Identity',
    },
    document: {
      title: 'Document Upload',
      description: 'Upload supporting documents (proof of address, income statement).',
      icon: <DocumentIcon className="w-6 h-6 text-primary" />,
      action: 'Upload & Verify',
    },
    biometric: {
      title: 'Biometric Verification',
      description: 'Complete a face scan for liveness detection and identity matching.',
      icon: <FaceScanIcon className="w-6 h-6 text-primary" />,
      action: 'Start Face Scan',
    },
    signature: {
      title: 'Electronic Signature',
      description: 'Review and sign the terms and conditions electronically.',
      icon: <PenIcon className="w-6 h-6 text-primary" />,
      action: 'Sign Document',
    },
    aml_check: {
      title: 'AML Screening',
      description: 'Automated anti-money laundering and sanctions screening.',
      icon: <ShieldIcon className="w-6 h-6 text-primary" />,
      action: 'Run Screening',
    },
  };

  const config = stepConfig[step.type];

  return (
    <div className="text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
        {config.icon}
      </div>
      <h3 className="text-lg font-semibold mb-1">{config.title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        {config.description}
      </p>

      {isProcessing ? (
        <div className="flex flex-col items-center gap-3">
          {step.type === 'biometric' ? (
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="absolute inset-4 rounded-full bg-primary/5 flex items-center justify-center">
                <FaceScanIcon className="w-10 h-10 text-primary animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          )}
          <span className="text-sm text-muted-foreground">Processing...</span>
        </div>
      ) : (
        <button
          onClick={onProcess}
          disabled={step.status === 'passed' || step.status === 'failed'}
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {config.action}
        </button>
      )}
    </div>
  );
}

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'passed':
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    case 'failed':
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    case 'in_progress':
      return (
        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      );
    default:
      return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />;
  }
}

// Icons
function UserCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 3a4 4 0 100 8 4 4 0 000-8zM17 11l2 2 4-4" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IdCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3M15 14h2" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function FaceScanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h6m-6 0v0M15 3h4a2 2 0 012 2v4M3 15v4a2 2 0 002 2h4m12-6v4a2 2 0 01-2 2h-4M9 12a3 3 0 106 0 3 3 0 00-6 0z" />
    </svg>
  );
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
