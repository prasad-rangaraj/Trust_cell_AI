// simulator.js
// Simulates STM32 MQTT-style data internally — no broker needed for demo

let currentScenario = 'normal';
let scenarioTimer = null;

export function setScenario(scenario) {
  currentScenario = scenario;
  if (scenarioTimer) clearTimeout(scenarioTimer);
  // Auto-reset to normal after 30 seconds
  scenarioTimer = setTimeout(() => {
    currentScenario = 'normal';
  }, 30000);
}

export function getCurrentScenario() {
  return currentScenario;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function jitter(val, amount = 0.02) {
  return parseFloat((val + (Math.random() - 0.5) * amount * 2).toFixed(3));
}

export function generateReading() {
  const base = {
    cell1: 4.01,
    cell2: 4.02,
    cell3: 3.98,
    cell4: 4.00,
    current: 2.1,
    temp1: 34.2,
    temp2: 33.8,
    gas: 120,
    anomalyScore: 4,
    vibration: 0.5,
    status: 'Healthy',
    relay: 'CONNECTED',
  };

  let data = { ...base };

  switch (currentScenario) {
    case 'overtemp':
      data.temp1 = clamp(jitter(72, 1.5), 68, 80);
      data.temp2 = clamp(jitter(68, 1.5), 64, 76);
      data.anomalyScore = clamp(jitter(78, 3), 70, 90);
      data.vibration = clamp(jitter(1.2, 0.2), 0.8, 2.0);
      data.status = 'Warning';
      data.gas = clamp(jitter(340, 20), 280, 400);
      break;

    case 'imbalance':
      data.cell3 = clamp(jitter(3.40, 0.05), 3.30, 3.55);
      data.anomalyScore = clamp(jitter(65, 4), 55, 78);
      data.vibration = clamp(jitter(0.6, 0.1), 0.4, 0.8);
      data.status = 'Warning';
      break;

    case 'gas':
      data.gas = clamp(jitter(850, 40), 750, 950);
      data.temp1 = clamp(jitter(58, 2), 52, 65);
      data.temp2 = clamp(jitter(55, 2), 50, 62);
      data.anomalyScore = clamp(jitter(88, 3), 82, 95);
      data.vibration = clamp(jitter(3.2, 0.5), 2.5, 4.5);
      data.status = 'Critical';
      data.relay = 'DISCONNECTED';
      break;

    case 'normal':
    default:
      data.cell1 = jitter(4.01);
      data.cell2 = jitter(4.02);
      data.cell3 = jitter(3.98);
      data.cell4 = jitter(4.00);
      data.current = jitter(2.1, 0.15);
      data.temp1 = jitter(34.2, 0.5);
      data.temp2 = jitter(33.8, 0.5);
      data.gas = clamp(jitter(120, 5), 100, 145);
      data.anomalyScore = clamp(jitter(4, 0.5), 2, 8);
      data.vibration = clamp(jitter(0.5, 0.05), 0.3, 0.7);
      break;
  }

  // Compute battery health from cell voltages
  const avgCell = (data.cell1 + data.cell2 + data.cell3 + data.cell4) / 4;
  const cellMin = Math.min(data.cell1, data.cell2, data.cell3, data.cell4);
  const cellMax = Math.max(data.cell1, data.cell2, data.cell3, data.cell4);
  const imbalance = cellMax - cellMin;
  const voltagePct = clamp(((avgCell - 3.0) / (4.2 - 3.0)) * 100, 0, 100);
  const imbalancePenalty = clamp(imbalance * 100, 0, 30);
  const tempPenalty = (data.temp1 > 50 || data.temp2 > 50) ? (Math.max(data.temp1, data.temp2) - 50) * 0.5 : 0;
  data.batteryHealth = parseFloat(
    clamp(voltagePct - imbalancePenalty - tempPenalty, 0, 100).toFixed(1)
  );

  return data;
}
