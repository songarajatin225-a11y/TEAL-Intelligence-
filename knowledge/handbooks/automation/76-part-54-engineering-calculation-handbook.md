---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 76
part_title: "Part 54 — Engineering calculation handbook"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 54 — Engineering calculation handbook

177 formulas used across this handbook, grouped by discipline, in SI units, each with a worked value from the chapter that develops it. Use them for quick sizing and checking; use the source part for assumptions, margins and limits.

How to use. Carry units through every step; apply safety factors once and visibly; record every input's source; have a second engineer check any calculation that sizes a safety, accuracy or cycle-time-critical item (Part 0).

### 54.1 Mechanical

| # | Quantity | Formula | Symbols (SI) | Worked value | Part |
|---|---|---|---|---|---|
| M1 | Force | F = m·a | m kg, a m/s² | 35 kg × 2.81 = 98 N | 12 |
| M2 | Weight | W = m·g | g = 9.81 m/s² | 35 kg → 343 N | 12 |
| M3 | Friction force | F_f = μ·N | μ friction coefficient, N normal force | 0.01 × 343 = 3.4 N | 12 |
| M4 | Torque | T = F·r | r m | 100 N × 0.05 m = 5 N·m | 8 |
| M5 | Rotary power | P = T·ω | ω rad/s | 0.62 N·m × 235.6 = 146 W | 12 |
| M6 | Linear power | P = F·v | v m/s | 110 N × 0.75 = 83 W | 12 |
| M7 | Normal stress | σ = F / A | A m² | 10 kN / 100 mm² = 100 MPa | 8 |
| M8 | Shear stress | τ = F / A | — | 5 kN / 50 mm² = 100 MPa | 8 |
| M9 | Bending stress | σ_b = M·c / I = M / Z | M N·m, c m, I m⁴, Z m³ | — | 8 |
| M10 | Torsional stress (solid shaft) | τ = 16·T / (π·d³) | d m | 25 N·m, 16 mm → 31 MPa | 8 |
| M11 | Equivalent stress | σ_v = √(σ² + 3τ²) | von Mises | — | 8 |
| M12 | Cantilever tip deflection | δ = F·L³ / (3·E·I) | E Pa, L m | — | 8 |
| M13 | Simply supported, centre load | δ = F·L³ / (48·E·I) | — | 294 N, 1.2 m → 6.0 µm | 8 |
| M14 | Simply supported, uniform load | δ = 5·w·L⁴ / (384·E·I) | w N/m | 220 N/m → 3.4 µm | 8 |
| M15 | Fixed–fixed, centre load | δ = F·L³ / (192·E·I) | — | — | 8 |
| M16 | Second moment, rectangular tube | I = [b·h³ − (b−2t)(h−2t)³] / 12 | b, h, t m | 150×100×6 → 8.85×10⁶ mm⁴ | 8 |
| M17 | Second moments, round | I = π·d⁴/64; J = π·d⁴/32 | — | d = 17.5 mm → I = 4.6×10⁻⁹ m⁴ | 12 |
| M18 | Natural frequency | f = (1/2π)·√(k / m_eff) | k N/m | 4.92×10⁷ N/m, 43 kg → 170 Hz | 8 |
| M19 | Thermal expansion | ΔL = α·L·ΔT | α 1/K | steel 1 m, 5 K → 60 µm | 8 |
| M20 | Rolling bearing life | L10 = (C/P)^p · 10⁶ rev; L10h = L10 / (60·n) | p = 3 ball, 10/3 roller | 14 kN, 1.2 kN, 1,500 min⁻¹ → 17,600 h | 8 |
| M21 | Linear guide life | L = (C / (f_w·P))³ · L_rated | L_rated 50 or 100 km | 35,100 km | 8 |
| M22 | Equivalent torque | T_e = √(M² + T²) | — | 15, 20 → 25 N·m | 8 |
| M23 | Shaft diameter | d = (16·T_e / (π·τ_allow))^(1/3) | τ_allow Pa | 14.7 mm → 16 mm | 8 |
| M24 | Torsional wind-up | θ = T·L / (G·J) | G Pa | — | 8 |
| M25 | Screw axial force | F_a = F_ext + μ·m·g + m·a | — | 0 + 3.4 + 98 + seal 8 ≈ 110 N | 12 |
| M26 | Screw drive torque | T = F·p / (2π·η) | p lead m, η ≈ 0.9 | 11.4 N, 20 mm → 0.040 N·m | 12 |
| M27 | Screw critical speed | n_c = 0.8·(60/2π)·(λ²/L²)·√(E·I / (ρ·A)) | λ = 3.927 fixed–supported | 7,230 min⁻¹ | 12 |
| M28 | Euler buckling | P_cr = π²·E·I / (K·L)² | K effective-length factor | — | 12 |
| M29 | Screw DN value | DN = d_mm · n | limit per catalogue | 20 × 2,250 = 45,000 | 12 |
| M30 | Ball screw life | L = (C_a / F_m)³ · 10⁶ rev | F_m mean axial load | — | 12 |
| M31 | Belt effective pull | F_e = T / r | r pulley pitch radius | — | 12 |
| M32 | Belt stretch | δ = F·L / (c_sp·b) | c_sp specific stiffness N per mm width, b width | — | 12 |
| M33 | Bolt preload | F ≈ T / (K·d) | K ≈ 0.15–0.2 | M8, 25 N·m → 15.6 kN | 35 |
| M34 | Sling leg tension | T = W / (n·sinθ) | θ from horizontal | 1.5 t, 2 legs, 60° → 8.5 kN | 39 |
| M35 | Drop deceleration | a ≈ g·h / s_stop | h drop height | 0.1 m, 5 mm → 196 m/s² | 39 |
| M36 | Squareness from diagonals | γ ≈ (d₁² − d₂²) / (4·a·b) | rad | 71 µrad | 36 |
| M37 | Sheet-metal bend allowance | BA = θ·(R + K·t) | K-factor 0.3–0.5 | 4.4 mm | 32 |

