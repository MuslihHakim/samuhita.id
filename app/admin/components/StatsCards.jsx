'use client';

import { Card, CardContent } from '@/components/ui/card';

export default function StatsCards({ submissions }) {
  const total = submissions.length;
  const pending = submissions.filter((s) => s.status === 'pending').length;
  const prescreening = submissions.filter((s) => s.status === 'PreScreening').length;
  const mcu = submissions.filter((s) => s.status === 'MCU').length;
  const interview = submissions.filter((s) => s.status === 'Interview').length;
  const visa = submissions.filter((s) => s.status === 'Visa').length;
  const depart = submissions.filter((s) => s.status === 'Depart').length;
  const registeredLike = submissions.filter((s) => (
    s.status === 'registered' || s.status === 'PreScreening' || s.status === 'MCU' || s.status === 'Interview' || s.status === 'Contract' || s.status === 'Visa' || s.status === 'Depart'
  )).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6 md:gap-6 mb-6 sm:mb-8 md:mb-8">
      <Card className="border-0 shadow-md sm:shadow-lg bg-card hover-lift transition-all duration-200">
        <CardContent className="p-4 sm:p-6 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm md:text-sm font-medium text-muted-foreground mb-1">Total Submissions</p>
              <p className="text-2xl sm:text-3xl md:text-3xl font-bold text-foreground">{total}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md sm:shadow-lg bg-card hover-lift transition-all duration-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl sm:text-3xl font-bold text-warning">{pending}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md sm:shadow-lg bg-card hover-lift transition-all duration-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Pre-Screening</p>
              <p className="text-2xl sm:text-3xl font-bold text-accent">{prescreening}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zm4 3h6m-7 4h8m-9 5h10" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md sm:shadow-lg bg-card hover-lift transition-all duration-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Active (Reg.+Process)</p>
              <p className="text-2xl sm:text-3xl font-bold text-success">{registeredLike}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md sm:shadow-lg bg-card hover-lift transition-all duration-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">MCU</p>
              <p className="text-2xl sm:text-3xl font-bold text-info">{mcu}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-info/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 1.657-1.343 3-3 3m9 0a3 3 0 10-6 0 3 3 0 006 0z" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md sm:shadow-lg bg-card hover-lift transition-all duration-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Interview</p>
              <p className="text-2xl sm:text-3xl font-bold text-warning">{interview}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md sm:shadow-lg bg-card hover-lift transition-all duration-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Visa</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">{visa}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m4-4H8" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md sm:shadow-lg bg-card hover-lift transition-all duration-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Depart</p>
              <p className="text-2xl sm:text-3xl font-bold text-success">{depart}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h3l3 8 4-14 3 10h4" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
