"use client";

import Link from "next/link";
import { Eye, EyeOff, KeyRound, LockKeyhole, PawPrint, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { passwordSchema } from "@/lib/validation/auth";
import styles from "./sign-in.module.css";

const requirements = [
  ["12+ characters", (value: string) => value.length >= 12],
  ["Upper & lowercase", (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value)],
  ["Number", (value: string) => /\d/.test(value)],
  ["Symbol", (value: string) => /[^A-Za-z0-9]/.test(value)],
] as const;

export default function SignInPage() {
  const [create, setCreate] = useState(false);
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const validPassword = useMemo(() => passwordSchema.safeParse(password).success, [password]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!create) {
      setMessage("Connect Clerk to enable secure sign-in and MFA challenges.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password, acceptTerms: form.get("terms") === "on" }),
    });
    const data = await response.json();
    setMessage(response.ok ? "Secure profile validated. Identity-provider enrollment is next." : data.error);
  }

  return <main className={styles.page}>
    <section className={styles.story}>
      <Link href="/" className={styles.brand}><span><PawPrint /></span>Pawprint <small>FIELD NOTES</small></Link>
      <div><span className={styles.kicker}>A KINDER NEIGHBOURHOOD</span><h1>Every friendship starts with trust.</h1><p>Your sightings, walks, and companions deserve privacy designed in from the first pawprint.</p></div>
      <ul><li><ShieldCheck/>Approximate public locations</li><li><LockKeyhole/>Encrypted identity and sessions</li><li><KeyRound/>MFA for moderators and optional for everyone</li></ul>
    </section>
    <section className={styles.panel}>
      <div className={styles.card}>
        <span className={styles.kicker}>{create ? "CREATE YOUR FIELD GUIDE" : "WELCOME BACK"}</span>
        <h2>{create ? "Join the neighbourhood" : "Pick up where you left off"}</h2>
        <p>{create ? "Use a unique password. We will ask you to secure the account with an authenticator or passkey." : "Sign in securely to see your companions and field notes."}</p>
        <form onSubmit={submit} noValidate>
          <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com" /></label>
          <label>Password<div className={styles.password}><input name="password" type={show ? "text" : "password"} autoComplete={create ? "new-password" : "current-password"} value={password} onChange={(e)=>setPassword(e.target.value)} minLength={create ? 12 : 1} maxLength={128} required /><button type="button" onClick={()=>setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff/> : <Eye/>}</button></div></label>
          {create ? <><div className={styles.rules}>{requirements.map(([label,test])=><span className={test(password)?styles.pass:""} key={label}>✓ {label}</span>)}</div><label className={styles.check}><input name="terms" type="checkbox" required/>I accept the community safety and privacy rules.</label></> : <button className={styles.forgot} type="button">Forgot password?</button>}
          <button className={styles.submit} disabled={create && !validPassword}>{create ? "Create secure account" : "Continue securely"}</button>
          <div className={styles.mfa}><ShieldCheck/><span><b>MFA protected</b><small>Passkey, authenticator app, or recovery code</small></span></div>
          {message ? <p className={styles.notice} role="status">{message}</p> : null}
        </form>
        <button className={styles.switch} onClick={()=>{setCreate(!create);setMessage("")}}>{create ? "Already have an account? Sign in" : "New here? Create an account"}</button>
      </div>
    </section>
  </main>;
}
