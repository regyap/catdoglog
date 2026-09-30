from __future__ import annotations

from pathlib import Path
import time

import pandas as pd
import streamlit as st

from services.breed_classifier import OxfordPetsClassifier


ROOT = Path(__file__).resolve().parents[1]
MASCOT = ROOT / "public" / "assets" / "pawpals-duo.png"

st.set_page_config(
    page_title="Pawprint · Field Notes",
    page_icon="🐾",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Libre+Caslon+Display&display=swap');
    :root { --paper:#f8f1e3; --white:#fffdf7; --ink:#173b42; --coral:#e66c52; --teal:#3d8d88; --mint:#d8ece6; --line:#d9cdb9; }
    .stApp { background-color:var(--paper); background-image:radial-gradient(#c7bba6 0.7px,transparent .7px); background-size:18px 18px; color:var(--ink); }
    html, body, [class*="css"] { font-family:'DM Sans',sans-serif; }
    h1,h2,h3 { font-family:'Libre Caslon Display',Georgia,serif!important; color:var(--ink)!important; }
    h1 { font-size:clamp(2.7rem,5vw,5rem)!important; line-height:.98!important; letter-spacing:-.04em!important; }
    [data-testid="stSidebar"] { background:var(--white); border-right:1px solid var(--line); }
    [data-testid="stSidebar"] h1 { font-size:1.65rem!important; }
    .block-container { max-width:1400px; padding-top:2rem; }
    .hero,.paper { background:var(--white); border:1px solid var(--line); border-radius:10px; box-shadow:0 16px 40px rgba(65,53,35,.09); padding:clamp(1.5rem,4vw,3.8rem); }
    .hero { min-height:430px; display:flex; flex-direction:column; justify-content:center; }
    .kicker { color:var(--coral); font-size:.69rem; font-weight:800; letter-spacing:.16em; }
    .coral { color:var(--coral); font-style:italic; }
    .muted { color:#507078; line-height:1.7; }
    .tag { display:inline-block; background:var(--mint); padding:.35rem .65rem; border-radius:999px; font-size:.72rem; font-weight:700; margin:.18rem; }
    .stat { background:var(--white); border:1px solid var(--line); padding:1.2rem; border-radius:8px; min-height:120px; }
    .stat b { display:block; font:2rem 'Libre Caslon Display',Georgia; margin:.4rem 0; }
    .pet-note { background:#173b42; color:white; border-radius:10px; padding:2rem; min-height:250px; }
    .pet-note h2 { color:white!important; }
    .sighting { padding:1rem 0; border-bottom:1px dashed var(--line); }
    .sighting b { font:1.2rem 'Libre Caslon Display',Georgia; }
    .sighting small { color:#507078; }
    .safe { background:var(--mint); padding:1rem; border-radius:8px; font-size:.82rem; }
    .danger { background:#fae0d9; padding:1rem; border-radius:8px; font-size:.82rem; }
    div.stButton > button { border-radius:8px; min-height:44px; font-weight:800; border:1px solid #c9503c; }
    div.stButton > button[kind="primary"] { background:var(--coral); color:white; }
    .stProgress > div > div > div > div { background:var(--coral); }
    [data-testid="stMetric"] { background:var(--white); border:1px solid var(--line); border-radius:8px; padding:1rem; }
    </style>
    """,
    unsafe_allow_html=True,
)


PETS = [
    {"name": "Marmalade", "species": "Cat", "place": "Tiong Bahru Park", "distance": "120 m", "status": "Friendly", "lat": 1.2866, "lon": 103.8270},
    {"name": "Cloud", "species": "Dog", "place": "Eng Hoon Street", "distance": "350 m", "status": "Needs water", "lat": 1.2855, "lon": 103.8330},
    {"name": "Pepper", "species": "Cat", "place": "Kim Pong Park", "distance": "620 m", "status": "Shy", "lat": 1.2885, "lon": 103.8300},
]


@st.cache_resource(show_spinner=False)
def load_breed_classifier() -> OxfordPetsClassifier:
    return OxfordPetsClassifier()


def init_state() -> None:
    defaults = {"page": "Today", "fed": False, "walking": False, "captured": False, "preview_user": False}
    for key, value in defaults.items():
        st.session_state.setdefault(key, value)


def navigate(label: str) -> None:
    st.session_state.page = label
    st.rerun()


def sidebar() -> None:
    with st.sidebar:
        st.markdown("# 🐾 Pawprint")
        st.caption("NEIGHBOURHOOD FIELD NOTES")
        st.markdown("---")
        for icon, label in [("⌂", "Today"), ("⌖", "Nearby"), ("◉", "Capture"), ("♟", "Walk"), ("▤", "Journal"), ("♢", "Admin")]:
            if st.button(f"{icon}  {label}", use_container_width=True, type="primary" if st.session_state.page == label else "secondary"):
                navigate(label)
        st.markdown("---")
        if st.session_state.preview_user:
            st.success("Previewing as Regine · Admin")
            if st.button("Sign out", use_container_width=True):
                st.session_state.preview_user = False
                st.rerun()
        else:
            if st.button("🔐 Secure sign in", use_container_width=True):
                navigate("Sign in")
        st.caption("Help: regineyap1609@gmail.com")


def today() -> None:
    left, right = st.columns([1.08, .92], gap="large")
    with left:
        st.markdown('<div class="hero"><span class="kicker">SUNDAY · 27 SEPTEMBER</span><h1>Your neighbourhood<br><span class="coral">has stories to find.</span></h1><p class="muted">Spot, care for, and remember every cat and dog you meet—one gentle adventure at a time.</p></div>', unsafe_allow_html=True)
        a, b = st.columns(2)
        if a.button("📷 Log a sighting", type="primary", use_container_width=True): navigate("Capture")
        if b.button("⌖ Explore nearby", use_container_width=True): navigate("Nearby")
        st.caption("● 18 neighbours exploring now")
    with right:
        st.image(str(MASCOT), use_container_width=True)

    st.markdown("## Today’s care")
    care, quest = st.columns([1.2, .8], gap="large")
    with care:
        st.markdown('<div class="paper"><span class="kicker">YOUR LITTLE FAMILY</span><h2>Miso <span class="tag">Happy</span></h2><p class="muted">Orange tabby · your companion</p></div>', unsafe_allow_html=True)
        st.progress(.92 if st.session_state.fed else .78, text=f"Bond · {92 if st.session_state.fed else 78}%")
        c1, c2 = st.columns(2)
        if c1.button("✓ Fed! +5 bond" if st.session_state.fed else "🍽 Feed Miso", use_container_width=True):
            st.session_state.fed = not st.session_state.fed; st.rerun()
        if c2.button("🐾 Walk", use_container_width=True): navigate("Walk")
    with quest:
        st.markdown('<div class="paper"><span class="kicker">DAILY QUEST</span><h2>Take the scenic route</h2><p class="muted">Walk 2 km with Miso and discover one new place.</p><span class="tag">+40 bond</span><span class="tag">Mystery sticker</span></div>', unsafe_allow_html=True)
        st.progress(.62, text="1.24 / 2 km")

    st.markdown("## Recently spotted nearby")
    cols = st.columns(3)
    for col, pet in zip(cols, PETS):
        with col:
            st.markdown(f'<div class="stat"><span class="kicker">{pet["species"].upper()} · {pet["distance"]}</span><b>{pet["name"]}</b><small>{pet["place"]}</small><br><span class="tag">{pet["status"]}</span></div>', unsafe_allow_html=True)


def nearby() -> None:
    st.markdown('<span class="kicker">COMMUNITY SIGHTINGS</span><h1>Who’s nearby?</h1><p class="muted">Locations are softened to protect animals and finders.</p>', unsafe_allow_html=True)
    selected = st.segmented_control("Filter", ["All", "Cats", "Dogs", "Needs help"], default="All")
    frame = pd.DataFrame(PETS)
    st.map(frame, latitude="lat", longitude="lon", color="#e66c52", size=80, use_container_width=True)
    st.markdown('<div class="safe">🛡 Public map points are approximate. Exact coordinates should only be available to authorised welfare teams.</div>', unsafe_allow_html=True)
    for pet in PETS:
        if selected not in ("All", f'{pet["species"]}s') and not (selected == "Needs help" and "Needs" in pet["status"]): continue
        st.markdown(f'<div class="sighting"><b>{pet["name"]}</b> <span class="tag">{pet["status"]}</span><br><small>{pet["place"]} · {pet["distance"]}</small></div>', unsafe_allow_html=True)


def capture() -> None:
    st.markdown('<span class="kicker">NEW FIELD NOTE</span><h1>Meet someone new</h1><p class="muted">Keep a calm distance. Never chase or use flash.</p>', unsafe_allow_html=True)
    picture = st.camera_input("Gently frame their whole body")
    upload = st.file_uploader("Or choose a photo", type=["jpg", "jpeg", "png"])
    source = picture or upload
    if source:
        st.markdown("### Cat breed check")
        st.caption("This is visual breed estimation, not OCR and not proof of pedigree.")
        if st.button("✨ Analyse likely breed", type="primary", use_container_width=True):
            try:
                with st.spinner("Loading the vision model and comparing visual traits…"):
                    result = load_breed_classifier().classify(source.getvalue())
                for candidate in result.candidates:
                    st.progress(candidate.confidence, text=f"{candidate.breed} · {candidate.confidence:.1%}")
                (st.info if result.is_cat else st.warning)(result.verdict)
                st.caption("Coverage: 12 Oxford-IIIT cat breeds. Mixed and unlisted breeds may be misclassified.")
            except Exception as error:
                st.error(f"Breed analysis is unavailable: {error}")
    if source or st.session_state.captured:
        st.session_state.captured = True
        with st.spinner("Comparing coat, face, body shape, and nearby sightings…"):
            time.sleep(.4)
        st.markdown('<div class="paper"><span class="kicker">POSSIBLE MATCH · 86%</span><h2>Could this be Marmalade?</h2><p class="muted">Last seen 120 m away. Confirming avoids duplicate profiles and keeps the community trail accurate.</p><span class="tag">Coat · strong</span><span class="tag">Location · close</span><span class="tag">Face · likely</span></div>', unsafe_allow_html=True)
        no, yes = st.columns(2)
        if no.button("Not the same", use_container_width=True): st.session_state.captured = False; st.rerun()
        if yes.button("Yes, add sighting", type="primary", use_container_width=True): st.success("Marmalade’s trail is up to date!")


def walk() -> None:
    st.markdown('<span class="kicker">COMPANION WALK</span><h1>Wander together</h1><p class="muted">Your movement becomes joy, bond, and better wellbeing.</p>', unsafe_allow_html=True)
    one, two, three = st.columns(3)
    one.metric("Kilometres", "1.31" if st.session_state.walking else "1.24", "+0.07" if st.session_state.walking else None)
    two.metric("Active time", "24:18" if st.session_state.walking else "22:04")
    three.metric("Steps", "1,942" if st.session_state.walking else "1,826")
    if st.button("Pause walk" if st.session_state.walking else "Resume walk", type="primary", use_container_width=True):
        st.session_state.walking = not st.session_state.walking; st.rerun()
    st.markdown(f'<div class="pet-note"><h2>Miso is {"exploring!" if st.session_state.walking else "waiting for you"}</h2><p>{"Tail up, whiskers curious. This is the good stuff." if st.session_state.walking else "Ready when you are. Every little loop counts."}</p><blockquote>“We found a sunny bench and three excellent leaves.”</blockquote></div>', unsafe_allow_html=True)


def journal() -> None:
    st.markdown('<span class="kicker">YOUR LIVING FIELD GUIDE</span><h1>Companion journal</h1>', unsafe_allow_html=True)
    mode = st.segmented_control("Memory mode", ["2D care", "3D memory"], default="2D care")
    left, right = st.columns(2, gap="large")
    with left:
        st.image(str(MASCOT), use_container_width=True)
        st.caption("ROTATABLE 3D MEMORY — production viewer connects to GLB/glTF assets" if mode == "3D memory" else "LIVING COMPANION STICKER")
    with right:
        st.markdown('<div class="paper"><span class="kicker">COMPANION #008</span><h1>Miso</h1><p class="muted">Orange tabby · met 14 August 2026</p><p>Miso is brave near gardens, suspicious of bicycles, and deeply committed to sunny rectangles.</p><span class="tag">☀ Sun seeker</span><span class="tag">✦ Curious</span><span class="tag">♡ Gentle</span></div>', unsafe_allow_html=True)
        a,b,c=st.columns(3); a.metric("Memories","12"); b.metric("Distance","18.4 km"); c.metric("Bond","78%")


def admin() -> None:
    st.markdown('<span class="kicker">MODERATION DESK</span><h1>Community care console</h1>', unsafe_allow_html=True)
    if not st.session_state.preview_user:
        st.warning("Admin access requires an authenticated account with MFA. Preview mode is UI-only.")
        if st.button("Open secure sign in", type="primary"): navigate("Sign in")
        return
    a,b,c=st.columns(3); a.metric("Open reviews","24","8 high priority",delta_color="inverse"); b.metric("AI merge queue","17","92% confidence"); c.metric("Active sightings","1,284","+48 this week")
    st.dataframe(pd.DataFrame([
        ["AI MATCH","Marmalade ↔ Ginger","91% similar"],
        ["URGENT","Cloud","Reported by 3 neighbours"],
        ["PRIVACY","Pepper","Residential address visible"],
    ], columns=["Priority","Case","Signal"]), hide_index=True, use_container_width=True)


def sign_in() -> None:
    st.markdown('<span class="kicker">SECURE ACCESS</span><h1>Every friendship starts with trust.</h1><p class="muted">Production authentication is delegated to Clerk so Pawprint never stores passwords or MFA secrets.</p>', unsafe_allow_html=True)
    with st.form("login"):
        st.text_input("Email address", placeholder="regineyap1609@gmail.com")
        st.text_input("Password", type="password", help="Use 12+ characters with uppercase, lowercase, a number, and a symbol.")
        st.checkbox("Trust this device for 30 days")
        submitted = st.form_submit_button("Continue securely", type="primary", use_container_width=True)
    if submitted:
        st.info("Clerk credentials are not configured. Use preview mode to inspect the authenticated experience.")
    if st.button("Enter UI preview as Regine", use_container_width=True):
        st.session_state.preview_user = True; navigate("Today")
    st.markdown('<div class="safe">🛡 Production policy: passkey or authenticator-app MFA is mandatory for moderators and administrators.</div>', unsafe_allow_html=True)


init_state()
sidebar()
{"Today": today, "Nearby": nearby, "Capture": capture, "Walk": walk, "Journal": journal, "Admin": admin, "Sign in": sign_in}[st.session_state.page]()
