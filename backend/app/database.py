from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

# Create the database engine — this is the "connection" to PostgreSQL
engine = create_engine(settings.DATABASE_URL)

# A session is like a conversation with the database.
# Each request to your API gets its own session.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Base class that all your database models will inherit from
class Base(DeclarativeBase):
    pass


def get_db():
    """
    Creates a new database session for each API request,
    and closes it when the request is done.
    This will be used as a FastAPI dependency.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()