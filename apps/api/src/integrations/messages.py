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

# ── Traductions ──────────────────────────────────────────────────────────
# Seuls les messages destinés aux clients sont traduits : les alertes de
# l'agence restent en français. Dictionnaires plutôt que fichiers JSON —
# à ce volume, tout garder dans un seul module reste plus lisible.

_T: dict[str, dict[str, str]] = {
    "fr": {
        "footer_sent_via": "Cet email vous a été envoyé suite à votre demande sur",
        "review_verify_subject": "Confirmez votre avis — Sakalava Tours",
        "review_verify_title": "Confirmez votre avis",
        "review_verify_greeting": "Bonjour {name}, merci pour votre avis. Confirmez votre adresse email pour qu'il soit transmis à notre équipe.",
        "review_verify_cta": "Confirmer mon avis",
        "review_verify_note": "Lien valable 48 heures. Si vous n'êtes pas à l'origine de cet avis, ignorez ce message.",
        "booking_subject": "Votre demande {ref} — Sakalava Tours",
        "booking_title": "Bonjour {name},",
        "booking_received": "Nous avons bien reçu votre demande pour",
        "booking_reference": "Référence",
        "booking_date": "Date souhaitée",
        "booking_pax": "Participants",
        "booking_followup": "Notre équipe revient vers vous <strong>sous 24 heures</strong> avec les disponibilités et un devis détaillé.",
        "booking_followup_text": "Notre équipe revient vers vous sous 24 heures avec les disponibilités et un devis détaillé.",
        "booking_not_confirmed": "Cette demande ne constitue pas encore une réservation ferme.",
        "booking_keep_ref": "Conservez votre référence {ref} pour tout échange avec nous.",
        "booking_signoff": "À très bientôt,\nL'équipe Sakalava Tours",
        "pax_adult": "adulte",
        "pax_adults": "adultes",
        "pax_child": "enfant",
        "pax_children": "enfants",
        "pax_and": "et",
        "date_format": "%d/%m/%Y",
        "quote_open": "« ",
        "quote_close": " »",
    },
    "en": {
        "footer_sent_via": "This email was sent following your request on",
        "review_verify_subject": "Confirm your review — Sakalava Tours",
        "review_verify_title": "Confirm your review",
        "review_verify_greeting": "Hello {name}, thank you for your review. Please confirm your email address so it can be sent to our team.",
        "review_verify_cta": "Confirm my review",
        "review_verify_note": "This link is valid for 48 hours. If you did not submit this review, please ignore this message.",
        "booking_subject": "Your request {ref} — Sakalava Tours",
        "booking_title": "Hello {name},",
        "booking_received": "We have received your request for",
        "booking_reference": "Reference",
        "booking_date": "Requested date",
        "booking_pax": "Travellers",
        "booking_followup": "Our team will get back to you <strong>within 24 hours</strong> with availability and a detailed quote.",
        "booking_followup_text": "Our team will get back to you within 24 hours with availability and a detailed quote.",
        "booking_not_confirmed": "This request is not yet a confirmed booking.",
        "booking_keep_ref": "Please keep your reference {ref} for any correspondence with us.",
        "booking_signoff": "See you soon,\nThe Sakalava Tours team",
        "pax_adult": "adult",
        "pax_adults": "adults",
        "pax_child": "child",
        "pax_children": "children",
        "pax_and": "and",
        "date_format": "%d %b %Y",
        "quote_open": "\"",
        "quote_close": "\"",
    },
    "de": {
        "footer_sent_via": "Diese E-Mail wurde Ihnen nach Ihrer Anfrage gesendet auf",
        "review_verify_subject": "Bestätigen Sie Ihre Bewertung — Sakalava Tours",
        "review_verify_title": "Bestätigen Sie Ihre Bewertung",
        "review_verify_greeting": "Hallo {name}, vielen Dank für Ihre Bewertung. Bitte bestätigen Sie Ihre E-Mail-Adresse, damit sie an unser Team übermittelt wird.",
        "review_verify_cta": "Bewertung bestätigen",
        "review_verify_note": "Dieser Link ist 48 Stunden gültig. Falls Sie diese Bewertung nicht abgegeben haben, ignorieren Sie diese Nachricht.",
        "booking_subject": "Ihre Anfrage {ref} — Sakalava Tours",
        "booking_title": "Hallo {name},",
        "booking_received": "Wir haben Ihre Anfrage erhalten für",
        "booking_reference": "Referenz",
        "booking_date": "Wunschdatum",
        "booking_pax": "Teilnehmer",
        "booking_followup": "Unser Team meldet sich <strong>innerhalb von 24 Stunden</strong> mit Verfügbarkeiten und einem detaillierten Angebot.",
        "booking_followup_text": "Unser Team meldet sich innerhalb von 24 Stunden mit Verfügbarkeiten und einem detaillierten Angebot.",
        "booking_not_confirmed": "Diese Anfrage ist noch keine feste Buchung.",
        "booking_keep_ref": "Bitte bewahren Sie Ihre Referenz {ref} für den weiteren Austausch mit uns auf.",
        "booking_signoff": "Bis bald,\nIhr Sakalava Tours Team",
        "pax_adult": "Erwachsener",
        "pax_adults": "Erwachsene",
        "pax_child": "Kind",
        "pax_children": "Kinder",
        "pax_and": "und",
        "date_format": "%d.%m.%Y",
        "quote_open": "„",
        "quote_close": "“",
    },
    "it": {
        "footer_sent_via": "Questa email ti è stata inviata a seguito della tua richiesta su",
        "review_verify_subject": "Conferma la tua recensione — Sakalava Tours",
        "review_verify_title": "Conferma la tua recensione",
        "review_verify_greeting": "Ciao {name}, grazie per la tua recensione. Conferma il tuo indirizzo email affinché venga trasmessa al nostro team.",
        "review_verify_cta": "Conferma la recensione",
        "review_verify_note": "Link valido 48 ore. Se non sei l'autore di questa recensione, ignora questo messaggio.",
        "booking_subject": "La tua richiesta {ref} — Sakalava Tours",
        "booking_title": "Ciao {name},",
        "booking_received": "Abbiamo ricevuto la tua richiesta per",
        "booking_reference": "Riferimento",
        "booking_date": "Data richiesta",
        "booking_pax": "Partecipanti",
        "booking_followup": "Il nostro team ti risponderà <strong>entro 24 ore</strong> con le disponibilità e un preventivo dettagliato.",
        "booking_followup_text": "Il nostro team ti risponderà entro 24 ore con le disponibilità e un preventivo dettagliato.",
        "booking_not_confirmed": "Questa richiesta non costituisce ancora una prenotazione confermata.",
        "booking_keep_ref": "Conserva il tuo riferimento {ref} per ogni comunicazione con noi.",
        "booking_signoff": "A presto,\nIl team Sakalava Tours",
        "pax_adult": "adulto",
        "pax_adults": "adulti",
        "pax_child": "bambino",
        "pax_children": "bambini",
        "pax_and": "e",
        "date_format": "%d/%m/%Y",
        "quote_open": "«",
        "quote_close": "»",
    },
}

