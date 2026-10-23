// Prueba de carga de RNF-02: búsqueda de libros y ranking a través de la API Gateway.
//
//   k6 run tests/carga/busqueda-y-ranking.js
//   k6 run -e BASE_URL=http://<dns-del-alb> tests/carga/busqueda-y-ranking.js
//
// 50 usuarios virtuales durante 1 minuto, con 10 s de subida y 10 s de bajada.
import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TERMINOS = ['garcia', 'borges', 'soledad', 'amor', 'rayuela', 'asturias', 'el', 'de'];

export const options = {
  scenarios: {
    lectura: {
      executor: 'ramping-vus',
      stages: [
        { duration: '10s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    // Objetivo de RNF-02: p95 por debajo de 500 ms y menos de 1 % de errores.
    'http_req_duration{operacion:busqueda}': ['p(95)<500'],
    'http_req_duration{operacion:ranking}': ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  group('búsqueda', () => {
    const termino = TERMINOS[Math.floor(Math.random() * TERMINOS.length)];
    const respuesta = http.get(`${BASE_URL}/api/v1/libros?q=${termino}&limite=20`, {
      tags: { operacion: 'busqueda' },
    });
    check(respuesta, {
      'búsqueda 200': (r) => r.status === 200,
      'búsqueda trae meta': (r) => r.json('meta.total') !== undefined,
    });
  });

  group('ranking', () => {
    const respuesta = http.get(`${BASE_URL}/api/v1/ventas/ranking?limite=10`, {
      tags: { operacion: 'ranking' },
    });
    check(respuesta, { 'ranking 200': (r) => r.status === 200 });
  });

  sleep(1);
}
