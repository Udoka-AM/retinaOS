import math
import os
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS, SECONDS = 1280, 720, 30, 6
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

FONT = "/System/Library/Fonts/SFNS.ttf"
MONO = "/System/Library/Fonts/SFNSMono.ttf"

def font(size, mono=False):
    return ImageFont.truetype(MONO if mono else FONT, size)

LIME = (190, 255, 0)
VIOLET = (165, 94, 234)
AMBER = (255, 188, 72)
WHITE = (242, 245, 241)
MUTED = (147, 155, 162)

def clamp(x): return max(0.0, min(1.0, x))
def ease(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3
def smooth(x):
    x = clamp(x)
    return x*x*(3-2*x)

def rgba(c, a): return (*c, int(255 * clamp(a)))

def glow_circle(base, xy, radius, color, strength=1.0):
    layer = Image.new("RGBA", base.size)
    d = ImageDraw.Draw(layer)
    d.ellipse((xy[0]-radius, xy[1]-radius, xy[0]+radius, xy[1]+radius), fill=rgba(color, .38*strength))
    layer = layer.filter(ImageFilter.GaussianBlur(radius*.72))
    base.alpha_composite(layer)

def draw_eye(layer, cx, cy, scale, alpha=1.0, depth=0):
    d = ImageDraw.Draw(layer)
    col = rgba(LIME, alpha)
    box = (cx-86*scale, cy-58*scale, cx+86*scale, cy+58*scale)
    width = max(2, int(9*scale))
    # layered extrusion
    for off in range(depth, 0, -1):
        shadow = (80, 108, 0, int(75*alpha))
        b = tuple(v + off*2*scale if i % 2 == 0 else v + off*1.2*scale for i, v in enumerate(box))
        d.arc(b, 196, 344, fill=shadow, width=width)
        d.arc(b, 16, 164, fill=shadow, width=width)
    d.arc(box, 196, 344, fill=col, width=width)
    d.arc(box, 16, 164, fill=col, width=width)
    r = 34*scale
    d.ellipse((cx-r, cy-r, cx+r, cy+r), fill=col)
    hr = 9*scale
    d.ellipse((cx+13*scale-hr, cy-18*scale-hr, cx+13*scale+hr, cy-18*scale+hr), fill=(5,7,7,int(255*alpha)))

def draw_reticle(d, cx, cy, s, color, a):
    c=rgba(color,a); w=max(2,int(4*s)); r=29*s
    d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=c,width=w)
    d.ellipse((cx-6*s,cy-6*s,cx+6*s,cy+6*s),outline=c,width=w)
    for dx,dy in [(0,-41),(0,41),(-41,0),(41,0)]:
        d.line((cx+dx*(.65 if dx else 1),cy+dy*(.65 if dy else 1),cx+dx,cy+dy),fill=c,width=w)

def draw_brain(d,cx,cy,s,color,a):
    c=rgba(color,a); w=max(2,int(4*s))
    d.rounded_rectangle((cx-34*s,cy-38*s,cx+34*s,cy+38*s),radius=22*s,outline=c,width=w)
    d.line((cx,cy-36*s,cx,cy+36*s),fill=c,width=w)
    for sx in (-1,1):
        d.arc((cx+sx*2*s-28*s,cy-24*s,cx+sx*2*s+8*s,cy+8*s),40 if sx<0 else 140,300 if sx<0 else 400,fill=c,width=w)
        d.arc((cx+sx*2*s-28*s,cy-2*s,cx+sx*2*s+8*s,cy+30*s),40 if sx<0 else 140,300 if sx<0 else 400,fill=c,width=w)

def draw_wallet(d,cx,cy,s,color,a):
    c=rgba(color,a); w=max(2,int(4*s))
    pts=[(cx-44*s,cy),(cx-24*s,cy-26*s),(cx,cy-38*s),(cx+24*s,cy-26*s),(cx+44*s,cy),(cx+24*s,cy+26*s),(cx,cy+38*s),(cx-24*s,cy+26*s)]
    d.line(pts+[pts[0]],fill=c,width=w,joint="curve")
    sh=[(cx,cy-22*s),(cx+20*s,cy-12*s),(cx+16*s,cy+16*s),(cx,cy+28*s),(cx-16*s,cy+16*s),(cx-20*s,cy-12*s)]
    d.polygon(sh,fill=rgba(LIME,a*.9))
    d.line((cx-8*s,cy+2*s,cx-1*s,cy+10*s,cx+11*s,cy-7*s),fill=rgba((8,11,8),a),width=w)

def centered(d,text,y,f,fill):
    box=d.textbbox((0,0),text,font=f)
    d.text(((W-(box[2]-box[0]))/2,y),text,font=f,fill=fill)