### 54.2 Tolerances and fixtures

| # | Quantity | Formula | Symbols | Worked value | Part |
|---|---|---|---|---|---|
| T1 | Worst-case stack | T_WC = Σ | t_i |  | t_i ± tolerances |
| T2 | RSS stack | T_RSS = √(Σ t_i²) | each ±3σ | ±0.040 mm | 9 |
| T3 | Mixed stack | T = Σ | t_sys | + √(Σ t_rand²) | systematic linear |
| T4 | Modified RSS | T = C_f·√(Σ t_i²) | C_f ≈ 1.5 | ±0.060 mm | 9 |
| T5 | Pin clearance shift | Δ = (D_max − d_min) / 2 | — | 0.0145 mm | 9 |
| T6 | Height-to-position error | Δxy = Δz·r / f | non-telecentric lens | 0.016 mm | 9 |
| T7 | Angular play | Δθ ≈ (Δ₁ + Δ₂) / L | — | 0.36 mrad | 10 |
| T8 | Diamond-pin land width | b ≤ c·D / (2·Δ) | c clearance, Δ centre mismatch | 1.2 mm | 10 |
| T9 | Clamp force | F ≥ SF·(F_p + m·a) / (μ·n) | SF 2–3 | 67 N | 10 |

### 54.3 Motion

