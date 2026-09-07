from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

_db_url = get_settings().database_url
_ssl_args: dict[str, str] = {"ssl": "require"} if "supabase" in _db_url else {}

engine = create_async_engine(
    _db_url,
    pool_pre_ping=True,
    connect_args=_ssl_args,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async with AsyncSessionLocal() as session:
        yield session
