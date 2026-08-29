"""Contenu des emails.

⚠ FRANÇAIS UNIQUEMENT pour l'instant.

Traduire les emails en 4 langues est faisable, mais ça multiplie par
quatre le contenu à relire et à maintenir. Mieux vaut trois emails
français corrects que douze approximatifs. `preferred_locale` est déjà
stocké sur la réservation : le jour où tu ajoutes les traductions, rien
ne change côté modèle.

⚠ Les engagements écrits ici (délai de réponse) doivent correspondre à ce
qu'annonce le site et à ce que l'agence peut tenir.
"""

from src.core.config import settings
from src.models.booking import Booking


def _wrap_html(title: str, body_html: str) -> str:
    """Gabarit HTML minimal.

    Styles en ligne obligatoires : la plupart des clients mail ignorent
    les feuilles de style externes, et Gmail supprime les balises <style>.
    """
    return f"""<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#FDFAF6;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FDFAF6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#1d4e5f;padding:24px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">Sakalava Tours</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Visitez les trésors de Madagascar autrement</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 20px;font-size:20px;color:#2B2620;">{title}</h1>
          {body_html}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#FDFAF6;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#888;">
            Sakalava Tours &middot; Nosy Be, Madagascar<br>
            Cet email vous a été envoyé suite à votre demande sur sakalavatours.com
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def booking_confirmation_to_customer(booking: Booking) -> tuple[str, str, str]:
    """Accusé de réception envoyé au voyageur.

    Ne confirme PAS la réservation : elle reste à traiter par l'agence.
    Le vocabulaire doit rester prudent — « demande enregistrée », jamais
    « réservation confirmée ».
    """
    subject = f"Votre demande {booking.reference} — Sakalava Tours"

    pax = f"{booking.adults} adulte{'s' if booking.adults > 1 else ''}"
    if booking.children:
        pax += f" et {booking.children} enfant{'s' if booking.children > 1 else ''}"

    date_str = booking.requested_date.strftime("%d/%m/%Y")

    text = f"""Bonjour {booking.customer_name},

Nous avons bien reçu votre demande pour « {booking.product_title} ».

  Référence  : {booking.reference}
  Date       : {date_str}
  Participants : {pax}

Notre équipe revient vers vous sous 24 heures avec les disponibilités et
un devis détaillé. Cette demande ne constitue pas encore une réservation
ferme.

Conservez votre référence {booking.reference} pour tout échange avec nous.

À très bientôt,
L'équipe Sakalava Tours
"""

    html = _wrap_html(
        f"Bonjour {booking.customer_name},",
        f"""
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">
          Nous avons bien reçu votre demande pour
          <strong>{booking.product_title}</strong>.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#FDFAF6;border-radius:12px;padding:16px;margin:0 0 20px;">
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">Référence</td>
              <td style="padding:6px 12px;font-size:14px;color:#1d4e5f;font-weight:700;">{booking.reference}</td></tr>
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">Date souhaitée</td>
              <td style="padding:6px 12px;font-size:14px;color:#2B2620;">{date_str}</td></tr>
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">Participants</td>
              <td style="padding:6px 12px;font-size:14px;color:#2B2620;">{pax}</td></tr>
        </table>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">
          Notre équipe revient vers vous <strong>sous 24 heures</strong> avec les
          disponibilités et un devis détaillé.
        </p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#888;">
          Cette demande ne constitue pas encore une réservation ferme.
        </p>
        """,
    )

    return subject, text, html


def booking_alert_to_agency(booking: Booking) -> tuple[str, str, str]:
    """Notification interne.

    L'email le plus important du système : c'est lui qui déclenche le
    traitement. S'il ne part pas, la demande dort en base et le client
    n'a jamais de réponse.
    """
    subject = f"[Nouvelle demande] {booking.reference} — {booking.product_title}"

    pax = f"{booking.adults} adultes, {booking.children} enfants"
    date_str = booking.requested_date.strftime("%d/%m/%Y")
    alt = booking.alternative_date.strftime("%d/%m/%Y") if booking.alternative_date else "—"
    origin = booking.utm_source or booking.referrer_url or "direct"

    text = f"""NOUVELLE DEMANDE DE RÉSERVATION

Référence   : {booking.reference}
Produit     : {booking.product_title}
Date        : {date_str}   (alternative : {alt})
Participants: {pax}
Montant est.: {booking.total_amount} {booking.currency}

