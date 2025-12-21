"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  return (
    <div className="flex gap-2">
      <Input
        type="date"
        placeholder="Data início"
        value={startDate ? startDate.toISOString().split('T')[0] : ''}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null, endDate)}
      />
      <Input
        type="date"
        placeholder="Data fim"
        value={endDate ? endDate.toISOString().split('T')[0] : ''}
        onChange={(e) => onChange(startDate, e.target.value ? new Date(e.target.value) : null)}
      />
    </div>
  );
}