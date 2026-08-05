from __future__ import annotations

import logging
from typing import Any

from aiobotocore.session import get_session

from app.core.config import Settings

logger = logging.getLogger(__name__)


class StorageError(Exception):
    pass


class StorageService:
    def __init__(self, settings: Settings) -> None:
        self.bucket = settings.storage_bucket
        self.endpoint = settings.storage_endpoint
        self.region = settings.storage_region
        self.access_key = settings.storage_access_key
        self.secret_key = settings.storage_secret_key.get_secret_value() if settings.storage_secret_key else None

        self._session = get_session()

    def _get_client_kwargs(self) -> dict[str, Any]:
        kwargs: dict[str, Any] = {
            "service_name": "s3",
            "region_name": self.region,
        }
        if self.endpoint:
            kwargs["endpoint_url"] = self.endpoint
        if self.access_key and self.secret_key:
            kwargs["aws_access_key_id"] = self.access_key
            kwargs["aws_secret_access_key"] = self.secret_key
        return kwargs

    async def generate_presigned_put_url(
        self, object_key: str, mime_type: str, expires_in_seconds: int = 900
    ) -> str:
        """
        Generate a short-lived presigned PUT URL for uploading objects directly to S3/MinIO.
        """
        client_kwargs = self._get_client_kwargs()
        try:
            async with self._session.create_client(**client_kwargs) as client:
                url = await client.generate_presigned_url(
                    "put_object",
                    Params={
                        "Bucket": self.bucket,
                        "Key": object_key,
                        "ContentType": mime_type,
                    },
                    ExpiresIn=expires_in_seconds,
                )
                return url
        except Exception as exc:
            logger.error("Failed to generate presigned URL: %s", exc)
            raise StorageError("Could not generate presigned upload URL") from exc

    async def object_exists(self, object_key: str) -> bool:
        """
        Verify that an object exists in the bucket.
        """
        client_kwargs = self._get_client_kwargs()
        try:
            async with self._session.create_client(**client_kwargs) as client:
                await client.head_object(Bucket=self.bucket, Key=object_key)
                return True
        except Exception:
            return False
