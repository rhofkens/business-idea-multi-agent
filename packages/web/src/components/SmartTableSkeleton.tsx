/**
 * @fileoverview Skeleton loading component for SmartTable
 *
 * This component displays animated placeholders while business idea data is being
 * loaded or generated. It provides visual feedback to users during loading states
 * and supports a special streaming animation for real-time data generation.
 */

import React from 'react';

/**
 * Props interface for SmartTableSkeleton component
 *
 * @interface SmartTableSkeletonProps
 * @property {number} [rows] - Number of skeleton rows to display (default: 5)
 * @property {boolean} [showStreamingRow] - Whether to show a streaming animation row
 *                                          for real-time data generation
 */
interface SmartTableSkeletonProps {
  rows?: number;
  showStreamingRow?: boolean;
}

/**
 * SmartTable skeleton loader component.
 *
 * This component renders a skeleton version of the SmartTable with animated
 * placeholder elements. It mimics the structure of the actual table to provide
 * a seamless loading experience. Features include:
 * - Animated pulse effect on all skeleton elements
 * - Configurable number of skeleton rows
 * - Optional streaming row with bouncing dots animation
 * - Responsive design matching the actual SmartTable
 *
 * @param {SmartTableSkeletonProps} props - Component props
 * @returns {JSX.Element} Skeleton loading UI for SmartTable
 *
 * @example
 * ```typescript
 * // Basic skeleton while loading
 * <SmartTableSkeleton rows={3} />
 *
 * // Skeleton with streaming animation
 * <SmartTableSkeleton
 *   rows={5}
 *   showStreamingRow={true}
 * />
 * ```
 */
export function SmartTableSkeleton({ 
  rows = 5, 
  showStreamingRow = false 
}: SmartTableSkeletonProps) {
  return (
    <div className="w-full">
      {/* Header skeleton */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3">
                <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
              </th>
              <th className="px-6 py-3">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse mx-auto" />
              </th>
              <th className="px-6 py-3">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </th>
              <th className="px-6 py-3">
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              </th>
              <th className="px-6 py-3">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </th>
              <th className="px-6 py-3">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </th>
              <th className="px-6 py-3">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {Array.from({ length: rows }).map((_, index) => (
              <tr key={index} className="animate-pulse">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-8 bg-gray-200 rounded" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="h-5 w-5 bg-gray-200 rounded mx-auto" />
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-full bg-gray-200 rounded" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-gray-200 rounded-full" />
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 w-12 bg-gray-200 rounded-full mx-auto" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="h-4 w-8 bg-gray-200 rounded mx-auto" />
                </td>
              </tr>
            ))}
            
            {/* Streaming row with different animation */}
            {showStreamingRow && (
              <tr className="bg-blue-50">
                <td colSpan={7} className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" 
                         style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" 
                         style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" 
                         style={{ animationDelay: '300ms' }} />
                    <span className="text-sm text-blue-600 ml-2">Generating new ideas...</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SmartTableSkeleton;