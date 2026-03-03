import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100,          // 1000 user cùng lúc
  duration: '15s',    // bắn liên tục 30s
};

export default function () {
  const payload = JSON.stringify({
    eventType: "PLATE",
    identifier: "29A-12345",   // CỐ Ý trùng
    detectedAt: "2026-01-28T17:20:00",
    imageUrl: "http://img.com/1.jpg",
    metadata: { speed: 60 }
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  let res = http.post('http://localhost:8091/camera/events/test-event', payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
