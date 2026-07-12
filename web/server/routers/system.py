"""
GET/POST /api/system — Port of system.controller.js
Relay control, health check, stats, and CSV export.
"""
import io
import csv
import time
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, text

from database.engine import get_db
from database.models import BatteryReading, FaultLog, AnomalyLog
from schemas.bms import (
    BatteryReadingOut, SystemHealthData, SystemStatsData,
    RelayControlRequest, RelayControlResponse,
    DemoScenarioRequest,
)
import simulator

router = APIRouter(prefix="/system", tags=["system"])

# Module-level reference to the MQTT client — injected by main.py at startup
_mqtt_client = None

def set_mqtt_client(client) -> None:
    global _mqtt_client
    _mqtt_client = client


@router.get("/health")
def get_system_health(db: Session = Depends(get_db)):
    db_status  = "connected"
    db_latency = 0
    try:
        t0 = time.monotonic()
        db.execute(text("SELECT 1"))
        db_latency = int((time.monotonic() - t0) * 1000)
    except Exception:
        db_status = "disconnected"

    return {
        "success": True,
        "data": SystemHealthData(
            server="online",
            uptime=int(time.time() - _start_time),
            db=db_status,
            dbLatency=f"{db_latency}ms",
            timestamp=datetime.utcnow().isoformat() + "Z",
            version="2.0.0",
        ),
    }


@router.get("/stats")
def get_system_stats(db: Session = Depends(get_db)):
    total_readings  = db.query(func.count(BatteryReading.id)).scalar()
    total_faults    = db.query(func.count(FaultLog.id)).scalar()
    total_anomalies = db.query(func.count(AnomalyLog.id)).scalar()
    latest          = db.query(BatteryReading).order_by(desc(BatteryReading.timestamp)).first()

    return {
        "success": True,
        "data": SystemStatsData(
            totalReadings=total_readings,
            totalFaults=total_faults,
            totalAnomalies=total_anomalies,
            uptime=int(time.time() - _start_time),
            latest=BatteryReadingOut.model_validate(latest) if latest else None,
        ),
    }


@router.get("/export")
def export_data(
    format: str = Query("json"),
    limit:  int = Query(100, ge=1, le=1000),
    db:     Session = Depends(get_db),
):
    readings = (
        db.query(BatteryReading)
        .order_by(desc(BatteryReading.timestamp))
        .limit(limit).all()
    )
    readings.reverse()

    if format == "csv":
        headers = [
            "timestamp", "cell1", "cell2", "cell3", "cell4",
            "current", "temp1", "temp2", "gas", "batteryHealth",
            "anomalyScore", "status", "relay",
        ]
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        for r in readings:
            writer.writerow([getattr(r, h, "") for h in headers])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="bms_export_{int(time.time())}.csv"'},
        )

    return {
        "success": True,
        "data":    [BatteryReadingOut.model_validate(r) for r in readings],
        "meta":    {"count": len(readings), "format": format},
    }


@router.post("/relay", response_model=RelayControlResponse)
def control_relay(body: RelayControlRequest):
    relay_code = body.relay.upper()
    state_code = "ON" if body.action == "CONNECT" else "OFF"
    command    = f"RELAY:{relay_code}:{state_code}"

    # Update in-memory simulator state
    simulator.update_simulated_relay(body.relay, body.action)

    # Publish to real hardware via MQTT if connected
    if _mqtt_client and _mqtt_client.is_connected():
        _mqtt_client.publish("battery/control", command, qos=1)
        print(f"[RELAY] MQTT publish → battery/control | {command}")
    else:
        print(f"[RELAY] MQTT not connected — command NOT dispatched: {command}")

    return RelayControlResponse(
        message=f"Relay command dispatched: {command}",
        relay=body.relay,
        action=body.action,
    )


@router.post("/demo")
def set_demo_scenario(body: DemoScenarioRequest):
    simulator.set_scenario(body.scenario)
    return {"success": True, "scenario": body.scenario}


# ─── Uptime tracking ─────────────────────────────────────────────────────────
_start_time = time.time()
