from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey
from sqlalchemy.sql import func
from config.database import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("profiles.id"))
    destination = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    budget = Column(Numeric, nullable=True)
    status = Column(String, server_default='draft')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())