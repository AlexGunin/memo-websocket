const HOST = window.location.origin.replace(/^https/, 'ws');

export const socket = new WebSocket(HOST);