| # | Quantity | Formula | Symbols | Worked value | Part |
|---|---|---|---|---|---|
| N1 | 1/3 trapezoid top speed | v = d / (t_m − t_a) | t_a = t_m/3 | 0.75 m/s | 12 |
| N2 | Acceleration | a = v / t_a | — | 2.81 m/s² | 12 |
| N3 | Triangular profile | a = 4·d / t²; v = a·t/2 | — | 2.5 m/s², 1.0 m/s | 4 |
| N4 | Angular acceleration (screw) | α = a·2π / p | — | 884 rad/s² | 12 |
| N5 | Motor speed (screw) | n = 60·v / p | min⁻¹ | 2,250 | 12 |
| N6 | Reflected load inertia (screw) | J_L = m·(p/2π)² | kg·m² | 3.55×10⁻⁴ | 12 |
| N7 | Screw inertia | J = π·ρ·L·d⁴ / 32 | — | 0.74×10⁻⁴ | 12 |
| N8 | Belt / rack reflected inertia | J_L = m·r² | — | — | 12 |
| N9 | Through a gearbox | J_motor = J_load / i²; T_motor = T_load / (i·η) | i ratio | — | 12 |
| N10 | Inertia-matching ratio | i_opt = √(J_L / J_m) | — | — | 12 |
| N11 | Acceleration torque | T_a = J_Σ·α | — | 0.533 N·m | 12 |
| N12 | Friction torque | T_f = (μmg + F_seal + F_ext)·p / (2πη) + T_pre | — | 0.090 N·m | 12 |
| N13 | RMS torque | T_RMS = √(Σ T_k²·t_k / t_cycle) | — | 0.173 N·m | 12 |
| N14 | Inertia ratio | R_J = (J_Σ − J_m) / J_m | — | 4.0 | 12 |
| N15 | Regenerative energy | E = ½·J·ω² − T_f·θ | J | 12.8 J | 12 |
| N16 | Bus capacitor absorption | E = ½·C·(V_r² − V_bus²) | C F | 10.9 J | 12 |
| N17 | Encoder resolution | res = p / (i·2^N) | N bits | 0.019 µm | 11 |
| N18 | Following error (P loop) | e = v / K_v | K_v s⁻¹ | 5 mm | 11 |
| N19 | Circular contour shrink | Δr = v² / (2·R·K_v²) | — | 0.4 mm | 13 |
| N20 | Timing position error | Δx = v·Δt | — | 0.5 mm at 1 ms | 13 |
| N21 | Synchronous speed | n = 120·f / p_poles | — | 1,500 min⁻¹ | 11 |
| N22 | Parallel-station cycle | CT = max(t_station) + t_transfer | — | 5.3 s | 4 |
| N23 | Robot CoG and wrist moment | r = Σm_i r_i / Σm_i; M = m·g·r | — | 96 mm, 2.8 N·m | 25 |
| N24 | Gripper force (friction) | F_jaw = m·(g + a)·S / (μ·n) | S 2–4 | 238 N | 26 |
| N25 | E-stop deceleration | a = v² / (2·s) | — | 14 m/s² | 26 |

### 54.4 Pneumatics and vacuum

| # | Quantity | Formula | Symbols | Worked value | Part |
|---|---|---|---|---|---|
| P1 | Extend force | F = p·A·η | p Pa gauge | ×20, 4 bar → 113 N | 14 |
| P2 | Retract force | F = p·(A − A_rod)·η | — | — | 14 |
| P3 | Load ratio | LR = F_load / (p·A) | ≤ 0.5–0.7 moving | 53% | 14 |
| P4 | Free air per double stroke | V = (A_e + A_r)·s·(p + p_atm)/p_atm | p_atm = 1.013 bar | 0.20 NL | 14 |
| P5 | Tube dead volume | V_t·(p + p_atm)/p_atm | — | 0.17 NL | 14 |
| P6 | Air flow for speed | Q = A·v·(p + p_atm)/p_atm | — | 26 NL/min | 14 |
| P7 | Cushioning energy | E = ½·m·v² | — | 0.24 J | 14 |
| P8 | Line pressure drop | Δp = f·(L/D)·ρ·v²/2 | Darcy friction f | — | 14 |
| P9 | Vacuum load case I | F = m·(g + a)·S | vertical lift | — | 15 |
| P10 | Vacuum load case II | F = m·(g + a/μ)·S | horizontal move | 119 N dry, 359 N oily | 15 |
| P11 | Vacuum load case III | F = (m/μ)·(g + a)·S | vertical face | — | 15 |
| P12 | Cup diameter | d = √(4·F / (π·Δp·n)) | — | 25 mm | 15 |
| P13 | Evacuation time | t = (V/Q)·ln(p₀/p₁) | absolute pressures | 0.14 s | 15 |
| P14 | Vacuum holding force | F = Δp·A_eff·η_seal | — | 1,350 N | 10 |
| P15 | Leak rate (pressure decay) | Q = V·Δp / Δt | 1 Pa·m³/s = 10 mbar·L/s | 1.3×10⁻² mbar·L/s | 30 |

