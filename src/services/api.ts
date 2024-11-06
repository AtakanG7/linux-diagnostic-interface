import axios from 'axios';
import { FileUpdate, LogEntry, NetworkPacket } from '../types/api';

const BASE_URL = 'http://localhost:8080';

export const api = {
  async getFileTree(path = '/', depth = 1) {
    const { data } = await axios.get<FileUpdate[]>(`${BASE_URL}/api/files`, {
      params: { path, depth }
    });
    return data;
  },

  async getLogs(file: string, before?: string, limit = 100) {
    const { data } = await axios.get<LogEntry[]>(`${BASE_URL}/api/logs`, {
      params: { file, before, limit }
    });
    return data;
  },

  async searchLogs(query: string, files: string[], startTime?: string, endTime?: string) {
    const { data } = await axios.post<LogEntry[]>(`${BASE_URL}/api/logs/search`, {
      query,
      files,
      start_time: startTime,
      end_time: endTime
    });
    return data;
  },

  async getNetworkMetrics(start?: string, end?: string, protocol?: string[]) {
    const { data } = await axios.get(`${BASE_URL}/api/network/metrics`, {
      params: { start, end, protocol }
    });
    return data;
  }
};

export const createWebSocket = () => {
  return new WebSocket(`ws://localhost:8080/ws`);
};
