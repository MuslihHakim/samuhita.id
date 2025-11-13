import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Filter, ChevronDown, Calendar as CalendarIcon, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { professionOptions } from '@/lib/constants/professions';
import { addedByOptions, sentToOptions } from '@/lib/constants/submissionOptions';

export const TableToolbar = ({
  statusFilter,
  addedByFilter,
  sentToFilter,
  professionFilter,
  dateFilter,
  searchQuery,
  onStatusFilterChange,
  onAddedByFilterChange,
  onSentToFilterChange,
  onProfessionFilterChange,
  onDateFilterChange,
  onSearchChange,
  onClearFilters,
  filteredCount,
  totalCount,
  onDownloadCSV,
  csvLoading
}) => {
  const addedByUsers = addedByOptions;
  const sentToUsers = sentToOptions;
  

  const hasActiveFilters = statusFilter !== 'all' || addedByFilter !== 'all' || sentToFilter !== 'all' || professionFilter !== 'all' ||
                       dateFilter.start || dateFilter.end || searchQuery.trim();

  return (
    <div className="flex flex-col gap-4">
      {/* Desktop Filters */}
      <div className="hidden lg:flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters:</span>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 px-2 text-xs bg-background hover:bg-muted/50 border-border/50 min-w-[60px] justify-between ${
                    statusFilter !== 'all' ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                >
                  <span className="capitalize">
                    {statusFilter === 'all' ? 'All' : statusFilter}
                  </span>
                  <ChevronDown className="w-3 h-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem
                  onClick={() => onStatusFilterChange('all')}
                  className={statusFilter === 'all' ? 'bg-accent' : ''}
                >
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onStatusFilterChange('pending')}
                  className={statusFilter === 'pending' ? 'bg-accent' : ''}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    Pending
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onStatusFilterChange('verified')}
                  className={statusFilter === 'verified' ? 'bg-accent' : ''}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Verified
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onStatusFilterChange('registered')}
                  className={statusFilter === 'registered' ? 'bg-accent' : ''}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    Registered
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Add By Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Add By:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 px-2 text-xs bg-background hover:bg-muted/50 border-border/50 min-w-[60px] justify-between ${
                    addedByFilter !== 'all' ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                >
                  <span>
                    {addedByFilter === 'all' ? 'All' : addedByFilter}
                  </span>
                  <ChevronDown className="w-3 h-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem
                  onClick={() => onAddedByFilterChange('all')}
                  className={addedByFilter === 'all' ? 'bg-accent' : ''}
                >
                  All Add By
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {addedByUsers.map(user => (
                  <DropdownMenuItem
                    key={user}
                    onClick={() => onAddedByFilterChange(user)}
                    className={addedByFilter === user ? 'bg-accent' : ''}
                  >
                    {user}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onAddedByFilterChange('unassigned')}
                  className={addedByFilter === 'unassigned' ? 'bg-accent' : ''}
                >
                  Unassigned
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Sent To Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sent To:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 px-2 text-xs bg-background hover:bg-muted/50 border-border/50 min-w-[60px] justify-between ${
                    sentToFilter !== 'all' ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                >
                  <span>
                    {sentToFilter === 'all' ? 'All' : sentToFilter}
                  </span>
                  <ChevronDown className="w-3 h-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem
                  onClick={() => onSentToFilterChange('all')}
                  className={sentToFilter === 'all' ? 'bg-accent' : ''}
                >
                  All Sent To
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {sentToUsers.map(p3mi => (
                  <DropdownMenuItem
                    key={p3mi}
                    onClick={() => onSentToFilterChange(p3mi)}
                    className={sentToFilter === p3mi ? 'bg-accent' : ''}
                  >
                    {p3mi}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onSentToFilterChange('unassigned')}
                  className={sentToFilter === 'unassigned' ? 'bg-accent' : ''}
                >
                  Unassigned
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Profession Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Profession:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 px-2 text-xs bg-background hover:bg-muted/50 border-border/50 min-w-[60px] justify-between ${
                    professionFilter !== 'all' ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                >
                  <span>
                    {professionFilter === 'all'
                      ? 'All'
                      : professionFilter === 'unassigned'
                      ? 'Unassigned'
                      : professionFilter}
                  </span>
                  <ChevronDown className="w-3 h-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem
                  onClick={() => onProfessionFilterChange('all')}
                  className={professionFilter === 'all' ? 'bg-accent' : ''}
                >
                  All Profession
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {professionOptions.map((profession) => (
                  <DropdownMenuItem
                    key={profession}
                    onClick={() => onProfessionFilterChange(profession)}
                    className={professionFilter === profession ? 'bg-accent' : ''}
                  >
                    {profession}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onProfessionFilterChange('unassigned')}
                  className={professionFilter === 'unassigned' ? 'bg-accent' : ''}
                >
                  Unassigned
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 bg-background border-border/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {filteredCount} of {totalCount} submissions
            {hasActiveFilters && (
              <span className="text-xs ml-1">(filtered)</span>
            )}
          </div>
          <Button
            onClick={onDownloadCSV}
            disabled={csvLoading}
            variant="outline"
            className="border-success/20 text-success hover:bg-success/10 hover:border-success/30 transition-all duration-200 min-h-[44px] px-3 sm:px-4"
          >
            {csvLoading ? (
              <div className="w-4 h-4 border-2 border-success/30 border-t-success rounded-full animate-spin sm:mr-2"></div>
            ) : (
              <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            <span className="hidden sm:inline">Download CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
