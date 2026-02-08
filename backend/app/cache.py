import json
import redis
from app.config import settings

try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
    REDIS_AVAILABLE = True
except (redis.ConnectionError, redis.RedisError):
    redis_client = None
    REDIS_AVAILABLE = False

DEFAULT_TTL = 300


def get_cache(key: str):
    if not REDIS_AVAILABLE:
        return None
    try:
        data = redis_client.get(key)
        if data:
            return json.loads(data)
        return None
    except (redis.RedisError, json.JSONDecodeError):
        return None


def set_cache(key: str, value: dict, ttl: int = DEFAULT_TTL):
    if not REDIS_AVAILABLE:
        return
    try:
        redis_client.setex(key, ttl, json.dumps(value))
    except redis.RedisError:
        pass


def delete_cache_pattern(pattern: str):
    if not REDIS_AVAILABLE:
        return
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
    except redis.RedisError:
        pass