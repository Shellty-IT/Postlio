import asyncio
import os
import ssl
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv()


async def check_tables():
    url = os.getenv('DATABASE_URL')

    if not url:
        print("❌ Brak DATABASE_URL w .env!")
        return

    # Usuń parametry query z URL
    clean_url = url.split('?')[0]

    # SSL dla Neon
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE

    print(f"🔗 Łączę z bazą...")

    engine = create_async_engine(clean_url, connect_args={'ssl': ssl_ctx})

    async with engine.connect() as conn:
        # Sprawdź tabele
        result = await conn.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """))
        tables = result.fetchall()

        print(f"\n📋 Tabele w bazie ({len(tables)}):")
        for t in tables:
            print(f"   ✓ {t[0]}")

        # Sprawdź tabelę alembic_version
        result = await conn.execute(text("""
            SELECT EXISTS (SELECT
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'alembic_version')
        """))
        has_alembic = result.scalar()

        if has_alembic:
            result = await conn.execute(text("SELECT version_num FROM alembic_version"))
            versions = result.fetchall()
            print(f"\n📌 Alembic version:")
            for v in versions:
                print(f"   → {v[0]}")
        else:
            print(f"\n⚠️ Brak tabeli alembic_version (migracje nigdy nie były uruchomione przez Alembic)")

    await engine.dispose()
    print(f"\n✅ Gotowe!")


if __name__ == "__main__":
    asyncio.run(check_tables())