def card(base, x, y, w, h, p, accent, title, verb, detail, icon):
    p=ease(p)
    if p<=0:return
    # faux 3D approach: lift, scale, layered depth
    yy=y+(1-p)*90
    ww=w*(.86+.14*p); hh=h*(.86+.14*p)
    xx=x+(w-ww)/2
    shadow=Image.new("RGBA",base.size)
    sd=ImageDraw.Draw(shadow)
    for k in range(10,0,-1):
        sd.rounded_rectangle((xx+k*1.4,yy+k*2,xx+ww+k*1.4,yy+hh+k*2),radius=24,fill=(0,0,0,int(9*p)))
    shadow=shadow.filter(ImageFilter.GaussianBlur(12))
    base.alpha_composite(shadow)
    panel=Image.new("RGBA",base.size)
    d=ImageDraw.Draw(panel)
    d.rounded_rectangle((xx,yy,xx+ww,yy+hh),radius=24,fill=(9,12,14,int(236*p)),outline=rgba(accent,.6*p),width=2)
    d.line((xx+22,yy+hh-40,xx+ww-22,yy+hh-40),fill=rgba(accent,.22*p),width=1)
    cx=xx+ww/2; icy=yy+66
    if icon=="reticle": draw_reticle(d,cx,icy,1,accent,p)
    elif icon=="brain": draw_brain(d,cx,icy,1,accent,p)
    else: draw_wallet(d,cx,icy,1,accent,p)
    tb=d.textbbox((0,0),title,font=font(29)); d.text((cx-(tb[2]-tb[0])/2,yy+120),title,font=font(29),fill=rgba(WHITE,p))
    vb=d.textbbox((0,0),verb,font=font(15,True)); d.text((cx-(vb[2]-vb[0])/2,yy+164),verb,font=font(15,True),fill=rgba(accent,p))
    db=d.textbbox((0,0),detail,font=font(14)); d.text((cx-(db[2]-db[0])/2,yy+197),detail,font=font(14),fill=rgba(MUTED,p))
    base.alpha_composite(panel)

for i in range(FPS*SECONDS):
    t=i/FPS
    im=Image.new("RGBA",(W,H),(3,5,6,255))
    # background glows
    glow_circle(im,(190,80),260,LIME,.34)
    glow_circle(im,(1110,80),280,VIOLET,.28)
    glow_circle(im,(980,720),300,AMBER,.12)
    d=ImageDraw.Draw(im)
    # perspective grid
    for x in range(0,W,52): d.line((x,0,x,H),fill=(85,105,75,22),width=1)
    for y in range(0,H,52): d.line((0,y,W,y),fill=(85,105,75,18),width=1)

    # brand intro
    logo_p=ease(t/.65)
    ring=Image.new("RGBA",im.size); rd=ImageDraw.Draw(ring)
    cx,cy=190,150
    for j,r in enumerate((70,92,116)):
        start=(t*75+j*70)%360
        rd.arc((cx-r,cy-r,cx+r,cy+r),start,start+210,fill=rgba(LIME,(.16+.12*j)*logo_p),width=2+j)
    draw_eye(ring,cx,cy,.72,logo_p,5)
    im.alpha_composite(ring)
    title_a=ease((t-.25)/.65)
    d.text((285,96),"retina",font=font(70),fill=rgba(WHITE,title_a))
    d.text((465,96),"OS",font=font(70),fill=rgba(LIME,title_a))
    d.text((289,176),"THE INTELLIGENCE LAYER FOR ROBINHOOD CHAIN",font=font(16,True),fill=rgba(MUTED,title_a))

    # suite cards
    card(im,70,310,350,245,(t-1.15)/.55,LIME,"Retina Terminal","DISCOVER","Live markets · AI analyst","reticle")
    card(im,465,310,350,245,(t-1.75)/.55,VIOLET,"Cortex","UNDERSTAND","Reputation · Risk scoring","brain")
    card(im,860,310,350,245,(t-2.35)/.55,AMBER,"Retina Wallet","ACT","Policy-governed execution","wallet")

    # signal line and moving pulse
    loop_a=smooth((t-3.0)/.7)
    d.line((170,590,1110,590),fill=rgba(LIME,.25*loop_a),width=2)
    pulse_x=170+940*((t*0.55)%1)
    glow_circle(im,(pulse_x,590),16,LIME,loop_a)
    d.ellipse((pulse_x-4,586,pulse_x+4,594),fill=rgba(LIME,loop_a))
    chips_a=smooth((t-3.55)/.55)
    chips=[("AI-GROUNDED",310),("REPUTATION",535),("POLICY-GOVERNED",775)]
    for txt,x in chips:
        box=d.textbbox((0,0),txt,font=font(14,True)); tw=box[2]-box[0]
        d.rounded_rectangle((x,625,x+tw+30,661),radius=18,fill=(13,17,18,int(210*chips_a)),outline=rgba(LIME,.26*chips_a),width=1)
        d.text((x+15,635),txt,font=font(14,True),fill=rgba(WHITE,.82*chips_a))

    # CTA overlay
    cta=smooth((t-4.72)/.35)
    if cta>0:
        veil=Image.new("RGBA",im.size,(2,4,5,int(232*cta)))
        im.alpha_composite(veil)
        glow_circle(im,(W//2,H//2-20),175,LIME,.32*cta)
        ov=Image.new("RGBA",im.size); od=ImageDraw.Draw(ov)
        draw_eye(ov,W//2,H//2-116,.52,cta,4)
        centered(od,"SEE WHAT MATTERS.",H//2-40,font(45),rgba(WHITE,cta))
        centered(od,"TRY RETINA TERMINAL",H//2+28,font(20,True),rgba(LIME,cta))
        # CTA pill
        od.rounded_rectangle((388,H//2+82,892,H//2+145),radius=32,fill=rgba(LIME,.96*cta))
        url="www.retinaos.xyz"
        bb=od.textbbox((0,0),url,font=font(25)); od.text(((W-(bb[2]-bb[0]))/2,H//2+99),url,font=font(25),fill=(4,7,5,int(255*cta)))
        im.alpha_composite(ov)

    im.convert("RGB").save(os.path.join(OUT,f"frame_{i:04d}.jpg"),quality=92,subsampling=0)

print(f"Rendered {FPS*SECONDS} frames to {OUT}")
