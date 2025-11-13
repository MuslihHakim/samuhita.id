'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ChevronDown, Calendar as CalendarIcon, X, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { professionOptions } from '@/lib/constants/professions';
import { addedByOptions, sentToOptions } from '@/lib/constants/submissionOptions';

import React, { useState } from 'react';


const placementOptions = Array.from({ length: 20 }, (_, i) => `Hotel ${i + 1}`);

export default function FilterBarMobile({
  statusFilter, setStatusFilter,
  addedByFilter, setAddedByFilter,
  sentToFilter, setSentToFilter,
  professionFilter, setProfessionFilter,
  placementFilter, setPlacementFilter,
  coordinatorFilter, setCoordinatorFilter,
  coordinatorOptions = [],
  dateFilter, setDateFilter,
  searchQuery, setSearchQuery,
  clearFilters, clearStatusFilter,
  setCurrentPage,
  totalResultsCount,
  totalAllCount,
}) {
  const [open, setOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState();

  return (
    <div className="sm:hidden mb-3 space-y-2">
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        {(statusFilter !== 'all' ||
          addedByFilter !== 'all' ||
          sentToFilter !== 'all' ||
          professionFilter !== 'all' ||
          placementFilter !== 'all' ||
          coordinatorFilter !== 'all' ||
          dateFilter.start ||
          dateFilter.end ||
          searchQuery) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 px-2 bg-background hover:bg-muted/50 border-border/50 flex-1 justify-between text-xs ${statusFilter !== 'all' ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <span className="truncate">
                {statusFilter === 'all'
                  ? 'All Status'
                  : statusFilter === 'PreScreening'
                  ? 'Pre-Screening'
                  : statusFilter}
              </span>
              <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-32">
            <DropdownMenuItem onClick={() => clearStatusFilter()} className={statusFilter === 'all' ? 'bg-accent' : ''}>All</DropdownMenuItem>
            <DropdownMenuSeparator />
            {['pending','verified','registered','PreScreening','MCU','Interview','Contract','Visa','Depart'].map((st) => {
              const label = st === 'PreScreening' ? 'Pre-Screening' : st.charAt(0).toUpperCase()+st.slice(1);
              return (
                <DropdownMenuItem key={st} onClick={() => setStatusFilter(st)} className={statusFilter === st ? 'bg-accent' : ''}>
                  {label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Add By */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 px-2 bg-background hover:bg-muted/50 border-border/50 flex-1 justify-between text-xs ${addedByFilter !== 'all' ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <span className="truncate">{addedByFilter === 'all' ? 'Add By' : addedByFilter}</span>
              <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-32">
            <DropdownMenuItem onClick={() => setAddedByFilter('all')} className={addedByFilter === 'all' ? 'bg-accent' : ''}>All</DropdownMenuItem>
            <DropdownMenuSeparator />
            {addedByOptions.map((user) => (
              <DropdownMenuItem key={user} onClick={() => setAddedByFilter(user)} className={addedByFilter === user ? 'bg-accent' : ''}>
                {user}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setAddedByFilter('unassigned')} className={addedByFilter === 'unassigned' ? 'bg-accent' : ''}>Unassigned</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sent To */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 px-2 bg-background hover:bg-muted/50 border-border/50 flex-1 justify-between text-xs ${sentToFilter !== 'all' ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <span className="truncate">{sentToFilter === 'all' ? 'Sent To' : sentToFilter}</span>
              <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-32">
            <DropdownMenuItem onClick={() => setSentToFilter('all')} className={sentToFilter === 'all' ? 'bg-accent' : ''}>All</DropdownMenuItem>
            <DropdownMenuSeparator />
            {sentToOptions.map((p3mi) => (
              <DropdownMenuItem key={p3mi} onClick={() => setSentToFilter(p3mi)} className={sentToFilter === p3mi ? 'bg-accent' : ''}>
                {p3mi}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSentToFilter('unassigned')} className={sentToFilter === 'unassigned' ? 'bg-accent' : ''}>Unassigned</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profession */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 px-2 bg-background hover:bg-muted/50 border-border/50 flex-1 justify-between text-xs ${professionFilter !== 'all' ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <span className="truncate">
                {professionFilter === 'all'
                  ? 'Profession'
                  : professionFilter === 'unassigned'
                  ? 'Unassigned'
                  : professionFilter}
              </span>
              <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36">
            <DropdownMenuItem onClick={() => setProfessionFilter('all')} className={professionFilter === 'all' ? 'bg-accent' : ''}>All</DropdownMenuItem>
            <DropdownMenuSeparator />
            {professionOptions.map((profession) => (
              <DropdownMenuItem
                key={profession}
                onClick={() => setProfessionFilter(profession)}
                className={professionFilter === profession ? 'bg-accent' : ''}
              >
                {profession}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setProfessionFilter('unassigned')} className={professionFilter === 'unassigned' ? 'bg-accent' : ''}>
              Unassigned
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Placement */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 px-2 bg-background hover:bg-muted/50 border-border/50 flex-1 justify-between text-xs ${placementFilter !== 'all' ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <span className="truncate">
                {placementFilter === 'all'
                  ? 'Placement'
                  : placementFilter === 'unassigned'
                  ? 'Unassigned'
                  : placementFilter}
              </span>
              <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36">
            <DropdownMenuItem onClick={() => setPlacementFilter('all')} className={placementFilter === 'all' ? 'bg-accent' : ''}>All</DropdownMenuItem>
            <DropdownMenuSeparator />
            {placementOptions.map((placement) => (
              <DropdownMenuItem
                key={placement}
                onClick={() => setPlacementFilter(placement)}
                className={placementFilter === placement ? 'bg-accent' : ''}
              >
                {placement}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setPlacementFilter('unassigned')} className={placementFilter === 'unassigned' ? 'bg-accent' : ''}>
              Unassigned
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Coordinator */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 px-2 bg-background hover:bg-muted/50 border-border/50 flex-1 justify-between text-xs ${coordinatorFilter !== 'all' ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <span className="truncate">
                {coordinatorFilter === 'all'
                  ? 'Coordinator'
                  : coordinatorFilter === 'unassigned'
                  ? 'Unassigned'
                  : coordinatorFilter}
              </span>
              <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onClick={() => setCoordinatorFilter('all')} className={coordinatorFilter === 'all' ? 'bg-accent' : ''}>
              All
            </DropdownMenuItem>
            {coordinatorOptions.length > 0 && <DropdownMenuSeparator />}
            {coordinatorOptions.map((coordinator) => (
              <DropdownMenuItem
                key={coordinator}
                onClick={() => setCoordinatorFilter(coordinator)}
                className={coordinatorFilter === coordinator ? 'bg-accent' : ''}
              >
                {coordinator}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCoordinatorFilter('unassigned')} className={coordinatorFilter === 'unassigned' ? 'bg-accent' : ''}>
              Unassigned
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 px-2 bg-background hover:bg-muted/50 border-border/50 flex-1 justify-between text-xs ${(dateFilter.start || dateFilter.end || selectedRange) ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <span className="truncate">
                {selectedRange?.from && selectedRange?.to
                  ? `${format(selectedRange.from, 'MM/dd')}-${format(selectedRange.to, 'MM/dd')}`
                  : selectedRange?.from
                  ? `From ${format(selectedRange.from, 'MM/dd')}`
                  : selectedRange?.to
                  ? `Until ${format(selectedRange.to, 'MM/dd')}`
                  : dateFilter.start && dateFilter.end
                  ? `${format(dateFilter.start, 'MM/dd')}-${format(dateFilter.end, 'MM/dd')}`
                  : dateFilter.start
                  ? `From ${format(dateFilter.start, 'MM/dd')}`
                  : dateFilter.end
                  ? `Until ${format(dateFilter.end, 'MM/dd')}`
                  : 'Date range'}
              </span>
              <CalendarIcon className="w-3 h-3 ml-1 flex-shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center" side="bottom" className="w-auto p-0 z-[99999] data-mobile-popover">
            <div className="p-3">
              <Calendar mode="range" numberOfMonths={1} selected={selectedRange} onSelect={setSelectedRange} className="rounded-md border text-sm" />
              <div className="flex justify-between mt-3 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedRange(undefined);
                    setDateFilter({ start: null, end: null });
                    setCurrentPage(1);
                  }}
                  className="text-xs"
                >
                  Reset
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedRange) {
                        setDateFilter({ start: selectedRange.from, end: selectedRange.to });
                        setCurrentPage(1);
                      }
                      setOpen(false);
                    }}
                    className="text-xs"
                  >
                    Apply
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-xs">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="h-8 pl-8 pr-8 text-xs bg-background hover:bg-muted/50 border-border/50 w-full focus:border-primary/50 focus:ring-primary/20"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground px-1">{totalResultsCount} of {totalAllCount} results</div>
    </div>
  );
}