CLIENT
Nom         : {booking.customer_name}
Email       : {booking.customer_email}
Téléphone   : {booking.customer_phone or '—'}
Pays        : {booking.customer_country or '—'}
Hôtel       : {booking.hotel_name or '—'}
Langue      : {booking.preferred_locale}

MESSAGE
{booking.customer_message or '(aucun)'}

PROVENANCE  : {origin}
Campagne    : {booking.utm_campaign or '—'}

Traiter : {settings.ADMIN_BASE_URL}/bookings/{booking.id}
"""

    html = _wrap_html(
        f"Nouvelle demande — {booking.reference}",
        f"""
        <p style="margin:0 0 16px;font-size:15px;color:#444;">
          <strong>{booking.product_title}</strong> — {date_str} — {pax}
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#FDFAF6;border-radius:12px;padding:16px;margin:0 0 20px;">
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">Client</td>
              <td style="padding:6px 12px;font-size:14px;color:#2B2620;">{booking.customer_name}</td></tr>
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">Email</td>
              <td style="padding:6px 12px;font-size:14px;"><a href="mailto:{booking.customer_email}" style="color:#1d4e5f;">{booking.customer_email}</a></td></tr>
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">Téléphone</td>
              <td style="padding:6px 12px;font-size:14px;color:#2B2620;">{booking.customer_phone or '—'}</td></tr>
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">Hôtel</td>
              <td style="padding:6px 12px;font-size:14px;color:#2B2620;">{booking.hotel_name or '—'}</td></tr>
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">Provenance</td>
              <td style="padding:6px 12px;font-size:14px;color:#2B2620;">{origin}</td></tr>
        </table>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#444;background:#fff8f0;border-left:3px solid #F4A261;padding:12px 16px;">
          {booking.customer_message or '<em style="color:#999;">Aucun message</em>'}
        </p>
        <a href="{settings.ADMIN_BASE_URL}/bookings/{booking.id}"
           style="display:inline-block;background:#E76F51;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">
          Traiter la demande
        </a>
        """,
    )

    return subject, text, html


def review_alert_to_agency(author_name: str, rating: int, product_title: str, review_id) -> tuple[str, str, str]:
    """Notification d'un avis en attente de modération."""
    stars = "★" * rating + "☆" * (5 - rating)
    subject = f"[Avis à modérer] {stars} — {author_name}"

    text = f"""NOUVEL AVIS EN ATTENTE

Auteur  : {author_name}
Note    : {rating}/5
Produit : {product_title}

Modérer : {settings.ADMIN_BASE_URL}/reviews/{review_id}
"""

    html = _wrap_html(
        "Nouvel avis en attente",
        f"""
        <p style="margin:0 0 8px;font-size:24px;color:#F4A261;">{stars}</p>
        <p style="margin:0 0 20px;font-size:15px;color:#444;">
          <strong>{author_name}</strong> a déposé un avis sur {product_title}.
        </p>
        <a href="{settings.ADMIN_BASE_URL}/reviews/{review_id}"
           style="display:inline-block;background:#1d4e5f;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">
          Modérer
        </a>
        """,
    )

    return subject, text, html


def review_email_verification(
    author_name: str, token: str, locale: str
) -> tuple[str, str, str]:
    """Demande de confirmation d'adresse au déposant d'un avis.

    Le lien pointe vers le site public, dans la langue de l'avis — pas
    vers l'API : le visiteur doit atterrir sur une page du site, pas sur
    une réponse JSON.
    """
    url = f"{settings.PUBLIC_SITE_URL}/{locale}/avis/confirmation?token={token}"
    subject = "Confirmez votre avis — Sakalava Tours"

    text = f"""Bonjour {author_name},

Merci pour votre avis. Confirmez votre adresse email pour qu'il soit
transmis à notre équipe :

{url}

Ce lien est valable 48 heures. Si vous n'êtes pas à l'origine de cet
avis, ignorez ce message.

Sakalava Tours
"""

    html = _wrap_html(
        "Confirmez votre avis",
        f"""
        <p style="margin:0 0 20px;font-size:15px;color:#444;">
          Bonjour <strong>{author_name}</strong>, merci pour votre avis.
          Confirmez votre adresse email pour qu'il soit transmis à notre équipe.
        </p>
        <a href="{url}"
           style="display:inline-block;background:#1d4e5f;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">
          Confirmer mon avis
        </a>
        <p style="margin:20px 0 0;font-size:13px;color:#888;">
          Lien valable 48 heures. Si vous n'êtes pas à l'origine de cet avis,
          ignorez ce message.
        </p>
        """,
    )

    return subject, text, html
