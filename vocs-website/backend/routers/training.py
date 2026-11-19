"""
routers/training.py
-------------------
E-Nose Training Sessions Data Collection CRUD endpoints:
- POST /api/training/sessions
- PATCH /api/training/sessions/{session_id}/end
- GET /api/training/sessions
- PATCH /api/training/sessions/{session_id}
- DELETE /api/training/sessions/{session_id}
"""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


class SessionCreate(BaseModel):
    box_id: str
    label: str
    note: Optional[str] = None
    target_ppm: Optional[float] = None
    liquid_volume: Optional[float] = None
    volume_unit: Optional[str] = None
    chamber_volume_l: Optional[float] = None


class SessionUpdate(BaseModel):
    label: Optional[str] = None
    note: Optional[str] = None
    target_ppm: Optional[float] = None
    liquid_volume: Optional[float] = None
    volume_unit: Optional[str] = None
    chamber_volume_l: Optional[float] = None


def create_training_router(*, get_pool) -> APIRouter:
    router = APIRouter(tags=["Training Sessions"])

    @router.post("/api/training/sessions")
    async def create_session(body: SessionCreate):
        pool = await get_pool()
        row = await pool.fetchrow(
            """
            INSERT INTO training_sessions
            (box_id, label, note, target_ppm, liquid_volume, volume_unit, chamber_volume_l)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, label, started_at, target_ppm, liquid_volume, volume_unit, chamber_volume_l
            """,
            body.box_id,
            body.label.upper(),
            body.note,
            body.target_ppm,
            body.liquid_volume,
            body.volume_unit,
            body.chamber_volume_l,
        )
        return {
            "session_id": row["id"],
            "label": row["label"],
            "started_at": str(row["started_at"]),
            "target_ppm": float(row["target_ppm"]) if row["target_ppm"] is not None else None,
            "liquid_volume": float(row["liquid_volume"]) if row["liquid_volume"] is not None else None,
            "volume_unit": row["volume_unit"],
            "chamber_volume_l": float(row["chamber_volume_l"]) if row["chamber_volume_l"] is not None else None,
        }

    @router.patch("/api/training/sessions/{session_id}/end")
    async def end_session(session_id: int):
        pool = await get_pool()
        row = await pool.fetchrow(
            "UPDATE training_sessions SET ended_at = NOW() WHERE id = $1 RETURNING id, label, started_at, ended_at",
            session_id,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Session not found")
        count = await pool.fetchval(
            "SELECT COUNT(*) FROM sensor_readings WHERE session_id = $1", session_id
        )
        return {
            "session_id": row["id"],
            "label": row["label"],
            "started_at": str(row["started_at"]),
            "ended_at": str(row["ended_at"]),
            "total_readings": count,
        }

    @router.get("/api/training/sessions")
    async def list_sessions():
        pool = await get_pool()
        rows = await pool.fetch(
            """
            SELECT ts.id, ts.box_id, ts.label, ts.note, ts.started_at, ts.ended_at,
                   ts.target_ppm, ts.liquid_volume, ts.volume_unit, ts.chamber_volume_l,
                   COUNT(sr.id) AS reading_count
            FROM training_sessions ts
            LEFT JOIN sensor_readings sr ON sr.session_id = ts.id
            GROUP BY ts.id ORDER BY ts.started_at DESC
            """
        )
        return [
            {
                **dict(r),
                "target_ppm": float(r["target_ppm"]) if r["target_ppm"] is not None else None,
                "liquid_volume": float(r["liquid_volume"]) if r["liquid_volume"] is not None else None,
                "chamber_volume_l": float(r["chamber_volume_l"]) if r["chamber_volume_l"] is not None else None,
            }
            for r in rows
        ]

    @router.patch("/api/training/sessions/{session_id}")
    async def update_session(session_id: int, body: SessionUpdate):
        """แก้ไข label หรือ note ของ training session"""
        pool = await get_pool()
        updates = {}
        if body.label is not None:
            updates["label"] = body.label.upper()
        if body.note is not None:
            updates["note"] = body.note
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        set_clause = ", ".join(f"{k} = ${i + 2}" for i, k in enumerate(updates.keys()))
        values = [session_id] + list(updates.values())
        row = await pool.fetchrow(
            f"UPDATE training_sessions SET {set_clause} WHERE id = $1 RETURNING id, label, note",
            *values,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Session not found")
        return dict(row)

    @router.delete("/api/training/sessions/{session_id}")
    async def delete_session(session_id: int):
        """ลบ session และ readings ที่อยู่ใน session นั้น"""
        pool = await get_pool()
        await pool.execute(
            "UPDATE sensor_readings SET session_id = NULL WHERE session_id = $1", session_id
        )
        row = await pool.fetchrow(
            "DELETE FROM training_sessions WHERE id = $1 RETURNING id", session_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"detail": "deleted", "session_id": session_id}

    return router
