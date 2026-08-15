"""Énumérations métier.

Toutes héritent de `str` : sérialisables en JSON et lisibles directement
en base — un SELECT doit rester compréhensible sans table de correspondance.
"""

from enum import Enum


class ProductType(str, Enum):
    """Circuits et excursions partagent la même structure.

    Une seule table pour les deux : même itinéraire, mêmes prestations,
    mêmes tarifs, mêmes médias. Seule la granularité temporelle diffère.
    """

    CIRCUIT = "circuit"
    EXCURSION = "excursion"


class ProductFormat(str, Enum):
    FULL_DAY = "full_day"
    HALF_DAY = "half_day"
    EVENING = "evening"
    MULTI_DAY = "multi_day"


class TransportMode(str, Enum):
    BOAT = "boat"
    VEHICLE = "vehicle"
    PIROGUE = "pirogue"
    MIXED = "mixed"
    WALKING = "walking"


class DifficultyLevel(str, Enum):
    EASY = "easy"
    MODERATE = "moderate"
    SPORTY = "sporty"


class ContentStatus(str, Enum):
    """ARCHIVED plutôt que supprimé : le contenu sort du site mais son
    slug reste réservé, évitant qu'une future page réutilise une URL déjà
    indexée avec un autre contenu."""

    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ReviewStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SPAM = "spam"


class BookingStatus(str, Enum):
    """Machine à états des réservations.

    Les transitions autorisées sont déclarées dans services/booking.py.
    Aucune écriture directe du statut n'est permise ailleurs.
    """

    NEW = "new"
    CONTACTED = "contacted"
    QUOTED = "quoted"
    PENDING_PAYMENT = "pending_payment"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class BookingSource(str, Enum):
    WEBSITE = "website"
    WHATSAPP = "whatsapp"
    PHONE = "phone"
    EMAIL = "email"
    PARTNER = "partner"
    WALK_IN = "walk_in"


class PageSectionType(str, Enum):
    """Blocs composables des pages éditoriales.

    Chaque valeur correspond à un composant React côté Next. Ajouter un
    type impose d'ajouter le composant — seul cas où l'admin nécessite une
    intervention de développement.
    """

    HERO = "hero"
    RICH_TEXT = "rich_text"
    VALUES = "values"
    STORY = "story"
    PILLARS = "pillars"
    STATS = "stats"
    FAQ = "faq"
    GALLERY = "gallery"
    CTA = "cta"
    TESTIMONIALS = "testimonials"
    PRODUCT_GRID = "product_grid"


class MediaKind(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"


class AdminRole(str, Enum):
    """Rôles par ordre décroissant de privilège."""

    OWNER = "owner"
    ADMIN = "admin"
    EDITOR = "editor"
    MODERATOR = "moderator"
    VIEWER = "viewer"


class AuditAction(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    PUBLISH = "publish"
    UNPUBLISH = "unpublish"
    STATUS_CHANGE = "status_change"
    LOGIN = "login"
    LOGIN_FAILED = "login_failed"
