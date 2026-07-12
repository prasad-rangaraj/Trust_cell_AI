"""
GET /api/faults — Port of faults.controller.js
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database.engine import get_db
from database.models import FaultLog
from schemas.bms import FaultLogOut, MetaPage, FaultSummaryData, FaultSeverityCount, FaultTypeCount

router = APIRouter(prefix="/faults", tags=["faults"])


@router.get("")
def get_faults(
    limit:    int           = Query(20, ge=1, le=100),
    offset:   int           = Query(0, ge=0),
    severity: str | None    = Query(None),
    type:     str | None    = Query(None),
    db:       Session       = Depends(get_db),
):
    q = db.query(FaultLog)
    if severity:
        q = q.filter(FaultLog.severity == severity)
    if type:
        q = q.filter(FaultLog.faultType.ilike(f"%{type}%"))

    total  = q.with_entities(func.count(FaultLog.id)).scalar()
    faults = q.order_by(desc(FaultLog.timestamp)).limit(limit).offset(offset).all()

    return {
        "success": True,
        "data":    [FaultLogOut.model_validate(f) for f in faults],
        "meta":    MetaPage(total=total, limit=limit, offset=offset),
    }


@router.get("/summary")
def get_fault_summary(db: Session = Depends(get_db)):
    faults = db.query(FaultLog.severity, FaultLog.faultType).all()

    by_severity: dict[str, int] = {"Healthy": 0, "Warning": 0, "Critical": 0}
    by_type:     dict[str, int] = {}

    for severity, fault_type in faults:
        by_severity[severity] = by_severity.get(severity, 0) + 1
        by_type[fault_type]   = by_type.get(fault_type, 0) + 1

    return {
        "success": True,
        "data": FaultSummaryData(
            bySeverity=[FaultSeverityCount(name=k, value=v) for k, v in by_severity.items()],
            byType=[FaultTypeCount(name=k, value=v) for k, v in by_type.items()],
            total=len(faults),
        ),
    }


@router.delete("")
def clear_faults(db: Session = Depends(get_db)):
    count = db.query(FaultLog).delete()
    db.commit()
    return {"success": True, "message": f"Cleared {count} fault records"}
