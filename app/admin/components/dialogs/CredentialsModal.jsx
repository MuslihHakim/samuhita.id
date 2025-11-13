'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EyeToggle } from '@/components/ui/EyeToggle';

export default function CredentialsModal({
  isOpen,
  loading,
  credentials,
  submissionName,
  onClose,
  maskEmail,
  maskPhoneNumber,
  maskPassword,
  credentialsVisibility,
  onCopy,
}) {
  if (!isOpen) {
    return null;
  }

  const username = credentials?.username ?? '';
  const password = credentials?.password ?? '';
  const submissionEmail = credentials?.submission?.email ?? '';
  const submissionPhone = credentials?.submission?.phoneNumber ?? '';
  const viewedAt = credentials?.viewedAt;

  const isVisible = credentialsVisibility?.isVisible ?? (() => false);
  const toggleVisibility = credentialsVisibility?.toggle ?? (() => {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md sm:max-w-lg">
        <Card className="border-0 shadow-2xl bg-card max-h-[90vh] overflow-y-auto glass-effect">
          <CardHeader className="bg-gradient-to-br from-muted to-card/50 border-b border-border px-4 sm:px-6 py-4 dark:from-muted/10 dark:to-card/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-info/20 to-info/10 rounded-xl flex items-center justify-center border border-info/20 flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg font-semibold text-foreground truncate">Kredensial Login</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground truncate">
                    {submissionName}
                  </CardDescription>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 min-h-[36px] min-w-[36px] p-2 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-info/20 border-t-info rounded-full animate-spin"></div>
                <span className="ml-3 text-sm sm:text-base text-muted-foreground">Memuat kredensial...</span>
              </div>
            ) : credentials ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-warning/10 border border-warning/20 dark:bg-warning/5 dark:border-warning/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-warning">Informasi Sensitif</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Harap simpan kredensial ini dengan aman dan hanya berikan kepada pengguna yang bersangkutan.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Username
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg font-mono text-xs sm:text-sm text-foreground break-all">
                      {username}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCopy?.(username, 'Username')}
                      className="border-border text-muted-foreground hover:bg-muted transition-all duration-200 min-h-[36px] min-w-[36px] flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Password
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg font-mono text-xs sm:text-sm text-foreground break-all">
                      {isVisible('password') ? password : maskPassword?.(password)}
                    </div>
                    <EyeToggle
                      show={isVisible('password')}
                      onToggle={() => toggleVisibility('password')}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCopy?.(password, 'Password')}
                      className="border-border text-muted-foreground hover:bg-muted transition-all duration-200 min-h-[36px] min-w-[36px] flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </Button>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-border space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1">
                    <span className="text-muted-foreground">Email:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium text-xs sm:text-sm break-all text-right">
                        {isVisible('email') ? submissionEmail : maskEmail?.(submissionEmail)}
                      </span>
                      <EyeToggle
                        show={isVisible('email')}
                        onToggle={() => toggleVisibility('email')}
                        size="sm"
                        className="flex-shrink-0"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1">
                    <span className="text-muted-foreground">Phone:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium text-xs sm:text-sm break-all text-right">
                        {isVisible('phone') ? submissionPhone : maskPhoneNumber?.(submissionPhone)}
                      </span>
                      <EyeToggle
                        show={isVisible('phone')}
                        onToggle={() => toggleVisibility('phone')}
                        size="sm"
                        className="flex-shrink-0"
                      />
                    </div>
                  </div>
                  {viewedAt && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1">
                      <span className="text-muted-foreground">Viewed:</span>
                      <span className="text-warning font-medium text-xs sm:text-sm break-all text-right">
                        {new Date(viewedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <p className="text-muted-foreground text-sm sm:text-base">Kredensial tidak tersedia</p>
              </div>
            )}

            <div className="flex justify-end pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-border">
              <Button
                onClick={onClose}
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 min-h-[36px] px-4 sm:px-6 text-sm sm:text-base"
              >
                Tutup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

