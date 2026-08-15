"""Envoi d'emails.

⚠ RÈGLE ABSOLUE : un échec d'envoi ne doit JAMAIS faire échouer
l'opération métier. Une réservation enregistrée dont l'email de
confirmation n'est pas parti reste une réservation valide — l'inverse
serait absurde.

Les fonctions d'envoi capturent donc toutes leurs exceptions et se
contentent de journaliser.

Mode console : si SMTP_HOST est vide, l'email s'affiche dans les logs au
lieu d'être envoyé. Permet de développer sans serveur mail.
"""

import logging
import smtplib
from email.message import EmailMessage
from email.utils import formataddr

from src.core.config import settings

logger = logging.getLogger("sakalava.email")


def send(
    *,
    to: str,
    subject: str,
    text_body: str,
    html_body: str | None = None,
    reply_to: str | None = None,
) -> bool:
    """Envoi synchrone. À appeler via BackgroundTasks.

    FastAPI exécute les fonctions SYNCHRONES de BackgroundTasks dans un
    pool de threads : le blocage SMTP ne gèle donc pas la boucle
    d'événements. C'est ce qui nous évite une dépendance async
    supplémentaire.

    Retourne True en cas de succès, False sinon — jamais d'exception.
    """
    if not settings.SMTP_HOST:
        logger.info(
            "\n%s\n[MODE CONSOLE — aucun envoi]\nÀ      : %s\nObjet  : %s\n%s\n%s\n%s",
            "=" * 70, to, subject, "-" * 70, text_body, "=" * 70,
        )
        return True

    try:
        message = EmailMessage()
        message["From"] = formataddr((settings.EMAIL_FROM_NAME, settings.EMAIL_FROM))
        message["To"] = to
        message["Subject"] = subject
        if reply_to:
            message["Reply-To"] = reply_to

        message.set_content(text_body)
        if html_body:
            message.add_alternative(html_body, subtype="html")

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(message)

        logger.info("Email envoyé à %s — %s", to, subject)
        return True

    except Exception:
        # Volontairement large : aucune défaillance mail ne doit remonter.
        logger.exception("Échec d'envoi à %s — %s", to, subject)
        return False
