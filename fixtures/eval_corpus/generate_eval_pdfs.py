#!/usr/bin/env python3
"""
Generate MICT-RAG-002 S04 Eval Corpus: 18 synthetic PDFs on structured cabling
and low-voltage communications standards.

Usage:
    pip install fpdf
    python fixtures/eval_corpus/generate_eval_pdfs.py
"""
import os
from fpdf import FPDF

OUT_DIR = os.path.join(os.path.dirname(__file__), "pdfs")
os.makedirs(OUT_DIR, exist_ok=True)

MARGIN = 15
LINE_H = 5


class EvalPdf(FPDF):
    def __init__(self):
        super().__init__()
        self.set_left_margin(MARGIN)
        self.set_right_margin(MARGIN)

    def header(self):
        self.set_font("Helvetica", "B", 9)
        self.cell(0, 8, "MICT Eval Corpus - Synthetic Document", align="R", new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    def body_para(self, text):
        self.set_x(MARGIN)
        self.set_font("Helvetica", "", 10)
        self.multi_cell(self.w - MARGIN * 2, LINE_H, text)
        self.ln(2)

    def heading(self, text, size=13):
        self.set_x(MARGIN)
        self.set_font("Helvetica", "B", size)
        self.cell(0, 8, text, new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 10)

    def bullet(self, text):
        self.set_x(MARGIN + 4)
        self.set_font("Helvetica", "", 10)
        self.multi_cell(self.w - MARGIN * 2 - 4, LINE_H, f"- {text}")


DOCUMENTS: list[dict] = [
    {
        "filename": "01_horizontal_cabling.pdf",
        "title": "Horizontal Cabling Standards",
        "sections": [
            {
                "heading": "Permanent Link Limits",
                "text": (
                    "The horizontal permanent link is limited to 90 metres of solid-conductor cabling. "
                    "With patch and equipment cords, the total channel length must not exceed 100 metres. "
                    "These limits apply to all balanced twisted-pair categories from Cat 5e through Cat 8."
                ),
                "bullets": [
                    "Permanent link: 90 m maximum",
                    "Channel: 100 m maximum",
                    "Patch cords: 5 m at each end recommended",
                ],
            },
            {
                "heading": "Category Performance",
                "text": (
                    "Cat 6 supports 1 Gbps to 100 metres. Cat 6A supports 10GBASE-T to 100 metres, "
                    "subject to the 90-metre permanent-link limit and alien-crosstalk mitigation. "
                    "Cat 8 supports 25/40 Gbps to 30 metres in the data centre."
                ),
                "bullets": [],
            },
            {
                "heading": "Work Area Components",
                "text": (
                    "The work area consists of the wall outlet or floor box, the patch cord to the end device, "
                    "and any transition hardware. TIA-568-D requires a minimum of two outlets per work area."
                ),
                "bullets": [],
            },
        ],
    },
    {
        "filename": "02_backbone_cabling.pdf",
        "title": "Backbone Cabling and Topology",
        "sections": [
            {
                "heading": "Backbone Distances",
                "text": (
                    "Intra-building backbone runs between telecommunications rooms and equipment rooms. "
                    "For twisted-pair copper, the backbone is limited to 90 metres between cross-connects. "
                    "For single-mode fibre, the intra-building backbone may reach 2,000 metres. "
                    "Inter-building backbones can exceed 2,000 metres when using single-mode fibre."
                ),
                "bullets": [
                    "Copper backbone: 90 m",
                    "Single-mode intra-building: 2,000 m",
                    "Single-mode inter-building: >2,000 m",
                ],
            },
            {
                "heading": "Star Topology",
                "text": (
                    "The hierarchical star is the mandatory topology for commercial building cabling. "
                    "Each horizontal cabling segment home-runs to a telecommunications room. "
                    "No intermediate splices or bridges are permitted without a cross-connect."
                ),
                "bullets": [],
            },
        ],
    },
    {
        "filename": "03_fiber_optic.pdf",
        "title": "Fiber Optic Standards",
        "sections": [
            {
                "heading": "Multimode Fiber Types",
                "text": (
                    "OM3 laser-optimised multimode fibre supports 10 Gbps to 300 metres and 40 Gbps to 100 metres "
                    "using parallel optics. OM4 extends 40 Gbps to 150 metres and 100 Gbps to 100 metres. "
                    "The minimum bend radius for OM4 is 30 mm under no-load conditions."
                ),
                "bullets": [
                    "OM3: 10 Gbps to 300 m",
                    "OM4: 40 Gbps to 150 m, 100 Gbps to 100 m",
                    "Bend radius: 30 mm (OM4, no load)",
                ],
            },
            {
                "heading": "Single-Mode Fiber",
                "text": (
                    "OS2 single-mode fibre is specified for ITU-T G.652.D. Attenuation shall not exceed 0.4 dB/km "
                    "at 1,310 nm and 0.3 dB/km at 1,550 nm. OS2 is the default choice for distances exceeding 550 metres."
                ),
                "bullets": [],
            },
            {
                "heading": "Connector Polish",
                "text": (
                    "UPC polish returns -50 dB typical reflectance. APC polish returns -60 dB or better. "
                    "APC is required for passive optical networks and any WDM application. "
                    "Mixing APC and UPC connectors in the same link is prohibited."
                ),
                "bullets": [],
            },
        ],
    },
    {
        "filename": "04_pathways_spaces.pdf",
        "title": "Pathways and Spaces",
        "sections": [
            {
                "heading": "Conduit Fill",
                "text": (
                    "Conduit fill for low-voltage communications cabling shall not exceed 40 percent when "
                    "three or more cables are present. For a single cable, 53 percent fill is permitted. "
                    "These percentages account for future access and thermal management."
                ),
                "bullets": [
                    "Multiple cables: 40 % fill maximum",
                    "Single cable: 53 % fill maximum",
                ],
            },
            {
                "heading": "Cable Tray Loading",
                "text": (
                    "Ladder-type cable trays shall support a uniform load of 22.7 kg per metre without structural "
                    "deformation. The working-load deflection limit is span divided by 200. "
                    "Support spacing shall not exceed 2.4 metres for standard installations."
                ),
                "bullets": [],
            },
            {
                "heading": "Access Flooring",
                "text": (
                    "Raised-floor plenum spaces are classified as air-handling spaces. Cables installed under "
                    "raised flooring in data centres must be plenum-rated when the cavity is used for air return."
                ),
                "bullets": [],
            },
        ],
    },
    {
        "filename": "05_grounding_bonding.pdf",
        "title": "Grounding and Bonding for Telecommunications",
        "sections": [
            {
                "heading": "Telecommunications Bonding",
                "text": (
                    "The telecommunications bonding backbone (TBB) shall be a 6 AWG copper conductor minimum. "
                    "It connects the telecommunications main grounding busbar (TMGB) to each telecommunications "
                    "grounding busbar (TGB) in intermediate and floor-serving rooms."
                ),
                "bullets": [
                    "TBB size: 6 AWG minimum",
                    "TBB connects TMGB to every TGB",
                ],
            },
            {
                "heading": "Ground Resistance",
                "text": (
                    "The resistance from any TGB to the main electrical service ground shall not exceed 1 ohm. "
                    "This is verified with a fall-of-potential earth-resistance test after installation."
                ),
                "bullets": [],
            },
            {
                "heading": "Equipment Bonding",
                "text": (
                    "Each rack and cabinet shall be bonded to the room TGB with a 6 AWG conductor. "
                    "Separate conductors shall not be daisy-chained; each rack receives a dedicated bonding jumper."
                ),
                "bullets": [],
            },
        ],
    },
    {
        "filename": "06_fire_stopping.pdf",
        "title": "Fire Stopping and Smoke Sealing",
        "sections": [
            {
                "heading": "Penetration Ratings",
                "text": (
                    "Penetrations through fire-rated walls and floors must maintain the fire-resistance rating "
                    "of the assembly. Intumescent sealants rated for F and T ratings are required. "
                    "A 2-hour rated wall requires a matching 2-hour fire-stop system."
                ),
                "bullets": [
                    "F rating: flame barrier integrity",
                    "T rating: temperature rise limit",
                    "Both ratings required for penetrations",
                ],
            },
            {
                "heading": "Cable Penetration Sleeves",
                "text": (
                    "Metallic sleeves cast or core-drilled into concrete floors must extend 25 mm above and below "
                    "the slab surface. Sleeves shall be filled with approved intumescent caulk after cable installation."
                ),
                "bullets": [],
            },
        ],
    },
    {
        "filename": "07_cable_management.pdf",
        "title": "Cable Management and Labelling",
        "sections": [
            {
                "heading": "Labeling Standard",
                "text": (
                    "TIA-606-B requires unique identifiers for every cable, outlet, and patch panel port. "
                    "Labels shall be machine-printed; handwritten labels are non-compliant. "
                    "The identifier format is: BLD-FLR-TR-PORT (building-floor-telecom room-port)."
                ),
                "bullets": [
                    "Machine-printed only",
                    "Format: BLD-FLR-TR-PORT",
                ],
            },
            {
                "heading": "Colour Coding",
                "text": (
                    "Patch cords should follow a colour scheme for service segmentation: blue for data, "
                    "yellow for voice, white for POE devices, and red for critical or security circuits."
                ),
                "bullets": [],
            },
            {
                "heading": "Cable Slack",
                "text": (
                    "A service loop of 3 metres minimum shall be left at each telecommunications room end. "
                    "Horizontal cabling shall have 300 mm of slack at the work area outlet."
                ),
                "bullets": [
                    "TR service loop: 3 m",
                    "Work area slack: 300 mm",
                ],
            },
        ],
    },
    {
        "filename": "08_testing_certification.pdf",
        "title": "Testing and Certification",
        "sections": [
            {
                "heading": "Insertion Loss Limits",
                "text": (
                    "Certification testers measure insertion loss against channel and permanent-link limits. "
                    "For Cat 6A at 250 MHz, the insertion loss limit is 20.9 dB for the channel and 16.8 dB "
                    "for the permanent link. NEXT must exceed 32.9 dB at 250 MHz."
                ),
                "bullets": [
                    "Cat 6A insertion loss: 20.9 dB (channel), 16.8 dB (permanent link) at 250 MHz",
                    "Cat 6A NEXT: >32.9 dB at 250 MHz",
                ],
            },
            {
                "heading": "Test Reports",
                "text": (
                    "A permanent record of every test result shall be retained for the warranty period. "
                    "Reports must include tester serial number, cable ID, date, and pass/fail status for all parameters."
                ),
                "bullets": [],
            },
            {
                "heading": "Autotest Duration",
                "text": (
                    "A full Cat 6A autotest using a Level V tester requires approximately 12 seconds per link. "
                    "Batch testing of 100 links can be completed in under 30 minutes including setup time."
                ),
                "bullets": [],
            },
        ],
    },
    {
        "filename": "09_poe_standards.pdf",
        "title": "Power over Ethernet Standards",
        "sections": [
            {
                "heading": "IEEE 802.3bt (Type 4)",
                "text": (
                    "IEEE 802.3bt Type 4 delivers up to 90 watts of DC power over all four pairs of a balanced "
                    "twisted-pair cable. It requires a minimum of Cat 5e cabling and is backwards compatible "
                    "with 802.3af and 802.3at powered devices."
                ),
                "bullets": [
                    "Maximum power: 90 W",
                    "Pairs used: all four",
                    "Minimum cable: Cat 5e",
                ],
            },
            {
                "heading": "IEEE 802.3at (Type 2)",
                "text": (
                    "IEEE 802.3at Type 2 (PoE+) delivers up to 30 W. It requires two pairs and is classified "
                    "as Midspan or Endpoint PSE. The maximum DC resistance per pair set is 12.5 ohms."
                ),
                "bullets": [],
            },
            {
                "heading": "Cable Temperature",
                "text": (
                    "Bundles of 192 or more PoE cables require derating of the conductor current capacity. "
                    "Temperature rise at the bundle centre shall not exceed 10 degrees Celsius above ambient."
                ),
                "bullets": [],
            },
        ],
    },
    {
        "filename": "10_access_control.pdf",
        "title": "Access Control Cabling",
        "sections": [
            {
                "heading": "Reader Cable Types",
                "text": (
                    "Access control readers typically communicate over Wiegand or OSDP. Wiegand uses unshielded "
                    "twisted-pair for data and a separate 18 AWG pair for 12 VDC power. OSDP operates over RS-485 "
                    "with a recommended shielded 22 AWG pair."
                ),
                "bullets": [
                    "Wiegand data: UTP",
                    "Wiegand power: 18 AWG",
                    "OSDP: RS-485, shielded 22 AWG",
                ],
            },
            {
                "heading": "Door Position Monitoring",
                "text": (
                    "Door contacts signal an open or closed state to the access control panel. The monitoring "
                    "loop must be supervised with an end-of-line resistor, typically 1 kOhm, located at the door contact."
                ),
                "bullets": [
                    "EOL resistor: 1 kOhm",
                    "Located at door contact",
                ],
            },
            {
                "heading": "Lock Power Budget",
                "text": (
                    "A typical electrified strike draws 250 mA at 12 VDC. A magnetic lock draws 500 mA at 12 VDC. "
                    "Power supplies must be sized at 125 % of the calculated continuous load."
                ),
                "bullets": [],
            },
        ],
    },
    {
        "filename": "11_surveillance_cabling.pdf",
        "title": "Surveillance and Security Camera Cabling",
        "sections": [
            {
                "heading": "IP Camera Infrastructure",
                "text": (
                    "Modern IP cameras connect over standard Ethernet cabling. A 4K camera with H.265 encoding "
                    "requires approximately 15 Mbps of network bandwidth. For a 90-day retention at 30 frames per second, "
                    "storage sizing is approximately 4 TB per camera."
                ),
                "bullets": [
                    "4K H.265 stream: ~15 Mbps",
                    "90-day retention: ~4 TB per camera",
                ],
            },
            {
                "heading": "Analog Coax Upgrade",
                "text": (
                    "Existing RG-59 coaxial cable can be reused with IP-over-coax extenders. These devices "
                    "support up to 100 Mbps over 300 metres of RG-59. Power can be delivered via the coax using "
                    "point-of-entry injectors."
                ),
                "bullets": [
                    "IP-over-coax throughput: 100 Mbps",
                    "Maximum distance: 300 m on RG-59",
                ],
            },
            {
                "heading": "Camera Elevation",
                "text": (
                    "General-purpose surveillance cameras should be mounted between 2.7 and 3.6 metres above grade. "
                    "Entrance cameras for facial recognition require 2.4 to 3.0 metres with a horizontal offset "
                    "not exceeding 15 degrees from the subject's approach vector."
                ),
                "bullets": [],
            },
        ],
    },
    {
        "filename": "12_wireless_infrastructure.pdf",
        "title": "Wireless LAN Infrastructure",
        "sections": [
            {
                "heading": "Wi-Fi 6 (802.11ax)",
                "text": (
                    "Wi-Fi 6 access points utilise OFDMA and 1024-QAM to achieve higher spectral efficiency. "
                    "Indoors, a Wi-Fi 6 access point provides coverage to approximately 500 square metres in open "
                    "office environments. Density planning assumes 50 concurrent devices per radio."
                ),
                "bullets": [
                    "Coverage: ~500 sq m per AP (indoor, open office)",
                    "Density: 50 concurrent devices per radio",
                ],
            },
            {
                "heading": "Wi-Fi 7 (802.11be)",
                "text": (
                    "Wi-Fi 7 introduces 320 MHz channel widths and Multi-Link Operation (MLO). Theoretical "
                    "aggregate throughput reaches 46 Gbps with 4K-QAM and 16 spatial streams."
                ),
                "bullets": [],
            },
            {
                "heading": "Backhaul Cabling",
                "text": (
                    "Access points that support 2.5 Gbps or greater require Cat 6A cabling to the switch port. "
                    "PoE++ (802.3bt) is required for high-power radios with multiple spatial streams at full duty cycle."
                ),
                "bullets": [],
            },
        ],
    },
    {
        "filename": "13_audiovisual_cabling.pdf",
        "title": "Audio/Visual Distribution Cabling",
        "sections": [
            {
                "heading": "HDMI Standards",
                "text": (
                    "HDMI 2.1 supports 8K resolution at 60 Hz and 4K at 120 Hz. The maximum reliable passive "
                    "HDMI 2.1 cable length is 3 metres for Ultra High Speed certification. Beyond 3 metres, "
                    "active optical HDMI (AOC) or fibre extenders are required."
                ),
                "bullets": [
                    "HDMI 2.1: 8K@60 Hz, 4K@120 Hz",
                    "Passive limit: 3 m",
                ],
            },
            {
                "heading": "HDBaseT",
                "text": (
                    "HDBaseT transmits uncompressed HDMI, Ethernet, RS-232, and IR over a single Cat 6A cable. "
                    "The maximum distance for HDBaseT is 100 metres. HDBaseT 3.0 supports 4K@60 Hz 4:4:4 with "
                    "zero latency."
                ),
                "bullets": [
                    "HDBaseT max distance: 100 m",
                    "HDBaseT 3.0: 4K@60 Hz 4:4:4, zero latency",
                ],
            },
            {
                "heading": "Digital Signage",
                "text": (
                    "A typical digital signage network uses H.265-encoded content delivered over IP multicast. "
                    "A 4K signage player requires a 25 Mbps sustained stream to avoid macro-blocking during "
                    "high-motion content."
                ),
                "bullets": [],
            },
        ],
    },
    {
        "filename": "14_plenum_riser.pdf",
        "title": "Plenum and Riser Cable Ratings",
        "sections": [
            {
                "heading": "Plenum Rating (CMP)",
                "text": (
                    "Plenum-rated cables (CMP) meet NFPA 262 flame and smoke requirements. They are required "
                    "in any air-handling space, including raised-floor plenums and drop-ceiling returns. "
                    "Plenum-rated cables must be marked with the CMP legend in continuous print. "
                    "Temperature rating for plenum cable is 75 degrees Celsius under continuous load."
                ),
                "bullets": [
                    "Standard: NFPA 262",
                    "Required in: air-handling spaces",
                    "Temperature rating: 75 C continuous",
                ],
            },
            {
                "heading": "Riser Rating (CMR)",
                "text": (
                    "Riser-rated cables (CMR) comply with UL 1666. They are permitted in vertical shafts "
                    "between floors but not in air-handling plenums. CMR cable must exhibit limited flame "
                    "spread when tested in the vertical tray flame test."
                ),
                "bullets": [
                    "Standard: UL 1666",
                    "Permitted: vertical risers",
                    "Prohibited: air-handling plenums",
                ],
            },
        ],
    },
    {
        "filename": "15_data_centre.pdf",
        "title": "Data Centre Structured Cabling",
        "sections": [
            {
                "heading": "Rack Unit Standards",
                "text": (
                    "Standard 19-inch equipment racks provide 42 to 48 rack units (RU) of vertical space. "
                    "Patch panels mount at 1 RU per 24 ports. The recommended mounting height for patch panels "
                    "is between 14 RU and 32 RU to minimise patch cord lengths."
                ),
                "bullets": [
                    "Standard rack: 19 inch width",
                    "Patch panel density: 24 ports per 1 RU",
                    "Optimal height: 14 RU to 32 RU",
                ],
            },
            {
                "heading": "Top-of-Rack Architecture",
                "text": (
                    "Top-of-rack (ToR) switching places the network switch at the top of each server cabinet. "
                    "Server-to-switch cabling is limited to 5 metres. This architecture reduces horizontal cable "
                    "management congestion compared to end-of-row switching."
                ),
                "bullets": [
                    "Server-to-switch: 5 m maximum",
                    "Benefit: reduced cable management congestion",
                ],
            },
            {
                "heading": "Hot Aisle / Cold Aisle",
                "text": (
                    "Data centre layouts shall orient cabinets in alternating hot-aisle and cold-aisle configurations. "
                    "Cold aisles supply conditioned air to equipment intakes. Hot aisles collect exhaust air for return "
                    "to the computer room air handler (CRAH)."
                ),
                "bullets": [],
            },
        ],
    },
    {
        "filename": "16_outside_plant.pdf",
        "title": "Outside Plant and Campus Cabling",
        "sections": [
            {
                "heading": "Underground Ducts",
                "text": (
                    "Campus cabling between buildings is placed in underground duct banks. A minimum of four "
                    "90 mm inner-ducts is recommended for a two-building link, providing one inner-duct for "
                    "current fibre, one for copper, and two for future expansion."
                ),
                "bullets": [
                    "Minimum inner-ducts: 4 per link",
                    "Duct size: 90 mm typical",
                ],
            },
            {
                "heading": "Direct Burial",
                "text": (
                    "Direct-burial cable requires a minimum cover depth of 600 mm in pedestrian areas and "
                    "1,200 mm in traffic-bearing zones. Warning tape marked with the word CABLE shall be placed "
                    "300 mm above every direct-burial cable."
                ),
                "bullets": [
                    "Pedestrian cover: 600 mm",
                    "Traffic cover: 1,200 mm",
                    "Warning tape: 300 mm above cable",
                ],
            },
            {
                "heading": "Aerial Span",
                "text": (
                    "Aerial campus fibre shall be lashed to a messenger wire with a maximum span of 70 metres "
                    "between support poles. Aerial cable must be all-dielectric self-supporting (ADSS) when "
                    "electrical hazards exist on the pole route."
                ),
                "bullets": [],
            },
        ],
    },
    {
        "filename": "17_telecom_room.pdf",
        "title": "Telecommunications Room Standards",
        "sections": [
            {
                "heading": "Room Size",
                "text": (
                    "A telecommunications room serving a single floor shall be a minimum of 3 metres by 3.6 metres. "
                    "Each additional 1,000 square metres of served area requires an additional 0.5 square metres "
                    "of rack space in the room. Ceiling height shall be 2.7 metres minimum."
                ),
                "bullets": [
                    "Minimum room: 3 m x 3.6 m",
                    "Ceiling height: 2.7 m minimum",
                ],
            },
            {
                "heading": "Environmental Requirements",
                "text": (
                    "Telecommunications rooms shall be maintained between 18 and 24 degrees Celsius and between "
                    "30 and 55 percent relative humidity. Temperature change rate shall not exceed 5 degrees per hour."
                ),
                "bullets": [
                    "Temperature: 18 C to 24 C",
                    "Humidity: 30 % to 55 % RH",
                    "Change rate: <= 5 C per hour",
                ],
            },
            {
                "heading": "Equipment Layout",
                "text": (
                    "Cable termination hardware shall be wall-mounted or rack-mounted. Wall-mounted panels require "
                    "a plywood backboard of 19 mm thickness, painted with fire-retardant paint. Racks shall be "
                    "spaced at minimum 900 mm apart for rear access."
                ),
                "bullets": [
                    "Backboard: 19 mm plywood, fire-retardant paint",
                    "Rack spacing: 900 mm minimum",
                ],
            },
        ],
    },
    {
        "filename": "18_bicsi_tia_overview.pdf",
        "title": "Industry Standards Overview",
        "sections": [
            {
                "heading": "TIA-568 Series",
                "text": (
                    "The TIA-568 series defines commercial building telecommunications cabling standards. "
                    "TIA-568-C.2 specifies balanced twisted-pair cabling and components. TIA-568-C.3 covers optical "
                    "fibre cabling components. TIA-568-D is the current revision, introducing Cat 8 and modular "
                    "plug-terminated links."
                ),
                "bullets": [
                    "TIA-568-C.2: twisted-pair",
                    "TIA-568-C.3: optical fibre",
                    "TIA-568-D: current revision, includes Cat 8",
                ],
            },
            {
                "heading": "BICSI Standards",
                "text": (
                    "BICSI publishes the Information Transport Systems (ITS) manuals. BICSI-007 covers data "
                    "centre design and operations. BICSI-002 covers network design. BICSI-005 covers distributed "
                    "antenna systems and in-building wireless."
                ),
                "bullets": [
                    "BICSI-007: data centre design",
                    "BICSI-002: network design",
                    "BICSI-005: distributed antenna systems",
                ],
            },
            {
                "heading": "ISO/IEC 11801",
                "text": (
                    "ISO/IEC 11801 is the international counterpart to TIA-568. Class EA corresponds to Cat 6A, "
                    "Class FA to Cat 7A, and Class I to Cat 8. The channel and permanent-link definitions align "
                    "with TIA but use metric dimensions in diagrams."
                ),
                "bullets": [],
            },
        ],
    },
]


def make_pdf(doc: dict) -> None:
    pdf = EvalPdf()
    pdf.add_page()
    pdf.heading(doc["title"], size=16)
    pdf.ln(2)

    for section in doc.get("sections", []):
        pdf.heading(section["heading"], size=12)
        pdf.body_para(section["text"])
        for b in section.get("bullets", []):
            pdf.bullet(b)
        pdf.ln(2)

    out_path = os.path.join(OUT_DIR, doc["filename"])
    pdf.output(out_path)
    print(f"Created: {doc['filename']} ({pdf.page_no()} pages)")


if __name__ == "__main__":
    for doc in DOCUMENTS:
        make_pdf(doc)
    print(f"\nAll eval PDFs written to: {OUT_DIR}")
