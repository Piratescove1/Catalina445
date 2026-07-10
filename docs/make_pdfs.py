"""Generate the Catalina 445 user PDFs (Quick Start + User Guide).

Run:  python docs/make_pdfs.py
Outputs: docs/Catalina445-QuickStart.pdf, docs/Catalina445-UserGuide.pdf

Print-friendly (white background, navy headings, brass accents). Avoids emoji /
special glyphs, which the built-in PDF fonts can't render.
"""
import os
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, ListFlowable,
    ListItem, HRFlowable, PageBreak,
)

NAVY = HexColor("#0B1929")
NAVY2 = HexColor("#13324f")
BRASS = HexColor("#B8860B")
INK = HexColor("#1a2733")
HERE = os.path.dirname(os.path.abspath(__file__))

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Title"], textColor=NAVY, fontSize=22, spaceAfter=2, alignment=0)
SUB = ParagraphStyle("SUB", parent=styles["Normal"], textColor=BRASS, fontSize=10.5, spaceAfter=10, leading=14)
SEC = ParagraphStyle("SEC", parent=styles["Heading2"], textColor=NAVY, fontSize=13, spaceBefore=12, spaceAfter=4)
BODY = ParagraphStyle("BODY", parent=styles["Normal"], textColor=INK, fontSize=10.5, leading=15, spaceAfter=6)
STEP = ParagraphStyle("STEP", parent=BODY, leftIndent=2)
CALL = ParagraphStyle("CALL", parent=styles["Normal"], textColor=white, fontSize=10.5, leading=15)
WARNCALL = ParagraphStyle("WARNCALL", parent=styles["Normal"], textColor=HexColor("#5b3d00"), fontSize=10.5, leading=15)


