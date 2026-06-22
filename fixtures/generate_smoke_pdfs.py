#!/usr/bin/env python3
"""
Generate 3 synthetic PDFs for S02 smoke testing.

Usage:
    python fixtures/generate_smoke_pdfs.py
"""
import os
from fpdf import FPDF

OUT_DIR = os.path.join(os.path.dirname(__file__), "smoke_pdfs")
os.makedirs(OUT_DIR, exist_ok=True)

MARGIN = 15
LINE_H = 6

class SmokePdf(FPDF):
    def __init__(self):
        super().__init__()
        self.set_left_margin(MARGIN)
        self.set_right_margin(MARGIN)

    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.cell(0, 10, "MICT Test Document", align="R", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    def body_multi(self, text):
        self.set_x(MARGIN)
        self.multi_cell(self.w - MARGIN * 2, LINE_H, text)

    def body_text(self, text):
        self.set_x(MARGIN)
        self.cell(0, LINE_H, text, new_x="LMARGIN", new_y="NEXT")

    def heading(self, text, size=14):
        self.set_x(MARGIN)
        self.set_font("Helvetica", "B", size)
        self.cell(0, 10, text, new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 11)


def make_guidelines():
    pdf = SmokePdf()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.heading("Document Intelligence Guidelines", size=16)
    pdf.body_multi(
        "These guidelines establish the core responsibilities and expectations for all document "
        "intelligence systems. Every system must be accurate, transparent, and able to cite "
        "its sources. Grounded generation is not optional; it is the defining characteristic "
        "of trustworthy retrieval-augmented systems."
    )
    pdf.ln(4)

    sections = [
        ("Accuracy", [
            "All retrieved chunks must be verified against source documents.",
            "Confidence scores must be exposed for downstream debugging.",
            "Hallucinated facts are a critical failure."
        ],
        "This section is essential reading for anyone building, maintaining, or auditing "
        "a document intelligence pipeline. Deviations require documented exceptions and sign-off."),

        ("Transparency", [
            "Every answer must include citations.",
            "Citation snippets must be verifiable via exact-match.",
            "Model reasoning should be inspectable where possible."
        ],
        "Transparent systems allow operators to verify every step of the generation process. "
        "Citation mechanisms must be exact and reproducible."),

        ("Performance", [
            "Retrieval latency must remain under 100 ms for about 100 chunks.",
            "Batch embedding should process at least 100 chunks per call.",
            "Re-ingest of unchanged documents must be a no-op."
        ],
        "Performance targets are not aspirational. They are contractual requirements that "
        "govern user experience and operational cost."),

        ("Security", [
            "Sensitive data must be encrypted at rest.",
            "Access controls must be enforced per-document.",
            "Audit logs must capture every query for compliance."
        ],
        "Security is a first-class concern, not an afterthought. All access must be logged, "
        "reviewed, and subject to quarterly audits."),
    ]

    for title, bullets, note in sections:
        pdf.add_page()
        pdf.heading(title)
        for b in bullets:
            pdf.body_multi(f"- {b}")
        pdf.ln(2)
        pdf.set_font("Helvetica", "", 10)
        pdf.body_multi(note)
        pdf.set_font("Helvetica", "", 11)

    pdf.output(os.path.join(OUT_DIR, "smoke_01_guidelines.pdf"))
    print(f"Created: smoke_01_guidelines.pdf ({pdf.page_no()} pages)")


def make_policies():
    pdf = SmokePdf()

    content = [
        ("Privacy Policy",
         "All personal data must be handled in accordance with applicable regulations. "
         "Data subjects have the right to access, rectification, and erasure. "
         "Systems must implement data minimization and purpose limitation. "
         "Cross-border transfers require adequacy decisions or standard contractual clauses. "
         "Breach notifications must be submitted within 72 hours.",
         ["Data minimization", "Purpose limitation", "Breach notification", "Cross-border transfers", "Subject rights"]),

        ("Retention Policy",
         "Documents are retained according to statutory and contractual obligations. "
         "After the retention period expires, documents are securely deleted or anonymized. "
         "Legal holds supersede normal retention schedules. "
         "Audit trails must prove deletion occurred. "
         "Backups are exempt from immediate deletion but subject to the same overall schedule.",
         ["Statutory retention", "Contractual retention", "Legal hold", "Secure deletion", "Backup schedule"]),

        ("Access Control Policy",
         "Access is granted on a least-privilege basis. "
         "Role-based access control is the default model. "
         "Privileged access requires multi-factor authentication. "
         "Access reviews occur quarterly. "
         "Terminated users lose access within 24 hours.",
         ["Least privilege", "RBAC", "MFA", "Quarterly review", "Termination"]),
    ]

    for title, para, bullets in content:
        pdf.add_page()
        pdf.heading(title, size=16)
        pdf.body_multi(para)
        pdf.ln(3)
        pdf.heading("Key Points", size=12)
        for b in bullets:
            pdf.body_multi(f"- {b}")

    pdf.output(os.path.join(OUT_DIR, "smoke_02_policies.pdf"))
    print(f"Created: smoke_02_policies.pdf ({pdf.page_no()} pages)")


def make_procedures():
    pdf = SmokePdf()

    steps = [
        "Step 1. Identify the document source and verify its authenticity.",
        "Step 2. Compute a content hash using SHA-256 over the entire file.",
        "Step 3. Check the content hash against the document table for idempotency.",
        "Step 4. Extract text with page boundaries preserved using a reliable parser.",
        "Step 5. Run the chunker with structural-boundary preference and overlap.",
        "Step 6. Submit chunks for embedding in batches of up to 100.",
        "Step 7. Store document metadata and chunk records in a single transaction.",
        "Step 8. Build or refresh the ANN index after ingestion completes.",
        "Step 9. Run smoke tests: top-k retrieval latency under 100 milliseconds.",
        "Step 10. Log all ingest events including skipped, failed, and partial outcomes.",
    ]

    pdf.add_page()
    pdf.heading("Operational Procedures", size=16)
    pdf.body_multi(
        "This document describes the standard operating procedures for ingestion, indexing, "
        "and quality assurance. Every operator must be familiar with these steps before "
        "performing any production ingest. Deviations require supervisor approval."
    )
    pdf.ln(4)

    for step in steps:
        pdf.body_multi(step)
        pdf.ln(1)

    pdf.output(os.path.join(OUT_DIR, "smoke_03_procedures.pdf"))
    print(f"Created: smoke_03_procedures.pdf ({pdf.page_no()} pages)")


if __name__ == "__main__":
    make_guidelines()
    make_policies()
    make_procedures()
    print(f"\nAll smoke PDFs written to: {OUT_DIR}")
