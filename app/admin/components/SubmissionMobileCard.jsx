'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EyeToggle } from '@/components/ui/EyeToggle';

export default function SubmissionMobileCard({
  submission,
  selected,
  onSelect,
  getStatusBadge,
  isVisible,
  toggleVisibility,
  maskEmail,
  maskPhoneNumber,
  actionStatus,
  onVerify,
  onGenerateAccount,
  onViewCredentials,
  onNavigateProcess,
  onNavigateEditCv,
  onGenerateCv,
  onDelete,
}) {
  const isRegisteredLike = (status) => status === 'registered' || ['PreScreening','MCU','Interview','Contract','Visa','Depart'].includes(status);
  return (
    <div className="border border-border rounded-lg p-3 space-y-3 bg-card hover-lift transition-all duration-200 dark:border-border/60">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {submission.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{submission.fullName}</p>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted-foreground truncate">
                    {isVisible('email') ? submission.email : maskEmail(submission.email)}
                  </p>
                  <EyeToggle
                    show={isVisible('email')}
                    onToggle={() => toggleVisibility('email')}
                    size="sm"
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {getStatusBadge(submission.status)}
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Phone:</span>
          <div className="flex items-center gap-1">
            <span className="text-foreground text-xs">
              {isVisible('phone') ? submission.phoneNumber : maskPhoneNumber(submission.phoneNumber)}
            </span>
            <EyeToggle
              show={isVisible('phone')}
              onToggle={() => toggleVisibility('phone')}
              size="sm"
              className="flex-shrink-0"
            />
          </div>
        </div>
        <p>
          Created: <span className="text-foreground">{new Date(submission.createdAt).toLocaleDateString()}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        {submission.status === 'pending' && (
          <Button
            size="sm"
            onClick={onVerify}
            disabled={actionStatus === 'verifying'}
            className="flex-1 hover:bg-primary hover:text-primary-foreground transition-all duration-200 min-h-[36px] text-xs"
          >
            {actionStatus === 'verifying' ? (
              <div className="flex items-center justify-center gap-1">
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Verify</span>
              </div>
            )}
          </Button>
        )}

        {submission.status === 'verified' && (
          <Button
            size="sm"
            onClick={onGenerateAccount}
            disabled={actionStatus === 'generating'}
            variant="success"
            className="flex-1 hover:bg-success/90 transition-all duration-200 min-h-[36px] text-xs"
          >
            {actionStatus === 'generating' ? (
              <div className="flex items-center justify-center gap-1">
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Generate</span>
              </div>
            )}
          </Button>
        )}

        {isRegisteredLike(submission.status) && (
          <>
            <Button
              size="sm"
              onClick={onViewCredentials}
              variant="outline"
              className="flex-1 border-info/20 text-info hover:bg-info/10 transition-all duration-200 min-h-[36px] text-xs"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>Credentials</span>
            </Button>
            {submission.userId && (
              <>
                <Button
                  size="sm"
                  onClick={() => onNavigateProcess(submission.userId)}
                  variant="outline"
                  className="flex-1 border-success/20 text-success hover:bg-success/10 transition-all duration-200 min-h-[36px] text-xs"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Process</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => onNavigateEditCv(submission.userId)}
                  variant="outline"
                  className="flex-1 border-warning/20 text-warning hover:bg-warning/10 transition-all duration-200 min-h-[36px] text-xs"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit CV</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => onGenerateCv('word')}
                  variant="outline"
                  className="flex-1 border-primary/20 text-primary hover:bg-primary/10 transition-all duration-200 min-h-[36px] text-xs"
                >
                  <span>Word</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => onGenerateCv('pdf')}
                  variant="outline"
                  className="flex-1 border-info/20 text-info hover:bg-info/10 transition-all duration-200 min-h-[36px] text-xs"
                >
                  <span>PDF</span>
                </Button>
              </>
            )}
          </>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          disabled={actionStatus === 'deleting'}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200 min-h-[36px] px-2"
        >
          {actionStatus === 'deleting' ? (
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}
