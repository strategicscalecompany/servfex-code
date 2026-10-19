import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star,
  Search,
  Filter,
  EyeOff,
  Eye,
  Trash2,
  AlertCircle,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Review } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const Reviews: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState<string>('ALL');
  const [filterHidden, setFilterHidden] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const [togglingReview, setTogglingReview] = useState<{ id: string; isHidden: boolean } | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', page, filterRating, filterHidden, search],
    queryFn: async () => {
      const params: any = { page, limit: 15 };
      if (filterRating !== 'ALL') params.rating = Number(filterRating);
      if (filterHidden === 'HIDDEN') params.isHidden = true;
      if (filterHidden === 'VISIBLE') params.isHidden = false;
      if (search) params.search = search;
      const res = await apiClient.get<{ success: boolean; data: Review[]; pagination: any }>(
        '/admin/reviews',
        { params }
      );
      return res.data;
    },
  });

  const toggleHideMutation = useMutation({
    mutationFn: async ({ id, isHidden, reason }: { id: string; isHidden: boolean; reason: string }) => {
      if (isHidden) {
        await apiClient.post(`/admin/reviews/${id}/hide`, { reason });
      } else {
        await apiClient.post(`/admin/reviews/${id}/restore`, { reason });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setTogglingReview(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiClient.delete(`/admin/reviews/${id}`, { data: { reason } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setDeletingReview(null);
    },
  });

  const reviews = data?.data || [];
  const pagination = data?.pagination;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Review Moderation & Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor customer reviews, moderate inappropriate content, and maintain quality assurance
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search comments, customer names, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <select
              value={filterHidden}
              onChange={(e) => setFilterHidden(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Visibility</option>
              <option value="VISIBLE">Visible Only</option>
              <option value="HIDDEN">Hidden / Moderated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-200">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-medium text-gray-700">No reviews found</p>
            <p className="text-sm text-gray-400 mt-1">Customer reviews and feedback will appear here</p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className={`bg-white rounded-xl border p-5 transition shadow-sm ${
                rev.isHidden ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    {renderStars(rev.rating)}
                    <span className="font-semibold text-gray-900 text-sm">
                      {rev.customer?.name || 'Customer'}
                    </span>
                    <span className="text-xs text-gray-400">
                      • {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                    {rev.isHidden && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                        <EyeOff className="w-3 h-3" /> Hidden by Super Admin
                      </span>
                    )}
                    {rev.reportCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                        <ShieldAlert className="w-3 h-3" /> {rev.reportCount} reports
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed font-normal">
                    {rev.comment ? `"${rev.comment}"` : <span className="italic text-gray-400">No text comment provided</span>}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-gray-400">Service: </span>
                      <span className="font-medium text-gray-800">{rev.service?.name || 'General Service'}</span>
                    </div>
                    {rev.vendor && (
                      <div>
                        <span className="text-gray-400">Vendor: </span>
                        <span className="font-medium text-gray-800">{rev.vendor.companyName}</span>
                      </div>
                    )}
                    {rev.employee && (
                      <div>
                        <span className="text-gray-400">Technician: </span>
                        <span className="font-medium text-gray-800">{rev.employee.user.name}</span>
                      </div>
                    )}
                    {rev.booking && (
                      <div>
                        <span className="text-gray-400">Booking: </span>
                        <span className="font-mono text-indigo-600 font-semibold">{rev.booking.bookingNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <button
                    onClick={() => setTogglingReview({ id: rev.id, isHidden: !rev.isHidden })}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      rev.isHidden
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    {rev.isHidden ? (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Restore
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Hide Review
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setDeletingReview(rev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total reviews)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Visibility Toggle Reason Modal */}
      <ConfirmModal
        isOpen={!!togglingReview}
        onClose={() => setTogglingReview(null)}
        onConfirm={(reason) => {
          if (togglingReview) {
            toggleHideMutation.mutate({
              id: togglingReview.id,
              isHidden: togglingReview.isHidden,
              reason,
            });
          }
        }}
        title={togglingReview?.isHidden ? 'Hide Review from Public Display' : 'Restore Review to Public Display'}
        message={
          togglingReview?.isHidden
            ? 'Hiding this review will remove it from the mobile app ratings and public display. Please provide a moderation reason.'
            : 'Restoring this review will make it visible to all customers and vendors again.'
        }
        confirmText={togglingReview?.isHidden ? 'Hide Review' : 'Restore Review'}
        requireReason={true}
        danger={togglingReview?.isHidden}
      />

      {/* Delete Review Modal */}
      <ConfirmModal
        isOpen={!!deletingReview}
        onClose={() => setDeletingReview(null)}
        onConfirm={(reason) => {
          if (deletingReview) {
            deleteMutation.mutate({ id: deletingReview.id, reason });
          }
        }}
        title="Permanently Delete Review"
        message="Are you sure you want to permanently delete this review? This action is permanent and recorded in the audit log."
        confirmText="Delete Review"
        requireReason={true}
        danger={true}
      />
    </div>
  );
};
