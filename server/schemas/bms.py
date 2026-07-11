"""
Pydantic v2 schemas for all BMS request/response validation.
"""
from __future__ import annotations
from datetime import datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


# ─── Shared response envelope ────────────────────────────────────────────────

class SuccessResponse(BaseModel):
    success: bool = True


class MetaPage(BaseModel):
    total: int
    limit: int
    offset: int


# ─── BatteryReading ──────────────────────────────────────────────────────────

class BatteryReadingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:             int
    timestamp:      datetime
    cell1:          float
    cell2:          float
    cell3:          float
    cell4:          float
    current:        float
    temp1:          float
    temp2:          float
    gas:            float
    batteryHealth:  float
    anomalyScore:   float
    vibration:      float
    status:         str
    relay:          str
    spn:            Optional[int] = None
    fmi:            Optional[int] = None
    activeCells:    int
    soc:            float
    soh:            float
    chargeStatus:   str
    mlOp:           str
    batteryScore:   float
    relayCooling:   str
    relayIsolation: str
    relayCell1:     str
    relayCell2:     str
    relayCell3:     str
    relayCell4:     str


class ReadingHistoryResponse(SuccessResponse):
    data: list[BatteryReadingOut]
    meta: MetaPage


class ReadingStatsField(BaseModel):
    avg: float
    min: float
    max: float


class ReadingStatsData(BaseModel):
    cell1:        ReadingStatsField
    cell2:        ReadingStatsField
    cell3:        ReadingStatsField
    cell4:        ReadingStatsField
    current:      ReadingStatsField
    temp1:        ReadingStatsField
    temp2:        ReadingStatsField
    gas:          ReadingStatsField
    batteryHealth: ReadingStatsField
    anomalyScore: ReadingStatsField


# ─── AnomalyLog ──────────────────────────────────────────────────────────────

class AnomalyLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:           int
    timestamp:    datetime
    anomalyScore: float
    status:       str
    details:      str


class AnomalyTrendPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    timestamp:    datetime
    anomalyScore: float
    status:       str
    batteryHealth: float


class AnomalyDistributionPoint(BaseModel):
    range: str
    count: int


# ─── FaultLog ────────────────────────────────────────────────────────────────

class FaultLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:          int
    timestamp:   datetime
    faultType:   str
    severity:    str
    actionTaken: str
    value:       Optional[str] = None


class FaultSeverityCount(BaseModel):
    name:  str
    value: int


class FaultTypeCount(BaseModel):
    name:  str
    value: int


class FaultSummaryData(BaseModel):
    bySeverity: list[FaultSeverityCount]
    byType:     list[FaultTypeCount]
    total:      int


# ─── System ──────────────────────────────────────────────────────────────────

class SystemHealthData(BaseModel):
    server:    str
    uptime:    int
    db:        str
    dbLatency: str
    timestamp: str
    version:   str


class SystemStatsData(BaseModel):
    totalReadings:  int
    totalFaults:    int
    totalAnomalies: int
    uptime:         int
    latest:         Optional[BatteryReadingOut] = None


class RelayControlRequest(BaseModel):
    relay:  Literal['isolation', 'cooling', 'cell1', 'cell2', 'cell3', 'cell4']
    action: Literal['CONNECT', 'DISCONNECT']


class RelayControlResponse(SuccessResponse):
    message: str
    relay:   str
    action:  str


class DemoScenarioRequest(BaseModel):
    scenario: Literal['normal', 'overtemp', 'imbalance', 'gas']


# ─── Chat ────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role:    str
    content: str


class ChatRequest(BaseModel):
    message:     str
    history:     list[ChatMessage] = Field(default_factory=list)
    contextData: Optional[dict[str, Any]] = None
    isVoice:     bool = False


class InsightRequest(BaseModel):
    data: dict[str, Any]


class SpeechToTextRequest(BaseModel):
    audio:    str          # base64 encoded
    mimeType: str = "audio/webm"

class TextToSpeechRequest(BaseModel):
    text: str
    target_language_code: str = "hi-IN"
