'use client';

import { Button } from '@/components/ui/button';

export default function BulkActionsBar({
  count,
  onClear,
  onDownloadWord,
  onDownloadPdf,
  onDelete,
  loading, // 'download' | 'delete' | null
}) {
  return (
    <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary">
            {count} {count === 1 ? 'user' : 'users'} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-primary hover:bg-primary/10 h-8 px-2"
          >
            Clear selection
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={onDownloadWord}
            disabled={loading === 'download'}
            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 h-8 px-3"
          >
            {loading === 'download' ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Bulk Word
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={onDownloadPdf}
            disabled={loading === 'download'}
            className="bg-info text-info-foreground hover:bg-info/90 transition-all duration-200 h-8 px-3"
          >
            {loading === 'download' ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Bulk PDF
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={onDelete}
            disabled={loading === 'delete'}
            variant="destructive"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200 h-8 px-3"
          >
            {loading === 'delete' ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Bulk Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

