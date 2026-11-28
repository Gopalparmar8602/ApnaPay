import api from './api';

const mpinService = {
  getStatus: async () => {
    const res = await api.get('/mpin/status');
    return res.data;
  },

  setMpin: async (mpin, confirmMpin) => {
    const res = await api.post('/mpin/set', { mpin, confirmMpin });
    return res.data;
  },

  verifyMpin: async (mpin) => {
    const res = await api.post('/mpin/verify', { mpin });
    return res.data;
  },

  changeMpin: async (currentMpin, newMpin, confirmMpin) => {
    const res = await api.post('/mpin/change', { currentMpin, newMpin, confirmMpin });
    return res.data;
  },

  forgotMpin: async () => {
    const res = await api.post('/mpin/forgot');
    return res.data;
  },

  resetMpin: async (otp, newMpin, confirmMpin) => {
    const res = await api.post('/mpin/reset', { otp, newMpin, confirmMpin });
    return res.data;
  }
};

export default mpinService;
