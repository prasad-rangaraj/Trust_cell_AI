"""
GET /api/anomalies — Port of anomalies.controller.js
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database.engine import get_db
from database.models import AnomalyLog, BatteryReading
from schemas.bms import AnomalyLogOut, AnomalyTrendPoint, AnomalyDistributionPoint, MetaPage

router = APIRouter(prefix="/anomalies", tags=["anomalies"])


@router.get("")
def get_anomalies(
    limit:  int     = Query(20, ge=1, le=100),
    offset: int     = Query(0, ge=0),
    db:     Session = Depends(get_db),
):
    total     = db.query(func.count(AnomalyLog.id)).scalar()
    anomalies = (
        db.query(AnomalyLog)
        .order_by(desc(AnomalyLog.timestamp))
        .limit(limit).offset(offset).all()
    )
    return {
        "success": True,
        "data":    [AnomalyLogOut.model_validate(a) for a in anomalies],
        "meta":    MetaPage(total=total, limit=limit, offset=offset),
    }


@router.get("/trend")
def get_anomaly_trend(
    limit: int     = Query(50, ge=1, le=200),
    db:    Session = Depends(get_db),
):
    readings = (
        db.query(
            BatteryReading.timestamp,
            BatteryReading.anomalyScore,
            BatteryReading.status,
            BatteryReading.batteryHealth,
        )
        .order_by(desc(BatteryReading.timestamp))
        .limit(limit).all()
    )
    readings = list(reversed(readings))  # oldest → newest
    data = [
        AnomalyTrendPoint(
            timestamp=r.timestamp,
            anomalyScore=r.anomalyScore,
            status=r.status,
            batteryHealth=r.batteryHealth,
        )
        for r in readings
    ]
    return {"success": True, "data": data}


@router.get("/distribution")
def get_anomaly_distribution(db: Session = Depends(get_db)):
    readings = (
        db.query(BatteryReading.anomalyScore)
        .order_by(desc(BatteryReading.timestamp))
        .limit(500).all()
    )
    buckets = {"0-10": 0, "10-25": 0, "25-50": 0, "50-75": 0, "75-100": 0}
    for (score,) in readings:
        if score < 10:       buckets["0-10"]   += 1
        elif score < 25:     buckets["10-25"]  += 1
        elif score < 50:     buckets["25-50"]  += 1
        elif score < 75:     buckets["50-75"]  += 1
        else:                buckets["75-100"] += 1

    return {
        "success": True,
        "data":    [AnomalyDistributionPoint(range=k, count=v) for k, v in buckets.items()],
        "meta":    {"total": len(readings)},
    }
