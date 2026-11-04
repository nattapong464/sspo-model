# Colorful semi-realistic portraits by gender and age band, with strong age cues (original artwork).
# Usage: python3 tools/generate_avatars.py public/avatars
import os, sys
out = sys.argv[1]
os.makedirs(out, exist_ok=True)

BG = {"child": ("#ffe8a3", "#ffc6a8"), "teen": ("#bfe3ff", "#9ccaf5"), "adult": ("#c4f0e0", "#93d9c2"),
      "middle": ("#e2d7ff", "#c2b0f2"), "elder": ("#ffd9c9", "#f5b59c"), "none": ("#e3e8ee", "#c9d2dc")}
SKIN = {"child": ("#ffe0c4", "#f2bd96", "#dc9e73"), "teen": ("#f8d2ad", "#e5ac82", "#ca8a60"),
        "adult": ("#f1c49c", "#dca075", "#c07f55"), "middle": ("#e9b88f", "#d3956b", "#b2744c"),
        "elder": ("#e8c1a2", "#cf9c7a", "#ad7d5b")}
HAIR = {"child": ("#2a1c15", "#6a4a36"), "teen": ("#18110d", "#4a3325"), "adult": ("#1f1510", "#5c3e2d"),
        "middle": ("#3d3633", "#9c9590"), "elder": ("#d9dade", "#ffffff")}
# face / feature geometry per age band
CFG = {
    "child":  dict(w=44, top=60, eyeY=120, chin=156, sh_y=176, eye=1.38, jaw=0.80, side=10, neck=12),
    "teen":   dict(w=36, top=50, eyeY=103, chin=151, sh_y=169, eye=1.08, jaw=0.52, side=20, neck=13),
    "adult":  dict(w=38, top=48, eyeY=100, chin=152, sh_y=166, eye=1.00, jaw=0.58, side=22, neck=14),
    "middle": dict(w=41, top=48, eyeY=100, chin=154, sh_y=166, eye=0.94, jaw=0.74, side=16, neck=15),
    "elder":  dict(w=40, top=50, eyeY=101, chin=156, sh_y=167, eye=0.86, jaw=0.78, side=14, neck=14),
}

