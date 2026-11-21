import React, { useState, useEffect, useCallback } from 'react';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import {
  LayersIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  SearchIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  HistoryIcon,
  UserIcon,
  ShieldIcon,
  ArrowRightIcon
} from '../../components/Icons';
import landService from '../../services/landService';

const AdminDigitalLandPage = () => {
  // Data states
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    rejectedOrders: 0
  });
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    page: 1,
    limit: 15,
    totalPages: 1
  });

  // Filters & Search
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Loading & Alert states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modals
  const [detailsOrder, setDetailsOrder] = useState(null);
  const [approveConfirmOrder, setApproveConfirmOrder] = useState(null);
  const [rejectOrderModal, setRejectOrderModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev.message === message ? { type: '', message: '' } : prev));
    }, 6000);
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await landService.getAdminOrders({
        page: pagination.page,
        limit: pagination.limit,
        status: activeTab,
        search: searchQuery
      });

      if (res.success && res.data) {
        setOrders(res.data.orders || []);
        if (res.data.dashboardCounts) {
          setCounts(res.data.dashboardCounts);
        }
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch admin land orders.';
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, activeTab, searchQuery]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchTerm.trim());
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    setSearchQuery('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Open Details Modal
  const handleOpenDetails = async (orderId) => {
    try {
      const res = await landService.getAdminOrderById(orderId);
      if (res.success && res.data) {
        setDetailsOrder(res.data);
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Could not load order details.');
    }
  };

  // Execute Approval
  const handleConfirmApprove = async () => {
    if (!approveConfirmOrder || actionLoading) return;
    setActionLoading(true);

    try {
      const res = await landService.approveOrder(approveConfirmOrder.id);
      showToast('success', res.message || `Order #${approveConfirmOrder.id} has been approved successfully!`);
      setApproveConfirmOrder(null);
      if (detailsOrder && detailsOrder.id === approveConfirmOrder.id) {
        setDetailsOrder(null);
      }
      loadOrders();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Approval failed. Please check inventory or retry.';
      showToast('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Rejection
  const handleConfirmReject = async (e) => {
    if (e) e.preventDefault();
    if (!rejectOrderModal || actionLoading) return;

    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      setRejectionError('Please provide a valid rejection reason for the customer.');
      return;
    }

    setActionLoading(true);
    setRejectionError('');

    try {
      const res = await landService.rejectOrder(rejectOrderModal.id, trimmedReason);
      showToast('success', res.message || `Order #${rejectOrderModal.id} has been rejected.`);
      setRejectOrderModal(null);
      setRejectionReason('');
      if (detailsOrder && detailsOrder.id === rejectOrderModal.id) {
        setDetailsOrder(null);
      }
      loadOrders();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Rejection failed. Please try again.';
      setRejectionError(msg);
      showToast('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const formatINR = (val) => {
    const num = parseFloat(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'approved') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10B981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '3px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.4px'
        }}>
          ● APPROVED
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#EF4444',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '3px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.4px'
        }}>
          ● REJECTED
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        background: 'rgba(245, 158, 11, 0.15)',
        color: '#F59E0B',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.4px'
      }}>
        ● PENDING
      </span>
    );
  };

  return (
    <AdminDashboardLayout
      title="Digital Land Management"
      subtitle="Review customer land orders, manage inventory authorizations, and execute approvals"
      onRefresh={loadOrders}
    >
      {/* Toast Feedback Alert */}
      {feedback.message && (
        <div
          className={`auth-alert ${feedback.type === 'error' ? 'error' : 'success'}`}
          style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease-in'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'error' ? <AlertCircleIcon size={18} /> : <CheckCircleIcon size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 0 }}
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. REAL-TIME DASHBOARD COUNTERS                           */}
      {/* ========================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Total Orders */}
        <div className="dashboard-card" style={{ margin: 0, padding: '18px 20px', border: '1px solid #17385D' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#A9BDD7', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Land Orders
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#FFFFFF', marginTop: '6px' }}>
                {counts.totalOrders}
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 168, 255, 0.12)', color: '#00A8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayersIcon size={22} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '10px' }}>
            All-time customer land order submissions
          </div>
        </div>

        {/* Card 2: Pending Approval */}
        <div className="dashboard-card" style={{ margin: 0, padding: '18px 20px', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, #0A1422 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pending Approval
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#F59E0B', marginTop: '6px' }}>
                {counts.pendingOrders}
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HistoryIcon size={22} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#FBBF24', marginTop: '10px' }}>
            Awaiting administrator review & approval
          </div>
        </div>

        {/* Card 3: Approved */}
        <div className="dashboard-card" style={{ margin: 0, padding: '18px 20px', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, #0A1422 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Approved Orders
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#10B981', marginTop: '6px' }}>
                {counts.approvedOrders}
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleIcon size={22} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#6EE7B7', marginTop: '10px' }}>
            Confirmed & credited to customer holdings
          </div>
        </div>

        {/* Card 4: Rejected */}
        <div className="dashboard-card" style={{ margin: 0, padding: '18px 20px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#EF4444', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Rejected Orders
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#EF4444', marginTop: '6px' }}>
                {counts.rejectedOrders}
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XIcon size={22} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#FCA5A5', marginTop: '10px' }}>
            Declined orders with logged audit reason
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. ORDER MANAGEMENT TABS & TOOLBAR                        */}
      {/* ========================================================= */}
      <div className="dashboard-card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap' }}>
            {[
              { id: 'all', label: 'All Orders', count: counts.totalOrders },
              { id: 'pending', label: 'Pending Approval', count: counts.pendingOrders, highlight: true },
              { id: 'approved', label: 'Approved', count: counts.approvedOrders },
              { id: 'rejected', label: 'Rejected', count: counts.rejectedOrders }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive
                      ? 'linear-gradient(135deg, #087BFF, #00A8FF)'
                      : tab.highlight && tab.count > 0
                        ? 'rgba(245, 158, 11, 0.12)'
                        : '#071426',
                    color: isActive
                      ? '#FFFFFF'
                      : tab.highlight && tab.count > 0
                        ? '#F59E0B'
                        : '#A9BDD7',
                    fontSize: '13px',
                    fontWeight: isActive ? '700' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    color: '#FFFFFF',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: '1 1 240px', maxWidth: '380px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#071426', border: '1px solid #17385D', borderRadius: '8px', padding: '0 12px', height: '38px', width: '100%' }}>
              <SearchIcon size={16} style={{ color: '#A9BDD7' }} />
              <input
                type="text"
                placeholder="Search by order ref, user or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', width: '100%', fontSize: '12px', outline: 'none' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}
                >
                  <XIcon size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="auth-button"
              style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '12px', margin: 0 }}
            >
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. ORDERS TABLE                                           */}
      {/* ========================================================= */}
      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#A9BDD7' }}>
            <RefreshCwIcon size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px', color: '#00A8FF' }} />
            <div>Loading digital land orders...</div>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <LayersIcon size={36} style={{ color: '#334155', marginBottom: '12px' }} />
            <h4 style={{ color: '#FFFFFF', fontSize: '16px', margin: '0 0 6px' }}>No Orders Found</h4>
            <p style={{ color: '#A9BDD7', fontSize: '13px', margin: 0 }}>
              {activeTab === 'all'
                ? 'No digital land purchase orders have been placed by customers yet.'
                : `There are currently no orders with status '${activeTab.toUpperCase()}'.`}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#071426', borderBottom: '1px solid #17385D', color: '#A9BDD7', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 16px' }}>Order ID</th>
                  <th style={{ padding: '14px 16px' }}>User Details</th>
                  <th style={{ padding: '14px 16px' }}>Project Name</th>
                  <th style={{ padding: '14px 16px' }}>Quantity</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Price/Unit</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Total Amount</th>
                  <th style={{ padding: '14px 16px' }}>Order Date</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const isPending = String(o.status).toLowerCase() === 'pending';
                  return (
                    <tr
                      key={o.id}
                      style={{
                        borderBottom: '1px solid rgba(23, 56, 93, 0.4)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(22, 119, 255, 0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Order ID & Reference */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: '700', color: '#00A8FF', fontSize: '12px' }}>
                          {o.orderReference}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                          ID: #{o.id}
                        </div>
                      </td>

                      {/* User Name & Email */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#FFFFFF' }}>
                          {o.userName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '1px' }}>
                          {o.userEmail}
                        </div>
                      </td>

                      {/* Project Name & Location */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#FFFFFF' }}>
                          {o.projectName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                          {o.location}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '500' }}>
                        {o.units} {o.unitName}
                      </td>

                      {/* Price Per Unit */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#A9BDD7' }}>
                        {formatINR(o.pricePerUnit)}
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '800', color: '#10B981' }}>
                        {o.formattedTotalAmount || formatINR(o.totalAmount)}
                      </td>

                      {/* Order Date */}
                      <td style={{ padding: '14px 16px', color: '#A9BDD7', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : 'N/A'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        {getStatusBadge(o.status)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* View Details */}
                          <button
                            onClick={() => handleOpenDetails(o.id)}
                            style={{
                              background: '#071426',
                              border: '1px solid #17385D',
                              color: '#00A8FF',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            View Details
                          </button>

                          {/* Approve (Only for Pending) */}
                          {isPending && (
                            <button
                              onClick={() => setApproveConfirmOrder(o)}
                              disabled={actionLoading}
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid #10B981',
                                color: '#10B981',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              Approve
                            </button>
                          )}

                          {/* Reject (Only for Pending) */}
                          {isPending && (
                            <button
                              onClick={() => {
                                setRejectOrderModal(o);
                                setRejectionReason('');
                                setRejectionError('');
                              }}
                              disabled={actionLoading}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid #EF4444',
                                color: '#EF4444',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. MODAL: ORDER DETAILS VIEW                              */}
      {/* ========================================================= */}
      {detailsOrder && (
        <div className="modal-overlay" onClick={() => setDetailsOrder(null)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LayersIcon size={20} style={{ color: '#00A8FF' }} />
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Order Details • #{detailsOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setDetailsOrder(null)}
                style={{ background: 'transparent', border: 'none', color: '#A9BDD7', cursor: 'pointer' }}
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Header Status Card */}
              <div style={{
                background: '#071426',
                border: '1px solid #17385D',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Reference Code
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: '800', color: '#00A8FF', marginTop: '2px' }}>
                    {detailsOrder.orderReference}
                  </div>
                </div>
                <div>{getStatusBadge(detailsOrder.status)}</div>
              </div>

              {/* Grid Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                marginBottom: '16px'
              }}>
                {/* User Info */}
                <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#00A8FF', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Customer Details
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>{detailsOrder.userName}</div>
                  <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '2px' }}>{detailsOrder.userEmail}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>User ID: #{detailsOrder.userId} • Phone: {detailsOrder.userPhone || 'N/A'}</div>
                </div>

                {/* Land Project Info */}
                <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#00A8FF', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Project Information
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>{detailsOrder.projectName}</div>
                  <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '2px' }}>{detailsOrder.location}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Project ID: #{detailsOrder.projectId}</div>
                </div>
              </div>

              {/* Order Financials */}
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '8px', padding: '14px', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#A9BDD7' }}>Requested Quantity:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: '700' }}>{detailsOrder.units} {detailsOrder.unitName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#A9BDD7' }}>Unit Price at Order Time:</span>
                  <span style={{ color: '#FFFFFF' }}>{detailsOrder.formattedPricePerUnit || formatINR(detailsOrder.pricePerUnit)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderTop: '1px dashed #17385D', paddingTop: '8px' }}>
                  <span style={{ color: '#A9BDD7', fontWeight: '600' }}>Total Order Amount:</span>
                  <span style={{ color: '#10B981', fontWeight: '800', fontSize: '16px' }}>{detailsOrder.formattedTotalAmount || formatINR(detailsOrder.totalAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#A9BDD7' }}>Submitted On:</span>
                  <span style={{ color: '#A9BDD7' }}>{detailsOrder.createdAt ? new Date(detailsOrder.createdAt).toLocaleString('en-IN') : 'N/A'}</span>
                </div>
              </div>

              {/* Audit Info (Approved or Rejected) */}
              {detailsOrder.status === 'approved' && (
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '12px 14px', fontSize: '12px', color: '#6EE7B7' }}>
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>✓ Approval Record</div>
                  <div>Approved by Administrator #{detailsOrder.approvedBy || 'Admin'} on {detailsOrder.approvedAt ? new Date(detailsOrder.approvedAt).toLocaleString('en-IN') : 'N/A'}</div>
                </div>
              )}

              {detailsOrder.status === 'rejected' && (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '12px 14px', fontSize: '12px', color: '#FCA5A5' }}>
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>✕ Rejection Record</div>
                  <div>Rejected on {detailsOrder.rejectedAt ? new Date(detailsOrder.rejectedAt).toLocaleString('en-IN') : 'N/A'}</div>
                  <div style={{ marginTop: '4px', color: '#FFFFFF' }}>
                    <strong>Reason:</strong> {detailsOrder.rejectionReason || 'No reason specified'}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setDetailsOrder(null)}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 18px', height: '38px', fontSize: '13px', margin: 0 }}
              >
                Close
              </button>

              {String(detailsOrder.status).toLowerCase() === 'pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setRejectOrderModal(detailsOrder);
                      setRejectionReason('');
                      setRejectionError('');
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #EF4444',
                      color: '#EF4444',
                      padding: '0 16px',
                      height: '38px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Reject Order
                  </button>
                  <button
                    onClick={() => setApproveConfirmOrder(detailsOrder)}
                    style={{
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '0 20px',
                      height: '38px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Approve Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: APPROVE CONFIRMATION                            */}
      {/* ========================================================= */}
      {approveConfirmOrder && (
        <div className="modal-overlay" onClick={() => setApproveConfirmOrder(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircleIcon size={20} style={{ color: '#10B981' }} />
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Confirm Order Approval
                </h3>
              </div>
              <button
                onClick={() => setApproveConfirmOrder(null)}
                disabled={actionLoading}
                style={{ background: 'transparent', border: 'none', color: '#A9BDD7', cursor: 'pointer' }}
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: '#E2E8F0', fontSize: '14px', lineHeight: '1.5', margin: '0 0 16px' }}>
                Are you sure you want to approve this digital land order?
              </p>

              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '14px', fontSize: '13px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#A9BDD7' }}>Order Reference:</span>
                  <span style={{ fontFamily: 'monospace', color: '#00A8FF', fontWeight: '700' }}>{approveConfirmOrder.orderReference}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#A9BDD7' }}>Customer:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: '600' }}>{approveConfirmOrder.userName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#A9BDD7' }}>Project:</span>
                  <span style={{ color: '#FFFFFF' }}>{approveConfirmOrder.projectName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#A9BDD7' }}>Allocating:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: '700' }}>{approveConfirmOrder.units} {approveConfirmOrder.unitName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #17385D', paddingTop: '8px' }}>
                  <span style={{ color: '#A9BDD7', fontWeight: '600' }}>Total Value:</span>
                  <span style={{ color: '#10B981', fontWeight: '800' }}>{approveConfirmOrder.formattedTotalAmount || formatINR(approveConfirmOrder.totalAmount)}</span>
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#6EE7B7', lineHeight: '1.4' }}>
                <strong>Automated Actions on Approval:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  <li>Project available inventory will be deducted by {approveConfirmOrder.units} {approveConfirmOrder.unitName}.</li>
                  <li>Customer's Digital Land Holdings will be created/updated with confirmed ownership.</li>
                  <li>Customer will receive an in-app confirmation notification.</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setApproveConfirmOrder(null)}
                disabled={actionLoading}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', margin: 0 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={actionLoading}
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0 20px',
                  height: '38px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.7 : 1
                }}
              >
                {actionLoading ? 'Approving Order...' : 'Confirm & Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: REJECT CONFIRMATION WITH REASON                 */}
      {/* ========================================================= */}
      {rejectOrderModal && (
        <div className="modal-overlay" onClick={() => setRejectOrderModal(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleConfirmReject}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <XIcon size={20} style={{ color: '#EF4444' }} />
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    Reject Land Order
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectOrderModal(null)}
                  disabled={actionLoading}
                  style={{ background: 'transparent', border: 'none', color: '#A9BDD7', cursor: 'pointer' }}
                >
                  <XIcon size={18} />
                </button>
              </div>

              <div className="modal-body">
                {rejectionError && (
                  <div className="auth-alert error" style={{ marginBottom: '14px' }}>
                    <AlertCircleIcon size={16} />
                    <span>{rejectionError}</span>
                  </div>
                )}

                <p style={{ color: '#E2E8F0', fontSize: '13px', lineHeight: '1.5', margin: '0 0 14px' }}>
                  Please state the reason for rejecting order <strong style={{ color: '#00A8FF' }}>{rejectOrderModal.orderReference}</strong> for customer <strong style={{ color: '#FFFFFF' }}>{rejectOrderModal.userName}</strong>. This explanation will be logged and communicated to the user.
                </p>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Rejection Reason *</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Required</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value);
                      setRejectionError('');
                    }}
                    placeholder="e.g. Incomplete KYC verification, inventory adjustment, or customer order modification request."
                    className="form-input"
                    style={{
                      height: 'auto',
                      padding: '10px 12px',
                      resize: 'vertical',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      background: '#071426',
                      borderColor: rejectionError ? '#EF4444' : '#17385D'
                    }}
                  />
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#FCA5A5', lineHeight: '1.4' }}>
                  ⚠️ Rejected orders cannot be converted into holdings and will be permanently marked as declined.
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRejectOrderModal(null)}
                  disabled={actionLoading}
                  className="auth-button secondary"
                  style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', margin: 0 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectionReason.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '0 20px',
                    height: '38px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: actionLoading || !rejectionReason.trim() ? 'not-allowed' : 'pointer',
                    opacity: actionLoading || !rejectionReason.trim() ? 0.6 : 1
                  }}
                >
                  {actionLoading ? 'Rejecting Order...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
};

export default AdminDigitalLandPage;
