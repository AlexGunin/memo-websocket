const HOST = window.location.origin.replace(/^http/, 'ws');

export const socket = new WebSocket(HOST);