def callout(text, bg=NAVY2, style=CALL):
    t = Table([[Paragraph(text, style)]], colWidths=[6.5 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    return t


def warn(text):
    return callout(text, bg=HexColor("#ffe8bf"), style=WARNCALL)


def bullets(items):
    return ListFlowable(
        [ListItem(Paragraph(i, BODY), leftIndent=14, value="•") for i in items],
        bulletType="bullet", start="•", leftIndent=12,
    )


def header(title, subtitle):
    return [Paragraph(title, H1), Paragraph(subtitle, SUB),
            HRFlowable(width="100%", thickness=2, color=BRASS, spaceAfter=10)]


# ---------------------------------------------------------------- Quick Start
def build_quickstart():
    doc = SimpleDocTemplate(os.path.join(HERE, "Catalina445-QuickStart.pdf"),
                            pagesize=LETTER, topMargin=0.6 * inch, bottomMargin=0.6 * inch,
                            leftMargin=0.9 * inch, rightMargin=0.9 * inch, title="Catalina 445 - Quick Start")
    s = []
    s += header("Catalina 445 App", "Quick Start &mdash; set everything up at the dock")
    s.append(callout("<b>Set up every device while you still have wifi or cell signal.</b> "
                     "Offshore the app keeps working, but you can't create an account or add a "
                     "new device without a connection."))
    s.append(Spacer(1, 10))

    s.append(Paragraph("1.  Open the app", SEC))
    s.append(Paragraph("Open the app link in your browser. Tip: Share &rarr; <b>Add to Home Screen</b> "
                       "so it opens like a real app.", BODY))

    s.append(Paragraph("2.  Create your account", SEC))
    s.append(Paragraph("Tap <b>Create account</b>, choose a username and password (6+ characters). "
                       "Your existing boat data loads automatically.", BODY))
    s.append(warn("<b>IMPORTANT &mdash; write down the RECOVERY CODE</b> shown right after signup and keep "
                  "it somewhere safe that is not only on the phone. It is the <b>only</b> way back in if "
                  "you forget your password."))

    s.append(Spacer(1, 6))
    s.append(Paragraph("3.  Turn on Face ID (optional)", SEC))
    s.append(Paragraph("Gear icon &rarr; <b>Face ID / fingerprint unlock &rarr; Turn on</b>. "
                       "Then you can unlock with a glance instead of typing.", BODY))

    s.append(Paragraph("4.  Set up other devices (before you leave)", SEC))
    s.append(Paragraph("On each phone or tablet, open the app and log in. Devices on the same boat "
                       "share the same data.", BODY))

    s.append(Paragraph("5.  Make a backup", SEC))
    s.append(Paragraph("Gear icon &rarr; <b>Download Full Backup (JSON)</b> and save it somewhere safe. "
                       "Do this before big trips.", BODY))

    s.append(Spacer(1, 12))
    s.append(HRFlowable(width="100%", thickness=1, color=HexColor("#c9d3dc"), spaceAfter=8))
    s.append(Paragraph("Everyday use", SEC))
    s.append(bullets([
        "<b>Ship's Stores / Provisions</b> &mdash; track what's aboard and build shopping lists.",
        "<b>Voyage Log</b> &mdash; start a voyage; tap the GPS button to fill lat/long or type them; edit the date/time to backdate an entry.",
        "<b>Maintenance</b> &mdash; record work done and plan future projects.",
        "<b>Ditch Bag</b> &mdash; your abandon-ship checklist.",
    ]))
    s.append(Spacer(1, 6))
    s.append(Paragraph("<b>Forgot your password?</b> Login screen &rarr; Forgot password? &rarr; enter "
                       "username + recovery code &rarr; set a new password.", BODY))
    s.append(Paragraph("<b>It works offline.</b> Changes sync to your other devices and the cloud "
                       "automatically the next time you have signal.", BODY))
    doc.build(s)


# ---------------------------------------------------------------- User Guide
def build_userguide():
    doc = SimpleDocTemplate(os.path.join(HERE, "Catalina445-UserGuide.pdf"),
                            pagesize=LETTER, topMargin=0.7 * inch, bottomMargin=0.7 * inch,
                            leftMargin=0.9 * inch, rightMargin=0.9 * inch, title="Catalina 445 - User Guide")
    s = []
    s += header("Catalina 445 App", "User Guide")
    s.append(Paragraph("Run your boat's inventory, voyages, maintenance, provisioning, and "
                       "abandon-ship checklist &mdash; on deck or offshore.", BODY))
    s.append(Spacer(1, 6))
    s.append(callout("<b>Set up your account and every device while you have wifi or cell signal.</b> "
                     "Offshore the app works fully, but creating an account or adding a brand-new device "
                     "needs a connection."))

    s.append(Paragraph("Getting started", SEC))
    s.append(Paragraph("The first time you open the app you create an account (username + password). "
                       "This holds your boat's data and syncs it across your devices. For the best "
                       "experience, use Share &rarr; Add to Home Screen.", BODY))
    s.append(warn("<b>Save your recovery code.</b> Right after signup the app shows a one-time recovery "
                  "code. Store it somewhere safe that isn't only on the phone &mdash; it's the only way to "
                  "regain access if you forget your password."))

    s.append(Paragraph("Logging in &amp; Face ID", SEC))
    s.append(Paragraph("After setup, opening the app asks for your password. Turn on Face ID / fingerprint "
                       "unlock in the gear (Settings) menu to unlock with a glance; your data stays "
                       "encrypted and your password always works as a fallback.", BODY))

    s.append(Paragraph("The five sections", SEC))
    s.append(bullets([
        "<b>Ship's Stores</b> &mdash; track everything aboard by compartment/locker; adjust quantities as you use them; label lockers.",
        "<b>Voyage Log</b> &mdash; start a voyage, log entries with position and conditions. Tap the GPS button to fill latitude/longitude, or type them. Date &amp; time default to now &mdash; tap Edit to backdate a forgotten entry. Record COG/SOG/AWA/AWS and notes, and export a voyage to PDF.",
        "<b>Maintenance</b> &mdash; log work done (who, when, notes) and plan future projects with parts lists.",
        "<b>Provisions</b> &mdash; build lists by category, check off what you have, and generate shopping lists.",
        "<b>Ditch Bag</b> &mdash; your abandon-ship checklist and standard procedure.",
    ]))

    s.append(Paragraph("Offline &amp; syncing", SEC))
    s.append(Paragraph("Everything works offline. When you're back in range, changes sync automatically "
                       "to your other devices and the cloud. All devices logged into the same boat share "
                       "the same data.", BODY))

    s.append(Paragraph("Backups", SEC))
    s.append(bullets([
        "<b>Download Full Backup (JSON)</b> &mdash; a complete backup you can keep and re-import later. Do this before big trips.",
        "<b>Download Excel Backup</b> &mdash; a readable spreadsheet of your data.",
        "<b>Cloud Backups</b> &mdash; automatic timestamped snapshots you can restore from.",
    ]))

    s.append(Paragraph("Security", SEC))
    s.append(bullets([
        "Your data is encrypted on each device with your password, so a lost or stolen phone doesn't expose it.",
        "In the cloud, your data can't be listed or discovered by others.",
        "Keep your recovery code somewhere safe and separate from the phone.",
    ]))

    s.append(Paragraph("Troubleshooting", SEC))
    s.append(bullets([
        "<b>Forgot password</b> &mdash; Login screen &rarr; Forgot password? &rarr; username + recovery code &rarr; new password.",
        "<b>App didn't update</b> &mdash; reload normally (pull to refresh / reopen). Never use \"Clear Website Data\" &mdash; it erases local data.",
        "<b>Other device not syncing</b> &mdash; make sure both have signal and reload each.",
        "<b>Add a device</b> &mdash; do it with signal: open the app on the new device and log in.",
    ]))
    doc.build(s)


if __name__ == "__main__":
    build_quickstart()
    build_userguide()
    print("Wrote Catalina445-QuickStart.pdf and Catalina445-UserGuide.pdf to docs/")
