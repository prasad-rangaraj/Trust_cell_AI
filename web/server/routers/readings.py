"""
GET /api/readings — Port of readings.controller.js
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database.engine import get_db
from database.models import BatteryReading
from schemas.bms import (
    BatteryReadingOut, ReadingHistoryResponse, MetaPage,
    ReadingStatsField, ReadingStatsData, SuccessResponse,
)

router = APIRouter(prefix="/readings", tags=["readings"])

STAT_FIELDS = ["cell1", "cell2", "cell3", "cell4", "current",
               "temp1", "temp2", "gas", "batteryHealth", "anomalyScore"]


@router.get("/latest")
def get_latest_reading(db: Session = Depends(get_db)):
    reading = db.query(BatteryReading).order_by(desc(BatteryReading.timestamp)).first()
    return {"success": True, "data": BatteryReadingOut.model_validate(reading) if reading else None}


@router.get("/history", response_model=ReadingHistoryResponse)
def get_reading_history(
    limit:  int = Query(30, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db:     Session = Depends(get_db),
):
    total    = db.query(func.count(BatteryReading.id)).scalar()
    readings = (
        db.query(BatteryReading)
        .order_by(desc(BatteryReading.timestamp))
        .limit(limit).offset(offset).all()
    )
    readings.reverse()  # oldest → newest for charts
    return ReadingHistoryResponse(
        data=[BatteryReadingOut.model_validate(r) for r in readings],
        meta=MetaPage(total=total, limit=limit, offset=offset),
    )


@router.get("/stats")
def get_reading_stats(
    limit: int = Query(100, ge=1, le=500),
    db:    Session = Depends(get_db),
):
    readings = (
        db.query(BatteryReading)
        .order_by(desc(BatteryReading.timestamp))
        .limit(limit).all()
    )
    stats: dict[str, ReadingStatsField] = {}
    for field in STAT_FIELDS:
        vals = [getattr(r, field) for r in readings if getattr(r, field) is not None]
        if not vals:
            stats[field] = ReadingStatsField(avg=0, min=0, max=0)
        else:
            stats[field] = ReadingStatsField(
                avg=round(sum(vals) / len(vals), 3),
                min=round(min(vals), 3),
                max=round(max(vals), 3),
            )
    return {"success": True, "data": stats, "meta": {"count": len(readings)}}
