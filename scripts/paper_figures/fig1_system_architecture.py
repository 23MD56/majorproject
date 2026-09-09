"""
Generate Figure 1: Clean, uncluttered system architecture diagram for QuantNiti IEEE paper.
Engineered with spacious cards, bold readable typography, zero text overlaps, and professional IEEE color palette.
Outputs to docs/research_paper/figures/fig1_system_architecture.png and .pdf
"""
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Modern figure size with comfortable aspect ratio
fig, ax = plt.subplots(figsize=(11, 5.8), dpi=300)
ax.axis('off')

# Professional color palette (Clean, modern pastels with crisp high-contrast borders)
c_t1_bg, c_t1_border = "#F0F4FF", "#3B82F6"  # Blue
c_t2_bg, c_t2_border = "#ECFDF5", "#10B981"  # Emerald
c_t3_bg, c_t3_border = "#FFFBEB", "#F59E0B"  # Amber
c_t4_bg, c_t4_border = "#FDF2F8", "#EC4899"  # Rose
c_xai_bg, c_xai_border = "#F8FAFC", "#64748B" # Slate

# Helper to draw a modern card
def draw_card(x, y, w, h, stage_num, title, subtitle, bullets, bg_color, border_color):
    # Outer Card
    card = patches.FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.08",
        facecolor=bg_color, edgecolor=border_color, linewidth=1.8,
        zorder=2
    )
    ax.add_patch(card)
    
    # Header Accent Band
    header_h = 0.85
    header = patches.FancyBboxPatch(
        (x, y + h - header_h), w, header_h,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        facecolor=border_color, edgecolor=border_color, linewidth=1.0,
        zorder=3
    )
    ax.add_patch(header)
    
    # Square out bottom corners of header
    header_sq = patches.Rectangle(
        (x, y + h - header_h), w, 0.2,
        facecolor=border_color, edgecolor=border_color, zorder=3
    )
    ax.add_patch(header_sq)
    
    # Header Text (White on accent color)
    ax.text(x + w/2, y + h - 0.28, stage_num, ha='center', va='center',
            fontsize=8.5, fontweight='bold', color="#FFFFFF", fontfamily='sans-serif', zorder=4)
    ax.text(x + w/2, y + h - 0.58, title, ha='center', va='center',
            fontsize=10.5, fontweight='bold', color="#FFFFFF", fontfamily='sans-serif', zorder=4)
    
    # Subtitle pill
    pill = patches.FancyBboxPatch(
        (x + 0.15, y + h - header_h - 0.38), w - 0.3, 0.30,
        boxstyle="round,pad=0.02,rounding_size=0.04",
        facecolor="#FFFFFF", edgecolor="#CBD5E1", linewidth=0.8,
        zorder=3
    )
    ax.add_patch(pill)
    ax.text(x + w/2, y + h - header_h - 0.23, subtitle, ha='center', va='center',
            fontsize=8.0, fontstyle='italic', fontweight='bold', color="#334155", fontfamily='sans-serif', zorder=4)
    
    # Bullets inside card body
    start_y = y + h - header_h - 0.65
    line_spacing = (start_y - (y + 0.15)) / len(bullets)
    for i, (b_title, b_desc) in enumerate(bullets):
        by = start_y - i * line_spacing - 0.15
        # Bullet circle
        bullet_pt = patches.Circle((x + 0.22, by + 0.02), 0.045, facecolor=border_color, edgecolor='none', zorder=4)
        ax.add_patch(bullet_pt)
        # Text
        ax.text(x + 0.34, by + 0.07, b_title, ha='left', va='center',
                fontsize=8.5, fontweight='bold', color="#0F172A", fontfamily='sans-serif', zorder=4)
        ax.text(x + 0.34, by - 0.10, b_desc, ha='left', va='center',
                fontsize=7.6, color="#475569", fontfamily='sans-serif', zorder=4)

# 4 Main Pipeline Cards
card_w = 2.30
card_h = 3.65
card_y = 1.95

# Stage 1
s1_bullets = [
    ("Market Feeds", "NIFTY 50 OHLCV + India VIX"),
    ("Feature Space", "Parkinson Vol + Log Returns"),
    ("Unsupervised GMM", "K=3 Full-Covariance EM"),
    ("State Mapping", "Bull / Sideways / Bear")
]
draw_card(0.25, card_y, card_w, card_h, "STAGE 1", "Macro Regime", "Unsupervised Detection", s1_bullets, c_t1_bg, c_t1_border)

# Stage 2
s2_bullets = [
    ("Curated Universe", "58 Equities, ETFs & Sectoral"),
    ("Drift Blending", "CAPM (50%) + Mom + Trend"),
    ("Quantile Cones", "GBM Q10, Q50, Q90 (1M–12M)"),
    ("Regularization", "Strict Isotonic Monotonicity")
]
draw_card(2.95, card_y, card_w, card_h, "STAGE 2", "Asset Engine", "Quantile Forecasting", s2_bullets, c_t2_bg, c_t2_border)

# Stage 3
s3_bullets = [
    ("Covariance Matrix", "Analytical Ledoit-Wolf"),
    ("Target Shrinkage", "Constant Correlation Target"),
    ("Tree Clustering", "Correlation Distance Linkage"),
    ("Recursive Bisection", "Inverse-Variance Allocation")
]
draw_card(5.65, card_y, card_w, card_h, "STAGE 3", "Portfolio Engine", "Robust HRP Allocation", s3_bullets, c_t3_bg, c_t3_border)