### 54.5 Electrical, controls and networks

| # | Quantity | Formula | Symbols | Worked value | Part |
|---|---|---|---|---|---|
| E1 | Three-phase current | I = P / (√3·V·cosφ·η) or I = S / (√3·V) | V line-to-line | 4.32 kVA → 6.0 A | 16 |
| E2 | Single-phase current | I = P / (V·cosφ·η) | — | — | 16 |
| E3 | Demand load | S_d = Σ S_i·k_d,i | diversity factors | 4.32 kVA | 16 |
| E4 | Cable and protection | I_b ≤ I_n ≤ I_z·k_temp·k_group | — | 16 A on 4 mm² | 16 |
| E5 | Three-phase voltage drop | ΔV = √3·I·L·ρ / A | ρ ≈ 0.0225 Ω·mm²/m warm Cu | 4.7 V (1.1%) | 16 |
| E6 | DC voltage drop | ΔV = 2·I·L·ρ / A | — | 1.4 V | 16 |
| E7 | Earth-fault disconnection | Z_s·I_a ≤ U₀ | — | Z_s ≤ 1.44 Ω | 16 |
| E8 | 24 V supply | I ≥ 1.25·Σ I_i·k_i | — | 11.9 A → 20 A | 16 |
| E9 | Joule heating | P = I²·R | — | 200 A, 50 µΩ → 2 W | 30 |
| E10 | Panel heat balance | Q_cool = P_loss − k·A·(T_in − T_amb) | k ≈ 5.5 W/m²K | 592 W | 17 |
| E11 | Filter-fan flow | V = 3.1·Q / ΔT | m³/h | 79 m³/h | 17 |
| E12 | Load-cell output | U = S·U_exc·F/F_nom | S mV/V | 20 mV | 18 |
| E13 | 4–20 mA scaling | x = x_min + (I − 4)/16·(x_max − x_min) | mA | — | 18 |
| E14 | Sensor visibility | L/v ≥ t_sensor + t_filter + 2·t_scan | — | 5 ms flag missed at 10 ms scan | 18 |
| E15 | Inductive assured range | S_a ≤ 0.81·S_n·k_material | — | 2.6 mm on Al | 18 |
| E16 | PLC reaction time | t = t_in + 2·t_scan + t_out | — | — | 19 |
| E17 | EtherCAT frame time | t ≈ 8·(B_oh + ΣB)/R + N·t_fwd | R bit/s | 33 µs | 22 |
| E18 | Serial message time | t = n_char·b_frame / baud | — | 24 ms | 22 |
| E19 | Image bandwidth | BW = W·H·bits·fps | — | 800 Mbit/s | 22 |
| E20 | Data volume | D = N_tags·f·B·86,400 | — | 138 MB/day | 49 |

### 54.6 Machine performance, reliability and quality

