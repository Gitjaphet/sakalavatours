"""Hachage de mots de passe.

argon2 plutôt que bcrypt : lauréat de la Password Hashing Competition,
résistant aux attaques GPU, et sans la limite silencieuse de 72 octets
de bcrypt qui tronque les longs mots de passe sans prévenir.
"""

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

_hasher = PasswordHasher()


def hash_password(plain: str) -> str:
    return _hasher.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        _hasher.verify(hashed, plain)
    except VerifyMismatchError:
        return False
    return True


def needs_rehash(hashed: str) -> bool:
    """True si le hachage utilise des paramètres obsolètes.

    À vérifier à chaque connexion réussie : permet de renforcer
    progressivement les hachages sans demander aux utilisateurs de
    changer de mot de passe.
    """
    return _hasher.check_needs_rehash(hashed)