# Stage 4
s4_bullets = [
    ("Discrete Sizing", "MILP Integer Whole Shares"),
    ("Concentration Caps", "Persona Limits (15%–32%)"),
    ("Cash Buffer", "Unallocated Residual C ≥ 0"),
    ("Order Sheets", "Zerodha CSV & Groww Export")
]
draw_card(8.35, card_y, card_w, card_h, "STAGE 4", "Execution", "Whole-Share Sizing", s4_bullets, c_t4_bg, c_t4_border)

# Modern Horizontal Connecting Arrows between Stages
for x_start in [2.58, 5.28, 7.98]:
    arrow = patches.FancyArrowPatch(
        (x_start, card_y + card_h/2), (x_start + 0.34, card_y + card_h/2),
        arrowstyle='simple,head_width=6,head_length=8',
        facecolor="#475569", edgecolor='none', zorder=5
    )
    ax.add_patch(arrow)

# Bottom Foundation Layer: Cross-Cutting Explainability & Trust
bot_x = 0.25
bot_w = 10.40
bot_h = 1.45
bot_y = 0.20

found_card = patches.FancyBboxPatch(
    (bot_x, bot_y), bot_w, bot_h,
    boxstyle="round,pad=0.02,rounding_size=0.08",
    facecolor=c_xai_bg, edgecolor=c_xai_border, linewidth=1.6, linestyle="--",
    zorder=2
)
ax.add_patch(found_card)

# Foundation Header
ax.text(bot_x + bot_w/2, bot_y + bot_h - 0.22,
        "CROSS-CUTTING EXPLAINABILITY (XAI) & REGULATORY TRUST ARCHITECTURE",
        ha='center', va='center', fontsize=9.5, fontweight='bold', color="#1E293B", fontfamily='sans-serif', zorder=4)

# 2 Balanced Columns inside the foundation layer
# Left Box: 4-Pillar Trust Card
b1_box = patches.FancyBboxPatch(
    (bot_x + 0.3, bot_y + 0.16), bot_w * 0.46, 0.85,
    boxstyle="round,pad=0.02,rounding_size=0.05",
    facecolor="#FFFFFF", edgecolor="#CBD5E1", linewidth=0.9, zorder=3
)
ax.add_patch(b1_box)
ax.text(bot_x + 0.5, bot_y + 0.76, "4-Pillar Transparent XAI Trust Card", ha='left', va='center',
        fontsize=8.5, fontweight='bold', color="#2563EB", fontfamily='sans-serif', zorder=4)
ax.text(bot_x + 0.5, bot_y + 0.52, "• Regime Alignment (Active GMM state match)", ha='left', va='center',
        fontsize=7.5, color="#334155", fontfamily='sans-serif', zorder=4)
ax.text(bot_x + 0.5, bot_y + 0.32, "• Directional Hit Rate (84.6% Bull / 81.2% Bear)  • Stress Drawdown Limits", ha='left', va='center',
        fontsize=7.5, color="#334155", fontfamily='sans-serif', zorder=4)

# Right Box: 3-Tier NLP Fact-Checker
b2_box = patches.FancyBboxPatch(
    (bot_x + bot_w * 0.51, bot_y + 0.16), bot_w * 0.46, 0.85,
    boxstyle="round,pad=0.02,rounding_size=0.05",
    facecolor="#FFFFFF", edgecolor="#CBD5E1", linewidth=0.9, zorder=3
)
ax.add_patch(b2_box)
ax.text(bot_x + bot_w * 0.53, bot_y + 0.76, "3-Tier Ground-Truth Review Fact-Checker", ha='left', va='center',
        fontsize=8.5, fontweight='bold', color="#059669", fontfamily='sans-serif', zorder=4)
ax.text(bot_x + bot_w * 0.53, bot_y + 0.52, "• Tier 1: Regex Anti-Spam (Blocks PII, telegram handles, tips)", ha='left', va='center',
        fontsize=7.5, color="#334155", fontfamily='sans-serif', zorder=4)
ax.text(bot_x + bot_w * 0.53, bot_y + 0.32, "• Tier 2: Ground-Truth Discrepancy Audit  • Tier 3: Contextual LLM Guardrail", ha='left', va='center',
        fontsize=7.5, color="#334155", fontfamily='sans-serif', zorder=4)

# Upward dotted connector arrows
for cx in [1.40, 4.10, 6.80, 9.50]:
    ax.annotate(
        "", xy=(cx, card_y - 0.02), xytext=(cx, bot_y + bot_h + 0.01),
        arrowprops=dict(arrowstyle="->", lw=1.2, color="#64748B", linestyle=":", mutation_scale=10),
        zorder=5
    )

ax.set_xlim(0, 10.9)
ax.set_ylim(0, 5.8)

plt.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.01)
plt.savefig("docs/research_paper/figures/fig1_system_architecture.png", dpi=300, bbox_inches='tight')
plt.savefig("docs/research_paper/figures/fig1_system_architecture.pdf", bbox_inches='tight')
print("Successfully generated clean, uncluttered Figure 1!")
