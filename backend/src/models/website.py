from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, HttpUrl, Field
from dataclasses import dataclass, field


@dataclass
class WebsiteHistoryEntry:
    response_time: int
    last_checked: datetime = field(default_factory=datetime.now + + timedelta(hours=3))


class WebsiteCheckBase(BaseModel):
    url: HttpUrl
    status: str
    response_time: float
    last_down: str
    last_checked: datetime = Field(default_factory=datetime.now + + timedelta(hours=3))
    is_down: bool = False


class WebsiteCheck(WebsiteCheckBase):
    history: List[WebsiteHistoryEntry] = Field(default_factory=list)
    _id: Optional[str] = None

    def to_dict(self):
        return {
            "url": str(self.url),
            "status": self.status,
            "response_time": self.response_time,
            "last_checked": self.last_checked,
            "is_down": self.is_down,
            "history": [
                {
                    "response_time": entry.response_time,
                    "last_checked": entry.last_checked
                }
                for entry in self.history
            ],
            "last_down": self.last_down
        }

    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            url=data["url"],
            status=data["status"],
            response_time=data["response_time"],
            last_down=data["last_down"],
            last_checked=data["last_checked"],
            is_down=data["is_down"],
            history=data["history"],
            _id=data.get("_id")
        )

class OutageReport(BaseModel):
    name: str
    reportCount: int