def portrait(gender, band):
    child, teen, adult, middle, elder = (band == b for b in ("child", "teen", "adult", "middle", "elder"))
    female = gender == "female"; neutral = gender == "neutral"
    sk, sk_mid, sk_dark = SKIN[band]
    h1, h2 = HAIR[band]
    if middle and female: h1, h2 = "#2e2522", "#8f8784"
    bg1, bg2 = BG["none" if neutral else band]
    c = CFG[band]; w, top, eyeY, chin, sh_y = c["w"], c["top"], c["eyeY"], c["chin"], c["sh_y"]
    cx = 100
    def cy_(start, peak):  # bezier control y so the curve peaks at `peak`
        return round((4 * peak - start) / 3, 1)

    S = []; a = S.append
    a('<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 28 160 160" role="img" aria-label="%s %s">' % (gender, band))
    a('<defs>')
    a(f'<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{bg1}"/><stop offset="1" stop-color="{bg2}"/></linearGradient>')
    a(f'<radialGradient id="skin" cx=".42" cy=".38" r=".75"><stop offset="0" stop-color="{sk}"/><stop offset=".75" stop-color="{sk_mid}"/><stop offset="1" stop-color="{sk_dark}"/></radialGradient>')
    a(f'<linearGradient id="neck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{sk_dark}"/><stop offset=".45" stop-color="{sk_mid}"/><stop offset="1" stop-color="{sk_mid}"/></linearGradient>')
    a(f'<linearGradient id="hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{h2}"/><stop offset=".55" stop-color="{h1}"/><stop offset="1" stop-color="{h1}"/></linearGradient>')
    a('<radialGradient id="iris" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="#7a4f2e"/><stop offset="1" stop-color="#2e1a0e"/></radialGradient>')
    a('<radialGradient id="blush" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f27b7b" stop-opacity=".6"/><stop offset="1" stop-color="#f27b7b" stop-opacity="0"/></radialGradient>')
    shirt = {
        ("male", "child"): ("#ffb020", "#f08c00"), ("female", "child"): ("#ff8fb1", "#e9628d"),
        ("male", "teen"): ("#ffffff", "#dfe6ee"), ("female", "teen"): ("#ffffff", "#dfe6ee"),
        ("male", "adult"): ("#3f7fc4", "#2a5f9c"), ("female", "adult"): ("#e8577a", "#c63d61"),
        ("male", "middle"): ("#2f8f83", "#1f6b62"), ("female", "middle"): ("#8a5cd1", "#6a40ad"),
        ("male", "elder"): ("#c9a46a", "#a9834c"), ("female", "elder"): ("#d9785a", "#b65a3f"),
    }.get((gender, band), ("#8f9cab", "#6f7c8b"))
    a(f'<linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{shirt[0]}"/><stop offset="1" stop-color="{shirt[1]}"/></linearGradient>')
    a('<clipPath id="eyeR"><path d="M106 %s C110 %s 120 %s 124 %s C120 %s 110 %s 106 %s Z"/></clipPath>' % (
        eyeY, eyeY - 6.5, eyeY - 6.5, eyeY, eyeY + 4.8, eyeY + 4.8, eyeY))
    a('</defs>')
    a('<rect x="0" y="0" width="200" height="200" fill="url(#bg)"/>')
    a('<circle cx="150" cy="52" r="40" fill="#ffffff" opacity=".18"/>')

    # ---------------- back hair ----------------
    if female:
        if adult:   # long hair past the shoulders
            k = cy_(eyeY-10, top-16)
            a(f'<path d="M{cx-w-9} {eyeY-10} C{cx-w-14} {k} {cx+w+14} {k} {cx+w+9} {eyeY-10} C{cx+w+18} {eyeY+34} {cx+w+14} {sh_y+8} {cx+w+4} {sh_y+22} L{cx-w-4} {sh_y+22} C{cx-w-14} {sh_y+8} {cx-w-18} {eyeY+34} {cx-w-9} {eyeY-10} Z" fill="url(#hair)"/>')
        elif teen:  # school bob to the jaw
            k = cy_(eyeY-10, top-14)
            a(f'<path d="M{cx-w-8} {eyeY-10} C{cx-w-12} {k} {cx+w+12} {k} {cx+w+8} {eyeY-10} L{cx+w+8} {chin-12} L{cx-w-8} {chin-12} Z" fill="url(#hair)"/>')
        elif middle:  # wavy, shoulder length
            k = cy_(eyeY-10, top-16)
            a(f'<path d="M{cx-w-9} {eyeY-10} C{cx-w-14} {k} {cx+w+14} {k} {cx+w+9} {eyeY-10} C{cx+w+16} {eyeY+12} {cx+w+6} {eyeY+22} {cx+w+14} {eyeY+36} C{cx+w+18} {eyeY+48} {cx+w+6} {sh_y} {cx+w-2} {sh_y-2} L{cx-w+2} {sh_y-2} C{cx-w-6} {sh_y} {cx-w-18} {eyeY+48} {cx-w-14} {eyeY+36} C{cx-w-6} {eyeY+22} {cx-w-16} {eyeY+12} {cx-w-9} {eyeY-10} Z" fill="url(#hair)"/>')
        elif child:  # pigtails
            for sx in (-1, 1):
                x = cx + sx * (w + 8)
                a(f'<ellipse cx="{x + sx*3}" cy="{eyeY+4}" rx="11" ry="17" fill="url(#hair)" transform="rotate({sx*-18} {x} {eyeY-8})"/>')
                a(f'<circle cx="{x}" cy="{eyeY-12}" r="4.5" fill="#ff4f86"/>')
        elif elder:  # bun
            a(f'<circle cx="{cx}" cy="{top-12}" r="13" fill="url(#hair)"/>')
            a(f'<path d="M{cx-8} {top-17} q8 -5 16 0" stroke="#ffffff" stroke-opacity=".6" stroke-width="2" fill="none"/>')

    # ---------------- neck & body ----------------
    nw = c["neck"]
    a(f'<path d="M{cx-nw} {chin-18} L{cx-nw-1} {sh_y+6} L{cx+nw+1} {sh_y+6} L{cx+nw} {chin-18} Z" fill="url(#neck)"/>')
    if elder:
        a(f'<path d="M{cx-6} {chin+2} q-1 8 -3 14 M{cx+6} {chin+2} q1 8 3 14" stroke="{sk_dark}" stroke-width="1.1" fill="none" opacity=".55" stroke-linecap="round"/>')
    if child:
        body = f"M40 200 C42 {sh_y+8} 64 {sh_y} {cx} {sh_y} C136 {sh_y} 158 {sh_y+8} 160 200 Z"
    elif teen:
        body = f"M26 200 C28 {sh_y+10} 54 {sh_y} {cx} {sh_y} C146 {sh_y} 172 {sh_y+10} 174 200 Z"
    else:
        body = f"M12 200 C14 {sh_y+12} 46 {sh_y} {cx} {sh_y} C154 {sh_y} 186 {sh_y+12} 188 200 Z"
    a(f'<path d="{body}" fill="url(#shirt)"/>')
    if neutral:
        pass
    elif child:
        a(f'<path d="M{cx-13} {sh_y+1} C{cx-8} {sh_y+9} {cx+8} {sh_y+9} {cx+13} {sh_y+1}" stroke="#ffffff" stroke-opacity=".75" stroke-width="3" fill="none"/>')
        a(f'<path d="M{cx+22} {sh_y+12} l2.4 5 5.4 .6 -4 3.6 1.2 5.3 -5 -2.8 -4.8 2.8 1.1 -5.3 -4 -3.6 5.4 -.6 Z" fill="#ffffff" opacity=".9"/>')
    elif teen:  # Thai school uniform
        a(f'<path d="M{cx-16} {sh_y-1} L{cx} {sh_y+16} L{cx+16} {sh_y-1} L{cx+24} {sh_y+8} L{cx} {sh_y+24} L{cx-24} {sh_y+8} Z" fill="#ffffff" stroke="#c9d3de" stroke-width="1"/>')
        if female:
            a(f'<path d="M{cx-8} {sh_y+15} L{cx+8} {sh_y+15} L{cx+4} {sh_y+30} L{cx-4} {sh_y+30} Z" fill="#1f3b73"/>')
        else:
            a(f'<path d="M{cx+22} {sh_y+16} h12 v11 h-12 z" fill="#ffffff" stroke="#c9d3de"/><path d="M{cx+24} {sh_y+20} h8" stroke="#1f3b73" stroke-width="1.6"/>')
    elif female:
        a(f'<path d="M{cx-18} {sh_y} C{cx-12} {sh_y+16} {cx+12} {sh_y+16} {cx+18} {sh_y} Z" fill="url(#neck)"/>')
        if adult or elder:
            a(f'<path d="M{cx-16} {sh_y+4} C{cx-8} {sh_y+16} {cx+8} {sh_y+16} {cx+16} {sh_y+4}" stroke="#f4e4c8" stroke-width="2.4" fill="none" stroke-dasharray="0.1 5" stroke-linecap="round"/>')
        if middle:  # cardigan edges
            a(f'<path d="M{cx-20} {sh_y} L{cx-12} 200 M{cx+20} {sh_y} L{cx+12} 200" stroke="#4f2f88" stroke-width="5"/>')
        if elder:
            a(f'<circle cx="{cx-26}" cy="{sh_y+16}" r="3.6" fill="#ffd36b" stroke="#c99a2e"/>')
    elif middle:  # polo
        a(f'<path d="M{cx-14} {sh_y-1} L{cx} {sh_y+8} L{cx-6} {sh_y+16} L{cx-22} {sh_y+6} Z M{cx+14} {sh_y-1} L{cx} {sh_y+8} L{cx+6} {sh_y+16} L{cx+22} {sh_y+6} Z" fill="#1b5c55"/>')
        a(f'<path d="M{cx} {sh_y+8} V{sh_y+28}" stroke="#ffffff" stroke-opacity=".4" stroke-width="1.4"/>')
    else:
        a(f'<path d="M{cx-16} {sh_y-2} L{cx} {sh_y+14} L{cx-5} {sh_y+22} L{cx-22} {sh_y+6} Z M{cx+16} {sh_y-2} L{cx} {sh_y+14} L{cx+5} {sh_y+22} L{cx+22} {sh_y+6} Z" fill="#ffffff" opacity=".92"/>')
        a(f'<path d="M{cx} {sh_y+14} V200" stroke="#000" stroke-opacity=".15" stroke-width="1.4"/>')
        if adult:
            a(f'<path d="M{cx-3} {sh_y+12} L{cx+3} {sh_y+12} L{cx+4.5} {sh_y+32} L{cx} {sh_y+36} L{cx-4.5} {sh_y+32} Z" fill="#1f3b73"/>')

    # ---------------- ears ----------------
    er = 1.15 if elder else 1.0
    for sx in (-1, 1):
        ex = cx + sx * (w - 1)
        a(f'<ellipse cx="{ex}" cy="{eyeY+8}" rx="{7*er}" ry="{11*er}" fill="{sk_mid}"/>')
        a(f'<ellipse cx="{ex + sx*1.5}" cy="{eyeY+8}" rx="3.5" ry="{6.5*er}" fill="{sk_dark}" opacity=".45"/>')
        if female and (adult or middle or elder):
            a(f'<circle cx="{ex + sx*1}" cy="{eyeY+20}" r="2.6" fill="#fff6e0" stroke="#e0c58b" stroke-width=".8"/>')

    # ---------------- face ----------------
    jaw, side = c["jaw"], c["side"]
    face = (f"M{cx} {chin} C{cx+w*jaw} {chin} {cx+w*0.98} {chin-side} {cx+w} {eyeY+8} "
            f"C{cx+w*1.04} {eyeY-22} {cx+w*0.92} {top+12} {cx} {top} "
            f"C{cx-w*0.92} {top+12} {cx-w*1.04} {eyeY-22} {cx-w} {eyeY+8} "
            f"C{cx-w*0.98} {chin-side} {cx-w*jaw} {chin} {cx} {chin} Z")
    a(f'<path d="{face}" fill="url(#skin)"/>')
    a(f'<path d="M{cx-14} {chin-4} Q{cx} {chin+6} {cx+14} {chin-4} Q{cx} {chin+1} {cx-14} {chin-4} Z" fill="{sk_dark}" opacity=".3"/>')
    if child:  # chubby cheeks
        bop, brx, bry = 1.0, 13, 8
    elif female:
        bop, brx, bry = 0.8, 10, 6
    else:
        bop, brx, bry = 0.3, 10, 6
    bx = 23 if child else 21
    a(f'<ellipse cx="{cx-bx}" cy="{eyeY+(15 if child else 19)}" rx="{brx}" ry="{bry}" fill="url(#blush)" opacity="{bop}"/>')
    a(f'<ellipse cx="{cx+bx}" cy="{eyeY+(15 if child else 19)}" rx="{brx}" ry="{bry}" fill="url(#blush)" opacity="{bop}"/>')
    if elder:  # age spots
        a(f'<ellipse cx="{cx+22}" cy="{top+20}" rx="2.4" ry="1.8" fill="#9c6a4a" opacity=".3"/><ellipse cx="{cx-25}" cy="{eyeY+24}" rx="1.8" ry="1.4" fill="#9c6a4a" opacity=".3"/>')

    # ---------------- eyes + brows (right side, mirrored) ----------------
    brow_col = "#b9b9bf" if elder else ("#3e3431" if middle else h1)
    side_ = []; s = side_.append
    ir = 4.9 if child else 4.4
    s(f'<path d="M106 {eyeY} C110 {eyeY-6.5} 120 {eyeY-6.5} 124 {eyeY} C120 {eyeY+4.8} 110 {eyeY+4.8} 106 {eyeY} Z" fill="#fbf8f4"/>')
    lidcover = {"middle": eyeY - 3.6, "elder": eyeY - 2.0}.get(band)
    cover = (f'<path d="M104 {eyeY-8} H126 V{lidcover} C120 {lidcover-1.6} 110 {lidcover-1.6} 104 {lidcover} Z" fill="{sk_mid}"/>' if lidcover else
             f'<path d="M104 {eyeY-7} H126 V{eyeY-3.2} C120 {eyeY-5.6} 110 {eyeY-5.6} 104 {eyeY-3.2} Z" fill="{sk_dark}" opacity=".18"/>')
    s(f'<g clip-path="url(#eyeR)"><circle cx="114.5" cy="{eyeY-0.5}" r="{ir}" fill="url(#iris)"/><circle cx="114.5" cy="{eyeY-0.5}" r="{ir*0.45}" fill="#140a05"/>'
      f'<circle cx="116.2" cy="{eyeY-2.2}" r="{1.8 if child else 1.3}" fill="#ffffff"/>{cover}</g>')
    lid = 2.6 if female and not elder else 1.9
    s(f'<path d="M105.5 {eyeY+0.5} C110 {eyeY-6.8} 120 {eyeY-6.8} 124.5 {eyeY-0.5}" stroke="#2a1a12" stroke-width="{lid}" fill="none" stroke-linecap="round"/>')
    if female and not child:
        s(f'<path d="M124 {eyeY-0.8} l3.2 -2.6" stroke="#2a1a12" stroke-width="1.6" stroke-linecap="round"/>')
    if not child:
        s(f'<path d="M108 {eyeY-6} C112 {eyeY-9.5} 119 {eyeY-9.5} 123 {eyeY-5}" stroke="{sk_dark}" stroke-width=".9" fill="none" opacity=".5"/>')
    # under-eye: bags for middle / elder
    if middle:
        s(f'<path d="M108.5 {eyeY+6.5} C113 {eyeY+9} 118 {eyeY+9} 121.5 {eyeY+6}" stroke="{sk_dark}" stroke-width="1" fill="none" opacity=".55"/>')
    if elder:
        s(f'<path d="M107.5 {eyeY+6} C112 {eyeY+10} 118.5 {eyeY+10} 122.5 {eyeY+5.5} M109 {eyeY+10.5} C113 {eyeY+13} 118 {eyeY+13} 121 {eyeY+10}" stroke="{sk_dark}" stroke-width="1.1" fill="none" opacity=".65"/>')
        s(f'<path d="M127 {eyeY-3} l6 -2.5 M127.5 {eyeY+0.5} l6.5 0 M127 {eyeY+3.5} l5.5 2.5" stroke="{sk_dark}" stroke-width="1.1" opacity=".75" stroke-linecap="round"/>')
    elif middle:
        s(f'<path d="M127 {eyeY-1} l5 -1.5 M127 {eyeY+2} l5 1.2" stroke="{sk_dark}" stroke-width="1" opacity=".55" stroke-linecap="round"/>')
    by = eyeY - (11 if child else 13)
    bw = {"child": 2.4, "elder": 2.0}.get(band, 2.4 if female else 3.4)
    arch = 3.5 if child else 1.5
    s(f'<path d="M105 {by+3} C111 {by-arch} 119 {by-arch-1} 127 {by+1.5} C119 {by-arch-1+bw} 111 {by-arch+bw} 105 {by+3+bw*0.6} Z" fill="{brow_col}"/>')
    side_svg = "".join(side_)
    e = c["eye"]
    side_svg = f'<g transform="translate(115 {eyeY}) scale({e}) translate(-115 {-eyeY})">{side_svg}</g>'
    a(side_svg)
    a(f'<g transform="translate(200 0) scale(-1 1)">{side_svg}</g>')

    # ---------------- nose ----------------
    ny = eyeY + (17 if child else 24 if not elder else 26)
    if not child:
        a(f'<path d="M{cx-1.5} {eyeY+6} C{cx-3} {ny-10} {cx-6} {ny-5} {cx-6.5} {ny-1}" stroke="{sk_dark}" stroke-width="1.4" fill="none" opacity=".45" stroke-linecap="round"/>')
    nwid = 6 if child else 9.5 if (middle or elder) else 9
    a(f'<path d="M{cx-nwid} {ny-1} C{cx-nwid*0.66} {ny+3.5} {cx-2} {ny+2} {cx} {ny+3} C{cx+2} {ny+2} {cx+nwid*0.66} {ny+3.5} {cx+nwid} {ny-1}" stroke="{sk_dark}" stroke-width="1.3" fill="none" opacity=".55" stroke-linecap="round"/>')
    if not child:
        a(f'<ellipse cx="{cx-4}" cy="{ny+0.8}" rx="1.7" ry="0.9" fill="#6b3f2a" opacity=".3"/><ellipse cx="{cx+4}" cy="{ny+0.8}" rx="1.7" ry="0.9" fill="#6b3f2a" opacity=".3"/>')
    a(f'<ellipse cx="{cx+1}" cy="{ny-5}" rx="{1.6 if child else 2}" ry="{2.5 if child else 4}" fill="#ffffff" opacity=".22"/>')

    # ---------------- mouth ----------------
    my = ny + (11 if child else 13)
    if child:  # open, happy smile
        a(f'<path d="M{cx-9} {my} Q{cx} {my+2} {cx+9} {my} Q{cx} {my+13} {cx-9} {my} Z" fill="#a8363d"/>')
        a(f'<path d="M{cx-7.5} {my+0.8} Q{cx} {my+2.6} {cx+7.5} {my+0.8} L{cx+6} {my+3.6} Q{cx} {my+4.8} {cx-6} {my+3.6} Z" fill="#ffffff"/>')
        a(f'<ellipse cx="{cx}" cy="{my+7.8}" rx="4" ry="2" fill="#f27b84"/>')
    else:
        if female and (adult or teen):
            lt, lb = ("#d0505a", "#e2717a") if adult else ("#d47a74", "#e3958c")
        elif female:
            lt, lb = ("#b85a5d", "#cf7a7a")
        else:
            lt, lb = ("#bd7769", "#d39586")
        mw = 12
        lower = 10 if not elder else 6
        corner = -1.2 if not elder else 0.8
        a(f'<path d="M{cx-mw} {my} C{cx-6} {my-4} {cx-2.5} {my-2.6} {cx} {my-1.6} C{cx+2.5} {my-2.6} {cx+6} {my-4} {cx+mw} {my} Q{cx} {my+2.2} {cx-mw} {my} Z" fill="{lt}"/>')
        a(f'<path d="M{cx-mw} {my} Q{cx} {my+2.2} {cx+mw} {my} Q{cx} {my+lower} {cx-mw} {my} Z" fill="{lb}"/>')
        a(f'<path d="M{cx-mw-1} {my+corner} Q{cx} {my+3.4} {cx+mw+1} {my+corner}" stroke="#8a3f3c" stroke-width="1.2" fill="none" stroke-linecap="round"/>')
        a(f'<ellipse cx="{cx+2}" cy="{my+3.6}" rx="4" ry="1.3" fill="#ffffff" opacity=".28"/>')
    # folds & wrinkles
    if middle or elder:
        op = .5 if middle else .7
        a(f'<path d="M{cx-11} {ny-2} C{cx-17} {ny+6} {cx-17} {my+2} {cx-14} {my+6} M{cx+11} {ny-2} C{cx+17} {ny+6} {cx+17} {my+2} {cx+14} {my+6}" stroke="{sk_dark}" stroke-width="1.2" fill="none" opacity="{op}" stroke-linecap="round"/>')
        a(f'<path d="M{cx-12} {top+20} q12 -3 24 0" stroke="{sk_dark}" stroke-width="1" fill="none" opacity="{op-.1}" stroke-linecap="round"/>')
    if elder:
        a(f'<path d="M{cx-16} {top+14} q16 -4 32 0 M{cx-10} {top+26} q10 -3 20 0" stroke="{sk_dark}" stroke-width="1" fill="none" opacity=".6" stroke-linecap="round"/>')
        a(f'<path d="M{cx-13} {my+5} q-1 6 -4 10 M{cx+13} {my+5} q1 6 4 10" stroke="{sk_dark}" stroke-width="1.1" fill="none" opacity=".55" stroke-linecap="round"/>')
        a(f'<path d="M{cx-5} {eyeY-14} v4 M{cx+5} {eyeY-14} v4" stroke="{sk_dark}" stroke-width="1" opacity=".5" stroke-linecap="round"/>')

    # ---------------- facial hair ----------------
    if middle and not female:
        m0 = my - 3.4
        a(f'<path d="M{cx-10} {m0+1} C{cx-7} {m0-3.4} {cx-2} {m0-3.6} {cx} {m0-2.2} C{cx+2} {m0-3.6} {cx+7} {m0-3.4} {cx+10} {m0+1} C{cx+6} {m0-0.8} {cx+2} {m0-0.6} {cx} {m0} C{cx-2} {m0-0.6} {cx-6} {m0-0.8} {cx-10} {m0+1} Z" fill="#4a403c" opacity=".85"/>')
        a(f'<path d="M{cx-w+6} {eyeY+14} C{cx-w+10} {chin-6} {cx-12} {chin} {cx} {chin} C{cx+12} {chin} {cx+w-10} {chin-6} {cx+w-6} {eyeY+14}" stroke="#3a3230" stroke-width="5" fill="none" opacity=".12"/>')

    # ---------------- front hair ----------------
    if neutral:
        k = cy_(eyeY-4, top-11)
        a(f'<path d="M{cx-w-1} {eyeY-4} C{cx-w-4} {k} {cx+w+4} {k} {cx+w+1} {eyeY-4} C{cx+w-4} {top+12} {cx-w+4} {top+12} {cx-w-1} {eyeY-4} Z" fill="#6b7785"/>')
    elif not female:
        if child:  # bowl cut with full fringe
            k = cy_(eyeY-2, top-8)
            a(f'<path d="M{cx-w-2} {eyeY-2} C{cx-w-6} {k} {cx+w+6} {k} {cx+w+2} {eyeY-2} L{cx+w-2} {eyeY-12} '
              f'C{cx+24} {top+28} {cx+16} {top+24} {cx+10} {top+28} C{cx+4} {top+24} {cx-4} {top+24} {cx-8} {top+28} C{cx-14} {top+24} {cx-24} {top+28} {cx-w+2} {eyeY-12} Z" fill="url(#hair)"/>')
        elif teen:  # Thai student crew cut: very short, close to the head
            k = cy_(eyeY-8, top-5)
            a(f'<path d="M{cx-w} {eyeY-8} C{cx-w-2} {k} {cx+w+2} {k} {cx+w} {eyeY-8} C{cx+w-4} {top+10} {cx-w+4} {top+10} {cx-w} {eyeY-8} Z" fill="url(#hair)" opacity=".92"/>')
            a(f'<path d="M{cx-w+1} {eyeY-8} v8 M{cx+w-1} {eyeY-8} v8" stroke="{h1}" stroke-width="3" opacity=".5"/>')
        elif adult:  # styled side part with volume
            k = cy_(eyeY-4, top-14)
            a(f'<path d="M{cx-w-1} {eyeY-4} C{cx-w-6} {k} {cx+w+6} {k} {cx+w+1} {eyeY-4} '
              f'L{cx+w-3} {eyeY-12} C{cx+w-6} {top+12} {cx+12} {top+9} {cx-6} {top+14} '
              f'C{cx-16} {top+17} {cx-w+4} {top+18} {cx-w+3} {eyeY-12} Z" fill="url(#hair)"/>')
            a(f'<path d="M{cx-14} {top-6} C{cx-4} {top-14} {cx+12} {top-12} {cx+22} {top-4}" stroke="{h2}" stroke-width="2.4" fill="none" opacity=".6" stroke-linecap="round"/>')
        elif middle:  # receding temples, salt & pepper
            k = cy_(eyeY-4, top-9)
            a(f'<path d="M{cx-w-1} {eyeY-4} C{cx-w-4} {k} {cx+w+4} {k} {cx+w+1} {eyeY-4} '
              f'L{cx+w-4} {eyeY-14} C{cx+w-8} {top+20} {cx+18} {top+18} {cx+12} {top+8} C{cx+4} {top+14} {cx-4} {top+14} {cx-12} {top+8} '
              f'C{cx-18} {top+18} {cx-w+8} {top+20} {cx-w+4} {eyeY-14} Z" fill="url(#hair)"/>')
            a(f'<path d="M{cx-w+1} {eyeY-4} v-12 M{cx+w-1} {eyeY-4} v-12" stroke="#c9c9ce" stroke-width="4" stroke-linecap="round"/>')
        else:  # bald on top, white at the sides
            for sx in (-1, 1):
                x0 = cx + sx * (w + 1)
                a(f'<path d="M{x0} {eyeY+6} C{x0 + sx*3} {eyeY-14} {x0 - sx*4} {top+14} {x0 - sx*13} {top+8} C{x0 - sx*9} {top+18} {x0 - sx*5} {eyeY-10} {x0 - sx*5} {eyeY+4} Z" fill="url(#hair)"/>')
            a(f'<ellipse cx="{cx-6}" cy="{top+8}" rx="12" ry="5" fill="#ffffff" opacity=".25"/>')
    else:
        if child:
            k = cy_(eyeY-2, top-8)
            a(f'<path d="M{cx-w-2} {eyeY-2} C{cx-w-6} {k} {cx+w+6} {k} {cx+w+2} {eyeY-2} '
              f'L{cx+w-3} {eyeY-14} C{cx+w-6} {top+24} {cx+16} {top+26} {cx} {top+25} C{cx-16} {top+26} {cx-w+6} {top+24} {cx-w+3} {eyeY-14} Z" fill="url(#hair)"/>')
        elif teen:  # straight bangs
            k = cy_(eyeY+2, top-14)
            a(f'<path d="M{cx-w-8} {eyeY+2} C{cx-w-10} {k} {cx+w+10} {k} {cx+w+8} {eyeY+2} L{cx+w-2} {eyeY+2} L{cx+w-4} {top+24} L{cx-w+4} {top+24} L{cx-w+2} {eyeY+2} Z" fill="url(#hair)"/>')
            a(f'<path d="M{cx-w+4} {top+24} H{cx+w-4}" stroke="#000" stroke-opacity=".15" stroke-width="1.2"/>')
            a(f'<rect x="{cx+w-12}" y="{top+12}" width="9" height="3.6" rx="1.8" fill="#4da3ff"/>')
        elif elder:
            k = cy_(eyeY+2, top-9)
            a(f'<path d="M{cx-w-3} {eyeY+2} C{cx-w-7} {k} {cx+w+7} {k} {cx+w+3} {eyeY+2} '
              f'C{cx+w-2} {eyeY-14} {cx+w-6} {top+14} {cx+8} {top+12} C{cx-6} {top+16} {cx-w+4} {top+16} {cx-w+1} {eyeY+2} Z" fill="url(#hair)"/>')
            a(f'<path d="M{cx-20} {top+4} q10 -6 20 -2 M{cx+2} {top+2} q10 -4 18 2" stroke="#b8b9be" stroke-width="1.4" fill="none"/>')
        else:  # adult / middle: side-swept
            k = cy_(eyeY+20, top-14)
            a(f'<path d="M{cx-w-4} {eyeY+20} C{cx-w-10} {k} {cx+w+10} {k} {cx+w+4} {eyeY+20} '
              f'C{cx+w} {eyeY-4} {cx+w-4} {top+16} {cx+w-12} {top+14} '
              f'C{cx+4} {top+12} {cx-12} {top+24} {cx-w+2} {eyeY-6} C{cx-w+1} {eyeY+2} {cx-w} {eyeY+12} {cx-w-4} {eyeY+20} Z" fill="url(#hair)"/>')
            a(f'<path d="M{cx-w+8} {top+2} C{cx-8} {top-10} {cx+14} {top-10} {cx+w-6} {top+1}" stroke="{h2}" stroke-width="2.4" fill="none" opacity=".7" stroke-linecap="round"/>')
            if middle:
                a(f'<path d="M{cx-w+4} {top+14} C{cx-14} {top+2} {cx-4} {top} {cx+8} {top+2}" stroke="#d0cdd0" stroke-width="2.6" fill="none" stroke-linecap="round"/>')

    # ---------------- glasses ----------------
    if elder and not female:
        g = 'fill="#ffffff" fill-opacity=".12" stroke="#5b4636" stroke-width="2.2"'
        a(f'<rect x="{cx-27}" y="{eyeY-8}" width="21" height="15" rx="6" {g}/><rect x="{cx+6}" y="{eyeY-8}" width="21" height="15" rx="6" {g}/>')
        a(f'<path d="M{cx-6} {eyeY-2} Q{cx} {eyeY-5} {cx+6} {eyeY-2} M{cx-27} {eyeY-4} L{cx-w} {eyeY-2} M{cx+27} {eyeY-4} L{cx+w} {eyeY-2}" stroke="#5b4636" stroke-width="2.2" fill="none"/>')
    if middle and female:  # thin reading glasses
        g = 'fill="#ffffff" fill-opacity=".1" stroke="#7b3f8f" stroke-width="1.6"'
        a(f'<ellipse cx="{cx-15}" cy="{eyeY}" rx="10.5" ry="7.5" {g}/><ellipse cx="{cx+15}" cy="{eyeY}" rx="10.5" ry="7.5" {g}/>')
        a(f'<path d="M{cx-4.5} {eyeY-1} Q{cx} {eyeY-4} {cx+4.5} {eyeY-1} M{cx-25.5} {eyeY-1} L{cx-w} {eyeY} M{cx+25.5} {eyeY-1} L{cx+w} {eyeY}" stroke="#7b3f8f" stroke-width="1.6" fill="none"/>')

    a('</svg>')
    return "".join(S)

names = {
    ("male", "child"): "child_boy", ("female", "child"): "child_girl",
    ("male", "teen"): "teen_boy", ("female", "teen"): "teen_girl",
    ("male", "adult"): "adult_male", ("female", "adult"): "adult_female",
    ("male", "middle"): "middle_male", ("female", "middle"): "middle_female",
    ("male", "elder"): "elder_male", ("female", "elder"): "elder_female",
}
for (g, b), n in names.items():
    open(os.path.join(out, n + ".svg"), "w").write(portrait(g, b))
open(os.path.join(out, "unknown.svg"), "w").write(portrait("neutral", "adult"))
# The middle-aged group was merged into adult (20–59); keep the old file names pointing at the adult pictures
for g, n in (("male", "middle_male"), ("female", "middle_female")):
    open(os.path.join(out, n + ".svg"), "w").write(portrait(g, "adult"))
print("ok")