from src.models.booking import Booking


def _t(locale: str, key: str) -> str:
    """Traduit une clé, avec repli sur le français.

    Le repli couvre deux cas : une locale non supportée (le champ n'est
    pas validé à la saisie) et une clé oubliée dans une traduction.
    """
    return _T.get(locale, _T["fr"]).get(key, _T["fr"][key])



def _wrap_html(title: str, body_html: str, locale: str = "fr") -> str:
    """Gabarit HTML minimal.

    Styles en ligne obligatoires : la plupart des clients mail ignorent
    les feuilles de style externes, et Gmail supprime les balises <style>.
    """
    return f"""<!DOCTYPE html>
<html lang="{locale}">
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
            {_t(locale, "footer_sent_via")} {settings.PUBLIC_SITE_URL.split("//")[-1]}
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
    locale = booking.preferred_locale
    subject = _t(locale, "booking_subject").format(ref=booking.reference)

    adult_word = _t(locale, "pax_adults" if booking.adults > 1 else "pax_adult")
    pax = f"{booking.adults} {adult_word}"
    if booking.children:
        child_word = _t(locale, "pax_children" if booking.children > 1 else "pax_child")
        pax += f" {_t(locale, 'pax_and')} {booking.children} {child_word}"

    date_str = booking.requested_date.strftime(_t(locale, "date_format"))

    text = f"""{_t(locale, "booking_title").format(name=booking.customer_name)}

