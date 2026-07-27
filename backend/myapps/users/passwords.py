import logging

import bcrypt
from django.contrib.auth.hashers import check_password as django_check_password
from django.contrib.auth.hashers import make_password

logger = logging.getLogger(__name__)

_BCRYPT_PREFIXES = ("$2a$", "$2b$", "$2y$")


def verify_password(raw_password: str, encoded: str) -> bool:
    if not encoded:
        return False
    if encoded.startswith(_BCRYPT_PREFIXES):
        try:
            return bcrypt.checkpw(raw_password.encode(), encoded.encode())
        except ValueError:
            return False
    if "$" in encoded:
        return django_check_password(raw_password, encoded)



    if raw_password == encoded:
        logger.warning("Plaintext password comparison matched - this account should be rehashed.")
        return True
    return False


def needs_rehash(encoded: str) -> bool:
    return not encoded.startswith("pbkdf2_sha256$")


def hash_password(raw_password: str) -> str:
    return make_password(raw_password)
