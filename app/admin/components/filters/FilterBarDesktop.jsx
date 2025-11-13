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

export default function FilterBarDesktop({
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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState();

  return (
    <div className="mb-4">
      <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex flex-wrap items-center gap-4">
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
                    <span className="text-xs">
                      {statusFilter === 'all' ? 'All' : statusFilter === 'PreScreening' ? 'Pre-Screening' : statusFilter}
                    </span>
                    <ChevronDown className="w-3 h-3 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuItem onClick={() => clearStatusFilter()} className={statusFilter === 'all' ? 'bg-accent' : ''}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {['pending','verified','registered','PreScreening','MCU','Interview','Contract','Visa','Depart'].map((st) => {
                    const label = st === 'PreScreening' ? 'Pre-Screening' : st.charAt(0).toUpperCase()+st.slice(1);
                    return (
                      <DropdownMenuItem
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={statusFilter === st ? 'bg-accent' : ''}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            st==='pending' ? 'bg-warning' :
                            st==='verified' ? 'bg-primary' :
                            st==='registered' ? 'bg-success' :
                            st==='PreScreening' ? 'bg-accent' :
                            st==='MCU' ? 'bg-info' :
                            st==='Interview' ? 'bg-warning' :
                            st==='Contract' ? 'bg-navy-500' :
                            st==='Visa' ? 'bg-primary' :
                            st==='Depart' ? 'bg-success' : 'bg-muted-foreground'
                          }`}></div>
                          {label}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
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
                    <span>{addedByFilter === 'all' ? 'All' : addedByFilter}</span>
                    <ChevronDown className="w-3 h-3 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuItem onClick={() => setAddedByFilter('all')} className={addedByFilter === 'all' ? 'bg-accent' : ''}>
                    All Add By
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {addedByOptions.map((user) => (
                    <DropdownMenuItem key={user} onClick={() => setAddedByFilter(user)} className={addedByFilter === user ? 'bg-accent' : ''}>
                      {user}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setAddedByFilter('unassigned')} className={addedByFilter === 'unassigned' ? 'bg-accent' : ''}>
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
                    <span>{sentToFilter === 'all' ? 'All' : sentToFilter}</span>
                    <ChevronDown className="w-3 h-3 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuItem onClick={() => setSentToFilter('all')} className={sentToFilter === 'all' ? 'bg-accent' : ''}>
                    All Sent To
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {sentToOptions.map((p3mi) => (
                    <DropdownMenuItem key={p3mi} onClick={() => setSentToFilter(p3mi)} className={sentToFilter === p3mi ? 'bg-accent' : ''}>
                      {p3mi}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSentToFilter('unassigned')} className={sentToFilter === 'unassigned' ? 'bg-accent' : ''}>
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
                    onClick={() => setProfessionFilter('all')}
                    className={professionFilter === 'all' ? 'bg-accent' : ''}
                  >
                    All Profession
                  </DropdownMenuItem>
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
                  <DropdownMenuItem
                    onClick={() => setProfessionFilter('unassigned')}
                    className={professionFilter === 'unassigned' ? 'bg-accent' : ''}
                  >
                    Unassigned
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full pl-6 sm:pl-8">
            {/* Placement Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Placement:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-8 px-2 text-xs bg-background hover:bg-muted/50 border-border/50 min-w-[60px] justify-between ${
                      placementFilter !== 'all' ? 'border-primary/50 bg-primary/5' : ''
                    }`}
                  >
                    <span>
                      {placementFilter === 'all'
                        ? 'All'
                        : placementFilter === 'unassigned'
                        ? 'Unassigned'
                        : placementFilter}
                    </span>
                    <ChevronDown className="w-3 h-3 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem
                    onClick={() => setPlacementFilter('all')}
                    className={placementFilter === 'all' ? 'bg-accent' : ''}
                  >
                    All Placement
                  </DropdownMenuItem>
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
                  <DropdownMenuItem
                    onClick={() => setPlacementFilter('unassigned')}
                    className={placementFilter === 'unassigned' ? 'bg-accent' : ''}
                  >
                    Unassigned
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Coordinator Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Coordinator:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-8 px-2 text-xs bg-background hover:bg-muted/50 border-border/50 min-w-[60px] justify-between ${
                      coordinatorFilter !== 'all' ? 'border-primary/50 bg-primary/5' : ''
                    }`}
                  >
                    <span>
                      {coordinatorFilter === 'all'
                        ? 'All'
                        : coordinatorFilter === 'unassigned'
                        ? 'Unassigned'
                        : coordinatorFilter}
                    </span>
                    <ChevronDown className="w-3 h-3 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onClick={() => setCoordinatorFilter('all')}
                    className={coordinatorFilter === 'all' ? 'bg-accent' : ''}
                  >
                    All Coordinator
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
                  <DropdownMenuItem
                    onClick={() => setCoordinatorFilter('unassigned')}
                    className={coordinatorFilter === 'unassigned' ? 'bg-accent' : ''}
                  >
                    Unassigned
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Created:</span>
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-8 px-3 bg-background hover:bg-muted/50 border-border/50 min-w-[160px] justify-between ${
                      (dateFilter.start || dateFilter.end || selectedRange) ? 'border-primary/50 bg-primary/5' : ''
                    }`}
                  >
                    <span className="text-xs">
                      {selectedRange?.from && selectedRange?.to
                        ? `${format(selectedRange.from, 'MMM dd')} - ${format(selectedRange.to, 'MMM dd')}`
                        : selectedRange?.from
                        ? `From ${format(selectedRange.from, 'MMM dd')}`
                        : selectedRange?.to
                        ? `Until ${format(selectedRange.to, 'MMM dd')}`
                        : dateFilter.start && dateFilter.end
                        ? `${format(dateFilter.start, 'MMM dd')} - ${format(dateFilter.end, 'MMM dd')}`
                        : dateFilter.start
                        ? `From ${format(dateFilter.start, 'MMM dd')}`
                        : dateFilter.end
                        ? `Until ${format(dateFilter.end, 'MMM dd')}`
                        : 'Select dates'}
                    </span>
                    <CalendarIcon className="w-3 h-3 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <div className="p-3">
                    <Calendar mode="range" numberOfMonths={1} selected={selectedRange} onSelect={setSelectedRange} className="rounded-md border" />
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
                            setIsOpen(false);
                          }}
                          className="text-xs"
                        >
                          Apply
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-xs">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Search Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Search:</span>
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
                  className="h-8 pl-8 pr-8 text-xs bg-background hover:bg-muted/50 border-border/50 w-48 focus:border-primary/50 focus:ring-primary/20"
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
            </div>
          </div>
        </div>
        {/* Results/clear */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">{totalResultsCount} of {totalAllCount} results</div>
          {(statusFilter !== 'all' ||
            addedByFilter !== 'all' ||
            sentToFilter !== 'all' ||
            professionFilter !== 'all' ||
            placementFilter !== 'all' ||
            coordinatorFilter !== 'all' ||
            dateFilter.start ||
            dateFilter.end ||
            searchQuery) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
