"""
simulator.py — Python port of simulator.js
Generates realistic BMS telemetry for 4 scenarios.
Runs as an asyncio background task emitting socket events every 2 seconds.
"""
import asyncio
import random
import time

# ─── Relay State ──────────────────────────────────────────────────────────────

simulated_relays: dict[str, str] = {
    "cooling":   "DISCONNECTED",
    "isolation": "CONNECTED",
    "cell1":     "CONNECTED",
    "cell2":     "CONNECTED",
    "cell3":     "CONNECTED",
    "cell4":     "CONNECTED",
}

_current_scenario = "normal"
_scenario_reset_task: asyncio.Task | None = None


def set_scenario(scenario: str) -> None:
    global _current_scenario, _scenario_reset_task
    _current_scenario = scenario
    if _scenario_reset_task and not _scenario_reset_task.done():
        _scenario_reset_task.cancel()
    loop = asyncio.get_event_loop()
    _scenario_reset_task = loop.create_task(_auto_reset_scenario())


def get_current_scenario() -> str:
    return _current_scenario


async def _auto_reset_scenario():
    await asyncio.sleep(30)
    global _current_scenario
    _current_scenario = "normal"


def update_simulated_relay(relay: str, action: str) -> None:
    """Called when relay control API is hit."""
    if relay in simulated_relays:
        simulated_relays[relay] = "CONNECTED" if action == "CONNECT" else "DISCONNECTED"


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _clamp(val: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, val))


def _jitter(val: float, amount: float = 0.02) -> float:
    return round(val + (random.random() - 0.5) * amount * 2, 3)


# ─── Core Generator ──────────────────────────────────────────────────────────

def generate_reading() -> dict:
    scenario = _current_scenario

    data = {
        "cell1":          4.01,
        "cell2":          4.02,
        "cell3":          3.98,
        "cell4":          4.00,
        "current":        2.1,
        "temp1":          34.2,
        "temp2":          33.8,
        "gas":            120.0,
        "anomalyScore":   4.0,
        "vibration":      0.5,
        "status":         "Healthy",
        "relay":          "CONNECTED",
        "spn":            0,
        "fmi":            0,
        "activeCells":    4,
        "soc":            94.5,
        "soh":            98.2,
        "chargeStatus":   "Idle",
        "mlOp":           "NORMAL",
        "batteryScore":   96.0,
        "relayCooling":   simulated_relays["cooling"],
        "relayIsolation": simulated_relays["isolation"],
        "relayCell1":     simulated_relays["cell1"],
        "relayCell2":     simulated_relays["cell2"],
        "relayCell3":     simulated_relays["cell3"],
        "relayCell4":     simulated_relays["cell4"],
    }

    if scenario == "overtemp":
        data["temp1"]        = _clamp(_jitter(72, 1.5), 68, 80)
        data["temp2"]        = _clamp(_jitter(68, 1.5), 64, 76)
        data["anomalyScore"] = _clamp(_jitter(78, 3), 70, 90)
        data["status"]       = "Warning"
        data["mlOp"]         = "OVERTEMPERATURE"
        data["spn"]          = 527
        data["fmi"]          = 0
        data["batteryScore"] = 22.0
        data["relayCooling"] = "CONNECTED"

    elif scenario == "imbalance":
        data["cell3"]        = _clamp(_jitter(3.40, 0.05), 3.30, 3.55)
        data["anomalyScore"] = _clamp(_jitter(65, 4), 55, 78)
        data["status"]       = "Warning"
        data["mlOp"]         = "CELL_IMBALANCE"
        data["spn"]          = 523
        data["fmi"]          = 7
        data["batteryScore"] = 35.0
        data["relayCell3"]   = "DISCONNECTED"

    elif scenario == "gas":
        data["gas"]          = _clamp(_jitter(850, 40), 750, 950)
        data["anomalyScore"] = _clamp(_jitter(88, 3), 82, 95)
        data["status"]       = "Critical"
        data["mlOp"]         = "THERMAL_RUNAWAY"
        data["spn"]          = 528
        data["fmi"]          = 0
        data["batteryScore"] = 12.0
        data["relayIsolation"] = "DISCONNECTED"

    else:  # normal
        data["cell1"]   = _jitter(4.01)
        data["cell2"]   = _jitter(4.02)
        data["cell3"]   = _jitter(3.98)
        data["cell4"]   = _jitter(4.00)
        data["current"] = _jitter(2.1, 0.15)
        data["temp1"]   = _jitter(34.2, 0.5)
        data["temp2"]   = _jitter(33.8, 0.5)

    # Derive charge status
    cur = data["current"]
    if cur >= 0.15:
        data["chargeStatus"] = "Charging"
    elif cur <= -0.15:
        data["chargeStatus"] = "Discharging"
    else:
        data["chargeStatus"] = "Idle"

    # Compute battery health
    cells    = [data["cell1"], data["cell2"], data["cell3"], data["cell4"]]
    avg_cell = sum(cells) / 4
    imbalance = max(cells) - min(cells)
    voltage_pct = _clamp(((avg_cell - 3.0) / (4.2 - 3.0)) * 100, 0, 100)
    imbalance_penalty = _clamp(imbalance * 100, 0, 30)
    temp_max = max(data["temp1"], data["temp2"])
    temp_penalty = (temp_max - 50) * 0.5 if temp_max > 50 else 0.0

    data["batteryHealth"] = round(_clamp(voltage_pct - imbalance_penalty - temp_penalty, 0, 100), 1)
    data["soh"]           = data["batteryHealth"]
    data["soc"]           = round(voltage_pct, 1)

    return data
