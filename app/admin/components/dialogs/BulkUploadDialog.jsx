'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { professionOptions } from '@/lib/constants/professions';
import { addedByOptions, sentToOptions } from '@/lib/constants/submissionOptions';
import { coordinatorOptionsByAddedBy } from '@/lib/constants/coordinators';

export default function BulkUploadDialog({
  isOpen,
  onOpenChange,
  state, // { step, loading, csvFile, candidates, currentCandidateIndex, duplicates, results }
  actions, // { onFileChange, onUpload, onNavigate, onBulkCreate, onReset, onDownloadTemplate }
  validators, // { isValidEmail, isValidPhone }
}) {
  const { step, loading, csvFile, candidates = [], currentCandidateIndex = 0, duplicates = [], results } = state || {};
  const { onFileChange, onUpload, onNavigate, onBulkCreate, onReset, onDownloadTemplate } = actions || {};
  const { isValidEmail, isValidPhone } = validators || {};

  const hasCandidates = candidates && candidates.length > 0;
  const current = hasCandidates ? candidates[currentCandidateIndex] : null;
  const officeCoordinatorOptions = coordinatorOptionsByAddedBy?.Office ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-info/20 text-info hover:bg-info/10 hover:border-info/30 transition-all duration-200 min-h-[44px] px-3 sm:px-4"
        >
          <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="hidden sm:inline">Upload CSV</span>
          <span className="sm:hidden">Upload</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800">Bulk Upload Candidates</DialogTitle>
          <DialogDescription className="text-muted-foreground dark:text-muted-foreground">
            {step === 'upload' && 'Upload a CSV file with candidate data. The file should follow the same format as the downloaded CSV template.'}
            {step === 'preview' && 'Review candidate data before uploading. Navigate through candidates using Previous/Next buttons.'}
            {step === 'processing' && 'Processing candidates and creating accounts...'}
            {step === 'results' && 'Upload completed. Review the results below.'}
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-6 pt-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input type="file" accept=".csv" onChange={(e) => onFileChange?.(e.target.files[0])} className="hidden" id="csv-upload" />
              <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-muted-foreground dark:text-muted-foreground">{csvFile ? csvFile.name : 'Click to upload CSV file'}</p>
                  <p className="text-sm text-slate-500 mt-1">Only CSV files are accepted</p>
                </div>
              </label>
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-left">
              <div className="text-sm text-muted-foreground mb-2">CSV guidelines:</div>
              <ul className="text-sm list-disc pl-5 space-y-1">
                <li>Required: Full Name, Email, Phone Number.</li>
                <li>New: Profession, Gender, Add By, Sent To. Position Apply also accepted as alias for Profession.</li>
                <li>Gender values: Male or Female (case-insensitive).</li>
                <li>Profession: {professionOptions.join(', ')}. Unknowns imported as Unassigned.</li>
                <li>Add By: {addedByOptions.join(', ')}. Unknowns imported as Unassigned.</li>
                <li>Coordinator: only for Add By groups with coordinator mappings (currently Office). Options: {officeCoordinatorOptions.join(', ')}. Use Unassigned to leave blank; "None" is a valid choice.</li>
                <li>Sent To: {sentToOptions.join(', ')}. Unknowns imported as Unassigned.</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => onReset?.()} className="h-11 px-6">Cancel</Button>
              <a href="/samples/bulk-upload-sample.csv" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-info/20 text-info hover:bg-info/10 hover:border-info/30 transition-all duration-200 h-11 px-4 rounded-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Sample CSV
              </a>
              <Button variant="outline" onClick={() => onDownloadTemplate?.()} className="border-warning/20 text-warning hover:bg-warning/10 hover:border-warning/30 transition-all duration-200 h-11 px-6">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Template CSV
              </Button>
              <Button onClick={() => onUpload?.()} disabled={!csvFile || loading} className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white h-11 px-6 shadow-lg hover:shadow-xl transition-all duration-200">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Upload & Preview'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && hasCandidates && (
          <div className="space-y-6 pt-4">
            {/* Candidate Navigation */}
            <div className="flex items-center justify-between bg-muted/50 dark:bg-muted/20 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" onClick={() => onNavigate?.('prev')} disabled={currentCandidateIndex === 0}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </Button>
                <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Candidate {currentCandidateIndex + 1} of {candidates.length}</span>
                <Button variant="outline" size="sm" onClick={() => onNavigate?.('next')} disabled={currentCandidateIndex === candidates.length - 1}>
                  Next
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                {current?.isValid && !current?.hasDuplicate ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">Valid</span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">Issues Found</span>
                )}
              </div>
            </div>

            {/* Candidate Details (summary-only) */}
            <div className="bg-background dark:bg-card border border-border rounded-lg p-6 space-y-6">
              {current && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">Full Name</label>
                        <div className={`p-2 rounded border ${current.fullName ? 'border-input dark:border-border bg-background dark:bg-card/50' : 'border-destructive/50 bg-destructive/5 dark:bg-destructive/10'}`}>{current.fullName || <span className="text-destructive dark:text-destructive italic">Required field missing</span>}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">Position Apply</label>
                        <div className="p-2 rounded border border-input dark:border-border bg-background dark:bg-card/50">{current.positionApply || '-'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">Email</label>
                        <div className={`p-2 rounded border ${current.email && !current.duplicateEmail ? 'border-input dark:border-border bg-background dark:bg-card/50' : 'border-destructive/50 bg-destructive/5 dark:bg-destructive/10'}`}>
                          {current.email || <span className="text-destructive dark:text-destructive italic">Required field missing</span>}
                          {current.duplicateEmail && <span className="text-destructive dark:text-destructive text-xs block mt-1">⚠️ Email already exists</span>}
                          {current.email && !isValidEmail?.(current.email) && <span className="text-destructive dark:text-destructive text-xs block mt-1">⚠️ Invalid email format</span>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">Phone Number</label>
                        <div className={`p-2 rounded border ${current.phoneNumber && !current.duplicatePhone ? 'border-input dark:border-border bg-background dark:bg-card/50' : 'border-destructive/50 bg-destructive/5 dark:bg-destructive/10'}`}>
                          {current.phoneNumber || <span className="text-destructive dark:text-destructive italic">Required field missing</span>}
                          {current.duplicatePhone && <span className="text-destructive dark:text-destructive text-xs block mt-1">⚠️ Phone number already exists</span>}
                          {current.phoneNumber && !isValidPhone?.(current.phoneNumber) && <span className="text-destructive dark:text-destructive text-xs block mt-1">⚠️ Invalid phone format</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Duplicates panel */}
                  {duplicates?.length > 0 && (
                    <div className="bg-warning/10 border border-warning/20 dark:bg-warning/5 dark:border-warning/30 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-warning-foreground dark:text-warning-foreground mb-2">⚠️ Found {duplicates.length} duplicate(s)</h4>
                      <p className="text-sm text-warning dark:text-warning mb-2">Some candidates have duplicate email or phone numbers. These will be excluded from import by default.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 border-t pt-4">
              <Button variant="outline" onClick={() => onReset?.()} className="h-11 px-6">Cancel</Button>
              <Button onClick={() => onBulkCreate?.(true, true)} className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white h-11 px-6 shadow-lg hover:shadow-xl transition-all duration-200">Import Valid Candidates</Button>
            </div>
          </div>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="text-lg font-medium text-muted-foreground dark:text-muted-foreground">Processing candidates...</p>
            <p className="text-sm text-slate-500">Please wait while we create the candidate accounts</p>
          </div>
        )}

        {/* Results */}
        {step === 'results' && results && (
          <div className="space-y-6 pt-4">
            <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Upload Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{results.summary.totalRequested}</div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">Total Requested</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{results.summary.successful}</div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">Successfully Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">{results.summary.filtered - results.summary.successful}</div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-info">{results.summary.failed}</div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">Batches Failed</div>
                </div>
              </div>
            </div>
            {results.results?.failed?.length > 0 && (
              <div className="bg-warning/10 border border-warning/20 dark:bg-warning/5 dark:border-warning/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-warning-foreground dark:text-warning-foreground mb-2">Failed Batches:</h4>
                <div className="space-y-2">
                  {results.results.failed.map((batch, index) => (
                    <div key={index} className="text-sm text-warning dark:text-warning">
                      <p className="font-medium">Batch {batch.batch}: {batch.error}</p>
                      <p className="text-xs text-warning/80 dark:text-warning/70">Affected {batch.candidates.length} candidates</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <Button onClick={() => onReset?.()} className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white h-11 px-6 shadow-lg hover:shadow-xl transition-all duration-200">Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
