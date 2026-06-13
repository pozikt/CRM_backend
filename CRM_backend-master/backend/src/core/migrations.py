from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def _calls_table_needs_migration(engine: Engine) -> bool:
    inspector = inspect(engine)
    if "calls" not in inspector.get_table_names():
        return False
    columns = {column["name"] for column in inspector.get_columns("calls")}
    required_columns = {
        "title",
        "project_id",
        "duration_minutes",
        "result",
        "status",
        "created_at",
        "updated_at",
    }
    return not required_columns.issubset(columns)


def run_migrations(engine: Engine) -> None:
    """Apply lightweight schema updates for databases created before calls/client fields."""
    if not _calls_table_needs_migration(engine):
        return

    with engine.begin() as connection:
        connection.execute(text("DROP TABLE IF EXISTS call_participants CASCADE"))
        connection.execute(text("DROP TABLE IF EXISTS calls CASCADE"))
