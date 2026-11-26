import api from './api';

const walletService = {
  // 1. GET /api/wallet - Full Wallet Overview
  getOverview: async () => {
    const response = await api.get('/wallet');
    return response.data;
  },

  // 2. GET /api/wallet/balance - Quick Balance Check
  getBalance: async () => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  // 3. GET /api/wallet/ledger - Paginated Ledger Entries (Debits & Credits)
  getLedger: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.type && params.type !== 'all') cleanParams.type = params.type;
    if (params.startDate) cleanParams.startDate = params.startDate;
    if (params.endDate) cleanParams.endDate = params.endDate;
    if (params.sort) cleanParams.sort = params.sort;

    const response = await api.get('/wallet/ledger', { params: cleanParams });
    return response.data;
  },

  // 4. GET /api/wallet/summary - Financial Metrics & Periodic Flow
  getSummary: async (period = 'all') => {
    const response = await api.get('/wallet/summary', {
      params: period && period !== 'all' ? { period } : {}
    });
    return response.data;
  },

  // 5. GET /api/wallet/limits - KYC Tier & Dynamic Transaction Limits
  getLimits: async () => {
    const response = await api.get('/wallet/limits');
    return response.data;
  },

  // 6. POST /api/wallet/add-money - Add funds to wallet (Instant top-up)
  addMoney: async (amount, paymentMethod = 'UPI', extra = {}) => {
    const response = await api.post('/wallet/add-money', {
      amount,
      paymentMethod,
      ...extra
    });
    return response.data;
  },

  // 7. POST /api/wallet/withdraw - Withdraw funds to linked bank
  withdraw: async (amount, bankName = 'Linked Bank Account', extra = {}) => {
    const response = await api.post('/wallet/withdraw', {
      amount,
      bankName,
      ...extra
    });
    return response.data;
  },

  // 8. POST /api/wallet/transfer - Wallet-to-wallet transfer
  transfer: async ({ recipient, amount, note = '' }) => {
    const response = await api.post('/wallet/transfer', {
      recipient,
      amount,
      note
    });
    return response.data;
  },

  // 9. POST /api/wallet/link-bank - Quick link bank from Wallet Withdraw
  quickLinkBank: async ({ bankName, ifscPrefix }) => {
    const response = await api.post('/wallet/link-bank', {
      bankName,
      ifscPrefix
    });
    return response.data;
  }
};

export default walletService;

