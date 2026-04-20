"""Announcement endpoints for public display and teacher/admin management."""

from datetime import date
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from ..database import announcements_collection, teachers_collection

router = APIRouter(
    prefix="/announcements",
    tags=["announcements"]
)


def _parse_iso_date(value: Optional[str], field_name: str, required: bool = False) -> Optional[date]:
    """Parse YYYY-MM-DD values and return a date object."""
    if value is None or value == "":
        if required:
            raise HTTPException(
                status_code=400,
                detail=f"{field_name} is required and must use YYYY-MM-DD format"
            )
        return None

    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must use YYYY-MM-DD format"
        ) from error


def _validate_manager(teacher_username: Optional[str]) -> Dict[str, Any]:
    """Ensure user exists and is allowed to manage announcements."""
    if not teacher_username:
        raise HTTPException(status_code=401, detail="Authentication required")

    teacher = teachers_collection.find_one({"_id": teacher_username})
    if not teacher:
        raise HTTPException(status_code=401, detail="Invalid teacher credentials")

    return teacher


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
def get_announcements(
    include_expired: bool = False,
    teacher_username: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Return announcements sorted by expiration date.

    By default this only returns currently active announcements.
    """
    query: Dict[str, Any] = {}
    today_iso = date.today().isoformat()

    if include_expired:
        _validate_manager(teacher_username)
    else:
        query = {
            "$and": [
                {
                    "$or": [
                        {"start_date": None},
                        {"start_date": ""},
                        {"start_date": {"$lte": today_iso}}
                    ]
                },
                {"expiration_date": {"$gte": today_iso}}
            ]
        }

    records = announcements_collection.find(query).sort("expiration_date", 1)
    results: List[Dict[str, Any]] = []

    for item in records:
        results.append(
            {
                "id": item.get("_id"),
                "message": item.get("message", ""),
                "start_date": item.get("start_date"),
                "expiration_date": item.get("expiration_date")
            }
        )

    return results


@router.post("", response_model=Dict[str, Any])
def create_announcement(
    message: str,
    expiration_date: str,
    start_date: Optional[str] = None,
    teacher_username: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new announcement."""
    _validate_manager(teacher_username)

    trimmed_message = (message or "").strip()
    if not trimmed_message:
        raise HTTPException(status_code=400, detail="message is required")

    parsed_start = _parse_iso_date(start_date, "start_date", required=False)
    parsed_expiration = _parse_iso_date(expiration_date, "expiration_date", required=True)

    if parsed_start and parsed_start > parsed_expiration:
        raise HTTPException(status_code=400, detail="start_date cannot be later than expiration_date")

    generated_id = str(uuid4())
    new_doc = {
        "_id": generated_id,
        "message": trimmed_message,
        "start_date": parsed_start.isoformat() if parsed_start else None,
        "expiration_date": parsed_expiration.isoformat()
    }

    announcements_collection.insert_one(new_doc)

    return {
        "id": generated_id,
        "message": "Announcement created successfully"
    }


@router.put("/{announcement_id}", response_model=Dict[str, Any])
def update_announcement(
    announcement_id: str,
    message: str,
    expiration_date: str,
    start_date: Optional[str] = None,
    teacher_username: Optional[str] = None
) -> Dict[str, Any]:
    """Update an existing announcement."""
    _validate_manager(teacher_username)

    trimmed_message = (message or "").strip()
    if not trimmed_message:
        raise HTTPException(status_code=400, detail="message is required")

    parsed_start = _parse_iso_date(start_date, "start_date", required=False)
    parsed_expiration = _parse_iso_date(expiration_date, "expiration_date", required=True)

    if parsed_start and parsed_start > parsed_expiration:
        raise HTTPException(status_code=400, detail="start_date cannot be later than expiration_date")

    result = announcements_collection.update_one(
        {"_id": announcement_id},
        {
            "$set": {
                "message": trimmed_message,
                "start_date": parsed_start.isoformat() if parsed_start else None,
                "expiration_date": parsed_expiration.isoformat()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")

    return {"message": "Announcement updated successfully"}


@router.delete("/{announcement_id}", response_model=Dict[str, Any])
def delete_announcement(
    announcement_id: str,
    teacher_username: Optional[str] = None
) -> Dict[str, Any]:
    """Delete an announcement."""
    _validate_manager(teacher_username)

    result = announcements_collection.delete_one({"_id": announcement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")

    return {"message": "Announcement deleted successfully"}
