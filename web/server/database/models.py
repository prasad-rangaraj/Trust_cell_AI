"""
SQLAlchemy ORM models — direct translation of schema.prisma.
Maps to the EXACT same PostgreSQL tables (no migrations needed).
"""
from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, func
from database.engine import Base


class BatteryReading(Base):
    __tablename__ = "battery_readings"

    id             = Column(Integer, primary_key=True, index=True)
    timestamp      = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    cell1          = Column(Float, nullable=False)
    cell2          = Column(Float, nullable=False)
    cell3          = Column(Float, nullable=False)
    cell4          = Column(Float, nullable=False)
    current        = Column(Float, nullable=False)
    temp1          = Column(Float, default=0.0)
    temp2          = Column(Float, default=0.0)
    gas            = Column(Float, nullable=False)
    batteryHealth  = Column(Float, nullable=False)
    anomalyScore   = Column(Float, nullable=False)
    vibration      = Column(Float, default=0.0)
    status         = Column(String, default="Healthy")
    relay          = Column(String, default="CONNECTED")
    spn            = Column(Integer, nullable=True)
    fmi            = Column(Integer, nullable=True)
    activeCells    = Column(Integer, default=4)
    soc            = Column(Float, default=100.0)
    soh            = Column(Float, default=100.0)
    chargeStatus   = Column(String, default="Idle")
    mlOp           = Column(String, default="NORMAL")
    batteryScore   = Column(Float, default=100.0)
    relayCooling   = Column(String, default="DISCONNECTED")
    relayIsolation = Column(String, default="CONNECTED")
    relayCell1     = Column(String, default="CONNECTED")
    relayCell2     = Column(String, default="CONNECTED")
    relayCell3     = Column(String, default="CONNECTED")
    relayCell4     = Column(String, default="CONNECTED")


class AnomalyLog(Base):
    __tablename__ = "anomaly_logs"

    id           = Column(Integer, primary_key=True, index=True)
    timestamp    = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    anomalyScore = Column(Float, nullable=False)
    status       = Column(String, nullable=False)
    details      = Column(String, nullable=False)


class FaultLog(Base):
    __tablename__ = "fault_logs"

    id          = Column(Integer, primary_key=True, index=True)
    timestamp   = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    faultType   = Column(String, nullable=False)
    severity    = Column(String, nullable=False)
    actionTaken = Column(String, nullable=False)
    value       = Column(String, nullable=True)