| # | Quantity | Formula | Symbols | Worked value | Part |
|---|---|---|---|---|---|
| K1 | Planned time | T_plan = T_cal − T_breaks − T_PM − T_changeover | s | 79,200 s | 4 |
| K2 | Takt | T_takt = t_available / Q_demand | — | 7.92 s | 4 |
| K3 | Ideal cycle time | CT = T_plan·A·P·Q / N_good | — | 6.82 s | 4 |
| K4 | UPH | UPH = 3,600 / CT | — | 528 | 4 |
| K5 | OEE | OEE = A·P·Q | — | 86.1% | 4 |
| K6 | Availability | A = MTBF / (MTBF + MTTR) | — | 92% | 4 |
| K7 | Minimum stations | N = ⌈Σt_i / CT⌉ | — | 2 | 4 |
| K8 | Balance efficiency | η = Σt_i / (N·CT) | — | — | 4 |
| K9 | Machines | N = ⌈UPH_req / UPH_machine⌉ | — | — | 4 |
| K10 | Utilization | U = demand / capacity | — | 78% | 4 |
| K11 | Buffer | B = t_stop,max / T_takt | — | 38 parts | 4 |
| K12 | Little's law | WIP = TH·LT | — | — | 4 |
| K13 | Rolled throughput yield | RTY = Π FPY_i | — | 97.9% | 3 |
| K14 | Required starts | Q_start = Q_good / RTY | — | 10,215 | 3 |
| K15 | Series failure rate | λ = Σλ_i; MTBF = 1/λ | — | 0.348 /h | 7 |
| K16 | Weibull reliability | R(t) = exp(−(t/η)^β) | — | 85% at 8,000 h | 42 |
| K17 | Replacement age | t_R = η·(−ln R)^(1/β) | — | 6,500 h | 42 |
| K18 | Spares (Poisson) | P(X ≤ s) = Σ λ^k·e^−λ / k! | λ = N·t_LT / MTBF | 99.7% with 1 spare | 41 |
| K19 | OEE ramp model | OEE(t) = OEE_T − (OEE_T − OEE₀)·e^(−t/τ) | — | 83.2% at week 6 | 41 |
| K20 | Operators needed | N = UPH·t_manual / (3,600·η_op) | — | 3.53 | 1 |
| K21 | Lifting load | M = m_part·UPH | kg/h | 867 kg/h | 2 |
| K22 | Retry effect | CT_eff = CT + Σ p_k·t_retry,k | — | +0.024 s | 20 |
| Q1 | Process capability | Cp = (USL − LSL)/(6σ); Cpk = min(USL − μ, μ − LSL)/(3σ) | — | 1.67; 1.50 | 3 |
| Q2 | Cpk lower bound | Cpk_L ≈ Cpk − z·√(1/(9n) + Cpk²/(2(n−1))) | z = 1.645 | 1.24 at n = 50 | 38 |
| Q3 | Gauge R&R | %GRR = 6·σ_GRR / (USL − LSL) | — | 9.6% | 43 |
| Q4 | Distinct categories | ndc = 1.41·σ_part / σ_GRR | ≥ 5 | 8.8 | 43 |
| Q5 | X-bar chart limits | X̄̄ ± A₂·R̄ | A₂ = 0.577 (n = 5) | 49.6 ± 0.46 W | 43 |
| Q6 | DOE runs | N = 2^(k−p)·r + n_c | — | 35 | 3 |
| Q7 | Window margin | M_w = min(x_max − x, x − x_min) / (3σ_x) | ≥ 2 | 3.3 | 3 |
| Q8 | Verification cycles | n ≥ ln(1 − C) / ln(1 − p₀) | — | ≈ 3,000 | 37 |
| Q9 | Half-split tests | n = ⌈log₂ N⌉ | — | 6 for 64 | 37 |
| Q10 | FMEA risk number | RPN = S·O·D | severity first | 216 | 44 |

### 54.7 Laser, optics and vision

