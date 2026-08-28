"""review: add published_at

Revision ID: 988853a81da1
Revises: cefd48e9696f
Create Date: 2026-08-28 19:46:32.229935

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '988853a81da1'
down_revision: Union[str, Sequence[str], None] = 'cefd48e9696f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'review',
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
    )
    # Les labels de l'enum reviewstatus sont les NOMS des membres, en
    # majuscules (cf. migration initiale) — pas leurs valeurs.
    op.execute(
        "UPDATE review SET published_at = COALESCE(moderated_at, created_at) "
        "WHERE status = 'APPROVED' AND published_at IS NULL"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('review', 'published_at')