{_t(locale, "booking_received")} {_t(locale, "quote_open")}{booking.product_title}{_t(locale, "quote_close")}.

  {_t(locale, "booking_reference")} : {booking.reference}
  {_t(locale, "booking_date")} : {date_str}
  {_t(locale, "booking_pax")} : {pax}

{_t(locale, "booking_followup_text")}
{_t(locale, "booking_not_confirmed")}

{_t(locale, "booking_keep_ref").format(ref=booking.reference)}

{_t(locale, "booking_signoff")}
"""

    html = _wrap_html(
        _t(locale, "booking_title").format(name=booking.customer_name),
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
          {_t(locale, "booking_followup")}
        </p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#888;">
          {_t(locale, "booking_not_confirmed")}
        </p>
        """,
        locale,
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
    subject = _t(locale, "review_verify_subject")

    greeting = _t(locale, "review_verify_greeting").format(name=author_name)

    text = f"""{greeting}

{url}

{_t(locale, "review_verify_note")}

Sakalava Tours
"""

    html_greeting = _t(locale, "review_verify_greeting").format(
        name=f"<strong>{author_name}</strong>"
    )

    html = _wrap_html(
        _t(locale, "review_verify_title"),
        f"""
        <p style="margin:0 0 20px;font-size:15px;color:#444;">
          {html_greeting}
        </p>
        <a href="{url}"
           style="display:inline-block;background:#1d4e5f;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">
          {_t(locale, "review_verify_cta")}
        </a>
        <p style="margin:20px 0 0;font-size:13px;color:#888;">
          {_t(locale, "review_verify_note")}
        </p>
        """,
        locale,
    )

    return subject, text, html




def contact_alert_to_agency(
    name: str,
    email: str,
    phone: str | None,
    subject_line: str | None,
    message: str,
    contact_id,
) -> tuple[str, str, str]:
    """Notification d'un message reçu via le formulaire de contact.

    Reprend l'intégralité du message : l'agence doit pouvoir répondre
    depuis sa boîte sans ouvrir l'administration.
    """
    label = subject_line or "Sans objet"
    subject = f"[Contact] {label} — {name}"

    text = f"""NOUVEAU MESSAGE DE CONTACT

De      : {name}
Email   : {email}
Téléphone : {phone or "non renseigné"}
Objet   : {label}

{message}

Répondre directement à {email}
Suivi : {settings.ADMIN_BASE_URL}/messages/{contact_id}
"""

    html = _wrap_html(
        "Nouveau message de contact",
        f"""
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#FDFAF6;border-radius:12px;padding:16px;margin:0 0 20px;">
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">De</td>
              <td style="padding:6px 12px;font-size:14px;color:#2B2620;font-weight:600;">{name}</td></tr>
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">Email</td>
              <td style="padding:6px 12px;font-size:14px;"><a href="mailto:{email}" style="color:#1d4e5f;">{email}</a></td></tr>
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">Téléphone</td>
              <td style="padding:6px 12px;font-size:14px;color:#2B2620;">{phone or "non renseigné"}</td></tr>
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">Objet</td>
              <td style="padding:6px 12px;font-size:14px;color:#2B2620;">{label}</td></tr>
        </table>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#444;white-space:pre-wrap;">{message}</p>
        <a href="mailto:{email}"
           style="display:inline-block;background:#1d4e5f;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">
          Répondre à {name}
        </a>
        """,
    )

    return subject, text, html