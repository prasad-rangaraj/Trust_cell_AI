// simulator.js
// Simulates STM32 MQTT-style data internally — no broker needed for demo

let currentScenario = 'normal';
let scenarioTimer = null;

// Add simulated relay state
export let simulatedRelays = {
  cooling: 'DISCONNECTED',
  isolation: 'CONNECTED',
  cell1: 'CONNECTED',
  cell2: 'CONNECTED',
  cell3: 'CONNECTED',
  cell4: 'CONNECTED'
};

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

export function updateSimulatedRelay(relay, state) {
  if (simulatedRelays[relay] !== undefined) {
    simulatedRelays[relay] = state === 'CONNECT' ? 'CONNECTED' : 'DISCONNECTED';
  }
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
    
    // Default simulated parameters
    spn: 0,
    fmi: 0,
    activeCells: 4,
    soc: 94.5,
    soh: 98.2,
    chargeStatus: 'Idle',
    mlOp: 'NORMAL',
    batteryScore: 96.0,
    relayCooling: simulatedRelays.cooling,
    relayIsolation: simulatedRelays.isolation,
    relayCell1: simulatedRelays.cell1,
    relayCell2: simulatedRelays.cell2,
    relayCell3: simulatedRelays.cell3,
    relayCell4: simulatedRelays.cell4
  };
  
  let data = { ...base };
  
  // Adjust telemetry based on scenario
  switch (currentScenario) {
    case 'overtemp':
      data.temp1 = clamp(jitter(72, 1.5), 68, 80);
      data.temp2 = clamp(jitter(68, 1.5), 64, 76);
      data.anomalyScore = clamp(jitter(78, 3), 70, 90);
      data.status = 'Warning';
      data.mlOp = 'OVERTEMPERATURE';
      data.spn = 527;
      data.fmi = 0;
      data.batteryScore = 22.0;
      data.relayCooling = 'CONNECTED'; // auto-on in overtemp
      break;
    case 'imbalance':
      data.cell3 = clamp(jitter(3.40, 0.05), 3.30, 3.55);
      data.anomalyScore = clamp(jitter(65, 4), 55, 78);
      data.status = 'Warning';
      data.mlOp = 'CELL_IMBALANCE';
      data.spn = 523;
      data.fmi = 7;
      data.batteryScore = 35.0;
      data.relayCell3 = 'DISCONNECTED'; // auto-isolate imbalanced cell
      break;
    case 'gas':
      data.gas = clamp(jitter(850, 40), 750, 950);
      data.anomalyScore = clamp(jitter(88, 3), 82, 95);
      data.status = 'Critical';
      data.mlOp = 'THERMAL_RUNAWAY';
      data.spn = 528;
      data.fmi = 0;
      data.batteryScore = 12.0;
      data.relayIsolation = 'DISCONNECTED'; // main contractor isolated
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
      break;
  }
  
  // Derive charge status from current direction
  data.chargeStatus = data.current >= 0.15 ? 'Charging' : (data.current <= -0.15 ? 'Discharging' : 'Idle');
  
  // Compute battery health from cells
  const avgCell = (data.cell1 + data.cell2 + data.cell3 + data.cell4) / 4;
  const cellMin = Math.min(data.cell1, data.cell2, data.cell3, data.cell4);
  const cellMax = Math.max(data.cell1, data.cell2, data.cell3, data.cell4);
  const imbalance = cellMax - cellMin;
  const voltagePct = clamp(((avgCell - 3.0) / (4.2 - 3.0)) * 100, 0, 100);
  const imbalancePenalty = clamp(imbalance * 100, 0, 30);
  const tempPenalty = (data.temp1 > 50 || data.temp2 > 50) ? (Math.max(data.temp1, data.temp2) - 50) * 0.5 : 0;
  
  data.batteryHealth = parseFloat(clamp(voltagePct - imbalancePenalty - tempPenalty, 0, 100).toFixed(1));
  data.soh = data.batteryHealth;
  data.soc = parseFloat(voltagePct.toFixed(1));
  
  return data;
}