| # | Quantity | Formula | Symbols | Worked value | Part |
|---|---|---|---|---|---|
| L1 | Focused spot | d₀ = 4·M²·λ·f / (π·D) | — | 45 µm | 28 |
| L2 | Rayleigh range | z_R = π·w₀² / (M²·λ) | — | 1.1 mm | 28 |
| L3 | Scan field | L ≈ f·θ_opt | — | 175 mm | 28 |
| L4 | Pulse energy | E_p = P_avg / f_rep | — | 0.5 mJ | 28 |
| L5 | Peak power | P_peak ≈ E_p / τ | — | 5 kW | 28 |
| L6 | Fluence | F = E_p / (π·w₀²) | J/cm² | 32 J/cm² | 28 |
| L7 | Intensity | I = P / (π·w₀²) | — | 9.5×10⁴ W/mm² | 28 |
| L8 | Pulse overlap | O = 1 − v / (f_rep·d₀) | — | 56% | 28 |
| L9 | Line energy | HI = P / v | J/mm | 30 J/mm | 28 |
| L10 | Optical density | OD = log₁₀(H₀ / MPE) | MPE from IEC 60825-1 | — | 28 |
| L11 | Chiller capacity | Q ≥ 1.2·(P_el − P_opt + P_optics) | — | 5.5 kW | 28 |
| L12 | Hood flow | Q = v_c·(10·x² + A) | unflanged hood | 190 m³/h | 28 |
| L13 | Cooling-water flow | V = Q / (ρ·c_p·ΔT) | — | 15.8 L/min | 31 |
| L14 | Duct diameter | D = √(4·V / (π·v)) | — | 140 mm | 31 |
| V1 | Pixel size | p ≤ (T/10) / s_px | s_px sub-pixel | 0.04 mm | 24 |
| V2 | Magnification | m = S_sensor / FOV | — | 0.14 | 24 |
| V3 | Focal length | f ≈ WD·m / (1 + m) | — | 37 mm | 24 |
| V4 | Depth of field | DOF ≈ 2·N·c·(1 + m) / m² | — | 6.4 mm | 24 |
| V5 | Height scale error | e ≈ r·Δz / WD | — | 0.10 mm | 24 |
| V6 | Motion blur | b = v·t_exp | — | 25 µm | 13 |
| V7 | Code size | L = n_mod·x + 2·q | quiet zone q | 7.2 mm | 23 |
| V8 | Rotation to 2D angle | θ = atan2(ΔY, ΔX) − θ_nom | — | 7.0 mrad | 24 |

### 54.8 Safety, cost and project

| # | Quantity | Formula | Symbols | Worked value | Part |
|---|---|---|---|---|---|
| S1 | Safety distance (structure) | S = K·T + C | per current ISO 13855 | 350 mm (illustrative) | 27 |
| S2 | Device operations per year | n_op = d_op·h_op·3,600 / t_cycle | — | 48,000 | 27 |
| S3 | MTTF_D from B10_D | MTTF_D = B10_D / (0.1·n_op) | — | 417 years (capped) | 27 |
| S4 | Replacement interval | T10_D = B10_D / n_op | — | 42 years | 27 |
| S5 | Separation distance (simplified) | S_p ≥ v_h(T_r + T_s) + v_r·T_r + S_s + C + Z | — | 1.19 m | 25 |
| C1 | Price from margin | P = C / (1 − GM − w) | — | ₹92.7 lakh | 45 |
| C2 | Learning curve | C_n = C₁·n^(log₂ b) | b 0.8–0.9 | 325 h at n = 4 | 45 |
| C3 | Latest PO date | t_PO = t_need − (LT + transit + customs + IQC) | weeks | week −1 | 33 |
| C4 | Landed cost | C = P_FOB·FX·(1 + d + f + c) | — | ₹19.6 lakh | 33 |
| C5 | Total cost of ownership | TCO = P + landed + ppm·N·C_def + (1 − OTD)·C_late + service | — | ₹1,00,800 vs ₹98,000 | 34 |
| C6 | Payback | PB = capex / net annual saving | — | 1.56 years | 1 |
| C7 | Earned value | SPI = EV/PV; CPI = EV/AC; EAC = BAC/CPI | — | 0.85; 0.89; ₹69.4 lakh | 46 |
| C8 | Platform break-even | N = I_platform / ΔC_machine | — | ≈ 9 machines | 51 |
| C9 | Localization payback | PB = C_qual / ((C_imp − C_loc)·N) | — | 0.11 year | 52 |
| C10 | Value index | V = F / C | — | — | 52 |
| C11 | Cost of change by stage | C ≈ C₀·k^s | k ≈ 10 heuristic | — | 47 |
| C12 | Virtual-commissioning saving | S = d_saved·C_team/day − C_model | — | ₹9.6 lakh gross | 50 |
