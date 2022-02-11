let HOST = window.location.origin.replace(/^http/, 'ws');
HOST = HOST.replace(/:\d{3,5}/gi, '');
export const socket = new WebSocket(`${HOST}:8080`);
