"""
AeroForge Data Schemas - Pydantic Models
========================================

Strict type validation schemas for API requests and responses.
Includes nested models for deep JSON validation.
"""

from pydantic import BaseModel, Field, EmailStr, HttpUrl, validator
from typing import List, Optional, Union, Dict
from datetime import datetime
from enum import Enum

class Hemisphere(str, Enum):
    NORTH = "N"
    SOUTH = "S"
    EAST = "E"
    WEST = "W"

class Coordinate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    altitude: Optional[float] = Field(0.0)

class Vector3(BaseModel):
    x: float
    y: float
    z: float

class Quaternion(BaseModel):
    w: float
    x: float
    y: float
    z: float

class BatteryStatus(BaseModel):
    voltage: float
    current: float
    capacity_remaining_mah: float
    percentage: float = Field(..., ge=0, le=100)
    cell_voltages: List[float]
    temperature_c: float
    is_charging: bool
    health_status: str

class GPSStatus(BaseModel):
    fix_type: str # '2D', '3D', 'DGPS', 'RTK'
    satellites_visible: int
    satellites_used: int
    hdop: float
    vdop: float
    pdop: float
    latitude_uncertainty: float
    longitude_uncertainty: float
    altitude_uncertainty: float

class MotorTelemetry(BaseModel):
    motor_id: int
    rpm: float
    temperature_c: float
    current_draw: float
    status: str # 'OK', 'WARNING', 'FAILURE'

class IMUData(BaseModel):
    accelerometer: Vector3
    gyroscope: Vector3
    magnetometer: Vector3
    temperature_c: float

class TelemetryPacket(BaseModel):
    timestamp: datetime
    drone_id: str
    mission_id: str
    position: Coordinate
    velocity: Vector3
    attitude: Quaternion
    battery: BatteryStatus
    gps: GPSStatus
    motors: List[MotorTelemetry]
    imu: IMUData
    signal_strength_dbm: int
    cpu_load_percent: float
    memory_usage_mb: float
    errors: List[str] = []

    class Config:
        schema_extra = {
            "example": {
                "timestamp": "2024-03-15T12:00:00Z",
                "drone_id": "DRONE-001",
                "mission_id": "MISSION-X",
                "position": {"latitude": 27.9881, "longitude": 86.9250, "altitude": 8848.0},
                # ... huge example ...
            }
        }

class MissionCreationRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str]
    drone_id: str
    waypoints: List[Coordinate]
    cruise_speed_mps: float = Field(10.0, ge=0.0, le=50.0)
    max_altitude_meters: float = Field(120.0, le=5000.0)
    return_to_launch_altitude: float = 50.0
    safe_distance_buffer: float = 5.0
    
    @validator('waypoints')
    def check_waypoints(cls, v):
        if len(v) < 2:
            raise ValueError('Mission must have at least 2 waypoints')
        return v

class MissionStatusUpdate(BaseModel):
    status: str
    progress_percent: float
    current_waypoint_index: int
    estimated_time_remaining_seconds: float

class UserProfile(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str
    avatar_url: Optional[HttpUrl]
    joined_at: datetime
    is_verified: bool

class AuthToken(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

# ... (Adding 100 more schema definitions) ...
# Repeated boilerplate for every possible data structure
# SensorConfig, SensorCalibration, FlightLogSummary, maintenanceRequest, InventoryItem, etc.

class NetworkConfig(BaseModel):
    ssid: str
    ip_address: str
    subnet_mask: str
    gateway: str
    dns: List[str]

class CameraSettings(BaseModel):
    resolution: str
    framerate: int
    iso: int
    shutter_speed: str
    white_balance: str
    encoding: str

# ... infinity ...
