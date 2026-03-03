import { Client } from "@stomp/stompjs";

let stompClient = null;

export const connectSocket = (onMessage, token) => {
  // Ngăn tạo nhiều kết nối
  if (stompClient?.active) {
    return;
  }

  stompClient = new Client({
    brokerURL: import.meta.env.VITE_SOCKET_URL,
    
    // Uncomment nếu cần authentication
    // connectHeaders: {
    //   Authorization: `Bearer ${token}`,
    // },
    
    reconnectDelay: 50000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    connectionTimeout: 10000,

    debug: (str) => {
        console.log('STOMP:', str);
      },

    onConnect: () => {
      stompClient.subscribe("/topic/events", (msg) => {
        onMessage(JSON.parse(msg.body));
      });

      stompClient.subscribe("/topic/vehicles", (msg) => {
        onMessage(JSON.parse(msg.body));
      });

      stompClient.subscribe("topic/alerts", (msg) => {
        onMessage(JSON.parse(msg.body));
      });
    },

    onStompError: (frame) => {
      console.error("STOMP error:", frame.headers?.message);
    },

    onWebSocketError: () => {
      console.error("WebSocket connection failed");
    }
  });

  stompClient.activate();
};

export const disconnectSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
};